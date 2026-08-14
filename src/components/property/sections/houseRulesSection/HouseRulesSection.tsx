import { IconWithText } from '@/components/property/components/IconWithText'
import { PropertyContent } from '@/components/property/content/PropertyContent'
import { iconMapping } from '@/components/property/iconMapping'
import { Section } from '@/components/shared/Section/Section'
import type { Property } from '@/data/property-schema'
import { useFormatter, useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

export type HouseRulesSectionProps = {
  propertyConfig: Property
}

export const HouseRulesSection = (props: HouseRulesSectionProps) => {
  const { propertyConfig } = props
  const { houseRules } = propertyConfig
  const t = useTranslations('pages.property.houseRulesSection')
  const format = useFormatter()

  /** Formats a `HH:MM` value per the active locale (24h for de/es, 12h with AM/PM for en). */
  const formatTime = (value: string) => {
    const [hours = 0, minutes = 0] = value.split(':').map(Number)
    return format.dateTime(new Date(2000, 0, 1, hours, minutes), {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Section title={t('headline')}>
      <div className='flex flex-col gap-4'>
        <div className={twMerge(['flex flex-col gap-2', 'sm:flex-row'])}>
          <div className='flex flex-1 flex-col gap-4'>
            <IconWithText
              icon={iconMapping['checkin']}
              label={t('itemHeadlines.checkin')}
              description={t('checkinTime', { time: formatTime(houseRules.checkInFrom) })}
            />
            <IconWithText
              icon={iconMapping['checkout']}
              label={t('itemHeadlines.checkout')}
              description={t('checkoutTime', { time: formatTime(houseRules.checkOutUntil) })}
            />
          </div>
          <div className='flex flex-1 flex-col gap-4'>
            {houseRules.rules.map((rule) => {
              const icon = iconMapping[rule]
              const label = t(`itemHeadlines.${rule}`)
              const description = t(`descriptions.${rule}`)

              return (
                <IconWithText
                  key={rule}
                  icon={icon}
                  label={label}
                  description={description}
                />
              )
            })}
          </div>
        </div>
        {houseRules.notes && <PropertyContent blocks={houseRules.notes} />}
      </div>
    </Section>
  )
}
