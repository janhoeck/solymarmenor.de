import type { MetadataRoute } from 'next'

import { absoluteUrl } from '../lib/metadata.ts'

/**
 * Replaces the static public/robots.txt. Two changes of substance: the `Host:`
 * directive is gone (only Yandex ever read it), and /api/ is disallowed — the
 * ICS and vitals endpoints are not pages and have nothing to offer a crawler.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
