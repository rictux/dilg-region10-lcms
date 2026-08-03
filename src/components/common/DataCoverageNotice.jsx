export default function DataCoverageNotice({ coverage, className = '' }) {
  if (!coverage?.note) {
    return null
  }

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-lg border border-audit-500/30 bg-audit-50 px-3.5 py-2.5 ${className}`}
    >
      <span
        aria-hidden
        className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-audit-500 text-[10px] font-bold leading-none text-white"
      >
        !
      </span>
      <p className="text-[13px] leading-relaxed text-audit-700">
        <span className="font-semibold uppercase tracking-[0.08em]">Data coverage:</span>{' '}
        {coverage.note}
      </p>
    </div>
  )
}
