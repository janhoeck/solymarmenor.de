import type { Metadata } from 'next'

import { routing } from '../i18n/routing.ts'

/** No trailing slash, so `absoluteUrl` can concatenate without checking. */
export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://solymarmenor.com').replace(/\/+$/, '')

/**
 * The pathname a locale is actually served under.
 *
 * `src/proxy.ts` runs next-intl with `localePrefix: 'as-needed'`, so the default
 * locale is served without a prefix and `/en/aboutus` redirects to `/aboutus`.
 * Building `/{locale}/{path}` unconditionally — as this module did before —
 * pointed every English canonical and every English sitemap entry at a
 * redirect, which tells Google to index a URL that does not serve content.
 *
 * next-intl's own `getPathname` would answer this, but importing it pulls in
 * `next/navigation`, which does not resolve under `node --test`
 * (`ERR_MODULE_NOT_FOUND`). Using it would leave the riskiest change in this
 * file untested, so the rule is reimplemented here — it is one branch — and
 * pinned by `metadata.test.ts`. Reading `routing` rather than hard-coding 'en'
 * means a later change to `localePrefix` or `defaultLocale` carries over.
 *
 * Localized pathnames (`routing.pathnames`) are not covered; the project does
 * not use them. Introducing them means extending this function.
 */
export function localizedPathname(pathname: string, locale: string): string {
  const cleanPath = pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  const needsPrefix = locale !== routing.defaultLocale

  return `/${[needsPrefix ? locale : '', cleanPath].filter(Boolean).join('/')}`
}

export function absoluteUrl(pathname: string): string {
  return `${BASE_URL}${pathname}`
}

export function generateCanonicalMetadata(locale: string, pathname: string): Metadata {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((lang) => [lang, absoluteUrl(localizedPathname(pathname, lang))])
  )

  // x-default names the variant for visitors whose language matches none of
  // the above. It was present in the old static sitemap but never in the
  // rendered HTML, so the two contradicted each other.
  languages['x-default'] = absoluteUrl(localizedPathname(pathname, routing.defaultLocale))

  return {
    alternates: {
      canonical: absoluteUrl(localizedPathname(pathname, locale)),
      languages,
    },
  }
}
