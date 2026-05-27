import { TextWithHeadline } from '@/components/home/TextWithHeadline'
import { Card, CardDescription, CardHeader, CardTitle } from '@jan_hoeck/ui'
import { useTranslations } from 'next-intl'
import React from 'react'
import { IoMdHeartEmpty } from 'react-icons/io'
import { IoSunnyOutline } from 'react-icons/io5'
import { LuMapPin } from 'react-icons/lu'
import { MdOutlineWaves } from 'react-icons/md'

import { InfoCard } from './InfoCard'

export const MainSection = () => {
  const t = useTranslations('pages.home.main')
  return (
    <section className='pt-16 md:pt-24'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <TextWithHeadline
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-4'>
          <InfoCard
            icon={IoSunnyOutline}
            title={t('info.sunnyDaysPerYear.title')}
            description={t('info.sunnyDaysPerYear.description')}
          />
          <InfoCard
            icon={MdOutlineWaves}
            title={t('info.marMenor.title')}
            description={t('info.marMenor.description')}
          />
          <InfoCard
            icon={LuMapPin}
            title={t('info.location.title')}
            description={t('info.location.description')}
          />
          <InfoCard
            icon={IoMdHeartEmpty}
            title={t('info.general.title')}
            description={t('info.general.description')}
          />
        </div>
        <Card className='mt-12'>
          <div className='grid gap-8 md:grid-cols-2 md:gap-12'>
            <CardHeader>
              <CardTitle className='text-2xl leading-none'>{t('locations.losAlcazares.title')}</CardTitle>
              <CardDescription>{t('locations.losAlcazares.description')}</CardDescription>
            </CardHeader>
            <CardHeader>
              <CardTitle className='text-2xl leading-none'>{t('locations.losUrrutias.title')}</CardTitle>
              <CardDescription>{t('locations.losUrrutias.description')}</CardDescription>
            </CardHeader>
          </div>
        </Card>
      </div>
    </section>
  )
}
