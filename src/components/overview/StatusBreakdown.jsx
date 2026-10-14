export const toneStyles = {
  good: { bar: 'bg-civic-600', dot: 'bg-civic-600', text: 'text-civic-700', soft: 'bg-civic-50 text-civic-800 border-civic-200' },
  warn: { bar: 'bg-amber-400', dot: 'bg-amber-400', text: 'text-amber-700', soft: 'bg-amber-50 text-amber-800 border-amber-200' },
  bad: { bar: 'bg-rose-500', dot: 'bg-rose-500', text: 'text-rose-700', soft: 'bg-rose-50 text-rose-800 border-rose-200' },
  neutral: { bar: 'bg-zinc-300', dot: 'bg-zinc-300', text: 'text-ink-soft', soft: 'bg-zinc-50 text-ink-soft border-line' },
}

function formatPercent(value, total) {
  if (!total) {
    return '0%'
  }

  const percent = (value / total) * 100

  return `${percent >= 10 || percent === 0 ? Math.round(percent) : percent.toFixed(1)}%`
}

/**
 * Stacked proportion bar with a labelled legend. Every segment is listed with
 * its count and share, so the reading never depends on colour alone.
 */
export default function StatusBreakdown({ segments, total }) {
  return (
    <div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100"
        role="img"
        aria-label={segments
          .map((segment) => `${segment.title}: ${segment.value} (${formatPercent(segment.value, total)})`)
          .join(', ')}
      >
        {segments.map((segment) =>
          segment.value > 0 ? (
            <div
              key={segment.title}
              className={`${toneStyles[segment.tone]?.bar ?? toneStyles.neutral.bar} h-full border-r-2 border-white transition-[width] duration-500 last:border-r-0`}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-3 space-y-1.5">
        {segments.map((segment) => (
          <li key={segment.title} className="flex items-center justify-between gap-3 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 text-ink-soft">
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${toneStyles[segment.tone]?.dot ?? toneStyles.neutral.dot}`}
              />
              <span className="truncate">{segment.title}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2 font-num">
              <span className="font-semibold text-ink">{segment.value.toLocaleString()}</span>
              <span className="w-11 text-right text-[12px] text-ink-muted">
                {formatPercent(segment.value, total)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
