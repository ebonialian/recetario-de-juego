import { Hand, Heart, Lightbulb, MessageCircle, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SKILL_META } from '@/lib/recetario/options'
import type { SkillKey } from '@/lib/recetario/types'
import { cn } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  Hand,
  Sparkles,
  MessageCircle,
  Lightbulb,
  Heart,
  Users,
}

export function SkillTag({ skill }: { skill: SkillKey }) {
  const meta = SKILL_META[skill]
  const Icon = ICONS[meta.icon] ?? Sparkles

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
        meta.bg,
        meta.fg,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      {meta.label}
    </span>
  )
}
