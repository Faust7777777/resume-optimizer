"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditHistory } from "@/types";
import { Wand2, Edit, Target, TrendingUp } from "lucide-react";

interface HistoryListProps {
  history: EditHistory[];
}

const typeIcons = {
  ai_polish: Wand2,
  manual_edit: Edit,
  jd_match: Target,
};

const typeLabels = {
  ai_polish: "AI润色",
  manual_edit: "手动编辑",
  jd_match: "JD匹配",
};

const typeColors = {
  ai_polish: "bg-purple-50 text-purple-700",
  manual_edit: "bg-blue-50 text-blue-700",
  jd_match: "bg-green-50 text-green-700",
};

function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function HistoryList({ history }: HistoryListProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>优化历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            暂无优化记录
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          优化历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {history.map((item) => {
              const Icon = typeIcons[item.type];
              const scoreDiff = item.scoresAfter.overall - item.scoresBefore.overall;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${typeColors[item.type]}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{item.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.timestamp)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={scoreDiff >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {scoreDiff >= 0 ? "+" : ""}
                      {scoreDiff}分
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span>优化前:</span>
                      <span className="font-medium">{item.scoresBefore.overall}分</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>优化后:</span>
                      <span className="font-medium text-primary">
                        {item.scoresAfter.overall}分
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
