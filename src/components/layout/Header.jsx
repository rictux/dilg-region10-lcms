export default function Header({ title, description, onMenuClick }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] items-start gap-3 px-4 py-5 md:px-8 md:py-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="-ml-1 mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-soft transition hover:bg-surface-muted hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M3 6h14M3 10h14M3 14h14" strokeLinecap="round" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight text-ink md:text-[28px]">{title}</h1>
          {description ? (
            <p className="mt-1.5 max-w-[68ch] text-[14px] leading-relaxed text-ink-muted">{description}</p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
