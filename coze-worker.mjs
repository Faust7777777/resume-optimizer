#!/usr/bin/env node
/**
 * coze-worker.mjs — 独立 Node.js 进程执行 Coze 上传 + 工作流调用
 * 
 * 使用流式 API (stream_run) 替代同步 API：
 * - 流式返回 SSE 事件，PING 事件每 ~30s 保持连接存活
 * - 避免 Clash 代理/NAT 超时断开长连接
 * - 实测 90s 内可靠完成
 *
 * 用法：node coze-worker.mjs <png文件路径> [workflow_id] [token] [apiBase] [fileParam]
 * 输出（stdout）：JSON { "ok": true, "data": ... } 或 { "ok": false, "error": "..." }
 */
import https from 'https';
import fs from 'fs';

const pngPath = process.argv[2];
const workflowId = process.argv[3] || '7608472336376283187';
const token = process.argv[4] || process.env.COZE_API_TOKEN || '';
const apiBase = process.argv[5] || 'https://api.coze.cn';
const fileParamName = process.argv[6] || 'input';
const jdText = process.argv[7] || '';

const t0 = Date.now();
function log(msg) { process.stderr.write(`[coze-worker] [${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}\n`); }

function fail(msg) {
  process.stdout.write(JSON.stringify({ ok: false, error: String(msg) }));
  process.exit(1);
}

if (!pngPath || !fs.existsSync(pngPath)) {
  fail(`文件不存在: ${pngPath}`);
}

// ========== 以下代码完全复制自 test-from-png.mjs（已验证成功） ==========

function nativeUploadFile(url, tokenStr, fileBuffer, fileName, mimeType) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now() + Math.random().toString(36).slice(2);
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    const parsedUrl = new URL(url);
    const req = https.request(parsedUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenStr}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      timeout: 60_000,
      rejectUnauthorized: false,
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => { resolve({ status: res.statusCode, data }); });
    });
    req.on('error', e => reject(e));
    req.on('timeout', () => { req.destroy(); reject(new Error('Upload timeout')); });
    req.write(body);
    req.end();
  });
}

function streamWorkflowRun(url, requestBody, tokenStr, timeoutMs) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.request(parsedUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenStr}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      timeout: timeoutMs,
      rejectUnauthorized: false,
    }, (res) => {
      log(`Response status: ${res.statusCode}`);
      let messageContent = null;
      let errorMsg = null;
      let sseBuffer = ''; // 缓冲区：正确处理跨 chunk 的 SSE 事件

      res.on('data', (chunk) => {
        sseBuffer += chunk.toString();

        // SSE 事件以双换行分隔，只处理完整的事件
        const parts = sseBuffer.split('\n\n');
        // 最后一部分可能不完整，保留在缓冲区
        sseBuffer = parts.pop() || '';

        for (const eventBlock of parts) {
          if (!eventBlock.trim()) continue;

          let eventType = '';
          let dataStr = '';
          const lines = eventBlock.split('\n');
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataStr = line.slice(5).trim();
            }
          }

          if (!dataStr) continue;

          try {
            const eventData = JSON.parse(dataStr);
            if (eventType === 'Message' && eventData.content) {
              messageContent = eventData.content;
              log(`Message received (${messageContent.length} chars)`);
            } else if (eventType === 'Error' || eventData.error_code) {
              errorMsg = eventData.error_message || eventData.msg || JSON.stringify(eventData);
              log(`Error event: ${errorMsg}`);
            } else if (eventType === 'PING') {
              log('PING (keep-alive)');
            } else if (eventType === 'Done') {
              log('Done event received');
            }
          } catch {
            // JSON 解析失败 — data 行可能不包含 JSON
            log(`SSE parse skip (event: ${eventType}): ${dataStr.slice(0, 100)}`);
          }
        }
      });

      res.on('end', () => {
        // 处理缓冲区中剩余的最后一个事件
        if (sseBuffer.trim()) {
          let eventType = '';
          let dataStr = '';
          const lines = sseBuffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('event:')) eventType = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr = line.slice(5).trim();
          }
          if (dataStr) {
            try {
              const eventData = JSON.parse(dataStr);
              if (eventType === 'Message' && eventData.content && !messageContent) {
                messageContent = eventData.content;
                log(`Message received from buffer (${messageContent.length} chars)`);
              }
            } catch { /* ignore */ }
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
        } else if (errorMsg) {
          reject(new Error(`Workflow error: ${errorMsg}`));
        } else if (messageContent) {
          resolve(messageContent);
        } else {
          reject(new Error(`No message in stream response`));
        }
      });
    });
    req.on('error', e => reject(e));
    req.on('timeout', () => {
      log('SOCKET TIMEOUT');
      req.destroy();
      reject(new Error('Workflow stream timeout'));
    });
    req.on('socket', (socket) => {
      log('Socket assigned');
    });
    req.write(requestBody);
    req.end();
    log('Stream request sent...');
  });
}

// ========== 主逻辑（带重试） ==========

const MAX_RETRIES = 2;
const WF_TIMEOUT = 210_000; // 单次工作流超时 3.5 分钟

try {
  // Step 1: Read PNG + base64 round-trip
  const pngBuffer = fs.readFileSync(pngPath);
  const base64 = pngBuffer.toString('base64');
  const fileBuffer = Buffer.from(base64, 'base64');
  log(`PNG: ${fileBuffer.length} bytes`);

  let lastError = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log(`--- Attempt ${attempt}/${MAX_RETRIES} ---`);

      // Step 2: Upload (每次重试都重新上传，确保 file_id 新鲜)
      const uploadResult = await nativeUploadFile(
        `${apiBase}/v1/files/upload`, token, fileBuffer, 'resume.png', 'image/png'
      );
      const uploadJson = JSON.parse(uploadResult.data);
      if (uploadResult.status !== 200 || uploadJson.code !== 0) {
        throw new Error(`Upload failed: ${uploadJson.msg || 'HTTP ' + uploadResult.status}`);
      }
      const fileId = uploadJson.data?.file_id || uploadJson.data?.id;
      if (!fileId) throw new Error('Upload OK but no file_id');
      log(`Upload OK, file_id: ${fileId}`);

      // Step 3: Workflow call (流式 API)
      const wfParams = { [fileParamName]: JSON.stringify({ file_id: fileId, file_type: 'image' }) };
      if (jdText) wfParams['JD'] = jdText;
      const requestBody = JSON.stringify({
        workflow_id: workflowId,
        parameters: wfParams,
        connector_id: '1024',
      });

      const messageContent = await streamWorkflowRun(
        `${apiBase}/v1/workflow/stream_run`,
        requestBody,
        token,
        WF_TIMEOUT,
      );

      log(`Workflow done! Content length: ${messageContent.length}`);

      // messageContent 可能是 JSON 字符串，尝试解析
      let outputData;
      try {
        outputData = JSON.parse(messageContent);
      } catch {
        outputData = messageContent;
      }

      // 成功 → 输出结果到 stdout
      process.stdout.write(JSON.stringify({ ok: true, data: outputData }));
      process.exit(0);
    } catch (retryErr) {
      lastError = retryErr.message || String(retryErr);
      log(`Attempt ${attempt} failed: ${lastError}`);
      if (attempt < MAX_RETRIES) {
        log('Waiting 5s before retry...');
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  // 所有重试都失败
  fail(`All ${MAX_RETRIES} attempts failed. Last error: ${lastError}`);
} catch (err) {
  fail(err.message || String(err));
}
