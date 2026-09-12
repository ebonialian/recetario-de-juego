'use client'

import { useEffect, useRef, useState } from 'react'
import { PlayForm } from '@/components/recetario/play-form'
import { Results } from '@/components/recetario/results'
import { generateActivities } from '@/lib/recetario/generate'
import type { Activity, PlayInput } from '@/lib/recetario/types'
import { CafecitoButton } from '@/components/cafecito-button'
import { AuthStatus } from '@/components/auth-status'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const lastInput = useRef<PlayInput | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const sessionId = useRef<string>('')
  const shownTitles = useRef<string[]>([])

  useEffect(() => {
    let id = localStorage.getItem('session_id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('session_id', id)
    }
    sessionId.current = id
  }, [])

  async function run(input: PlayInput, excludeTitles: string[]) {
    setLoading(true)
    setHasSearched(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          excludeTitles,
          session_id: sessionId.current,
          user_id: sessionData.session?.user.id ?? null,
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setActivities(data.activities)
      shownTitles.current = [...shownTitles.current, ...data.activities.map((a: Activity) => a.title)]
    } catch (err) {
      console.error('Fallback a generación local:', err)
      setActivities(generateActivities(input, []))
    } finally {
      setLoading(false)
    }
  }

  function handleGenerate(input: PlayInput) {
    lastInput.current = input
    shownTitles.current = []
    run(input, [])
    requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleRegenerate() {
    if (!lastInput.current) return
    run(lastInput.current, shownTitles.current)
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-peach px-4 pb-10 lg:max-w-6xl lg:px-8">
      <header className="flex flex-col items-center gap-2 pt-8 pb-6 text-center">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-balance">
          <span className="text-primary">compinches</span><span className="text-accent">.</span>
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Tu compinche para inventar la tarde: ideas sin pantalla, hechas a tu manera.
        </p>
        <div className="mt-2">
          <AuthStatus />
          <Link href="/historial" className="mt-1 block text-center text-xs text-terracota underline">
            Ver mi historial
          </Link>
        </div>
      </header>

      {hasSearched ? (
        <div className="lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8">
          <div>
            <PlayForm loading={loading} onGenerate={handleGenerate} />
          </div>

          <div ref={resultsRef} className="scroll-mt-4 lg:sticky lg:top-8">
            <div className="mt-8 lg:mt-0">
              <h2 className="mb-4 font-heading text-2xl font-bold text-foreground">
                3 ideas para hoy
              </h2>
              <Results
                loading={loading}
                activities={activities}
                onRegenerate={handleRegenerate}
              />
            </div>
          </div>
        </div>
      ) : (
        <div ref={resultsRef} className="scroll-mt-4">
          <PlayForm loading={loading} onGenerate={handleGenerate} variant="expanded" />
        </div>
      )}

      <footer className="mt-10 flex justify-center">
        <CafecitoButton placement="footer" />
      </footer>
    </main>
  )
}