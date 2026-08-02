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
        <p className="text-center text-sm font-semibold text-muted-foreground">
          Buscando ideas a la medida…
        </p>
        <ActivitySkeleton />
        <ActivitySkeleton />
        <ActivitySkeleton />
      </div>
    )
  }

  if (activities.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {activities.map((a, i) => (
          <ActivityCard key={a.id} activity={a} index={i} />
        ))}
      </div>

      <button
        type="button"
        onClick={onRegenerate}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border-2 border-primary bg-card px-6 text-lg font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
      >
        <RefreshCw className="size-5" strokeWidth={2.5} aria-hidden="true" />
        Otras 3 ideas
      </button>
    </div>
  )
}
