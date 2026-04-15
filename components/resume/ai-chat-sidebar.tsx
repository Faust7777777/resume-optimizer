"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Wand2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ArrowDownToLine,
  Loader2,
  X,
} from "lucide-react";
// ArrowDownToLine still used in QUICK_ACTIONS icon
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeStore } from "@/store/resume-store";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

/* ─────────────── Types ─────────────── */
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

/* ─────────────── Quick Actions ─────────────── */
const QUICK_ACTIONS = [
  { label: "STAR润色", icon: Wand2, prompt: (text: string) => `请用STAR法则重写以下简历内容，直接输出重写结果，不要多余解释：\n\n${text}` },
  { label: "精简表达", icon: ArrowDownToLine, prompt: (text: string) => `请将以下简历内容精简为更有力的表达，保留核心信息和数据，直接输出结果：\n\n${text}` },
  { label: "量化补充", icon: Sparkles, prompt: (text: string) => `以下简历内容缺少量化数据，请帮我补充合理的数据占位符（用[具体数据]标注需要填写的地方），直接输出结果：\n\n${text}` },
];

/* ─────────────── Component ─────────────── */
export function AIChatSidebar({ className }: { className?: string }) {
  const {
    selectedText,
    setSelectedText,
  } = useResumeStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 发送消息到 Coze Bot
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content.trim(), conversationId }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json();
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

            // 跟踪 SSE event 类型
            if (trimmed.startsWith("event:")) {
              lastEventType = trimmed.slice(6).trim();
              continue;
            }

            if (!trimmed.startsWith("data:")) continue;

            const dataStr = trimmed.slice(5).trim();
            if (!dataStr || dataStr === "[DONE]") continue;

            try {
              const data = JSON.parse(dataStr);

              // 提取 conversation_id
              if (data.conversation_id && !conversationId) {
                setConversationId(data.conversation_id);
              }

              // 只处理 delta 增量事件，跳过 completed（完整内容会重复）
              if (
                lastEventType === "conversation.message.delta" &&
                data.type === "answer" &&
                data.content
              ) {
                fullContent += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: fullContent }
                      : m
                  )
                );
              }
            } catch {
              // 非JSON，跳过
            }
          }
        }

        // 标记流结束
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: fullContent || "（Bot 未返回内容）", isStreaming: false }
              : m
          )
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "（已取消）", isStreaming: false }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `❌ ${err instanceof Error ? err.message : "请求失败"}`,
                    isStreaming: false,
                  }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [isLoading, conversationId]
  );

  // 停止生成
  const handleStop = () => {
    abortRef.current?.abort();
  };

  // 复制消息
  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };



  // 快捷操作
  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    const text = selectedText || "";
    if (!text) {
      setInput("请选中编辑器中的文字后再使用此功能");
      return;
    }
    sendMessage(action.prompt(text));
  };

  // 新对话
  const handleReset = () => {
    setMessages([]);
    setConversationId(undefined);
    setInput("");
  };

  // Ctrl+Enter 发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background border-l border-border ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI 润色助手</h3>
            <p className="text-[11px] text-muted-foreground">选中文字后可快捷润色</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} title="新对话">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Selected text indicator */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                  已选中 {selectedText.length} 字
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-blue-400"
                  onClick={() => setSelectedText("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 line-clamp-2">
                {selectedText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-border overflow-x-auto">
        {QUICK_ACTIONS.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="text-xs h-7 px-2.5 shrink-0 gap-1"
            onClick={() => handleQuickAction(action)}
            disabled={isLoading || !selectedText}
          >
            <action.icon className="h-3 w-3" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium mb-1">AI 简历润色助手</p>
            <p className="text-xs leading-relaxed">
              选中编辑器内文字，点击快捷按钮
              <br />
              或直接输入问题开始对话
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:my-1.5">
                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                      {msg.content || (msg.isStreaming ? "思考中..." : "")}
                    </ReactMarkdown>
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                )}

                {/* Action buttons for assistant messages */}
                {msg.role === "assistant" && !msg.isStreaming && msg.content && !msg.content.startsWith("❌") && !msg.content.startsWith("（") && (
                  <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(msg.id, msg.content)}
                    >
                      {copiedId === msg.id ? (
                        <><Check className="h-3 w-3" /> 已复制</>
                      ) : (
                        <><Copy className="h-3 w-3" /> 复制</>
                      )}
                    </Button>

                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center mt-0.5">
                  <User className="h-3.5 w-3.5 text-foreground/70" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-3">
        {isLoading && (
          <div className="flex justify-center mb-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={handleStop}>
              <X className="h-3 w-3" />
              停止生成
            </Button>
          </div>
        )}
        <div className="relative">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题，或选中文字后点击快捷按钮..."
            className="resize-none pr-10 min-h-[60px] max-h-[120px] text-sm"
            rows={2}
            disabled={isLoading}
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2 h-7 w-7"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-center">
          Ctrl+Enter 发送
        </p>
      </div>
    </div>
  );
}
