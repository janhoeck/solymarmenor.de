import assert from 'node:assert/strict'
import { test } from 'node:test'

import { AMENITIES, AMENITY_CATEGORY_ORDER, groupAmenitiesByCategory } from './amenities.ts'

test('every amenity has a known category', () => {
  for (const [key, entry] of Object.entries(AMENITIES)) {
    assert.ok(
      (AMENITY_CATEGORY_ORDER as readonly string[]).includes(entry.category),
      `${key} has unknown category ${entry.category}`,
    )
  }
})

test('groups amenities in category order', () => {
  const grouped = groupAmenitiesByCategory(['oven', 'parking', 'pool'])
  assert.deepEqual(
    grouped.map((group) => group.category),
    ['general', 'outdoorArea', 'kitchen'],
  )
})

test('omits categories without amenities', () => {
  const grouped = groupAmenitiesByCategory(['parking'])
  assert.equal(grouped.length, 1)
  assert.deepEqual(grouped[0]?.keys, ['parking'])
})

test('returns nothing for an empty list', () => {
  assert.deepEqual(groupAmenitiesByCategory([]), [])
})
