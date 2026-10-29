/**
 * States which reporting period a dashboard's data covers. Shown as a quiet
 * tag rather than an alert: it is context for every number below it, not a
 * warning.
 */
export default function DataCoverageNotice({
  coverage,
  label = 'Data covers',
  className = '',
}) {
  if (!coverage?.note) {
    return null
  }

  return (
    <p
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-seal-200 bg-seal-50 px-3 py-1.5 text-[13px] text-seal-700 ${className}`}
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <rect x="3" y="4.5" width="14" height="12" rx="2" />
        <path d="M3 8.5h14M7 3v3M13 3v3" strokeLinecap="round" />
      </svg>
      <span>{label}</span>
      <span className="font-semibold">{coverage.note}</span>
    </p>
  )
}
