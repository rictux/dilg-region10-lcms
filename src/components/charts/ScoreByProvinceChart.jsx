import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

export default function ScoreByProvinceChart({
  data,
  title = 'Avg Score by Province/HUC',
  highlightedLocation = '',
}) {
  if (!data.length) {
    return <ChartEmptyState title={title} />
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

  const baseColor = '#d97706'
  const highlightColor = '#0f766e'
  const hasHighlight = Boolean(highlightedLocation)
  const labels = data.map((item) => item.label ?? item.city ?? item.province)
  const maxValue = Math.max(1, ...data.map((item) => item.averageScore ?? 0))
  const seriesData = data.map((item, index) => {
    const label = labels[index]
    const isHighlighted = hasHighlight && label === highlightedLocation

    return {
      x: label,
      y: item.averageScore,
      fillColor: !hasHighlight ? baseColor : isHighlighted ? highlightColor : toTransparentColor(baseColor),
    }
  })

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: [baseColor],
    grid: {
      show: false,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '46%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => (value === null ? '' : value.toFixed(1)),
      offsetY: -18,
      style: { colors: ['#18181b'], fontSize: '11px', fontWeight: 600 },
    },
    xaxis: {
      categories: labels,
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
      labels: {
        show: false,
      },
    },
    tooltip: {
      y: {
        formatter: (value) =>
          value === null ? 'No score data' : `${value.toFixed(1)} average score`,
      },
    },
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <h3 className="text-sm font-semibold tracking-tightish text-ink">{title}</h3>
      <Chart
        options={options}
        series={[{ name: 'Average Score', data: seriesData }]}
        type="bar"
        height={340}
      />
    </Card>
  )
}
