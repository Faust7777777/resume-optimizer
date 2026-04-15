"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/resume-store";

export function EditorToolbar() {
  const { editorContent } = useResumeStore();

  const handleExport = () => {
    const blob = new Blob([editorContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        导出 Markdown
      </Button>
    </div>
  );
}
