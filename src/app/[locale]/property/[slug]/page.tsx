import { PropertyView } from '@/components/property/PropertyView'
import { loadPropertyConfig } from '@/lib/load-property-configs'
import { notFound } from 'next/navigation'
import { use } from 'react'

type Params = Promise<{ slug: string }>

export default function PropertyPage({ params }: { params: Params }) {
  const { slug: id } = use(params)

  const propertyConfiguration = loadPropertyConfig(id)
  if (!propertyConfiguration) {
    notFound()
  }

  return <PropertyView configuration={propertyConfiguration} />
}
