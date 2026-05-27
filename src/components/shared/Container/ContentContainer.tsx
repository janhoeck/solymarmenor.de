import React, { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

export type ContentContainerProps = {
  children: ReactNode
  className?: string
}

export const ContentContainer = (props: ContentContainerProps) => {
  const { children, className } = props
  return (
    <div className={twMerge('flex justify-center', className)}>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 mb-[10vh]'>{children}</div>
    </div>
  )
}
