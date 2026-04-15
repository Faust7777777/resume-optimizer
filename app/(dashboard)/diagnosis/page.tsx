"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  AlertCircle,
  Loader2,
  RotateCcw,
  CheckCircle,
  Target,
  ShieldAlert,
  Sparkles,
  ArrowRightLeft,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Zap,
  Star,
  AlertTriangle,
  Eye,
  ArrowRight,
  GraduationCap,
  Stethoscope,
  FlaskConical,
  Trophy,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/resume/file-upload";
import { ScoreRing } from "@/components/charts/score-ring";
import { DiagnosisResult } from "@/types";
import { analyzeResume, analyzeResumeByFile } from "@/lib/ai-client";
import { useResumeStore } from "@/store/resume-store";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

/* ─────────────── Markdown 渲染组件 ─────────────── */
function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={className || "prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-table:text-sm"}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
    </div>
  );
}

/* ─────────────── Step3 表格解析 & 卡片渲染 ─────────────── */

/** 从 Markdown 表格行中提取单元格内容 */
function parseTableRow(row: string): string[] {
  // 去掉首尾的 |，按 | 分割
  const trimmed = row.replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

/** 识别模块对应的图标 */
function getModuleIcon(name: string) {
  if (/教育|学历|学校/.test(name)) return GraduationCap;
  if (/临床|实践|实习|医院/.test(name)) return Stethoscope;
  if (/科研|研究|项目|论文/.test(name)) return FlaskConical;
  if (/获奖|荣誉|奖学金|竞赛/.test(name)) return Trophy;
  return Lightbulb;
}

/** 识别模块对应的颜色 */
function getModuleColor(index: number) {
  const colors = [
    { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800", accent: "text-blue-600 dark:text-blue-400", badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" },
    { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", accent: "text-amber-600 dark:text-amber-400", badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" },
    { bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800", accent: "text-violet-600 dark:text-violet-400", badge: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300" },
    { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", accent: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" },
  ];
  return colors[index % colors.length];
}

interface ReconstructionRow {
  module: string;
  before: string;
  after: string;
  logic: string;
}

/** 将"模块/原内容"合并单元格拆分为模块名 + 修改前内容 */
function splitMergedCell(text: string): { module: string; before: string } {
  // 策略1: "工行杯项目-原描述<br>实际内容..." 或 "工行杯项目-原描述\n内容"
  const origMatch = text.match(/^(.+?)\s*[-—]\s*原(?:描述|内容)?\s*(?:<br\s*\/?>|\n|$)/i);
  if (origMatch) {
    const moduleName = origMatch[1].trim();
    const before = text.slice(origMatch[0].length).replace(/^(?:<br\s*\/?>|\n)\s*/gi, "").trim();
    return { module: moduleName, before: before || text };
  }
  // 策略2: 按 <br> 拆分，第一段作为模块名
  const brIdx = text.search(/<br\s*\/?>/i);
  if (brIdx > 0) {
    return {
      module: text.slice(0, brIdx).trim(),
      before: text.slice(brIdx).replace(/^<br\s*\/?>\s*/gi, "").trim(),
    };
  }
  // 策略3: 按换行符拆分
  const nlIdx = text.indexOf("\n");
  if (nlIdx > 0) {
    return {
      module: text.slice(0, nlIdx).trim(),
      before: text.slice(nlIdx + 1).trim(),
    };
  }
  // 无法拆分
  return { module: "", before: text };
}

/** 检测两段文本是否共享 4+ 字中文子串（判断修改前/后是否描述同一实体） */
function sharesSubstring(a: string, b: string, minLen = 4): boolean {
  const cleanA = a.replace(/<br\s*\/?>/gi, "").replace(/[^\u4e00-\u9fa5]/g, "");
  const cleanB = b.replace(/<br\s*\/?>/gi, "").replace(/[^\u4e00-\u9fa5]/g, "");
  if (cleanA.length < minLen || cleanB.length < minLen) return false;
  for (let i = 0; i <= cleanA.length - minLen; i++) {
    if (cleanB.includes(cleanA.slice(i, i + minLen))) return true;
  }
  return false;
}

/** 智能解析含 | 的数据行，拆分为 before / after / logic */
function parseSmartDataRow(rawContent: string, moduleName: string): ReconstructionRow | null {
  const content = rawContent.replace(/^\|?\s*/, "").replace(/\s*\|?\s*$/, "").trim();
  if (!content) return null;

  const segments = content.split("|").map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return null;
  if (segments.length === 1) return { module: moduleName, before: "", after: segments[0], logic: "" };
  if (segments.length === 2) return { module: moduleName, before: segments[0], after: segments[1], logic: "" };
  if (segments.length === 3) return { module: moduleName, before: segments[0], after: segments[1], logic: segments[2] };

  // 4+ segments: 最后一段 = logic，其余智能拆分为 before & after
  const logic = segments[segments.length - 1];
  const rest = segments.slice(0, -1);

  // 找 "重启点"：后面某段与第一段共享关键子串（如同一机构名），标志 after 开始
  let splitIdx = 1;
  if (rest.length > 2) {
    for (let i = Math.max(1, Math.floor(rest.length / 3)); i < rest.length; i++) {
      if (sharesSubstring(rest[0], rest[i])) {
        splitIdx = i;
        break;
      }
    }
  }

  return {
    module: moduleName,
    before: rest.slice(0, splitIdx).join(" | "),
    after: rest.slice(splitIdx).join(" | "),
    logic,
  };
}

/** 从 Step3 Markdown 中提取表格行 */
function parseReconstructionTable(markdown: string): { rows: ReconstructionRow[]; preContent: string; postContent: string } {
  const lines = markdown.split("\n");

  // ══════ Strategy 0: 段落格式 ══════
  // 每个模块用编号标题或 #### 子标题，下面是 **修改前：** / **修改后：** / **重写逻辑：** 段落
  {
    // 匹配标题: "#### 1. 模块名" 或 "1. 模块名" 或 "#### 模块名"
    const headingRe = /^(?:#{1,4}\s+)?(?:\d+[.、]\s*)?(.+)/;
    // 匹配修改前/修改后/重写逻辑标签
    const beforeLabel = /^\*{0,2}(?:修改前|原[文内]容|Before)\s*[：:]\s*\*{0,2}\s*/i;
    const afterLabel = /^\*{0,2}(?:修改后|优化后|重[写构]后?|After|STAR\s*(?:法则)?(?:重写|优化)?)\s*[：:]\s*\*{0,2}\s*/i;
    const logicLabel = /^\*{0,2}(?:重写逻辑|修改逻辑|逻辑|理由|原因|说明|Logic|Reason)\s*[：:]\s*\*{0,2}\s*/i;

    type ParagraphBlock = {
      moduleName: string;
      before: string;
      after: string;
      logic: string;
      startLine: number;
      endLine: number;
    };
    const blocks: ParagraphBlock[] = [];

    let current: ParagraphBlock | null = null;
    let activeField: "before" | "after" | "logic" | null = null;
    let lastContentLine = -1;

    const flushCurrent = () => {
      if (current && (current.before || current.after)) {
        current.endLine = lastContentLine >= current.startLine ? lastContentLine : current.startLine;
        blocks.push(current);
      }
      current = null;
      activeField = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 检测标签行
      if (beforeLabel.test(trimmed)) {
        const content = trimmed.replace(beforeLabel, "").trim();
        if (!current) {
          // 没有标题的情况 — 创建匿名块
          current = { moduleName: `模块 ${blocks.length + 1}`, before: "", after: "", logic: "", startLine: i, endLine: i };
        }
        current.before = content;
        activeField = "before";
        lastContentLine = i;
        continue;
      }
      if (afterLabel.test(trimmed)) {
        if (!current) {
          current = { moduleName: `模块 ${blocks.length + 1}`, before: "", after: "", logic: "", startLine: i, endLine: i };
        }
        const content = trimmed.replace(afterLabel, "").trim();
        current.after = content;
        activeField = "after";
        lastContentLine = i;
        continue;
      }
      if (logicLabel.test(trimmed)) {
        if (!current) continue;
        const content = trimmed.replace(logicLabel, "").trim();
        current.logic = content;
        activeField = "logic";
        lastContentLine = i;
        continue;
      }

      // 检测分隔线 --- 或新标题（可能开始新模块）
      if (/^-{3,}\s*$/.test(trimmed) || /^#{1,4}\s+\d+[.、]/.test(trimmed) || /^\d+[.、]\s+\S/.test(trimmed)) {
        // 如果当前块至少有 before 或 after，说明已完整 → flush
        if (current && (current.before || current.after)) {
          flushCurrent();
        }
        // 如果这行是一个标题（不是纯分隔线）
        if (!/^-{3,}\s*$/.test(trimmed)) {
          const hm = trimmed.replace(/^#{1,4}\s+/, "").match(/^(?:\d+[.、]\s*)?(.+)/);
          const moduleName = hm ? hm[1].replace(/[（(][^）)]*[）)]\s*$/, "").trim() : `模块 ${blocks.length + 1}`;
          current = { moduleName, before: "", after: "", logic: "", startLine: i, endLine: i };
          activeField = null;
        }
        continue;
      }

      // 空行 — 不中断当前 field
      if (!trimmed) continue;

      // 如果当前在某个 field 中，内容续行
      if (current && activeField && trimmed) {
        const sep = current[activeField] ? "<br>" : "";
        current[activeField] += sep + trimmed;
        lastContentLine = i;
      }
    }
    flushCurrent();

    // 至少需要 2 个块才认为是段落格式（防止误判）
    if (blocks.length >= 2) {
      const pRows: ReconstructionRow[] = blocks.map((b) => ({
        module: b.moduleName,
        before: b.before,
        after: b.after,
        logic: b.logic,
      }));
      const firstStart = blocks[0].startLine;
      const lastEnd = blocks[blocks.length - 1].endLine;
      const preContent = firstStart > 0 ? lines.slice(0, firstStart).join("\n").trim() : "";
      const postContent = lastEnd < lines.length - 1 ? lines.slice(lastEnd + 1).join("\n").trim() : "";
      return { rows: pRows, preContent, postContent };
    }
  }

  // ══════ Strategy 1: 多段落+小表格格式 ══════
  // 每个模块有独立编号标题 (1. xxx) + 独立表格，单元格内可能含 |
  const sectionHeading = /^\d+[.、]\s*(.+)/;
  const separatorRe = /^\|[\s\-:]+\|/;
  const headerKeywords = /修改前|修改后|原内容|重写|逻辑|重构|优化/;

  type SectInfo = { moduleName: string; startLine: number; sepLine: number; endLine: number };
  const sections: SectInfo[] = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].trim().match(sectionHeading);
    if (!m) continue;
    const moduleName = m[1].replace(/[（(][^）)]*[）)]\s*$/, "").trim();

    // 在标题后 5 行内找表头 + 分隔行
    let found = false;
    for (let j = i + 1; !found && j < Math.min(i + 5, lines.length); j++) {
      const hdr = lines[j].trim();
      if (hdr.startsWith("|") && headerKeywords.test(hdr)) {
        for (let k = j + 1; k < Math.min(j + 3, lines.length); k++) {
          if (separatorRe.test(lines[k].trim())) {
            let end = k;
            for (let d = k + 1; d < lines.length; d++) {
              if (sectionHeading.test(lines[d].trim())) break;
              end = d;
            }
            sections.push({ moduleName, startLine: i, sepLine: k, endLine: end });
            i = end;
            found = true;
            break;
          }
        }
      }
    }
  }

  if (sections.length > 0) {
    const sectionRows: ReconstructionRow[] = [];
    for (const sec of sections) {
      const contentLines: string[] = [];
      for (let d = sec.sepLine + 1; d <= sec.endLine; d++) {
        const dl = lines[d].trim();
        if (dl) contentLines.push(dl);
      }
      if (contentLines.length === 0) continue;
      // 将多行合并为单行（用 <br> 连接），再做智能拆分
      const joined = contentLines.join("<br>");
      const row = parseSmartDataRow(joined, sec.moduleName);
      if (row) sectionRows.push(row);
    }
    if (sectionRows.length > 0) {
      const preContent = sections[0].startLine > 0
        ? lines.slice(0, sections[0].startLine).join("\n").trim()
        : "";
      const postContent = sections[sections.length - 1].endLine < lines.length - 1
        ? lines.slice(sections[sections.length - 1].endLine + 1).join("\n").trim()
        : "";
      return { rows: sectionRows, preContent, postContent };
    }
  }

  // ══════ Strategy 2: 单表格（智能列检测） ══════
  const rows: ReconstructionRow[] = [];
  let tableStart = -1;
  let tableEnd = -1;
  let inTable = false;
  let headerSkipped = false;
  let colMapping: { module: number; before: number; after: number; logic: number; merged: boolean } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 检测表头行 — 放宽匹配：任何含有 2+ 个 | 分隔的行，且包含对比类关键词
    if (!inTable && line.startsWith("|") && (line.match(/\|/g) || []).length >= 3) {
      const cells = parseTableRow(line).map((c) => c.toLowerCase().replace(/[*\s]/g, ""));

      // 识别列索引（兼容多种中英文表头）
      const beforePatterns = /修改前|原版|原始|现状|原文|原内容|before|original|旧/;
      const afterPatterns = /修改后|优化|重构|推荐|建议|after|new|新|star/;
      const modulePatterns = /模块|板块|维度|部分|项目|section|module|类别|简历模块/;
      const logicPatterns = /逻辑|理由|原因|说明|思路|解释|logic|reason|备注/;

      const beforeIdx = cells.findIndex((c) => beforePatterns.test(c));
      const afterIdx = cells.findIndex((c) => afterPatterns.test(c));
      const moduleIdx = cells.findIndex((c) => modulePatterns.test(c));
      const logicIdx = cells.findIndex((c) => logicPatterns.test(c));

      // Case A: 有独立的 before 和 after 列
      if (beforeIdx >= 0 && afterIdx >= 0) {
        colMapping = {
          module: moduleIdx >= 0 && moduleIdx !== beforeIdx ? moduleIdx : -1,
          before: beforeIdx,
          after: afterIdx,
          logic: logicIdx >= 0 ? logicIdx : -1,
          merged: moduleIdx >= 0 && moduleIdx === beforeIdx,
        };
        inTable = true;
        tableStart = i;
        headerSkipped = false;
        continue;
      }

      // Case B: "模块/原内容" 合并列 — 只有 after 列，无独立 before 列
      // 表头类似 | 模块/原内容 | 修改后 | 重写逻辑 |
      if (afterIdx >= 0 && beforeIdx < 0 && moduleIdx >= 0) {
        colMapping = {
          module: moduleIdx,
          before: moduleIdx, // 合并列，解析时拆分
          after: afterIdx,
          logic: logicIdx >= 0 ? logicIdx : -1,
          merged: true,
        };
        inTable = true;
        tableStart = i;
        headerSkipped = false;
        continue;
      }
    }

    // 跳过分隔行 |---|---|---|
    if (inTable && !headerSkipped && /^\|[\s\-:]+\|/.test(line)) {
      headerSkipped = true;
      continue;
    }
    // 数据行
    if (inTable && headerSkipped && line.startsWith("|") && colMapping) {
      const cells = parseTableRow(line);
      const clean = (s: string) => s.trim();
      const safeGet = (idx: number) => (idx >= 0 && idx < cells.length ? clean(cells[idx]) : "");

      let moduleName: string;
      let before: string;
      const after = safeGet(colMapping.after);

      if (colMapping.merged) {
        // 合并列：拆分为模块名 + 修改前内容
        const merged = safeGet(colMapping.before);
        const split = splitMergedCell(merged);
        moduleName = split.module || `模块 ${rows.length + 1}`;
        before = split.before;
      } else {
        moduleName = safeGet(colMapping.module) || `模块 ${rows.length + 1}`;
        before = safeGet(colMapping.before);
      }

      // 跳过空行
      if (before || after) {
        rows.push({
          module: moduleName,
          before,
          after,
          logic: safeGet(colMapping.logic),
        });
      }
      tableEnd = i;
    } else if (inTable && headerSkipped && !line.startsWith("|")) {
      // 表格结束
      inTable = false;
    }
  }

  const preContent = tableStart > 0 ? lines.slice(0, tableStart).join("\n").trim() : "";
  const postContent = tableEnd >= 0 && tableEnd < lines.length - 1 ? lines.slice(tableEnd + 1).join("\n").trim() : "";

  return { rows, preContent, postContent };
}

