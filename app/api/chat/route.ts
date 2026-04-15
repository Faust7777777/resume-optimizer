import { NextRequest } from "next/server";

/**
 * /api/chat — 代理 Coze Bot 对话 API（流式 SSE）
 *
 * 前端 POST { message, conversationId? }
 * 后端转发到 Coze /v3/chat，以 SSE 流式返回给前端
 */

const COZE_TOKEN = process.env.COZE_API_TOKEN || "";
const COZE_BOT_ID = process.env.COZE_CHAT_DEFAULT_BOT_ID || "";
const COZE_API_BASE = process.env.COZE_API_BASE_URL || "https://api.coze.cn";

export const maxDuration = 120; // 2 分钟上限

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, botId } = body as {
      message: string;
      conversationId?: string;
      botId?: string;
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "消息不能为空" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (botId && !/^\d+$/.test(botId)) {
      return new Response(JSON.stringify({ error: "botId 格式不合法" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!COZE_TOKEN) {
      return new Response(JSON.stringify({ error: "COZE_API_TOKEN 未配置" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetBotId = botId || COZE_BOT_ID;
    if (!targetBotId) {
      return new Response(JSON.stringify({ error: "缺少可用的 botId 配置" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 构建 Coze Chat 请求体
    const chatBody: Record<string, unknown> = {
      bot_id: targetBotId,
      user_id: "resume-optimizer-user",
      stream: true,
      auto_save_history: true,
      additional_messages: [
        {
          role: "user",
          content: message,
          content_type: "text",
        },
      ],
    };

    if (conversationId) {
      chatBody.conversation_id = conversationId;
    }

    // 调用 Coze /v3/chat 流式接口
    const cozeRes = await fetch(`${COZE_API_BASE}/v3/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${COZE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatBody),
    });

    if (!cozeRes.ok) {
      const errText = await cozeRes.text();
      console.error("[chat] Coze API error:", cozeRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Coze API 错误: ${cozeRes.status}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!cozeRes.body) {
      return new Response(
        JSON.stringify({ error: "Coze 未返回流" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // 透传 SSE 流，同时解析内容转发给前端
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = cozeRes.body!.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();

              if (trimmed.startsWith("event:")) {
                const eventType = trimmed.slice(6).trim();
                // 转发事件类型
                controller.enqueue(encoder.encode(`event: ${eventType}\n`));
                continue;
              }

              if (trimmed.startsWith("data:")) {
                const dataStr = trimmed.slice(5).trim();
                if (!dataStr || dataStr === "[DONE]") {
                  controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
                  continue;
                }

                try {
                  const data = JSON.parse(dataStr);
                  // 转发给前端
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                  );
                } catch {
                  // 非 JSON，原样转发
                  controller.enqueue(encoder.encode(`data: ${dataStr}\n\n`));
                }
                continue;
              }

              // 空行作为 SSE 分隔
              if (!trimmed) {
                controller.enqueue(encoder.encode("\n"));
              }
            }
          }
        } catch (err) {
          console.error("[chat] Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[chat] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "未知错误",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
