import { IconWithText } from '@/components/property/components/IconWithText'
import { iconMapping } from '@/components/property/iconMapping'
import { IconType } from '@/types/IconType'
import { useTranslations } from 'next-intl'

export type AmenityFeatureItemProps = {
  type: IconType
}

export const AmenityFeatureItem = (props: AmenityFeatureItemProps) => {
  const { type } = props
  const t = useTranslations('pages.property.equipmentFeaturesSection')

  const Icon = iconMapping[type]

  return (
    <IconWithText
      icon={Icon}
      label={t(`descriptions.${type}`)}
    />
  )
}
