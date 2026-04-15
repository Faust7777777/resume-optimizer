import { NextRequest, NextResponse } from "next/server";
import path from "path";
import https from "node:https";
import http from "node:http";
import { execFile } from "node:child_process";
import { writeFileSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

// Next.js Route Segment Config — 允许 API 路由最长执行 5 分钟
export const maxDuration = 300;

// 带超时的 fetch 包装（用于上传等短时请求）
function fetchWithTimeout(
  url: string | URL,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 120_000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // 合并外部 signal
  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener("abort", () => controller.abort());
  }

  return fetch(url, { ...fetchOptions, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  );
}

/**
 * 原生 HTTPS POST 请求 — 完全绕过 Next.js 对 fetch 的运行时补丁。
 * 用于 Coze 工作流等长耗时 API 调用，避免 Next.js dev server 中 fetch 挂起的问题。
 */
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
        // 允许自签名证书（与 NODE_TLS_REJECT_UNAUTHORIZED=0 一致）
        rejectUnauthorized: false,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer | string) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, data });
        });
      }
    );

    req.on("error", (err) => {
      reject(new Error(`HTTPS request failed: ${err.message}`));
    });
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("请求超时，Coze 工作流未在规定时间内返回结果，请稍后重试"));
    });

    req.write(options.body);
    req.end();
  });
}

