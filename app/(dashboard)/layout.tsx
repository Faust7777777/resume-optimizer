"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { PageTransition } from "@/components/ui/page-transition";
import { useSidebarStore } from "@/store/sidebar-store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebarStore();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "lg:ml-[68px]" : "lg:ml-64"
        )}
      >
        <TopBar />
        <main id="main-content" className="flex-1">
          <div className="h-full p-4 md:p-6 lg:p-8">
            <PageTransition>
              {children}
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
