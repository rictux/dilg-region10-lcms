import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

function ChartTitle({ selectedLguPath }) {
  return (
    <h3 className="text-sm font-semibold tracking-tightish text-ink">
      Quarterly Trend
      {selectedLguPath ? (
        <span className="font-normal text-ink-muted"> ({selectedLguPath})</span>
      ) : null}
    </h3>
  )
}

export default function QuarterlyTrendChart({ data, selectedYear, selectedLguPath, maxScore = 9 }) {
  const seriesData = data.map((item) => item.averageScore)
  const hasData = seriesData.some((value) => value !== null)

  if (!hasData) {
    return (
      <ChartEmptyState
        title={<ChartTitle selectedLguPath={selectedLguPath} />}
        message="No score values are available for the selected year or current filters."
      />
    )
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: ['#2f7d64'],
    grid: {
      show: true,
      borderColor: '#f1f1f3',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
    stroke: {
      curve: 'smooth',
      width: 2.5,
    },
    markers: {
      size: 4,
      colors: ['#ffffff'],
      strokeColors: '#2f7d64',
      strokeWidth: 2,
      hover: { sizeOffset: 2 },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value === null ? '' : value.toFixed(1)),
      style: { colors: ['#18181b'], fontSize: '11px', fontWeight: 600 },
      background: { enabled: false },
    },
    xaxis: {
      categories: data.map((item) => `Q${item.quarter}`),
      labels: { style: { colors: '#71717a', fontSize: '11px' } },
      axisBorder: { color: '#e4e4e7' },
      axisTicks: { color: '#e4e4e7' },
    },
    yaxis: {
      min: 0,
      max: maxScore,
      tickAmount: 3,
      forceNiceScale: false,
      labels: {
        show: false,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${value.toFixed(1)} average score`,
      },
    },
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <div className="flex flex-col justify-between gap-1 md:flex-row md:items-center">
        <ChartTitle selectedLguPath={selectedLguPath} />
        <p className="text-[13px] text-ink-muted">{selectedYear || 'All available years'}</p>
      </div>
      <Chart
        options={options}
        series={[{ name: 'Average Score', data: seriesData }]}
        type="line"
        height={315}
      />
    </Card>
  )
}
