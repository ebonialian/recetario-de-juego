import type {
  ActType,
  ChildState,
  Interest,
  Materials,
  MotorStage,
  Objective,
  Place,
  SkillKey,
  TimeSlot,
  Who,
} from './types'

export const MOTOR_OPTIONS: { value: MotorStage; label: string }[] = [
  { value: 'sentada', label: 'Se sostiene sentada' },
  { value: 'gatea', label: 'Gatea' },
  { value: 'apoyo', label: 'Camina con apoyo' },
  { value: 'camina', label: 'Camina sola' },
  { value: 'corre', label: 'Corre' },
]

export const INTEREST_OPTIONS: { value: Interest; label: string }[] = [
  { value: 'animales', label: 'Animales' },
  { value: 'musica', label: 'Música' },
  { value: 'agua', label: 'Agua' },
  { value: 'apilar', label: 'Apilar y tirar' },
  { value: 'libros', label: 'Libros' },
  { value: 'munecos', label: 'Muñecos / bebés' },
  { value: 'autos', label: 'Autos' },
  { value: 'aire-libre', label: 'Aire libre' },
]

export const TIME_OPTIONS: { value: TimeSlot; label: string }[] = [
  { value: '5-10', label: '5–10 min' },
  { value: '15-20', label: '15–20 min' },
  { value: '30+', label: '30+ min' },
]

export const PLACE_OPTIONS: { value: Place; label: string }[] = [
  { value: 'living', label: 'Living' },
  { value: 'cocina', label: 'Cocina' },
  { value: 'patio', label: 'Patio / afuera' },
  { value: 'bano', label: 'Baño' },
]

export const STATE_OPTIONS: { value: ChildState; label: string }[] = [
  { value: 'despierta', label: 'Recién despierta' },
  { value: 'pilas', label: 'Con pilas' },
  { value: 'cansada', label: 'Cansada' },
]

export const MATERIALS_OPTIONS: { value: Materials; label: string }[] = [
  { value: 'casa', label: 'Solo lo que hay en casa' },
  { value: 'compro', label: 'Compro algo simple' },
  { value: 'salimos', label: 'Salimos' },
]

export const TYPE_OPTIONS: { value: ActType; label: string }[] = [
  { value: 'motricidad', label: 'Motricidad' },
  { value: 'sensorial', label: 'Sensorial' },
  { value: 'lenguaje', label: 'Lenguaje' },
  { value: 'arte', label: 'Arte / desastre' },
  { value: 'tranquila', label: 'Tranquila' },
]

export const OBJECTIVE_OPTIONS: { value: Objective; label: string }[] = [
  { value: 'compartir', label: 'Compartir un rato' },
  { value: 'cansarla', label: 'Cansarla antes de dormir' },
  { value: 'calmarla', label: 'Calmarla' },
  { value: 'lenguaje', label: 'Estimular lenguaje' },
]

export const WHO_OPTIONS: { value: Who; label: string }[] = [
  { value: 'solo', label: 'Solo yo' },
  { value: 'mama', label: 'Los dos con mamá' },
  { value: 'hermanos', label: 'Con hermanos / primos' },
]

export const SKILL_META: Record<
  SkillKey,
  { label: string; icon: string; bg: string; fg: string }
> = {
  motriz: {
    label: 'Motriz fino',
    icon: 'Hand',
    bg: 'bg-skill-motriz',
    fg: 'text-skill-motriz-foreground',
  },
  sensorial: {
    label: 'Sensorial',
    icon: 'Sparkles',
    bg: 'bg-skill-sensorial',
    fg: 'text-skill-sensorial-foreground',
  },
  lenguaje: {
    label: 'Lenguaje',
    icon: 'MessageCircle',
    bg: 'bg-skill-lenguaje',
    fg: 'text-skill-lenguaje-foreground',
  },
  cognitivo: {
    label: 'Cognitivo',
    icon: 'Lightbulb',
    bg: 'bg-skill-cognitivo',
    fg: 'text-skill-cognitivo-foreground',
  },
  emocional: {
    label: 'Emocional',
    icon: 'Heart',
    bg: 'bg-skill-emocional',
    fg: 'text-skill-emocional-foreground',
  },
  social: {
    label: 'Social',
    icon: 'Users',
    bg: 'bg-skill-social',
    fg: 'text-skill-social-foreground',
  },
}
