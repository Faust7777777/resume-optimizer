"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InterviewRecord } from "@/types";
import { TrendingUp, MessageSquare, Star, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

interface InterviewReportProps {
  records: InterviewRecord[];
  position: string;
  reportMarkdown?: string;
}

export function InterviewReport({ records, position, reportMarkdown }: InterviewReportProps) {
  if (reportMarkdown && reportMarkdown.trim()) {
    return (
      <Card className="h-[calc(100vh-16rem)] min-h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            面试报告
          </CardTitle>
          <CardDescription>{position} - AI 结构化评估结果</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="pr-4 prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                {reportMarkdown}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="h-[calc(100vh-16rem)] min-h-[400px]">
        <CardHeader>
          <CardTitle>面试报告</CardTitle>
          <CardDescription>完成面试后查看详细报告</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-100px)]">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3" />
            <p>暂无面试记录</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const averageScore = Math.round(
    records.reduce((sum, r) => sum + r.score, 0) / records.length
  );

  const getScoreLevel = (score: number) => {
    if (score >= 85) return { label: "优秀", color: "text-green-600" };
    if (score >= 70) return { label: "良好", color: "text-primary" };
    if (score >= 60) return { label: "合格", color: "text-orange-600" };
    return { label: "需改进", color: "text-red-600" };
  };

  const level = getScoreLevel(averageScore);

  return (
    <Card className="h-[calc(100vh-16rem)] min-h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          面试报告
        </CardTitle>
        <CardDescription>{position} - 共 {records.length} 道题</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6 pr-4">
            {/* Overall Score */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">综合评分</span>
                <Badge className={level.color}>{level.label}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{averageScore}</span>
                <span className="text-muted-foreground">/ 100</span>
              </div>
              <Progress value={averageScore} className="mt-3" />
            </div>

            {/* Score Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                各题得分
              </h4>
              <div className="space-y-2">
                {records.map((record, index) => (
                  <div key={record.id} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-8">Q{index + 1}</span>
                    <Progress value={record.score} className="flex-1" />
                    <span className={`text-sm font-medium w-10 text-right ${getScoreLevel(record.score).color}`}>
                      {record.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Feedback */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                详细反馈
              </h4>
              <div className="space-y-3">
                {records.map((record, index) => (
                  <div key={record.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium">
                        问题 {index + 1}
                      </span>
                      <Badge variant="outline" className={getScoreLevel(record.score).color}>
                        {record.score}分
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {record.question.question}
                    </p>
                    <p className="text-sm text-foreground">{record.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="text-sm font-medium text-foreground mb-2">总结建议</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {averageScore >= 80 ? (
                  <>
                    <li>整体表现优秀，继续保持！</li>
                    <li>建议在回答中增加更多量化数据</li>
                  </>
                ) : averageScore >= 60 ? (
                  <>
                    <li>回答结构可以更加清晰，建议使用STAR法则</li>
                    <li>多准备具体的项目案例</li>
                    <li>加强对技术细节的描述</li>
                  </>
                ) : (
                  <>
                    <li>建议系统学习面试技巧</li>
                    <li>多进行模拟面试练习</li>
                    <li>准备更多具体的项目案例</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
