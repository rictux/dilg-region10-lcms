import Skeleton from '../common/Skeleton'
import StatusBreakdown, { toneStyles } from './StatusBreakdown'

function ExtraStats({ extras }) {
  if (!extras?.length) {
    return null
  }

  return (
    <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-muted">
      {extras.map((extra) => (
        <span key={extra.title}>
          {extra.title}: <span className="font-num font-semibold text-ink">{extra.value ?? 'N/A'}</span>
        </span>
      ))}
    </span>
  )
}

function RateCell({ view, rank }) {
  if (view.state === 'loading') {
    return (
      <span className="block space-y-2" aria-label="Loading">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </span>
    )
  }

  if (view.state === 'counts') {
    return (
      <span className="block">
        <span className="block font-num text-[32px] font-bold leading-none text-ink">
          {view.rate}
          <span className="text-[20px] font-semibold text-ink-muted">%</span>
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-muted">
          {view.goodLabel}
          {rank ? (
            <span
              className={`rounded-full px-1.5 py-px text-[11px] font-semibold ${
                rank === 'highest' ? 'bg-civic-50 text-civic-800' : 'bg-rose-50 text-rose-800'
              }`}
            >
              {rank === 'highest' ? 'Highest' : 'Lowest'}
            </span>
          ) : null}
        </span>
      </span>
    )
  }

  if (view.state === 'status') {
    const tone = toneStyles[view.tone] ?? toneStyles.neutral

    return (
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[14px] font-semibold ${tone.soft}`}>
        <span aria-hidden className={`h-2 w-2 rounded-full ${tone.dot}`} />
        {view.status}
      </span>
    )
  }

  return <span className="block font-num text-[32px] font-bold leading-none text-line-strong">–</span>
}

function DetailCell({ view }) {
  if (view.state === 'loading') {
    return (
      <span className="block space-y-2.5">
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </span>
    )
  }

  if (view.state === 'error') {
    return (
      <span className="block rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
        <span className="font-semibold">Couldn’t load this report.</span>{' '}
        <span className="break-words">{view.message}</span>
      </span>
    )
  }

  if (view.state === 'na' || view.state === 'empty') {
    return <span className="block max-w-[56ch] text-[13px] leading-relaxed text-ink-muted">{view.message}</span>
  }

  if (view.state === 'status') {
    return <ExtraStats extras={view.extras} />
  }

  return (
    <span className="block">
      <StatusBreakdown segments={view.segments} total={view.total} layout="inline" />
      <ExtraStats extras={view.extras} />
    </span>
  )
}

/**
 * The Overview's main view: one row per report with its headline rate,
 * status split and reporting period. Rows open the report's dashboard with
 * the current filters carried over.
 */
export default function ReportBoard({ rows, coverage, updatedAt, isRefreshing, onSelect }) {
  const ready = rows.filter((row) => row.view.state === 'counts' && row.view.total > 0)
  const ranked = [...ready].sort((a, b) => b.view.rate - a.view.rate)
  const highestId = ranked.length > 1 ? ranked[0].module.id : null
  const lowestId = ranked.length > 1 ? ranked[ranked.length - 1].module.id : null
  const applicableCount = rows.filter((row) => row.isApplicable).length

  return (
    <section aria-labelledby="report-board-title" className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 px-5 pb-4 pt-5">
        <div>
          <h2 id="report-board-title" className="text-[17px] font-bold text-ink">
            Reports
          </h2>
          <p className="mt-1 max-w-[70ch] text-[13px] leading-relaxed text-ink-muted">
            Share of reporting LGUs in each report’s top status. Select a report to open its dashboard with these
            filters.
          </p>
        </div>
        <p className="text-[13px] text-ink-muted" aria-live="polite">
          {applicableCount} of {rows.length} reports apply
          {isRefreshing ? ', refreshing…' : updatedAt ? `, updated ${updatedAt}` : ''}
        </p>
      </div>

      <div className="hidden grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,2fr)_2rem] gap-6 border-t border-line bg-surface-muted/70 px-5 py-2 text-[12px] font-medium text-ink-muted lg:grid">
        <span>Report</span>
        <span>Top status</span>
        <span>Status of reporting LGUs</span>
        <span className="sr-only">Open</span>
      </div>

      <ul>
        {rows.map(({ module, view, canOpen }) => {
          const period = coverage[module.id]?.period
          const rank = module.id === highestId ? 'highest' : module.id === lowestId ? 'lowest' : null
          const muted = view.state === 'na'

          return (
            <li key={module.id} className="border-t border-line">
              <button
                type="button"
                disabled={!canOpen}
                onClick={() => onSelect(module.id)}
                aria-label={`Open ${module.shortTitle} dashboard`}
                className="group grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 px-5 py-4 text-left transition-colors enabled:hover:bg-civic-50/40 disabled:cursor-default lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)_minmax(0,2fr)_2rem] lg:items-center lg:gap-6"
              >
                <span className={`block min-w-0 ${muted ? 'opacity-70' : ''}`}>
                  <span className="block text-[15px] font-bold leading-snug text-ink">{module.shortTitle}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-muted">{module.description}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
                    {period ? (
                      <span className="rounded-md bg-seal-50 px-1.5 py-0.5 font-semibold text-seal-700">{period}</span>
                    ) : null}
                    <span className="text-ink-muted">{module.frequency}</span>
                  </span>
                </span>

                <span className={`block justify-self-end text-right lg:justify-self-start lg:text-left ${muted ? 'opacity-70' : ''}`}>
                  <RateCell view={view} rank={rank} />
                </span>

                <span className="col-span-2 block min-w-0 lg:col-span-1">
                  <DetailCell view={view} />
                </span>

                <span
                  aria-hidden
                  className={`hidden h-8 w-8 items-center justify-center justify-self-end rounded-full transition-colors lg:inline-flex ${
                    canOpen
                      ? 'text-ink-subtle group-hover:bg-civic-700 group-hover:text-white'
                      : 'text-transparent'
                  }`}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                {canOpen ? (
                  <span aria-hidden className="col-span-2 text-[13px] font-semibold text-civic-700 lg:hidden">
                    Open dashboard
                  </span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
