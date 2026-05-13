import { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import ChartEmptyState from '../components/charts/ChartEmptyState'
import DocumentCompletionChart from '../components/charts/DocumentCompletionChart'
import LocationFilters from '../components/filters/LocationFilters'
import ASFMonitoringTable from '../components/tables/ASFMonitoringTable'
import {
  useASFMonitoringFieldCounts,
  useASFMonitoringGeoOptions,
  useASFMonitoringIndicatorCompletion,
  useASFMonitoringLocationStats,
  useASFMonitoringTable,
} from '../hooks/useASFMonitoringQueries'
import { ASF_MONITORING_FIELDS } from '../utils/asfMonitoringAnalytics'

const moduleTitle = 'ASF Monitoring'
const defaultFilters = {
  provinceHuc: '',
  cityMunName: '',
  year: '',
  month: '',
}

const fieldColors = ['#0f766e', '#2563eb', '#b45309', '#4f46e5', '#be123c', '#64748b', '#15803d']

function LoadingState() {
  return (
    <Card className="rounded-xl border border-line bg-white p-10 text-center shadow-none ring-0">
      <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-civic-700">Loading {moduleTitle} dashboard…</div>
      <p className="mt-2 text-[13px] text-ink-muted">Fetching monthly ASF monitoring records.</p>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="rounded-xl border border-red-200 bg-red-50 p-10 text-center shadow-none ring-0">
      <div className="text-[15px] font-semibold tracking-tightish text-red-900">Unable to load {moduleTitle} data</div>
      <p className="mt-2 text-[13px] text-red-700">{message}</p>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="rounded-xl border border-line bg-white p-10 text-center shadow-none ring-0">
      <div className="text-[15px] font-semibold tracking-tightish text-ink">No {moduleTitle} data found</div>
      <p className="mt-2 text-[13px] text-ink-muted">
        Adjust the selected Province/HUC, City/Municipality, year, or month filters.
      </p>
    </Card>
  )
}

function PeriodPrompt() {
  return (
    <Card className="rounded-xl border border-line bg-white p-10 text-center shadow-none ring-0">
      <div className="text-[15px] font-semibold tracking-tightish text-ink">Select a year and month</div>
      <p className="mt-2 text-[13px] text-ink-muted">
        ASF Monitoring is a monthly report, so the dashboard loads only after both filters are selected.
      </p>
    </Card>
  )
}

function toTransparentColor(color) {
  if (!color?.startsWith('#') || color.length !== 7) {
    return color
  }

  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)

  return `rgba(${red}, ${green}, ${blue}, 0.22)`
}

