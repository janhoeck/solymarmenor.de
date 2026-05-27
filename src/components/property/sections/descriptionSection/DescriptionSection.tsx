import { convertDescription } from '@/components/property/utils'
import { ContentBlock } from '@/components/shared/ContentBlock/ContentBlock'
import { Section } from '@/components/shared/Section/Section'
import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import { useLocale, useTranslations } from 'next-intl'

export type DescriptionSectionProps = {
  propertyConfig: PropertyConfiguration
}

export const DescriptionSection = (props: DescriptionSectionProps) => {
  const { propertyConfig } = props
  const locale = useLocale()
  const t = useTranslations('pages.property.descriptionSection')

  return (
    <Section title={t('headline')}>
      <ContentBlock items={convertDescription(locale, propertyConfig.description)} />
    </Section>
  )
}
