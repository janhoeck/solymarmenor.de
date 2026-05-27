import { Metadata } from 'next'

import { routing } from '../i18n/routing'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://solymarmenor.com'

const removeLastSlash = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url)

const buildLanguageUrl = (url: string, lang: string, path: string) => {
  return removeLastSlash(`${url}/${lang}/${path}`)
}

export function generateCanonicalMetadata(locale: string, pathname: string): Metadata {
  // Remove starting slash to prevent double slashes
  const cleanPath = pathname.replace(/^\//, '')
  const fullPath = cleanPath ? `${locale}/${cleanPath}` : locale

  const cleanBaseUrl = removeLastSlash(BASE_URL)

  return {
    alternates: {
      canonical: `${cleanBaseUrl}/${fullPath}`,
      languages: routing.locales.reduce(
        (acc, lang) => ({
          ...acc,
          [lang]: buildLanguageUrl(cleanBaseUrl, lang, cleanPath),
        }),
        {} as Record<string, string>
      ),
    },
  }
}
