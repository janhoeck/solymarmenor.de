import { IconWithText } from '@/components/property/components/IconWithText'
import { iconMapping } from '@/components/property/iconMapping'
import { resolveText } from '@/data/localized-text'
import type { PropertyHighlight } from '@/data/property-schema'
import { useLocale, useTranslations } from 'next-intl'

export type PropertyDetailItemProps = {
  highlight: PropertyHighlight
}

export const PropertyDetailItem = (props: PropertyDetailItemProps) => {
  const { highlight } = props

  const locale = useLocale()
  const t = useTranslations('pages.property.highlights')
  const Icon = iconMapping[highlight.icon]

  const description = highlight.caption
    ? resolveText(highlight.caption, locale)
    : t(highlight.unit === 'sqm' ? 'valueSqm' : 'value', { value: highlight.value })

  return (
    <IconWithText
      icon={Icon}
      label={resolveText(highlight.label, locale)}
      description={description}
    />
  )
}
