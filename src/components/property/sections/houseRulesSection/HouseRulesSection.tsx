import { IconWithText } from '@/components/property/components/IconWithText'
import { iconMapping } from '@/components/property/iconMapping'
import { convertDescription, getTranslation } from '@/components/property/utils'
import { ContentBlock } from '@/components/shared/ContentBlock/ContentBlock'
import { Section } from '@/components/shared/Section/Section'
import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import { useLocale, useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

export type HouseRulesSectionProps = {
  propertyConfig: PropertyConfiguration
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
              description={getTranslation(locale, houseRules.checkIn)}
            />
            <IconWithText
              icon={iconMapping['checkout']}
              label={t('itemHeadlines.checkout')}
              description={getTranslation(locale, houseRules.checkOut)}
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
        {houseRules.description && <ContentBlock items={convertDescription(locale, houseRules.description)} />}
      </div>
    </Section>
  )
}
