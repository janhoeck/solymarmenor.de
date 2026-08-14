import { Section } from '@/components/shared/Section/Section'
import { groupAmenitiesByCategory } from '@/data/amenities'
import type { Property } from '@/data/property-schema'
import { useTranslations } from 'next-intl'

import { AmenityFeaturesBlock } from './AmenityFeaturesBlock'

export type AmenitiesSectionProps = {
  propertyConfig: Property
}

export const AmenitiesSection = (props: AmenitiesSectionProps) => {
  const { propertyConfig } = props
  const t = useTranslations('pages.property.equipmentFeaturesSection')
  const groups = groupAmenitiesByCategory(propertyConfig.amenities)

  return (
    <Section title={t('headline')}>
      <div className='grid grid-cols-2 gap-10'>
        {groups.map((group) => (
          <AmenityFeaturesBlock
            key={group.category}
            headline={t(`subHeadlines.${group.category}`)}
            featureTypes={group.keys}
          />
        ))}
      </div>
    </Section>
  )
}
