import Image from 'next/image'

type Props = {
  variante?: 'color' | 'negativo' // negativo = sobre fondo noche
  soloSimbolo?: boolean
  alto?: number // en px; el lockup necesita mínimo 22 de alto (≈96 de ancho)
  className?: string
}

export default function Logo({ variante = 'color', soloSimbolo = false, alto = 28, className }: Props) {
  if (soloSimbolo) {
    return (
      <Image
        src={`/brand/simbolo-${variante}.svg`}
        alt="Compinches"
        width={alto}
        height={alto}
        className={className}
        priority
      />
    )
  }

  const ancho = Math.round((alto * 6709) / 1514)
  return (
    <Image
      src={`/brand/lockup-${variante}.svg`}
      alt="Compinches"
      width={ancho}
      height={alto}
      className={className}
      priority
    />
  )
}
