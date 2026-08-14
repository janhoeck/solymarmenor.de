import assert from 'node:assert/strict'
import { test } from 'node:test'

import { properties } from './index.ts'

test('both property files satisfy the schema', () => {
  assert.equal(properties.length, 2)
})

test('every id is unique', () => {
  const ids = properties.map((property) => property.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('every slug is unique', () => {
  const slugs = properties.map((property) => property.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})
