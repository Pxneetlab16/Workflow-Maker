import { create } from 'zustand'

interface UIState {
  mobileSidebarOpen: boolean
  setMobileSidebarOpen: (v: boolean) => void
  toggleMobileSidebar: () => void
  // set by the canvas; called by the header download button
  downloadFn: (() => Promise<void>) | null
  setDownloadFn: (fn: (() => Promise<void>) | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),
  toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
  downloadFn: null,
  setDownloadFn: (fn) => set({ downloadFn: fn }),
}))
