'use client'

import { useRef, useState } from 'react'
import { PlayForm } from '@/components/recetario/play-form'
import { Results } from '@/components/recetario/results'
import { generateActivities } from '@/lib/recetario/generate'
import type { Activity, PlayInput } from '@/lib/recetario/types'

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const lastInput = useRef<PlayInput | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)

  function run(input: PlayInput, exclude: string[]) {
    setLoading(true)
    setHasSearched(true)
    // Pequeña pausa para el estado "piensa" con skeleton.
    window.setTimeout(() => {
      setActivities(generateActivities(input, exclude))
      setLoading(false)
    }, 950)
  }

  function handleGenerate(input: PlayInput) {
    lastInput.current = input
    run(input, [])
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleRegenerate() {
    if (!lastInput.current) return
    run(
      lastInput.current,
      activities.map((a) => a.id),
    )
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-peach px-4 pb-10">
      <header className="flex flex-col items-center gap-2 pt-8 pb-6 text-center">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-balance">
          <span className="text-primary">compinches</span><span className="text-accent">.</span>
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Tu compinche para inventar la tarde: ideas sin pantalla, hechas a tu manera.
        </p>
      </header>

      <PlayForm loading={loading} onGenerate={handleGenerate} />

      <div ref={resultsRef} className="scroll-mt-4">
        {hasSearched && (
          <div className="mt-8">
            <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
              3 ideas para hoy
            </h2>
            <Results
              loading={loading}
              activities={activities}
              onRegenerate={handleRegenerate}
            />
          </div>
        )}
      </div>
    </main>
  )
}
