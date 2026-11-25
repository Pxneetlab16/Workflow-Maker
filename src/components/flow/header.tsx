'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2, Undo2, Redo2, Check, X, Download, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFlowStore } from '@/lib/flow-store'
import { useUIStore } from '@/lib/ui-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
import { toast } from '@/hooks/use-toast'

export function Header() {
  const activeId = useFlowStore((s) => s.activeId)
  const project = useFlowStore((s) => (s.activeId ? s.projects[s.activeId] : null))
  const history = useFlowStore((s) => (s.activeId ? s.histories[s.activeId] : null))
  const renameProject = useFlowStore((s) => s.renameProject)
  const deleteProject = useFlowStore((s) => s.deleteProject)
  const createProject = useFlowStore((s) => s.createProject)
  const undo = useFlowStore((s) => s.undo)
  const redo = useFlowStore((s) => s.redo)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar)
  const downloadFn = useUIStore((s) => s.downloadFn)

  const canUndo = (history?.past.length || 0) > 0
  const canRedo = (history?.future.length || 0) > 0

  if (!project) {
    return (
      <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#0a0a0f]/60 px-4 backdrop-blur-xl">
        <div className="text-sm text-white/40">No project selected — create one from the sidebar.</div>
      </header>
    )
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#0a0a0f]/60 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={toggleMobileSidebar}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (name.trim()) renameProject(project.id, name.trim())
              setEditing(false)
            }}
            className="flex items-center gap-1.5"
          >
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-56 bg-white/5 border-white/15 text-white"
            />
            <IconBtn icon={Check} label="Save" onClick={() => { if (name.trim()) renameProject(project.id, name.trim()); setEditing(false) }} />
            <IconBtn icon={X} label="Cancel" onClick={() => setEditing(false)} />
          </form>
        ) : (
          <button
            onClick={() => {
              setName(project.name)
              setEditing(true)
            }}
            className="group flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-white hover:bg-white/10 transition-colors"
          >
            <span className="max-w-[40vw] truncate text-sm font-semibold sm:max-w-none">{project.name}</span>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-white/30 group-hover:text-white/70" />
          </button>
        )}
        <span className="ml-1 hidden items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40 sm:inline-flex">
          {project.nodes.length} nodes · {project.edges.length} wires
        </span>
      </div>

      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <IconBtn
            icon={Undo2}
            label="Undo"
            disabled={!canUndo}
            onClick={() => { undo(); toast({ title: 'Undo' }) }}
          />
          <IconBtn
            icon={Redo2}
            label="Redo"
            disabled={!canRedo}
            onClick={() => { redo(); toast({ title: 'Redo' }) }}
          />

          <div className="mx-1.5 h-5 w-px bg-white/10" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => createProject('Untitled Flow')}
            className="gap-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Add Flow
          </Button>

          <IconBtn
            icon={Download}
            label="Download PNG"
            disabled={!downloadFn}
            onClick={() => downloadFn && downloadFn()}
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="grid h-8 w-8 place-items-center rounded-md text-white/60 transition-colors hover:bg-rose-500/15 hover:text-rose-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  All nodes and connections in this flow will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={() => {
                    deleteProject(project.id)
                    toast({ title: 'Flow deleted' })
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TooltipProvider>
      </div>
    </header>
  )
}

function IconBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Undo2
  label: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'grid h-8 w-8 place-items-center rounded-md transition-colors',
            disabled
              ? 'text-white/20 cursor-not-allowed'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}
