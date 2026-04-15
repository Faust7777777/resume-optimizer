import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarStore {
  collapsed: boolean;
  mobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setMobileOpen: (open) => set({ mobileOpen: open }),
    }),
    {
      name: "sidebar-store",
      partialize: (state) => ({ collapsed: state.collapsed }),
    }
  )
);
