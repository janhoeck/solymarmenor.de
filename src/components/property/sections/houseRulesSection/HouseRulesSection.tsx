import { IconWithText } from '@/components/property/components/IconWithText'
import { PropertyContent } from '@/components/property/content/PropertyContent'
import { iconMapping } from '@/components/property/iconMapping'
import { Section } from '@/components/shared/Section/Section'
import type { Property } from '@/data/property-schema'
import { resolveText } from '@/data/localized-text'
import { useLocale, useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

export type HouseRulesSectionProps = {
  propertyConfig: Property
}

export const HouseRulesSection = (props: HouseRulesSectionProps) => {
  const { propertyConfig } = props
  const { houseRules } = propertyConfig
  const t = useTranslations('pages.property.houseRulesSection')
  const locale = useLocale()

  return (
    <Section title={t('headline')}>
      <div className='flex flex-col gap-4'>
        <div className={twMerge(['flex flex-col gap-2', 'sm:flex-row'])}>
          <div className='flex flex-1 flex-col gap-4'>
            <IconWithText
              icon={iconMapping['checkin']}
              label={t('itemHeadlines.checkin')}
              description={resolveText(houseRules.checkIn, locale)}
            />
            <IconWithText
              icon={iconMapping['checkout']}
              label={t('itemHeadlines.checkout')}
              description={resolveText(houseRules.checkOut, locale)}
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
        {houseRules.description && <PropertyContent blocks={houseRules.description} />}
      </div>
    </Section>
  )
}
