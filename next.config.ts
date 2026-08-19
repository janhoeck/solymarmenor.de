import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

import { allRedirects } from './src/lib/redirects.ts'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: '',
  /**
   * The www → apex redirect and the retired /expose/ URLs, both built in
   * src/lib/redirects.ts. Config redirects run before the proxy, so they
   * answer before next-intl ever sees the request and the two cannot
   * disagree about the locale.
   *
   * Coolify must stay on "Allow www & non-www" for the host rule to be
   * reached at all: its own "Redirect to non-www" answers at Traefik with a
   * 302 and the app never sees those requests.
   */
  async redirects() {
    return allRedirects()
  },
  experimental: {
    scrollRestoration: true,
  },
  turbopack: {
    resolveAlias: {
      handlebars: 'handlebars/dist/handlebars.js',
    },
  },
  images: {
    qualities: [75, 80, 90],
    // No AVIF, deliberately. The optimizer runs on our own app server, not on an
    // edge platform, and the sources are already lossy WebP. Measured on the
    // gallery originals, an AVIF encode costs three times the CPU and still
    // produces ~1.7x larger files than WebP: IMG_1673 at 1920px came out as
    // AVIF 1670 ms / 804 kB versus WebP 528 ms / 455 kB. `['image/webp']` is
    // also the Next default, which is why no `formats` key is set here.
    //
    // No 3840 either: the sources are capped at 2560px by
    // scripts/images-downscale.mjs, so anything larger would be upscaled. The
    // short ladder also keeps the number of variants down, which raises the hit
    // rate of the optimizer cache.
    deviceSizes: [640, 828, 1080, 1440, 1920, 2560],
    // The default is four hours, after which every variant gets re-encoded even
    // though property photos practically never change. Note that the cache key
    // is the path, not the content: replacing a file under the same name means
    // the cache has to be cleared (see the deployment section of the README).
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
}

const withNextIntl = createNextIntlPlugin()
module.exports = withNextIntl(nextConfig)
