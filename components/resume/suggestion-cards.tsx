"use client";

import { Lightbulb, Plus, Pencil, Highlighter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JDAnalysis } from "@/types";

interface SuggestionCardsProps {
  analysis: JDAnalysis;
}

const typeIcons = {
  add: Plus,
  modify: Pencil,
  highlight: Highlighter,
};

const typeLabels = {
  add: "添加",
  modify: "修改",
  highlight: "强调",
};

const typeColors = {
  add: "bg-blue-50 text-blue-700 border-blue-200",
  modify: "bg-orange-50 text-orange-700 border-orange-200",
  highlight: "bg-purple-50 text-purple-700 border-purple-200",
};

export function SuggestionCards({ analysis }: SuggestionCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          优化建议
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analysis.suggestions.map((suggestion, index) => {
            const Icon = typeIcons[suggestion.type];
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${typeColors[suggestion.type]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {typeLabels[suggestion.type]}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {suggestion.content}
                    </p>
                    <p className="text-xs opacity-80">
                      原因：{suggestion.reason}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
