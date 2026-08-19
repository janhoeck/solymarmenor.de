import assert from 'node:assert/strict'
import { test } from 'node:test'

import { BASE_URL } from './metadata.ts'
import { canonicalHostRedirects } from './redirects.ts'

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

test('the redirect is permanent, which is the whole point of it', () => {
  // Coolify's own direction setting emits permanent=false. A 302 tells Google
  // to keep the www URL indexed, which is the state this replaces.
  for (const rule of canonicalHostRedirects()) {
    assert.equal(rule.permanent, true)
  }
})

test('the destination host is the canonical one and carries no www', () => {
  const [rule] = canonicalHostRedirects()
  const destinationHost = new URL(rule?.destination ?? '').host

  assert.equal(destinationHost, new URL(BASE_URL).host)
  assert.ok(!destinationHost.startsWith('www.'), 'the redirect would point back at itself')
})
