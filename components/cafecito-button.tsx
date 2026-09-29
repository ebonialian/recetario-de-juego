import { Coffee } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CafecitoButtonProps {
  placement: string
  className?: string
}

export function CafecitoButton({ placement, className }: CafecitoButtonProps) {
  const url = `https://cafecito.app/bona?utm_source=${placement}`
  return (
    <a
      href={url}
      rel="noopener noreferrer"
      target="_blank"
      className={cn(
        'micro inline-flex min-h-11 items-center gap-1.5 text-noche-suave underline underline-offset-4 transition-colors hover:text-noche',
        className,
      )}
    >
      <Coffee className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      ¿Te sirvió? Invitame un cafecito
    </a>
  )
}