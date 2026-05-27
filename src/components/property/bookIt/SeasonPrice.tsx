import { Badge, Muted, P, Small } from '@jan_hoeck/ui'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

type SeasonType = 'main' | 'off'

export type SeasonPriceProps = {
  title: string
  seasonRange: string
  price: number
  currency?: string
  seasonType?: SeasonType
  isActive?: boolean
  className?: string
}

const SEASON_STYLES: Record<SeasonType, string> = {
  main: 'bg-amber-50',
  off: 'bg-blue-50',
}

export const SeasonPrice = ({
  title,
  seasonRange,
  price,
  currency = '€',
  seasonType = 'main',
  isActive = false,
  className,
}: SeasonPriceProps) => {
  const t = useTranslations('pages.property.bookIt')

  return (
    <div className={twMerge('border rounded-md relative', isActive && 'ring-2 ring-primary', className)}>
      <div className={twMerge('p-4 flex flex-col items-center gap-1', SEASON_STYLES[seasonType])}>
        <P className='font-semibold'>{title}</P>
        <Muted>{seasonRange}</Muted>
        {isActive && <Badge className='absolute -top-4 -right-2'>{t('currentPrice')}</Badge>}
      </div>

      <div className='p-4 flex flex-col items-center gap-1'>
        <div className='text-xl font-bold text-foreground flex flex-row items-center gap-1'>
          {price} {currency}
          <Small className='font-normal text-muted-foreground'> / {t('night')}</Small>
        </div>
        <Muted>{t('mwst')}</Muted>
      </div>
    </div>
  )
}
