import { HomeView } from '@/components/home/HomeView'
import { JsonLd } from '@/components/shared/JsonLd/JsonLd'
import { buildSiteGraph } from '@/lib/structured-data/site'
import React from 'react'

type Params = Promise<{ locale: string }>

export default async function HomePage({ params }: { params: Params }) {
  const { locale } = await params

  return (
    <>
      <JsonLd data={buildSiteGraph(locale)} />
      <HomeView />
    </>
  )
}
