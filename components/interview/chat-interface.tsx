"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, User, Bot, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const INTERVIEW_BOT_ID = "7610658462813110318";

type InterviewType = "technical" | "behavioral" | "mixed";

interface InterviewConfig {
  position: string;
  type: InterviewType;
  duration: number;
}

interface Message {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  config: InterviewConfig;
  onReport?: (markdown: string) => void;
}

export function ChatInterface({ config, onReport }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isStarted = messages.length > 0;

  const callChatStream = useCallback(async (
    message: string,
    onDelta: (text: string) => void,
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversationId,
        botId: INTERVIEW_BOT_ID,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `请求失败: ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("无法读取响应流");

    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";
    let lastEventType = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("event:")) {
          lastEventType = trimmed.slice(6).trim();
          continue;
        }

        if (!trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") continue;

        try {
          const data = JSON.parse(dataStr);
          if (data.conversation_id && !conversationId) {
            setConversationId(data.conversation_id);
          }

          if (
            lastEventType === "conversation.message.delta" &&
            data.type === "answer" &&
            data.content
          ) {
            fullContent += data.content;
            onDelta(fullContent);
          }
        } catch {
          // ignore non-json chunks
        }
      }
    }

    return fullContent;
  }, [conversationId]);

  useEffect(() => {
    if (isStarted) return;

    const typeMap: Record<InterviewType, string> = {
      technical: "技术面试",
      behavioral: "行为面试",
      mixed: "综合面试",
    };

    const startPayload = {
      action: "start_interview",
      config: {
        target_position: config.position,
        interview_type: typeMap[config.type],
        duration: `${config.duration}分钟`,
      },
    };

    const assistantId = `assistant-start-${Date.now()}`;
    setIsThinking(true);
    setMessages([
      {
        id: assistantId,
        role: "interviewer",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    callChatStream(
      JSON.stringify(startPayload, null, 2),
      (text) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
        );
      }
    )
      .then((finalText) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: finalText || "（未返回内容）", isStreaming: false }
              : m
          )
        );
      })
      .catch((err) => {
        toast.error("启动面试失败: " + (err instanceof Error ? err.message : "未知错误"));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "❌ 启动失败，请重试", isStreaming: false }
              : m
          )
        );
      })
      .finally(() => {
        setIsThinking(false);
        abortRef.current = null;
      });
  }, [callChatStream, config.duration, config.position, config.type, isStarted]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userText = inputValue.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "candidate",
      content: userText,
      timestamp: new Date(),
    };

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: assistantId,
        role: "interviewer",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    setInputValue("");
    setIsThinking(true);

    try {
      const finalText = await callChatStream(userText, (text) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: text } : m))
        );
      });

      const normalizedText = finalText || "（未返回内容）";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: normalizedText, isStreaming: false }
            : m
        )
      );

      if (/面试评估报告|综合评分|维度分析/.test(normalizedText)) {
        onReport?.(normalizedText);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "（已停止生成）", isStreaming: false }
              : m
          )
        );
      } else {
        toast.error("发送失败: " + (err instanceof Error ? err.message : "未知错误"));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "❌ 回答生成失败，请重试", isStreaming: false }
              : m
          )
        );
      }
    } finally {
      setIsThinking(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const interviewTypeLabel: Record<InterviewType, string> = {
    technical: "技术面试",
    behavioral: "行为面试",
    mixed: "综合面试",
  };

  return (
    <Card className="h-[calc(100vh-16rem)] min-h-[400px] flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              面试对话
            </CardTitle>
            <CardDescription>
              {interviewTypeLabel[config.type]} · 预计 {config.duration} 分钟
            </CardDescription>
          </div>
          <Badge variant="outline">{config.position}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col p-0">
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "candidate" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "interviewer"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.role === "interviewer" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "interviewer"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.isStreaming && (
                    <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </div>
              </div>
            ))}
            {isThinking && messages.length === 0 && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">准备中...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="shrink-0 p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="输入您的回答..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
            />
            {isThinking ? (
              <Button variant="outline" onClick={handleStop}>
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
