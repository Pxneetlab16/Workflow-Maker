'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  addEdge as rfAddEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeTypes,
  type Edge,
  type Node,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus, MousePointer2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFlowStore } from '@/lib/flow-store'
import { useUIStore } from '@/lib/ui-store'
import { toast } from '@/hooks/use-toast'
import AiCardNode from './ai-card-node'
import CurrentEdge from './current-edge'
import { CardCreateModal } from './card-create-modal'

const nodeTypes: NodeTypes = { aiCard: AiCardNode }
const edgeTypes: EdgeTypes = { current: CurrentEdge }

function CanvasInner() {
  const project = useFlowStore((s) => (s.activeId ? s.projects[s.activeId] : null))
  const activeId = useFlowStore((s) => s.activeId)
  const updateCardPosition = useFlowStore((s) => s.updateCardPosition)
  const addEdgeToStore = useFlowStore((s) => s.addEdge)
  const setDownloadFn = useUIStore((s) => s.setDownloadFn)
  const rf = useReactFlow()

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>(project?.nodes || [])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>(project?.edges || [])
  const [modalOpen, setModalOpen] = useState(false)

  // Sync from store when project changes (or store updates from outside)
  useEffect(() => {
    setRfNodes(project?.nodes || [])
    setRfEdges(project?.edges || [])
  }, [activeId, project?.nodes.length, project?.edges.length, project?.updatedAt])

  // Register the download function with the UI store so the header button can trigger it
  useEffect(() => {
    const downloadProject = async () => {
      if (rfNodes.length === 0) {
        toast({ title: 'Nothing to download', description: 'Add some cards first', variant: 'destructive' })
        return
      }
      const safeName = (project?.name || 'workflow').replace(/[^a-z0-9-_]+/gi, '_')
      try {
        // Capture the full flow at 2x resolution
        const dataUrl = await rf.toPng({
          background: '#070709',
          padding: 0.3,
          pixelRatio: 2,
        })
        const blob = await (await fetch(dataUrl)).blob()
        const suggestedName = `${safeName}.png`

        // Try the File System Access API (opens the explorer "Save As" dialog)
        const w = window as unknown as { showSaveFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle> }
        if (typeof w.showSaveFilePicker === 'function') {
          try {
            const handle = await w.showSaveFilePicker({
              suggestedName,
              types: [{ description: 'PNG image', accept: { 'image/png': ['.png'] } }],
            })
            const writable = await handle.createWritable()
            await writable.write(blob)
            await writable.close()
            toast({ title: 'Saved', description: `${suggestedName} downloaded` })
            return
          } catch (err) {
            // user cancelled or unsupported — fall through to regular download
            if ((err as DOMException)?.name === 'AbortError') return
          }
        }
        // Fallback: standard browser download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = suggestedName
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        toast({ title: 'Downloaded', description: suggestedName })
      } catch {
        toast({ title: 'Download failed', description: 'Could not capture the canvas', variant: 'destructive' })
      }
    }
    setDownloadFn(downloadProject)
    return () => setDownloadFn(null)
  }, [rf, rfNodes.length, project?.name, setDownloadFn])

  const onNodeDragStop = useCallback(
    (_evt: unknown, node: Node) => {
      updateCardPosition(node.id, node.position)
    },
    [updateCardPosition]
  )

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target || conn.source === conn.target) return
      const edge: Edge = {
        id: `e-${conn.source}-${conn.target}-${Date.now()}`,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle || undefined,
        targetHandle: conn.targetHandle || undefined,
        type: 'current',
        animated: false,
      }
      setRfEdges((eds) => rfAddEdge(edge, eds))
      addEdgeToStore(edge)
    },
    [setRfEdges, addEdgeToStore]
  )

  const hasNodes = rfNodes.length > 0

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070709]">
      {/* ambient cinematic background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.1 }}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'current' }}
        className="!bg-transparent"
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={26} size={1.4} color="rgba(255,255,255,0.08)" />
        <Controls
          className="!border-white/10 !bg-[#0a0a0f]/80 !backdrop-blur-xl [&_button]:!border-white/10 [&_button]:!bg-transparent [&_button]:!text-white/70 [&_button:hover]:!bg-white/10 [&_svg]:!fill-current"
          position="top-right"
          showInteractive={false}
        />
      </ReactFlow>

      {/* empty state */}
      <AnimatePresence>
        {!hasNodes && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          >
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-white/30">
              <MousePointer2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-white/50">Empty canvas</p>
            <p className="mt-1 text-xs text-white/30">Tap the + button to add your first AI agent</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* floating + button */}
      <motion.button
        onClick={() => setModalOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="group absolute bottom-6 right-6 z-20 grid h-14 w-14 place-items-center rounded-full text-white shadow-2xl"
        style={{
          background: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
          boxShadow: '0 12px 30px -6px rgba(139,92,246,0.6), 0 0 30px rgba(217,70,239,0.4)',
        }}
        aria-label="Add card"
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
        <Plus className="h-6 w-6" />
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/40"
          animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.button>

      <CardCreateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  )
}