// AI 服务配置
interface AIServiceConfig {
  provider: "openai" | "anthropic" | "baidu" | "alibaba" | "deepseek" | "zhipu" | "kimi" | "coze" | "mock";
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

// 从环境变量获取配置
function getConfig(): AIServiceConfig {
  const provider = (process.env.AI_PROVIDER || "mock") as AIServiceConfig["provider"];

  switch (provider) {
    case "openai":
      return {
        provider,
        apiKey: process.env.OPENAI_API_KEY || "",
        baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        model: process.env.OPENAI_MODEL || "gpt-4",
      };
    case "anthropic":
      return {
        provider,
        apiKey: process.env.ANTHROPIC_API_KEY || "",
        baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1",
        model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
      };
    case "baidu":
      return {
        provider,
        apiKey: process.env.BAIDU_API_KEY || "",
        baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat",
        model: process.env.BAIDU_MODEL || "ernie-bot-4",
      };
    case "alibaba":
      return {
        provider,
        apiKey: process.env.ALIBABA_API_KEY || "",
        baseUrl: "https://dashscope.aliyuncs.com/api/v1",
        model: process.env.ALIBABA_MODEL || "qwen-max",
      };
    case "deepseek":
      return {
        provider,
        apiKey: process.env.DEEPSEEK_API_KEY || "",
        baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      };
    case "zhipu":
      return {
        provider,
        apiKey: process.env.ZHIPU_API_KEY || "",
        baseUrl: "https://open.bigmodel.cn/api/paas/v4",
        model: process.env.ZHIPU_MODEL || "glm-4",
      };
    case "kimi":
      return {
        provider,
        apiKey: process.env.KIMI_API_KEY || "",
        baseUrl: process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1",
        model: process.env.KIMI_MODEL || "moonshot-v1-8k",
      };
    case "coze":
      return {
        provider,
        apiKey: process.env.COZE_API_TOKEN || "",
        baseUrl: process.env.COZE_WORKFLOW_URL || "http://127.0.0.1:5000/run",
      };
    case "mock":
      return {
        provider,
        apiKey: "",
      };
    default:
      throw new Error(`不支持的AI提供商: ${provider}`);
  }
}

// 统一的 AI 调用函数
async function callAI(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const config = getConfig();

  if (config.provider === "mock") {
    return JSON.stringify({ message: "mock response", prompt });
  }

  if (config.provider === "openai" || config.provider === "deepseek" || config.provider === "kimi") {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  if (config.provider === "anthropic") {
    const response = await fetch(`${config.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: options?.maxTokens ?? 2000,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  if (config.provider === "alibaba") {
    const response = await fetch(`${config.baseUrl}/services/aigc/text-generation/generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        input: {
          messages: [{ role: "user", content: prompt }],
        },
        parameters: {
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.output.text;
  }

  if (config.provider === "zhipu") {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  if (config.provider === "baidu") {
    // 百度需要获取 access_token
    const tokenResponse = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${config.apiKey}&client_secret=${process.env.BAIDU_SECRET_KEY}`,
      { method: "POST" }
    );
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const response = await fetch(
      `${config.baseUrl}/${config.model}?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2000,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.result;
  }

  throw new Error(`不支持的AI提供商: ${config.provider}`);
}

interface CozeWorkflowResult {
  reasoning_content?: string;
  improved_resume?: string;
  analysis?: {
    problems_identified?: string[];
    improvements_made?: string[];
    detailed_analysis?: string;
  };
}

interface UploadedResumeFile {
  name: string;
  type?: string;
  base64: string;
}

/**
 * 【最高规范】Coze 文件引用 —— 每次调用工作流必须使用本次新上传的 file_id。
 * Coze 文件存在有效期限制，复用旧 file_id 会导致工作流无限挂起（HTTP 000 / 超时）。
 * 绝对禁止缓存、复用、持久化 file_id。
 */
interface CozeUploadedFileRef {
  fileId: string;
  url?: string;
  /** 上传时间戳 (ms)，用于校验是否为本次请求新上传 */
  uploadedAt: number;
}

function decodeBase64Utf8(base64: string): string {
  return Buffer.from(base64, "base64").toString("utf-8");
}

function isTextLikeUpload(file: UploadedResumeFile): boolean {
  const ext = path.extname(file.name || "").toLowerCase();
  const textExts = new Set([".txt", ".md", ".markdown", ".csv", ".json", ".yml", ".yaml"]);
  return (file.type || "").startsWith("text/") || textExts.has(ext);
}

async function extractResumeTextFromFile(file: UploadedResumeFile): Promise<string> {
  if (isTextLikeUpload(file)) {
    return decodeBase64Utf8(file.base64).trim();
  }

  const ext = path.extname(file.name || "").toLowerCase();
  const buffer = Buffer.from(file.base64, "base64");

  if (ext === ".docx" || (file.type || "").includes("wordprocessingml.document")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (ext === ".pdf" || file.type === "application/pdf") {
    const pdfParseModule = await import("pdf-parse/lib/pdf-parse.js");
    const pdfParse = pdfParseModule.default as unknown as (dataBuffer: Buffer) => Promise<{ text?: string }>;
    const result = await pdfParse(buffer);
    return (result.text || "").trim();
  }

  throw new Error("暂不支持该文件类型，请上传 PDF、DOCX 或文本文件。");
}

const COZE_API_BASE = process.env.COZE_API_BASE_URL || "https://api.coze.cn";

/**
 * 将纯文本渲染为 PNG 图片（用于 Coze OCR 工作流）。
 * 使用 Sharp 的 SVG 文本渲染，无需额外字体依赖。
 */
async function textToImage(text: string): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  const lines = text.split("\n");
  const fontSize = 18;
  const lineHeight = 28;
  const padding = 40;
  const width = 900;
  const height = Math.max(200, padding * 2 + lines.length * lineHeight + 20);

  const svgLines = lines
    .map((line, i) => {
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      const y = padding + i * lineHeight + fontSize;
      return `<text x="${padding}" y="${y}" font-size="${fontSize}" font-family="SimSun, SimHei, sans-serif" fill="#000">${escaped}</text>`;
    })
    .join("\n");

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="white"/>
    ${svgLines}
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer() as Promise<Buffer>;
}

/**
 * 原生 HTTPS multipart 上传 — 与成功测试完全一致的上传方式。
 * 避免 Next.js fetch 补丁 + FormData 可能导致文件内容异常。
 */
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
    req.on("timeout", () => { req.destroy(); reject(new Error("文件上传超时")); });
    req.write(body);
    req.end();
  });
}

async function uploadFileToCoze(file: UploadedResumeFile): Promise<CozeUploadedFileRef> {
  const config = getConfig();

  if (config.provider !== "coze") {
    throw new Error("当前未启用 Coze 工作流");
  }

  if (!config.apiKey) {
    throw new Error("COZE_API_TOKEN 未配置");
  }

  const fileExt = path.extname(file.name || "") || ".bin";
  const fileName = file.name || `resume${fileExt}`;
  const fileBuffer = Buffer.from(file.base64, "base64");
  const mimeType = file.type || "application/octet-stream";

  // 使用原生 HTTPS multipart 上传（与成功测试一致，避免 Next.js fetch 补丁问题）
  const uploadResult = await nativeUploadFile(
    `${COZE_API_BASE}/v1/files/upload`,
    config.apiKey,
    fileBuffer,
    fileName,
    mimeType
  );

  const result = JSON.parse(uploadResult.data);
  if (uploadResult.status !== 200 || result.code !== 0) {
    throw new Error(
      `Coze 文件上传失败: ${result?.msg || `HTTP ${uploadResult.status}`}（请确认 token 已开启 uploadFile 权限）`
    );
  }

  const fileId =
    result?.data?.file_id ||
    result?.data?.id ||
    result?.data?.file?.file_id ||
    result?.data?.file?.id;

  const fileUrl =
    result?.data?.url ||
    result?.data?.file?.url;

  if (!fileId) {
    throw new Error("Coze 文件上传成功但未返回 file_id");
  }

  return {
    fileId: String(fileId),
    url: fileUrl ? String(fileUrl) : undefined,
    uploadedAt: Date.now(),
  };
}

function parseCozeWorkflowData(data: unknown): CozeWorkflowResult {
  if (!data) {
    return {};
  }

  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // 优先取 reasoning_content（新工作流返回字段）
    if (typeof obj.reasoning_content === "string") {
      return { reasoning_content: obj.reasoning_content };
    }
    if (typeof obj.improved_resume === "string") {
      return {
        improved_resume: obj.improved_resume,
        analysis: (obj.analysis as CozeWorkflowResult["analysis"]) || {},
      };
    }
    if (typeof obj.output === "string") {
      try {
        return parseCozeWorkflowData(JSON.parse(obj.output));
      } catch {
        return { reasoning_content: obj.output };
      }
    }
  }

  if (typeof data === "string") {
    try {
      return parseCozeWorkflowData(JSON.parse(data));
    } catch {
      return { reasoning_content: data };
    }
  }

  return {};
}

/**
 * 通过独立子进程调用 Coze 工作流 — 完全脱离 Next.js 运行时。
 * Next.js 运行时会干扰 node:https 长连接，导致工作流调用永远超时。
 * 独立 Node.js 进程中完全正常（实测 68s 成功）。
 */
function callCozeViaWorker(pngFilePath: string, jd = ""): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(process.cwd(), 'coze-worker.mjs');
    const config = getConfig();
    const workflowId = process.env.COZE_WORKFLOW_ID || '7608472336376283187';
    const token = config.apiKey;
    const apiBase = process.env.COZE_API_BASE_URL || 'https://api.coze.cn';
    const fileParam = process.env.COZE_WORKFLOW_FILE_PARAM || 'input';

