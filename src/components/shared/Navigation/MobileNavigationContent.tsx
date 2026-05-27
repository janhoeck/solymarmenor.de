'use client'

import { Logo } from '@/components/shared/Logo/Logo'
import { Button, useOpenState } from '@jan_hoeck/ui'
import React from 'react'
import { IoMdClose } from 'react-icons/io'
import { LiaBarsSolid } from 'react-icons/lia'
import { twMerge } from 'tailwind-merge'

import { Link } from '../../../i18n/navigation'
import { NavigationItem } from './NavigationItem'
import { NavigationConfiguration } from './types'

export type MobileNavigationContentProps = {
  configuration: NavigationConfiguration
}

export const MobileNavigationContent = (props: MobileNavigationContentProps) => {
  const { configuration } = props
  const { isOpen, open, close } = useOpenState()

  return (
    <div className='flex h-16 items-center justify-between'>
      <Link href='/'>
        <Logo />
      </Link>
      <Button
        variant='ghost'
        size='icon'
        onClick={isOpen ? close : open}
      >
        {isOpen ? <IoMdClose size={20} /> : <LiaBarsSolid size={20} />}
      </Button>
      <div className={twMerge(['absolute top-16 left-0 w-full bg-card py-4 shadow-md', !isOpen && 'hidden'])}>
        <div className='animate-fade-in container mx-auto flex flex-col gap-4'>
          {configuration.map((item) => {
            return (
              <NavigationItem
                key={item.href}
                to={item.href}
                onClick={close}
              >
                {item.label}
              </NavigationItem>
            )
          })}
        </div>
      </div>
    </div>
  )
}
