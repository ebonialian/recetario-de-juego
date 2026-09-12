import type { Decoration } from '@/lib/recetario/types'

// Detalle decorativo sutil de fondo para cada tarjeta (nube, estrella o gotita).
export function CardDecoration({ variant }: { variant: Decoration }) {
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 opacity-20" aria-hidden="true">
      {variant === 'nube' && (
        <svg width="72" height="72" viewBox="0 0 96 96" fill="none">
          <path
            d="M30 62c-9 0-16-7-16-16s7-16 16-16c2 0 4 .3 6 1 3-8 11-14 20-14 12 0 21 9 21 21 0 1 0 2-.2 3 6 1 11 6 11 13 0 8-6 14-14 14H30Z"
            className="fill-accent"
          />
        </svg>
      )}
      {variant === 'estrella' && (
        <svg width="64" height="64" viewBox="0 0 88 88" fill="none">
          <path
            d="M44 8c2 14 8 20 22 22-14 2-20 8-22 22-2-14-8-20-22-22 14-2 20-8 22-22Z"
            className="fill-skill-cognitivo"
          />
        </svg>
      )}
      {variant === 'gota' && (
        <svg width="60" height="66" viewBox="0 0 80 88" fill="none">
          <path
            d="M40 12c10 14 22 26 22 40 0 14-10 24-22 24S18 66 18 52c0-14 12-26 22-40Z"
            className="fill-skill-lenguaje"
          />
        </svg>
      )}
    </div>
  )
}