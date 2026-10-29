import { useEffect, useId, useRef, useState } from 'react'

const toneDot = {
  good: 'bg-civic-600',
  warn: 'bg-amber-400',
  bad: 'bg-rose-500',
}

// Infers a status tone from the card title so status counts read at a glance
// without each page having to pass one.
function inferTone(title) {
  const text = String(title ?? '').toLowerCase()

  if (text.includes('partial')) return 'warn'
  if (/(none|non|fail|incomplete|missing)/.test(text)) return 'bad'
  if (/(full|passed|complete|compliant|compliance)/.test(text)) return 'good'

  return null
}

export default function SummaryCard({ title, value, note, info, tone, valueClassName = 'text-ink' }) {
  const [showInfo, setShowInfo] = useState(false)
  const wrapperRef = useRef(null)
  const infoId = useId()
  const resolvedTone = tone === undefined ? inferTone(title) : tone

  useEffect(() => {
    if (!showInfo) {
      return undefined
    }

    const handleClick = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setShowInfo(false)
      }
    }
    const handleKey = (event) => event.key === 'Escape' && setShowInfo(false)

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [showInfo])

  return (
    <div ref={wrapperRef} className="relative rounded-xl border border-line bg-white px-4 py-3.5">
      <div className="flex items-center gap-1.5">
        {resolvedTone ? (
          <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${toneDot[resolvedTone]}`} />
        ) : null}
        <span className="truncate text-[13px] font-medium text-ink-muted">{title}</span>
        {info ? (
          <button
            type="button"
            onClick={() => setShowInfo((current) => !current)}
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line-strong text-[10px] font-bold text-ink-muted transition hover:border-civic-600 hover:text-civic-700"
            aria-label={`About ${title}`}
            aria-expanded={showInfo}
            aria-controls={infoId}
          >
            i
          </button>
        ) : null}
      </div>
      <div className={`mt-1 font-num text-[26px] font-bold leading-tight ${valueClassName}`}>{value}</div>
      {showInfo && info ? (
        <div
          id={infoId}
          role="tooltip"
          className="absolute left-3 right-3 top-10 z-20 rounded-lg border border-line bg-white px-3 py-2 text-[13px] leading-relaxed text-ink-soft shadow-pop"
        >
          {info}
        </div>
      ) : null}
      {note ? <p className="mt-0.5 text-[12px] text-ink-muted">{note}</p> : null}
    </div>
  )
}
