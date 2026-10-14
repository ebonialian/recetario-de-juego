'use client'

import { useState } from 'react'
import { CircleAlert, CircleCheck, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

const STAR_LABELS = ['', 'No sirvió', 'Más o menos', 'Estuvo bien', 'Muy buena', 'Un golazo']
const MAX_COMMENT = 280

interface RatingDetailProps {
  /** id de la fila de user_activity_log que se creó al tocar "Lo hicimos" / "No enganchó" */
  logId: string
  /** 'up' = "Lo hicimos" (estrellas + comentario) · 'down' = "No enganchó" (solo comentario) */
  kind: 'up' | 'down'
}

/*
  Se muestra después de "Lo hicimos" / "No enganchó".
  Completa la misma fila de user_activity_log (por id) con estrellas y comentario.
*/
export function RatingDetail({ logId, kind }: RatingDetailProps) {
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const withStars = kind === 'up'
  const canSave = withStars ? stars > 0 : comment.trim().length > 0
  const shown = hover || stars

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave || status === 'saving') return
    setStatus('saving')
    const { error } = await supabase
      .from('user_activity_log')
      .update({
        stars: withStars ? stars : null,
        comment: comment.trim() || null,
      })
      .eq('id', logId)
    if (error) {
      console.error('Error guardando valoración:', error)
      setStatus('error')
      return
    }
    setStatus('saved')
  }

  if (status === 'saved') {
    return (
      <div role="status" className="mt-3 flex items-center gap-2 rounded-control bg-exito-tinte p-3">
        <CircleCheck className="size-5 shrink-0 text-exito" strokeWidth={2} aria-hidden="true" />
        <p className="cuerpo text-noche">
          <span className="font-bold">Gracias.</span> Nos ayuda a mostrar mejores ideas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3">
      {withStars && (
        <fieldset>
          <legend className="pregunta mb-1 text-noche">¿Qué tal estuvo?</legend>
          <div
            role="radiogroup"
            aria-label="Valoración de 1 a 5 estrellas"
            className="flex items-center gap-1"
            onMouseLeave={() => setHover(0)}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} de 5: ${STAR_LABELS[n]}`}
                onClick={() => setStars(n)}
                onMouseEnter={() => setHover(n)}
                className="flex size-11 items-center justify-center rounded-control"
              >
                <Star
                  className={cn('size-7', n <= shown ? 'fill-noche text-noche' : 'text-noche-suave')}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <p className="micro h-[18px] text-noche-suave" aria-live="polite">
            {shown ? STAR_LABELS[shown] : 'Tocá una estrella'}
          </p>
        </fieldset>
      )}

      {(!withStars || stars > 0) && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`comentario-${logId}`} className={withStars ? 'opcion text-noche' : 'pregunta text-noche'}>
            {withStars ? 'Algo para contar' : '¿Qué pasó?'}{' '}
            <span className="micro text-noche-suave">(opcional)</span>
          </label>
          <textarea
            id={`comentario-${logId}`}
            rows={3}
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              withStars
                ? 'Ej: le sumamos música y duró el doble'
                : 'Ej: era muy largo para su edad, no le interesó el material'
            }
            className="cuerpo w-full resize-none rounded-control border-[1.5px] border-noche-suave bg-superficie p-3 text-noche placeholder:text-noche-suave"
          />
          <span className="micro self-end text-noche-suave">
            {comment.length}/{MAX_COMMENT}
          </span>
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="flex items-start gap-2 rounded-control bg-error-tinte p-3">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-error" strokeWidth={2} aria-hidden="true" />
          <p className="cuerpo text-noche">
            <span className="font-bold">No se pudo guardar.</span> Revisá la conexión y probá de nuevo.
          </p>
        </div>
      )}

      {canSave && (
        <button
          type="submit"
          disabled={status === 'saving'}
          className="opcion inline-flex h-11 items-center justify-center self-start rounded-control border-2 border-noche px-4 text-noche transition-colors hover:bg-arena disabled:opacity-50"
        >
          {status === 'saving' ? 'Guardando…' : withStars ? 'Guardar valoración' : 'Guardar comentario'}
        </button>
      )}
    </form>
  )
}
