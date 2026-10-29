import { useCallback, useEffect, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { getPageMeta } from './navigation'

export default function DashboardLayout({ activePage, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const page = getPageMeta(activePage)

  useEffect(() => {
    document.title = page.id === 'overview' ? 'LCMS · DILG Region X' : `${page.label} · LCMS`
    window.scrollTo({ top: 0 })
  }, [page])

  return (
    <div className="min-h-screen bg-surface-muted lg:flex">
      <Sidebar
        activePage={activePage}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        onNavigate={onNavigate}
      />
      <div className="min-w-0 flex-1">
        <Header title={page.title} description={page.description} onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