    console.log('[Coze] 启动子进程 coze-worker.mjs, PNG:', pngFilePath, 'JD长度:', jd.length);

    const child = execFile(
      process.execPath, // 使用当前 Node.js 可执行文件
      [workerPath, pngFilePath, workflowId, token, apiBase, fileParam, jd],
      {
        timeout: 500_000, // ~8.3 分钟（worker 内部 2 次重试 × 210s + 缓冲）
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: '0' },
      },
      (error, stdout, stderr) => {
        if (stderr) {
          console.log('[Coze Worker]', stderr.trim());
        }
        if (error) {
          if (error.killed) {
            reject(new Error('Coze 工作流子进程超时被终止'));
          } else {
            // 尝试从 stdout 解析错误信息
            try {
              const result = JSON.parse(stdout);
              if (!result.ok) {
                reject(new Error(result.error || '子进程返回失败'));
                return;
              }
            } catch { /* ignore */ }
            reject(new Error(`子进程异常: ${error.message}`));
          }
          return;
        }
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch {
          reject(new Error(`子进程输出解析失败: ${stdout.slice(0, 200)}`));
        }
      }
    );
  });
}

async function runCozeWorkflow(
  targetPosition: string,
  options: { resumeContent?: string; resumeFile?: UploadedResumeFile }
): Promise<CozeWorkflowResult> {
  const config = getConfig();
  if (config.provider !== "coze") {
    throw new Error("当前未启用 Coze 工作流");
  }

  const workflowId = process.env.COZE_WORKFLOW_ID;
  const directRunUrl = process.env.COZE_WORKFLOW_URL;

  // ---- 准备 PNG 文件，写入临时目录 ----
  let pngBuffer: Buffer;

  if (options.resumeFile) {
    const mimeType = (options.resumeFile.type || "").toLowerCase();
    const isImage = mimeType.startsWith("image/");

    if (isImage) {
      console.log("[Coze] 图片文件，直接使用:", options.resumeFile.name);
      pngBuffer = Buffer.from(options.resumeFile.base64, "base64");
    } else {
      // 非图片：先尝试提取文本
      console.log("[Coze] 非图片文件，先提取文本:", options.resumeFile.name, mimeType);
      let extractedText = "";
      try {
        extractedText = await extractResumeTextFromFile(options.resumeFile);
      } catch (e) {
        console.log("[Coze] extractResumeTextFromFile 异常:", e instanceof Error ? e.message : String(e));
      }

      if (extractedText) {
        console.log("[Coze] 文本提取成功，渲染为 PNG, 长度:", extractedText.length);
        pngBuffer = await textToImage(extractedText);
      } else {
        // 图片型 PDF → mupdf 渲染
        console.log("[Coze] 文本提取为空，尝试 mupdf 将 PDF 渲染为 PNG...");
        try {
          const mupdf = await import("mupdf");
          const fileBuffer = Buffer.from(options.resumeFile.base64, "base64");
          const doc = mupdf.Document.openDocument(fileBuffer, "application/pdf");
          const pageCount = doc.countPages();
          console.log("[Coze] PDF 页数:", pageCount);
          if (pageCount === 0) throw new Error("PDF 没有可渲染的页面");
          const page = doc.loadPage(0);
          const pixmap = page.toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, false, true);
          const pngData = pixmap.asPNG();
          pngBuffer = Buffer.from(pngData);
          console.log("[Coze] mupdf PDF→PNG 成功, 大小:", pngBuffer.length, "bytes,", pixmap.getWidth(), "x", pixmap.getHeight());
        } catch (mupdfErr) {
          console.log("[Coze] mupdf 转 PNG 失败:", mupdfErr instanceof Error ? mupdfErr.message : String(mupdfErr));
          // 兜底：直接用原始文件
          pngBuffer = Buffer.from(options.resumeFile.base64, "base64");
        }
      }
    }
  } else if (options.resumeContent) {
    const normalized = options.resumeContent.trim();
    if (!normalized) throw new Error("简历内容不能为空");
    const directMaxChars = Number(process.env.COZE_DIRECT_MAX_CHARS || 12000);
    const truncated = normalized.slice(0, directMaxChars);
    console.log("[Coze] 将文本内容渲染为PNG图片, 文本长度:", truncated.length);
    pngBuffer = await textToImage(truncated);
    console.log("[Coze] PNG图片生成完成, 大小:", pngBuffer.length, "bytes");
  } else {
    throw new Error("请上传简历文件或输入简历内容");
  }

  // ---- 写入临时文件，通过子进程调用 Coze ----
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'coze-'));
  const tmpPng = path.join(tmpDir, 'resume.png');
  writeFileSync(tmpPng, pngBuffer);
  console.log("[Coze] PNG 已写入临时文件:", tmpPng, "大小:", pngBuffer.length);

  try {
    const workerResult = await callCozeViaWorker(tmpPng, targetPosition);

    if (!workerResult.ok) {
      throw new Error(workerResult.error || '子进程返回失败');
    }

    console.log("[Coze] 子进程成功返回结果");
    return parseCozeWorkflowData(workerResult.data);
  } finally {
    // 清理临时文件
    try { unlinkSync(tmpPng); } catch { /* ignore */ }
    try { unlinkSync(tmpDir); } catch { /* ignore */ }
  }
}

