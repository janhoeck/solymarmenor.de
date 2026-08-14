import { PropertyView } from '@/components/property/PropertyView'
import { getPropertyBySlug } from '@/lib/properties/repository'
import { notFound } from 'next/navigation'

type Params = Promise<{ slug: string }>

export default async function PropertyPage({ params }: { params: Params }) {
  const { slug } = await params

  const property = await getPropertyBySlug(slug)
  if (!property) {
    notFound()
  }

  return <PropertyView configuration={property} />
}
