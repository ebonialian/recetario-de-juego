'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Hourglass,
  Lightbulb,
  Search,
  Star,
  X,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'
import { AuthStatus } from '@/components/auth-status'
import { RatingDetail } from './rating-detail'

/*
  /historial: dos pestañas.
  - Hechas: lo que marcó con "Lo hicimos" / "No enganchó", con su valoración.
  - Sugeridas: lo que mandó desde /sugerir, con su estado y lo que opinaron otras familias.
  Lee todo por las funciones my_history() y my_suggestions() de Supabase (ver supabase/*.sql).
*/

// ---------- Tipos (columnas de Supabase, en snake_case) ----------
interface ActivityRow {
  id: string
  title: string
  for_what?: string
  learns?: string
  duration?: '5-10' | '15-20' | '30+'
  materials_list?: string[]
  steps?: string[]
  status?: 'approved' | 'pending' | 'rejected'
  created_at?: string
}

interface LogRow {
  id: string
  activity_title: string
  rating: 'up' | 'down'
  stars: number | null
  comment: string | null
  created_at?: string
  activity: ActivityRow | null
}

interface SuggestionRow extends ActivityRow {
  stats: { avg_stars: number | null; ratings_count: number; hicimos: number; no_engancho: number }
  comments: { stars: number | null; rating: 'up' | 'down'; comment: string }[]
}

type Tab = 'hechas' | 'sugeridas'

const DURATION_LABEL: Record<string, string> = { '5-10': '5–10 min', '15-20': '15–20 min', '30+': '30+ min' }

const byNewest = <T extends { created_at?: string }>(rows: T[]) =>
  [...rows].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ---------- Piezas chicas ----------
function Stars({ value, size = 'size-5' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size, n <= Math.round(value) ? 'fill-noche text-noche' : 'text-noche-suave')}
          strokeWidth={2}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

function Notice({ kind, title, children }: { kind: 'exito' | 'error'; title: string; children?: React.ReactNode }) {
  const Icon = kind === 'exito' ? CircleCheck : CircleAlert
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-control p-3', kind === 'exito' ? 'bg-exito-tinte' : 'bg-error-tinte')}
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', kind === 'exito' ? 'text-exito' : 'text-error')} strokeWidth={2} aria-hidden="true" />
      <p className="cuerpo text-noche">
        <span className="font-bold">{title}</span> {children}
      </p>
    </div>
  )
}