async function callCozeWorkflow(
  targetPosition: string,
  options: { resumeContent?: string; resumeFile?: UploadedResumeFile }
): Promise<CozeWorkflowResult> {
  return runCozeWorkflow(targetPosition, options);
}

/**
 * 从 reasoning_content 原始 Markdown 中按标题拆分为 4 步结构。
 * 用正则匹配 Step / 步骤 标题，兼容多种格式。
 */
function parseStepsFromMarkdown(raw: string) {
  const steps: {
    jdAnalysis?: string;
    diagnosis?: string;
    reconstruction?: string;
    moduleOptimization?: string;
    scoring?: string;
  } = {};

  // 匹配各类可能的步骤标题
  const stepPatterns: { key: keyof typeof steps; patterns: RegExp[] }[] = [
    {
      key: "jdAnalysis",
      patterns: [
        /#{1,4}\s*(?:Step\s*1|步骤\s*1)[:\s：]*(.+?)(?=\n)/i,
        /#{1,4}\s*(?:岗位核心痛点|JD\s*拆解|核心胜任力)/i,
      ],
    },
    {
      key: "diagnosis",
      patterns: [
        /#{1,4}\s*(?:Step\s*2|步骤\s*2)[:\s：]*(.+?)(?=\n)/i,
        /#{1,4}\s*(?:简历全科诊断|痛点直击|匹配度评分)/i,
      ],
    },
    {
      key: "reconstruction",
      patterns: [
        /#{1,4}\s*(?:Step\s*3|步骤\s*3)[:\s：]*(.+?)(?=\n)/i,
        /#{1,4}\s*(?:逐条重构|精修|核心交付)/i,
      ],
    },
    {
      key: "moduleOptimization",
      patterns: [
        /#{1,4}\s*(?:Step\s*4|步骤\s*4)[:\s：]*(.+?)(?=\n)/i,
        /#{1,4}\s*(?:模块优化|高阶建议|排版建议)/i,
      ],
    },
    {
      key: "scoring",
      patterns: [
        /#{1,4}\s*(?:Step\s*5|步骤\s*5)[:\s：]*(.+?)(?=\n)/i,
        /#{1,4}\s*(?:多维量化评分|简历评分|量化评分|综合评分)/i,
      ],
    },
  ];

  // 收集所有步骤标题的位置
  type StepMatch = { key: keyof typeof steps; index: number; headerEnd: number };
  const matches: StepMatch[] = [];

  for (const { key, patterns } of stepPatterns) {
    for (const pattern of patterns) {
      const m = raw.match(pattern);
      if (m && m.index !== undefined) {
        // headerEnd = 标题行结束位置
        const lineEnd = raw.indexOf("\n", m.index);
        matches.push({
          key,
          index: m.index,
          headerEnd: lineEnd === -1 ? m.index + m[0].length : lineEnd + 1,
        });
        break; // 匹配到第一个就停
      }
    }
  }

  // 按位置排序
  matches.sort((a, b) => a.index - b.index);

  // 提取每步内容
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    steps[matches[i].key] = raw.slice(start, end).trim();
  }

  return steps;
}

