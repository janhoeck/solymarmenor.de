import assert from 'node:assert/strict'
import { test } from 'node:test'

import { contentBlockSchema, highlightsSchema, imagesSchema, propertySchema } from './property-schema.ts'

const validTranslation = { de: 'Titel', en: 'Title', es: 'Título' }
const validImage = { src: '/images/apartment/coverPhoto.webp', width: 1600, height: 1067 }

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
  description: [{ type: 'paragraph', text: validTranslation }],
  pricing: {
    currency: 'EUR',
    rates: [
      { season: 'main', pricePerNight: 85, periods: [{ from: '04-01', to: '09-30' }] },
      { season: 'off', pricePerNight: 70, periods: [{ from: '10-01', to: '03-31' }] },
    ],
    fees: [{ type: 'cleaning', amount: 85, basis: 'perStay' }],
    minNights: null,
  },
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
    description: [{ type: 'paragraph', text: validTranslation }],
  },
  images: { cover: validImage, gallery: Array.from({ length: 4 }, () => validImage) },
  highlights: [{ key: 'guests', icon: 'group', value: 4, label: validTranslation }],
  amenities: ['parking', 'oven'],
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

test('rejects an amenity that is not a known amenity key', () => {
  const property = structuredClone(validProperty)
  property.amenities = ['teleporter']
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

test('accepts a paragraph block', () => {
  const block = contentBlockSchema.parse({ type: 'paragraph', text: { de: 'Text' } })
  assert.equal(block.type, 'paragraph')
})

test('accepts a list block with an intro', () => {
  const block = contentBlockSchema.parse({
    type: 'list',
    intro: { de: 'Einleitung' },
    items: [{ de: 'Erster Punkt' }],
  })
  assert.equal(block.type, 'list')
})

test('accepts a list block without an intro', () => {
  assert.doesNotThrow(() => contentBlockSchema.parse({ type: 'list', items: [{ de: 'Punkt' }] }))
})

test('rejects a list block without items', () => {
  assert.throws(() => contentBlockSchema.parse({ type: 'list', items: [] }))
})

test('accepts a note block', () => {
  const block = contentBlockSchema.parse({
    type: 'note',
    variant: 'warning',
    text: { de: 'Haustiere sind nicht gestattet.' },
  })
  assert.equal(block.type, 'note')
})

test('rejects a block without a type', () => {
  assert.throws(() => contentBlockSchema.parse({ text: { de: 'Text' } }))
})

test('rejects an unknown block type', () => {
  assert.throws(() => contentBlockSchema.parse({ type: 'video', text: { de: 'Text' } }))
})

test('accepts images with a cover and a gallery', () => {
  const parsed = imagesSchema.parse({ cover: validImage, gallery: Array.from({ length: 4 }, () => validImage) })
  assert.equal(parsed.cover.width, 1600)
})

test('rejects a source outside the images directory', () => {
  assert.throws(() => imagesSchema.parse({ cover: { ...validImage, src: '/other/x.webp' }, gallery: [] }))
})

test('rejects a non-positive dimension', () => {
  assert.throws(() => imagesSchema.parse({ cover: { ...validImage, width: 0 }, gallery: [] }))
})

test('requires at least four gallery images for the grid', () => {
  assert.throws(() => imagesSchema.parse({ cover: validImage, gallery: [validImage] }))
})

test('accepts an optional alt text and category', () => {
  assert.doesNotThrow(() =>
    imagesSchema.parse({
      cover: validImage,
      gallery: Array.from({ length: 4 }, () => ({
        ...validImage,
        alt: { de: 'Wohnzimmer' },
        category: 'living',
      })),
    }),
  )
})

const guests = { key: 'guests', icon: 'group', value: 4, label: { de: 'Gäste' } }

test('accepts a highlight', () => {
  assert.equal(highlightsSchema.parse([guests])[0]?.value, 4)
})

test('accepts a highlight with a unit', () => {
  assert.doesNotThrow(() =>
    highlightsSchema.parse([{ key: 'area', icon: 'area_size', value: 95, unit: 'sqm', label: { de: 'Fläche' } }]),
  )
})

test('rejects an unknown highlight key', () => {
  assert.throws(() => highlightsSchema.parse([{ ...guests, key: 'sauna' }]))
})

test('rejects a duplicated highlight key', () => {
  assert.throws(() => highlightsSchema.parse([guests, guests]))
})

test('rejects a zero value', () => {
  assert.throws(() => highlightsSchema.parse([{ ...guests, value: 0 }]))
})
