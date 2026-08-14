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
    ['general', 'kitchen', 'outdoorArea'],
  )
})

// The rendered order changed silently once already. Pinning it here means any
// further reordering has to be a deliberate edit to this assertion.
test('renders the categories in the established order', () => {
  assert.deepEqual(
    [...AMENITY_CATEGORY_ORDER],
    ['general', 'kitchen', 'bathroom', 'outdoorArea', 'bedroom', 'baby'],
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
