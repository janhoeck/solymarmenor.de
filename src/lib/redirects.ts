import type { NextConfig } from 'next'

import { routing } from '../i18n/routing.ts'
import { BASE_URL, localizedPathname } from './metadata.ts'

/** The shape next.config.ts has to hand back, taken from Next's own type. */
type Redirect = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>[number]

/**
 * The segment property pages were served under before the `expose` →
 * `property` rename (see `apps/holiday_apartment/src/app/[locale]/expose/` in
 * the history, gone since 407c949).
 */
const LEGACY_SEGMENT = 'expose'

/**
 * Permanent redirect from the www host to the canonical one.
 *
 * Both hosts resolve to the same app and both answered 200 for a year, which
 * split the site across two origins: Search Console attributed 825 of 1168
 * impressions to https://www.solymarmenor.com/ at position 49, while every
 * sub-page ranked under the apex. The canonical tag has always pointed at the
 * apex — Google overrode it, which is what happens when a host serves content
 * instead of a redirect.
 *
 * This lives here rather than in the reverse proxy on purpose. Coolify's own
 * "Redirect to non-www" direction emits a Traefik `redirectregex` middleware
 * with `permanent=false`, i.e. a 302, and the value is not configurable
 * without taking the app's labels off Coolify's auto-generation. A temporary
 * redirect is the wrong signal for the one thing this is meant to fix, so the
 * app answers instead and Coolify stays on "Allow www & non-www".
 *
 * `permanent: true` emits a 308. Next offers no way to spell 301 through this
 * flag; Google documents both as permanent and the distinction only matters
 * for non-GET requests, which these URLs never see.
 */
export function canonicalHostRedirects(): Redirect[] {
  const canonicalHost = new URL(BASE_URL).host

  // Nothing to redirect when the canonical origin is itself a www host, and
  // nothing to redirect in local development, where the host is a port on
  // localhost and `www.localhost:4000` is not a thing anyone reaches.
  if (canonicalHost.startsWith('www.')) {
    return []
  }

  return [
    {
      source: '/:path*',
      has: [{ type: 'host', value: `www.${canonicalHost}` }],
      // Absolute, because a relative destination cannot change the host.
      destination: `${BASE_URL}/:path*`,
      permanent: true,
    },
  ]
}

/**
 * Permanent redirects from the retired /expose/:slug URLs to their
 * /property/:slug equivalents, one per locale.
 *
 * Google still holds the old URLs: the Search Console export for Aug 2025 –
 * Aug 2026 counts 17 impressions on /es/expose/apartment and 2 on
 * /de/expose/apartment, every one of them answered with a 404 because the
 * rename never came with a redirect.
 *
 * Source and destination are both built with `localizedPathname`, so the rules
 * follow `routing.localePrefix` rather than restating it — the same reason
 * sitemap.ts derives its entries instead of listing them. `:slug` survives the
 * round trip untouched; it is not a segment `localizedPathname` inspects.
 *
 * The slug is a wildcard rather than an enumeration of the property data. Only
 * `apartment` and `house` ever existed under the old segment and both still
 * exist, so the mapping is one to one today. Were a property retired later its
 * legacy URL would redirect into a 404 instead of answering with one directly,
 * which is the cheaper mistake — and the alternative couples the redirect
 * table to content that changes for unrelated reasons.
 */
export function legacyPropertyRedirects(): Redirect[] {
  const rules: Redirect[] = routing.locales.map((locale) => ({
    source: localizedPathname(`/${LEGACY_SEGMENT}/:slug`, locale),
    destination: localizedPathname('/property/:slug', locale),
    permanent: true,
  }))

  // The old static sitemap (7991e29) listed the default locale with its prefix
  // — /en/expose/apartment — so that form is indexed too, and under
  // localePrefix 'as-needed' the loop above does not produce it. Its
  // destination is the unprefixed URL rather than /en/property/:slug, because
  // the latter is itself a 307 through the proxy and a two-hop chain is a
  // signal Google follows grudgingly. The guard keeps the rule from colliding
  // with an existing source should localePrefix ever become 'always'.
  const prefixedDefault = `/${routing.defaultLocale}/${LEGACY_SEGMENT}/:slug`

  if (!rules.some((rule) => rule.source === prefixedDefault)) {
    rules.push({
      source: prefixedDefault,
      destination: localizedPathname('/property/:slug', routing.defaultLocale),
      permanent: true,
    })
  }

  return rules
}

/**
 * Every redirect the app answers, in the order Next evaluates them.
 *
 * Host normalisation comes first on purpose. A www request for a legacy URL
 * therefore lands on the apex first and picks up the /property/ rule on the
 * follow-up request — two hops for a combination that barely occurs, where
 * the alternative is duplicating every legacy rule once per host.
 */
export function allRedirects(): Redirect[] {
  return [...canonicalHostRedirects(), ...legacyPropertyRedirects()]
}
