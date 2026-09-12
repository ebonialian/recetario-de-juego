'use client'

import { RefreshCw } from 'lucide-react'
import type { Activity } from '@/lib/recetario/types'
import { ActivityCard } from './activity-card'
import { ActivitySkeleton } from './activity-skeleton'

interface ResultsProps {
  loading: boolean
  activities: Activity[]
  onRegenerate: () => void
}

export function Results({ loading, activities, onRegenerate }: ResultsProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-center text-sm font-medium text-textdark">
          Buscando algo para este momento…
        </p>
        <ActivitySkeleton />
        <ActivitySkeleton />
        <ActivitySkeleton />
      </div>
    )
  }

  if (activities.length === 0) return null

  return (
    <section aria-label="Ideas sugeridas" className="flex flex-col gap-4">
      <p className="px-1 text-center font-body text-sm leading-relaxed text-textdark">
        Acá tenés algo para compartir hoy.
      </p>
      <div className="flex flex-col gap-4">
        {activities.map((a, i) => (
          <ActivityCard key={a.id} activity={a} index={i} />
        ))}
      </div>

      <button
        type="button"
        onClick={onRegenerate}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-terracota px-6 text-lg font-bold text-peach shadow-sm transition-transform hover:bg-terracota/90 active:scale-[0.98]"
      >
        <RefreshCw className="size-5" strokeWidth={2.5} aria-hidden="true" />
        Otras 3 ideas
      </button>
    </section>
  )
}