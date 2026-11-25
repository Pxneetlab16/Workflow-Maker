'use client'

import { useEffect } from 'react'
import { Sidebar } from '@/components/flow/sidebar'
import { Header } from '@/components/flow/header'
import { FlowCanvas } from '@/components/flow/flow-canvas'
import { useFlowStore } from '@/lib/flow-store'

export default function Home() {
  const projects = useFlowStore((s) => s.projects)
  const activeId = useFlowStore((s) => s.activeId)
  const createProject = useFlowStore((s) => s.createProject)

  // Ensure at least one project exists on first load
  useEffect(() => {
    const s = useFlowStore.getState()
    if (Object.keys(s.projects).length === 0) {
      createProject('My Workflow')
    } else if (!s.activeId || !s.projects[s.activeId]) {
      s.setActive(Object.keys(s.projects)[0])
    }
  }, [createProject])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#070709] text-white">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <Header />
        <div className="relative min-h-0 flex-1">
          {activeId && projects[activeId] ? (
            <FlowCanvas />
          ) : (
            <div className="grid h-full place-items-center text-sm text-white/40">
              Loading…
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
