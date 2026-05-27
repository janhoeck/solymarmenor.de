import { PropertyDetailItem } from '@/components/property/sections/propertyDetailsSection/PropertyDetailItem'
import { getTranslation } from '@/components/property/utils'
import { PropertyConfiguration } from '@/types/PropertyConfiguration'
import { Badge, H1, P } from '@jan_hoeck/ui'
import { useLocale } from 'next-intl'
import { LuMapPin } from 'react-icons/lu'

export type PropertyDetailsSectionProps = {
  propertyConfig: PropertyConfiguration
}

export const PropertyDetailsSection = (props: PropertyDetailsSectionProps) => {
  const { propertyConfig } = props
  const { location, propertyDetails, title, subtitle } = propertyConfig

  const locale = useLocale()

  return (
    <div className='flex flex-col gap-4'>
      <Badge>
        <LuMapPin size={16} />
        {location.address.city}
      </Badge>
      <H1 className='font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground'>
        {getTranslation(locale, title)}
      </H1>
      <P className='text-muted-foreground'>{getTranslation(locale, subtitle)}</P>
      <div className='flex flex-wrap gap-6 mt-4'>
        {propertyDetails.map((detail) => (
          <PropertyDetailItem
            key={detail.type}
            detail={detail}
          />
        ))}
      </div>
    </div>
  )
}
