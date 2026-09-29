'use client'

import { Minus, Plus } from 'lucide-react'

export function formatAge(months: number): string {
  const years = Math.floor(months / 12)
  const rem = months % 12
  const yearPart = years > 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : ''
  const monthPart = rem > 0 ? `${rem} ${rem === 1 ? 'mes' : 'meses'}` : ''
  if (yearPart && monthPart) return `${yearPart} y ${monthPart}`
  return yearPart || monthPart || '0 meses'
}

interface AgeStepperProps {
  months: number
  onChange: (months: number) => void
  min?: number
  max?: number
}

export function AgeStepper({ months, onChange, min = 1, max = 60 }: AgeStepperProps) {
  const dec = () => onChange(Math.max(min, months - 1))
  const inc = () => onChange(Math.min(max, months + 1))

  const stepBtn =
    'flex size-11 shrink-0 items-center justify-center rounded-control bg-arena text-noche transition-colors hover:bg-linea disabled:text-noche-suave disabled:opacity-50 disabled:pointer-events-none'

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={dec}
        disabled={months <= min}
        aria-label="Restar un mes"
        className={stepBtn}
      >
        <Minus className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="flex flex-col items-center text-center" aria-live="polite">
        <span className="titulo-card text-noche">{formatAge(months)}</span>
        <span className="micro text-noche-suave">{months} meses en total</span>
      </div>

      <button
        type="button"
        onClick={inc}
        disabled={months >= max}
        aria-label="Sumar un mes"
        className={stepBtn}
      >
        <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  )
}