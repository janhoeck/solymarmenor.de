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

// The guard blocks markup, not punctuation. These are marketing texts about
// prices, distances and sizes, so a bare less-than sign is ordinary prose and
// must not force the author to discover `&lt;` inside a JSON file.
test('accepts a less-than sign used as punctuation', () => {
  assert.doesNotThrow(() => localizedTextSchema.parse({ de: 'Preis < 100 €' }))
  assert.doesNotThrow(() => localizedTextSchema.parse({ de: '< 5 Minuten zum Strand' }))
})

test('accepts a less-than sign directly before a digit or at the end', () => {
  assert.doesNotThrow(() => localizedTextSchema.parse({ de: 'Kinder <12 Jahre' }))
  assert.doesNotThrow(() => localizedTextSchema.parse({ de: 'Zeichen am Ende <' }))
})

test('accepts punctuation and allowed markup in the same string', () => {
  assert.doesNotThrow(() =>
    localizedTextSchema.parse({ de: '<strong>Preis < 100 €</strong><br />Nur diese Woche.' }),
  )
})

test('still rejects a tag-shaped less-than sign', () => {
  assert.throws(() => localizedTextSchema.parse({ de: '<script>' }))
  assert.throws(() => localizedTextSchema.parse({ de: '<img src=x>' }))
  assert.throws(() => localizedTextSchema.parse({ de: '</div>' }))
})

test('rejects an html comment and a doctype', () => {
  assert.throws(() => localizedTextSchema.parse({ de: 'Text <!-- versteckt --> Ende' }))
  assert.throws(() => localizedTextSchema.parse({ de: '<!DOCTYPE html>' }))
})
