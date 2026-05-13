const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'sglg', label: 'SGLG' },
  { id: 'bfdp', label: 'BFDP' },
  { id: 'skfpd', label: 'SKFPD' },
  { id: 'ltrpp', label: 'LPTRPP' },
  { id: 'road-safety', label: 'Road Class & Safety' },
  { id: 'asf-monitoring', label: 'ASF Monitoring' },
  { id: 'future', label: 'Other future reports' },
]

export default function Sidebar({ activePage, onNavigate, isOpen, onClose }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-zinc-950/30 transition-opacity lg:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-line bg-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-5">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-civic-700 text-[11px] font-semibold tracking-tight text-white"
            >
              LC
            </span>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold tracking-tight text-ink">LCMS</div>
              <div className="text-[11px] font-medium text-ink-muted">LGU Compliance Monitoring</div>
            </div>
          </div>
        </div>

        <div className="mx-5 mb-2 mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-subtle">
          Reports
        </div>

        <nav className="flex-1 space-y-0.5 px-3 pb-5">
          {navItems.map((item) => {
            const isActive = activePage === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id)
                  onClose()
                }}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition ${
                  isActive
                    ? 'bg-civic-50 text-civic-800'
                    : 'text-ink-soft hover:bg-zinc-50 hover:text-ink'
                }`}
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full transition ${
                    isActive ? 'bg-civic-600' : 'bg-zinc-300 group-hover:bg-zinc-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-line px-5 py-3 text-[11px] text-ink-muted">
          Region 10 &middot; DILG
        </div>
      </aside>
    </>
  )
}
