"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useSidebarStore } from "@/store/sidebar-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const pageNames: Record<string, string> = {
  "/diagnosis": "简历诊断",
  "/matching": "岗位匹配",
  "/editor": "在线编辑",
  "/experience": "经验赋能",
  "/interview": "模拟面试",
  "/analytics": "数据复盘",
  "/settings": "设置",
};

export function TopBar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { setMobileOpen } = useSidebarStore();

  const currentPage = pageNames[pathname] || "控制台";

  return (
    <header className="sticky top-0 z-30 h-14 glass border-b border-border/50">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        {/* Left: hamburger + breadcrumb */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 cursor-pointer"
            onClick={() => setMobileOpen(true)}
            aria-label="打开导航菜单"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <nav className="flex items-center gap-1.5 text-sm">
            <Image
              src="/favicon-logo.jpg"
              alt="简优聘"
              width={20}
              height={20}
              className="hidden sm:inline-block h-5 w-5 rounded-sm object-cover"
            />
            <span className="text-muted-foreground hidden sm:inline">简优聘</span>
            <span className="text-muted-foreground/50 hidden sm:inline">/</span>
            <span className="font-medium text-foreground">{currentPage}</span>
          </nav>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 cursor-pointer"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="切换主题"
              >
                <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>切换主题</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 cursor-pointer"
                aria-label="用户设置"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>用户设置</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
