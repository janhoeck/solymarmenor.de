import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getProperties } from '../lib/properties/repository.ts'
import sitemap, { STATIC_ROUTES } from './sitemap.ts'

test('covers every static route in every locale', async () => {
  const entries = await sitemap()
  const urls = new Set(entries.map((entry) => entry.url))

  assert.equal(urls.size, entries.length, 'the sitemap must not contain a duplicate URL')

  for (const route of STATIC_ROUTES) {
    assert.ok(urls.has(`https://solymarmenor.com${route === '/' ? '/' : route}`), `missing en entry for ${route}`)
    assert.ok(urls.has(`https://solymarmenor.com/de${route === '/' ? '' : route}`), `missing de entry for ${route}`)
    assert.ok(urls.has(`https://solymarmenor.com/es${route === '/' ? '' : route}`), `missing es entry for ${route}`)
  }
})

test('covers every published property in every locale', async () => {
  const entries = await sitemap()
  const urls = new Set(entries.map((entry) => entry.url))
  const properties = await getProperties()

  assert.ok(properties.length > 0, 'the fixture data must contain at least one published property')

  for (const property of properties) {
    assert.ok(urls.has(`https://solymarmenor.com/property/${property.slug}`))
    assert.ok(urls.has(`https://solymarmenor.com/de/property/${property.slug}`))
    assert.ok(urls.has(`https://solymarmenor.com/es/property/${property.slug}`))
  }
})

test('no entry points at a URL the proxy would redirect', async () => {
  // The old static sitemap listed /en/aboutus and six siblings. Under
  // localePrefix 'as-needed' every one of them 307s to the unprefixed URL,
  // so the sitemap was handing Google seven redirects.
  for (const entry of await sitemap()) {
    assert.ok(!/\/en(\/|$)/.test(entry.url), `${entry.url} would redirect`)
  }
})

test('every entry carries alternates for all locales plus x-default', async () => {
  for (const entry of await sitemap()) {
    assert.deepEqual(Object.keys(entry.alternates?.languages ?? {}).sort(), ['de', 'en', 'es', 'x-default'])
  }
})

test('property entries date from the property data, not from a constant', async () => {
  const entries = await sitemap()
  const properties = await getProperties()
  const first = properties[0]

  assert.ok(first, 'the fixture data must contain at least one published property')

  const entry = entries.find((candidate) => candidate.url.endsWith(`/property/${first.slug}`))

  assert.equal(entry?.lastModified, first.updatedAt)
})
