import { LayoutFooter } from '@/components/shared/LayoutFooter'
import { LayoutNavigation } from '@/components/shared/LayoutNavigation'
import { WebVitals } from '@/components/shared/WebVitals'
import { Toaster } from '@/components/ui'
import { BASE_URL, absoluteUrl, generateCanonicalMetadata } from '@/lib/metadata'
import { SITE_NAME } from '@/lib/structured-data/identity'
import { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { Geist } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'

import { routing } from '../../i18n/routing'
import './index.css'

const geist = Geist({
  subsets: ['latin'],
})

type Params = Promise<{ locale: string }>

type MetadataProps = {
  params: Params
}

type LayoutProps = {
  children: React.ReactNode
  params: Params
}

export async function generateMetadata(props: MetadataProps): Promise<Metadata> {
  const { locale } = await props.params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const title = t('title')
  const description = t('description')
  const ogImageUrl = absoluteUrl('/og/default.jpg')

  return {
    // Without this, Next cannot resolve relative URLs in openGraph and
    // alternates, and warns about it at build time.
    metadataBase: new URL(BASE_URL),
    title,
    description,
    // No `keywords`. The meta keywords tag has been ignored by Google for
    // years, and the ~60 entries this replaced included misspelling variants
    // ('los alcarzares', 'los alcarez') that Bing treats as a stuffing signal.
    ...generateCanonicalMetadata(locale, '/'),
    icons: {
      icon: '/favicon.ico',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      // No `url`. This layout cannot know which child route is rendering, and
      // Next replaces `openGraph` wholesale rather than merging it key by key,
      // so a URL set here would be correct for the home page only and wrong on
      // every other route. Omitting it lets crawlers fall back to the URL they
      // actually fetched, which is always right.
      siteName: SITE_NAME,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
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
      images: [ogImageUrl],
    },
  }
}

export default async function Layout(props: LayoutProps) {
  const { children, params } = props
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  return (
    <html
      lang={locale}
      className={geist.className}
    >
      <body>
        <WebVitals locale={locale} />
        <NextIntlClientProvider>
          <LayoutNavigation />
          <main className='min-h-[calc(100%-73px-105px)]'>{children}</main>
          <LayoutFooter />
        </NextIntlClientProvider>
        <Toaster
          richColors
          position='top-center'
        />
      </body>
    </html>
  )
}
