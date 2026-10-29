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
      style: { colors: ['#1b2430'], fontSize: '11px', fontWeight: 600 },
    },
    xaxis: {
      categories: documents.map((item) => item.label),
      labels: {
        rotate: -35,
        trim: true,
        style: { colors: '#5b6573', fontSize: '11px' },
      },
      axisBorder: { color: '#e1e5de' },
      axisTicks: { color: '#e1e5de' },
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
          <div style="padding: 10px 12px; font-size: 12px; color: #1b2430;">
            <div style="font-weight: 600;">${document.fullLabel ?? document.label}</div>
            <div style="margin-top: 4px; color: #5b6573;">${document.percentage}% completion</div>
            <div style="margin-top: 8px; display: grid; gap: 4px;">
              <div style="display: flex; justify-content: space-between; gap: 18px; color: #276b56; font-weight: 600;">
                <span>${positiveLabel}</span>
                <span>${document.complete}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 18px; color: #b42318; font-weight: 600;">
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
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <Chart
        options={options}
        series={[{ name: 'Completion', data: documents.map((item) => item.percentage) }]}
        type="bar"
        height={340}
      />
    </Card>
  )
}
