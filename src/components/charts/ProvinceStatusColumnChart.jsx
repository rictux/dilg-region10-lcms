import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

const defaultColors = ['#069c56', '#ff980e', '#d3212c']

export default function ProvinceStatusColumnChart({
  data,
  statuses,
  title = 'Status by Province/HUC',
  selectedFilter,
  highlightedLocation = '',
  highlightedStatus = '',
  onFilterSelect,
  colors = defaultColors,
}) {
  const locations = data.map((item) => item.label ?? item.city ?? item.province)
  const activeLocation = selectedFilter?.locationLabel || highlightedLocation
  const activeStatus = selectedFilter?.status || selectedFilter?.statusLabel || highlightedStatus
  const hasActiveHighlight = Boolean(activeLocation || activeStatus)
  const hasData = data.some((item) =>
    statuses.some((status) => Number(item.counts?.[status.value] ?? item.counts?.[status.label] ?? 0) > 0),
  )

  if (!hasData) {
    return (
      <ChartEmptyState
        title={title}
        message="No status counts are available for the selected filters."
      />
    )
  }

  const toTransparentColor = (color) => {
    if (!color?.startsWith('#') || color.length !== 7) {
      return color
    }

    const red = Number.parseInt(color.slice(1, 3), 16)
    const green = Number.parseInt(color.slice(3, 5), 16)
    const blue = Number.parseInt(color.slice(5, 7), 16)

    return `rgba(${red}, ${green}, ${blue}, 0.2)`
  }

  const series = statuses.map((status, seriesIndex) => ({
    name: status.label,
    data: data.map((item) => {
      const location = item.label ?? item.city ?? item.province
      const value = Number(item.counts?.[status.value] ?? item.counts?.[status.label] ?? 0)
      const locationMatches = !activeLocation || location === activeLocation
      const statusMatches =
        !activeStatus || status.value === activeStatus || status.label === activeStatus

      return {
        x: location,
        y: value,
        fillColor:
          !hasActiveHighlight || (locationMatches && statusMatches)
            ? colors[seriesIndex]
            : toTransparentColor(colors[seriesIndex]),
      }
    }),
  }))
  const maxValue = Math.max(1, ...series.flatMap((item) => item.data.map((point) => point.y)))

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'inherit',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const status = statuses[config.seriesIndex]
          const item = data[config.dataPointIndex]

          if (item && status) {
            onFilterSelect?.({
              province: item.province,
              city: item.city ?? '',
              locationLabel: item.label ?? item.city ?? item.province,
              status: status.value,
              statusLabel: status.label,
            })
          }
        },
      },
    },
    colors,
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontWeight: 500,
      markers: { width: 8, height: 8, radius: 10 },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    grid: {
      show: false,
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
        columnWidth: '62%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value > 0 ? value.toLocaleString() : ''),
      offsetY: -18,
      style: { colors: ['#18181b'], fontSize: '11px', fontWeight: 600 },
    },
    xaxis: {
      categories: locations,
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#71717a', fontSize: '11px' },
      },
      axisBorder: { color: '#e4e4e7' },
      axisTicks: { color: '#e4e4e7' },
    },
    yaxis: {
      min: 0,
      max: Math.ceil(maxValue * 1.18),
      forceNiceScale: true,
      labels: {
        show: false,
      },
    },
    tooltip: {
      y: {
        formatter: (value, { seriesIndex, dataPointIndex }) =>
          `${value.toLocaleString()} ${statuses[seriesIndex]?.label ?? 'record'} record(s) in ${
            locations[dataPointIndex] ?? 'this location'
          }`,
      },
    },
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tightish text-ink">{title}</h3>
          {selectedFilter?.locationLabel && selectedFilter?.statusLabel ? (
            <p className="mt-1 text-xs font-medium text-civic-700">
              Filtering records below by {selectedFilter.statusLabel} in {selectedFilter.locationLabel}
            </p>
          ) : null}
        </div>
        {selectedFilter?.province || selectedFilter?.status ? (
          <button
            type="button"
            onClick={() => onFilterSelect?.({ province: '', city: '', locationLabel: '', status: '', statusLabel: '' })}
            className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-zinc-50 hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </div>
      <Chart options={options} series={series} type="bar" height={430} />
    </Card>
  )
}
