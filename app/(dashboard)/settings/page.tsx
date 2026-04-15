"use client";

import { useState } from "react";
import { Settings, Trash2, Download, Moon, Sun, Monitor, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/resume-store";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { clearHistory, editorContent, setEditorContent } = useResumeStore();
  const { theme, setTheme } = useTheme();
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleErase = (key: string, label: string) => {
    if (showConfirm === key) {
      if (key === "history") {
        clearHistory();
      } else if (key === "editor") {
        setEditorContent("");
      } else if (key === "all") {
        clearHistory();
        setEditorContent("");
        localStorage.removeItem("resume-store");
      }
      toast.success(`${label}已清除`);
      setShowConfirm(null);
    } else {
      setShowConfirm(key);
      setTimeout(() => setShowConfirm(null), 3000);
    }
  };

  const handleExportData = () => {
    const store = localStorage.getItem("resume-store");
    if (!store) {
      toast.error("没有可导出的数据");
      return;
    }
    const blob = new Blob([store], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("数据已导出");
  };

  const themeOptions = [
    { value: "light", icon: Sun, label: "浅色" },
    { value: "dark", icon: Moon, label: "深色" },
    { value: "system", icon: Monitor, label: "跟随系统" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          设置
        </h1>
        <p className="text-muted-foreground mt-1">
          管理偏好设置和数据
        </p>
      </motion.div>

      {/* Theme */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              外观
            </CardTitle>
            <CardDescription>选择你喜欢的主题模式</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                    theme === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${theme === value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${theme === value ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              数据管理
            </CardTitle>
            <CardDescription>导出或清除你的数据</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              导出所有数据 (JSON)
            </Button>

            <div className="border-t border-border/50 pt-3 space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                以下操作不可撤销
              </p>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive cursor-pointer"
                onClick={() => handleErase("history", "优化历史")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {showConfirm === "history" ? "再次点击确认清除" : "清除优化历史"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive cursor-pointer"
                onClick={() => handleErase("editor", "编辑器内容")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {showConfirm === "editor" ? "再次点击确认清除" : "清除编辑器内容"}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive cursor-pointer"
                onClick={() => handleErase("all", "所有数据")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {showConfirm === "all" ? "再次点击确认清除全部" : "清除所有数据"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* About */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">R</span>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">ResumeAI</p>
                <p className="text-xs text-muted-foreground">v1.0.0 · 数据存储于本地浏览器</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
