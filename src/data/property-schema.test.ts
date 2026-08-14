import assert from 'node:assert/strict'
import { test } from 'node:test'

import { propertySchema } from './property-schema.ts'

const validTranslation = { de: 'Titel', en: 'Title', es: 'Título' }

const validProperty = {
  schemaVersion: 2,
  id: 'apartment',
  slug: 'apartment',
  status: 'published',
  kind: 'apartment',
  updatedAt: '2026-08-14',
  calendar: { provider: 'airbnb', secretRef: 'ICAL_APARTMENT' },
  title: validTranslation,
  subtitle: validTranslation,
  description: [validTranslation],
  price: { perNight: { offSeason: 70, mainSeason: 85 }, cleaning: 85 },
  location: {
    lat: 37.75,
    lng: -0.84,
    address: {
      street: 'Calle Isla de Ibiza',
      houseNumber: '13',
      postalCode: '30710',
      city: 'Los Alcázares',
      country: 'ES',
    },
    description: [validTranslation],
  },
  imageSources: [
    '/images/apartment/coverPhoto.webp',
    '/images/apartment/photo1.webp',
    '/images/apartment/photo2.webp',
    '/images/apartment/photo3.webp',
    '/images/apartment/photo4.webp',
  ],
  propertyDetails: [{ type: 'bed', amount: 4, title: validTranslation, subtitle: validTranslation }],
  amenities: { general: ['parking'], kitchen: ['oven'] },
  houseRules: {
    checkIn: validTranslation,
    checkOut: validTranslation,
    rules: ['party', 'pet', 'smoking'],
  },
}

test('accepts a complete property', () => {
  const parsed = propertySchema.parse(validProperty)
  assert.equal(parsed.id, 'apartment')
  assert.equal(parsed.slug, 'apartment')
})

test('rejects an unknown top-level key', () => {
  assert.throws(() => propertySchema.parse({ ...validProperty, sauna: true }))
})

test('rejects a schemaVersion other than 2', () => {
  assert.throws(() => propertySchema.parse({ ...validProperty, schemaVersion: 1 }))
})

test('rejects an unknown status', () => {
  assert.throws(() => propertySchema.parse({ ...validProperty, status: 'archived' }))
})

test('rejects a country that is not an ISO alpha-2 code', () => {
  const property = structuredClone(validProperty)
  property.location.address.country = 'Spain'
  assert.throws(() => propertySchema.parse(property))
})

test('rejects an amenity that is not a known icon type', () => {
  const property = structuredClone(validProperty)
  property.amenities.general = ['teleporter']
  assert.throws(() => propertySchema.parse(property))
})

test('rejects a leftover address description field', () => {
  const property = structuredClone(validProperty)
  // `address` no longer has a `description` field (renamed to `note`); widen the
  // type locally so this negative test can still construct the stale v1 shape.
  ;(property.location.address as unknown as Record<string, unknown>).description = { de: 'Hinweis' }
  assert.throws(() => propertySchema.parse(property))
})

test('rejects a calendar that carries a url instead of a variable name', () => {
  assert.throws(() =>
    propertySchema.parse({
      ...validProperty,
      calendar: { provider: 'airbnb', secretRef: 'https://www.airbnb.de/calendar/ical/1.ics' },
    }),
  )
})

test('rejects a leftover icalUrl field', () => {
  assert.throws(() => propertySchema.parse({ ...validProperty, icalUrl: 'https://example.com' }))
})
