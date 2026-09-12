interface CafecitoButtonProps {
  placement: string
  className?: string
}

export function CafecitoButton({ placement, className }: CafecitoButtonProps) {
  const url = `https://cafecito.app/bona?utm_source=${placement}`
  return (
    <a href={url} rel="noopener" target="_blank" className={className}>
      <img
        srcSet="https://cdn.cafecito.app/imgs/buttons/button_1.png 1x, https://cdn.cafecito.app/imgs/buttons/button_1_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_1_3.75x.png 3.75x"
        src="https://cdn.cafecito.app/imgs/buttons/button_1.png"
        alt="Invitame un café en cafecito.app"
      />
    </a>
  )
}