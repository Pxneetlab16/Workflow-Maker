'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Check } from 'lucide-react'
import { CARD_COLORS, type CardColor, useFlowStore } from '@/lib/flow-store'
import { TASK_TYPES } from '@/lib/task-types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'

interface Props {
  open: boolean
  onClose: () => void
}

export function CardCreateModal({ open, onClose }: Props) {
  const addCard = useFlowStore((s) => s.addCard)
  const [name, setName] = useState('')
  const [taskType, setTaskType] = useState(TASK_TYPES[0].id)
  const [color, setColor] = useState<CardColor>('violet')
  const [caption, setCaption] = useState('')
  const [query, setQuery] = useState('')
  const [openedOnce, setOpenedOnce] = useState(false)

  // reset the form exactly once when the modal opens
  if (open && !openedOnce) {
    setOpenedOnce(true)
    setName('')
    setTaskType(TASK_TYPES[0].id)
    setColor('violet')
    setCaption('')
    setQuery('')
  }
  if (!open && openedOnce) {
    setOpenedOnce(false)
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return TASK_TYPES
    return TASK_TYPES.filter((t) => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
  }, [query])

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Give your card a name', variant: 'destructive' })
      return
    }
    // random position on canvas (offset around center-ish)
    const x = 120 + Math.random() * 420
    const y = 100 + Math.random() * 320
    addCard({ label: name.trim(), taskType, color, caption: caption.trim() || undefined, position: { x, y } })
    toast({ title: 'Card created', description: `"${name.trim()}" added to canvas` })
    onClose()
  }

  const c = CARD_COLORS[color]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-[min(560px,92vw)] overflow-hidden rounded-2xl border border-white/15 bg-[#0c0c14]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
            style={{ boxShadow: `0 30px 80px -20px rgba(0,0,0,0.8), 0 0 40px ${c.glow}` }}
          >
            {/* header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: `linear-gradient(180deg, ${c.soft}66, transparent)`, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.dot, boxShadow: `0 0 10px ${c.glow}` }} />
                <h2 className="text-base font-semibold text-white">Create Card</h2>
              </div>
              <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md text-white/50 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              {/* name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Name this card</label>
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Research Agent"
                  className="bg-white/5 border-white/15 text-white placeholder:text-white/30"
                />
              </div>

              {/* task type */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  What kind of task? <span className="ml-1 normal-case text-white/25">({TASK_TYPES.length} types)</span>
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search task types..."
                    className="pl-8 bg-white/5 border-white/15 text-white placeholder:text-white/30"
                  />
                </div>
                <ScrollArea className="h-44 rounded-lg border border-white/10 bg-black/30">
                  <div className="grid grid-cols-2 gap-1.5 p-2">
                    {filtered.map((t) => {
                      const Icon = t.icon
                      const active = taskType === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTaskType(t.id)}
                          className={cn(
                            'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all',
                            active
                              ? 'border-white/40 bg-white/10'
                              : 'border-transparent bg-white/[0.03] hover:bg-white/[0.07]'
                          )}
                        >
                          <span
                            className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
                            style={{ background: `${t.color}22`, color: t.color }}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="flex-1 overflow-hidden">
                            <span className="block truncate text-[11px] font-medium text-white">{t.label}</span>
                            <span className="block truncate text-[9px] text-white/40">{t.desc}</span>
                          </span>
                          {active && <Check className="h-3 w-3 text-white" />}
                        </button>
                      )
                    })}
                    {filtered.length === 0 && (
                      <p className="col-span-2 py-4 text-center text-xs text-white/40">No task types match.</p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* caption */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Caption <span className="ml-1 normal-case text-white/25">(optional)</span>
                </label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a short caption about this card..."
                  rows={2}
                  maxLength={140}
                  className="resize-none bg-white/5 border-white/15 text-white placeholder:text-white/30 text-sm"
                />
                <div className="mt-1 text-right text-[10px] text-white/30">{caption.length}/140</div>
              </div>

              {/* color */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">Change colour of card</label>
                <div className="flex items-center gap-2.5">
                  {(Object.keys(CARD_COLORS) as CardColor[]).map((k) => {
                    const col = CARD_COLORS[k]
                    const active = color === k
                    return (
                      <button
                        key={k}
                        onClick={() => setColor(k)}
                        title={col.name}
                        className={cn(
                          'relative grid h-9 w-9 place-items-center rounded-full transition-all',
                          active ? 'scale-110' : 'hover:scale-105'
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${col.dot}, ${col.dot}aa)`,
                          boxShadow: active ? `0 0 0 2px white, 0 0 14px ${col.glow}` : `0 0 8px ${col.glow}`,
                        }}
                      >
                        {active && <Check className="h-4 w-4 text-white drop-shadow" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-end gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-4">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${c.dot}, ${c.dot}cc)`, boxShadow: `0 6px 18px -4px ${c.glow}` }}
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
