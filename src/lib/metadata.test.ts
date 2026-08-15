import assert from 'node:assert/strict'
import { test } from 'node:test'

import { BASE_URL, absoluteUrl, generateCanonicalMetadata, localizedPathname } from './metadata.ts'

test('the default locale gets no prefix under localePrefix as-needed', () => {
  assert.equal(localizedPathname('/aboutus', 'en'), '/aboutus')
  assert.equal(localizedPathname('/', 'en'), '/')
})

test('every other locale gets a prefix', () => {
  assert.equal(localizedPathname('/aboutus', 'de'), '/de/aboutus')
  assert.equal(localizedPathname('/', 'de'), '/de')
  assert.equal(localizedPathname('/property/apartment', 'es'), '/es/property/apartment')
})

test('a missing leading slash and a trailing slash are both tolerated', () => {
  assert.equal(localizedPathname('aboutus', 'de'), '/de/aboutus')
  assert.equal(localizedPathname('/aboutus/', 'de'), '/de/aboutus')
})

test('absoluteUrl prefixes the base URL without doubling slashes', () => {
  assert.equal(absoluteUrl('/de/contact'), `${BASE_URL}/de/contact`)
  assert.equal(absoluteUrl('/'), `${BASE_URL}/`)
})

test('canonical points at the unprefixed URL for the default locale', () => {
  const metadata = generateCanonicalMetadata('en', '/aboutus')
  assert.equal(metadata.alternates?.canonical, 'https://solymarmenor.com/aboutus')
})

test('canonical carries the prefix for a non-default locale', () => {
  const metadata = generateCanonicalMetadata('de', '/aboutus')
  assert.equal(metadata.alternates?.canonical, 'https://solymarmenor.com/de/aboutus')
})

test('alternates cover every locale plus x-default', () => {
  const metadata = generateCanonicalMetadata('de', '/contact')

  assert.deepEqual(metadata.alternates?.languages, {
    en: 'https://solymarmenor.com/contact',
    de: 'https://solymarmenor.com/de/contact',
    es: 'https://solymarmenor.com/es/contact',
    'x-default': 'https://solymarmenor.com/contact',
  })
})

test('no emitted URL carries the default locale as a path prefix', () => {
  // Regression guard for the defect this task fixes. Under localePrefix
  // 'as-needed' the proxy redirects /en/... to /..., so any canonical or
  // alternate pointing at /en/... hands Google a redirect to index.
  for (const pathname of ['/', '/aboutus', '/property/apartment']) {
    for (const locale of ['en', 'de', 'es']) {
      const { alternates } = generateCanonicalMetadata(locale, pathname)
      const urls = [alternates?.canonical, ...Object.values(alternates?.languages ?? {})]

      for (const url of urls) {
        assert.ok(!/\/en(\/|$)/.test(String(url)), `${url} must not carry the default locale prefix`)
      }
    }
  }
})
