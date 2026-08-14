/** A yearly recurring period, given as `MM-DD` boundaries, both inclusive. */
export type SeasonPeriod = { from: string; to: string }

/**
 * Whether a date falls inside a yearly recurring period. Periods may wrap the
 * year end (e.g. 10-01 to 03-31), in which case the range is the union of
 * [from, 12-31] and [01-01, to].
 */
export function isDateInPeriod(period: SeasonPeriod, date: Date): boolean {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const current = `${month}-${day}`

  if (period.from <= period.to) {
    return current >= period.from && current <= period.to
  }

  return current >= period.from || current <= period.to
}
