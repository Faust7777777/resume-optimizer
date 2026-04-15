"use client";

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JDAnalysis } from "@/types";

interface KeywordHighlightProps {
  analysis: JDAnalysis;
}

export function KeywordHighlight({ analysis }: KeywordHighlightProps) {
  const matchRate = Math.round(
    (analysis.matchedKeywords.length / analysis.keywords.length) * 100
  );

  return (
    <div className="space-y-6">
      {/* Match Rate */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <div className="text-sm text-muted-foreground">关键词匹配度</div>
          <div className="text-2xl font-bold text-foreground">{matchRate}%</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">
            {analysis.matchedKeywords.length} / {analysis.keywords.length}
          </div>
          <div className="text-xs text-muted-foreground/60">已匹配 / 总关键词</div>
        </div>
      </div>

      {/* Matched Keywords */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm font-medium text-foreground">已匹配关键词</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.matchedKeywords.map((keyword) => (
            <Badge
              key={keyword}
              variant="secondary"
              className="bg-green-50 text-green-700 hover:bg-green-100"
            >
              {keyword}
            </Badge>
          ))}
        </div>
      </div>

      {/* Missing Keywords */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-foreground">缺失关键词</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.missingKeywords.map((keyword) => (
            <Badge
              key={keyword}
              variant="secondary"
              className="bg-red-50 text-red-700 hover:bg-red-100"
            >
              {keyword}
            </Badge>
          ))}
        </div>
      </div>

      {/* All Keywords */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-foreground">JD全部关键词</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.keywords.map((keyword) => {
            const isMatched = analysis.matchedKeywords.includes(keyword);
            return (
              <Badge
                key={keyword}
                variant="outline"
                className={
                  isMatched
                    ? "border-green-200 text-green-700"
                    : "border-red-200 text-red-700"
                }
              >
                {keyword}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}
