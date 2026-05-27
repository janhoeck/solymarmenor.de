import { useTranslations } from 'next-intl'
import React from 'react'

import { Navigation } from './Navigation/Navigation'

export const LayoutNavigation = () => {
  const t = useTranslations('components.navigation')
  return (
    <Navigation
      configuration={[
        {
          href: '/',
          label: t('home'),
        },
        {
          href: '/aboutus',
          label: t('about_us'),
        },
        {
          href: '/property/apartment',
          label: t('apartment'),
        },
        {
          href: '/property/house',
          label: t('house'),
        },
        {
          href: '/guestbook',
          label: t('guestbook'),
        },
        {
          href: '/contact',
          label: t('contact'),
        },
      ]}
    />
  )
}
