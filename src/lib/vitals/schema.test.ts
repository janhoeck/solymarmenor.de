import assert from 'node:assert/strict'
import { test } from 'node:test'

import { vitalsPayloadSchema } from './schema.ts'

const valid = {
  metric: 'LCP',
  value: 1234.5,
  rating: 'good',
  path: '/de/property/apartment',
  locale: 'de',
  device: 'mobile',
  navigationType: 'navigate',
}

test('accepts a well-formed payload', () => {
  assert.equal(vitalsPayloadSchema.safeParse(valid).success, true)
})

test('accepts the root path', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, path: '/' }).success, true)
})

test('accepts every navigation type the bundled web-vitals can produce', () => {
  for (const navigationType of ['navigate', 'reload', 'back-forward', 'back-forward-cache', 'prerender', 'restore']) {
    assert.equal(vitalsPayloadSchema.safeParse({ ...valid, navigationType }).success, true, navigationType)
  }
})

test('rejects an unknown metric', () => {
  // FID was replaced by INP in 2024 and is not collected.
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'FID' }).success, false)
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'Next.js-hydration' }).success, false)
})

test('rejects an unknown locale', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, locale: 'fr' }).success, false)
})

test('rejects a path that is not a path', () => {
  const bad = [
    'relative',
    '/with space',
    '/query?a=1',
    '/frag#x',
    `/${'a'.repeat(300)}`,
    'https://evil.example/x',
    '//1234567890',
    '///x',
    '//',
  ]

  for (const path of bad) {
    assert.equal(vitalsPayloadSchema.safeParse({ ...valid, path }).success, false, path)
  }
})

test('rejects durations outside the plausible range', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, value: -1 }).success, false)
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, value: 60_001 }).success, false)
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, value: Number.NaN }).success, false)
})

test('bounds CLS separately, because it is unitless', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'CLS', value: 0.05 }).success, true)
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'CLS', value: 11 }).success, false)
  // 5000 is a plausible LCP but an impossible CLS; without the per-metric
  // bound this would pass on the shared 60000 ceiling.
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'CLS', value: 5000 }).success, false)
})

test('rejects unknown fields', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, ip: '1.2.3.4' }).success, false)
})
