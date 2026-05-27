'use client'

import { Logo } from '@/components/shared/Logo/Logo'
import React from 'react'

import { Link } from '../../../i18n/navigation'
import { NavigationItem } from './NavigationItem'
import { NavigationConfiguration } from './types'

export type DesktopNavigationContentProps = {
  configuration: NavigationConfiguration
}

export const DesktopNavigationContent = (props: DesktopNavigationContentProps) => {
  const { configuration } = props

  return (
    <div className='flex h-16 items-center justify-between gap-4 md:h-20'>
      <Link
        href='/'
        className='flex items-center space-x-2'
      >
        <Logo />
        <span className='text-foreground font-serif text-2xl font-bold'>Solymarmenor</span>
      </Link>
      <div className='flex items-center space-x-1'>
        {configuration.map((item) => {
          return (
            <NavigationItem
              key={item.href}
              to={item.href}
            >
              {item.label}
            </NavigationItem>
          )
        })}
      </div>
    </div>
  )
}
