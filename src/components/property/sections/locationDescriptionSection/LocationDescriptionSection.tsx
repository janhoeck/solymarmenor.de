import { PropertyContent } from '@/components/property/content/PropertyContent'
import { Section } from '@/components/shared/Section/Section'
import type { Property } from '@/data/property-schema'
import { useTranslations } from 'next-intl'

import { AddressCard } from './AddressCard'

export type LocationDescriptionSectionProps = {
  propertyConfig: Property
}

export const LocationDescriptionSection = (props: LocationDescriptionSectionProps) => {
  const { propertyConfig } = props
  const { address, lat, lng, description } = propertyConfig.location
  const t = useTranslations('pages.property.locationDescriptionSection')

  return (
    <Section title={t('headline')}>
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-5'>
        <div className='xl:col-span-3'>
          <PropertyContent blocks={description} />
        </div>
        <div className='xl:col-span-2'>
          <AddressCard
            lat={lat}
            lng={lng}
            address={address}
          />
        </div>
      </div>
    </Section>
  )
}
