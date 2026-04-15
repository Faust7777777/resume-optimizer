"use client";

import { useResumeStore } from "@/store/resume-store";
import ReactMarkdown from "react-markdown";

interface ResumePreviewProps {
  className?: string;
}

export function ResumePreview({ className }: ResumePreviewProps) {
  const { editorContent } = useResumeStore();

  return (
    <div className={`h-full overflow-auto bg-card ${className}`}>
      <div className="prose prose-slate dark:prose-invert max-w-none p-8">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-foreground border-b-2 border-border pb-2 mb-4">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-lg font-semibold text-foreground mt-6 mb-3 pb-1 border-b border-border/50">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-base font-medium text-foreground mt-4 mb-2">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-3">
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li className="ml-2">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">
                {children}
              </strong>
            ),
            code: ({ children }) => (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono text-foreground">
                {children}
              </code>
            ),
          }}
        >
          {editorContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
