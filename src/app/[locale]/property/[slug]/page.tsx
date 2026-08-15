import { PropertyView } from '@/components/property/PropertyView'
import { JsonLd } from '@/components/shared/JsonLd/JsonLd'
import { resolveText } from '@/data/localized-text'
import { getPropertyBySlug } from '@/lib/properties/repository'
import { buildBreadcrumbs } from '@/lib/structured-data/breadcrumbs'
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

  // 'components.navigation' is the namespace LayoutNavigation.tsx already uses;
  // reusing it keeps the breadcrumb label identical to the visible nav item.
  const navigation = await getTranslations({ locale, namespace: 'components.navigation' })

  return (
    <>
      <JsonLd data={buildVacationRental(property, locale, amenityNames)} />
      <JsonLd
        data={buildBreadcrumbs(
          [
            { name: navigation('home'), pathname: '/' },
            { name: resolveText(property.title, locale), pathname: `/property/${property.slug}` },
          ],
          locale
        )}
      />
      <PropertyView configuration={property} />
    </>
  )
}
