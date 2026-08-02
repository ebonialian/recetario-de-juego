export type MotorStage = 'sentada' | 'gatea' | 'apoyo' | 'camina' | 'corre'

export type Interest =
  | 'animales'
  | 'musica'
  | 'agua'
  | 'apilar'
  | 'libros'
  | 'munecos'
  | 'autos'
  | 'aire-libre'

export type TimeSlot = '5-10' | '15-20' | '30+'
export type Place = 'living' | 'cocina' | 'patio' | 'bano'
export type ChildState = 'despierta' | 'pilas' | 'cansada'
export type Materials = 'casa' | 'compro' | 'salimos'
export type ActType = 'motricidad' | 'sensorial' | 'lenguaje' | 'arte' | 'tranquila'
export type Objective = 'compartir' | 'cansarla' | 'calmarla' | 'lenguaje'
export type Who = 'solo' | 'mama' | 'hermanos'

export type SkillKey =
  | 'motriz'
  | 'sensorial'
  | 'lenguaje'
  | 'cognitivo'
  | 'emocional'
  | 'social'

export type Decoration = 'nube' | 'estrella' | 'gota'

export interface Activity {
  id: string
  title: string
  forWhat: string
  learns: string
  duration: TimeSlot
  materialsList: string[]
  steps: string[]
  skills: SkillKey[]
  decoration: Decoration
  // metadatos de matcheo
  minMotor: number
  interests: Interest[]
  places: Place[]
  type: ActType
  states: ChildState[]
  objectives: Objective[]
  materialsLevel: Materials
}

export interface PlayInput {
  ageMonths: number
  motor: MotorStage
  interests: Interest[]
  time: TimeSlot
  place: Place
  state: ChildState
  materials: Materials
  type: ActType
  objective: Objective
  who: Who
  notes: string
}

export const MOTOR_ORDER: MotorStage[] = ['sentada', 'gatea', 'apoyo', 'camina', 'corre']
