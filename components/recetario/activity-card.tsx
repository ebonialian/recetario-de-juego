'use client'

import { useEffect, useState } from 'react'
import {
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  History,
  ListOrdered,
  Package,
  Sprout,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Activity } from '@/lib/recetario/types'
import { SkillTag } from './skill-tag'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

const DURATION_LABEL: Record<Activity['duration'], string> = {
  '5-10': '5–10 min',
  '15-20': '15–20 min',
  '30+': '30+ min',
}

/* Encabezado de sección: ícono con disco mostaza (eco de la pelota del logo) */
function SectionHeading({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="relative flex size-8 shrink-0 items-center justify-center" aria-hidden="true">
        <span className="absolute -top-0.5 -right-0.5 size-4 rounded-tag bg-mostaza" />
        <Icon className="relative size-6 text-noche" strokeWidth={2} />
      </span>
      <h4 className="etiqueta text-noche">{children}</h4>
    </div>
  )
}

export function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const [user, setUser] = useState<User | null>(null)
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
  }, [])

  async function handleRate(value: 'up' | 'down') {
    if (!user || saving || rating) return
    setSaving(true)
    setError(false)
    const { error } = await supabase.from('user_activity_log').insert({
      user_id: user.id,
      activity_title: activity.title,
      rating: value,
    })
    setSaving(false)
    if (error) {
      console.error('Error guardando rating:', error)
      setError(true)
      return
    }
    setRating(value)
  }

  return (
    <article
      className="animate-card-in rounded-card bg-superficie p-6"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      {/* Nombre */}
      <h3 className="titulo-card text-balance text-noche">{activity.title}</h3>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="micro inline-flex items-center gap-1.5 text-noche-suave">
          <Clock className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          {DURATION_LABEL[activity.duration]}
        </span>
        {activity.seen && (
          <span className="micro inline-flex items-center gap-1.5 text-noche-suave">
            <History className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            Ya la probaron
          </span>
        )}
      </div>

      <p className="cuerpo mt-3 max-w-prose text-noche">{activity.forWhat}</p>

      {/*
        Celular: una columna, en el orden del DS (necesitás → pasos → fortalece).
        Escritorio: necesitás y fortalece a la izquierda, pasos a la derecha.
      */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-8">
        {/* Qué necesitás */}
        <div className="lg:col-start-1 lg:row-start-1">
          <SectionHeading icon={Package}>Qué necesitás</SectionHeading>
          <p className="cuerpo text-noche">{activity.materialsList.join(' · ')}</p>
        </div>

        {/* Paso a paso */}
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <SectionHeading icon={ListOrdered}>Paso a paso</SectionHeading>
          <ol className="flex flex-col gap-3">
            {activity.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="etiqueta flex size-6 shrink-0 items-center justify-center rounded-tag bg-mostaza text-noche">
                  {i + 1}
                </span>
                <span className="cuerpo text-noche">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Qué fortalece */}
        <div className="lg:col-start-1 lg:row-start-2 lg:self-start">
          <SectionHeading icon={Sprout}>Qué fortalece</SectionHeading>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {activity.skills.map((s) => (
              <SkillTag key={s} skill={s} />
            ))}
          </div>
          <p className="cuerpo mt-2 text-noche">{activity.learns}</p>
        </div>
      </div>

      {/* Feedback */}
      {user && (
        <div className="mt-6 border-t border-linea pt-4">
          {rating ? (
            <div role="status" className="flex items-center gap-2 rounded-control bg-exito-tinte p-3">
              <CircleCheck className="size-5 shrink-0 text-exito" strokeWidth={2} aria-hidden="true" />
              <p className="cuerpo font-bold text-noche">Guardado en tu historial</p>
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="mb-3 flex items-start gap-2 rounded-control bg-error-tinte p-3">
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-error" strokeWidth={2} aria-hidden="true" />
                  <p className="cuerpo text-noche">
                    <span className="font-bold">No se pudo guardar.</span> Revisá la conexión y probá de nuevo.
                  </p>
                </div>
              )}
              <p className="micro mb-2 text-noche-suave">¿Cómo les fue?</p>
              <div className="grid grid-cols-2 gap-2 lg:max-w-sm">
                <button
                  type="button"
                  onClick={() => handleRate('up')}
                  disabled={saving}
                  className="opcion inline-flex h-11 items-center justify-center gap-1.5 rounded-control bg-noche px-3 text-papel transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="size-[18px]" strokeWidth={2} aria-hidden="true" />
                  Lo hicimos
                </button>
                <button
                  type="button"
                  onClick={() => handleRate('down')}
                  disabled={saving}
                  className="opcion inline-flex h-11 items-center justify-center gap-1.5 rounded-control border-2 border-noche bg-superficie px-3 text-noche transition-colors hover:bg-arena disabled:opacity-50"
                >
                  <X className="size-[18px]" strokeWidth={2} aria-hidden="true" />
                  No enganchó
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  )
}