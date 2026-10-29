export default function Skeleton({ className = '', style }) {
  return <div aria-hidden style={style} className={`animate-pulse rounded-md bg-surface-sunken ${className}`} />
}
