import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isDateInPeriod } from './pricing.ts'

test('matches a date inside a period within one year', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date('2026-06-15')), true)
})

test('rejects a date outside a period within one year', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date('2026-11-15')), false)
})

test('matches a date in a period that wraps the year end', () => {
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date('2026-01-15')), true)
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date('2026-11-15')), true)
})

test('rejects a date outside a wrapping period', () => {
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date('2026-06-15')), false)
})

test('includes both boundaries', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date('2026-04-01')), true)
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date('2026-09-30')), true)
})
