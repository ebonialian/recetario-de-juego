'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChipProps {
  label: string
  selected: boolean
  onToggle: () => void
}

export function Chip({ label, selected, onToggle }: ChipProps) {
  const [popping, setPopping] = useState(false)

  function handleClick() {
    setPopping(true)
    onToggle()
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={handleClick}
      onAnimationEnd={() => setPopping(false)}
      className={cn(
        'opcion inline-flex min-h-11 items-center gap-1.5 rounded-tag border-[1.5px] px-4 py-2 transition-colors',
        popping && 'animate-chip-pop',
        selected
          ? 'border-noche bg-noche text-papel'
          : 'border-noche-suave bg-superficie text-noche hover:bg-arena',
      )}
    >
      {selected && <Check className="size-4" aria-hidden="true" strokeWidth={2} />}
      {label}
    </button>
  )
}