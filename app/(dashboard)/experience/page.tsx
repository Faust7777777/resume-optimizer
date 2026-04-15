"use client";

import { useState, useRef, useCallback } from "react";
import {
  Sparkles, Copy, Check, Plus, X, Briefcase, Wand2,
  Search, FileText, ExternalLink, ChevronRight, Loader2,
  BookOpen, GraduationCap, Building2, Lightbulb, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

/* ─────────── Types ─────────── */
interface ReferenceCard {
  id: string;
  title: string;
  summary: string;
  type: "article" | "interview" | "case" | "other";
  selected: boolean;
}

interface GeneratedExperience {
  id: string;
  content: string;
  isStreaming: boolean;
}

/* ─────────── Constants ─────────── */
const REFERENCE_TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  article: { label: "行业文章", icon: BookOpen, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400" },
  interview: { label: "面经访谈", icon: GraduationCap, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400" },
  case: { label: "岗位案例", icon: Building2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" },
  other: { label: "参考资料", icon: FileText, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400" },
};

const suggestedKeywords = [
  "项目管理", "数据分析", "用户增长", "产品设计",
  "技术架构", "团队协作", "性能优化", "需求分析",
  "市场调研", "用户运营", "内容策划", "流程优化",
];

const EXPERIENCE_REFERENCE_BOT_ID = "7610373222844448804";

/* ─────────── Helpers ─────────── */
/** 从 Bot 回复中解析参考卡片 */
function parseReferenceCards(text: string): ReferenceCard[] {
  const cards: ReferenceCard[] = [];
  // 匹配编号段落: "1. **标题** \n 摘要" 或 "### 1. 标题 \n 摘要"
  const blocks = text.split(/\n(?=(?:\d+[.、]|\#{1,4}\s*\d+))/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // 提取标题
    const titleMatch = trimmed.match(/^(?:\#{1,4}\s*)?(?:\d+[.、]\s*)(?:\*{1,2})?(.+?)(?:\*{1,2})?\s*$/m);
    if (!titleMatch) continue;

    const title = titleMatch[1].replace(/\*+/g, "").trim();
    const restLines = trimmed.split("\n").slice(1).join("\n").trim();
    const summary = restLines.replace(/^[>\-\s]+/gm, "").trim();

    if (!title || !summary) continue;

    // 判断类型
    let type: ReferenceCard["type"] = "other";
    if (/面经|面试|访谈|经验分享/.test(title + summary)) type = "interview";
    else if (/案例|实习|实践|项目/.test(title + summary)) type = "case";
    else if (/文章|报告|趋势|行业|分析/.test(title + summary)) type = "article";

    cards.push({
      id: `ref-${cards.length}-${Date.now()}`,
      title,
      summary: summary.slice(0, 200),
      type,
      selected: false,
    });
  }

  return cards;
}

/* ─────────── Component ─────────── */
export default function ExperiencePage() {
  // Step 1: 参考搜索
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [references, setReferences] = useState<ReferenceCard[]>([]);
  const [searchConversationId, setSearchConversationId] = useState<string | undefined>();

  // Step 2: 经验生成
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [experience, setExperience] = useState<GeneratedExperience | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Step tracking
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const abortRef = useRef<AbortController | null>(null);

  const selectedRefs = references.filter((r) => r.selected);

  /* ── 通用 SSE 调用 ── */
  const callChatStream = useCallback(async (
    message: string,
    conversationId: string | undefined,
    onDelta: (text: string) => void,
    onConversationId?: (id: string) => void,
    botId?: string,
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId, botId }),
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
    let full = "";
    let lastEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();

        // 跟踪 SSE event 类型，区分 delta 与 completed
        if (trimmed.startsWith("event:")) {
          lastEvent = trimmed.slice(6).trim();
          continue;
        }

        if (!trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") continue;

        try {
          const data = JSON.parse(dataStr);
          if (data.conversation_id && onConversationId) {
            onConversationId(data.conversation_id);
          }
          // 只处理 delta 增量事件，跳过 completed（完整重复）
          if (
            lastEvent === "conversation.message.delta" &&
            data.type === "answer" &&
            data.content
          ) {
            full += data.content;
            onDelta(full);
          }
        } catch { /* skip */ }
      }
    }

    return full;
  }, []);

  /* ── Step 1: 搜索参考内容 ── */
  const handleSearch = async () => {
    if (!position.trim()) {
      toast.error("请输入目标岗位");
      return;
    }

    setIsSearching(true);
    setReferences([]);

    const companyHint = company.trim() ? `，意向公司：${company.trim()}` : "";
    const prompt = `我正在准备求职「${position.trim()}」${companyHint}。请帮我搜索并推荐 5-6 条高质量参考内容，包括：
1. 该领域的行业趋势文章或报告
2. 相关岗位的面经或求职经验分享
3. 同类岗位的实习/项目案例描述

请用以下格式输出每条内容：
1. **[标题]**
[一段 2-3 句话的摘要，说明该内容的核心观点和对简历撰写的参考价值]

2. **[标题]**
...

注意：每条内容的标题要具体、有信息量，摘要要突出"对求职者写简历有什么帮助"。`;

    try {
      let rawText = "";
      await callChatStream(
        prompt,
        undefined,
        (text) => { rawText = text; },
        (id) => setSearchConversationId(id),
        EXPERIENCE_REFERENCE_BOT_ID,
      );

      const cards = parseReferenceCards(rawText);
      if (cards.length === 0) {
        // fallback: 如果解析失败，用原始文本创建一个卡片
        setReferences([{
          id: "ref-fallback",
          title: `${position} 参考资料`,
          summary: rawText.slice(0, 300),
          type: "other",
          selected: false,
        }]);
      } else {
        setReferences(cards);
      }
      toast.success(`已找到 ${cards.length || 1} 条参考内容`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("搜索失败: " + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setIsSearching(false);
      abortRef.current = null;
    }
  };

  const toggleReference = (id: string) => {
    setReferences((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  /* ── Step 2: 生成经验 ── */
  const handleGenerate = async () => {
    if (keywords.length === 0) {
      toast.error("请至少添加一个关键词");
      return;
    }

    setIsGenerating(true);
    const expId = `exp-${Date.now()}`;
    setExperience({ id: expId, content: "", isStreaming: true });

    // 构建参考语料上下文
    const refContext = selectedRefs.length > 0
      ? `\n\n以下是筛选的参考资料，请基于这些内容风格和行业术语来生成：\n${selectedRefs.map((r, i) => `${i + 1}. ${r.title}：${r.summary}`).join("\n")}`
      : "";

    const companyHint = company.trim() ? `（意向公司：${company.trim()}）` : "";
    const prompt = `目标岗位：${position.trim()}${companyHint}
我的经历关键词：${keywords.join("、")}
${refContext}

请基于以上信息，为我生成 2-3 段可以直接写入简历的工作/项目经历描述。要求：
1. 严格使用 STAR 法则（情境→任务→行动→结果）
2. 措辞专业，使用该领域的行业术语
3. 每段开头用强动词（如：主导、搭建、优化、策划）
4. 结果部分必须包含量化数据，如果我没提供具体数据，用 [请补充具体数据] 作为占位符
5. 每段经历用 ### 标题标注模块名（如 ### 项目经历一）

直接输出简历内容，不要多余的解释。`;

    try {
      await callChatStream(
        prompt,
        searchConversationId,
        (text) => {
          setExperience((prev) => prev ? { ...prev, content: text } : null);
        },
      );
      setExperience((prev) => prev ? { ...prev, isStreaming: false } : null);
      toast.success("经验描述已生成");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setExperience((prev) => prev ? { ...prev, content: prev.content || "（已取消）", isStreaming: false } : null);
        return;
      }
      setExperience((prev) => prev ? { ...prev, content: `❌ ${err instanceof Error ? err.message : "生成失败"}`, isStreaming: false } : null);
      toast.error("生成失败");
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  /* ── Keywords ── */
  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 10) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };
  const removeKeyword = (kw: string) => setKeywords(keywords.filter((k) => k !== kw));
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addKeyword(keywordInput); }
  };

  /* ── Copy ── */
  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── Reset ── */
  const handleReset = () => {
    setReferences([]);
    setExperience(null);
    setKeywords([]);
    setCurrentStep(1);
    setSearchConversationId(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            经验赋能
          </h1>
          <p className="text-muted-foreground mt-1">
            跨平台参考聚合 + AI 智能生成 STAR 格式经验描述
          </p>
        </div>
        {(references.length > 0 || experience) && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            重新开始
          </Button>
        )}
      </motion.div>

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentStep === 1
              ? "bg-primary text-primary-foreground shadow-sm"
              : references.length > 0
              ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>1. 参考聚合</span>
          {references.length > 0 && currentStep !== 1 && (
            <Badge variant="secondary" className="ml-1 h-5 text-[10px]">
              {references.length}
            </Badge>
          )}
        </button>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => references.length > 0 && setCurrentStep(2)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentStep === 2
              ? "bg-primary text-primary-foreground shadow-sm"
              : references.length > 0
              ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Wand2 className="h-4 w-4" />
          <span>2. 智能生成</span>
        </button>
      </div>

      {/* ═══════════ Step 1: 参考内容聚合 ═══════════ */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 lg:grid-cols-5"
          >
            {/* Search Config */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    搜索配置
                  </CardTitle>
                  <CardDescription>输入目标岗位，AI 将搜索相关参考内容</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">目标岗位 *</label>
                    <Input
                      placeholder="例如：产品经理、前端工程师"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">意向公司（可选）</label>
                    <Input
                      placeholder="例如：字节跳动、腾讯"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-cta hover:bg-cta/90 text-white"
                    size="lg"
                    onClick={handleSearch}
                    disabled={isSearching || !position.trim()}
                  >
                    {isSearching ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 搜索中...</>
                    ) : (
                      <><Search className="mr-2 h-4 w-4" /> 搜索参考内容</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    工作原理
                  </h3>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    <li>• AI 会搜索行业文章、面经访谈和岗位案例</li>
                    <li>• 以摘要卡片形式推送，你可勾选感兴趣的参考</li>
                    <li>• 下一步输入关键词后，AI 将基于参考语料生成经验</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Reference Cards */}
            <div className="lg:col-span-3 space-y-4">
              {isSearching && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground">正在搜索相关参考内容...</p>
                  </CardContent>
                </Card>
              )}

              {!isSearching && references.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium text-foreground text-lg mb-2">参考内容聚合</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      输入目标岗位和意向公司，AI 将实时搜索并推送高质量参考内容
                    </p>
                  </CardContent>
                </Card>
              )}

              {references.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      找到 {references.length} 条参考 · 已选 {selectedRefs.length} 条
                    </p>
                    <Button
                      size="sm"
                      onClick={() => { setCurrentStep(2); }}
                      disabled={references.length === 0}
                      className="gap-1.5"
                    >
                      下一步：生成经验
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <AnimatePresence>
                      {references.map((ref, i) => {
                        const config = REFERENCE_TYPE_CONFIG[ref.type];
                        const Icon = config.icon;
                        return (
                          <motion.div
                            key={ref.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                          >
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                ref.selected
                                  ? "ring-2 ring-primary border-primary bg-primary/5"
                                  : "hover:border-primary/30"
                              }`}
                              onClick={() => toggleReference(ref.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {config.label}
                                      </Badge>
                                      {ref.selected && (
                                        <Check className="h-3.5 w-3.5 text-primary" />
                                      )}
                                    </div>
                                    <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                                      {ref.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-3">
                                      {ref.summary}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══════════ Step 2: 智能生成 ═══════════ */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 lg:grid-cols-5"
          >
            {/* Config Panel */}
            <div className="lg:col-span-2 space-y-4">
              {/* Selected References Summary */}
              {selectedRefs.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      已选参考内容 ({selectedRefs.length})
                    </h3>
                    <div className="space-y-1.5">
                      {selectedRefs.map((ref) => (
                        <div key={ref.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          <span className="truncate">{ref.title}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs h-7 px-2 text-muted-foreground"
                      onClick={() => setCurrentStep(1)}
                    >
                      ← 修改选择
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    经历关键词
                  </CardTitle>
                  <CardDescription>输入 2-3 个与你自身经历相关的关键词</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入关键词后按回车"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => addKeyword(keywordInput)}
                        disabled={!keywordInput.trim()}
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <AnimatePresence>
                      {keywords.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-wrap gap-2 pt-1"
                        >
                          {keywords.map((kw) => (
                            <Badge key={kw} variant="secondary" className="gap-1 pr-1">
                              {kw}
                              <button
                                onClick={() => removeKeyword(kw)}
                                className="ml-1 hover:bg-muted rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Suggested */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">推荐关键词</label>
                    <div className="flex flex-wrap gap-2">
                      {suggestedKeywords
                        .filter((kw) => !keywords.includes(kw))
                        .slice(0, 8)
                        .map((kw) => (
                          <Badge
                            key={kw}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors"
                            onClick={() => addKeyword(kw)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {kw}
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <Button
                    className="w-full bg-cta hover:bg-cta/90 text-white"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating || keywords.length === 0}
                  >
                    {isGenerating ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 生成中...</>
                    ) : (
                      <><Sparkles className="mr-2 h-4 w-4" /> 基于参考生成经验</>
                    )}
                  </Button>

                  {isGenerating && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={handleStop}
                    >
                      <X className="mr-2 h-3.5 w-3.5" /> 停止生成
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* STAR Tips */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2 text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    STAR 法则说明
                  </h3>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1.5">
                    <li><strong>S</strong>ituation — 情境：描述当时的背景或挑战</li>
                    <li><strong>T</strong>ask — 任务：你需要完成的目标</li>
                    <li><strong>A</strong>ction — 行动：你采取的具体措施</li>
                    <li><strong>R</strong>esult — 结果：最终达成的量化成果</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Result Panel */}
            <div className="lg:col-span-3 space-y-4">
              {!experience && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium text-foreground text-lg mb-2">
                      智能经验生成
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      {selectedRefs.length > 0
                        ? `已选 ${selectedRefs.length} 条参考，添加关键词后即可生成`
                        : "添加经历关键词，AI 将生成 STAR 格式的经验描述"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {experience && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          {position}
                          {experience.isStreaming && (
                            <Badge variant="secondary" className="text-[10px] animate-pulse">
                              生成中
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex flex-wrap gap-1">
                          {keywords.map((kw) => (
                            <Badge key={kw} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                          {experience.content || ""}
                        </ReactMarkdown>
                        {experience.isStreaming && (
                          <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                        )}
                      </div>

                      {!experience.isStreaming && experience.content && !experience.content.startsWith("❌") && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(experience.id, experience.content)}
                          >
                            {copiedId === experience.id ? (
                              <><Check className="mr-1 h-3 w-3 text-green-500" /> 已复制</>
                            ) : (
                              <><Copy className="mr-1 h-3 w-3" /> 复制</>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setExperience(null);
                              toast.info("可以修改关键词后重新生成");
                            }}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            重新生成
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
