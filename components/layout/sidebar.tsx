"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FileText,
  Edit3,
  MessageSquare,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSidebarStore } from "@/store/sidebar-store";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  {
    title: "简历诊断",
    href: "/diagnosis",
    icon: FileText,
    description: "智能分析简历质量",
  },
  {
    title: "模板库",
    href: "/templates",
    icon: FileText,
    description: "30份行业简历模板",
  },
  {
    title: "在线编辑",
    href: "/editor",
    icon: Edit3,
    description: "AI润色与实时预览",
  },
  {
    title: "经验赋能",
    href: "/experience",
    icon: Sparkles,
    description: "STAR法则经历生成",
  },
  {
    title: "模拟面试",
    href: "/interview",
    icon: MessageSquare,
    description: "AI面试演练",
  },
  {
    title: "数据复盘",
    href: "/analytics",
    icon: BarChart3,
    description: "优化效果追踪",
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebarStore();

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
          <Image
            src="/favicon-logo.jpg"
            alt="简优聘"
            width={36}
            height={36}
            className="h-9 w-9 object-cover"
            priority
          />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="font-semibold text-sm text-sidebar-foreground">ResumeAI</h1>
              <p className="text-xs text-sidebar-foreground/50">智能简历优化</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            const linkContent = (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-primary-foreground")} />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.title}</span>
                )}
                {isActive && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.title}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* Footer */}
      <div className="p-3 space-y-1">
        {(() => {
          const settingsLink = (
            <Link
              href="/settings"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                collapsed && "justify-center px-2",
                pathname === "/settings"
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Settings className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="text-sm font-medium">设置</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{settingsLink}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  设置
                </TooltipContent>
              </Tooltip>
            );
          }
          return settingsLink;
        })()}

        {/* Collapse button - desktop only */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="h-[18px] w-[18px] shrink-0 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="h-[18px] w-[18px] shrink-0" />
              <span className="text-xs">收起侧栏</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen hidden lg:block transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border [&>button]:hidden">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
