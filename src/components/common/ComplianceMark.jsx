/**
 * Table cell mark for a met / not-met requirement. Met reads as a quiet check
 * so that gaps, drawn as a tinted pill, are what the eye finds first in a
 * dense table.
 *
 * value: true (met), false (not met), or null/undefined (no data).
 */
export default function ComplianceMark({ value, yesLabel = 'Yes', noLabel = 'No', emptyLabel = 'N/A' }) {
  if (value === null || value === undefined) {
    return <span className="text-[12px] text-ink-subtle">{emptyLabel}</span>
  }

  if (value) {
    return (
      <span className="relative inline-flex items-center gap-1 text-[12px] font-medium text-civic-700">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only xl:not-sr-only">{yesLabel}</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[12px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" strokeLinecap="round" />
      </svg>
      {noLabel}
    </span>
  )
}
