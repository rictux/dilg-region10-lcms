import { Card } from '@tremor/react'
import Skeleton from '../common/Skeleton'

// Bars stay one colour; only the figure is tinted, so amber never competes
// with the "Partial" segment colour used on the report cards.
function rateTone(rate) {
  if (rate >= 75) return { text: 'text-civic-700' }
  if (rate >= 50) return { text: 'text-amber-700' }
  return { text: 'text-rose-700' }
}

/**
 * One row per report: the share of reported LGUs in the best status
 * (fully compliant / passed / complete) for the current filters.
 */
export default function RegionalSnapshot({ rows, updatedAt, onSelect }) {
  const ready = rows.filter((row) => row.view.state === 'counts' && row.view.total > 0)
  const ranked = [...ready].sort((a, b) => b.view.rate - a.view.rate)
  const leader = ranked[0]
  const trailing = ranked.length > 1 ? ranked[ranked.length - 1] : null

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tightish text-ink">Compliance snapshot</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Share of reported LGUs in the top status for each report, under the current filters.
          </p>
        </div>
        {updatedAt ? (
          <span className="rounded-full border border-line bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-ink-muted">
            Updated {updatedAt}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-x-8 gap-y-2 md:grid-cols-2">
        {rows.map(({ module, view, canOpen }) => {
          const isCounts = view.state === 'counts' && view.total > 0
          const tone = isCounts ? rateTone(view.rate) : null

          return (
            <button
              key={module.id}
              type="button"
              disabled={!canOpen}
              onClick={() => onSelect(module.id)}
              className="group rounded-md px-2 py-1.5 text-left transition enabled:hover:bg-zinc-50 disabled:cursor-default"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="truncate text-[13px] font-medium text-ink-soft group-enabled:group-hover:text-ink">
                  {module.shortTitle}
                </span>
                <span className={`shrink-0 font-num text-[13px] font-semibold ${tone ? tone.text : 'text-ink-subtle'}`}>
                  {view.state === 'loading' ? '' : isCounts ? `${view.rate}% ${view.goodShort}` : view.shortMessage}
                </span>
              </span>
              <span className="mt-1.5 block">
                {view.state === 'loading' ? (
                  <Skeleton className="h-2 w-full rounded-full" />
                ) : (
                  <span className="relative block h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                    {isCounts ? (
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-civic-600 transition-[width] duration-500"
                        style={{ width: `${Math.max(view.rate, 1)}%` }}
                      />
                    ) : null}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {leader && trailing && leader.module.id !== trailing.module.id ? (
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-4 text-[13px] text-ink-muted">
          <span>
            Strongest: <span className="font-semibold text-civic-700">{leader.module.shortTitle}</span>{' '}
            <span className="font-num">({leader.view.rate}%)</span>
          </span>
          <span>
            Needs attention: <span className="font-semibold text-rose-700">{trailing.module.shortTitle}</span>{' '}
            <span className="font-num">({trailing.view.rate}%)</span>
          </span>
        </div>
      ) : null}
    </Card>
  )
}
