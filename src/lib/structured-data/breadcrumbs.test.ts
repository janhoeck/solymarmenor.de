import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildBreadcrumbs } from './breadcrumbs.ts'

const trail = [
  { name: 'Home', pathname: '/' },
  { name: 'Holiday home', pathname: '/property/fixture' },
]

test('numbers the trail from one', () => {
  const data = buildBreadcrumbs(trail, 'en')

  assert.equal(data['@type'], 'BreadcrumbList')
  assert.deepEqual(
    data.itemListElement.map((item) => item.position),
    [1, 2]
  )
})

test('resolves each item to an absolute URL in the given locale', () => {
  const data = buildBreadcrumbs(trail, 'de')

  assert.deepEqual(
    data.itemListElement.map((item) => item.item),
    ['https://solymarmenor.com/de', 'https://solymarmenor.com/de/property/fixture']
  )
})

test('omits the default locale prefix', () => {
  const data = buildBreadcrumbs(trail, 'en')

  assert.deepEqual(
    data.itemListElement.map((item) => item.item),
    ['https://solymarmenor.com/', 'https://solymarmenor.com/property/fixture']
  )
})

test('carries the names through', () => {
  const data = buildBreadcrumbs(trail, 'en')

  assert.deepEqual(
    data.itemListElement.map((item) => item.name),
    ['Home', 'Holiday home']
  )
})
