import { convertDescription } from '@/components/property/utils'
import { ContentBlock } from '@/components/shared/ContentBlock/ContentBlock'
import { Section } from '@/components/shared/Section/Section'
import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import { useLocale, useTranslations } from 'next-intl'

import { AddressCard } from './AddressCard'

export type LocationDescriptionSectionProps = {
  propertyConfig: PropertyConfiguration
}

export const LocationDescriptionSection = (props: LocationDescriptionSectionProps) => {
  const { propertyConfig } = props
  const { address, lat, lng, description } = propertyConfig.location
  const t = useTranslations('pages.property.locationDescriptionSection')
  const locale = useLocale()

  return (
    <Section title={t('headline')}>
      <div className='grid grid-cols-1 gap-4 xl:grid-cols-5'>
        <div className='xl:col-span-3'>
          <ContentBlock items={convertDescription(locale, description)} />
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
