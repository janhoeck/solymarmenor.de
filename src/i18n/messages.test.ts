import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const LOCALES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public/locales')
const LOCALES = ['de', 'en', 'es'] as const

function readMessages(locale: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(LOCALES_DIR, `${locale}.json`), 'utf-8'))
}

/** Reads a dotted message path, returning undefined for any missing segment. */
function messageAt(messages: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) return undefined
    return (current as Record<string, unknown>)[segment]
  }, messages)
}

/**
 * The note block's "important note" prefix was removed from the visible text
 * because the block carries a coloured left border. That made the signal purely
 * visual, so the label moved into `role="note"` + `aria-label`.
 *
 * A missing message is invisible in exactly the way the original regression was:
 * next-intl renders the key itself rather than throwing, so the page still looks
 * right to a sighted reader while a screen reader announces the raw key.
 */
test('note blocks still announce themselves to a screen reader in every language', () => {
  const key = 'pages.property.content.noteLabel'

  for (const locale of LOCALES) {
    const label = messageAt(readMessages(locale), key)

    assert.equal(
      typeof label,
      'string',
      `${locale}.json is missing ${key}, so note blocks lose their accessible name`,
    )
    assert.ok((label as string).trim().length > 0, `${locale}.json has an empty ${key}`)
  }
})
