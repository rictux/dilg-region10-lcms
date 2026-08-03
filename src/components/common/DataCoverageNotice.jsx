export default function DataCoverageNotice({
  coverage,
  label = 'Reporting Period Covered',
  className = '',
}) {
  if (!coverage?.note) {
    return null
  }

  return (
    <div
      role="status"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-audit-500/30 bg-audit-50 px-3.5 py-2.5 ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-audit-500">
        {label}
      </span>
      <span aria-hidden className="hidden h-3.5 w-px bg-audit-500/30 sm:block" />
      <span className="text-[13px] font-semibold leading-relaxed tracking-tightish text-audit-700">
        {coverage.note}
      </span>
    </div>
  )
}
