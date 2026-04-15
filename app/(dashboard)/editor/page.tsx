"use client";

import { useState } from "react";
import { Edit3, Eye, Bot, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MDEditor } from "@/components/resume/md-editor";
import { ResumePreview } from "@/components/resume/resume-preview";
import { EditorToolbar } from "@/components/resume/editor-toolbar";
import { AIChatSidebar } from "@/components/resume/ai-chat-sidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function EditorPage() {
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">在线编辑</h1>
          <p className="text-muted-foreground mt-1">
            Markdown编辑器 + 实时预览 + AI润色助手
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showChat ? "default" : "outline"}
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="gap-1.5"
          >
            {showChat ? (
              <><PanelRightClose className="h-4 w-4" /> 收起助手</>
            ) : (
              <><Bot className="h-4 w-4" /> AI 助手</>
            )}
          </Button>
          <EditorToolbar />
        </div>
      </motion.div>

      {/* Main Content: Editor + Preview + Chat */}
      <div className="flex gap-4">
        {/* Left: Editor + Preview (flex or grid based on chat visibility) */}
        <div className={`flex-1 min-w-0 grid gap-4 ${showChat ? "lg:grid-cols-1 xl:grid-cols-2" : "lg:grid-cols-2"}`}>
          {/* Markdown Editor */}
          <Card className="h-[calc(100vh-14rem)] min-h-[400px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Edit3 className="h-4 w-4 text-primary" />
                Markdown 编辑器
              </CardTitle>
              <CardDescription>
                选中文字后可在右侧 AI 助手中快捷润色
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <MDEditor />
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="h-[calc(100vh-14rem)] min-h-[400px] flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-primary" />
                实时预览
              </CardTitle>
              <CardDescription>简历渲染效果</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ResumePreview />
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <Card className="h-[calc(100vh-14rem)] min-h-[400px] w-[360px] flex flex-col overflow-hidden">
                <AIChatSidebar />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
