"use client";

import { useState } from "react";
import { MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InterviewSetup } from "@/components/interview/interview-setup";
import { ChatInterface } from "@/components/interview/chat-interface";
import { InterviewReport } from "@/components/interview/interview-report";
import { motion } from "framer-motion";

type InterviewType = "technical" | "behavioral" | "mixed";

interface InterviewConfig {
  position: string;
  type: InterviewType;
  duration: number;
}

export default function InterviewPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState("");

  const handleStart = (newConfig: InterviewConfig) => {
    setConfig(newConfig);
    setReportMarkdown("");
    setIsStarted(true);
  };

  const handleReset = () => {
    setIsStarted(false);
    setReportMarkdown("");
    setConfig(null);
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
            模拟面试
          </h1>
          <p className="text-muted-foreground mt-1">
            基于简历和JD生成个性化面试题，进行AI模拟面试演练
          </p>
        </div>
        {isStarted && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            重新开始
          </Button>
        )}
      </motion.div>

      {!isStarted ? (
        <div className="max-w-md mx-auto">
          <InterviewSetup onStart={handleStart} />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5 min-h-0">
          <div className="lg:col-span-3 min-h-0">
            <ChatInterface
              config={config || { position: "", type: "mixed", duration: 30 }}
              onReport={setReportMarkdown}
            />
          </div>
          <div className="lg:col-span-2 min-h-0">
            <InterviewReport
              records={[]}
              position={config?.position || ""}
              reportMarkdown={reportMarkdown}
            />
          </div>
        </div>
      )}

      {/* Tips */}
      {!isStarted && (
        <Card className="max-w-2xl mx-auto mt-8 border-border/50">
          <CardContent className="p-6">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              面试技巧提示
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
              <li>使用 STAR 法则回答行为类问题（情境→任务→行动→结果）</li>
              <li>技术问题要展示思考过程，不只是给出答案</li>
              <li>准备具体的项目案例，用数据支撑你的成果</li>
              <li>保持自信，不懂的问题可以诚实说明并尝试分析</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
