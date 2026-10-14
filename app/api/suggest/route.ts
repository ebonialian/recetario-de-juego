import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import {
  INTEREST_OPTIONS,
  MATERIALS_OPTIONS,
  MOTOR_OPTIONS,
  OBJECTIVE_OPTIONS,
  PLACE_OPTIONS,
  SKILL_META,
  STATE_OPTIONS,
  TIME_OPTIONS,
  TYPE_OPTIONS,
} from '@/lib/recetario/options'
import type { ActivitySuggestion } from '@/lib/recetario/types'

const DECORATIONS = ['nube', 'estrella', 'gota'] as const

const valuesOf = (options: { value: string }[]) => options.map((o) => o.value)
const isOneOf = (v: unknown, allowed: string[]) => typeof v === 'string' && allowed.includes(v)
const isListOf = (v: unknown, allowed: string[], min = 1, max = 10) =>
  Array.isArray(v) && v.length >= min && v.length <= max && v.every((x) => allowed.includes(x))
const cleanText = (v: unknown, min: number, max: number) =>
  typeof v === 'string' && v.trim().length >= min && v.trim().length <= max ? v.trim() : null
const cleanList = (v: unknown, min: number, max: number, maxLen: number) => {
  if (!Array.isArray(v)) return null
  const items = v.filter((x) => typeof x === 'string').map((x: string) => x.trim()).filter(Boolean)
  if (items.length < min || items.length > max || items.some((x) => x.length > maxLen)) return null
  return items
}

export async function POST(req: NextRequest) {
  try {
    // Solo usuarios con sesión: validamos el token contra Supabase
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Necesitás entrar con tu mail' }, { status: 401 })
    const { data: userData, error: authError } = await supabase.auth.getUser(token)
    if (authError || !userData.user) {
      return NextResponse.json({ error: 'Necesitás entrar con tu mail' }, { status: 401 })
    }

    const body = (await req.json()) as ActivitySuggestion

    const title = cleanText(body.title, 3, 60)
    const forWhat = cleanText(body.forWhat, 10, 200)
    const learns = cleanText(body.learns, 10, 200)
    const materialsList = cleanList(body.materialsList, 1, 10, 80)
    const steps = cleanList(body.steps, 3, 6, 250)

    const valid =
      title &&
      forWhat &&
      learns &&
      materialsList &&
      steps &&
      Number.isInteger(body.minMotor) &&
      body.minMotor >= 0 &&
      body.minMotor < MOTOR_OPTIONS.length &&
      isOneOf(body.duration, valuesOf(TIME_OPTIONS)) &&
      isOneOf(body.type, valuesOf(TYPE_OPTIONS)) &&
      isOneOf(body.materialsLevel, valuesOf(MATERIALS_OPTIONS)) &&
      isListOf(body.interests, valuesOf(INTEREST_OPTIONS)) &&
      isListOf(body.places, valuesOf(PLACE_OPTIONS)) &&
      isListOf(body.states, valuesOf(STATE_OPTIONS)) &&
      isListOf(body.objectives, valuesOf(OBJECTIVE_OPTIONS)) &&
      isListOf(body.skills, Object.keys(SKILL_META), 1, 3)

    if (!valid) {
      return NextResponse.json({ error: 'Faltan datos o hay alguno inválido' }, { status: 400 })
    }

    // Entra a la misma tabla que el resto, pero como pendiente: no se muestra
    // a nadie hasta que la apruebes (status = 'approved').
    const { error } = await supabase.from('activities').insert({
      title,
      for_what: forWhat,
      learns,
      duration: body.duration,
      materials_list: materialsList,
      steps,
      skills: body.skills,
      decoration: DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)],
      min_motor: body.minMotor,
      interests: body.interests,
      places: body.places,
      type: body.type,
      states: body.states,
      objectives: body.objectives,
      materials_level: body.materialsLevel,
      source: 'user_suggested',
      status: 'pending',
      suggested_by: userData.user.id,
    })

    if (error) {
      console.error('Error guardando sugerencia:', error)
      return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })
  }
}
