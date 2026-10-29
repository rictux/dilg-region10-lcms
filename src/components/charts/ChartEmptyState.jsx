import { Card } from '@tremor/react'

export default function ChartEmptyState({ id, title, message = 'No data for the current filters. Try widening the location or period.' }) {
  return (
    <Card id={id} className="flex min-h-80 flex-col rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      {typeof title === 'string' ? (
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      ) : (
        <div>{title}</div>
      )}
      <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-line-strong bg-surface-muted/60 px-6 py-10 text-center">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink-subtle" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" strokeLinecap="round" />
        </svg>
        <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-ink-muted">{message}</p>
      </div>
    </Card>
  )
}
