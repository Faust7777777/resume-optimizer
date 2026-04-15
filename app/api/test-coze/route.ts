import https from "node:https";
import { NextRequest, NextResponse } from "next/server";

// 直接测试 nativeHttpsPost 在 Next.js 环境下是否正常
export async function GET(req: NextRequest) {
  const fileId = req.nextUrl.searchParams.get("file_id");
  if (!fileId) {
    return NextResponse.json({ error: "需要 ?file_id=xxx" }, { status: 400 });
  }

  const TOKEN = process.env.COZE_API_TOKEN || process.env.COZE_API_KEY || "";
  if (!TOKEN) {
    return NextResponse.json({ error: "COZE_API_TOKEN 未配置" }, { status: 500 });
  }
  const body = JSON.stringify({
    workflow_id: "7608472336376283187",
    parameters: { input: JSON.stringify({ file_id: fileId, file_type: "image" }) },
    connector_id: "1024",
  });

  console.log("[TestRoute] Calling Coze workflow with file_id:", fileId);
  console.log("[TestRoute] Using node:https directly");
  const t0 = Date.now();

  try {
    const result = await new Promise<{ status: number; data: string }>((resolve, reject) => {
      const parsedUrl = new URL("https://api.coze.cn/v1/workflow/run");
      console.log("[TestRoute] Creating https.request to", parsedUrl.hostname, parsedUrl.pathname);

      const r = https.request(
        parsedUrl,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
          timeout: 180_000,
          rejectUnauthorized: false,
        },
        (res) => {
          console.log("[TestRoute] Got response headers, status:", res.statusCode);
          let data = "";
          res.on("data", (chunk: Buffer | string) => {
            data += chunk;
            console.log("[TestRoute] chunk received, total:", data.length);
          });
          res.on("end", () => {
            console.log("[TestRoute] Response complete, total bytes:", data.length);
            resolve({ status: res.statusCode || 0, data });
          });
        }
      );

      r.on("error", (err) => {
        console.log("[TestRoute] Error:", err.message);
        reject(err);
      });
      r.on("timeout", () => {
        console.log("[TestRoute] TIMEOUT after", ((Date.now() - t0) / 1000).toFixed(1) + "s");
        r.destroy();
        reject(new Error("TIMEOUT"));
      });
      r.on("socket", (socket) => {
        console.log("[TestRoute] Socket assigned");
        socket.on("connect", () => console.log("[TestRoute] Socket connected"));
      });

      r.write(body);
      r.end();
      console.log("[TestRoute] Request sent, waiting...");
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[TestRoute] Success in ${elapsed}s`);
    return NextResponse.json({
      elapsed: elapsed + "s",
      status: result.status,
      data: result.data.slice(0, 500),
    });
  } catch (e) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`[TestRoute] Failed in ${elapsed}s: ${msg}`);
    return NextResponse.json({ elapsed: elapsed + "s", error: msg }, { status: 500 });
  }
}
