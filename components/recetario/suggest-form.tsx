'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { ChevronLeft, CircleAlert, CircleCheck, Plus, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
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
import type {
  ActType,
  ActivitySuggestion,
  ChildState,
  Interest,
  Materials,
  Objective,
  Place,
  SkillKey,
  TimeSlot,
} from '@/lib/recetario/types'
import { AuthStatus } from '@/components/auth-status'
import { Chip } from './chip'

/*
  Formulario /sugerir en 3 pasos.
  Pide exactamente los mismos campos que una actividad de la base (ActivitySuggestion),
  con las mismas opciones que el formulario principal, así entra categorizada.
  Se guarda en `activities` con status 'pending' y source 'user_suggested' (ver /api/suggest).
*/

const STEP_NAMES = ['La idea', 'Para quién', 'Cómo se juega'] as const
const SKILL_OPTIONS = (Object.keys(SKILL_META) as SkillKey[]).map((k) => ({
  value: k,
  label: SKILL_META[k].label,
}))

// Mismos límites que valida /api/suggest
const LIMITS = {
  title: { min: 3, max: 60 },
  forWhat: { min: 10, max: 200 },
  learns: { min: 10, max: 200 },
  materials: { min: 1, max: 10, len: 80 },
  steps: { min: 3, max: 6, len: 250 },
  skills: { max: 3 },
}

interface FormState {
  title: string
  forWhat: string
  type: ActType | null
  duration: TimeSlot | null
  minMotor: number | null
  interests: Interest[]
  places: Place[]
  states: ChildState[]
  objectives: Objective[]
  materialsLevel: Materials | null
  materialsList: string[]
  steps: string[]
  skills: SkillKey[]
  learns: string
}

const EMPTY: FormState = {
  title: '',
  forWhat: '',
  type: null,
  duration: null,
  minMotor: null,
  interests: [],
  places: [],
  states: [],
  objectives: [],
  materialsLevel: null,
  materialsList: [''],
  steps: ['', '', ''],
  skills: [],
  learns: '',
}

const inputCls =
  'cuerpo w-full rounded-control border-[1.5px] border-noche-suave bg-superficie px-3 text-noche placeholder:text-noche-suave focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-noche'

function Section({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-card bg-superficie p-5 sm:p-6">
      <div className="mb-3">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="pregunta text-noche">
            {label}
          </label>
        ) : (
          <h2 className="pregunta text-noche">{label}</h2>
        )}
        {hint && <p className="micro text-noche-suave">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function SingleChips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={String(o.value)} label={o.label} selected={value === o.value} onToggle={() => onChange(o.value)} />
      ))}
    </div>
  )
}

function MultiChips<T extends string>({
  options,
  value,
  onChange,
  max,
}: {
  options: { value: T; label: string }[]
  value: T[]
  onChange: (v: T[]) => void
  max?: number
}) {
  function toggle(v: T) {
    if (value.includes(v)) return onChange(value.filter((x) => x !== v))
    if (max && value.length >= max) return
    onChange([...value, v])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={value.includes(o.value)} onToggle={() => toggle(o.value)} />
      ))}
    </div>
  )
}

