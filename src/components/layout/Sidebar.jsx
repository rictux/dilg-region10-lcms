import { useEffect } from 'react'
import { overviewPage, reportGroups } from './navigation'

function NavButton({ item, isActive, onSelect, secondary }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      aria-current={isActive ? 'page' : undefined}
      className={`group relative flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors ${
        isActive ? 'bg-civic-50' : 'hover:bg-surface-muted'
      }`}
    >
      <span
        aria-hidden
        className={`absolute inset-y-2 left-0 w-[3px] rounded-full transition-colors ${
          isActive ? 'bg-seal-500' : 'bg-transparent'
        }`}
      />
      <span
        className={`text-[13.5px] font-semibold leading-5 ${
          isActive ? 'text-civic-800' : 'text-ink-soft group-hover:text-ink'
        }`}
      >
        {item.label}
      </span>
      {secondary ? (
        <span className={`truncate text-[12px] leading-4 ${isActive ? 'text-civic-700/80' : 'text-ink-muted'}`}>
          {secondary}
        </span>
      ) : null}
    </button>
  )
}

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const select = (id) => {
    onNavigate(id)
    onClose()
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-ink/30 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-line bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <img src="/dilg-seal.png" alt="" aria-hidden className="h-10 w-10 shrink-0 object-contain" />
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-ink">LCMS</div>
              <div className="text-[12px] text-ink-muted">DILG Region X</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink lg:hidden"
            aria-label="Close navigation"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6">
          <NavButton
            item={overviewPage}
            isActive={activePage === overviewPage.id}
            onSelect={select}
            secondary="All reports"
          />

          {reportGroups.map((group) => (
            <div key={group.label} className="mt-5">
              <h2 className="px-3 pb-1.5 text-[12px] font-medium text-ink-subtle">{group.label}</h2>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    isActive={activePage === item.id}
                    onSelect={select}
                    secondary={item.label === item.title ? null : item.title}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-5 py-4 text-[12px] leading-relaxed text-ink-muted">
          LGU Compliance Monitoring System
          <br />
          Northern Mindanao
        </div>
      </aside>
    </>
  )
}