function IndicatorColumnChart({
  data,
  field,
  color,
  selectedLocation = '',
  selectedFieldKey = '',
  onFilterSelect,
}) {
  const title = `LGUs with ${field.label}`

  if (!data.length) {
    return <ChartEmptyState title={title} />
  }

  const labels = data.map((item) => item.label ?? item.province)
  const hasHighlight = Boolean(selectedLocation || selectedFieldKey)
  const seriesData = data.map((item, index) => {
    const label = labels[index]
    const isHighlighted =
      (!selectedLocation || label === selectedLocation) &&
      (!selectedFieldKey || selectedFieldKey === field.key)

    return {
      x: label,
      y: Number(item.counts?.[field.key] ?? 0),
      fillColor: !hasHighlight ? color : isHighlighted ? color : toTransparentColor(color),
    }
  })
  const maxValue = Math.max(1, ...seriesData.map((item) => item.y))

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const item = data[config.dataPointIndex]

          if (item) {
            onFilterSelect?.({
              province: item.province,
              city: item.city,
              locationLabel: item.label ?? item.province,
              fieldKey: field.key,
              fieldLabel: field.label,
            })
          }
        },
      },
    },
    colors: [color],
    grid: { show: false },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '56%',
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value > 0 ? value.toLocaleString() : ''),
      offsetY: -18,
      style: { colors: ['#0f172a'], fontSize: '11px', fontWeight: 700 },
    },
    xaxis: {
      categories: labels,
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#475569', fontSize: '12px' },
      },
    },
    yaxis: {
      min: 0,
      max: Math.ceil(maxValue * 1.18),
      labels: { show: false },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value.toLocaleString()} LGU(s)`,
      },
    },
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <h3 className="text-sm font-semibold tracking-tightish text-ink">{title}</h3>
      <Chart options={options} series={[{ name: field.label, data: seriesData }]} type="bar" height={320} />
    </Card>
  )
}

export default function ASFMonitoringDashboard({ initialFilters }) {
  const queryClient = useQueryClient()
  const normalizedInitialFilters = useMemo(
    () => ({
      ...defaultFilters,
      ...(initialFilters ?? {}),
    }),
    [initialFilters],
  )
  const [filters, setFilters] = useState(normalizedInitialFilters)
  const [selectedChartFilter, setSelectedChartFilter] = useState({
    province: '',
    city: '',
    locationLabel: '',
    fieldKey: '',
    fieldLabel: '',
  })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    setFilters(normalizedInitialFilters)
    setSelectedChartFilter({ province: '', city: '', locationLabel: '', fieldKey: '', fieldLabel: '' })
    setPage(0)
  }, [normalizedInitialFilters])

  const queryFilters = useMemo(
    () => ({
      year: filters.year,
      month: filters.month,
      province: selectedChartFilter.province || filters.provinceHuc,
      city: selectedChartFilter.city || filters.cityMunName,
      fieldKey: selectedChartFilter.fieldKey,
      page,
      pageSize,
    }),
    [
      filters.year,
      filters.month,
      filters.provinceHuc,
      filters.cityMunName,
      selectedChartFilter.province,
      selectedChartFilter.city,
      selectedChartFilter.fieldKey,
      page,
      pageSize,
    ],
  )

  const chartFilters = useMemo(
    () => ({
      year: filters.year,
      month: filters.month,
      province: filters.provinceHuc,
      city: filters.cityMunName,
    }),
    [filters.year, filters.month, filters.provinceHuc, filters.cityMunName],
  )

  const geoOptionsQuery = useASFMonitoringGeoOptions()
  const hasRequiredPeriod = Boolean(filters.year && filters.month)
  const highlightedLocation =
    selectedChartFilter.locationLabel || filters.cityMunName || filters.provinceHuc

  const locationStatsQuery = useASFMonitoringLocationStats(chartFilters, { requireLocation: false })
  const fieldCountsQuery = useASFMonitoringFieldCounts(chartFilters, { requireLocation: false })
  const indicatorCompletionQuery = useASFMonitoringIndicatorCompletion(chartFilters, { requireLocation: false })
  const tableQuery = useASFMonitoringTable(queryFilters, { requireLocation: false })

  const isInitialDashboardLoading =
    locationStatsQuery.isLoading ||
    fieldCountsQuery.isLoading ||
    indicatorCompletionQuery.isLoading ||
    tableQuery.isLoading

  const dashboardError =
    locationStatsQuery.error ||
    fieldCountsQuery.error ||
    indicatorCompletionQuery.error ||
    tableQuery.error

  const locationStats = locationStatsQuery.data
  const fieldCounts = fieldCountsQuery.data ?? []
  const indicatorCompletion = indicatorCompletionQuery.data ?? []
  const tableData = tableQuery.data ?? { rows: [], count: 0 }
  const hasDashboardRecords =
    tableData.count > 0 ||
    fieldCounts.some((item) => Object.values(item.counts ?? {}).some((count) => count > 0))
  const isRefreshing =
    geoOptionsQuery.isFetching ||
    locationStatsQuery.isFetching ||
    fieldCountsQuery.isFetching ||
    indicatorCompletionQuery.isFetching ||
    tableQuery.isFetching

  const handleFilterChange = (nextFilters) => {
    setPage(0)
    setSelectedChartFilter({ province: '', city: '', locationLabel: '', fieldKey: '', fieldLabel: '' })
    setFilters({
      provinceHuc: nextFilters.provinceHuc ?? '',
      cityMunName: nextFilters.cityMunName ?? '',
      year: nextFilters.year ?? '',
      month: nextFilters.month ?? '',
    })
  }

  const handleChartFilterChange = (selection) => {
    setPage(0)
    setSelectedChartFilter((current) =>
      current.province === selection.province &&
      current.city === selection.city &&
      current.fieldKey === selection.fieldKey
        ? { province: '', city: '', locationLabel: '', fieldKey: '', fieldLabel: '' }
        : selection,
    )
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['asf-monitoring-geo-options'] })
    queryClient.invalidateQueries({ queryKey: ['asf-monitoring-location-stats'] })
    queryClient.invalidateQueries({ queryKey: ['asf-monitoring-field-counts'] })
    queryClient.invalidateQueries({ queryKey: ['asf-monitoring-indicator-completion'] })
    queryClient.invalidateQueries({ queryKey: ['asf-monitoring-table'] })
  }

  return (
    <div className="space-y-6">
      <LocationFilters
        filters={filters}
        onChange={handleFilterChange}
        geoOptions={geoOptionsQuery.data}
        optionsLoading={geoOptionsQuery.isLoading}
        optionError={geoOptionsQuery.error?.message}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        includeBarangay={false}
        includeQuarter={false}
        includeMonth
      />

      {dashboardError ? <ErrorState message={dashboardError.message} /> : null}
      {!hasRequiredPeriod ? <PeriodPrompt /> : null}
      {hasRequiredPeriod && isInitialDashboardLoading ? <LoadingState /> : null}
      {hasRequiredPeriod && !isInitialDashboardLoading && !dashboardError && !hasDashboardRecords ? <EmptyState /> : null}

      {hasRequiredPeriod && !isInitialDashboardLoading && !dashboardError && hasDashboardRecords ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(locationStats?.cards ?? []).map((card) => (
              <SummaryCard
                key={card.title}
                title={card.title}
                value={card.value}
                note={card.note}
                info={card.info}
              />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            {ASF_MONITORING_FIELDS.map((field, index) => (
              <IndicatorColumnChart
                key={field.key}
                data={fieldCounts}
                field={field}
                color={fieldColors[index % fieldColors.length]}
                selectedLocation={highlightedLocation}
                selectedFieldKey={selectedChartFilter.fieldKey}
                onFilterSelect={handleChartFilterChange}
              />
            ))}
            <DocumentCompletionChart
              documents={indicatorCompletion}
              title="ASF Indicator Coverage"
              positiveLabel="Yes"
              negativeLabel="No"
            />
          </section>

          <ASFMonitoringTable
            records={tableData.rows}
            totalRecords={tableData.count}
            page={page}
            pageSize={pageSize}
            activeStatusFilter={
              selectedChartFilter.fieldLabel
                ? `${selectedChartFilter.fieldLabel} in ${selectedChartFilter.locationLabel}`
                : ''
            }
            onClearStatusFilter={() =>
              handleChartFilterChange({ province: '', city: '', locationLabel: '', fieldKey: '', fieldLabel: '' })
            }
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize) => {
              setPage(0)
              setPageSize(nextPageSize)
            }}
          />
        </>
      ) : null}
    </div>
  )
}
