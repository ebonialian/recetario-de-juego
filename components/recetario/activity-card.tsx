'use client'

import { useEffect, useState } from 'react'
import { Clock, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Activity } from '@/lib/recetario/types'
import { CardDecoration } from './decoration'
import { SkillTag } from './skill-tag'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

const DURATION_LABEL: Record<Activity['duration'], string> = {
  '5-10': '5–10 min',
  '15-20': '15–20 min',
  '30+': '30+ min',
}

export function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const [user, setUser] = useState<User | null>(null)
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
  }, [])

  async function handleRate(value: 'up' | 'down') {
    if (!user || saving || rating) return
    setSaving(true)
    const { error } = await supabase.from('user_activity_log').insert({
      user_id: user.id,
      activity_title: activity.title,
      rating: value,
    })
    setSaving(false)
    if (error) {
      console.error('Error guardando rating:', error)
      return
    }
    setRating(value)
  }

  return (
    <article
      className="animate-card-in relative overflow-hidden rounded-xl border-2 border-terracota/40 bg-peach p-5 shadow-sm"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <CardDecoration variant={activity.decoration} />

      <header className="relative flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-xl font-bold text-balance text-terracota">
          {activity.title}
        </h3>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-salvia px-3 py-1 text-xs font-medium text-peach">
          <Clock className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
          {DURATION_LABEL[activity.duration]}
        </span>
      </header>

      {activity.seen && (
        <span className="relative mt-2 inline-block rounded-full bg-salvia/20 px-2.5 py-1 text-xs font-semibold text-salvia">
          Ya la probaste
        </span>
      )}
      
      <p className="relative mt-2 font-body text-sm leading-relaxed text-textdark">
        {activity.forWhat}
      </p>

      <div className="relative mt-4">
        <p className="font-body text-xs font-medium uppercase tracking-wide text-textdark">Necesitás</p>
        <p className="mt-1.5 font-body text-sm text-textdark/80">
          {activity.materialsList.join(' · ')}
        </p>
      </div>

      <ol className="relative mt-4 flex flex-col gap-2.5">
        {activity.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-salvia text-xs font-bold text-peach">
              {i + 1}
            </span>
            <span className="font-body text-sm leading-relaxed text-textdark">{step}</span>
          </li>
        ))}
      </ol>

      <div className="relative mt-4">
        <p className="font-body text-xs font-medium uppercase tracking-wide text-textdark">Fortalece</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {activity.skills.map((s) => (
            <SkillTag key={s} skill={s} />
          ))}
        </div>
      </div>

      <div className="relative mt-4 flex items-start gap-2 rounded-none border-l-4 border-salvia py-1 pl-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-salvia" aria-hidden="true" />
        <p className="font-body text-sm leading-relaxed text-textdark">
          <span className="font-bold">Qué aprende: </span>
          {activity.learns}
        </p>
      </div>

      {user && (
        <div className="relative mt-4 flex items-center justify-center gap-3 border-t border-terracota/20 pt-3">
          {rating ? (
            <p className="text-xs text-muted-foreground">¡Gracias por tu opinión!</p>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">¿Te sirvió?</span>
              <button
                onClick={() => handleRate('up')}
                disabled={saving}
                className="rounded-full bg-salvia/20 p-2 text-salvia hover:bg-salvia/30"
                aria-label="Me sirvió"
              >
                <ThumbsUp className="size-4" />
              </button>
              <button
                onClick={() => handleRate('down')}
                disabled={saving}
                className="rounded-full bg-terracota/20 p-2 text-terracota hover:bg-terracota/30"
                aria-label="No me sirvió"
              >
                <ThumbsDown className="size-4" />
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}