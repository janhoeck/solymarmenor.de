import { BookItCard } from '@/components/property/bookIt/BookItCard'
import { CalendarCard } from '@/components/property/calendar/CalendarCard'
import { PropertyImageGrid } from '@/components/property/images/PropertyImageGrid'
import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import { Separator } from '@jan_hoeck/ui'

import { ContentContainer } from '../shared/Container/ContentContainer'
import { AmenitiesSection } from './sections/amenitiesSection/AmenitiesSection'
import { DescriptionSection } from './sections/descriptionSection/DescriptionSection'
import { HouseRulesSection } from './sections/houseRulesSection/HouseRulesSection'
import { LocationDescriptionSection } from './sections/locationDescriptionSection/LocationDescriptionSection'
import { PropertyDetailsSection } from './sections/propertyDetailsSection/PropertyDetailsSection'

export type PropertyViewProps = {
  configuration: PropertyConfiguration
}

export const PropertyView = (props: PropertyViewProps) => {
  const { configuration } = props

  return (
    <div>
      <ContentContainer>
        <PropertyImageGrid imageSources={configuration.imageSources} />
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
              <BookItCard price={configuration.price} />
              <CalendarCard propertyConfig={configuration} />
            </div>
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}
