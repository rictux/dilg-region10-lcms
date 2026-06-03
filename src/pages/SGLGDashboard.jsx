import { useEffect, useMemo, useState } from 'react'
import Chart from 'react-apexcharts'
import {
  Badge,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@tremor/react'
import { useQueryClient } from '@tanstack/react-query'
import SummaryCard from '../components/cards/SummaryCard'
import ChartEmptyState from '../components/charts/ChartEmptyState'
import ProvinceStatusColumnChart from '../components/charts/ProvinceStatusColumnChart'
import LocationFilters from '../components/filters/LocationFilters'
import { useSGLGDashboard, useSGLGGeoOptions, useSGLGTable } from '../hooks/useSGLGQueries'
import { getSGLGRecordLabel } from '../services/sglgService'
import { SGLG_INDICATORS } from '../utils/sglgIndicators'

const defaultFilters = {
  provinceHuc: '',
  cityMunName: '',
  year: '',
}

const sglgStatusSeries = [
  { label: 'PASSED', value: 'PASSED' },
  { label: 'FAILED', value: 'FAILED' },
]

const badgeClassName =
  'border px-1.5 py-0.5 text-[11px] font-medium leading-4 shadow-none ring-1 ring-inset xl:px-2 xl:text-xs'

const badgeColorClasses = {
  green: '!border-[#069c56] !bg-[#069c56] !text-white !ring-[#069c56]/20',
  red: '!border-[#d3212c] !bg-[#d3212c] !text-white !ring-[#d3212c]/20',
  slate: '!border-slate-300 !bg-slate-50 !text-slate-700 !ring-slate-600/20',
}

function BinaryBadge({ value }) {
  if (value === 1) {
    return <Badge className={`${badgeClassName} ${badgeColorClasses.green}`}>Pass</Badge>
  }

  if (value === 0) {
    return <Badge className={`${badgeClassName} ${badgeColorClasses.red}`}>Fail</Badge>
  }

  return <Badge className={`${badgeClassName} ${badgeColorClasses.slate}`}>N/A</Badge>
}

function RatingBadge({ value }) {
  const normalized = value?.toLowerCase()
  const colorClass = normalized === 'passed' ? badgeColorClasses.green : normalized === 'failed' ? badgeColorClasses.red : badgeColorClasses.slate

  return <Badge className={`${badgeClassName} ${colorClass}`}>{formatRating(value)}</Badge>
}

function formatRating(value) {
  const normalized = value?.toLowerCase()

  if (normalized === 'passed') {
    return 'Passed'
  }

  if (normalized === 'failed') {
    return 'Failed'
  }

  return 'No Rating'
}

function formatAreaStatus(value) {
  if (value === 1) {
    return 'Passed'
  }

  if (value === 0) {
    return 'Failed'
  }

  return 'No Rating'
}

function getAreaStatusClassName(value) {
  if (value === 1) {
    return 'text-[#069c56]'
  }

  if (value === 0) {
    return 'text-[#d3212c]'
  }

  return 'text-civic-900'
}

function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString() : 'N/A'
}

function getOverallRatingClassName(value) {
  const normalized = value?.toLowerCase()

  if (normalized === 'passed') {
    return 'text-[#069c56]'
  }

  if (normalized === 'failed') {
    return 'text-[#d3212c]'
  }

  return 'text-slate-900'
}

function LoadingState() {
  return (
    <Card className="rounded-xl border border-line bg-white p-10 text-center shadow-none ring-0">
      <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-civic-700">Loading SGLG dashboard…</div>
      <p className="mt-2 text-[13px] text-ink-muted">Fetching assessment records and indicators.</p>
    </Card>
  )
}

