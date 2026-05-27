import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: '',
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
    formats: ['image/avif', 'image/webp'],
  },
}

const withNextIntl = createNextIntlPlugin()
module.exports = withNextIntl(nextConfig)
