import { Card } from '@tremor/react'

export default function ChartEmptyState({ id, title, message = 'No chart data available.' }) {
  return (
    <Card id={id} className="flex min-h-80 flex-col justify-center rounded-xl border border-line bg-white text-center shadow-none ring-0">
      {typeof title === 'string' ? (
        <h3 className="text-sm font-semibold tracking-tightish text-ink">{title}</h3>
      ) : (
        <div className="flex justify-center">{title}</div>
      )}
      <p className="mt-2 text-sm text-ink-muted">{message}</p>
    </Card>
  )
}
