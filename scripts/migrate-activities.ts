import { createClient } from '@supabase/supabase-js'
import { ACTIVITIES } from '../lib/recetario/data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function migrate() {
  const rows = ACTIVITIES.map((a) => ({
    title: a.title,
    for_what: a.forWhat,
    learns: a.learns,
    duration: a.duration,
    materials_list: a.materialsList,
    steps: a.steps,
    skills: a.skills,
    decoration: a.decoration,
    min_motor: a.minMotor,
    interests: a.interests,
    places: a.places,
    type: a.type,
    states: a.states,
    objectives: a.objectives,
    materials_level: a.materialsLevel,
    source: 'system',
    status: 'approved',
  }))

  const { error, data } = await supabase.from('activities').insert(rows).select()
  if (error) {
    console.error('Error migrando:', error)
    return
  }
  console.log(`Migradas ${data?.length} actividades.`)
}

migrate()