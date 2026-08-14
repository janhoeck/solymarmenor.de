import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatSeasonRange, isDateInPeriod } from './pricing.ts'

test('matches a date inside a period within one year', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date(2026, 5, 15)), true)
})

test('rejects a date outside a period within one year', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date(2026, 10, 15)), false)
})

test('matches a date in a period that wraps the year end', () => {
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date(2026, 0, 15)), true)
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date(2026, 10, 15)), true)
})

test('rejects a date outside a wrapping period', () => {
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date(2026, 5, 15)), false)
})

test('includes both boundaries', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date(2026, 3, 1)), true)
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date(2026, 8, 30)), true)
})

// Dates are constructed with the local-time constructor (year, monthIndex, day)
// rather than an ISO string, so these boundary assertions don't depend on which
// timezone the test runner happens to use — an ISO string is parsed as UTC
// midnight, which would shift to the previous local day in timezones west of UTC.
test('includes both boundaries of a period that wraps the year end', () => {
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date(2026, 9, 1)), true)
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date(2026, 2, 31)), true)
})

test('excludes the days just outside a period that wraps the year end', () => {
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date(2026, 8, 30)), false)
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date(2026, 3, 1)), false)
})

// These are the ranges the two properties actually render today. They replaced
// hardcoded locale strings, so the assertions pin the equivalence.
const mainPeriods = [{ from: '04-01', to: '09-30' }]
const offPeriods = [{ from: '10-01', to: '03-31' }]

test('renders the main season range in every locale', () => {
  assert.equal(formatSeasonRange(mainPeriods, 'de'), 'April - September')
  assert.equal(formatSeasonRange(mainPeriods, 'en'), 'April - September')
  assert.equal(formatSeasonRange(mainPeriods, 'es'), 'Abril - Septiembre')
})

test('renders a wrapping off season range in every locale', () => {
  assert.equal(formatSeasonRange(offPeriods, 'de'), 'Oktober - März')
  assert.equal(formatSeasonRange(offPeriods, 'en'), 'October - March')
  assert.equal(formatSeasonRange(offPeriods, 'es'), 'Octubre - Marzo')
})

test('lists several periods', () => {
  assert.equal(
    formatSeasonRange([{ from: '04-01', to: '05-31' }, ...offPeriods], 'de'),
    'April - Mai, Oktober - März',
  )
})

test('names a single month once instead of repeating it', () => {
  assert.equal(formatSeasonRange([{ from: '08-01', to: '08-31' }], 'de'), 'August')
})

test('renders no range for a rate without periods', () => {
  assert.equal(formatSeasonRange([], 'de'), '')
})

test('falls back to a readable month name for an unknown locale', () => {
  assert.ok(formatSeasonRange(mainPeriods, 'fr').length > 0)
})