/** Materiales y pasos, plegados para que la lista no sea eterna */
function HowToPlay({ activity }: { activity: ActivityRow }) {
  if (!activity.steps?.length) return null
  return (
    <details className="group mt-3">
      <summary className="opcion inline-flex min-h-11 cursor-pointer list-none items-center gap-1 text-noche underline underline-offset-4 [&::-webkit-details-marker]:hidden">
        Ver cómo se juega
        <ChevronDown className="size-[18px] transition-transform group-open:rotate-180" strokeWidth={2} aria-hidden="true" />
      </summary>
      <div className="mt-2 flex flex-col gap-3">
        {activity.materials_list && activity.materials_list.length > 0 && (
          <div>
            <p className="etiqueta text-noche">Qué necesitás</p>
            <p className="cuerpo text-noche">{activity.materials_list.join(' · ')}</p>
          </div>
        )}
        <div>
          <p className="etiqueta mb-2 text-noche">Paso a paso</p>
          <ol className="flex flex-col gap-2">
            {activity.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="etiqueta flex size-6 shrink-0 items-center justify-center rounded-tag bg-mostaza text-noche">
                  {i + 1}
                </span>
                <span className="cuerpo text-noche">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </details>
  )
}

// ---------- Hechas ----------
function DoneItem({ row }: { row: LogRow }) {
  const activity = row.activity
  const title = activity?.title ?? row.activity_title
  const pendingRating = row.stars === null && row.comment === null
  const date = formatDate(row.created_at)

  return (
    <li className="rounded-card bg-superficie p-5 sm:p-6">
      <h3 className="titulo-card text-balance text-noche">{title}</h3>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="micro inline-flex items-center gap-1.5 text-noche">
          {row.rating === 'up' ? (
            <Check className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          ) : (
            <X className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          )}
          <span className="font-bold">{row.rating === 'up' ? 'Lo hicimos' : 'No enganchó'}</span>
        </span>
        {activity?.duration && (
          <span className="micro inline-flex items-center gap-1.5 text-noche-suave">
            <Clock className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            {DURATION_LABEL[activity.duration]}
          </span>
        )}
        {date && <span className="micro text-noche-suave">{date}</span>}
      </div>

      {/* Lo que dejó, o la opción de dejarlo ahora */}
      {pendingRating ? (
        <RatingDetail logId={String(row.id)} kind={row.rating} />
      ) : (
        <div className="mt-3 flex flex-col gap-1">
          {row.stars !== null && <Stars value={row.stars} />}
          {row.comment && <p className="cuerpo text-noche">“{row.comment}”</p>}
        </div>
      )}

      {activity && <HowToPlay activity={activity} />}
    </li>
  )
}

// ---------- Sugeridas ----------
const STATUS_META = {
  pending: { icon: Hourglass, label: 'En revisión', hint: 'La estamos leyendo. Si suma, entra a la base.' },
  approved: { icon: CircleCheck, label: 'Publicada', hint: 'Ya la pueden encontrar otras familias.' },
  rejected: { icon: CircleX, label: 'No entró', hint: 'Esta vez no la sumamos. Podés mandar otra cuando quieras.' },
} as const

function SuggestionItem({ row }: { row: SuggestionRow }) {
  const status = STATUS_META[row.status ?? 'pending']
  const StatusIcon = status.icon
  const { stats, comments } = row
  const hasFeedback = stats.hicimos + stats.no_engancho > 0
  const date = formatDate(row.created_at)

  return (
    <li className="rounded-card bg-superficie p-5 sm:p-6">
      <h3 className="titulo-card text-balance text-noche">{row.title}</h3>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className={cn('micro inline-flex items-center gap-1.5', row.status === 'approved' ? 'text-exito' : 'text-noche')}>
          <StatusIcon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          <span className="font-bold">{status.label}</span>
        </span>
        {date && <span className="micro text-noche-suave">Enviada el {date}</span>}
      </div>
      <p className="micro mt-1 text-noche-suave">{status.hint}</p>

      {/* Valoraciones recibidas */}
      {row.status === 'approved' && (
        <div className="mt-4 border-t border-linea pt-4">
          <p className="etiqueta mb-2 text-noche">Lo que dijeron otras familias</p>
          {hasFeedback ? (
            <>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {stats.avg_stars !== null && (
                  <span className="inline-flex items-center gap-2">
                    <Stars value={Number(stats.avg_stars)} size="size-[18px]" />
                    <span className="cuerpo font-bold text-noche">
                      {Number(stats.avg_stars).toLocaleString('es-AR')}
                    </span>
                    <span className="micro text-noche-suave">
                      ({stats.ratings_count} {stats.ratings_count === 1 ? 'valoración' : 'valoraciones'})
                    </span>
                  </span>
                )}
              </div>
              <p className="micro mt-1 text-noche-suave">
                {stats.hicimos} {stats.hicimos === 1 ? 'familia la hizo' : 'familias la hicieron'}
                {stats.no_engancho > 0 && ` · a ${stats.no_engancho} no les enganchó`}
              </p>
              {comments.length > 0 && (
                <ul className="mt-3 flex flex-col gap-2">
                  {comments.map((c, i) => (
                    <li key={i} className="rounded-control bg-papel p-3">
                      {c.stars !== null && <Stars value={c.stars} size="size-4" />}
                      <p className="cuerpo text-noche">“{c.comment}”</p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="cuerpo text-noche-suave">Todavía nadie la probó. Cuando alguien la haga, lo vas a ver acá.</p>
          )}
        </div>
      )}

      <HowToPlay activity={row} />
    </li>
  )
}

// ---------- Vista ----------
export function HistoryView() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [tab, setTab] = useState<Tab>('hechas')
  const [done, setDone] = useState<LogRow[]>([])
  const [suggested, setSuggested] = useState<SuggestionRow[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    let ignore = false
    setStatus('loading')
    Promise.all([supabase.rpc('my_history'), supabase.rpc('my_suggestions')]).then(([h, s]) => {
      if (ignore) return
      if (h.error || s.error) {
        console.error('Error cargando historial:', h.error ?? s.error)
        setStatus('error')
        return
      }
      setDone(byNewest((h.data ?? []) as LogRow[]))
      setSuggested(byNewest((s.data ?? []) as SuggestionRow[]))
      setStatus('ready')
    })
    return () => {
      ignore = true
    }
  }, [user])

  if (!authChecked) return <p className="cuerpo text-noche-suave">Cargando…</p>

  if (!user) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="titulo-pantalla text-noche">Tu historial</h1>
        <p className="cuerpo text-noche">Entrá con tu mail para ver lo que hicieron y las ideas que sumaste.</p>
        <AuthStatus />
      </div>
    )
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'hechas', label: 'Hechas', count: done.length },
    { key: 'sugeridas', label: 'Sugeridas', count: suggested.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      <h1 className="titulo-pantalla text-noche">Tu historial</h1>

      <div role="tablist" aria-label="Historial" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'opcion inline-flex min-h-11 items-center gap-1.5 rounded-tag border-[1.5px] px-4 py-2 transition-colors',
              tab === t.key ? 'border-noche bg-noche text-papel' : 'border-noche-suave bg-superficie text-noche hover:bg-arena',
            )}
          >
            {t.label}
            {status === 'ready' && <span className={tab === t.key ? 'text-papel/80' : 'text-noche-suave'}>({t.count})</span>}
          </button>
        ))}
      </div>

      {status === 'loading' && <p className="cuerpo text-noche-suave">Buscando lo que hicieron…</p>}

      {status === 'error' && (
        <Notice kind="error" title="No se pudo cargar el historial.">
          Revisá la conexión y recargá la página.
        </Notice>
      )}

      {status === 'ready' && tab === 'hechas' &&
        (done.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {done.map((r) => (
              <DoneItem key={r.id} row={r} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-card bg-superficie p-6">
            <p className="cuerpo text-noche">
              Todavía no marcaste ninguna. Cuando hagan una idea, tocá “Lo hicimos” y queda guardada acá.
            </p>
            <Link href="/" className="opcion inline-flex min-h-11 items-center gap-1.5 text-noche underline underline-offset-4">
              <Search className="size-[18px]" strokeWidth={2} aria-hidden="true" />
              Buscar ideas
            </Link>
          </div>
        ))}

      {status === 'ready' && tab === 'sugeridas' &&
        (suggested.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {suggested.map((r) => (
              <SuggestionItem key={r.id} row={r} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-card bg-superficie p-6">
            <p className="cuerpo text-noche">¿Tenés un juego que funciona en casa? Sumalo y otras familias lo van a poder usar.</p>
            <Link href="/sugerir" className="opcion inline-flex min-h-11 items-center gap-1.5 text-noche underline underline-offset-4">
              <Lightbulb className="size-[18px]" strokeWidth={2} aria-hidden="true" />
              Sumá una idea
            </Link>
          </div>
        ))}
    </div>
  )
}
