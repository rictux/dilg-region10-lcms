import Chart from 'react-apexcharts'
import { Card } from '@tremor/react'
import ChartEmptyState from './ChartEmptyState'

export default function DocumentCompletionChart({
  documents,
  title = 'BFDP Document Completion',
  positiveLabel = 'Yes',
  negativeLabel = 'No',
}) {
  if (!documents.length) {
    return <ChartEmptyState title={title} />
  }

  const options = {
    chart: {
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: ['#2f7d64'],
    grid: {
      show: false,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '48%',
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value}%`,
      offsetY: -18,
      style: { colors: ['#18181b'], fontSize: '11px', fontWeight: 600 },
    },
    xaxis: {
      categories: documents.map((item) => item.label),
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
      max: 110,
      labels: {
        show: false,
      },
    },
    tooltip: {
      custom: ({ dataPointIndex }) => {
        const document = documents[dataPointIndex]

        if (!document) {
          return ''
        }

        return `
          <div style="padding: 10px 12px; font-size: 12px; color: #18181b;">
            <div style="font-weight: 600;">${document.fullLabel ?? document.label}</div>
            <div style="margin-top: 4px; color: #71717a;">${document.percentage}% completion</div>
            <div style="margin-top: 8px; display: grid; gap: 4px;">
              <div style="display: flex; justify-content: space-between; gap: 18px; color: #047857; font-weight: 600;">
                <span>${positiveLabel}</span>
                <span>${document.complete}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 18px; color: #b91c1c; font-weight: 600;">
                <span>${negativeLabel}</span>
                <span>${document.missing}</span>
              </div>
            </div>
          </div>
        `
      },
    },
  }

  return (
    <Card className="rounded-xl border border-line bg-white p-5 shadow-none ring-0">
      <h3 className="text-sm font-semibold tracking-tightish text-ink">{title}</h3>
      <Chart
        options={options}
        series={[{ name: 'Completion', data: documents.map((item) => item.percentage) }]}
        type="bar"
        height={340}
      />
    </Card>
  )
}
