import { GoogleMapsAPIProvider } from '@/components/shared/GoogleMapsAPIProvider/GoogleMapsAPIProvider'
import { resolveText } from '@/data/localized-text'
import { getPropertyBySlug } from '@/lib/properties/repository'
import { generateCanonicalMetadata } from '@/lib/metadata'
import { Metadata } from 'next'
import { PropsWithChildren } from 'react'

type Params = Promise<{ locale: string; slug: string }>

type MetadataProps = {
  params: Params
}

export async function generateMetadata(props: MetadataProps): Promise<Metadata> {
  const { locale, slug } = await props.params
  const propertyConfiguration = await getPropertyBySlug(slug)

  if (!propertyConfiguration) {
    return {}
  }

  return {
    title: resolveText(propertyConfiguration.title, locale),
    ...generateCanonicalMetadata(locale, `/property/${slug}`),
    openGraph: {
      title: resolveText(propertyConfiguration.title, locale),
      url: `https://solymarmenor.com/property/${propertyConfiguration.id}`,
      images: [
        {
          url: `https://solymarmenor.com/images/${propertyConfiguration.id}/coverPhoto.webp`,
          width: 400,
          height: 400,
        },
      ],
      locale,
      type: 'website',
    },
  }
}

export default function PageLayout({ children }: PropsWithChildren) {
  return <GoogleMapsAPIProvider>{children}</GoogleMapsAPIProvider>
}
