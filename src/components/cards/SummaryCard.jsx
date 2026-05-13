import { Card, Metric, Text } from '@tremor/react'
import { useState } from 'react'

export default function SummaryCard({ title, value, note, info, valueClassName = 'text-ink' }) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <Card className="relative rounded-xl border border-line bg-white p-4 shadow-none ring-0">
      <div className="flex items-center gap-2">
        <Text className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
          {title}
        </Text>
        {info ? (
          <button
            type="button"
            onClick={() => setShowInfo((current) => !current)}
            className="flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-semibold text-ink-muted transition hover:border-civic-600 hover:text-civic-700"
            aria-label={`${title} information`}
          >
            i
          </button>
        ) : null}
      </div>
      <Metric
        className={`mt-2 font-num text-[26px] font-semibold leading-tight tracking-tighter2 ${valueClassName}`}
      >
        {value}
      </Metric>
      {showInfo && info ? (
        <div className="absolute left-4 top-12 z-20 max-w-56 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-ink-soft shadow-pop">
          {info}
        </div>
      ) : null}
      {note ? <Text className="mt-1 text-xs text-ink-muted">{note}</Text> : null}
    </Card>
  )
}
