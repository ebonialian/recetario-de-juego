'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { History, Lightbulb } from 'lucide-react'
import { PlayForm } from '@/components/recetario/play-form'
import { Results } from '@/components/recetario/results'
import { generateActivities } from '@/lib/recetario/generate'
import type { Activity, PlayInput } from '@/lib/recetario/types'
import { CafecitoButton } from '@/components/cafecito-button'
import { AuthStatus } from '@/components/auth-status'
import Logo from '@/components/Logo'
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
    <main className="mx-auto min-h-screen w-full max-w-[1100px] px-4 pb-10 md:px-8">
      {/* Bienvenida: única pantalla con texto centrado */}
      <header className="flex flex-col items-center gap-3 pt-8 pb-8 text-center">
        <h1>
          <Logo alto={36} />
        </h1>
        <p className="cuerpo max-w-md text-pretty text-noche-suave">
          Tu compinche para inventar la tarde: ideas sin pantalla, hechas a tu manera.
        </p>
        <div className="flex flex-col items-center gap-1">
          <AuthStatus />
          <Link
            href="/historial"
            className="etiqueta inline-flex min-h-11 items-center gap-1.5 text-noche underline underline-offset-4"
          >
            <History className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            Ver mi historial
          </Link>
          <Link
            href="/sugerir"
            className="etiqueta inline-flex min-h-11 items-center gap-1.5 text-noche underline underline-offset-4"
          >
            <Lightbulb className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            Sumá una idea
          </Link>
        </div>
      </header>

      {hasSearched ? (
        <div className="md:grid md:grid-cols-[320px_1fr] md:items-start md:gap-8">
          {/* Barra de filtros: fija al costado, con scroll propio */}
          <aside
            aria-label="Filtros"
            className="md:sticky md:top-6 md:max-h-[calc(100dvh-3rem)] md:overflow-y-auto md:overscroll-contain md:pr-2 [scrollbar-width:thin]"
          >
            <PlayForm loading={loading} onGenerate={handleGenerate} />
          </aside>

          <div ref={resultsRef} className="scroll-mt-6">
            <div className="mt-8 md:mt-0">
              <h2 className="titulo-pantalla mb-4 text-noche">3 ideas para hoy</h2>
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