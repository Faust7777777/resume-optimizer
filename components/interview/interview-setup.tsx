"use client";

import { useState } from "react";
import { Play, Briefcase, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type InterviewType = "technical" | "behavioral" | "mixed";

interface InterviewSetupProps {
  onStart: (config: {
    position: string;
    type: InterviewType;
    duration: number;
  }) => void;
  isLoading?: boolean;
}

export function InterviewSetup({ onStart, isLoading }: InterviewSetupProps) {
  const [position, setPosition] = useState("");
  const [type, setType] = useState<InterviewType>("mixed");
  const [duration, setDuration] = useState(30);

  const handleStart = () => {
    if (position.trim()) {
      onStart({ position: position.trim(), type, duration });
    }
  };

  const interviewTypes: { value: InterviewType; label: string; description: string }[] = [
    { value: "technical", label: "技术面试", description: "考察专业技能和项目经验" },
    { value: "behavioral", label: "行为面试", description: "考察软技能和团队协作" },
    { value: "mixed", label: "综合面试", description: "技术与行为问题结合" },
  ];

  const durations = [15, 30, 45, 60];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          面试设置
        </CardTitle>
        <CardDescription>配置面试参数以生成个性化问题</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Position Input */}
        <div className="space-y-2">
          <Label htmlFor="position">目标岗位</Label>
          <Input
            id="position"
            placeholder="例如：高级前端工程师"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        {/* Interview Type */}
        <div className="space-y-2">
          <Label>面试类型</Label>
          <div className="grid grid-cols-1 gap-2">
            {interviewTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  type === t.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div>
                  <div className="font-medium text-sm">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.description}</div>
                </div>
                {type === t.value && (
                  <div className="h-4 w-4 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            预计时长（分钟）
          </Label>
          <div className="flex gap-2">
            {durations.map((d) => (
              <Badge
                key={d}
                variant={duration === d ? "default" : "outline"}
                className="cursor-pointer px-4 py-2"
                onClick={() => setDuration(d)}
              >
                {d}分钟
              </Badge>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleStart}
          disabled={!position.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              准备中...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              开始面试
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
