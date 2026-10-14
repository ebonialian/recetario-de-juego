'use client'

import { useState } from 'react'
import { Chip } from './chip'

export function formatAge(months: number): string {
  const years = Math.floor(months / 12)
  const rem = months % 12
  const yearPart = years > 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : ''
  const monthPart = rem > 0 ? `${rem} ${rem === 1 ? 'mes' : 'meses'}` : ''
  if (yearPart && monthPart) return `${yearPart} y ${monthPart}`
  return yearPart || monthPart || '0 meses'
}

/*
  Antes de los 2 años cambia mucho de un mes al otro: se elige el mes exacto.
  Desde los 2 años alcanza con el año.
*/
type Group = 'bebe' | 'uno'

const GROUPS: { key: Group; label: string; months: number[]; fallback: number }[] = [
  { key: 'bebe', label: 'Menos de 1 año', months: range(1, 11), fallback: 6 },
  { key: 'uno', label: '1 año', months: range(12, 23), fallback: 12 },
]

const YEARS = [2, 3, 4, 5]

function range(from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

function groupOf(months: number): Group | null {
  if (months < 12) return 'bebe'
  if (months < 24) return 'uno'
  return null
}

interface AgePickerProps {
  months: number
  onChange: (months: number) => void
}

export function AgePicker({ months, onChange }: AgePickerProps) {
  const [open, setOpen] = useState<Group | null>(groupOf(months))
  const group = GROUPS.find((g) => g.key === open)

  function pickGroup(g: (typeof GROUPS)[number]) {
    setOpen(g.key)
    if (groupOf(months) !== g.key) onChange(g.fallback)
  }

  function pickYear(y: number) {
    setOpen(null)
    onChange(y * 12)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <Chip
            key={g.key}
            label={g.label}
            selected={groupOf(months) === g.key}
            onToggle={() => pickGroup(g)}
          />
        ))}
        {YEARS.map((y) => (
          <Chip
            key={y}
            label={`${y} años`}
            selected={months >= 24 && Math.floor(months / 12) === y}
            onToggle={() => pickYear(y)}
          />
        ))}
      </div>

      {group && (
        <div className="flex flex-col gap-2 border-t border-linea pt-4">
          <p className="etiqueta text-noche">¿Cuántos meses tiene?</p>
          <div className="grid grid-cols-4 gap-2" role="group" aria-label="Meses">
            {group.months.map((m) => {
              const selected = months === m
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${m} meses`}
                  onClick={() => onChange(m)}
                  className={
                    selected
                      ? 'opcion flex h-11 items-center justify-center rounded-tag border-[1.5px] border-noche bg-noche text-papel'
                      : 'opcion flex h-11 items-center justify-center rounded-tag border-[1.5px] border-noche-suave bg-superficie text-noche transition-colors hover:bg-arena'
                  }
                >
                  {m}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="micro text-noche-suave" aria-live="polite">
        Edad elegida: <span className="font-bold text-noche">{formatAge(months)}</span>
      </p>
    </div>
  )
}
