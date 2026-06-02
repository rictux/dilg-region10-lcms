import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

const titles = {
  overview: 'Overview',
  bfdp: 'Barangay Full Disclosure Policy',
  skfpd: 'SK Full Public Disclosure',
  ltrpp: 'Local Public Transport Route Plan Preparation',
  sglg: 'Seal of Good Local Governance',
}

export default function DashboardLayout({ activePage, onNavigate, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface-muted lg:flex">
      <Sidebar
        activePage={activePage}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
      />
      <div className="min-w-0 flex-1">
        <Header
          title={titles[activePage] ?? 'Overview'}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
