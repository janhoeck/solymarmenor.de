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

test('collapses whitespace produced by <br> substitution', () => {
  const blocks: PropertyContentBlock[] = [
    { type: 'paragraph', text: { de: 'A <br> B' } },
    { type: 'paragraph', text: { de: 'C<br><br>D' } },
  ]

  // The <br> → space replacement would produce doubled spaces; the collapse
  // step is critical to avoid "A  B" when joining "A <br> B" with next block,
  // and to avoid "C  D" from the consecutive tags in the second block.
  assert.equal(plainText(blocks, 'de'), 'A B C D')
})

test('handles self-closing <br/> and <br /> spellings', () => {
  const blocks: PropertyContentBlock[] = [
    { type: 'paragraph', text: { de: 'Eins.<br/>Zwei.' } },
    { type: 'paragraph', text: { de: 'Drei.<br />Vier.' } },
  ]

  assert.equal(plainText(blocks, 'de'), 'Eins. Zwei. Drei. Vier.')
})

test('preserves literal < for markup-free comparison text', () => {
  const blocks: PropertyContentBlock[] = [{ type: 'paragraph', text: { de: 'Preis < 100 EUR.' } }]

  // localized-text.ts deliberately permits bare < in editorial copy for
  // comparisons like "Preis < 100 €" and "< 5 Minuten zum Strand", so the
  // markup strip must not corrupt these.
  assert.equal(plainText(blocks, 'de'), 'Preis < 100 EUR.')
})
