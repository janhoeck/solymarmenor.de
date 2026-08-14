import type { Property } from '@/data/property-schema'
import { resolveText } from '@/data/localized-text'
import { Badge, Button, Card, CardContent, CardFooter, CardHeader, H3, Muted } from '@/components/ui'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { GrGroup } from 'react-icons/gr'
import { LuBed, LuMapPin } from 'react-icons/lu'
import { MdOutlineOpenInNew } from 'react-icons/md'

import { PropertyStatisticItem } from './PropertyStatisticItem'

export type PropertyCardProps = {
  propertyConfiguration: Property
}

/**
 * Badge amenities shown on the card, mapped to their message key under
 * `pages.home.properties.card`. There is no `pages.property.amenities`
 * namespace, so this reuses the existing card keys instead of introducing a
 * second translation namespace for the same four amenities.
 */
const CARD_AMENITY_MESSAGE_KEYS = {
  pool: 'pool',
  air_conditioner: 'airConditioner',
  wlan: 'wlan',
  parking: 'parking',
} as const

/** Derived, so the badges and their message keys cannot drift apart. */
const CARD_AMENITY_KEYS = Object.keys(CARD_AMENITY_MESSAGE_KEYS) as Array<
  keyof typeof CARD_AMENITY_MESSAGE_KEYS
>

export const PropertyCard = (props: PropertyCardProps) => {
  const { propertyConfiguration } = props
  const t = useTranslations('pages.home.properties.card')
  const locale = useLocale()

  const guests = propertyConfiguration.highlights.find((highlight) => highlight.key === 'guests')
  const beds = propertyConfiguration.highlights.find((highlight) => highlight.key === 'beds')

  return (
    <Card className='overflow-hidden transition-all duration-500 hover:shadow-lg hover:-translate-y-2 py-0 pb-6'>
      <CardHeader className='p-0'>
        <div className='relative h-64 md:h-80 overflow-hidden'>
          <Image
            fill
            src={propertyConfiguration.images.cover.src}
            alt={resolveText(propertyConfiguration.title, locale)}
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
        <H3 className='line-clamp-2'>{resolveText(propertyConfiguration.title, locale)}</H3>
        <Muted>{resolveText(propertyConfiguration.subtitle, locale)}</Muted>
        <div className='flex items-center gap-6 text-muted-foreground mb-6 mt-6'>
          {beds && (
            <PropertyStatisticItem
              icon={LuBed}
              text={t('beds', { amount: beds.value })}
            />
          )}
          {guests && (
            <PropertyStatisticItem
              icon={GrGroup}
              text={t('guests', { amount: guests.value })}
            />
          )}
        </div>
        <div className='flex flex-wrap gap-2'>
          {CARD_AMENITY_KEYS.filter((key) => propertyConfiguration.amenities.includes(key))
            .map((key) => (
              <Badge
                key={key}
                variant='secondary'
              >
                {t(CARD_AMENITY_MESSAGE_KEYS[key])}
              </Badge>
            ))}
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild>
          <Link href={`/property/${propertyConfiguration.slug}`}>
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
