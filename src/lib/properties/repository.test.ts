import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getProperties, getPropertyById, getPropertyBySlug } from './repository.ts'

test('returns every published property', async () => {
  const result = await getProperties()
  assert.ok(result.length >= 1)
  assert.ok(result.every((property) => property.status === 'published'))
})

test('returns properties in a stable order', async () => {
  const first = await getProperties()
  const second = await getProperties()
  assert.deepEqual(
    first.map((property) => property.id),
    second.map((property) => property.id),
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
