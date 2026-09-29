import { Hand, Heart, Lightbulb, MessageCircle, Sparkles, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SKILL_META } from '@/lib/recetario/options'
import type { SkillKey } from '@/lib/recetario/types'

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
    <span className="cuerpo inline-flex items-center gap-1.5 text-noche">
      <Icon className="size-[18px] text-noche-suave" strokeWidth={2} aria-hidden="true" />
      {meta.label}
    </span>
  )
}