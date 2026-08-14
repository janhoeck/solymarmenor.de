import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { properties } from './index.ts'

const DATA_DIR = path.dirname(fileURLToPath(import.meta.url))

/**
 * Property discovery is split: `index.ts` needs a hand-written import, while
 * `validate-content.mjs` and `images-sync.mjs` scan this directory. Comparing
 * the two is what catches a new JSON file whose import was forgotten — it would
 * validate in both scripts and never reach the site. A hard-coded count could
 * not see that, because the new file does not change it.
 */
test('every property file on disk is loaded by the index', () => {
  const onDisk = readdirSync(DATA_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''))
    .sort()

  const loaded = properties.map((property) => property.id).sort()

  assert.ok(onDisk.length > 0, 'no property JSON files found')
  // Both scripts derive the id from the file name, so the two must agree; a
  // mismatch here means either a missing import or a file named after something
  // other than its id.
  assert.deepEqual(loaded, onDisk)
})

test('every id is unique', () => {
  const ids = properties.map((property) => property.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('every slug is unique', () => {
  const slugs = properties.map((property) => property.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})

test('no property carries a calendar url in its data', () => {
  const serialized = JSON.stringify(properties)
  const match = serialized.match(/https?:\/\/[^"]*airbnb[^"]*/i)
  assert.equal(match, null, `calendar url leaked into the property data: ${match?.[0]}`)
})