/**
 * 从文本中提取匹配度百分比（如"匹配度评分：68%"或"当前匹配度约 55%"）
 */
function extractMatchScore(text: string): number | undefined {
  const m = text.match(/匹配度[^\d]*?(\d{1,3})\s*%/);
  if (m) return Math.min(100, Math.max(0, parseInt(m[1], 10)));
  return undefined;
}

/**
 * 从 Step 5 评分表中提取真实分数。
 * 兼容 Markdown 表格和"维度：XX分"两种格式。
 * 返回 null 表示无法解析，调用方应 fallback。
 */
function extractScoresFromTable(text: string): {
  completeness: number;
  relevance: number;
  professionalism: number;
  layout: number;
  overall: number;
} | null {
  if (!text) return null;

  const dimensionMap: Record<string, string> = {
    "完整度": "completeness",
    "完整性": "completeness",
    "信息完整": "completeness",
    "相关性": "relevance",
    "相关度": "relevance",
    "岗位匹配": "relevance",
    "匹配度": "relevance",
    "专业性": "professionalism",
    "专业度": "professionalism",
    "专业表达": "professionalism",
    "排版规范": "layout",
    "排版": "layout",
    "格式规范": "layout",
    "综合评分": "overall",
    "综合": "overall",
    "总分": "overall",
    "总评": "overall",
  };

  const scores: Record<string, number> = {};

  // 策略1: Markdown 表格行 — | 维度 | 分数 | ... |
  const tableRowRegex = /\|\s*([^|]+?)\s*\|\s*(\d{1,3})\s*(?:分)?\s*\|/g;
  let match;
  while ((match = tableRowRegex.exec(text)) !== null) {
    const label = match[1].trim();
    const score = parseInt(match[2], 10);
    if (score < 0 || score > 100) continue;
    for (const [keyword, key] of Object.entries(dimensionMap)) {
      if (label.includes(keyword)) {
        scores[key] = score;
        break;
      }
    }
  }

  // 策略2: "维度：XX分" 或 "维度: XX" 形式
  if (Object.keys(scores).length < 4) {
    const lineRegex = /([\u4e00-\u9fa5]+)[：:\s]*?(\d{1,3})\s*分?/g;
    while ((match = lineRegex.exec(text)) !== null) {
      const label = match[1].trim();
      const score = parseInt(match[2], 10);
      if (score < 0 || score > 100) continue;
      for (const [keyword, key] of Object.entries(dimensionMap)) {
        if (label.includes(keyword) && !(key in scores)) {
          scores[key] = score;
          break;
        }
      }
    }
  }

  const c = scores["completeness"];
  const r = scores["relevance"];
  const p = scores["professionalism"];
  const l = scores["layout"];

  // 至少需要 4 个维度分数才算有效
  if (c == null || r == null || p == null || l == null) return null;

  // 综合评分：优先使用 AI 给出的，否则按权重公式计算
  const overall = scores["overall"] ?? Math.round(c * 0.2 + r * 0.35 + p * 0.3 + l * 0.15);

  return {
    completeness: Math.min(100, Math.max(0, c)),
    relevance: Math.min(100, Math.max(0, r)),
    professionalism: Math.min(100, Math.max(0, p)),
    layout: Math.min(100, Math.max(0, l)),
    overall: Math.min(100, Math.max(0, overall)),
  };
}

