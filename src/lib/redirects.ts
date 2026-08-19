import type { NextConfig } from 'next'

import { BASE_URL } from './metadata.ts'

/** The shape next.config.ts has to hand back, taken from Next's own type. */
type Redirect = Awaited<ReturnType<NonNullable<NextConfig['redirects']>>>[number]

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
