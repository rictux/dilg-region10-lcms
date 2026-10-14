export default function Skeleton({ className = '' }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-zinc-100 ${className}`} />
}
