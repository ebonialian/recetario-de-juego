import { Clock, Sparkles } from 'lucide-react'
import type { Activity } from '@/lib/recetario/types'
import { CardDecoration } from './decoration'
import { SkillTag } from './skill-tag'

const DURATION_LABEL: Record<Activity['duration'], string> = {
  '5-10': '5–10 min',
  '15-20': '15–20 min',
  '30+': '30+ min',
}

export function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  return (
    <article
      className="animate-card-in relative overflow-hidden rounded-3xl border-2 border-border bg-card p-5 shadow-sm"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <CardDecoration variant={activity.decoration} />

      <header className="relative flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-heading text-xl font-bold text-balance text-foreground">
          {activity.title}
        </h3>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          <Clock className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
          {DURATION_LABEL[activity.duration]}
        </span>
      </header>

      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
        {activity.forWhat}
      </p>

      <div className="relative mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">Necesitás</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activity.materialsList.map((m) => (
            <span
              key={m}
              className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      <ol className="relative mt-4 flex flex-col gap-2.5">
        {activity.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-foreground/90">{step}</span>
          </li>
        ))}
      </ol>

      <div className="relative mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-foreground/60">Fortalece</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {activity.skills.map((s) => (
            <SkillTag key={s} skill={s} />
          ))}
        </div>
      </div>

      <div className="relative mt-4 flex items-start gap-2 rounded-2xl bg-muted p-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-foreground/90">
          <span className="font-bold">Qué aprende: </span>
          {activity.learns}
        </p>
      </div>
    </article>
  )
}
