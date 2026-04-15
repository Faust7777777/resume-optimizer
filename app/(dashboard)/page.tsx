"use client";

import { FileText, Target, Edit3, MessageSquare, BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

const modules = [
  {
    title: "简历诊断",
    description: "智能分析简历质量，四维度评分",
    icon: FileText,
    href: "/diagnosis",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "岗位匹配",
    description: "JD分析与关键词匹配度检测",
    icon: Target,
    href: "/matching",
    color: "bg-emerald-500/10 text-emerald-600",
  },
  {
    title: "在线编辑",
    description: "Markdown编辑器 + AI润色",
    icon: Edit3,
    href: "/editor",
    color: "bg-violet-500/10 text-violet-600",
  },
  {
    title: "经验赋能",
    description: "STAR法则智能经历生成",
    icon: Sparkles,
    href: "/experience",
    color: "bg-amber-500/10 text-amber-600",
  },
  {
    title: "模拟面试",
    description: "基于简历生成个性化面试题",
    icon: MessageSquare,
    href: "/interview",
    color: "bg-pink-500/10 text-pink-600",
  },
  {
    title: "数据复盘",
    description: "追踪优化效果与历史记录",
    icon: BarChart3,
    href: "/analytics",
    color: "bg-cyan-500/10 text-cyan-600",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          欢迎使用 ResumeAI
        </h1>
        <p className="text-muted-foreground mt-1">
          一站式简历优化与求职辅助工具，让您的简历脱颖而出
        </p>
      </motion.div>

      {/* Quick Start */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.08),transparent)]" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">快速开始</h2>
                <p className="text-primary-foreground/70 mt-1">上传您的简历，获取AI智能诊断报告</p>
              </div>
              <Link href="/diagnosis">
                <Button variant="secondary" className="cursor-pointer bg-white/15 text-primary-foreground hover:bg-white/25 border-0 backdrop-blur-sm">
                  开始诊断
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modules Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
        }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <motion.div key={module.href} variants={fadeInUp} transition={{ duration: 0.35 }}>
              <Link href={module.href}>
                <Card className="h-full cursor-pointer group border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`h-10 w-10 rounded-lg ${module.color} flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors duration-200" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardTitle className="text-base">{module.title}</CardTitle>
                    <CardDescription className="mt-1">{module.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">推荐使用流程</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>在「简历诊断」模块上传您的简历，获取初始评分</li>
              <li>使用「在线编辑」模块修改和完善简历内容</li>
              <li>在「岗位匹配」模块粘贴目标JD，检查匹配度</li>
              <li>通过「模拟面试」模块进行面试演练</li>
              <li>在「数据复盘」模块查看优化效果</li>
            </ol>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
