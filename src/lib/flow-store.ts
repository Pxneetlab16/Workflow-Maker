import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Edge, Node } from '@xyflow/react'

export type CardColor = 'violet' | 'emerald' | 'rose' | 'amber' | 'sky' | 'slate'

export const CARD_COLORS: Record<CardColor, { name: string; ring: string; bg: string; soft: string; text: string; dot: string; glow: string }> = {
  violet: { name: 'Violet', ring: '#8b5cf6', bg: 'linear-gradient(145deg,#1c1830,#241c3a)', soft: '#2a2247', text: '#c4b5fd', dot: '#8b5cf6', glow: 'rgba(139,92,246,0.45)' },
  emerald: { name: 'Emerald', ring: '#10b981', bg: 'linear-gradient(145deg,#0f2620,#103028)', soft: '#13352c', text: '#6ee7b7', dot: '#10b981', glow: 'rgba(16,185,129,0.45)' },
  rose: { name: 'Rose', ring: '#f43f5e', bg: 'linear-gradient(145deg,#2a1119,#3a1820)', soft: '#3a1d27', text: '#fda4af', dot: '#f43f5e', glow: 'rgba(244,63,94,0.45)' },
  amber: { name: 'Amber', ring: '#f59e0b', bg: 'linear-gradient(145deg,#2a1f0f,#3a2a14)', soft: '#3a2d1a', text: '#fcd34d', dot: '#f59e0b', glow: 'rgba(245,158,11,0.45)' },
  sky: { name: 'Sky', ring: '#0ea5e9', bg: 'linear-gradient(145deg,#0f2130,#16304a)', soft: '#1a3a52', text: '#7dd3fc', dot: '#0ea5e9', glow: 'rgba(14,165,233,0.45)' },
  slate: { name: 'Slate', ring: '#94a3b8', bg: 'linear-gradient(145deg,#1e293b,#283548)', soft: '#334155', text: '#cbd5e1', dot: '#94a3b8', glow: 'rgba(148,163,184,0.4)' },
}

export interface FlowCardData {
  label: string
  taskType: string
  color: CardColor
  caption?: string
  [key: string]: unknown
}

export type FlowNode = Node<FlowCardData>
export type FlowEdge = Edge

export interface FlowProject {
  id: string
  name: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  createdAt: number
  updatedAt: number
}

interface FlowState {
  projects: Record<string, FlowProject>
  activeId: string | null
  // history per project
  histories: Record<string, { past: { nodes: FlowNode[]; edges: FlowEdge[] }[]; future: { nodes: FlowNode[]; edges: FlowEdge[] }[] }>

  createProject: (name?: string) => string
  deleteProject: (id: string) => void
  renameProject: (id: string, name: string) => void
  setActive: (id: string) => void

  addCard: (card: Omit<FlowCardData, 'id'> & { position: { x: number; y: number } }) => void
  updateCardPosition: (id: string, position: { x: number; y: number }) => void
  deleteCard: (id: string) => void
  updateCard: (id: string, patch: Partial<FlowCardData>) => void

