import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { MOTOR_ORDER, type PlayInput, type Activity, type MotorStage, type Materials } from '@/lib/recetario/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MATERIAL_RANK: Record<Materials, number> = { casa: 0, compro: 1, salimos: 2 }

function motorIndex(motor: MotorStage): number {
  return MOTOR_ORDER.indexOf(motor)
}

function dbRowToActivity(row: any): Activity {
  return {
    id: row.id,
    title: row.title,
    forWhat: row.for_what,
    learns: row.learns,
    duration: row.duration,
    materialsList: row.materials_list,
    steps: row.steps,
    skills: row.skills,
    decoration: row.decoration,
    minMotor: row.min_motor,
    interests: row.interests,
    places: row.places,
    type: row.type,
    states: row.states,
    objectives: row.objectives,
    materialsLevel: row.materials_level,
  }
}

function scoreRow(row: any, input: PlayInput): number {
  let s = 0
  if (row.duration === input.time) s += 4
  if (row.places.includes(input.place)) s += 4
  if (row.type === input.type) s += 5
  if (row.states.includes(input.state)) s += 3
  if (row.objectives.includes(input.objective)) s += 3
  for (const interest of input.interests) {
    if (row.interests.includes(interest)) s += 3
  }
  const gap = motorIndex(input.motor) - row.min_motor
  if (gap >= 0 && gap <= 1) s += 2
  s += Math.random() * 2.5
  return s
}

export async function POST(req: NextRequest) {
  try {
    const { input, excludeTitles = [], session_id, user_id } = (await req.json()) as {
      input: PlayInput
      excludeTitles: string[]
      session_id?: string
      user_id?: string | null
    }

    let seenTitles: string[] = []
    if (user_id) {
      const { data: history } = await supabase
        .from('user_activity_log')
        .select('activity_title')
        .eq('user_id', user_id)
      seenTitles = (history ?? []).map((h) => h.activity_title)
    }

    const { data: candidates, error: fetchError } = await supabase
      .from('activities')
      .select('*')
      .eq('status', 'approved')

    if (fetchError) throw fetchError

    const motorIdx = motorIndex(input.motor)
    const hardFiltered = (candidates ?? []).filter(
      (row) =>
        row.min_motor <= motorIdx &&
        MATERIAL_RANK[row.materials_level as Materials] <= MATERIAL_RANK[input.materials],
    )

    const notInThisSession = hardFiltered.filter((row) => !excludeTitles.includes(row.title))
    const unseen = notInThisSession.filter((row) => !seenTitles.includes(row.title))
    const alreadySeen = notInThisSession.filter((row) => seenTitles.includes(row.title))

    const ranked = unseen
      .map((row) => ({ row, s: scoreRow(row, input) }))
      .sort((a, b) => b.s - a.s)
      .map((x) => x.row)

    let selectedRows = ranked.slice(0, 3)

    if (selectedRows.length < 3) {
      const rankedSeen = alreadySeen
        .map((row) => ({ row, s: scoreRow(row, input) }))
        .sort((a, b) => b.s - a.s)
        .map((x) => x.row)
      selectedRows = [...selectedRows, ...rankedSeen.slice(0, 3 - selectedRows.length)]
    }

    let activities: Activity[] = selectedRows.map((row) => ({
      ...dbRowToActivity(row),
      seen: seenTitles.includes(row.title),
    }))

    if (activities.length < 3) {
      const faltan = 3 - activities.length
      const excludeForPrompt = [...excludeTitles, ...activities.map((a) => a.title)]

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        tools: [
          {
            name: 'sugerir_actividades',
            description: 'Devuelve las actividades sugeridas sin pantalla',
            input_schema: {
              type: 'object',
              properties: {
                actividades: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      forWhat: { type: 'string' },
                      learns: { type: 'string' },
                      materialsList: { type: 'array', items: { type: 'string' } },
                      steps: { type: 'array', items: { type: 'string' } },
                      skills: {
                        type: 'array',
                        items: {
                          type: 'string',
                          enum: ['motriz', 'sensorial', 'lenguaje', 'cognitivo', 'emocional', 'social'],
                        },
                      },
                      decoration: { type: 'string', enum: ['nube', 'estrella', 'gota'] },
                    },
                    required: ['title', 'forWhat', 'learns', 'materialsList', 'steps', 'skills', 'decoration'],
                  },
                },
              },
              required: ['actividades'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'sugerir_actividades' },
        messages: [{ role: 'user', content: buildPrompt(input, excludeForPrompt, faltan) }],
      })

      const toolUse = message.content.find((b) => b.type === 'tool_use')
      const parsed = toolUse && 'input' in toolUse ? (toolUse.input as any).actividades : []

      const generatedRows = parsed.map((item: any) => ({
        id: crypto.randomUUID(),
        title: item.title,
        for_what: item.forWhat,
        learns: item.learns,
        duration: input.time,
        materials_list: item.materialsList,
        steps: item.steps,
        skills: item.skills,
        decoration: item.decoration,
        min_motor: motorIdx,
        interests: input.interests,
        places: [input.place],
        type: input.type,
        states: [input.state],
        objectives: [input.objective],
        materials_level: input.materials,
        source: 'ai_generated',
        status: 'pending',
      }))

      const { error: insertError } = await supabase
        .from('activities')
        .insert(generatedRows)
      if (insertError) console.error('Error guardando generadas:', insertError)

      const newActivities: Activity[] = generatedRows.map((row) => ({
        ...dbRowToActivity(row),
        seen: false,
      }))

      activities = [...activities, ...newActivities].slice(0, 3)
    }

    const { error: logError } = await supabase.from('generation_logs').insert({
      session_id: session_id || 'sin_session',
      filtros: input,
    })
    if (logError) console.error('Error guardando en Supabase:', logError)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar la actividad' }, { status: 500 })
  }
}

function buildPrompt(input: PlayInput, excludeTitles: string[] = [], count = 3) {
  return `
Sos un experto en desarrollo infantil que sugiere actividades SIN PANTALLA para hacer con un hijo/a.

Datos del niño/a:
- Edad: ${input.ageMonths} meses
- Etapa motriz: ${input.motor}
- Intereses: ${input.interests.join(', ')}
- Tiempo disponible: ${input.time} minutos
- Lugar: ${input.place}
- Estado de ánimo: ${input.state}
- Materiales disponibles: ${input.materials}
- Tipo de actividad buscada: ${input.type}
- Objetivo: ${input.objective}
- Quién participa: ${input.who}
${input.notes ? `- Notas del padre/madre: ${input.notes}` : ''}

${excludeTitles.length > 0 ? `Ya se sugirieron estas actividades, no las repitas ni sugieras variantes muy similares: ${excludeTitles.join(', ')}` : ''}

Generá exactamente ${count} actividades, CLARAMENTE distintas entre sí (en material, dinámica y espacio requerido — evitá variaciones superficiales de la misma idea).
`.trim()
}