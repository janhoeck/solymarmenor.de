import assert from 'node:assert/strict'
import { test } from 'node:test'

import { localizedTextSchema, resolveText } from './localized-text.ts'

test('returns the requested locale', () => {
  assert.equal(resolveText({ de: 'Hallo', en: 'Hello', es: 'Hola' }, 'es'), 'Hola')
})

test('falls back to german when the locale is missing', () => {
  assert.equal(resolveText({ de: 'Hallo' }, 'es'), 'Hallo')
})

test('falls back to german for an unknown locale', () => {
  assert.equal(resolveText({ de: 'Hallo', en: 'Hello' }, 'fr'), 'Hallo')
})

test('never returns an empty string for valid data', () => {
  assert.notEqual(resolveText({ de: 'Hallo' }, 'en'), '')
})

test('requires german', () => {
  assert.throws(() => localizedTextSchema.parse({ en: 'Hello' }))
})

test('rejects an empty german string', () => {
  assert.throws(() => localizedTextSchema.parse({ de: '' }))
})

test('rejects an unknown locale key', () => {
  assert.throws(() => localizedTextSchema.parse({ de: 'Hallo', fr: 'Bonjour' }))
})

test('accepts the inline markup the renderer supports', () => {
  assert.doesNotThrow(() =>
    localizedTextSchema.parse({ de: 'Ein <strong>wichtiger</strong> <em>Hinweis</em>.<br />Danach.' }),
  )
})

test('rejects a script tag', () => {
  assert.throws(() => localizedTextSchema.parse({ de: '<script>alert(1)</script>' }))
})

test('rejects an image tag', () => {
  assert.throws(() => localizedTextSchema.parse({ de: 'Bild <img src="x" onerror="alert(1)"> Ende' }))
})

test('rejects a link tag', () => {
  assert.throws(() => localizedTextSchema.parse({ de: 'Siehe <a href="https://example.com">hier</a>' }))
})

test('rejects an attribute-bearing variant of an allowed tag', () => {
  assert.throws(() => localizedTextSchema.parse({ de: '<strong onclick="alert(1)">Text</strong>' }))
})

test('rejects disallowed markup in a non-german locale', () => {
  assert.throws(() => localizedTextSchema.parse({ de: 'Hallo', en: '<script>alert(1)</script>' }))
})
