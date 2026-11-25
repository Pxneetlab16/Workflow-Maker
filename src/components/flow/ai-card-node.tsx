'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CARD_COLORS, type FlowCardData, useFlowStore } from '@/lib/flow-store'
import { getTaskType } from '@/lib/task-types'

function AiCardNode({ id, data, selected }: NodeProps<FlowCardData>) {
  const color = CARD_COLORS[data.color] || CARD_COLORS.violet
  const task = getTaskType(data.taskType)
  const TaskIcon = task.icon
  const deleteCard = useFlowStore((s) => s.deleteCard)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="group relative"
      style={{ width: 196 }}
    >
      {/* glow */}
      <div
        className="pointer-events-none absolute -inset-2 rounded-2xl opacity-40 blur-xl transition-opacity duration-300 group-hover:opacity-70"
        style={{ background: color.glow }}
      />
      <div
        className="relative overflow-hidden rounded-2xl border border-white/15 text-white shadow-2xl"
        style={{
          background: color.bg,
          boxShadow: `0 10px 30px -8px ${color.glow}, 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {/* top bar */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: `linear-gradient(180deg, ${color.soft}55, transparent)` }}
        >
          <div
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ background: `linear-gradient(135deg, ${color.dot}, ${color.dot}aa)`, boxShadow: `0 0 12px ${color.glow}` }}
          >
            <TaskIcon className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-1 flex-col leading-tight overflow-hidden">
            <span className="truncate text-[13px] font-semibold text-white">{data.label}</span>
            <span className="truncate text-[10px]" style={{ color: color.text }}>{task.label}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); deleteCard(id) }}
            className="grid h-5 w-5 place-items-center rounded text-white/40 opacity-0 transition-all hover:bg-rose-500/20 hover:text-rose-300 group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* body */}
        <div className="px-3 py-2.5">
          <p className="text-[10px] leading-snug text-white/45">{task.desc}</p>
          {data.caption && (
            <p className="mt-1.5 line-clamp-2 text-[10.5px] italic leading-snug text-white/70">
              “{data.caption}”
            </p>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
              style={{ background: `${color.dot}22`, color: color.text }}
            >
              <span className="h-1 w-1 rounded-full" style={{ background: color.dot, boxShadow: `0 0 6px ${color.dot}` }} />
              {task.id}
            </span>
          </div>
        </div>

        {/* selection ring */}
        {selected && (
          <div
            className="pointer-events-none absolute -inset-0.5 rounded-2xl ring-2"
            style={{ boxShadow: `0 0 0 2px ${color.dot}, 0 0 20px ${color.glow}` }}
          />
        )}
      </div>

      {/* handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-white/80 !bg-white/20"
        style={{ background: color.dot }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-white/80 !bg-white/20"
        style={{ background: color.dot }}
      />
    </motion.div>
  )
}

export default memo(AiCardNode)
