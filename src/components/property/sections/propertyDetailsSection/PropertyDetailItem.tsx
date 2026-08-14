import { IconWithText } from '@/components/property/components/IconWithText'
import { iconMapping } from '@/components/property/iconMapping'
import { getTranslation } from '@/components/property/utils'
import type { Property } from '@/data/property-schema'
import { useLocale } from 'next-intl'

export type PropertyDetailItemProps = {
  detail: Property['propertyDetails'][number]
}

export const PropertyDetailItem = (props: PropertyDetailItemProps) => {
  const { detail } = props

  const locale = useLocale()
  const Icon = iconMapping[detail.type]

  return (
    <IconWithText
      icon={Icon}
      label={getTranslation(locale, detail.title)}
      description={getTranslation(locale, detail.subtitle)}
    />
  )
}
