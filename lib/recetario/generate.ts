import { ACTIVITIES } from './data'
import { MOTOR_ORDER, type Activity, type Materials, type PlayInput } from './types'

const MATERIAL_RANK: Record<Materials, number> = { casa: 0, compro: 1, salimos: 2 }

function motorIndex(input: PlayInput): number {
  return MOTOR_ORDER.indexOf(input.motor)
}

function score(activity: Activity, input: PlayInput): number {
  let s = 0

  if (activity.duration === input.time) s += 4
  if (activity.places.includes(input.place)) s += 4
  if (activity.type === input.type) s += 5
  if (activity.states.includes(input.state)) s += 3
  if (activity.objectives.includes(input.objective)) s += 3

  for (const interest of input.interests) {
    if (activity.interests.includes(interest)) s += 3
  }

  // Preferimos actividades pensadas justo para su etapa motriz.
  const gap = motorIndex(input) - activity.minMotor
  if (gap >= 0 && gap <= 1) s += 2

  // Jitter para que "Otras 3 ideas" traiga variedad.
  s += Math.random() * 2.5

  return s
}

function passesHardFilters(activity: Activity, input: PlayInput): boolean {
  if (activity.minMotor > motorIndex(input)) return false
  if (MATERIAL_RANK[activity.materialsLevel] > MATERIAL_RANK[input.materials]) return false
  return true
}

export function generateActivities(input: PlayInput, exclude: string[] = []): Activity[] {
  const excludeSet = new Set(exclude)

  const pick = (pool: Activity[]) =>
    pool
      .filter((a) => !excludeSet.has(a.id))
      .map((a) => ({ a, s: score(a, input) }))
      .sort((x, y) => y.s - x.s)
      .map((x) => x.a)

  // 1) Filtros duros (etapa motriz + materiales disponibles).
  let ranked = pick(ACTIVITIES.filter((a) => passesHardFilters(a, input)))

  // 2) Si no alcanzan 3, relajamos materiales pero respetamos la etapa motriz.
  if (ranked.length < 3) {
    ranked = pick(ACTIVITIES.filter((a) => a.minMotor <= motorIndex(input)))
  }

  // 3) Último recurso: si el filtro dejó menos de 3 (por exclusiones), usamos todo.
  if (ranked.length < 3) {
    ranked = pick(ACTIVITIES)
  }

  return ranked.slice(0, 3)
}
