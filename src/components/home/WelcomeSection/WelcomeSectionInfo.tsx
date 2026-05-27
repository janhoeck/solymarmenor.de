import { Badge, Button, H1, P } from '@jan_hoeck/ui'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import React from 'react'
import { GoChevronRight } from 'react-icons/go'

import { InfoCard } from './InfoCard'

export const WelcomeSectionInfo = () => {
  const t = useTranslations('pages.home.welcome')
  return (
    <div className='relative z-10 container mx-auto px-4 text-center sm:px-6 lg:px-8'>
      <div className='animate-fade-in mx-auto max-w-4xl space-y-6 md:space-y-8'>
        <Badge>{t('location')}</Badge>
        <H1 className='font-serif text-primary-foreground drop-shadow-md'>{t('title')}</H1>
        <P className='mx-auto max-w-2xl text-primary-foreground drop-shadow-md'>{t('subtitle')}</P>
        <div className='flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row'>
          <Button
            asChild
            className='transition-all duration-300 hover:bg-primary/90 hover:scale-105 hover:shadow-md'
          >
            <Link href='#property-list-section'>
              {t('discoverAccommodationButtonLabel')}
              <GoChevronRight size={24} />
            </Link>
          </Button>
        </div>
        <div className='grid grid-cols-1 gap-6 pt-8 sm:grid-cols-3 md:gap-8 md:pt-12'>
          <InfoCard
            title={320}
            description={t('generalInfo.sunnyDaysPerYear')}
          />
          <InfoCard
            title={2}
            description={t('generalInfo.charmingCoastalTowns')}
          />
          <InfoCard
            title='20°C'
            description={t('generalInfo.averageTemperature')}
          />
        </div>
      </div>
    </div>
  )
}
