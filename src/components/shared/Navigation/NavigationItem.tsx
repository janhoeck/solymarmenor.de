import { Button } from '@jan_hoeck/ui'
import Link from 'next/link'

export type NavigationItemProps = {
  children: string
  to: string
  onClick?: () => void
}

export const NavigationItem = (props: NavigationItemProps) => {
  const { children, to, onClick } = props
  return (
    <Button
      asChild
      variant='ghost'
      onClick={onClick}
    >
      <Link href={to}>{children}</Link>
    </Button>
  )
}
