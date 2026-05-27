import { getTranslation } from '@/components/property/utils'
import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, H3, Muted } from '@jan_hoeck/ui'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { GrGroup } from 'react-icons/gr'
import { LuBed, LuMapPin } from 'react-icons/lu'
import { MdOutlineOpenInNew } from 'react-icons/md'

import { PropertyStatisticItem } from './PropertyStatisticItem'

export type PropertyCardProps = {
  propertyConfiguration: PropertyConfiguration
}

export const PropertyCard = (props: PropertyCardProps) => {
  const { propertyConfiguration } = props
  const t = useTranslations('pages.home.properties.card')
  const locale = useLocale()

  const groupPropertySummary = propertyConfiguration.propertyDetails.find((item) => item.type === 'group')
  const bedPropertySummary = propertyConfiguration.propertyDetails.find((item) => item.type === 'bed')

  return (
    <Card className='overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-2 py-0 pb-6'>
      <CardHeader className='p-0'>
        <div className='relative h-64 md:h-80 overflow-hidden'>
          <Image
            fill
            src={`/images/${propertyConfiguration.id}/coverPhoto.webp`}
            alt='Estate'
            className='object-cover transition-transform duration-700 group-hover:scale-110'
            quality={80}
            sizes='(max-width: 40rem) 90vw, 350px'
          />
          <Badge className='absolute top-4 left-4'>
            <LuMapPin size={16} />
            {propertyConfiguration.location.address.city}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <H3 className='line-clamp-2'>{getTranslation(locale, propertyConfiguration.title)}</H3>
        <Muted>{getTranslation(locale, propertyConfiguration.subtitle)}</Muted>
        <div className='flex items-center gap-6 text-muted-foreground mb-6 mt-6'>
          {bedPropertySummary && (
            <PropertyStatisticItem
              icon={LuBed}
              text={t('beds', { amount: bedPropertySummary.amount })}
            />
          )}
          {groupPropertySummary && (
            <PropertyStatisticItem
              icon={GrGroup}
              text={t('guests', { amount: groupPropertySummary.amount })}
            />
          )}
        </div>
        <div className='flex flex-wrap gap-2'>
          <Badge variant='secondary'>{t('pool')}</Badge>
          <Badge variant='secondary'>{t('airConditioner')}</Badge>
          <Badge variant='secondary'>{t('wlan')}</Badge>
          <Badge variant='secondary'>{t('parking')}</Badge>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild>
          <Link href={`/property/${propertyConfiguration.id}`}>
            {t('showMe')}
            <MdOutlineOpenInNew
              size={16}
              className='ml-2 transition-transform group-hover/btn:translate-x-1'
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
