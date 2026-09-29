import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { MOTOR_ORDER, type PlayInput, type Activity, type MotorStage, type Materials } from '@/lib/recetario/types'
import {
  INTEREST_OPTIONS,
  MATERIALS_OPTIONS,
  MOTOR_OPTIONS,
  OBJECTIVE_OPTIONS,
  PLACE_OPTIONS,
  STATE_OPTIONS,
  TIME_OPTIONS,
  TYPE_OPTIONS,
  WHO_OPTIONS,
} from '@/lib/recetario/options'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MATERIAL_RANK: Record<Materials, number> = { casa: 0, compro: 1, salimos: 2 }

function motorIndex(motor: MotorStage): number {
  return MOTOR_ORDER.indexOf(motor)
}

// Traduce el valor interno (ej. 'mama', 'cansarla') al texto neutro que ve la persona,
// para que la IA no reciba palabras con género ni "mamá".
function labelOf<T extends string>(options: { value: T; label: string }[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? value
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

    // Etapa motriz: filtro duro, nunca se relaja.
    const motorOk = (candidates ?? []).filter((row) => row.min_motor <= motorIdx)
    const notInThisSession = motorOk.filter((row) => !excludeTitles.includes(row.title))

    // Objetivo (cansarla, calmarla, compartir, lenguaje): filtro duro, NUNCA se
    // relaja. Antes solo sumaba puntaje y una actividad de energía alta le
    // podía ganar a una de energía baja si matcheaba mejor en otros ejes.
    // Modo estricto: si no hay 3 que respeten el objetivo ni relajando
    // materiales, se llama a la API en vez de mostrar algo que no corresponde.
    const objectiveOk = notInThisSession.filter((row) => row.objectives.includes(input.objective))

    const pickFrom = (pool: any[]) => {
      const unseenPool = pool.filter((row) => !seenTitles.includes(row.title))
      const seenPool = pool.filter((row) => seenTitles.includes(row.title))
      const rank = (rows: any[]) =>
        rows
          .map((row) => ({ row, s: scoreRow(row, input) }))
          .sort((a, b) => b.s - a.s)
          .map((x) => x.row)
      return [...rank(unseenPool), ...rank(seenPool)]
    }

    // 1) Objetivo + materiales estrictos.
    const strictMaterials = objectiveOk.filter(
      (row) => MATERIAL_RANK[row.materials_level as Materials] <= MATERIAL_RANK[input.materials],
    )
    let orderedRows = pickFrom(strictMaterials)

    // 2) Objetivo se mantiene, materiales se relajan.
    if (orderedRows.length < 3) {
      orderedRows = pickFrom(objectiveOk)
    }

    // Si ni así llegan a 3, quedan los que haya (menos de 3) y el resto lo
    // completa la API más abajo — nunca se rellena con algo que no respete
    // el objetivo.
    let selectedRows = orderedRows.slice(0, 3)

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

      const newActivities: Activity[] = generatedRows.map((row: any) => ({
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
  const intereses = input.interests.map((i) => labelOf(INTEREST_OPTIONS, i)).join(', ')

  return `
Sos parte de Compinches, una app que le da a madres y padres ideas de juego SIN PANTALLA para compartir con su hijo/a. No sos maestro ni pediatra: sos el cómplice del adulto. No hablamos de hitos ni de rendimiento, hablamos del rato compartido.

Situación de hoy:
- Edad: ${input.ageMonths} meses
- Cómo se mueve: ${labelOf(MOTOR_OPTIONS, input.motor)}
- Qué le copa: ${intereses}
- Tiempo disponible: ${labelOf(TIME_OPTIONS, input.time)}
- Dónde están: ${labelOf(PLACE_OPTIONS, input.place)}
- Energía: ${labelOf(STATE_OPTIONS, input.state)}
- Materiales: ${labelOf(MATERIALS_OPTIONS, input.materials)}
- Tipo de juego: ${labelOf(TYPE_OPTIONS, input.type)}
- Objetivo: ${labelOf(OBJECTIVE_OPTIONS, input.objective)}
- Quién participa: ${labelOf(WHO_OPTIONS, input.who)}
${input.notes ? `- Notas del adulto (qué ya probaron o no enganchó): ${input.notes}` : ''}

${excludeTitles.length > 0 ? `Ya se sugirieron estas actividades, no las repitas ni sugieras variantes muy similares: ${excludeTitles.join(', ')}` : ''}

Generá exactamente ${count} actividades, CLARAMENTE distintas entre sí (en material, dinámica y espacio requerido; evitá variaciones superficiales de la misma idea).

Cómo escribir (obligatorio en todos los campos):
- Le hablás al adulto, de vos, en español rioplatense ("Poné", "Sentate", "Dejá"). Nunca imites el habla de un chico.
- Género neutro SIEMPRE para el hijo/a. Nunca uses él, ella, lo ni la para referirte al hijo/a (le sí se puede), ni adjetivos o participios con género que se refieran al hijo/a (apoyado/a, sentado/a, cansado/a, contento/a, "él mismo"). Tampoco "el bebé" ni "la nena". Reformulá con la acción sola, con verbos reflexivos o en plural inclusivo. Si hace falta nombrarle, usá "tu hijo/a".
  - Mal: "Ayudá al bebé a pararse apoyado". Bien: "Ofrecé tu mano o el borde del sillón para que se pare".
  - Mal: "Dejá que lo haga sonar él mismo". Bien: "Dejá que haga sonar el juguete".
  - Mal: "Cansarla antes de dormir". Bien: "Bajar el ritmo antes de dormir".
- Directo y práctico. Sin superlativos, sin signos de exclamación, sin emojis, sin tono de venta.
- title: nombre corto y concreto, de 2 a 5 palabras, con mayúscula solo en la primera letra.
- forWhat: una oración que diga para qué momento sirve.
- materialsList: cosas concretas de la casa, una por ítem.
- steps: entre 3 y 5 pasos. Cada uno arranca con un verbo en segunda persona (vos) o en plural inclusivo ("Marcá", "Empujen", "Busquen").
- learns: una oración sobre qué fortalece, sin prometer resultados ni hablar de hitos del desarrollo.
`.trim()
}
