"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Lightbulb, CheckCircle2 } from "lucide-react";
import { DiagnosisSuggestion } from "@/types";
import { getPriorityColor, getCategoryLabel } from "@/lib/ai-mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SuggestionsListProps {
  suggestions: DiagnosisSuggestion[];
  onActionClick?: (suggestion: DiagnosisSuggestion) => void;
}

export function SuggestionsList({ suggestions, onActionClick }: SuggestionsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 按优先级排序
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      high: "高",
      medium: "中",
      low: "低",
    };
    return labels[priority] || priority;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <Lightbulb className="h-4 w-4" />;
      case "low":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {sortedSuggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className={cn(
            "rounded-lg border transition-all",
            expandedId === suggestion.id
              ? "border-blue-200 bg-blue-50/30"
              : "border-border bg-card hover:border-primary/30"
          )}
        >
          <button
            onClick={() => toggleExpand(suggestion.id)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  getPriorityColor(suggestion.priority)
                )}
              >
                {getPriorityIcon(suggestion.priority)}
              </div>
              <div>
                <h4 className="font-medium text-foreground">{suggestion.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {getCategoryLabel(suggestion.category)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", getPriorityColor(suggestion.priority))}
                  >
                    {getPriorityLabel(suggestion.priority)}优先级
                  </Badge>
                </div>
              </div>
            </div>
            {expandedId === suggestion.id ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {expandedId === suggestion.id && (
            <div className="px-4 pb-4">
              <div className="pl-11">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {suggestion.description}
                </p>
                {suggestion.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => onActionClick?.(suggestion)}
                  >
                    {suggestion.action}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
