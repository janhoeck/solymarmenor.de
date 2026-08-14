import { PropertyContent } from '@/components/property/content/PropertyContent'
import { Section } from '@/components/shared/Section/Section'
import type { Property } from '@/data/property-schema'
import { useTranslations } from 'next-intl'

export type DescriptionSectionProps = {
  propertyConfig: Property
}

export const DescriptionSection = (props: DescriptionSectionProps) => {
  const { propertyConfig } = props
  const t = useTranslations('pages.property.descriptionSection')

  return (
    <Section title={t('headline')}>
      <PropertyContent blocks={propertyConfig.description} />
    </Section>
  )
}
