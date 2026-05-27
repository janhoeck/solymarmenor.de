import { H2, P } from '@jan_hoeck/ui'
import { twMerge } from 'tailwind-merge'

export type TextWithHeadlineProps = {
  title: string
  subtitle: string
}

export const TextWithHeadline = (props: TextWithHeadlineProps) => {
  const { title, subtitle } = props
  return (
    <div className={twMerge(['animate-fade-in mx-auto mb-12 max-w-3xl text-center', 'md:mb-16'])}>
      <H2 className='text-foreground mb-4 font-serif'>{title}</H2>
      <div className='bg-primary mx-auto mb-6 h-1 w-20' />
      <P>{subtitle}</P>
    </div>
  )
}
