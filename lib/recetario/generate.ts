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
  if (activity.objectives.includes(input.objective)) s += 3 // vuelve: desempate incluso en tiers laxos

  for (const interest of input.interests) {
    if (activity.interests.includes(interest)) s += 3
  }

  const gap = motorIndex(input) - activity.minMotor
  if (gap >= 0 && gap <= 1) s += 2

  s += Math.random() * 2.5

  return s
}

// Etapa motriz: NUNCA se relaja, en ningún tier ni paso.
function passesMotor(activity: Activity, input: PlayInput): boolean {
  return activity.minMotor <= motorIndex(input)
}

// Materiales: se relaja como último paso si no alcanza (igual que el código original).
function passesMaterials(activity: Activity, input: PlayInput): boolean {
  return MATERIAL_RANK[activity.materialsLevel] <= MATERIAL_RANK[input.materials]
}

// Tiers de intención real del padre. objective/type ahora son filtro duro
// escalonado — antes solo sumaban puntaje y podían perder contra otros ejes.
type Tier = { name: string; passes: (a: Activity, input: PlayInput) => boolean }

const INTENT_TIERS: Tier[] = [
  { name: 'objetivo+tipo', passes: (a, input) => a.objectives.includes(input.objective) && a.type === input.type },
  { name: 'objetivo', passes: (a, input) => a.objectives.includes(input.objective) },
  { name: 'tipo', passes: (a, input) => a.type === input.type },
  { name: 'ninguno', passes: () => true },
]

function rank(pool: Activity[], input: PlayInput): Activity[] {
  return pool
    .map((a) => ({ a, s: score(a, input) }))
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a)
}

function tryIntentTiers(
  pool: Activity[],
  input: PlayInput
): { activities: Activity[]; tier: string } | null {
  for (const tier of INTENT_TIERS) {
    const candidates = pool.filter((a) => tier.passes(a, input))
    if (candidates.length >= 3) return { activities: rank(candidates, input).slice(0, 3), tier: tier.name }
  }
  return null
}

export interface GenerateResult {
  activities: Activity[]
  tier: string
  materialsRelaxed: boolean
  bankInsufficient: boolean
}

function run(input: PlayInput, exclude: string[]): GenerateResult {
  const excludeSet = new Set(exclude)
  const motorOk = ACTIVITIES.filter((a) => passesMotor(a, input) && !excludeSet.has(a.id))

  // 1) Motor estricto + materiales estrictos.
  const strict = motorOk.filter((a) => passesMaterials(a, input))
  const strictResult = tryIntentTiers(strict, input)
  if (strictResult) return { ...strictResult, materialsRelaxed: false, bankInsufficient: false }

  // 2) Motor estricto, materiales relajados (como el original).
  const relaxedResult = tryIntentTiers(motorOk, input)
  if (relaxedResult) return { ...relaxedResult, materialsRelaxed: true, bankInsufficient: false }

  // 3) Ni relajando materiales llegamos a 3. El motor JAMÁS se pierde, a
  //    diferencia del "último recurso" original que usaba ACTIVITIES entero.
  return {
    activities: rank(motorOk, input).slice(0, 3),
    tier: 'insuficiente',
    materialsRelaxed: true,
    bankInsufficient: motorOk.length < 3,
  }
}

/** Mismo contrato que el código actual: mismo input, devuelve Activity[]. */
export function generateActivities(input: PlayInput, exclude: string[] = []): Activity[] {
  return run(input, exclude).activities
}

/** Nueva, opcional: para cuando definas la regla de "acá hay que llamar a la API". */
export function generateActivitiesWithMeta(input: PlayInput, exclude: string[] = []): GenerateResult {
  return run(input, exclude)
}
