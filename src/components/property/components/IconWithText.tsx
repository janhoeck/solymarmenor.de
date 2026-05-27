import { Muted, P } from '@jan_hoeck/ui'
import { IconType } from 'react-icons'

export type ItemWithIconProps = {
  icon: IconType
  label: string
  description?: string
}

export const IconWithText = (props: ItemWithIconProps) => {
  const { icon: Icon, label, description } = props
  return (
    <div className='flex items-center gap-3'>
      <div className='min-w-12 min-h-12 bg-card rounded-lg flex items-center justify-center'>
        <Icon
          size={24}
          className='text-primary'
        />
      </div>
      <div className='flex flex-col'>
        <Muted>{label}</Muted>
        <P className='font-semibold'>{description}</P>
      </div>
    </div>
  )
}
