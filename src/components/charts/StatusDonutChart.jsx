import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

const fallbackPalette = ['#5b6573', '#7a4e8c', '#c2412d']

const getStatusColor = (status = '', index = 0) => {
  const normalizedStatus = status.toLowerCase()

  if (
    normalizedStatus.includes('non compliance') ||
    normalizedStatus.includes('non-compliance') ||
    normalizedStatus.includes('notice of non')
  ) {
    return '#c2412d'
  }

  if (normalizedStatus.includes('full')) {
    return '#2f7d64'
  }

  if (normalizedStatus.includes('partial')) {
    return '#d49a1a'
  }

  if (normalizedStatus.includes('none')) {
    return '#2a7f86'
  }

  if (normalizedStatus.includes('compliance') || normalizedStatus.includes('compliant')) {
    return '#2f7d64'
  }

  return fallbackPalette[index % fallbackPalette.length]
}

export default function StatusDonutChart({ statusCounts, selectedStatus, onStatusSelect }) {
  const labels = Object.keys(statusCounts)
  const series = Object.values(statusCounts)
  const colors = labels.map(getStatusColor)

  if (!labels.length) {
    return <ChartEmptyState title="Status Distribution" />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'inherit',
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          const status = labels[config.dataPointIndex]

          if (status) {
            onStatusSelect?.(status)
          }
        },
      },
    },
    labels,
    colors,
    stroke: { width: 2, colors: ['#ffffff'] },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontWeight: 500,
      markers: { width: 8, height: 8, radius: 10 },
      itemMargin: { horizontal: 10, vertical: 4 },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value.toFixed(1)}%`,
      style: { fontSize: '11px', fontWeight: 600 },
      dropShadow: { enabled: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Records',
              color: '#5b6573',
              fontSize: '11px',
              fontWeight: 500,
            },
            value: { color: '#1b2430', fontSize: '20px', fontWeight: 600 },
          },
        },
      },
    },
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-ink">Status Distribution</h3>
          {selectedStatus ? (
            <p className="mt-1 text-xs font-medium text-civic-700">
              Filtering table by {selectedStatus}
            </p>
          ) : null}
        </div>
        {selectedStatus ? (
          <button
            type="button"
            onClick={() => onStatusSelect?.('')}
            className="rounded-md border border-line px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:bg-surface-muted hover:text-ink"
          >
            Clear
          </button>
        ) : null}
      </div>
      <Chart options={options} series={series} type="donut" height={310} />
    </Card>
  )
}
