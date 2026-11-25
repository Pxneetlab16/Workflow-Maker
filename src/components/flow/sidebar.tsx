'use client'

import { useState } from 'react'
import { Home, Plus, ChevronRight, ChevronDown, Folder, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFlowStore } from '@/lib/flow-store'
import { useUIStore } from '@/lib/ui-store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function Sidebar() {
  const [expanded, setExpanded] = useState(true)
  const projects = useFlowStore((s) => s.projects)
  const activeId = useFlowStore((s) => s.activeId)
  const setActive = useFlowStore((s) => s.setActive)
  const createProject = useFlowStore((s) => s.createProject)
  const deleteProject = useFlowStore((s) => s.deleteProject)
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()

  const ordered = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt)
  const active = activeId ? projects[activeId] : null

  const content = (
    <aside className="flex h-full w-full flex-col border-r border-white/10 bg-[#0a0a0f]/95 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <img
          src="/icon-192.png"
          alt="Workflow Maker"
          className="h-9 w-9 rounded-xl shadow-lg shadow-violet-500/30"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-white">Workflow Maker</span>
          <span className="text-[10px] text-white/40">AI Flow Studio</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="ml-auto grid h-7 w-7 place-items-center rounded-md text-white/50 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-3 pb-2">
        <SidebarButton
          icon={Home}
          label="Home"
          active={false}
          onClick={() => {
            if (activeId) setActive(activeId)
          }}
        />
        <SidebarButton
          icon={Plus}
          label="New Flow"
          accent
          onClick={() => createProject('Untitled Flow')}
        />

        {/* Other flows */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="group mt-3 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          Other Flows
          <span className="ml-auto text-white/30">{ordered.length}</span>
        </button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <ScrollArea className="h-auto max-h-[calc(100vh-280px)]">
                <div className="space-y-0.5 pt-1">
                  {ordered.length === 0 && (
                    <p className="px-3 py-3 text-xs text-white/30">No flows yet. Create one.</p>
                  )}
                  {ordered.map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        'group flex items-center gap-2 rounded-lg px-2.5 py-2 transition-all',
                        activeId === p.id
                          ? 'bg-white/10 text-white shadow-inner'
                          : 'text-white/55 hover:bg-white/5 hover:text-white/80'
                      )}
                      onClick={() => setActive(p.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <Folder className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate text-xs font-medium">{p.name}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="hidden h-5 w-5 place-items-center rounded text-white/40 hover:bg-rose-500/20 hover:text-rose-300 group-hover:grid"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete flow?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{p.name}" and all its nodes. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteProject(p.id)
                              }}
                              className="bg-rose-600 hover:bg-rose-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-auto border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-bold text-black">
            Z
          </div>
          <div className="flex flex-col leading-tight">
            <span className="max-w-[140px] truncate text-xs font-medium text-white/80">{active?.name || 'No project'}</span>
            <span className="text-[10px] text-white/40">{active ? `${active.nodes.length} nodes` : 'select a flow'}</span>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden h-full w-[230px] shrink-0 md:block">{content}</div>

      {/* Mobile slide-over */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-[260px] max-w-[80vw] shadow-2xl"
            >
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function SidebarButton({
  icon: Icon,
  label,
  active,
  accent,
  onClick,
}: {
  icon: typeof Home
  label: string
  active?: boolean
  accent?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
        active
          ? 'bg-white/10 text-white shadow-inner'
          : accent
          ? 'text-white/90 hover:bg-white/10'
          : 'text-white/55 hover:bg-white/5 hover:text-white/85'
      )}
    >
      <span
        className={cn(
          'grid h-6 w-6 place-items-center rounded-md transition-colors',
          accent ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white' : 'bg-white/10 text-white/70 group-hover:bg-white/15'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="font-medium">{label}</span>
      {accent && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
      )}
    </button>
  )
}
