"use client";

import { useState } from "react";
import { Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useResumeStore } from "@/store/resume-store";
import { analyzeJD } from "@/lib/ai-client";
import { toast } from "sonner";

interface JDInputProps {
  onAnalysisComplete?: () => void;
}

export function JDInput({ onAnalysisComplete }: JDInputProps) {
  const [jdText, setJdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { setJdAnalysis, editorContent } = useResumeStore();

  const handleAnalyze = async () => {
    if (!jdText.trim()) return;

    setIsAnalyzing(true);

    try {
      const analysis = await analyzeJD(editorContent, jdText);
      setJdAnalysis(analysis);
      onAnalysisComplete?.();
      toast.success("JD分析完成");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "分析失败，请检查API配置");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Textarea
        placeholder={`请在此处粘贴职位描述(JD)...

示例：
职位：高级前端工程师

岗位职责：
1. 负责公司核心产品的前端架构设计和开发
2. 优化前端性能，提升用户体验
3. 参与技术选型和代码评审

任职要求：
1. 精通React、TypeScript
2. 熟悉微前端架构
3. 具备性能优化经验
4. 良好的团队协作能力`}
        className="h-[400px] resize-none"
        value={jdText}
        onChange={(e) => setJdText(e.target.value)}
      />
      <Button
        className="w-full"
        onClick={handleAnalyze}
        disabled={isAnalyzing || !jdText.trim()}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            AI分析中...
          </>
        ) : (
          <>
            <Target className="mr-2 h-4 w-4" />
            开始匹配分析
          </>
        )}
      </Button>
    </div>
  );
}
