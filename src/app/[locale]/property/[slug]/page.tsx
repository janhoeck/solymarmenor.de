import { PropertyView } from '@/components/property/PropertyView'
import { JsonLd } from '@/components/shared/JsonLd/JsonLd'
import { getPropertyBySlug } from '@/lib/properties/repository'
import { buildVacationRental } from '@/lib/structured-data/vacation-rental'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

type Params = Promise<{ locale: string; slug: string }>

export default async function PropertyPage({ params }: { params: Params }) {
  const { locale, slug } = await params

  const property = await getPropertyBySlug(slug)
  if (!property) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'pages.property.equipmentFeaturesSection' })
  const amenityNames = property.amenities.map((amenity) => t(`descriptions.${amenity}`))

  return (
    <>
      <JsonLd data={buildVacationRental(property, locale, amenityNames)} />
      <PropertyView configuration={property} />
    </>
  )
}
