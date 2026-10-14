import { useMemo, useState } from 'react'
import { Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import DataCoverageNotice from '../components/common/DataCoverageNotice'
import Skeleton from '../components/common/Skeleton'
import LocationFilters from '../components/filters/LocationFilters'
import ActiveFilterChips from '../components/overview/ActiveFilterChips'
import RegionalSnapshot from '../components/overview/RegionalSnapshot'
import StatusBreakdown, { toneStyles } from '../components/overview/StatusBreakdown'
import { dataCoverage, overviewMonths, overviewYears } from '../config/dataCoverage'
import { useASFMonitoringGeoOptions, useOverviewASFMonitoringStats } from '../hooks/useASFMonitoringQueries'
import { useGeoOptions, useOverviewBFDPStats, useOverviewLocationStats } from '../hooks/useBFDPQueries'
import { useOverviewLTRPPStats } from '../hooks/useLTRPPQueries'
import { useOverviewRoadSafetyStats } from '../hooks/useRoadSafetyQueries'
import { useOverviewSKFPDStats } from '../hooks/useSKFPDQueries'
import { useSGLGDashboard } from '../hooks/useSGLGQueries'

const initialFilters = {
  provinceHuc: '',
  cityMunName: '',
  barangayName: '',
  year: '',
  quarter: '',
  month: '',
}

// The Overview spans every module, so its period dropdowns offer the union of
// all module coverage. Each card still states its own range.
const overviewCoverage = {
  years: overviewYears,
  quarters: [],
  months: overviewMonths,
}

const overviewCoverageNotice = {
  note: 'SGLG — CY 2024  ·  BFDP and SKFPD — CY 2025  ·  LPTRPP — Q1 CY 2026  ·  Road Classification and Safety — Q4 CY 2025  ·  ASF Monitoring — March to May CY 2026',
}

// ---------------------------------------------------------------------------
// Filter payloads handed to each module dashboard when a card is opened
// ---------------------------------------------------------------------------

function getQuarterlyFilterPayload(filters) {
  return {
    provinceHuc: filters.provinceHuc,
    cityMunName: filters.cityMunName,
    barangayName: filters.barangayName,
    year: filters.year,
    quarter: filters.quarter,
  }
}

function getLTRPPFilterPayload(filters) {
  return {
    provinceHuc: filters.provinceHuc,
    cityMunName: filters.cityMunName,
    year: '2026',
    quarter: filters.quarter,
  }
}

function getRoadSafetyFilterPayload(filters) {
  return {
    provinceHuc: filters.provinceHuc,
    cityMunName: filters.cityMunName,
    year: filters.year,
    quarter: filters.quarter,
  }
}

function getASFMonitoringFilterPayload(filters) {
  return {
    provinceHuc: filters.provinceHuc,
    cityMunName: filters.cityMunName,
    year: filters.year,
    month: filters.month,
  }
}

function getAnnualFilterPayload(filters) {
  return {
    provinceHuc: filters.provinceHuc,
    cityMunName: filters.cityMunName,
    year: filters.year,
  }
}

// ---------------------------------------------------------------------------
// Report modules. `segments` maps the status cards each overview service
// returns onto good / warn / bad tones; any other card is shown as an extra.
// ---------------------------------------------------------------------------

const COMPLIANCE_SEGMENTS = [
  { match: 'Compliance', title: 'Compliant', tone: 'good' },
  { match: 'Non Compliance', title: 'Non-compliant', tone: 'bad' },
]

const DISCLOSURE_SEGMENTS = [
  { match: 'Full Compliant', title: 'Full Compliant', tone: 'good' },
  { match: 'Partial Compliant', title: 'Partial Compliant', tone: 'warn' },
  { match: 'None Compliant', title: 'None Compliant', tone: 'bad' },
]

const reportModules = [
  {
    id: 'sglg',
    title: 'SGLG',
    shortTitle: 'SGLG',
    description: 'Seal of Good Local Governance',
    frequency: 'Annual',
    periods: ['annual'],
    segments: [
      { match: 'Passed', title: 'Passed', tone: 'good' },
      { match: 'Failed', title: 'Failed', tone: 'bad' },
    ],
    goodLabel: 'passed',
    goodShort: 'passed',
    getPayload: getAnnualFilterPayload,
  },
  {
    id: 'bfdp',
    title: 'BFDP',
    shortTitle: 'BFDP',
    description: 'Barangay Full Disclosure Policy',
    frequency: 'Quarterly',
    periods: ['quarter'],
    segments: DISCLOSURE_SEGMENTS,
    goodLabel: 'fully compliant',
    goodShort: 'full',
    getPayload: getQuarterlyFilterPayload,
  },
  {
    id: 'skfpd',
    title: 'SKFPD',
    shortTitle: 'SKFPD',
    description: 'SK Full Public Disclosure',
    frequency: 'Quarterly',
    periods: ['quarter'],
    segments: DISCLOSURE_SEGMENTS,
    goodLabel: 'fully compliant',
    goodShort: 'full',
    getPayload: getQuarterlyFilterPayload,
  },
  {
    id: 'ltrpp',
    title: 'LPTRPP',
    shortTitle: 'LPTRPP',
    description: 'Local Public Transport Route Plan Preparation',
    frequency: 'Quarterly',
    periods: ['quarter'],
    segments: COMPLIANCE_SEGMENTS,
    goodLabel: 'compliant',
    goodShort: 'compliant',
    getPayload: getLTRPPFilterPayload,
  },
  {
    id: 'road-safety',
    title: 'Classification of Roads, Setting of Speed Limits and Collection of Road Crash Data',
    shortTitle: 'Road Class & Safety',
    description: 'Road safety compliance and ordinance tracking',
    frequency: 'Quarterly',
    periods: ['quarter'],
    segments: COMPLIANCE_SEGMENTS,
    goodLabel: 'compliant',
    goodShort: 'compliant',
    getPayload: getRoadSafetyFilterPayload,
  },
  {
    id: 'asf-monitoring',
    title: 'ASF Monitoring',
    shortTitle: 'ASF Monitoring',
    description: 'African Swine Fever monthly monitoring indicators',
    frequency: 'Monthly',
    periods: ['month'],
    segments: [
      { match: 'Complete', title: 'Complete', tone: 'good' },
      { match: 'Incomplete', title: 'Incomplete', tone: 'bad' },
    ],
    goodLabel: 'complete',
    goodShort: 'complete',
    getPayload: getASFMonitoringFilterPayload,
  },
]

function isPeriodApplicable(report, filters) {
  const selectedPeriod = filters.month ? 'month' : filters.quarter ? 'quarter' : ''

  return !selectedPeriod || report.periods.includes(selectedPeriod)
}

function formatRating(value) {
  const normalized = typeof value === 'string' ? value.toLowerCase() : ''

  if (normalized === 'passed') {
    return 'Passed'
  }

  if (normalized === 'failed') {
    return 'Failed'
  }

  return 'No Rating'
}

function toCount(value) {
  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function getStatusTone(status) {
  const text = String(status ?? '').toLowerCase()

  if (text.includes('partial')) return 'warn'
  if (/(none|non|fail|incomplete|not )/.test(text)) return 'bad'
  if (/(full|pass|complete|complian)/.test(text)) return 'good'

  return 'neutral'
}

// SGLG's service returns a richer object; reshape it to the common card shape.
function adaptSGLGStats(stats, isSelectedLgu) {
  if (!stats) {
    return null
  }

  if (!stats.totalRecords) {
    return { mode: 'message', message: 'No SGLG data found for the selected filters.' }
  }

  if (isSelectedLgu) {
    return {
      mode: 'status',
      status: formatRating(stats.latestOverallRating),
      cards: [
        { title: 'Areas Passed', value: stats.areaPassTotal },
        { title: 'Areas Failed', value: stats.areaFailTotal },
      ],
    }
  }

  return {
    mode: 'counts',
    cards: [
      { title: 'Passed', value: stats.passedCount },
      { title: 'Failed', value: stats.failedCount },
    ],
  }
}

/** Turns a module's query + applicability into one renderable state. */
function buildModuleView(module, { query, stats, isApplicable, notApplicableMessage }) {
  if (!isApplicable) {
    return { state: 'na', message: notApplicableMessage, shortMessage: 'Not applicable' }
  }

  if (query.isLoading) {
    return { state: 'loading' }
  }

  if (query.error) {
    return {
      state: 'error',
      message: query.error.message || 'Unable to load this report.',
      shortMessage: 'Failed to load',
    }
  }

  if (!stats || stats.mode === 'message') {
    return {
      state: 'empty',
      message: stats?.message || 'No records for the selected filters.',
      shortMessage: 'No records',
    }
  }

  if (stats.mode === 'status') {
    return {
      state: 'status',
      status: stats.status || 'N/A',
      tone: getStatusTone(stats.status),
      extras: stats.cards ?? [],
    }
  }

  const cards = stats.cards ?? []
  const findCard = (title) => cards.find((card) => card.title.toLowerCase() === title.toLowerCase())
  const segments = module.segments.map((segment) => ({
    ...segment,
    value: toCount(findCard(segment.match)?.value),
  }))
  const extras = cards.filter(
    (card) => !module.segments.some((segment) => segment.match.toLowerCase() === card.title.toLowerCase()),
  )
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)

  if (!total) {
    return { state: 'empty', message: 'No records for the selected filters.', shortMessage: 'No records', extras }
  }

  const good = segments.find((segment) => segment.tone === 'good')?.value ?? 0

  return {
    state: 'counts',
    segments,
    extras,
    total,
    rate: Math.round((good / total) * 100),
    goodLabel: module.goodLabel,
    goodShort: module.goodShort,
  }
}

// ---------------------------------------------------------------------------
// Presentational pieces
// ---------------------------------------------------------------------------

function ExtraStats({ extras }) {
  if (!extras?.length) {
    return null
  }

  return (
    <dl className="mt-3 grid grid-cols-2 gap-2">
      {extras.map((extra) => (
        <div key={extra.title} className="rounded-lg border border-line bg-zinc-50/60 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">{extra.title}</dt>
          <dd className="mt-0.5 font-num text-[15px] font-semibold text-ink">{extra.value ?? 'N/A'}</dd>
        </div>
      ))}
    </dl>
  )
}

function ModuleBody({ view }) {
  if (view.state === 'loading') {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading report">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-4/6" />
      </div>
    )
  }

  if (view.state === 'error') {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
        <div className="font-semibold">Couldn’t load this report</div>
        <div className="mt-0.5 break-words text-rose-700/80">{view.message}</div>
      </div>
    )
  }

  if (view.state === 'na' || view.state === 'empty') {
    return (
      <div className="flex min-h-[96px] items-center rounded-lg border border-dashed border-line bg-zinc-50/60 px-3 py-2 text-[13px] leading-relaxed text-ink-muted">
        {view.message}
      </div>
    )
  }

  if (view.state === 'status') {
    const tone = toneStyles[view.tone] ?? toneStyles.neutral

    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Current status</div>
        <div className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[14px] font-semibold ${tone.soft}`}>
          <span aria-hidden className={`h-2 w-2 rounded-full ${tone.dot}`} />
          {view.status}
        </div>
        <ExtraStats extras={view.extras} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-num text-[30px] font-semibold leading-none tracking-tighter2 text-ink">{view.rate}%</span>
        <span className="text-[13px] text-ink-muted">
          {view.goodLabel} · <span className="font-num">{view.total.toLocaleString()}</span> reported
        </span>
      </div>
      <StatusBreakdown segments={view.segments} total={view.total} />
      <ExtraStats extras={view.extras} />
    </div>
  )
}

function ReportCard({ module, view, isApplicable, canOpen, onOpen }) {
  const coverage = dataCoverage[module.id]

  return (
    <Card className="flex h-full flex-col rounded-xl border border-line bg-white p-5 shadow-none ring-0 transition hover:border-line-strong hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug tracking-tightish text-ink" title={module.title}>
            {module.title}
          </h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{module.description}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
            isApplicable
              ? 'border-civic-200 bg-civic-50 text-civic-800'
              : 'border-line bg-zinc-50 text-ink-muted'
          }`}
        >
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${isApplicable ? 'bg-civic-600' : 'bg-zinc-300'}`} />
          {isApplicable ? 'Live' : 'Not applicable'}
        </span>
      </div>

      {coverage ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-audit-500/30 bg-audit-50 px-2 py-0.5 font-semibold text-audit-700">
            <span className="text-[9px] uppercase tracking-[0.14em] text-audit-500">Period</span>
            {coverage.period}
          </span>
          <span className="rounded-md border border-line bg-zinc-50 px-2 py-0.5 font-medium text-ink-muted">
            {module.frequency}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex-1">
        <ModuleBody view={view} />
      </div>

      <div className="mt-5 flex items-center justify-end border-t border-line pt-4">
        <button
          type="button"
          onClick={onOpen}
          disabled={!canOpen}
          className="inline-flex items-center gap-1 rounded-md bg-civic-700 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-civic-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-civic-500/40 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-ink-subtle"
        >
          Open dashboard <span aria-hidden>→</span>
        </button>
      </div>
    </Card>
  )
}

function SelectionHint() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-line bg-white px-4 py-3 text-[13px] text-ink-muted">
      <span aria-hidden className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-civic-50 text-civic-700">
        ⌖
      </span>
      Pick a Province/HUC, City/Municipality or Barangay above to see its population and LGU profile.
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Overview({ onNavigate }) {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)

  const locationStatsFilters = useMemo(
    () => ({
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
    }),
    [filters.provinceHuc, filters.cityMunName, filters.barangayName],
  )
  const quarterlyStatsFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName, filters.barangayName],
  )
  const ltrppStatsFilters = useMemo(
    () => ({
      year: '2026',
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
    }),
    [filters.quarter, filters.provinceHuc, filters.cityMunName],
  )
  const roadSafetyStatsFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName],
  )
  const asfMonitoringStatsFilters = useMemo(
    () => ({
      year: filters.year,
      month: filters.month,
      province: filters.provinceHuc,
      city: filters.cityMunName,
    }),
    [filters.year, filters.month, filters.provinceHuc, filters.cityMunName],
  )
  const sglgStatsFilters = useMemo(
    () => ({
      year: filters.year,
      province: filters.provinceHuc,
      city: filters.cityMunName,
    }),
    [filters.year, filters.provinceHuc, filters.cityMunName],
  )

  const hasSelectedLocation = Boolean(
    locationStatsFilters.province || locationStatsFilters.city || locationStatsFilters.barangay,
  )
  const isSGLGSelectedLgu = Boolean(sglgStatsFilters.province || sglgStatsFilters.city)

  // Whether each module's query should run under the current filters.
  const moduleEnabled = {
    sglg: !filters.month && !filters.quarter && !filters.barangayName,
    bfdp: !filters.month,
    skfpd: !filters.month,
    ltrpp: !filters.month,
    'road-safety': !filters.month && !filters.barangayName && Boolean(filters.year && filters.quarter),
    'asf-monitoring': !filters.quarter && !filters.barangayName && Boolean(filters.year && filters.month),
  }

  const notApplicableMessages = {
    sglg: 'SGLG is annual and municipal-level — clear the Barangay, Quarter and Month filters to load it.',
    bfdp: 'BFDP is quarterly — clear the Month filter to load it.',
    skfpd: 'SKFPD is quarterly — clear the Month filter to load it.',
    ltrpp: 'LPTRPP is quarterly — clear the Month filter to load it.',
    'road-safety': 'Select a year and quarter (without a barangay or month) to load this quarterly report.',
    'asf-monitoring': 'Select a year and month (without a barangay or quarter) to load this monthly report.',
  }

  const geoOptionsQuery = useGeoOptions()
  const asfMonitoringGeoOptionsQuery = useASFMonitoringGeoOptions()
  const locationStatsQuery = useOverviewLocationStats(locationStatsFilters)
  const bfdpStatsQuery = useOverviewBFDPStats(quarterlyStatsFilters, {
    enabled: moduleEnabled.bfdp,
    requireLocation: false,
  })
  const skfpdStatsQuery = useOverviewSKFPDStats(quarterlyStatsFilters, {
    enabled: moduleEnabled.skfpd,
    requireLocation: false,
  })
  const ltrppStatsQuery = useOverviewLTRPPStats(ltrppStatsFilters, {
    enabled: moduleEnabled.ltrpp,
    requireLocation: false,
  })
  const roadSafetyStatsQuery = useOverviewRoadSafetyStats(roadSafetyStatsFilters, {
    enabled: moduleEnabled['road-safety'],
    requireLocation: false,
  })
  const asfMonitoringStatsQuery = useOverviewASFMonitoringStats(asfMonitoringStatsFilters, {
    enabled: moduleEnabled['asf-monitoring'],
    requireLocation: false,
  })
  const sglgStatsQuery = useSGLGDashboard(sglgStatsFilters, {
    enabled: moduleEnabled.sglg,
  })

  const moduleQueries = {
    sglg: sglgStatsQuery,
    bfdp: bfdpStatsQuery,
    skfpd: skfpdStatsQuery,
    ltrpp: ltrppStatsQuery,
    'road-safety': roadSafetyStatsQuery,
    'asf-monitoring': asfMonitoringStatsQuery,
  }

  const moduleRows = reportModules.map((module) => {
    const query = moduleQueries[module.id]
    const isApplicable = isPeriodApplicable(module, filters) && moduleEnabled[module.id]
    const stats = module.id === 'sglg' ? adaptSGLGStats(query.data, isSGLGSelectedLgu) : query.data
    const view = buildModuleView(module, {
      query,
      stats,
      isApplicable,
      notApplicableMessage: notApplicableMessages[module.id],
    })

    return { module, view, isApplicable, canOpen: isApplicable }
  })

  const allQueries = [
    geoOptionsQuery,
    asfMonitoringGeoOptionsQuery,
    locationStatsQuery,
    ...Object.values(moduleQueries),
  ]
  const isRefreshing = allQueries.some((query) => query.isFetching)
  const lastUpdated = Math.max(0, ...Object.values(moduleQueries).map((query) => query.dataUpdatedAt || 0))
  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null

  const locationCards = locationStatsQuery.data?.cards ?? []

  const handleOpen = (moduleId) => {
    const module = reportModules.find((item) => item.id === moduleId)

    if (module) {
      onNavigate(module.id, { filters: module.getPayload(filters) })
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['geo-options'] })
    queryClient.invalidateQueries({ queryKey: ['asf-monitoring-geo-options'] })
    queryClient.invalidateQueries({ queryKey: ['overview-location-stats'] })
    queryClient.invalidateQueries({ queryKey: ['overview-bfdp-stats'] })
    queryClient.invalidateQueries({ queryKey: ['overview-skfpd-stats'] })
    queryClient.invalidateQueries({ queryKey: ['overview-ltrpp-stats'] })
    queryClient.invalidateQueries({ queryKey: ['overview-road-safety-stats'] })
    queryClient.invalidateQueries({ queryKey: ['overview-asf-monitoring-stats'] })
    queryClient.invalidateQueries({ queryKey: ['sglg-dashboard'] })
  }

  return (
    <div className="space-y-6">
      <DataCoverageNotice coverage={overviewCoverageNotice} label="Reporting Periods Covered" />

      <LocationFilters
        filters={filters}
        onChange={setFilters}
        geoOptions={geoOptionsQuery.data}
        optionsLoading={geoOptionsQuery.isLoading}
        optionError={geoOptionsQuery.error?.message}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        includeMonth
        coverage={overviewCoverage}
      />

      <ActiveFilterChips filters={filters} onChange={setFilters} initialFilters={initialFilters} />

      {locationStatsQuery.error ? (
        <Card className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-none ring-0">
          {locationStatsQuery.error.message}
        </Card>
      ) : null}

      {hasSelectedLocation ? (
        <section aria-label="Location profile" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {locationStatsQuery.isLoading
            ? ['Population', 'Income Class', 'LGU Count', 'PSGC Code'].map((title) => (
                <Card key={title} className="rounded-xl border border-line bg-white p-4 shadow-none ring-0">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-3 h-7 w-28" />
                </Card>
              ))
            : locationCards.map((card) => (
                <SummaryCard key={card.title} title={card.title} value={card.value} info={card.info} />
              ))}
        </section>
      ) : (
        <SelectionHint />
      )}

      <RegionalSnapshot rows={moduleRows} updatedAt={lastUpdatedLabel} onSelect={handleOpen} />

      <section aria-label="Report modules">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold tracking-tightish text-ink">Reports</h2>
          <span className="text-[12px] text-ink-muted">
            {moduleRows.filter((row) => row.isApplicable).length} of {moduleRows.length} apply to these filters
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {moduleRows.map(({ module, view, isApplicable, canOpen }) => (
            <ReportCard
              key={module.id}
              module={module}
              view={view}
              isApplicable={isApplicable}
              canOpen={canOpen}
              onOpen={() => handleOpen(module.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