  addEdge: (edge: FlowEdge) => void
  deleteEdge: (id: string) => void

  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

function snapshot(state: FlowState): { nodes: FlowNode[]; edges: FlowEdge[] } | null {
  if (!state.activeId) return null
  const p = state.projects[state.activeId]
  if (!p) return null
  return {
    nodes: structuredClone(p.nodes),
    edges: structuredClone(p.edges),
  }
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      projects: {},
      activeId: null,
      histories: {},

      createProject: (name) => {
        const id = uid()
        const project: FlowProject = {
          id,
          name: name || 'Untitled Flow',
          nodes: [],
          edges: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({
          projects: { ...s.projects, [id]: project },
          activeId: id,
          histories: { ...s.histories, [id]: { past: [], future: [] } },
        }))
        return id
      },

      deleteProject: (id) => {
        set((s) => {
          const projects = { ...s.projects }
          delete projects[id]
          const histories = { ...s.histories }
          delete histories[id]
          const ids = Object.keys(projects)
          return {
            projects,
            histories,
            activeId: s.activeId === id ? (ids[0] || null) : s.activeId,
          }
        })
      },

      renameProject: (id, name) => {
        set((s) => {
          const p = s.projects[id]
          if (!p) return s
          return {
            projects: { ...s.projects, [id]: { ...p, name, updatedAt: Date.now() } },
          }
        })
      },

      setActive: (id) => set({ activeId: id }),

      addCard: (card) => {
        const state = get()
        if (!state.activeId) return
        const snap = snapshot(state)
        const node: FlowNode = {
          id: uid(),
          type: 'aiCard',
          position: card.position,
          data: { label: card.label, taskType: card.taskType, color: card.color, caption: card.caption },
        }
        set((s) => {
          const p = s.projects[s.activeId!]
          if (!p) return s
          const histories = { ...s.histories }
          if (snap) {
            histories[s.activeId!] = {
              past: [...histories[s.activeId!]?.past || [], snap],
              future: [],
            }
          }
          return {
            projects: {
              ...s.projects,
              [s.activeId!]: { ...p, nodes: [...p.nodes, node], updatedAt: Date.now() },
            },
            histories,
          }
        })
      },

      updateCardPosition: (id, position) => {
        set((s) => {
          if (!s.activeId) return s
          const p = s.projects[s.activeId]
          if (!p) return s
          return {
            projects: {
              ...s.projects,
              [s.activeId]: {
                ...p,
                nodes: p.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
                updatedAt: Date.now(),
              },
            },
          }
        })
      },

      deleteCard: (id) => {
        const state = get()
        if (!state.activeId) return
        const snap = snapshot(state)
        set((s) => {
          const p = s.projects[s.activeId!]
          if (!p) return s
          const histories = { ...s.histories }
          if (snap) {
            histories[s.activeId!] = { past: [...histories[s.activeId!]?.past || [], snap], future: [] }
          }
          return {
            projects: {
              ...s.projects,
              [s.activeId!]: {
                ...p,
                nodes: p.nodes.filter((n) => n.id !== id),
                edges: p.edges.filter((e) => e.source !== id && e.target !== id),
                updatedAt: Date.now(),
              },
            },
            histories,
          }
        })
      },

      updateCard: (id, patch) => {
        const state = get()
        if (!state.activeId) return
        const snap = snapshot(state)
        set((s) => {
          const p = s.projects[s.activeId!]
          if (!p) return s
          const histories = { ...s.histories }
          if (snap) {
            histories[s.activeId!] = { past: [...histories[s.activeId!]?.past || [], snap], future: [] }
          }
          return {
            projects: {
              ...s.projects,
              [s.activeId!]: {
                ...p,
                nodes: p.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
                updatedAt: Date.now(),
              },
            },
            histories,
          }
        })
      },

      addEdge: (edge) => {
        const state = get()
        if (!state.activeId) return
        const snap = snapshot(state)
        set((s) => {
          const p = s.projects[s.activeId!]
          if (!p) return s
          if (p.edges.some((e) => e.source === edge.source && e.target === edge.target)) return s
          const histories = { ...s.histories }
          if (snap) {
            histories[s.activeId!] = { past: [...histories[s.activeId!]?.past || [], snap], future: [] }
          }
          return {
            projects: {
              ...s.projects,
              [s.activeId!]: { ...p, edges: [...p.edges, { ...edge, type: 'current' }], updatedAt: Date.now() },
            },
            histories,
          }
        })
      },

      deleteEdge: (id) => {
        const state = get()
        if (!state.activeId) return
        const snap = snapshot(state)
        set((s) => {
          const p = s.projects[s.activeId!]
          if (!p) return s
          const histories = { ...s.histories }
          if (snap) {
            histories[s.activeId!] = { past: [...histories[s.activeId!]?.past || [], snap], future: [] }
          }
          return {
            projects: {
              ...s.projects,
              [s.activeId!]: { ...p, edges: p.edges.filter((e) => e.id !== id), updatedAt: Date.now() },
            },
            histories,
          }
        })
      },

      undo: () => {
        const state = get()
        if (!state.activeId) return
        const h = state.histories[state.activeId]
        const p = state.projects[state.activeId]
        if (!h || !p || h.past.length === 0) return
        const past = [...h.past]
        const prev = past.pop()!
        const current = { nodes: structuredClone(p.nodes), edges: structuredClone(p.edges) }
        set((s) => ({
          projects: {
            ...s.projects,
            [s.activeId!]: { ...p, nodes: prev.nodes, edges: prev.edges, updatedAt: Date.now() },
          },
          histories: {
            ...s.histories,
            [s.activeId!]: { past, future: [...h.future, current] },
          },
        }))
      },

      redo: () => {
        const state = get()
        if (!state.activeId) return
        const h = state.histories[state.activeId]
        const p = state.projects[state.activeId]
        if (!h || !p || h.future.length === 0) return
        const future = [...h.future]
        const next = future.pop()!
        const current = { nodes: structuredClone(p.nodes), edges: structuredClone(p.edges) }
        set((s) => ({
          projects: {
            ...s.projects,
            [s.activeId!]: { ...p, nodes: next.nodes, edges: next.edges, updatedAt: Date.now() },
          },
          histories: {
            ...s.histories,
            [s.activeId!]: { past: [...h.past, current], future },
          },
        }))
      },

      canUndo: () => {
        const s = get()
        if (!s.activeId) return false
        return (s.histories[s.activeId]?.past.length || 0) > 0
      },
      canRedo: () => {
        const s = get()
        if (!s.activeId) return false
        return (s.histories[s.activeId]?.future.length || 0) > 0
      },
    }),
    {
      name: 'cinematic-flow-builder',
      version: 1,
    }
  )
)
