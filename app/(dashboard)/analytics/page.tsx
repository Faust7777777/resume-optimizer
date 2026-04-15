"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  History,
  Activity,
  Calendar,
  Award,
  FileText,
  Target,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadarComparison } from "@/components/charts/radar-comparison";
import { ImprovementChart } from "@/components/charts/improvement-chart";
import { ScoreRing } from "@/components/charts/score-ring";
import { useResumeStore } from "@/store/resume-store";
import { DiagnosisHistory, ResumeScores } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────── 工具函数 ─────────────── */

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getScoreLevel(score: number) {
  if (score >= 85) return { label: "优秀", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" };
  if (score >= 75) return { label: "良好", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" };
  if (score >= 60) return { label: "及格", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" };
  return { label: "待提升", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", badge: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" };
}

const dimensionLabels: Record<string, string> = {
  completeness: "完整度",
  relevance: "相关性",
  professionalism: "专业性",
  layout: "排版规范",
  overall: "综合评分",
};

/* ─────────────── 诊断历史卡片 ─────────────── */

function DiagnosisHistoryCard({ item, index }: { item: DiagnosisHistory; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const level = getScoreLevel(item.scores.overall);

  const priorityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    item.suggestions?.forEach((s) => {
      if (s.priority in counts) counts[s.priority as keyof typeof counts]++;
    });
    return counts;
  }, [item.suggestions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="rounded-xl border border-border hover:border-primary/30 transition-colors overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0">
            <ScoreRing score={item.scores.overall} size={48} strokeWidth={4} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground truncate">
                {item.fileName || "在线编辑简历"}
              </span>
              <Badge variant="outline" className={`text-xs ${level.badge} border-0`}>
                {level.label}
              </Badge>
              {item.matchScore != null && (
                <Badge variant="outline" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  匹配 {item.matchScore}%
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(item.timestamp)}
              </span>
              {item.targetPosition && (
                <span className="truncate max-w-[180px]">
                  目标: {item.targetPosition.slice(0, 30)}{item.targetPosition.length > 30 ? "..." : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* 问题分布小标签 */}
          <div className="hidden sm:flex items-center gap-1.5">
            {priorityCounts.high > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="h-3 w-3" />{priorityCounts.high}
              </span>
            )}
            {priorityCounts.medium > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                <Info className="h-3 w-3" />{priorityCounts.medium}
              </span>
            )}
            {priorityCounts.low > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400">
                <CheckCircle className="h-3 w-3" />{priorityCounts.low}
              </span>
            )}
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-4 space-y-4">
              <Separator />

              {/* 四维分数条 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(["completeness", "relevance", "professionalism", "layout"] as const).map((key) => {
                  const score = item.scores[key];
                  const sl = getScoreLevel(score);
                  return (
                    <div key={key} className={`rounded-lg p-3 ${sl.bg}`}>
                      <div className="text-xs text-muted-foreground">{dimensionLabels[key]}</div>
                      <div className={`text-xl font-bold ${sl.color}`}>{score}</div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${score}%`,
                            backgroundColor: score >= 85 ? "#10b981" : score >= 75 ? "#3b82f6" : score >= 60 ? "#f59e0b" : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI 总结 */}
              {item.summary && (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                  <h4 className="text-sm font-medium text-foreground mb-1">AI 总结</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>
                </div>
              )}

              {/* 关键建议 */}
              {item.suggestions && item.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">改进建议 ({item.suggestions.length})</h4>
                  <div className="space-y-1.5">
                    {item.suggestions.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-start gap-2 text-sm">
                        <span className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                          s.priority === "high" ? "bg-red-500" : s.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                        }`} />
                        <span className="text-muted-foreground">{s.title}</span>
                      </div>
                    ))}
                    {item.suggestions.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-3.5">还有 {item.suggestions.length - 5} 条建议...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────── 主页面 ─────────────── */

export default function AnalyticsPage() {
  const { diagnosisHistory, clearDiagnosisHistory } = useResumeStore();

  // 统计数据
  const stats = useMemo(() => {
    const total = diagnosisHistory.length;
    if (total === 0) return null;

    const avgOverall = Math.round(diagnosisHistory.reduce((sum, h) => sum + h.scores.overall, 0) / total);
    const bestScore = Math.max(...diagnosisHistory.map((h) => h.scores.overall));
    const latestDate = new Date(diagnosisHistory[0].timestamp).toLocaleDateString("zh-CN");

    // 各维度平均
    const avgScores: ResumeScores = {
      completeness: Math.round(diagnosisHistory.reduce((s, h) => s + h.scores.completeness, 0) / total),
      relevance: Math.round(diagnosisHistory.reduce((s, h) => s + h.scores.relevance, 0) / total),
      professionalism: Math.round(diagnosisHistory.reduce((s, h) => s + h.scores.professionalism, 0) / total),
      layout: Math.round(diagnosisHistory.reduce((s, h) => s + h.scores.layout, 0) / total),
      overall: avgOverall,
    };

    // 如果有两次以上诊断，计算提升幅度（最新 vs 最早）
    let improvement: ResumeScores | null = null;
    if (total >= 2) {
      const latest = diagnosisHistory[0].scores;
      const earliest = diagnosisHistory[total - 1].scores;
      improvement = {
        completeness: latest.completeness - earliest.completeness,
        relevance: latest.relevance - earliest.relevance,
        professionalism: latest.professionalism - earliest.professionalism,
        layout: latest.layout - earliest.layout,
        overall: latest.overall - earliest.overall,
      };
    }

    return { total, avgOverall, bestScore, latestDate, avgScores, improvement };
  }, [diagnosisHistory]);

  // 雷达图用数据：如果有 2+ 条记录，对比最早 vs 最新
  const radarData = useMemo(() => {
    if (diagnosisHistory.length >= 2) {
      return {
        before: diagnosisHistory[diagnosisHistory.length - 1].scores,
        after: diagnosisHistory[0].scores,
      };
    }
    if (diagnosisHistory.length === 1) {
      const empty: ResumeScores = { completeness: 0, relevance: 0, professionalism: 0, layout: 0, overall: 0 };
      return { before: empty, after: diagnosisHistory[0].scores };
    }
    return null;
  }, [diagnosisHistory]);

  const hasData = diagnosisHistory.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">数据复盘</h1>
            <p className="text-muted-foreground mt-1">
              追踪每次简历诊断的评分变化与 AI 建议
            </p>
          </div>
          {hasData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("确定清除所有诊断历史记录？此操作不可撤销。")) {
                  clearDiagnosisHistory();
                }
              }}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              清除历史
            </Button>
          )}
        </div>
      </motion.div>

      {/* ═══════ 无数据空状态 ═══════ */}
      {!hasData && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">暂无诊断数据</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                前往「简历诊断」上传简历并完成 AI 诊断后，这里将自动展示评分趋势、维度分析和改进建议。
              </p>
              <Button asChild>
                <a href="/diagnosis">
                  <FileText className="mr-2 h-4 w-4" />
                  开始诊断
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══════ 有数据时展示 ═══════ */}
      {hasData && stats && (
        <>
          {/* 统计概览卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid gap-4 grid-cols-2 lg:grid-cols-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  诊断次数
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  平均评分
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreLevel(stats.avgOverall).color}`}>
                  {stats.avgOverall}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {stats.improvement ? "评分变化" : "最高评分"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.improvement ? (
                  <div className={`text-3xl font-bold ${stats.improvement.overall >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    {stats.improvement.overall >= 0 ? "+" : ""}{stats.improvement.overall}
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-foreground">{stats.bestScore}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  最近诊断
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-foreground">{stats.latestDate}</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 图表区 */}
          {radarData && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid gap-6 lg:grid-cols-2"
            >
              <Card className="h-[400px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    {diagnosisHistory.length >= 2 ? "首次 vs 最新对比" : "当前评分雷达图"}
                  </CardTitle>
                  <CardDescription>
                    {diagnosisHistory.length >= 2 ? "五维雷达图：灰色为首次诊断，蓝色为最新" : "五维评分可视化"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[calc(100%-80px)]">
                  <RadarComparison before={radarData.before} after={radarData.after} />
                </CardContent>
              </Card>

              {stats.improvement ? (
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      各维度提升幅度
                    </CardTitle>
                    <CardDescription>最新诊断 vs 首次诊断的分差</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-80px)]">
                    <ImprovementChart
                      before={diagnosisHistory[diagnosisHistory.length - 1].scores}
                      after={diagnosisHistory[0].scores}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[400px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      各维度明细
                    </CardTitle>
                    <CardDescription>当前诊断各维度得分</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 pt-4">
                      {(["completeness", "relevance", "professionalism", "layout"] as const).map((key) => {
                        const score = diagnosisHistory[0].scores[key];
                        const sl = getScoreLevel(score);
                        return (
                          <div key={key} className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{dimensionLabels[key]}</span>
                              <span className={`font-semibold ${sl.color}`}>{score}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                style={{
                                  backgroundColor: score >= 85 ? "#10b981" : score >= 75 ? "#3b82f6" : score >= 60 ? "#f59e0b" : "#ef4444",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* 诊断历史列表 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  诊断历史记录
                </CardTitle>
                <CardDescription>
                  共 {diagnosisHistory.length} 次诊断，点击展开查看详情
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[600px]">
                  <div className="space-y-3 pr-2">
                    {diagnosisHistory.map((item, i) => (
                      <DiagnosisHistoryCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
