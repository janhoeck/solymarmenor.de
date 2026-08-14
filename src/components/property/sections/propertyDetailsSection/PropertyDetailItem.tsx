import { IconWithText } from '@/components/property/components/IconWithText'
import { iconMapping } from '@/components/property/iconMapping'
import type { Property } from '@/data/property-schema'
import { resolveText } from '@/data/localized-text'
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
      label={resolveText(detail.title, locale)}
      description={resolveText(detail.subtitle, locale)}
    />
  )
}
