import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Property } from '../../data/property-schema.ts'
import { getProperties, getPropertyById, getPropertyBySlug, selectPublished } from './repository.ts'

const translation = { de: 'Text' }

/**
 * Minimal but schema-shaped property used to build synthetic input for
 * `selectPublished`, independent of the real JSON fixtures.
 */
const propertyFixture: Property = {
  schemaVersion: 2,
  id: 'fixture',
  slug: 'fixture',
  status: 'published',
  kind: 'apartment',
  updatedAt: '2026-08-14',
  title: translation,
  subtitle: translation,
  description: [{ type: 'paragraph', text: translation }],
  pricing: {
    currency: 'EUR',
    rates: [
      { season: 'main', pricePerNight: 1, periods: [{ from: '04-01', to: '09-30' }] },
      { season: 'off', pricePerNight: 1, periods: [{ from: '10-01', to: '03-31' }] },
    ],
    fees: [],
    minNights: null,
  },
  location: {
    lat: 0,
    lng: 0,
    address: {
      street: 'Street',
      houseNumber: '1',
      postalCode: '00000',
      city: 'City',
      country: 'ES',
    },
    description: [{ type: 'paragraph', text: translation }],
  },
  images: {
    cover: { src: '/images/fixture/a.webp', width: 1600, height: 1067 },
    gallery: [
      { src: '/images/fixture/b.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/c.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/d.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/e.webp', width: 1600, height: 1067 },
    ],
  },
  highlights: [{ key: 'guests', icon: 'group', value: 4, label: translation }],
  amenities: ['parking'],
  houseRules: { checkInFrom: '15:00', checkOutUntil: '11:00', rules: [] },
}

test('returns every published property', async () => {
  const result = await getProperties()
  assert.ok(result.length >= 1)
  assert.ok(result.every((property) => property.status === 'published'))
})

test('returns the same properties across repeated calls', async () => {
  const first = await getProperties()
  const second = await getProperties()
  assert.deepEqual(
    first.map((property) => property.id),
    second.map((property) => property.id)
  )
})

test('finds a property by slug', async () => {
  const result = await getPropertyBySlug('apartment')
  assert.equal(result?.id, 'apartment')
})

test('finds a property by id', async () => {
  const result = await getPropertyById('house')
  assert.equal(result?.id, 'house')
})

test('returns undefined for an unknown slug', async () => {
  assert.equal(await getPropertyBySlug('does-not-exist'), undefined)
})

test('selectPublished drops drafts and sorts the remainder by id', () => {
  const input: Property[] = [
    { ...propertyFixture, id: 'zebra', slug: 'zebra' },
    { ...propertyFixture, id: 'apple', slug: 'apple', status: 'draft' },
    { ...propertyFixture, id: 'mango', slug: 'mango' },
  ]

  const result = selectPublished(input)

  // Input is deliberately out of order (zebra before mango) and includes a
  // draft (apple) that must be excluded. If either the filter or the sort is
  // removed, this assertion fails: an unfiltered result would include 'apple',
  // and an unsorted result would keep insertion order ['zebra', 'mango'].
  assert.deepEqual(
    result.map((property) => property.id),
    ['mango', 'zebra']
  )
})
