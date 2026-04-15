"use client";

import Link from "next/link";
import {
  FileText,
  Target,
  Edit3,
  MessageSquare,
  BarChart3,
  Sparkles,
  ArrowRight,
  Zap,
  Upload,
  Brain,
  Download,
  CheckCircle,
  ChevronRight,
  LayoutTemplate,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

const features = [
  {
    title: "智能诊断",
    description: "基于百万级简历数据训练的评分模型，从内容完整度、岗位相关性、表达专业性、排版规范性四个维度自动生成综合评分报告。",
    icon: FileText,
    color: "bg-blue-500/10 text-blue-600",
    href: "/diagnosis",
  },
  {
    title: "精准匹配",
    description: "依托千万级招聘岗位数据与自然语言处理技术，自动对比简历与JD关键词重合度，高亮显示缺失词汇并给出补充场景建议。",
    icon: Target,
    color: "bg-emerald-500/10 text-emerald-600",
    href: "/matching",
  },
  {
    title: "AI润色编辑",
    description: "内置STAR法则引擎，实时检测语法错误、被动语态滥用、冗余表述等问题，一键扩写量化成果或转换风格。",
    icon: Edit3,
    color: "bg-violet-500/10 text-violet-600",
    href: "/editor",
  },
  {
    title: "经验赋能",
    description: "针对缺乏项目经历的用户，智能推送高质量参考内容，基于2~3个关键词自动生成符合STAR逻辑的经历描述。",
    icon: Sparkles,
    color: "bg-amber-500/10 text-amber-600",
    href: "/experience",
  },
  {
    title: "模拟面试",
    description: "集成多模态AI面试官引擎与面试知识库，提供从题库生成、实时交互到深度复盘的全流程面试能力提升服务。",
    icon: MessageSquare,
    color: "bg-pink-500/10 text-pink-600",
    href: "/interview",
  },
  {
    title: "数据复盘",
    description: "自动记录每次修改操作，从关键词覆盖率、内容完整度等维度生成环比变化曲线，支持可视化报告一键导出。",
    icon: BarChart3,
    color: "bg-cyan-500/10 text-cyan-600",
    href: "/analytics",
  },
];

const steps = [
  {
    icon: Upload,
    title: "上传简历",
    description: "支持 PDF、DOCX 格式，或直接粘贴简历文本",
  },
  {
    icon: Brain,
    title: "AI 智能分析",
    description: "多维度诊断评分，精准定位优化方向",
  },
  {
    icon: Download,
    title: "优化导出",
    description: "一键润色编辑，导出专业级简历",
  },
];

const stats = [
  { value: "100万+", label: "简历数据训练" },
  { value: "1000万+", label: "招聘数据支撑" },
  { value: "20+", label: "行业模板覆盖" },
  { value: "4维度", label: "智能评分体系" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl"
      >
        <div className="glass rounded-2xl border border-border/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">ResumeAI</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">功能</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">流程</a>
              <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">数据</a>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Link href="/diagnosis">
                <Button size="sm" className="cursor-pointer bg-primary hover:bg-primary/90">
                  开始使用
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-400/5 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} transition={{ duration: 0.5 }}>
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                AI 驱动 · Coze 工作流加持
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            >
              让 AI 重新定义
              <br />
              <span className="text-primary">简历优化体验</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
            >
              从智能诊断到模拟面试，7大AI功能模块全方位赋能求职者。
              <br className="hidden sm:block" />
              基于百万级简历数据与千万级招聘信息，精准提升每一份简历。
            </motion.p>

            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/diagnosis">
                <Button size="lg" className="cursor-pointer h-12 px-8 text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg shadow-cta/25">
                  立即优化简历
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="cursor-pointer h-12 px-8 text-base">
                  了解更多
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              7大核心功能模块
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mt-4 text-lg text-muted-foreground"
            >
              覆盖简历优化全链路，每一步都有 AI 智能助手
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} variants={fadeInUp} transition={{ duration: 0.4 }}>
                  <Link href={feature.href}>
                    <Card className="h-full group cursor-pointer border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                      <CardContent className="p-6">
                        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                        <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          了解详情
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}

            {/* Template card */}
            <motion.div variants={fadeInUp} transition={{ duration: 0.4 }}>
              <Card className="h-full group cursor-pointer border-dashed border-2 border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 font-semibold text-muted-foreground">行业模板</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    20+行业、80+细分岗位专属模板，即将上线
                  </p>
                  <Badge variant="secondary" className="mt-3">即将推出</Badge>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              三步完成简历优化
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mt-4 text-lg text-muted-foreground"
            >
              简单直觉的操作流程，无需学习成本
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.4 }}
                  className="relative text-center"
                >
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-border" />
                  )}
                  <div className="relative inline-flex">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary">{stat.value}</div>
                <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
            >
              准备好提升简历竞争力了吗？
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground"
            >
              免费使用，无需注册，数据仅存储在您的浏览器中
            </motion.p>
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/diagnosis">
                <Button size="lg" className="cursor-pointer h-12 px-8 text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg shadow-cta/25">
                  立即免费体验
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              transition={{ duration: 0.5 }}
              className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success" />
                完全免费
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success" />
                隐私安全
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-success" />
                无需注册
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">ResumeAI</span>
              <span className="text-sm text-muted-foreground">· 智能简历优化平台</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Powered by Coze Workflow · Built with Next.js & shadcn/ui
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
