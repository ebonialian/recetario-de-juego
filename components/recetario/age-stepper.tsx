'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    'flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-card text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-40 disabled:pointer-events-none'

  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl bg-secondary/60 p-3">
      <button
        type="button"
        onClick={dec}
        disabled={months <= min}
        aria-label="Restar un mes"
        className={stepBtn}
      >
        <Minus className="size-6" strokeWidth={3} aria-hidden="true" />
      </button>

      <div className="flex flex-col items-center text-center leading-tight">
        <span className="font-heading text-2xl font-bold text-secondary-foreground">
          {formatAge(months)}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">{months} meses en total</span>
      </div>

      <button
        type="button"
        onClick={inc}
        disabled={months >= max}
        aria-label="Sumar un mes"
        className={cn(stepBtn)}
      >
        <Plus className="size-6" strokeWidth={3} aria-hidden="true" />
      </button>
    </div>
  )
}
