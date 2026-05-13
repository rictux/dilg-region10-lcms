import { Badge, Card } from '@tremor/react'

export default function SGLGPlaceholder({
  title = 'SGLG Dashboard',
  message = 'SGLG dashboard will be added soon.',
}) {
  return (
    <Card className="rounded-xl border border-line bg-white p-10 shadow-none ring-0">
      <Badge color="amber">Placeholder</Badge>
      <h2 className="mt-4 text-xl font-semibold tracking-tighter2 text-ink">{title}</h2>
      <p className="mt-2 text-[13px] text-ink-muted">{message}</p>
    </Card>
  )
}
