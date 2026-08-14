import { isDateInPeriod } from '@/data/pricing'
import type { PropertyPricing } from '@/data/property-schema'
import { Button, Card, CardContent, P, Separator, Small } from '@/components/ui'
import { useTranslations } from 'next-intl'
import { PiEnvelopeOpenLight, PiPhoneCallLight } from 'react-icons/pi'

import { Link } from '../../../i18n/navigation'
import { SeasonPrice } from './SeasonPrice'

export type BookItCardProps = {
  pricing: PropertyPricing
}

export const BookItCard = (props: BookItCardProps) => {
  const { pricing } = props

  const t = useTranslations('pages.property.bookIt')
  const today = new Date()

  const mainRate = pricing.rates.find((rate) => rate.season === 'main')
  const offRate = pricing.rates.find((rate) => rate.season === 'off')
  const cleaning = pricing.fees.find((fee) => fee.type === 'cleaning')?.amount

  const isActive = (rate: PropertyPricing['rates'][number] | undefined) =>
    Boolean(rate?.periods.some((period) => isDateInPeriod(period, today)))

  return (
    <Card>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-2 gap-2'>
          {mainRate && (
            <SeasonPrice
              isActive={isActive(mainRate)}
              price={mainRate.pricePerNight}
              seasonRange={t('mainSeason.range')}
              seasonType='main'
              title={t('mainSeason.title')}
            />
          )}
          {offRate && (
            <SeasonPrice
              isActive={isActive(offRate)}
              price={offRate.pricePerNight}
              seasonRange={t('offSeason.range')}
              seasonType='off'
              title={t('offSeason.title')}
            />
          )}
        </div>
        {cleaning && (
          <div className='p-2 bg-gray-50 rounded-md flex items-center'>
            <P>{t('cleaning.text', { cleaning })}</P>
            <Small className='text-muted-foreground pl-2'>{t('cleaning.once')}</Small>
          </div>
        )}
        <div className='flex flex-row gap-2 items-center'>
          <div className='flex-1'>
            <Separator />
          </div>
          <Button asChild>
            <Link href='/contact'>
              <PiEnvelopeOpenLight size={16} />
              {t('contact')}
            </Link>
          </Button>
          <div className='flex-1'>
            <Separator />
          </div>
        </div>
        <div className='space-y-4'>
          <div className='space-y-3 text-sm'>
            <a
              href='mailto:casas.marmenor@gmx.de'
              className='flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors'
            >
              <PiEnvelopeOpenLight size={20} />
              casas.marmenor@gmx.de
            </a>
            <a
              href='tel:+34 604 482 002'
              className='flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors'
            >
              <PiPhoneCallLight size={20} />
              +34 604 482 002
            </a>
            <a
              href='tel:+49 176 47 36 7 18'
              className='flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors'
            >
              <PiPhoneCallLight size={20} />
              +49 176 47 36 7 18
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