function mapCozeToDiagnosisResult(result: CozeWorkflowResult) {
  // 新工作流返回 reasoning_content（纯文本/Markdown 分析结果）
  const rawText = result.reasoning_content || result.improved_resume || "";
  const summary = rawText.slice(0, 200).replace(/[#*\-\n]+/g, " ").trim()
    || "已基于 Coze 工作流完成简历分析与改进建议。";

  // 尝试拆分为 4 步
  const steps = parseStepsFromMarkdown(rawText);
  const hasSteps = Object.values(steps).some(Boolean);

  // 从 Step 2 提取匹配度评分
  const matchScore = steps.diagnosis ? extractMatchScore(steps.diagnosis) : extractMatchScore(rawText);

  // 旧版 suggestions 保留兼容
  const problems = result.analysis?.problems_identified ?? [];
  const improvements = result.analysis?.improvements_made ?? [];
  type Suggestion = { id: string; category: string; priority: string; title: string; description: string; action: string };
  let suggestions: Suggestion[];
  if (problems.length > 0 || improvements.length > 0) {
    suggestions = [...problems, ...improvements]
      .slice(0, 6)
      .map((item, index) => ({
        id: `${index + 1}`,
        category: "professionalism",
        priority: index < 2 ? "high" : index < 4 ? "medium" : "low",
        title: item.slice(0, 40) || `建议 ${index + 1}`,
        description: item,
        action: "前往编辑器应用优化",
      }));
  } else {
    suggestions = [];
  }

  // 优先从 Step 5 评分表提取真实分数
  const parsedScores = extractScoresFromTable(steps.scoring || "") || extractScoresFromTable(rawText);

  const scores = parsedScores ?? {
    // fallback: 基于匹配度推算（仅当 AI 未输出评分表时）
    completeness: Math.min(100, (matchScore ?? 75) + Math.round(Math.random() * 6 - 3)),
    relevance: matchScore ?? 75,
    professionalism: Math.min(100, (matchScore ?? 75) + Math.round(Math.random() * 8 - 2)),
    layout: Math.min(100, (matchScore ?? 75) + Math.round(Math.random() * 10 - 5)),
    overall: matchScore ?? 75,
  };

  return {
    scores,
    suggestions,
    summary,
    rawAnalysis: rawText,
    steps: hasSteps ? steps : undefined,
    matchScore,
  };
}

// POST 处理器
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const provider = (process.env.AI_PROVIDER || "mock") as AIServiceConfig["provider"];

    if (provider === "coze" && (action === "diagnose" || action === "polish")) {
      const sourceText = action === "diagnose" ? params.resumeContent : params.text;
      const resumeFile =
        action === "diagnose" && params.resumeFile && typeof params.resumeFile === "object"
          ? (params.resumeFile as UploadedResumeFile)
          : undefined;

      if (!resumeFile && (!sourceText || typeof sourceText !== "string" || !sourceText.trim())) {
        return NextResponse.json({ error: "简历内容不能为空" }, { status: 400 });
      }

      const targetPosition =
        (typeof params.targetPosition === "string" && params.targetPosition) ||
        (typeof params.job_description === "string" && params.job_description) ||
        "";

      const workflowResult = await callCozeWorkflow(targetPosition, {
        resumeContent: typeof sourceText === "string" ? sourceText : "",
        resumeFile,
      });

      if (action === "polish") {
        return NextResponse.json({ result: workflowResult.reasoning_content || workflowResult.improved_resume || (typeof sourceText === "string" ? sourceText : "") });
      }

      const diagnosisResult = mapCozeToDiagnosisResult(workflowResult);
      return NextResponse.json({ result: JSON.stringify(diagnosisResult) });
    }

    let prompt = "";

    switch (action) {
      case "diagnose":
        prompt = generateDiagnosePrompt(params.resumeContent);
        break;
      case "analyzeJD":
        prompt = generateJDPrompt(params.resumeContent, params.jdText);
        break;
      case "polish":
        prompt = generatePolishPrompt(params.text);
        break;
      case "generateQuestions":
        prompt = generateQuestionsPrompt(params.resumeContent, params.jdText, params.position);
        break;
      case "evaluateAnswer":
        prompt = generateEvaluatePrompt(params.question, params.answer);
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const response = await callAI(prompt, {
      temperature: action === "generateQuestions" ? 0.7 : 0.3,
      maxTokens: 2000,
    });

    return NextResponse.json({ result: response });
  } catch (error) {
    console.error("AI API Error:", error);
    let message = "Unknown error";
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        message = "请求超时，Coze 工作流未在规定时间内返回结果，请稍后重试";
      } else if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
        message = "网络连接失败，请检查网络或代理设置后重试";
      } else {
        message = error.message;
      }
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

// Prompt 生成函数
function generateDiagnosePrompt(resumeContent: string): string {
  return `你是一位专业的简历顾问。请分析以下简历内容，从四个维度进行评分并给出建议：

简历内容：
${resumeContent}

请按以下JSON格式返回：
{
  "scores": {
    "completeness": 0-100,
    "relevance": 0-100,
    "professionalism": 0-100,
    "layout": 0-100,
    "overall": 0-100
  },
  "suggestions": [
    {
      "id": "1",
      "category": "completeness|relevance|professionalism|layout",
      "priority": "high|medium|low",
      "title": "问题标题",
      "description": "详细描述",
      "action": "建议操作"
    }
  ],
  "summary": "总体评价"
}

注意：
1. 分数要客观准确
2. 建议要具体可操作
3. 返回必须是合法的JSON格式
4. 不要包含任何其他文字，只返回JSON`;
}

function generateJDPrompt(resumeContent: string, jdText: string): string {
  return `你是一位HR专家。请分析以下简历和职位描述的匹配度：

简历内容：
${resumeContent}

职位描述(JD)：
${jdText}

请按以下JSON格式返回：
{
  "keywords": ["关键词1", "关键词2"],
  "matchedKeywords": ["匹配的关键词"],
  "missingKeywords": ["缺失的关键词"],
  "suggestions": [
    {
      "type": "add|modify|highlight",
      "content": "建议内容",
      "reason": "原因说明"
    }
  ]
}

注意：
1. 关键词要准确提取
2. 建议要具体可操作
3. 返回必须是合法的JSON格式
4. 不要包含任何其他文字，只返回JSON`;
}

function generatePolishPrompt(text: string): string {
  return `你是一位专业的简历顾问。请将以下工作经历描述转换为STAR法则格式：

原始描述：
${text}

要求：
1. S (Situation): 项目背景
2. T (Task): 你的任务/职责
3. A (Action): 采取的行动
4. R (Result): 取得的成果（必须包含量化数据）

请直接返回润色后的文本，使用Markdown格式标注STAR各部分。`;
}

function generateQuestionsPrompt(
  resumeContent: string,
  jdText?: string,
  position?: string
): string {
  return `你是一位资深面试官。请根据以下简历和职位信息生成面试题目：

简历内容：
${resumeContent}

${jdText ? `职位描述：\n${jdText}\n` : ""}
${position ? `目标岗位：${position}\n` : ""}

请生成4-6道面试题，包含技术题、行为题、场景题。

按以下JSON格式返回：
[
  {
    "id": "1",
    "type": "technical|behavioral|scenario",
    "question": "面试题目",
    "context": "出题依据或考察点"
  }
]

注意：
1. 题目要针对简历内容个性化定制
2. 返回必须是合法的JSON格式
3. 不要包含任何其他文字，只返回JSON`;
}

function generateEvaluatePrompt(question: string, answer: string): string {
  return `你是一位面试官。请评估以下面试回答：

面试题目：${question}

候选人回答：
${answer}

请按以下JSON格式返回：
{
  "score": 0-100,
  "feedback": "详细评价和建议"
}

评分标准：
- 90-100: 回答优秀，逻辑清晰，内容充实
- 70-89: 回答良好，但有提升空间
- 50-69: 回答一般，需要补充细节
- 0-49: 回答较差，需要重新组织

注意：
1. 返回必须是合法的JSON格式
2. 不要包含任何其他文字，只返回JSON`;
}
