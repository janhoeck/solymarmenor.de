import { TextWithHeadline } from '@/components/home/TextWithHeadline'
import { PropertyCard } from '@/components/shared/PropertyCard/PropertyCard'
import { getProperties } from '@/lib/properties/repository'
import { getTranslations } from 'next-intl/server'
import React from 'react'

export const PropertyListSection = async () => {
  const t = await getTranslations('pages.home.properties')
  const properties = await getProperties()

  return (
    <section
      id='property-list-section'
      className='py-16 md:py-24'
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <TextWithHeadline
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <div className='mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:gap-10'>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              propertyConfiguration={property}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
