import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="md:ml-64 min-h-screen px-4 py-6 sm:px-8">{children}</main>
    </div>
  )
}

