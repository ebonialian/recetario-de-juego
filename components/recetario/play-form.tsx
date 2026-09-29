'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import type {
  ActType,
  ChildState,
  Interest,
  Materials,
  MotorStage,
  Objective,
  Place,
  PlayInput,
  TimeSlot,
  Who,
} from '@/lib/recetario/types'
import { AgeStepper } from './age-stepper'
import { Chip } from './chip'

interface FieldProps {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}

function Field({ label, hint, children, className }: FieldProps) {
  return (
    <section className={cn('rounded-card bg-superficie p-5 sm:p-6', className)}>
      <div className="mb-3">
        <h2 className="pregunta text-noche">{label}</h2>
        {hint && <p className="micro text-noche-suave">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

interface PlayFormProps {
  loading: boolean
  onGenerate: (input: PlayInput) => void
  variant?: 'compact' | 'expanded'
}

export function PlayForm({ loading, onGenerate, variant = 'compact' }: PlayFormProps) {
  const [ageMonths, setAgeMonths] = useState(13)
  const [motor, setMotor] = useState<MotorStage>('apoyo')
  const [interests, setInterests] = useState<Interest[]>(['musica'])
  const [time, setTime] = useState<TimeSlot>('15-20')
  const [place, setPlace] = useState<Place>('living')
  const [state, setState] = useState<ChildState>('pilas')
  const [materials, setMaterials] = useState<Materials>('casa')
  const [type, setType] = useState<ActType>('motricidad')
  const [objective, setObjective] = useState<Objective>('compartir')
  const [who, setWho] = useState<Who>('solo')
  const [notes, setNotes] = useState('')

  const isExpanded = variant === 'expanded'
  const formLayout = isExpanded
    ? 'grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5'
    : 'flex flex-col gap-4'
  const fullSpan = isExpanded ? 'md:col-span-2' : ''

  function toggleInterest(value: Interest) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onGenerate({
      ageMonths,
      motor,
      interests,
      time,
      place,
      state,
      materials,
      type,
      objective,
      who,
      notes,
    })
  }

  return (
    <form onSubmit={handleSubmit} className={formLayout}>
      <Field label="¿Qué edad tiene?" hint="Sumá o restá meses">
        <AgeStepper months={ageMonths} onChange={setAgeMonths} />
      </Field>

      <Field label="¿Cómo se mueve ahora?" hint="Elegí su etapa">
        <div className="flex flex-wrap gap-2">
          {MOTOR_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={motor === o.value}
              onToggle={() => setMotor(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="¿Qué le copa en este momento?" hint="Podés elegir varios">
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={interests.includes(o.value)}
              onToggle={() => toggleInterest(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="¿Cuánto tiempo tenés?">
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={time === o.value}
              onToggle={() => setTime(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="¿Dónde están?">
        <div className="flex flex-wrap gap-2">
          {PLACE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={place === o.value}
              onToggle={() => setPlace(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="¿Cómo anda de energía?">
        <div className="flex flex-wrap gap-2">
          {STATE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={state === o.value}
              onToggle={() => setState(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="¿Con qué materiales?">
        <div className="flex flex-wrap gap-2">
          {MATERIALS_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={materials === o.value}
              onToggle={() => setMaterials(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="¿Qué tipo de juego buscás?">
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={type === o.value}
              onToggle={() => setType(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="¿Cuál es el objetivo?">
        <div className="flex flex-wrap gap-2">
          {OBJECTIVE_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={objective === o.value}
              onToggle={() => setObjective(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="¿Quién participa?">
        <div className="flex flex-wrap gap-2">
          {WHO_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              selected={who === o.value}
              onToggle={() => setWho(o.value)}
            />
          ))}
        </div>
      </Field>

      <Field label="Ya probaron / no enganchó" hint="Opcional, para afinar la idea" className={fullSpan}>
        <label htmlFor="notas" className="sr-only">
          Qué ya probaron o qué no enganchó
        </label>
        <textarea
          id="notas"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Ej: ya jugamos con la pelota, la pintura no enganchó…"
          className="cuerpo w-full resize-none rounded-control border-[1.5px] border-noche-suave bg-superficie p-3 text-noche placeholder:text-noche-suave focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-noche"
        />
      </Field>

      {/* CTA fijo abajo mientras el formulario está en pantalla */}
      <div
        className={cn(
          'sticky bottom-0 z-10 bg-papel pt-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-barra',
          fullSpan,
        )}
      >
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-control bg-mostaza px-6 text-base font-bold text-noche transition-colors hover:bg-mostaza-hover active:bg-mostaza-hover disabled:bg-arena disabled:text-noche-suave"
        >
          <Search className="size-5" strokeWidth={2} aria-hidden="true" />
          {loading ? 'Buscando ideas…' : 'Buscar ideas'}
        </button>
      </div>
    </form>
  )
}
