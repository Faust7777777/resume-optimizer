"use client";

import { useCallback } from "react";
import { useResumeStore } from "@/store/resume-store";

interface MDEditorProps {
  className?: string;
}

export function MDEditor({ className }: MDEditorProps) {
  const { editorContent, setEditorContent, selectedText, setSelectedText } = useResumeStore();

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
    }
  }, [setSelectedText]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
        <span className="text-sm text-muted-foreground">
          {selectedText ? `已选择 ${selectedText.length} 个字符 → 右侧 AI 助手可润色` : "选中文字后可在右侧 AI 助手中润色"}
        </span>
      </div>

      {/* Editor */}
      <textarea
        className="flex-1 w-full resize-none p-4 font-mono text-sm bg-white dark:bg-background focus:outline-none"
        value={editorContent}
        onChange={(e) => setEditorContent(e.target.value)}
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
        placeholder="# 个人简历

## 基本信息
- 姓名：张三
- 电话：138****8888

## 工作经历
..."
      />
    </div>
  );
}
