import Skeleton from './Skeleton'

/** Placeholder in the shape of a report dashboard: summary row, two charts, a table. */
export default function DashboardSkeleton({ label = 'Loading dashboard' }) {
  return (
    <div className="space-y-5" role="status" aria-label={label}>
      <span className="sr-only">{label}…</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="rounded-xl border border-line bg-white px-4 py-3.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="rounded-xl border border-line bg-white p-5">
            <Skeleton className="h-4 w-40" />
            <div className="mt-6 flex h-56 items-end gap-3">
              {[60, 85, 45, 70, 92, 55, 78].map((height, bar) => (
                <Skeleton key={bar} className="flex-1 rounded-b-none" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-line bg-white p-5">
        <Skeleton className="h-4 w-48" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
