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
        'inline-flex min-h-11 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        popping && 'animate-chip-pop',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card text-foreground/80 hover:border-primary/50 hover:bg-muted',
      )}
    >
      {selected && <Check className="size-4" aria-hidden="true" strokeWidth={3} />}
      {label}
    </button>
  )
}