/** Step3 精修内容 — 卡片式布局 */
function ReconstructionContent({ content }: { content: string }) {
  const { rows, preContent, postContent } = useMemo(() => parseReconstructionTable(content), [content]);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // 没有解析出表格行，回退到普通 Markdown
  if (rows.length === 0) {
    return <MarkdownContent content={content} />;
  }

  return (
    <div className="space-y-5">
      {/* 表格前的描述性内容 */}
      {preContent && <MarkdownContent content={preContent} />}

      {/* 模块卡片列表 */}
      <div className="space-y-4">
        {rows.map((row, i) => {
          const colors = getModuleColor(i);
          const Icon = getModuleIcon(row.module);
          const isExpanded = expandedCards[i] ?? true; // 默认展开

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className={`rounded-xl border ${colors.border} overflow-hidden`}
            >
              {/* 模块标题栏 */}
              <button
                onClick={() => toggleCard(i)}
                className={`w-full flex items-center justify-between px-5 py-3.5 ${colors.bg} transition-colors hover:opacity-90`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${colors.badge}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <span className={`text-sm font-semibold ${colors.accent}`}>
                      {row.module || `模块 ${i + 1}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${colors.badge} border-0`}>
                    {i + 1} / {rows.length}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* 展开内容 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 py-4 space-y-4 bg-background">
                      {/* 修改前 → 修改后 对比 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 修改前 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                              修改前
                            </span>
                          </div>
                          <div className="rounded-lg border border-red-200/60 dark:border-red-800/40 bg-red-50/50 dark:bg-red-950/20 p-4">
                            <MarkdownContent
                              content={row.before || "—"}
                              className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground prose-strong:text-muted-foreground prose-li:text-muted-foreground text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            />
                          </div>
                        </div>

                        {/* 修改后 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                              修改后
                            </span>
                          </div>
                          <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                            <MarkdownContent
                              content={row.after || "—"}
                              className="prose prose-sm dark:prose-invert max-w-none prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground text-sm font-medium leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 中间箭头（仅桌面端可见） */}
                      <div className="hidden lg:flex justify-center -mt-2 -mb-2">
                        <div className="flex items-center gap-1 text-muted-foreground/50">
                          <div className="h-px w-8 bg-border" />
                          <ArrowRight className="h-3.5 w-3.5" />
                          <div className="h-px w-8 bg-border" />
                        </div>
                      </div>

                      {/* 重写逻辑 */}
                      {row.logic && (
                        <div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-4">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                重写逻辑
                              </span>
                              <div className="mt-1">
                                <MarkdownContent
                                  content={row.logic}
                                  className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground prose-li:text-muted-foreground text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* 表格后的额外内容 */}
      {postContent && <MarkdownContent content={postContent} />}
    </div>
  );
}

/* ─────────────── 步骤指示器 ─────────────── */
const stepMeta = [
  {
    key: "jdAnalysis" as const,
    label: "JD 拆解",
    icon: Target,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    description: "岗位核心痛点解析",
  },
  {
    key: "diagnosis" as const,
    label: "全科诊断",
    icon: ShieldAlert,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    description: "痛点直击 & 潜力挖掘",
  },
  {
    key: "reconstruction" as const,
    label: "逐条精修",
    icon: ArrowRightLeft,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    description: "STAR 法则重构 & 对比",
  },
  {
    key: "moduleOptimization" as const,
    label: "高阶建议",
    icon: LayoutGrid,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/40",
    border: "border-purple-200 dark:border-purple-800",
    description: "模块排版 & 面试防御",
  },
];

/* ─────────────── 进度提示文案 ─────────────── */
const loadingMessages = [
  "正在解析岗位关键词...",
  "正在识别简历核心经历...",
  "运用 STAR 法则评估经历质量...",
  "对比 JD 匹配度...",
  "生成逐条优化建议...",
  "深度思考中，请稍候...",
];

export default function DiagnosisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetPosition, setTargetPosition] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showRawAnalysis, setShowRawAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState("jdAnalysis");
  const [progress, setProgress] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState(loadingMessages[0]);

  const { editorContent, setDiagnosisScores, addDiagnosisHistory } = useResumeStore();

  // ── 文件选择 ──
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setHasAnalyzed(false);
    setResult(null);
  };
  const handleFileRemove = () => {
    setSelectedFile(null);
    setHasAnalyzed(false);
    setResult(null);
  };

  // ── 开始分析 ──
  const handleAnalyze = async () => {
    if (!targetPosition.trim()) {
      setError("请填写目标岗位或粘贴 JD，这是获得精准诊断的必要信息。");
      return;
    }
    if (!selectedFile && !editorContent.trim()) {
      setError("请先上传简历，或在在线编辑器中粘贴简历内容后再诊断。");
      return;
    }
    setIsAnalyzing(true);
    setError(null);

    try {
      let diagnosisResult: DiagnosisResult;
      if (selectedFile) {
        diagnosisResult = await analyzeResumeByFile(selectedFile, targetPosition);
      } else {
        diagnosisResult = await analyzeResume(editorContent.trim());
      }
      setResult(diagnosisResult);
      setDiagnosisScores(diagnosisResult.scores);
      setHasAnalyzed(true);

      // 写入诊断历史记录
      addDiagnosisHistory({
        id: Date.now().toString(),
        timestamp: new Date(),
        fileName: selectedFile?.name,
        targetPosition: targetPosition || undefined,
        scores: diagnosisResult.scores,
        matchScore: diagnosisResult.matchScore,
        summary: diagnosisResult.summary || "",
        suggestions: diagnosisResult.suggestions || [],
        rawAnalysis: diagnosisResult.rawAnalysis,
      });

      // 自动跳到有内容的第一个 tab
      if (diagnosisResult.steps) {
        const first = stepMeta.find((s) => diagnosisResult.steps?.[s.key]);
        if (first) setActiveTab(first.key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析失败，请检查 API 配置");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setHasAnalyzed(false);
    setResult(null);
    setSelectedFile(null);
    setShowRawAnalysis(false);
    setActiveTab("jdAnalysis");
  };

  // ── 进度条动画 ──
  useEffect(() => {
    if (!isAnalyzing) {
      setProgress(0);
      return;
    }
    let msgIdx = 0;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        return prev + Math.random() * 8;
      });
      msgIdx = (msgIdx + 1) % loadingMessages.length;
      setLoadingMsg(loadingMessages[msgIdx]);
    }, 2500);
    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // ── 评分等级颜色 ──
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: "优秀", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-950/30" };
    if (score >= 60) return { label: "良好", color: "text-primary", bgColor: "bg-primary/5" };
    if (score >= 40) return { label: "一般", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-950/30" };
    return { label: "需改进", color: "text-destructive", bgColor: "bg-destructive/5" };
  };

  // 判断是否有 4 步结构
  const hasSteps = result?.steps && Object.values(result.steps).some(Boolean);
  const hasRawAnalysis = result?.rawAnalysis && result.rawAnalysis.length > 50;

  return (
    <div className="space-y-6">
      {/* ═══════ Header ═══════ */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">简历深度诊断</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              资深 HR 视角 · STAR 法则重构 · ATS 关键词优化 · 4 步系统诊断
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══════ 输入区 ═══════ */}
      {!hasAnalyzed && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          {/* 目标岗位 JD */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                目标岗位 / JD
              </CardTitle>
              <CardDescription>
                填写目标岗位名称或粘贴完整 JD，AI 将据此进行针对性的匹配度分析
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="例如：前端开发工程师（React/Next.js），或粘贴完整 JD 文本..."
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                className="min-h-[80px] resize-y"
              />
            </CardContent>
          </Card>

          {/* 文件上传 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" />
                上传简历
              </CardTitle>
              <CardDescription>
                支持 PDF、Word、纯文本，也可以在「在线编辑器」中粘贴内容
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onFileSelect={handleFileSelect} onFileRemove={handleFileRemove} maxSize={10} />

              {(selectedFile || editorContent.trim()) && (
                <div className="mt-5 flex justify-center">
                  <Button onClick={handleAnalyze} disabled={isAnalyzing || !targetPosition.trim()} size="lg" className="bg-cta hover:bg-cta/90 text-cta-foreground shadow-sm px-8">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        诊断中...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        开始深度诊断
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══════ 加载态 ═══════ */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-foreground font-medium">AI 专家正在深度分析您的简历...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{loadingMsg}</p>
                  <div className="flex gap-2 flex-wrap">
                    {["JD 拆解", "匹配诊断", "STAR 重构", "模块优化"].map((step, i) => (
                      <Badge
                        key={step}
                        variant="outline"
                        className={`text-xs transition-colors ${progress > (i + 1) * 20 ? "bg-primary/10 text-primary border-primary/30" : ""}`}
                      >
                        {step}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ 错误 ═══════ */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle>分析失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ═══════════════════════════════════
           诊断结果
         ═══════════════════════════════════ */}
      {hasAnalyzed && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="space-y-6">
          {/* ── 总览卡片 ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <div>
                    <CardTitle>诊断完成</CardTitle>
                    <CardDescription className="mt-1 max-w-xl">{result.summary}</CardDescription>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  重新诊断
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-8">
                {/* 匹配度 */}
                {result.matchScore !== undefined && (
                  <div className="flex items-center gap-4">
                    <ScoreRing score={result.matchScore} size={100} strokeWidth={8} />
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">{result.matchScore}</span>
                        <span className="text-muted-foreground text-sm">%</span>
                      </div>
                      <p className="text-sm text-muted-foreground">JD 匹配度</p>
                      <div className="mt-1">
                        {(() => {
                          const level = getScoreLevel(result.matchScore!);
                          return <Badge className={`text-xs ${level.bgColor} ${level.color} border-0`}>{level.label}</Badge>;
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* 综合评分 */}
                <div className="flex items-center gap-4">
                  <ScoreRing score={result.scores.overall} size={100} strokeWidth={8} />
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{result.scores.overall}</span>
                      <span className="text-muted-foreground text-sm">/ 100</span>
                    </div>
                    <p className="text-sm text-muted-foreground">综合评分</p>
                  </div>
                </div>

                {/* 4 维度快速得分 */}
                <div className="flex gap-3 flex-wrap">
                  {[
                    { label: "完整度", score: result.scores.completeness },
                    { label: "相关性", score: result.scores.relevance },
                    { label: "专业性", score: result.scores.professionalism },
                    { label: "排版", score: result.scores.layout },
                  ].map((d) => {
                    const level = getScoreLevel(d.score);
                    return (
                      <div key={d.label} className={`px-3 py-2 rounded-lg ${level.bgColor}`}>
                        <div className="text-xs text-muted-foreground">{d.label}</div>
                        <div className={`text-lg font-bold ${level.color}`}>{d.score}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 4 步结构化展示 (Tabs) ── */}
          {hasSteps && (
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-4 h-auto">
                    {stepMeta.map((step, i) => {
                      const StepIcon = step.icon;
                      const hasContent = !!result.steps?.[step.key];
                      return (
                        <TabsTrigger
                          key={step.key}
                          value={step.key}
                          disabled={!hasContent}
                          className="flex flex-col gap-1 py-3 data-[state=active]:shadow-sm"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground font-normal">Step {i + 1}</span>
                            <StepIcon className={`h-3.5 w-3.5 ${hasContent ? step.color : "text-muted-foreground/50"}`} />
                          </div>
                          <span className={`text-xs font-medium ${hasContent ? "" : "text-muted-foreground/50"}`}>
                            {step.label}
                          </span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-6">
                  {stepMeta.map((step) => (
                    <TabsContent key={step.key} value={step.key} className="mt-0">
                      {result.steps?.[step.key] && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                          {/* 步骤标签 */}
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${step.bg} ${step.color}`}>
                            <step.icon className="h-4 w-4" />
                            {step.description}
                          </div>

                          {/* Step3 使用卡片式对比布局，其他用 Markdown */}
                          {step.key === "reconstruction" ? (
                            <ReconstructionContent content={result.steps![step.key]!} />
                          ) : (
                            <div className={`rounded-xl border p-5 ${step.bg} ${step.border}`}>
                              <MarkdownContent content={result.steps![step.key]!} />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </TabsContent>
                  ))}
                </CardContent>
              </Tabs>
            </Card>
          )}

          {/* ── 无 4 步结构时：展示原始分析结果 ── */}
          {!hasSteps && hasRawAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  专家分析报告
                </CardTitle>
                <CardDescription>基于 STAR 法则和 ATS 优化方法论的全面分析</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border bg-muted/30 p-5">
                  <MarkdownContent content={result.rawAnalysis!} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 展开原始全文（4 步模式下可折叠） ── */}
          {hasSteps && hasRawAnalysis && (
            <Card>
              <CardHeader>
                <button
                  onClick={() => setShowRawAnalysis(!showRawAnalysis)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">查看完整分析原文</CardTitle>
                  </div>
                  {showRawAnalysis ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </CardHeader>
              <AnimatePresence>
                {showRawAnalysis && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <CardContent className="pt-0">
                      <div className="rounded-xl border bg-muted/20 p-5 max-h-[600px] overflow-y-auto">
                        <MarkdownContent content={result.rawAnalysis!} />
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* ── 旧版 Suggestions 列表（如果有） ── */}
          {result.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  快速改进清单
                </CardTitle>
                <CardDescription>AI 识别的关键改进点，按优先级排序</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.suggestions
                    .sort((a, b) => {
                      const w: Record<string, number> = { high: 3, medium: 2, low: 1 };
                      return (w[b.priority] || 0) - (w[a.priority] || 0);
                    })
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="mt-0.5">
                          {s.priority === "high" ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : s.priority === "medium" ? (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{s.title}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {s.priority === "high" ? "紧急" : s.priority === "medium" ? "建议" : "可选"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 底部行动按钮 ── */}
          <Separator />
          <div className="flex flex-wrap items-center justify-center gap-3 pb-4">
            <Link href="/editor">
              <Button size="lg" className="bg-cta hover:bg-cta/90 text-cta-foreground shadow-sm">
                <FileText className="mr-2 h-4 w-4" />
                前往编辑器优化简历
              </Button>
            </Link>
            <Button variant="outline" size="lg" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              重新诊断
            </Button>
          </div>
        </motion.div>
      )}

      {/* ═══════ 初始提示 ═══════ */}
      {!hasAnalyzed && !isAnalyzing && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stepMeta.map((step, i) => (
                <div key={step.key} className={`rounded-xl p-4 ${step.bg} ${step.border} border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
                    <step.icon className={`h-4 w-4 ${step.color}`} />
                  </div>
                  <h3 className={`font-semibold text-sm ${step.color}`}>{step.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              上传简历并输入目标岗位，获取 4 步系统诊断报告
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
