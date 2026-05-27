import { Section } from '@/components/shared/Section/Section'
import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import { useTranslations } from 'next-intl'

import { AmenityFeaturesBlock } from './AmenityFeaturesBlock'

export type EquipmentFeaturesSectionProps = {
  propertyConfig: PropertyConfiguration
}

export const AmenitiesSection = (props: EquipmentFeaturesSectionProps) => {
  const { propertyConfig } = props
  const { amenities } = propertyConfig
  const t = useTranslations('pages.property.equipmentFeaturesSection')
  return (
    <Section title={t('headline')}>
      <div className='grid grid-cols-2 gap-10'>
        <AmenityFeaturesBlock
          headline={t('subHeadlines.general')}
          featureTypes={amenities.general}
        />
        <AmenityFeaturesBlock
          headline={t('subHeadlines.kitchen')}
          featureTypes={amenities.kitchen}
        />
        <AmenityFeaturesBlock
          headline={t('subHeadlines.bathroom')}
          featureTypes={amenities.bathroom}
        />
        <AmenityFeaturesBlock
          headline={t('subHeadlines.outdoorArea')}
          featureTypes={amenities.outdoorArea}
        />
        <AmenityFeaturesBlock
          headline={t('subHeadlines.bedroom')}
          featureTypes={amenities.bedroom}
        />
        <AmenityFeaturesBlock
          headline={t('subHeadlines.baby')}
          featureTypes={amenities.baby}
        />
      </div>
    </Section>
  )
}
