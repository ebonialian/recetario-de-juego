export function ActivitySkeleton() {
  const bar = 'animate-pulse rounded-control bg-arena motion-reduce:animate-none'

  return (
    <div className="rounded-card bg-superficie p-6" aria-hidden="true">
      {/* Nombre y meta */}
      <div className={`h-7 w-3/5 ${bar}`} />
      <div className={`mt-3 h-4 w-24 ${bar}`} />

      {/* Descripción */}
      <div className={`mt-4 h-4 w-full ${bar}`} />
      <div className={`mt-2 h-4 w-4/5 ${bar}`} />

      {/* Qué necesitás */}
      <div className={`mt-6 h-4 w-28 ${bar}`} />
      <div className={`mt-3 h-4 w-2/3 ${bar}`} />

      {/* Paso a paso */}
      <div className={`mt-6 h-4 w-24 ${bar}`} />
      <div className="mt-3 flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="size-6 shrink-0 animate-pulse rounded-tag bg-arena motion-reduce:animate-none" />
            <div className={`h-4 flex-1 ${bar}`} />
          </div>
        ))}
      </div>
    </div>
  )
}