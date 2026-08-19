import assert from 'node:assert/strict'
import { test } from 'node:test'

import { BASE_URL } from './metadata.ts'
import { allRedirects, canonicalHostRedirects, legacyPropertyRedirects } from './redirects.ts'

test('matches the www host of the configured canonical origin', () => {
  const [rule] = canonicalHostRedirects()

  assert.deepEqual(rule?.has, [{ type: 'host', value: 'www.solymarmenor.com' }])
})

test('sends every path to the same path on the canonical origin', () => {
  const [rule] = canonicalHostRedirects()

  assert.equal(rule?.source, '/:path*')
  assert.equal(rule?.destination, 'https://solymarmenor.com/:path*')
})

test('the destination is absolute, since a relative one cannot change the host', () => {
  const [rule] = canonicalHostRedirects()

  assert.ok(rule?.destination.startsWith('https://'), `${rule?.destination} would keep the www host`)
})

test('the destination host is the canonical one and carries no www', () => {
  const [rule] = canonicalHostRedirects()
  const destinationHost = new URL(rule?.destination ?? '').host

  assert.equal(destinationHost, new URL(BASE_URL).host)
  assert.ok(!destinationHost.startsWith('www.'), 'the redirect would point back at itself')
})

test('every locale gets an expose rule, plus the prefixed default-locale form', () => {
  const sources = legacyPropertyRedirects()
    .map((rule) => rule.source)
    .sort()

  assert.deepEqual(sources, ['/de/expose/:slug', '/en/expose/:slug', '/es/expose/:slug', '/expose/:slug'])
})

test('the two URLs Search Console still reports impressions for are covered', () => {
  const rules = legacyPropertyRedirects()

  for (const [source, destination] of [
    ['/es/expose/:slug', '/es/property/:slug'],
    ['/de/expose/:slug', '/de/property/:slug'],
  ]) {
    assert.equal(rules.find((rule) => rule.source === source)?.destination, destination)
  }
})

test('both default-locale forms land on the unprefixed target', () => {
  const rules = legacyPropertyRedirects()

  // /en/property/:slug would be a second hop: the proxy 307s it to the
  // unprefixed URL. Both legacy forms have to reach the final target directly.
  assert.equal(rules.find((rule) => rule.source === '/expose/:slug')?.destination, '/property/:slug')
  assert.equal(rules.find((rule) => rule.source === '/en/expose/:slug')?.destination, '/property/:slug')
})

test('no expose destination points at a URL the proxy would redirect again', () => {
  for (const rule of legacyPropertyRedirects()) {
    assert.ok(!/\/en(\/|$)/.test(rule.destination), `${rule.destination} would redirect again`)
  }
})

test('every expose rule carries the slug through', () => {
  for (const rule of legacyPropertyRedirects()) {
    assert.ok(rule.source.endsWith('/expose/:slug'), `${rule.source} does not match the legacy shape`)
    assert.ok(rule.destination.endsWith('/property/:slug'), `${rule.destination} drops the slug`)
  }
})

test('every redirect is permanent, which is the whole point of them', () => {
  // Coolify's own direction setting emits permanent=false. A 302 tells Google
  // to keep the old URL indexed, which is the state these replace.
  for (const rule of allRedirects()) {
    assert.equal(rule.permanent, true, `${rule.source} is not permanent`)
  }
})

test('host normalisation is evaluated before the path rules', () => {
  const [first] = allRedirects()

  assert.deepEqual(first?.has, [{ type: 'host', value: 'www.solymarmenor.com' }])
})

test('no duplicate source, which Next would resolve by silently taking the first', () => {
  const sources = allRedirects().map((rule) => `${JSON.stringify(rule.has ?? null)} ${rule.source}`)

  assert.equal(new Set(sources).size, sources.length)
})
