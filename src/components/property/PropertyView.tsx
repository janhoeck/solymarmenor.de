import { BookItCard } from '@/components/property/bookIt/BookItCard'
import { CalendarCard } from '@/components/property/calendar/CalendarCard'
import { PropertyImageGrid } from '@/components/property/images/PropertyImageGrid'
import { Separator } from '@/components/ui'
import { resolveText } from '@/data/localized-text'
import type { Property } from '@/data/property-schema'
import { useLocale } from 'next-intl'

import { ContentContainer } from '../shared/Container/ContentContainer'
import { AmenitiesSection } from './sections/amenitiesSection/AmenitiesSection'
import { DescriptionSection } from './sections/descriptionSection/DescriptionSection'
import { HouseRulesSection } from './sections/houseRulesSection/HouseRulesSection'
import { LocationDescriptionSection } from './sections/locationDescriptionSection/LocationDescriptionSection'
import { PropertyDetailsSection } from './sections/propertyDetailsSection/PropertyDetailsSection'

export type PropertyViewProps = {
  configuration: Property
}

export const PropertyView = (props: PropertyViewProps) => {
  const { configuration } = props
  const locale = useLocale()

  return (
    <div>
      <ContentContainer>
        <PropertyImageGrid
          images={configuration.images}
          fallbackAlt={resolveText(configuration.title, locale)}
        />
        <div className='grid lg:grid-cols-3 gap-8 md:gap-12 mt-10'>
          <div className='lg:col-span-2 space-y-8'>
            <div className='flex flex-col gap-12'>
              <PropertyDetailsSection propertyConfig={configuration} />
              <Separator />
              <DescriptionSection propertyConfig={configuration} />
              <AmenitiesSection propertyConfig={configuration} />
              <HouseRulesSection propertyConfig={configuration} />
              <LocationDescriptionSection propertyConfig={configuration} />
            </div>
          </div>
          <div className='lg:col-span-1'>
            <div className='sticky top-24 space-y-6'>
              <BookItCard pricing={configuration.pricing} />
              <CalendarCard
                propertyId={configuration.id}
                hasCalendar={Boolean(configuration.calendar)}
              />
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}
