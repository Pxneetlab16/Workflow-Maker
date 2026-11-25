'use client'

import { memo, useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import { Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFlowStore } from '@/lib/flow-store'

/**
 * "Current flowing" animated edge.
 * Grey base wire with white electrons (small glowing dots) travelling
 * from source -> target along a bezier path. Right-click opens a small
 * context menu to delete the wire.
 */
function CurrentEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const deleteEdge = useFlowStore((s) => s.deleteEdge)

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const closeMenu = () => setMenu(null)

  const handleDelete = () => {
    deleteEdge(id)
    closeMenu()
  }

  return (
    <>
      {/* outer soft grey glow */}
      <path
        d={path}
        fill="none"
        stroke="rgba(180,180,200,0.18)"
        strokeWidth={9}
        strokeLinecap="round"
        style={{ filter: 'blur(5px)' }}
      />
      {/* base grey wire */}
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: selected ? 'rgba(255,255,255,0.85)' : 'rgba(170,175,190,0.55)',
          strokeWidth: selected ? 2.4 : 1.8,
          strokeLinecap: 'round',
        }}
      />
      {/* travelling white electrons (small dashes) */}
      <path
        d={path}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeDasharray="2 26"
        style={{
          filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.95))',
          animation: 'flow-electron 1.6s linear infinite',
        }}
      />
      {/* secondary slightly delayed electrons for density */}
      <path
        d={path}
        fill="none"
        stroke="rgba(220,220,235,0.7)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="2 38"
        style={{
          filter: 'drop-shadow(0 0 3px rgba(220,220,235,0.6))',
          animation: 'flow-electron 2.4s linear infinite',
          animationDelay: '-0.8s',
        }}
      />

      {/* invisible wider hit area for easier right-clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        strokeLinecap="round"
        style={{ cursor: 'context-menu', pointerEvents: 'stroke' }}
        onContextMenu={handleContextMenu}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'none',
          }}
          className="nodrag nopan"
        >
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.6)', boxShadow: '0 0 8px rgba(255,255,255,0.7)' }}
          />
        </div>

        <AnimatePresence>
          {menu && (
            <>
              {/* invisible backdrop to close menu */}
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 40,
                }}
                onClick={closeMenu}
                onContextMenu={(e) => { e.preventDefault(); closeMenu() }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'fixed',
                  left: menu.x,
                  top: menu.y,
                  pointerEvents: 'auto',
                }}
                className="z-50 w-40 overflow-hidden rounded-lg border border-white/15 bg-[#0c0c14]/95 shadow-2xl backdrop-blur-xl"
              >
                <div className="px-2.5 py-1.5 border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40">
                  Wire
                </div>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-xs text-rose-300 transition-colors hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete connection
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(CurrentEdge)
