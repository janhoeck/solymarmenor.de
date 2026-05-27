import { Muted } from '@jan_hoeck/ui'
import { type IconType } from 'react-icons'

export type PropertyStatisticItemProps = {
  icon: IconType
  text: string
}

export const PropertyStatisticItem = (props: PropertyStatisticItemProps) => {
  const { icon: Icon, text } = props
  return (
    <div className='flex items-center gap-2'>
      <Icon size={20} />
      <Muted>{text}</Muted>
    </div>
  )
}
