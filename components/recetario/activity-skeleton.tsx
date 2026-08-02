export function ActivitySkeleton() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border-2 border-border bg-card p-5"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-primary/30" />
      </div>
      <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-muted" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-muted" />

      <div className="mt-4 flex flex-wrap gap-1.5">
        {[16, 20, 14].map((w, i) => (
          <div
            key={i}
            className="h-6 animate-pulse rounded-full bg-secondary"
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="size-6 shrink-0 animate-pulse rounded-full bg-accent/50" />
            <div className="h-4 flex-1 animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {[18, 16].map((w, i) => (
          <div
            key={i}
            className="h-6 animate-pulse rounded-full bg-muted"
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>
    </div>
  )
}
