import { H2, H3 } from '@jan_hoeck/ui'
import { ReactNode } from 'react'

export type SectionProps = {
  title: string
  children: ReactNode
  variant?: 'default' | 'subsection'
}

export const Section = (props: SectionProps) => {
  const { title, variant = 'default', children } = props
  return (
    <section className='z-1'>
      {variant === 'default' ? (
        <H2 className='font-serif mb-4'>{title}</H2>
      ) : (
        <H3 className='font-serif mb-2'>{title}</H3>
      )}
      {children}
    </section>
  )
}
