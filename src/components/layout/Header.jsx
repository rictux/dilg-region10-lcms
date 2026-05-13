export default function Header({ title, eyebrow, onMenuClick }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/85 px-4 py-4 backdrop-blur md:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-civic-700">
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={`truncate font-semibold tracking-tighter2 text-ink ${
              eyebrow ? 'mt-1 text-xl md:text-[26px]' : 'text-xl md:text-[26px]'
            }`}
          >
            {title}
          </h1>
        </div>
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          Menu
        </button>
      </div>
    </header>
  )
}
