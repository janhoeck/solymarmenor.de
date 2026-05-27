import { LayoutFooter } from '@/components/shared/LayoutFooter'
import { LayoutNavigation } from '@/components/shared/LayoutNavigation'
import { WebVitals } from '@/components/shared/WebVitals'
import { generateCanonicalMetadata } from '@/lib/metadata'
import { Toaster } from '@jan_hoeck/ui'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
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

  return {
    title: t('title'),
    description: t('description'),
    keywords: [
      // Primary geographic keywords
      'Urlaub Murcia',
      'Costa Cálida Urlaub',
      'Ferienwohnung Murcia',
      'Ferienhaus Costa Cálida',
      'Spanien Urlaub',
      'Costa Cálida',

      // Accommodation keywords
      'Ferienwohnung Spanien',
      'Ferienhaus Murcia',
      'Urlaubsunterkunft Costa Cálida',
      'Ferienwohnung mieten Murcia',
      'Ferienhaus mieten Spanien',

      // Experience keywords
      'Mediterrane Ferien',
      'Strandurlaub Spanien',
      'Sonniger Urlaub',
      'Erholungsurlaub Spanien',
      'Aktivurlaub Murcia',

      // Long-tail keywords
      'geschmackvoll eingerichtete Ferienwohnung',
      'unvergesslicher Urlaub Costa Cálida',
      'mediterrane Lebensgefühl genießen',
      'Urlaubsträume wahr werden',
      'zweites Zuhause spanische Sonne',

      // Seasonal keywords
      'Sommerurlaub Murcia',
      'Winterurlaub Costa Cálida',
      'Familienurlaub Spanien',
      'Strand und Sport Urlaub',
      'Kulinarik Urlaub Spanien',

      // Specific activities
      'Strandurlaub Costa Cálida',
      'Sporturlaub Murcia',
      'Entspannungsurlaub Spanien',
      'Golfurlaub Costa Cálida',

      // Local terms
      'Costa Cálida',
      'Murcia',
      'Región de Murcia',
      'Spanien',
      'Mittelmeer',

      // Booking keywords
      'Ferienwohnung buchen Murcia',
      'Ferienhaus reservieren Costa Cálida',
      'Urlaubsunterkunft online buchen',
      'Ferienwohnung direkt buchen',

      // SEO keywords
      'los alcazares',
      'mar menor',
      'holidays to los alcazares',
      'mar menor spain',
      'los alcazares beach',
      'los alcázares',
      'where is mar menor',
      'holidays in los alcazares',
      'los alcarez',
      'alcazares murcia',
      'los alcazares holidays',
      'los alcarzares',
      'mar menor murcia',
      'murcia alcazares',
      'los alcazares spain',
      'los alcazares mar menor',
      'los alcázares spain',
      'mar menor los alcazares',
      'the mar menor',
    ],
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
      title: t('title'),
      description: t('description'),
      url: 'https://solymarmenor.com',
      siteName: 'Home',
      images: [
        {
          url: 'https://solymarmenor.com/favicon.ico',
          width: 800,
          height: 800,
        },
      ],
      locale,
      type: 'website',
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
        <WebVitals />
        <NextIntlClientProvider>
          <LayoutNavigation />
          <main className='min-h-[calc(100%-73px-105px)]'>{children}</main>
          <LayoutFooter />
        </NextIntlClientProvider>
        <Toaster
          richColors
          position='top-center'
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
