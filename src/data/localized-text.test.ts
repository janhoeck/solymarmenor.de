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
