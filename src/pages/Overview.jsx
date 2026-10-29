import { useMemo, useState } from 'react'
import { Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import Skeleton from '../components/common/Skeleton'
import LocationFilters from '../components/filters/LocationFilters'
import ActiveFilterChips from '../components/overview/ActiveFilterChips'
import ReportBoard from '../components/overview/ReportBoard'
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

function SelectionHint() {
  return (
    <p className="flex items-center gap-2.5 text-[13px] text-ink-muted">
      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-civic-600" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M10 17s-5.5-4.6-5.5-9a5.5 5.5 0 1 1 11 0c0 4.4-5.5 9-5.5 9z" />
        <circle cx="10" cy="8" r="2" />
      </svg>
      Choose a province, city or barangay to see its population and LGU profile.
    </p>
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
    <div className="space-y-5">
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
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
          Couldn’t load the location profile: {locationStatsQuery.error.message}
        </div>
      ) : null}

      {hasSelectedLocation ? (
        <section aria-label="Location profile" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {locationStatsQuery.isLoading
            ? ['Population', 'Income Class', 'LGU Count', 'PSGC Code'].map((title) => (
                <Card key={title} className="rounded-xl border border-line bg-white p-4 shadow-none ring-0">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-3 h-7 w-28" />
                </Card>
              ))
            : locationCards.map((card) => (
                <SummaryCard key={card.title} title={card.title} value={card.value} info={card.info} tone={null} />
              ))}
        </section>
      ) : (
        <SelectionHint />
      )}

      <ReportBoard
        rows={moduleRows}
        coverage={dataCoverage}
        updatedAt={lastUpdatedLabel}
        isRefreshing={isRefreshing}
        onSelect={handleOpen}
      />
    </div>
  )
}
