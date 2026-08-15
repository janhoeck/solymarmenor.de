import type { MetadataRoute } from 'next'

import { routing } from '../i18n/routing.ts'
import { absoluteUrl, localizedPathname } from '../lib/metadata.ts'
import { getProperties } from '../lib/properties/repository.ts'

/**
 * Every page that is not a property. Kept here rather than derived from the
 * filesystem: `src/app/[locale]/` also holds `layout.tsx` and `loading.tsx`
 * files, and a route added without a sitemap entry should be a deliberate
 * decision, not a silent omission. `sitemap.test.ts` fails if an entry is
 * missing for any locale.
 */
export const STATIC_ROUTES = ['/', '/aboutus', '/contact', '/guestbook', '/imprint', '/privacy'] as const

/**
 * The static pages carry no per-page timestamp, so they share one date that is
 * bumped by hand when their content actually changes. A build timestamp would
 * be worse than none: it would claim every page changed on every deploy, and a
 * sitemap that cries wolf gets its lastmod ignored.
 */
const STATIC_PAGES_UPDATED_AT = '2026-08-15'

/**
 * One entry per locale variant, each carrying the full alternate set — the
 * shape the old static file used and the one Google documents for hreflang.
 *
 * `changefreq` and `priority` are deliberately absent. Google has stated it
 * ignores both, and the values in the old static file (`daily` on property
 * pages that change a few times a year) claimed otherwise.
 */
function entry(pathname: string, locale: string, lastModified: string): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((alternate) => [alternate, absoluteUrl(localizedPathname(pathname, alternate))])
  )
  languages['x-default'] = absoluteUrl(localizedPathname(pathname, routing.defaultLocale))

  return {
    url: absoluteUrl(localizedPathname(pathname, locale)),
    lastModified,
    alternates: { languages },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties()

  const pages = [
    ...STATIC_ROUTES.map((route) => ({ pathname: route as string, lastModified: STATIC_PAGES_UPDATED_AT })),
    ...properties.map((property) => ({
      pathname: `/property/${property.slug}`,
      lastModified: property.updatedAt,
    })),
  ]

  return pages.flatMap(({ pathname, lastModified }) =>
    routing.locales.map((locale) => entry(pathname, locale, lastModified))
  )
}
