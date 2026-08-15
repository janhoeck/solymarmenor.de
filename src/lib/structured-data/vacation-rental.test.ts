import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Property } from '../../data/property-schema.ts'
import { buildVacationRental } from './vacation-rental.ts'

const translation = { de: 'Text' }

const property: Property = {
  schemaVersion: 2,
  id: 'fixture',
  slug: 'fixture',
  status: 'published',
  kind: 'apartment',
  updatedAt: '2026-08-15',
  title: { de: 'Ferienhaus', en: 'Holiday home' },
  subtitle: translation,
  description: [{ type: 'paragraph', text: { de: 'Ein <strong>schönes</strong> Haus.' } }],
  pricing: {
    currency: 'EUR',
    rates: [
      { season: 'main', pricePerNight: 90, periods: [{ from: '04-01', to: '09-30' }] },
      { season: 'off', pricePerNight: 60, periods: [{ from: '10-01', to: '03-31' }] },
    ],
    fees: [],
    minNights: null,
  },
  location: {
    lat: 37.75,
    lng: -0.85,
    address: {
      street: 'Calle Mayor',
      houseNumber: '7',
      postalCode: '30710',
      city: 'Los Alcázares',
      country: 'ES',
    },
    description: [{ type: 'paragraph', text: translation }],
  },
  images: {
    cover: { src: '/images/fixture/cover.webp', width: 1600, height: 1200 },
    gallery: [
      { src: '/images/fixture/b.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/c.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/d.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/e.webp', width: 1600, height: 1067 },
    ],
  },
  highlights: [
    { key: 'guests', icon: 'group', value: 6, label: translation },
    { key: 'bedrooms', icon: 'bed', value: 3, label: translation },
    { key: 'bathrooms', icon: 'shower', value: 2, label: translation },
    { key: 'area', icon: 'area_size', value: 95, unit: 'sqm', label: translation },
  ],
  amenities: ['parking', 'pool'],
  houseRules: { checkInFrom: '15:00', checkOutUntil: '11:00', rules: ['pet', 'smoking'] },
}

test('describes the property as a VacationRental in the requested locale', () => {
  const data = buildVacationRental(property, 'en', ['Parking', 'Pool'])

  assert.equal(data['@context'], 'https://schema.org')
  assert.equal(data['@type'], 'VacationRental')
  assert.equal(data.name, 'Holiday home')
  assert.equal(data.url, 'https://solymarmenor.com/property/fixture')
})

test('uses the locale-prefixed URL for a non-default locale', () => {
  assert.equal(buildVacationRental(property, 'de', []).url, 'https://solymarmenor.com/de/property/fixture')
})

test('strips markup out of the description', () => {
  assert.equal(buildVacationRental(property, 'de', []).description, 'Ein schönes Haus.')
})

test('makes every image URL absolute', () => {
  const data = buildVacationRental(property, 'de', [])

  assert.equal(data.image.length, 5)
  assert.equal(data.image[0], 'https://solymarmenor.com/images/fixture/cover.webp')
  assert.ok(data.image.every((url) => url.startsWith('https://')))
})

test('maps the address and coordinates', () => {
  const data = buildVacationRental(property, 'de', [])

  assert.deepEqual(data.address, {
    '@type': 'PostalAddress',
    streetAddress: 'Calle Mayor 7',
    postalCode: '30710',
    addressLocality: 'Los Alcázares',
    addressCountry: 'ES',
  })
  assert.deepEqual(data.geo, { '@type': 'GeoCoordinates', latitude: 37.75, longitude: -0.85 })
})

test('reads occupancy, rooms and floor size out of the highlights', () => {
  const data = buildVacationRental(property, 'de', [])

  assert.equal(data.numberOfBedrooms, 3)
  assert.equal(data.numberOfBathroomsTotal, 2)
  assert.deepEqual(data.occupancy, { '@type': 'QuantitativeValue', maxValue: 6 })
  assert.deepEqual(data.floorSize, { '@type': 'QuantitativeValue', value: 95, unitCode: 'MTK' })
})

test('omits highlights the property does not carry', () => {
  const withoutRooms: Property = {
    ...property,
    highlights: [{ key: 'guests', icon: 'group', value: 2, label: translation }],
  }
  const data = buildVacationRental(withoutRooms, 'de', [])

  assert.ok(!('numberOfBedrooms' in data))
  assert.ok(!('floorSize' in data))
  assert.deepEqual(data.occupancy, { '@type': 'QuantitativeValue', maxValue: 2 })
})

test('inverts houseRules.rules, which lists what is forbidden', () => {
  // The translations settle the semantics: descriptions.pet reads
  // "Keine Haustiere erlaubt". Copying includes('pet') straight through would
  // publish the opposite of the truth.
  const data = buildVacationRental(property, 'de', [])

  assert.equal(data.petsAllowed, false)
  assert.equal(data.smokingAllowed, false)

  const permissive: Property = { ...property, houseRules: { ...property.houseRules, rules: [] } }
  const permissiveData = buildVacationRental(permissive, 'de', [])

  assert.equal(permissiveData.petsAllowed, true)
  assert.equal(permissiveData.smokingAllowed, true)
})

test('spans the price range across every season', () => {
  assert.equal(buildVacationRental(property, 'de', []).priceRange, '€60–€90')
})

test('lists the amenity names it was given', () => {
  const data = buildVacationRental(property, 'de', ['Parkmöglichkeit', 'Pool'])

  assert.deepEqual(data.amenityFeature, [
    { '@type': 'LocationFeatureSpecification', name: 'Parkmöglichkeit', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Pool', value: true },
  ])
})
