import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildSiteGraph } from './site.ts'

/**
 * The two graph nodes have different shapes, so indexing the array yields a
 * union and `node.publisher` would not type-check. Round-tripping through JSON
 * — which is exactly what `<JsonLd />` does before the markup reaches a crawler
 * — gives plain records to assert against, and incidentally proves the output
 * is serialisable.
 */
function nodesOf(locale: string): Record<string, unknown>[] {
  const graph = JSON.parse(JSON.stringify(buildSiteGraph(locale))) as {
    '@context': string
    '@graph': Record<string, unknown>[]
  }

  return graph['@graph']
}

test('emits a LodgingBusiness and a WebSite in one graph', () => {
  assert.equal(buildSiteGraph('de')['@context'], 'https://schema.org')
  assert.deepEqual(
    nodesOf('de').map((node) => node['@type']),
    ['LodgingBusiness', 'WebSite']
  )
})

test('uses the same @id as the guestbook markup, so both describe one entity', () => {
  // Task 16 emits '<BASE_URL>/#organization' too. If these ever drift apart,
  // the reviews stop attaching to the business this page describes.
  assert.equal(nodesOf('de')[0]?.['@id'], 'https://solymarmenor.com/#organization')
})

test('gives both nodes stable identifiers so they can reference each other', () => {
  const [organization, website] = nodesOf('de')

  assert.equal(organization?.['@id'], 'https://solymarmenor.com/#organization')
  assert.deepEqual(website?.publisher, { '@id': 'https://solymarmenor.com/#organization' })
})

test('points the WebSite at the requested locale', () => {
  assert.equal(nodesOf('de')[1]?.url, 'https://solymarmenor.com/de')
  assert.equal(nodesOf('en')[1]?.url, 'https://solymarmenor.com/')
})

test('declares the language of the variant', () => {
  assert.equal(nodesOf('es')[1]?.inLanguage, 'es')
})
