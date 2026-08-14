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

/**
 * Localized month name for the `MM` part of an `MM-DD` boundary. Built on a
 * fixed year in UTC so the formatter can never shift into a neighbouring month.
 *
 * The first letter is upper-cased because these labels stand on their own next
 * to a price rather than inside a sentence: Spanish month names come out of
 * `Intl` lowercase, which would read as a typo beside the German and English
 * ones.
 */
function monthName(monthDay: string, locale: string): string {
  const monthIndex = Number(monthDay.slice(0, 2)) - 1
  const formatted = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2001, monthIndex, 1)),
  )

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * The month range a guest reads for a season, derived from the periods that
 * actually drive the price. Before this, the range was a hardcoded string in
 * each locale file, so editing the data left the displayed range silently wrong
 * — and one string served both properties, so per-property periods could never
 * be shown.
 *
 * Several periods are listed; no periods yield an empty string, which the UI
 * renders as no range at all rather than an empty dash.
 */
export function formatSeasonRange(periods: readonly SeasonPeriod[], locale: string): string {
  return periods
    .map((period) => {
      const from = monthName(period.from, locale)
      const to = monthName(period.to, locale)

      return from === to ? from : `${from} - ${to}`
    })
    .join(', ')
}
