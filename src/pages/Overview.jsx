import { useMemo, useState } from 'react'
import { Badge, Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import LocationFilters from '../components/filters/LocationFilters'
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

const miniStatClassName =
  'flex min-h-[74px] flex-col rounded-lg border border-line bg-zinc-50/60 px-3 py-2'

const miniStatLabelClassName =
  'flex min-h-[28px] items-start text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-ink-muted'

const miniStatValueClassName = 'mt-auto font-num text-[15px] font-semibold tracking-tightish text-ink'

const reportHeaderClassName = 'flex min-h-[78px] items-start justify-between gap-3'

const statsGridClassName = 'mt-4 grid min-h-[74px] gap-2 sm:grid-cols-3'

const statsMessageClassName =
  'mt-4 flex min-h-[74px] items-center rounded-lg border border-line bg-zinc-50/60 px-3 py-2 text-[13px] text-ink-muted'

const reportModules = [
  {
    id: 'sglg',
    title: 'SGLG',
    description: 'Seal of Good Local Governance',
    frequency: 'Annual',
    status: 'Live',
    color: 'emerald',
    periods: ['annual'],
  },
  {
    id: 'bfdp',
    title: 'BFDP',
    description: 'Barangay Full Disclosure Policy',
    frequency: 'Quarterly',
    status: 'Live',
    color: 'emerald',
    periods: ['quarter'],
  },
  {
    id: 'skfpd',
    title: 'SKFPD',
    description: 'SK Full Public Disclosure',
    frequency: 'Quarterly',
    status: 'Live',
    color: 'emerald',
    periods: ['quarter'],
  },
  {
    id: 'ltrpp',
    title: 'LPTRPP',
    description: 'Local Public Transport Route Plan Preparation',
    frequency: 'Quarterly',
    status: 'Live',
    color: 'emerald',
    periods: ['quarter'],
  },
  {
    id: 'road-safety',
    title: 'Classification of Roads, Setting of Speed Limits and Collection of Road Crash Data',
    description: 'Road safety compliance and ordinance tracking',
    frequency: 'Quarterly',
    status: 'Live',
    color: 'emerald',
    periods: ['quarter'],
  },
  {
    id: 'asf-monitoring',
    title: 'ASF Monitoring',
    description: 'African Swine Fever monthly monitoring indicators',
    frequency: 'Monthly',
    status: 'Live',
    color: 'emerald',
    periods: ['month'],
  },
  {
    id: 'future',
    title: 'Other',
    description: 'Reserved for future schemas',
    frequency: 'To be configured',
    status: 'Reserved',
    color: 'slate',
    periods: [],
  },
]

function getReportState(report, filters) {
  const selectedPeriod = filters.month ? 'month' : filters.quarter ? 'quarter' : ''

  if (selectedPeriod && !report.periods.includes(selectedPeriod)) {
    return {
      label: 'Not applicable',
      color: 'slate',
      isApplicable: false,
    }
  }

  return {
    label: report.status,
    color: report.color,
    isApplicable: true,
  }
}

function SelectionState() {
  return (
    <Card className="rounded-xl border border-dashed border-line bg-white p-10 text-center shadow-none ring-0">
      <div className="text-[15px] font-semibold tracking-tightish text-ink">Select a location</div>
      <p className="mt-2 text-[13px] text-ink-muted">Population and LGU profile cards will appear here.</p>
    </Card>
  )
}

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

function QuarterlyComplianceCardStats({
  stats,
  isLoading,
  isApplicable,
  notApplicableMessage = 'Not applicable for Month filter.',
}) {
  if (!isApplicable) {
    return (
      <div className={statsMessageClassName}>
        {notApplicableMessage}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={statsGridClassName}>
        {['Full Compliant', 'Partial Compliant', 'None Compliant'].map((title) => (
          <div key={title} className={miniStatClassName}>
            <div className={miniStatLabelClassName}>
              {title}
            </div>
            <div className={miniStatValueClassName}>Loading...</div>
          </div>
        ))}
      </div>
    )
  }

  if (stats?.mode === 'status') {
    return (
      <div className={`mt-4 ${miniStatClassName}`}>
        <div className={miniStatLabelClassName}>
          Status
        </div>
        <div className={miniStatValueClassName}>{stats.status}</div>
      </div>
    )
  }

  return (
    <div className={statsGridClassName}>
      {(stats?.cards ?? []).map((card) => (
        <div key={card.title} className={miniStatClassName}>
          <div className={miniStatLabelClassName}>
            {card.title}
          </div>
          <div className={miniStatValueClassName}>{card.value}</div>
        </div>
      ))}
    </div>
  )
}

function SGLGCardStats({ stats, isLoading, isApplicable, isSelectedLgu }) {
  if (!isApplicable) {
    return (
      <div className={statsMessageClassName}>
        Not applicable for Barangay, Quarter, or Month filter.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={statsGridClassName}>
        {['Passed', 'Failed', 'Rate'].map((title) => (
          <div key={title} className={miniStatClassName}>
            <div className={miniStatLabelClassName}>
              {title}
            </div>
            <div className={miniStatValueClassName}>Loading...</div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats?.totalRecords) {
    return (
      <div className={statsMessageClassName}>
        No SGLG data found for the selected filters.
      </div>
    )
  }

  const cards = isSelectedLgu
    ? [
        { title: 'Overall', value: formatRating(stats.latestOverallRating) },
        { title: 'Area Passed', value: stats.areaPassTotal },
        { title: 'Area Failed', value: stats.areaFailTotal },
      ]
    : [
        { title: 'PASSED', value: stats.passedCount },
        { title: 'FAILED', value: stats.failedCount },
      ]

  return (
    <div className={statsGridClassName}>
      {cards.map((card) => (
        <div key={card.title} className={miniStatClassName}>
          <div className={miniStatLabelClassName}>
            {card.title}
          </div>
          <div className={miniStatValueClassName}>{card.value}</div>
        </div>
      ))}
    </div>
  )
}

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
  const bfdpStatsFilters = useMemo(
    () => ({
      year: filters.year,
      quarter: filters.quarter,
      province: filters.provinceHuc,
      city: filters.cityMunName,
      barangay: filters.barangayName,
    }),
    [filters.year, filters.quarter, filters.provinceHuc, filters.cityMunName, filters.barangayName],
  )
  const skfpdStatsFilters = useMemo(
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
  const isBFDPApplicable = !filters.month
  const isSKFPDApplicable = !filters.month
  const isLTRPPApplicable = !filters.month
  const isRoadSafetyApplicable = !filters.month && !filters.barangayName && Boolean(filters.year && filters.quarter)
  const isASFMonitoringApplicable = !filters.quarter && !filters.barangayName && Boolean(filters.year && filters.month)
  const isSGLGApplicable = !filters.month && !filters.quarter && !filters.barangayName

  const geoOptionsQuery = useGeoOptions()
  const asfMonitoringGeoOptionsQuery = useASFMonitoringGeoOptions()
  const locationStatsQuery = useOverviewLocationStats(locationStatsFilters)
  const bfdpStatsQuery = useOverviewBFDPStats(bfdpStatsFilters, {
    enabled: isBFDPApplicable,
    requireLocation: false,
  })
  const skfpdStatsQuery = useOverviewSKFPDStats(skfpdStatsFilters, {
    enabled: isSKFPDApplicable,
    requireLocation: false,
  })
  const ltrppStatsQuery = useOverviewLTRPPStats(ltrppStatsFilters, {
    enabled: isLTRPPApplicable,
    requireLocation: false,
  })
  const roadSafetyStatsQuery = useOverviewRoadSafetyStats(roadSafetyStatsFilters, {
    enabled: isRoadSafetyApplicable,
    requireLocation: false,
  })
  const asfMonitoringStatsQuery = useOverviewASFMonitoringStats(asfMonitoringStatsFilters, {
    enabled: isASFMonitoringApplicable,
    requireLocation: false,
  })
  const sglgStatsQuery = useSGLGDashboard(sglgStatsFilters, {
    enabled: isSGLGApplicable,
  })
  const locationCards = locationStatsQuery.data?.cards ?? []
  const overviewGeoOptions = useMemo(() => {
    if (!geoOptionsQuery.data) {
      return geoOptionsQuery.data
    }

    return {
      ...geoOptionsQuery.data,
      years: [
        ...new Set([
          2026,
          2024,
          ...(geoOptionsQuery.data.years ?? []),
          ...(asfMonitoringGeoOptionsQuery.data?.years ?? []),
        ]),
      ].sort((a, b) => b - a),
    }
  }, [asfMonitoringGeoOptionsQuery.data?.years, geoOptionsQuery.data])

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
      <LocationFilters
        filters={filters}
        onChange={setFilters}
        geoOptions={overviewGeoOptions}
        optionsLoading={geoOptionsQuery.isLoading}
        optionError={geoOptionsQuery.error?.message}
        onRefresh={handleRefresh}
        isRefreshing={
          geoOptionsQuery.isFetching ||
          locationStatsQuery.isFetching ||
          asfMonitoringGeoOptionsQuery.isFetching ||
          bfdpStatsQuery.isFetching ||
          skfpdStatsQuery.isFetching ||
          ltrppStatsQuery.isFetching ||
          roadSafetyStatsQuery.isFetching ||
          asfMonitoringStatsQuery.isFetching ||
          sglgStatsQuery.isFetching
        }
        includeMonth
      />

      {locationStatsQuery.error ? (
        <Card className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-none ring-0">
          {locationStatsQuery.error.message}
        </Card>
      ) : null}

      {!hasSelectedLocation ? <SelectionState /> : null}

      {hasSelectedLocation ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {locationStatsQuery.isLoading
            ? ['Population', 'Income Class', 'LGU Count', 'PSGC Code'].map((title) => (
                <SummaryCard key={title} title={title} value="Loading..." />
              ))
            : locationCards.map((card) => (
                <SummaryCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  info={card.info}
                />
              ))}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportModules.map((report) => {
          const reportState = getReportState(report, filters)

          return (
            <Card key={report.id} className="flex h-full min-h-[306px] flex-col rounded-xl border border-line bg-white p-5 shadow-none ring-0 transition hover:border-line-strong">
              <div className={reportHeaderClassName}>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tightish text-ink">{report.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{report.description}</p>
                </div>
                <Badge color={reportState.color}>{reportState.label}</Badge>
              </div>
              {report.id === 'bfdp' || report.id === 'skfpd' || report.id === 'ltrpp' || report.id === 'road-safety' || report.id === 'asf-monitoring' ? (
                <QuarterlyComplianceCardStats
                  stats={
                    report.id === 'bfdp'
                      ? bfdpStatsQuery.data
                      : report.id === 'skfpd'
                        ? skfpdStatsQuery.data
                        : report.id === 'ltrpp'
                          ? ltrppStatsQuery.data
                          : report.id === 'road-safety'
                            ? roadSafetyStatsQuery.data
                            : asfMonitoringStatsQuery.data
                  }
                  isLoading={
                    report.id === 'bfdp'
                      ? bfdpStatsQuery.isLoading
                      : report.id === 'skfpd'
                        ? skfpdStatsQuery.isLoading
                        : report.id === 'ltrpp'
                          ? ltrppStatsQuery.isLoading
                          : report.id === 'road-safety'
                            ? roadSafetyStatsQuery.isLoading
                            : asfMonitoringStatsQuery.isLoading
                  }
                  isApplicable={
                    report.id === 'ltrpp'
                      ? reportState.isApplicable && isLTRPPApplicable
                      : report.id === 'road-safety'
                        ? reportState.isApplicable && isRoadSafetyApplicable
                        : report.id === 'asf-monitoring'
                          ? reportState.isApplicable && isASFMonitoringApplicable
                      : reportState.isApplicable
                  }
                  notApplicableMessage={
                    report.id === 'road-safety'
                      ? 'Select a year and quarter to load this quarterly report.'
                      : report.id === 'asf-monitoring'
                        ? 'Select a year and month to load this monthly report.'
                      : 'Not applicable for Month filter.'
                  }
                />
              ) : null}
              {report.id === 'sglg' ? (
                <SGLGCardStats
                  stats={sglgStatsQuery.data}
                  isLoading={sglgStatsQuery.isLoading}
                  isApplicable={reportState.isApplicable && isSGLGApplicable}
                  isSelectedLgu={Boolean(sglgStatsFilters.province || sglgStatsFilters.city)}
                />
              ) : null}
              <div className="mt-auto flex min-h-[82px] items-end justify-between gap-3 border-t border-line pt-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Frequency
                  </div>
                  <div className="mt-1 text-[13px] font-semibold text-ink">{report.frequency}</div>
                </div>
                {report.id === 'bfdp' || report.id === 'skfpd' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate(report.id, { filters: getQuarterlyFilterPayload(filters) })}
                    disabled={!reportState.isApplicable}
                    className="inline-flex items-center gap-1 rounded-md bg-civic-700 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-ink-subtle"
                  >
                    Open <span aria-hidden>→</span>
                  </button>
                ) : null}
                {report.id === 'ltrpp' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('ltrpp', { filters: getLTRPPFilterPayload(filters) })}
                    disabled={!reportState.isApplicable || !isLTRPPApplicable}
                    className="inline-flex items-center gap-1 rounded-md bg-civic-700 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-ink-subtle"
                  >
                    Open <span aria-hidden>→</span>
                  </button>
                ) : null}
                {report.id === 'road-safety' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('road-safety', { filters: getRoadSafetyFilterPayload(filters) })}
                    disabled={!reportState.isApplicable || !isRoadSafetyApplicable}
                    className="inline-flex items-center gap-1 rounded-md bg-civic-700 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-ink-subtle"
                  >
                    Open <span aria-hidden>→</span>
                  </button>
                ) : null}
                {report.id === 'asf-monitoring' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('asf-monitoring', { filters: getASFMonitoringFilterPayload(filters) })}
                    disabled={!reportState.isApplicable || !isASFMonitoringApplicable}
                    className="inline-flex items-center gap-1 rounded-md bg-civic-700 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-ink-subtle"
                  >
                    Open <span aria-hidden>→</span>
                  </button>
                ) : null}
                {report.id === 'sglg' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('sglg', { filters: getAnnualFilterPayload(filters) })}
                    disabled={!reportState.isApplicable || !isSGLGApplicable}
                    className="inline-flex items-center gap-1 rounded-md bg-civic-700 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-civic-600 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-ink-subtle"
                  >
                    Open <span aria-hidden>→</span>
                  </button>
                ) : null}
              </div>
            </Card>
          )
        })}
      </section>
    </div>
  )
}