/** Lista editable de textos (materiales, pasos) */
function ListInput({
  items,
  onChange,
  min,
  max,
  maxLength,
  numbered,
  itemLabel,
  addLabel,
  placeholder,
}: {
  items: string[]
  onChange: (items: string[]) => void
  min: number
  max: number
  maxLength: number
  numbered?: boolean
  itemLabel: string
  addLabel: string
  placeholder?: (i: number) => string
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {numbered && (
            <span className="etiqueta flex size-6 shrink-0 items-center justify-center rounded-tag bg-mostaza text-noche">
              {i + 1}
            </span>
          )}
          <input
            aria-label={`${itemLabel} ${i + 1}`}
            value={item}
            maxLength={maxLength}
            placeholder={placeholder?.(i)}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            className={cn(inputCls, 'h-12')}
          />
          {items.length > min && (
            <button
              type="button"
              aria-label={`Sacar ${itemLabel.toLowerCase()} ${i + 1}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="flex size-11 shrink-0 items-center justify-center rounded-control bg-arena text-noche transition-colors hover:bg-linea"
            >
              <X className="size-5" strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      {items.length < max && (
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="opcion inline-flex min-h-11 items-center gap-1.5 self-start text-noche underline underline-offset-4"
        >
          <Plus className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          {addLabel}
        </button>
      )}
    </div>
  )
}

export function SuggestForm() {
  const [user, setUser] = useState<User | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const len = (s: string) => s.trim().length
  const filled = (list: string[]) => list.map((x) => x.trim()).filter(Boolean)

  // Qué falta en el paso actual. El botón lo muestra (DS: el label dice qué falta).
  function missingFor(s: number): string | null {
    if (s === 0) {
      if (len(form.title) < LIMITS.title.min) return 'Poné un nombre para seguir'
      if (len(form.forWhat) < LIMITS.forWhat.min) return 'Contá para qué momento sirve'
      if (!form.type) return 'Elegí el tipo de juego'
      if (!form.duration) return 'Elegí cuánto dura'
      return null
    }
    if (s === 1) {
      if (form.minMotor === null) return 'Elegí desde qué etapa sirve'
      if (form.interests.length === 0) return 'Elegí al menos un interés'
      if (form.places.length === 0) return 'Elegí dónde se puede jugar'
      if (form.states.length === 0) return 'Elegí con qué energía va'
      if (form.objectives.length === 0) return 'Elegí para qué sirve'
      if (!form.materialsLevel) return 'Elegí qué materiales hacen falta'
      return null
    }
    if (filled(form.materialsList).length < LIMITS.materials.min) return 'Sumá al menos un material'
    if (filled(form.steps).length < LIMITS.steps.min) return 'Escribí al menos 3 pasos'
    if (form.skills.length === 0) return 'Elegí qué fortalece'
    if (len(form.learns) < LIMITS.learns.min) return 'Contá qué fortalece en una oración'
    return null
  }
  const missing = missingFor(step)

  async function submit() {
    setStatus('saving')
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) {
      setUser(null)
      setStatus('idle')
      return
    }

    const payload: ActivitySuggestion = {
      title: form.title.trim(),
      forWhat: form.forWhat.trim(),
      learns: form.learns.trim(),
      duration: form.duration!,
      materialsList: filled(form.materialsList),
      steps: filled(form.steps),
      skills: form.skills,
      minMotor: form.minMotor!,
      interests: form.interests,
      places: form.places,
      type: form.type!,
      states: form.states,
      objectives: form.objectives,
      materialsLevel: form.materialsLevel!,
    }

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus('saved')
    } catch (err) {
      console.error('Error enviando sugerencia:', err)
      setStatus('error')
    }
  }

  function handleNext(e: FormEvent) {
    e.preventDefault()
    if (missing || status === 'saving') return
    if (step < 2) {
      setStep(step + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      submit()
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---------- Sin sesión ----------
  if (authChecked && !user) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="titulo-pantalla text-noche">Sumá una idea</h1>
        <p className="cuerpo text-noche">
          Para sugerir actividades tenés que entrar con tu mail. Así podemos avisarte si la sumamos.
        </p>
        <AuthStatus />
      </div>
    )
  }

  // ---------- Enviada ----------
  if (status === 'saved') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="titulo-pantalla text-noche">Sumá una idea</h1>
        <div role="status" className="flex items-start gap-2 rounded-control bg-exito-tinte p-3">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-exito" strokeWidth={2} aria-hidden="true" />
          <p className="cuerpo text-noche">
            <span className="font-bold">Recibimos tu idea.</span> La revisamos y, si suma, entra a la base para
            otras familias.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <button
            type="button"
            onClick={() => {
              setForm(EMPTY)
              setStep(0)
              setStatus('idle')
            }}
            className="opcion min-h-11 text-noche underline underline-offset-4"
          >
            Sugerir otra
          </button>
          <Link href="/" className="opcion inline-flex min-h-11 items-center text-noche underline underline-offset-4">
            Volver a buscar ideas
          </Link>
        </div>
      </div>
    )
  }

  // ---------- Formulario ----------
  return (
    <form onSubmit={handleNext} className="flex flex-col gap-4">
      {/* Progreso (DS: obligatorio en formularios de más de un paso) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="etiqueta text-noche">Paso {step + 1} de 3</span>
          <span className="micro text-noche-suave">{STEP_NAMES[step]}</span>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {STEP_NAMES.map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-tag', i <= step ? 'bg-noche' : 'bg-linea')} />
          ))}
        </div>
      </div>

      <header className="flex flex-col gap-1">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="opcion -ml-2 inline-flex min-h-11 items-center gap-1 self-start px-2 text-noche"
          >
            <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
            Volver
          </button>
        )}
        <h1 className="titulo-pantalla text-noche">
          {['Sumá una idea', '¿Para quién es?', '¿Cómo se juega?'][step]}
        </h1>
        {step === 0 && (
          <p className="cuerpo text-noche-suave">
            ¿Tenés un juego que funciona en casa? Contalo y lo sumamos para otras familias.
          </p>
        )}
      </header>

      {/* PASO 1 · La idea */}
      {step === 0 && (
        <>
          <Section label="¿Cómo se llama?" hint="Corto y concreto, de 2 a 5 palabras" htmlFor="sug-title">
            <input
              id="sug-title"
              value={form.title}
              maxLength={LIMITS.title.max}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Ej: Carrera de tapitas"
              className={cn(inputCls, 'h-12')}
            />
          </Section>
          <Section label="¿Para qué momento sirve?" hint="Una oración" htmlFor="sug-forwhat">
            <textarea
              id="sug-forwhat"
              rows={3}
              value={form.forWhat}
              maxLength={LIMITS.forWhat.max}
              onChange={(e) => set('forWhat', e.target.value)}
              placeholder="Ej: Para una tarde de lluvia en la que necesitan moverse sin salir"
              className={cn(inputCls, 'resize-none py-3')}
            />
            <p className="micro mt-1 text-right text-noche-suave">
              {form.forWhat.length}/{LIMITS.forWhat.max}
            </p>
          </Section>
          <Section label="¿Qué tipo de juego es?">
            <SingleChips options={TYPE_OPTIONS} value={form.type} onChange={(v) => set('type', v)} />
          </Section>
          <Section label="¿Cuánto dura?">
            <SingleChips options={TIME_OPTIONS} value={form.duration} onChange={(v) => set('duration', v)} />
          </Section>
        </>
      )}

      {/* PASO 2 · Para quién */}
      {step === 1 && (
        <>
          <Section label="¿Desde qué etapa se puede jugar?" hint="La primera etapa en la que ya sirve">
            <SingleChips
              options={MOTOR_OPTIONS.map((o, i) => ({ value: i, label: o.label }))}
              value={form.minMotor}
              onChange={(v) => set('minMotor', v)}
            />
          </Section>
          <Section label="¿A quién le engancha?" hint="Podés elegir varios">
            <MultiChips options={INTEREST_OPTIONS} value={form.interests} onChange={(v) => set('interests', v)} />
          </Section>
          <Section label="¿Dónde se puede jugar?" hint="Podés elegir varios">
            <MultiChips options={PLACE_OPTIONS} value={form.places} onChange={(v) => set('places', v)} />
          </Section>
          <Section label="¿Con qué energía va bien?" hint="Podés elegir varias">
            <MultiChips options={STATE_OPTIONS} value={form.states} onChange={(v) => set('states', v)} />
          </Section>
          <Section label="¿Para qué sirve?" hint="Podés elegir varios">
            <MultiChips options={OBJECTIVE_OPTIONS} value={form.objectives} onChange={(v) => set('objectives', v)} />
          </Section>
          <Section label="¿Qué materiales hacen falta?">
            <SingleChips
              options={MATERIALS_OPTIONS}
              value={form.materialsLevel}
              onChange={(v) => set('materialsLevel', v)}
            />
          </Section>
        </>
      )}

      {/* PASO 3 · Cómo se juega */}
      {step === 2 && (
        <>
          <Section label="Qué necesitás" hint="Una cosa por línea">
            <ListInput
              items={form.materialsList}
              onChange={(v) => set('materialsList', v)}
              min={LIMITS.materials.min}
              max={LIMITS.materials.max}
              maxLength={LIMITS.materials.len}
              itemLabel="Material"
              addLabel="Sumar material"
              placeholder={(i) => (i === 0 ? 'Ej: 5 tapitas' : '')}
            />
          </Section>
          <Section label="Paso a paso" hint="De 3 a 6 pasos. Arrancá cada uno con un verbo: Marcá, Soplen, Cambien">
            <ListInput
              items={form.steps}
              onChange={(v) => set('steps', v)}
              min={LIMITS.steps.min}
              max={LIMITS.steps.max}
              maxLength={LIMITS.steps.len}
              numbered
              itemLabel="Paso"
              addLabel="Sumar un paso"
            />
          </Section>
          <Section label="¿Qué fortalece?" hint="Hasta 3">
            <MultiChips
              options={SKILL_OPTIONS}
              value={form.skills}
              onChange={(v) => set('skills', v)}
              max={LIMITS.skills.max}
            />
          </Section>
          <Section label="Contalo en una oración" hint="Sin prometer resultados" htmlFor="sug-learns">
            <textarea
              id="sug-learns"
              rows={2}
              value={form.learns}
              maxLength={LIMITS.learns.max}
              onChange={(e) => set('learns', e.target.value)}
              placeholder="Ej: Coordinan el soplido y la puntería mientras se ríen juntos"
              className={cn(inputCls, 'resize-none py-3')}
            />
          </Section>
        </>
      )}

      {status === 'error' && (
        <div role="alert" className="flex items-start gap-2 rounded-control bg-error-tinte p-3">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-error" strokeWidth={2} aria-hidden="true" />
          <p className="cuerpo text-noche">
            <span className="font-bold">No se pudo enviar.</span> Revisá la conexión y probá de nuevo.
          </p>
        </div>
      )}

      {/* CTA fijo abajo */}
      <div className="sticky bottom-0 z-10 bg-papel pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-barra">
        <button
          type="submit"
          disabled={!!missing || status === 'saving'}
          aria-busy={status === 'saving'}
          className="inline-flex h-13 w-full items-center justify-center rounded-control bg-mostaza px-6 text-base font-bold text-noche transition-colors hover:bg-mostaza-hover active:bg-mostaza-hover disabled:bg-arena disabled:text-noche-suave"
        >
          {status === 'saving' ? 'Enviando…' : missing ?? (step < 2 ? 'Seguir' : 'Sumar mi idea')}
        </button>
      </div>
    </form>
  )
}
