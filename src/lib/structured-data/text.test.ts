import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { PropertyContentBlock } from '../../data/property-schema.ts'
import { plainText } from './text.ts'

test('joins paragraph blocks in the requested locale', () => {
  const blocks: PropertyContentBlock[] = [
    { type: 'paragraph', text: { de: 'Erster Satz.', en: 'First sentence.' } },
    { type: 'paragraph', text: { de: 'Zweiter Satz.', en: 'Second sentence.' } },
  ]

  assert.equal(plainText(blocks, 'en'), 'First sentence. Second sentence.')
  assert.equal(plainText(blocks, 'de'), 'Erster Satz. Zweiter Satz.')
})

test('falls back to German for an untranslated locale', () => {
  const blocks: PropertyContentBlock[] = [{ type: 'paragraph', text: { de: 'Nur Deutsch.' } }]

  assert.equal(plainText(blocks, 'es'), 'Nur Deutsch.')
})

test('strips the inline markup the editorial texts are allowed to carry', () => {
  const blocks: PropertyContentBlock[] = [
    { type: 'paragraph', text: { de: 'Ein <strong>schönes</strong> Haus.<br>Mit <em>Pool</em>.' } },
  ]

  // JSON-LD values are plain text: markup left in place would be shown
  // verbatim in a search result.
  assert.equal(plainText(blocks, 'de'), 'Ein schönes Haus. Mit Pool.')
})

test('ignores list and note blocks', () => {
  const blocks: PropertyContentBlock[] = [
    { type: 'paragraph', text: { de: 'Beschreibung.' } },
    { type: 'list', items: [{ de: 'Punkt' }] },
    { type: 'note', variant: 'info', text: { de: 'Hinweis' } },
  ]

  assert.equal(plainText(blocks, 'de'), 'Beschreibung.')
})

test('returns an empty string when there is no paragraph', () => {
  assert.equal(plainText([{ type: 'list', items: [{ de: 'Punkt' }] }], 'de'), '')
})