function ErrorState({ message }) {
  return (
    <Card className="rounded-xl border border-red-200 bg-red-50 p-10 text-center shadow-none ring-0">
      <div className="text-[15px] font-semibold tracking-tightish text-red-900">Unable to load SGLG data</div>
      <p className="mt-2 text-[13px] text-red-700">{message}</p>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="rounded-xl border border-line bg-white p-10 text-center shadow-none ring-0">
      <div className="text-[15px] font-semibold tracking-tightish text-ink">No SGLG data found</div>
      <p className="mt-2 text-[13px] text-ink-muted">
        Adjust the selected Province/HUC, City/Municipality, or year filters.
      </p>
    </Card>
  )
}

function SGLGRatingDonut({ statusCounts }) {
  const labels = Object.keys(statusCounts)
  const series = Object.values(statusCounts)

  if (!labels.length) {
    return <ChartEmptyState title="Overall Rating Distribution" />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
    },
    labels,
    colors: labels.map((label) => {
      const normalized = label.toLowerCase()
      if (normalized === 'passed') return '#069c56'
      if (normalized === 'failed') return '#d3212c'
      return '#64748b'
    }),
    legend: {
      position: 'bottom',
      fontSize: '13px',
      markers: { width: 10, height: 10, radius: 10 },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value.toFixed(1)}%`,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'LGUs',
              color: '#475569',
            },
          },
        },
      },
    },
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <h3 className="text-sm font-semibold tracking-tightish text-ink">Overall Rating Distribution</h3>
      <Chart options={options} series={series} type="donut" height={310} />
    </Card>
  )
}

const getAxisLimit = (values) => Math.max(1, ...values.map((value) => Math.abs(value)))

function getRequirementMarker(requirement) {
  if (!requirement) {
    return ''
  }

  const label = requirement.label === 'Required' ? 'Req' : requirement.label

  if (requirement.isUniversal) {
    return label
  }

  return `${label} ${requirement.count}/${requirement.total}`
}

function getRequirementLabels(fields) {
  return [
    ...new Set(
      fields
        .map((field) => getRequirementMarker(field.requirement))
        .filter(Boolean),
    ),
  ]
}

function getRequirementMarkerColor(field) {
  if (!field.requirement) {
    return null
  }

  return field.requirement.kind === 'pool' ? '#069c56' : '#d3212c'
}

function getRequirementNote(indicator, fields) {
  if (!fields.some((field) => field.requirement)) {
    return ''
  }

  if (['fin', 'drrm', 'soc'].includes(indicator.key)) {
    return 'Need to PASS all with *, to PASS in this Area.'
  }

  if (indicator.key === 'health') {
    return '* in red is required to pass. * in green counts toward the Any 4/Any 6 items to pass.'
  }

  if (indicator.key === 'env') {
    return '* in red is required to pass. * in green counts toward the Any 1/Any 2 Environmental Management pools.'
  }

  if (indicator.key === 'tour') {
    return '* in green counts toward the pools. PASS any 3 of the first four and any 3 of the last four to PASS in this Area.'
  }

  if (indicator.key === 'youth') {
    return '* in green counts toward the pool. PASS any 3 of these 4 indicators to PASS in this Area.'
  }

  if (indicator.key === 'biz') {
    return 'PASS the PCCI Finalist (green *), OR PASS all the red * items, to PASS in this Area.'
  }

  return '* Required to pass.'
}

function applyRequiredAxisMarkers(chartElement, fields) {
  const labelNodes = chartElement?.querySelectorAll('.apexcharts-yaxis-label')

  if (!labelNodes?.length) {
    return
  }

  labelNodes.forEach((labelNode, index) => {
    const field = fields[index]
    const markerColor = getRequirementMarkerColor(field)

    while (labelNode.firstChild) {
      labelNode.removeChild(labelNode.firstChild)
    }

    labelNode.appendChild(document.createTextNode(field?.label ?? ''))

    if (!markerColor) {
      return
    }

    const markerNode = document.createElementNS('http://www.w3.org/2000/svg', 'tspan')
    markerNode.textContent = ' *'
    markerNode.setAttribute('fill', markerColor)
    markerNode.setAttribute('font-weight', '800')
    labelNode.appendChild(markerNode)
  })
}

function groupIndicatorsBySubIndicatorCount(indicators) {
  const groups = indicators.reduce((result, indicator) => {
    const count = indicator.subIndicators.length

    if (!result.has(count)) {
      result.set(count, [])
    }

    result.get(count).push(indicator)
    return result
  }, new Map())

  return [...groups.entries()]
    .sort(([leftCount], [rightCount]) => rightCount - leftCount)
    .map(([count, groupedIndicators]) => ({
      count,
      indicators: groupedIndicators,
    }))
}

function AreaStatusChart({ indicators, showPercentages, onAreaSelect }) {
  if (!indicators.length) {
    return <ChartEmptyState title={showPercentages ? '10 Governance LGU Passing Rate' : '10 Governance Areas Rating'} />
  }

  const failValues = indicators.map((item) =>
    showPercentages
      ? item.total
        ? -1 * Number(((item.fail / item.total) * 100).toFixed(1))
        : 0
      : -1 * item.fail,
  )
  const passValues = indicators.map((item) => (showPercentages ? item.percentage : item.pass))
  const axisLimit = showPercentages ? 100 : getAxisLimit([...failValues, ...passValues])

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
      stacked: true,
      events: onAreaSelect
        ? {
            dataPointSelection: (_event, _chartContext, config) => {
              const indicator = indicators[config.dataPointIndex]

              if (indicator) {
                onAreaSelect(indicator)
              }
            },
          }
        : {},
    },
    colors: ['#d3212c', '#2f7d64'],
    grid: {
      show: false,
    },
    states: {
      active: { filter: { type: 'none' } },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        barHeight: '58%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      min: -axisLimit,
      max: axisLimit,
      labels: {
        show: false,
        formatter: (value) => showPercentages ? `${Math.abs(value)}%` : Math.abs(value).toFixed(0),
      },
    },
    yaxis: {
      labels: { style: { colors: '#475569', fontSize: '12px' } },
    },
    annotations: {
      xaxis: [
        {
          x: 0,
          borderColor: '#94a3b8',
          strokeDashArray: 0,
        },
      ],
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex }) => {
        const indicator = indicators[dataPointIndex]

        if (!indicator) {
          return ''
        }

        const isFail = seriesIndex === 0
        const count = isFail ? indicator.fail : indicator.pass
        const value = isFail ? Math.abs(failValues[dataPointIndex]) : passValues[dataPointIndex]
        const valueLabel = showPercentages ? `${value}%` : `${value} value`
        const totalLabel = showPercentages ? 'LGUs' : 'assessment value(s)'

        return `
          <div style="padding: 10px 12px; font-size: 13px; color: #0f172a;">
            <div style="font-weight: 700;">${indicator.title}</div>
            <div style="margin-top: 4px; color: #475569;">${isFail ? 'Fail' : 'Pass'}: ${valueLabel}</div>
            <div style="margin-top: 8px; font-weight: 700;">${count} of ${indicator.total} ${totalLabel}</div>
          </div>
        `
      },
    },
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h3 className="text-sm font-semibold tracking-tightish text-ink">
          {showPercentages ? '10 Governance LGU Passing Rate' : '10 Governance Areas Rating'}
        </h3>
        {onAreaSelect ? (
          <span className="text-xs font-medium text-ink-muted">Click an area to view its breakdown</span>
        ) : null}
      </div>
      <Chart
        options={{ ...options, xaxis: { ...options.xaxis, categories: indicators.map((item) => item.title) } }}
        series={[
          { name: showPercentages ? 'Fail Rate' : 'Fail', data: failValues },
          { name: showPercentages ? 'Pass Rate' : 'Pass', data: passValues },
        ]}
        type="bar"
        height={390}
      />
    </Card>
  )
}

function SubIndicatorCard({ indicator, showPercentages }) {
  const subIndicators = indicator.subIndicators
  const hasData = subIndicators.some((field) => field.total > 0)

  if (!hasData) {
    return (
      <ChartEmptyState
        id={`sglg-area-${indicator.key}`}
        title={indicator.title}
        message="No assessed indicator values are available for the selected filters."
      />
    )
  }

  const showRequirements = !showPercentages
  const failValues = subIndicators.map((field) =>
    showPercentages
      ? field.total
        ? -1 * Number(((field.fail / field.total) * 100).toFixed(1))
        : 0
      : -1 * field.fail,
  )
  const passValues = subIndicators.map((field) =>
    showPercentages ? field.percentage : field.pass,
  )
  const axisLimit = showPercentages ? 100 : getAxisLimit([...failValues, ...passValues])
  const subIndicatorsPassed = subIndicators.reduce((sum, field) => sum + field.pass, 0)
  const subIndicatorsFailed = subIndicators.reduce((sum, field) => sum + field.fail, 0)
  const requirementLabels = showRequirements ? getRequirementLabels(subIndicators) : []
  const requirementNote = showRequirements ? getRequirementNote(indicator, subIndicators) : ''
  const markerlessFields = subIndicators.map((field) => ({ label: field.label }))

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'Aptos, Segoe UI, sans-serif',
      stacked: true,
      events: {
        mounted: (chartContext) =>
          applyRequiredAxisMarkers(chartContext.el, showRequirements ? subIndicators : markerlessFields),
        updated: (chartContext) =>
          applyRequiredAxisMarkers(chartContext.el, showRequirements ? subIndicators : markerlessFields),
      },
    },
    colors: ['#d3212c', '#2f7d64'],
    grid: {
      show: false,
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: '55%',
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      min: -axisLimit,
      max: axisLimit,
      labels: {
        show: false,
        formatter: (value) => showPercentages ? `${Math.abs(value)}%` : Math.abs(value).toFixed(0),
      },
    },
    yaxis: {
      labels: {
        minWidth: 122,
        maxWidth: 184,
        style: { colors: '#475569', fontSize: '11px' },
      },
    },
    annotations: {
      xaxis: [
        {
          x: 0,
          borderColor: '#94a3b8',
          strokeDashArray: 0,
        },
      ],
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex }) => {
        const field = subIndicators[dataPointIndex]

        if (!field) {
          return ''
        }

        const isFail = seriesIndex === 0
        const count = isFail ? field.fail : field.pass
        const value = isFail ? Math.abs(failValues[dataPointIndex]) : passValues[dataPointIndex]
        const valueLabel = showPercentages ? `${value}%` : `${value} value`
        const totalLabel = showPercentages ? 'LGUs' : 'assessment value(s)'
        const requirement = field.requirement
        const requirementLine = showRequirements && requirement
          ? `<div style="margin-top: 8px; color: #0369a1; font-weight: 700;">${getRequirementMarker(requirement)}: ${requirement.description}</div>`
          : ''

        return `
          <div style="padding: 10px 12px; font-size: 13px; color: #0f172a;">
            <div style="font-weight: 700;">${field.label}</div>
            <div style="margin-top: 4px; color: #475569;">${isFail ? 'Fail' : 'Pass'}: ${valueLabel}</div>
            <div style="margin-top: 8px; font-weight: 700;">${count} of ${field.total} ${totalLabel}</div>
            ${requirementLine}
          </div>
        `
      },
    },
  }

  return (
    <Card id={`sglg-area-${indicator.key}`} className="scroll-mt-24 rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <div className="flex flex-col justify-between gap-2 border-b border-line pb-3 sm:flex-row sm:items-start">
        <div>
          <h3 className="text-sm font-semibold tracking-tightish text-ink">{indicator.title}</h3>
          <p className="mt-1 text-xs text-ink-muted">
            Indicators: {subIndicatorsPassed} passed, {subIndicatorsFailed} failed
          </p>
          {requirementLabels.length ? (
            <p className="mt-2 text-xs font-semibold text-sky-800">
              {requirementNote}
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-civic-100 bg-civic-50 px-3 py-1.5 text-right">
          {showPercentages ? (
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-civic-700">
              LGU Passing Rate
            </div>
          ) : null}
          <div className={`text-sm font-semibold ${showPercentages ? 'text-civic-900' : getAreaStatusClassName(indicator.latestStatus)}`}>
            {showPercentages ? `${indicator.percentage}%` : formatAreaStatus(indicator.latestStatus)}
          </div>
        </div>
      </div>
      <Chart
        options={{ ...options, xaxis: { ...options.xaxis, categories: subIndicators.map((field) => field.label) } }}
        series={[
          { name: showPercentages ? 'Fail Rate' : 'Fail', data: failValues },
          { name: showPercentages ? 'Pass Rate' : 'Pass', data: passValues },
        ]}
        type="bar"
        height={Math.max(280, subIndicators.length * 31)}
      />
    </Card>
  )
}

function SGLGTable({
  records,
  totalRecords,
  page,
  pageSize,
  activeFilterLabel = '',
  onClearFilter,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const currentPage = Math.min(page + 1, totalPages)

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <h2 className="text-sm font-semibold tracking-tightish text-ink">SGLG Detailed Records</h2>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {activeFilterLabel
              ? `Filtered by ${activeFilterLabel}`
              : 'Annual LGU ratings with the 10 governance area statuses.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeFilterLabel ? (
            <button
              type="button"
              onClick={onClearFilter}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink"
            >
              Clear filter
            </button>
          ) : null}
          <Badge color="slate">
            {records.length} of {totalRecords} records
          </Badge>
          <label className="flex items-center gap-2 text-[13px] text-ink-muted">
            Rows
            <select
              value={pageSize}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
              className="rounded-md border border-line bg-white px-2 py-1 text-sm text-ink transition hover:border-line-strong focus:border-civic-500 focus:outline-none focus:ring-2 focus:ring-civic-500/15"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto lg:overflow-hidden">
        <Table className="min-w-[900px] table-fixed text-xs leading-snug lg:min-w-0 lg:w-full xl:text-sm">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[5%]" />
            <col className="w-[8%]" />
            {SGLG_INDICATORS.map((indicator) => (
              <col key={indicator.key} className="w-[6.2%]" />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="whitespace-normal break-words px-1.5 py-2 leading-snug xl:px-2">
                LGU
              </TableHeaderCell>
              <TableHeaderCell className="whitespace-normal px-1 py-2 text-center leading-snug">
                Year
              </TableHeaderCell>
              <TableHeaderCell className="whitespace-normal px-1 py-2 text-center leading-snug">
                Overall
              </TableHeaderCell>
              {SGLG_INDICATORS.map((indicator) => (
                <TableHeaderCell
                  key={indicator.key}
                  className="whitespace-normal break-words px-0.5 py-2 text-center text-[11px] leading-tight xl:px-1 xl:text-xs"
                >
                  {indicator.shortTitle}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="whitespace-normal break-words px-1.5 py-2 font-medium text-slate-800 xl:px-2">
                  {getSGLGRecordLabel(record)}
                </TableCell>
                <TableCell className="px-1 py-2 text-center">{record.assessment_year ?? 'N/A'}</TableCell>
                <TableCell className="px-1 py-2 text-center">
                  <RatingBadge value={record.overall_rating} />
                </TableCell>
                {SGLG_INDICATORS.map((indicator) => (
                  <TableCell key={indicator.key} className="px-0.5 py-2 text-center xl:px-1">
                    <BinaryBadge value={record[indicator.statusKey]} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-line pt-4 md:flex-row md:items-center">
        <p className="text-[13px] text-ink-muted">
          Page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onPageChange?.(Math.max(0, page - 1))}
            disabled={page === 0}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange?.(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  )
}

export default function SGLGDashboard({ initialFilters }) {
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
    provinceMode: '',
    city: '',
    locationLabel: '',
    status: '',
    statusLabel: '',
  })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  useEffect(() => {
    setFilters(normalizedInitialFilters)
    setSelectedChartFilter({ province: '', provinceMode: '', city: '', locationLabel: '', status: '', statusLabel: '' })
    setPage(0)
  }, [normalizedInitialFilters])

  const queryFilters = useMemo(
    () => ({
      year: filters.year,
      province: filters.provinceHuc,
      city: filters.cityMunName,
    }),
    [filters.year, filters.provinceHuc, filters.cityMunName],
  )
  const dashboardFilters = useMemo(
    () => ({
      year: filters.year,
      province: selectedChartFilter.province || filters.provinceHuc,
      provinceMode: selectedChartFilter.provinceMode,
      city: selectedChartFilter.city || filters.cityMunName,
      status: selectedChartFilter.status,
    }),
    [
      filters.year,
      filters.provinceHuc,
      filters.cityMunName,
      selectedChartFilter.province,
      selectedChartFilter.provinceMode,
      selectedChartFilter.city,
      selectedChartFilter.status,
    ],
  )
  const ratingChartFilters = useMemo(
    () =>
      selectedChartFilter.province
        ? dashboardFilters
        : {
            year: filters.year,
            province: '',
            city: '',
            status: '',
          },
    [dashboardFilters, filters.year, selectedChartFilter.province],
  )
  const tableFilters = useMemo(
    () => ({
      year: dashboardFilters.year,
      province: dashboardFilters.province,
      provinceMode: dashboardFilters.provinceMode,
      city: dashboardFilters.city,
      status: selectedChartFilter.status,
      page,
      pageSize,
    }),
    [
      dashboardFilters.year,
      dashboardFilters.province,
      dashboardFilters.provinceMode,
      dashboardFilters.city,
      page,
      pageSize,
      selectedChartFilter.status,
    ],
  )

  const geoOptionsQuery = useSGLGGeoOptions()
  const dashboardQuery = useSGLGDashboard(dashboardFilters)
  const ratingChartQuery = useSGLGDashboard(ratingChartFilters)
  const tableQuery = useSGLGTable(tableFilters)
  const dashboard = dashboardQuery.data
  const ratingDashboard = ratingChartQuery.data
  const tableData = tableQuery.data ?? { rows: [], count: 0 }
  const isLoading = dashboardQuery.isLoading || ratingChartQuery.isLoading || tableQuery.isLoading
  const isRefreshing =
    geoOptionsQuery.isFetching || dashboardQuery.isFetching || ratingChartQuery.isFetching || tableQuery.isFetching
  const dashboardError = dashboardQuery.error || ratingChartQuery.error || tableQuery.error
  const showPercentages = !dashboardFilters.province && !dashboardFilters.city && !dashboardFilters.status
  const showStatusColumnChart = !queryFilters.city || Boolean(selectedChartFilter.province)
  const statusChartTitle = selectedChartFilter.province
    ? 'SGLG Rating by City/Municipality'
    : 'SGLG Rating by Province/HUC'
  const statusChartData = selectedChartFilter.province
    ? dashboard?.provinceStatusCounts ?? []
    : ratingDashboard?.provinceStatusCounts ?? []
  const highlightedStatusLocation =
    selectedChartFilter.locationLabel || (!selectedChartFilter.province ? filters.provinceHuc : '')
  const indicatorGroups = useMemo(
    () => groupIndicatorsBySubIndicatorCount(dashboard?.indicators ?? []),
    [dashboard?.indicators],
  )

  const handleFilterChange = (nextFilters) => {
    setPage(0)
    setSelectedChartFilter({ province: '', provinceMode: '', city: '', locationLabel: '', status: '', statusLabel: '' })
    setFilters({
      provinceHuc: nextFilters.provinceHuc ?? '',
      cityMunName: nextFilters.cityMunName ?? '',
      year: nextFilters.year ?? '',
    })
  }

  const handleChartFilterChange = (selection) => {
    setPage(0)
    const nextSelection = {
      provinceMode: selection.province && !selection.city ? 'group' : '',
      ...selection,
    }

    setSelectedChartFilter((current) =>
      current.province === nextSelection.province &&
      current.provinceMode === nextSelection.provinceMode &&
      current.city === nextSelection.city &&
      current.status === nextSelection.status
        ? { province: '', provinceMode: '', city: '', locationLabel: '', status: '', statusLabel: '' }
        : nextSelection,
    )
  }

  const handleAreaSelect = (indicator) => {
    if (!indicator?.key) {
      return
    }

    document
      .getElementById(`sglg-area-${indicator.key}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sglg-geo-options'] })
    queryClient.invalidateQueries({ queryKey: ['sglg-dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['sglg-table'] })
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
      />

      {dashboardError ? <ErrorState message={dashboardError.message} /> : null}
      {isLoading ? <LoadingState /> : null}
      {!isLoading && !dashboardError && !dashboard?.totalRecords ? <EmptyState /> : null}

      {!isLoading && !dashboardError && dashboard?.totalRecords ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {showPercentages ? (
              <>
                <SummaryCard title="Population" value={formatNumber(dashboard.totalPopulation)} />
                <SummaryCard title="No of LGUs" value={dashboard.uniqueLguCount} />
                <SummaryCard title="LGU Passed" value={dashboard.passedCount} />
                <SummaryCard title="LGU Failed" value={dashboard.failedCount} />
                <SummaryCard title="LGU Passing Rate" value={`${dashboard.overallPassRate}%`} />
              </>
            ) : (
              <>
                <SummaryCard title="Population" value={formatNumber(dashboard.latestPopulation)} />
                <SummaryCard title="Income Class" value={dashboard.latestIncomeClass} />
                <SummaryCard title="Area Passed" value={dashboard.areaPassTotal} />
                <SummaryCard title="Area Failed" value={dashboard.areaFailTotal} />
                <SummaryCard
                  title="Overall Rating"
                  value={formatRating(dashboard.latestOverallRating)}
                  valueClassName={getOverallRatingClassName(dashboard.latestOverallRating)}
                />
              </>
            )}
          </section>

          <section className={showStatusColumnChart ? 'grid gap-6 xl:grid-cols-2' : ''}>
            {showStatusColumnChart ? (
              <ProvinceStatusColumnChart
                data={statusChartData}
                statuses={sglgStatusSeries}
                title={statusChartTitle}
                selectedFilter={selectedChartFilter}
                highlightedLocation={highlightedStatusLocation}
                onFilterSelect={handleChartFilterChange}
                colors={['#069c56', '#d3212c']}
              />
            ) : null}
            <AreaStatusChart
              indicators={dashboard.indicators}
              showPercentages={showPercentages}
              onAreaSelect={showPercentages ? undefined : handleAreaSelect}
            />
          </section>

          <section className="space-y-6">
            {indicatorGroups.map((group) => (
              <div
                key={group.count}
                className={group.indicators.length > 1 ? 'grid gap-6 xl:grid-cols-2' : 'grid gap-6'}
              >
                {group.indicators.map((indicator) => (
                  <SubIndicatorCard
                    key={indicator.key}
                    indicator={indicator}
                    showPercentages={showPercentages}
                  />
                ))}
              </div>
            ))}
          </section>

          <SGLGTable
            records={tableData.rows}
            totalRecords={tableData.count}
            page={page}
            pageSize={pageSize}
            activeFilterLabel={
              selectedChartFilter.locationLabel && selectedChartFilter.statusLabel
                ? `${selectedChartFilter.statusLabel} in ${selectedChartFilter.locationLabel}`
                : ''
            }
            onClearFilter={() =>
              handleChartFilterChange({ province: '', provinceMode: '', city: '', locationLabel: '', status: '', statusLabel: '' })
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
