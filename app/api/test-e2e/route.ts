import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 150;

// 与主路由完全一致的 nativeUploadFile
function nativeUploadFile(
  url: string,
  token: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const boundary = "----FormBoundary" + Date.now() + Math.random().toString(36).slice(2);
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;

    const req = lib.request(
      parsedUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
        },
        timeout: 60_000,
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer | string) => { data += chunk; });
        res.on("end", () => { resolve({ status: res.statusCode || 0, data }); });
      }
    );
    req.on("error", (err) => reject(new Error(`Upload failed: ${err.message}`)));
    req.on("timeout", () => { req.destroy(); reject(new Error("Upload timeout")); });
    req.write(body);
    req.end();
  });
}

// 与主路由完全一致的 nativeHttpsPost
function nativeHttpsPost(
  url: string,
  options: { headers: Record<string, string>; body: string; timeout?: number }
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;

    const req = lib.request(
      parsedUrl,
      {
        method: "POST",
        headers: options.headers,
        timeout: options.timeout || 120_000,
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer | string) => { data += chunk; });
        res.on("end", () => { resolve({ status: res.statusCode || 0, data }); });
      }
    );
    req.on("error", (err) => reject(new Error(`HTTPS failed: ${err.message}`)));
    req.on("timeout", () => { req.destroy(); reject(new Error("TIMEOUT")); });
    req.write(options.body);
    req.end();
  });
}

export async function GET() {
  const TOKEN = process.env.COZE_API_TOKEN || "";
  const WORKFLOW_ID = "7608472336376283187";

  if (!TOKEN) {
    return NextResponse.json({ error: "COZE_API_TOKEN 未配置" }, { status: 500 });
  }

  // 1. 读取 mupdf 生成的 PNG（与主路由 mupdf 转出的完全相同的文件）
  const pngPath = path.join(process.cwd(), "test-pdf-output.png");
  if (!fs.existsSync(pngPath)) {
    return NextResponse.json({ error: "test-pdf-output.png not found" }, { status: 500 });
  }
  const pngBuf = fs.readFileSync(pngPath);
  console.log("[E2E] PNG size:", pngBuf.length);

  // 2. 用 nativeUploadFile 上传（与主路由一致）
  console.log("[E2E] Uploading via nativeUploadFile...");
  const t0 = Date.now();
  const upResult = await nativeUploadFile(
    "https://api.coze.cn/v1/files/upload",
    TOKEN,
    pngBuf as Buffer,
    "resume.png",
    "image/png"
  );
  const upData = JSON.parse(upResult.data);
  const fileId = upData?.data?.id || upData?.data?.file_id;
  console.log("[E2E] Upload done in", Date.now() - t0, "ms, file_id:", fileId);

  if (!fileId) {
    return NextResponse.json({ error: "Upload failed", raw: upResult.data }, { status: 500 });
  }

  // 3. 用 nativeHttpsPost 调用工作流（与主路由一致）
  const requestBody = JSON.stringify({
    workflow_id: WORKFLOW_ID,
    parameters: { input: JSON.stringify({ file_id: fileId, file_type: "image" }) },
    connector_id: "1024",
  });

  console.log("[E2E] Calling workflow, file_id:", fileId);
  const t1 = Date.now();
  try {
    const wfResult = await nativeHttpsPost("https://api.coze.cn/v1/workflow/run", {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
      timeout: 120_000,
    });
    const elapsed = ((Date.now() - t1) / 1000).toFixed(1);
    console.log(`[E2E] Workflow done in ${elapsed}s`);
    return NextResponse.json({
      elapsed: elapsed + "s",
      fileId,
      status: wfResult.status,
      data: wfResult.data.slice(0, 600),
    });
  } catch (e) {
    const elapsed = ((Date.now() - t1) / 1000).toFixed(1);
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[E2E] Workflow failed in ${elapsed}s: ${msg}`);
    return NextResponse.json({ elapsed: elapsed + "s", fileId, error: msg }, { status: 500 });
  }
}
