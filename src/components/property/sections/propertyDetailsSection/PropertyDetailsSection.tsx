import { PropertyDetailItem } from '@/components/property/sections/propertyDetailsSection/PropertyDetailItem'
import type { Property } from '@/data/property-schema'
import { resolveText } from '@/data/localized-text'
import { Badge, H1, P } from '@/components/ui'
import { useLocale } from 'next-intl'
import { LuMapPin } from 'react-icons/lu'

export type PropertyDetailsSectionProps = {
  propertyConfig: Property
}

export const PropertyDetailsSection = (props: PropertyDetailsSectionProps) => {
  const { propertyConfig } = props
  const { location, highlights, title, subtitle } = propertyConfig

  const locale = useLocale()

  return (
    <div className='flex flex-col gap-4'>
      <Badge>
        <LuMapPin size={16} />
        {location.address.city}
      </Badge>
      <H1 className='font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground'>
        {resolveText(title, locale)}
      </H1>
      <P className='text-muted-foreground'>{resolveText(subtitle, locale)}</P>
      <div className='flex flex-wrap gap-6 mt-4'>
        {highlights.map((highlight) => (
          <PropertyDetailItem
            key={highlight.key}
            highlight={highlight}
          />
        ))}
      </div>
    </div>
  )
}
