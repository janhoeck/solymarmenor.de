import { GoogleMapsAPIProvider } from '@/components/shared/GoogleMapsAPIProvider/GoogleMapsAPIProvider'
import { resolveText } from '@/data/localized-text'
import { absoluteUrl, generateCanonicalMetadata, localizedPathname } from '@/lib/metadata'
import { getPropertyBySlug } from '@/lib/properties/repository'
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

  const title = resolveText(propertyConfiguration.title, locale)
  const description = resolveText(propertyConfiguration.subtitle, locale)
  const cover = propertyConfiguration.images.cover

  return {
    title,
    description,
    ...generateCanonicalMetadata(locale, `/property/${slug}`),
    openGraph: {
      title,
      description,
      // Built from the routing config rather than hard-coded, so the preview
      // URL points at the page in the language it describes.
      url: absoluteUrl(localizedPathname(`/property/${propertyConfiguration.slug}`, locale)),
      images: [
        {
          url: absoluteUrl(cover.src),
          width: cover.width,
          height: cover.height,
          alt: title,
        },
      ],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(cover.src)],
    },
  }
}

export default function PageLayout({ children }: PropsWithChildren) {
  return <GoogleMapsAPIProvider>{children}</GoogleMapsAPIProvider>
}
