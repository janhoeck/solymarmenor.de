import { IconWithText } from '@/components/property/components/IconWithText'
import { PropertyContent } from '@/components/property/content/PropertyContent'
import { iconMapping } from '@/components/property/iconMapping'
import { Section } from '@/components/shared/Section/Section'
import type { Property } from '@/data/property-schema'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

export type HouseRulesSectionProps = {
  propertyConfig: Property
}

export const HouseRulesSection = (props: HouseRulesSectionProps) => {
  const { propertyConfig } = props
  const { houseRules } = propertyConfig
  const t = useTranslations('pages.property.houseRulesSection')

  return (
    <Section title={t('headline')}>
      <div className='flex flex-col gap-4'>
        <div className={twMerge(['flex flex-col gap-2', 'sm:flex-row'])}>
          <div className='flex flex-1 flex-col gap-4'>
            <IconWithText
              icon={iconMapping['checkin']}
              label={t('itemHeadlines.checkin')}
              description={t('checkinTime', { time: houseRules.checkInFrom })}
            />
            <IconWithText
              icon={iconMapping['checkout']}
              label={t('itemHeadlines.checkout')}
              description={t('checkoutTime', { time: houseRules.checkOutUntil })}
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
