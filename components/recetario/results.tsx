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
      <div className="flex flex-col gap-4" aria-busy="true">
        <p className="cuerpo text-noche-suave">Buscando algo para este momento…</p>
        <ActivitySkeleton />
        <ActivitySkeleton />
        <ActivitySkeleton />
      </div>
    )
  }

  if (activities.length === 0) return null

  return (
    <section aria-label="Ideas sugeridas" className="flex flex-col gap-4">
      <p className="cuerpo text-noche">Acá tenés algo para compartir hoy.</p>

      <div className="flex flex-col gap-4">
        {activities.map((a, i) => (
          <ActivityCard key={a.id} activity={a} index={i} />
        ))}
      </div>

      <button
        type="button"
        onClick={onRegenerate}
        className="opcion inline-flex h-13 items-center justify-center gap-2 rounded-control border-2 border-noche bg-transparent px-6 text-noche transition-colors hover:bg-arena"
      >
        <RefreshCw className="size-5" strokeWidth={2} aria-hidden="true" />
        Ver otras 3 ideas
      </button>
    </section>
  )
}