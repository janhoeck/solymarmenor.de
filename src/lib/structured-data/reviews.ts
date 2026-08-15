import type { GuestbookEntry } from '../../components/shared/GuestbookForm/types.ts'
import { BASE_URL } from '../metadata.ts'
import { ORGANIZATION_ID, SITE_NAME } from './identity.ts'

const BEST_RATING = 5
const WORST_RATING = 1

/**
 * Marks up the guestbook as reviews of the business.
 *
 * Two limits worth knowing before expecting anything of this:
 *
 * 1. The guestbook has no property association — `guestbook` in
 *    src/utils/db/schema.ts holds no property id — so the reviews belong to the
 *    site as a whole, not to the apartment or the house individually.
 * 2. Google has not shown star snippets for self-serving reviews (a business
 *    hosting reviews about itself) since 2019. This markup is valid and helps a
 *    consumer understand the entity, but it will not put stars in a search
 *    result. Anyone expecting otherwise will be disappointed.
 *
 * Returns null when there is nothing to report, so the caller renders no empty
 * AggregateRating — a rating of zero out of nothing is worse than silence.
 */
export function buildGuestbookRatings(entries: GuestbookEntry[]) {
  // `rating` defaults to 0 in the database, which is not a rating anyone gave.
  // Counting those as zero-star reviews would misreport the average.
  //
  // `name` and `message` are nullable columns (src/utils/db/schema.ts), laundered
  // into non-null by the `as GuestbookEntry` cast in the page. The form validates
  // `min(1)`, so live rows are fine, but a legacy or hand-inserted row with NULL
  // would otherwise emit `"name": null` or an empty `reviewBody` into JSON-LD.
  const rated = entries.filter(
    (entry) =>
      entry.rating >= WORST_RATING &&
      entry.rating <= BEST_RATING &&
      Boolean(entry.name?.trim()) &&
      Boolean(entry.message?.trim())
  )

  if (rated.length === 0) {
    return null
  }

  const average = rated.reduce((sum, entry) => sum + entry.rating, 0) / rated.length

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    // Same value as the LodgingBusiness node in site.ts, which shares this
    // @id — a consumer merging by @id must see one url, not one per page that
    // happens to render this entity.
    url: BASE_URL,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.round(average * 10) / 10,
      reviewCount: rated.length,
      bestRating: BEST_RATING,
      worstRating: WORST_RATING,
    },
    review: rated.map((entry) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: entry.name },
      // Date only: the time of day is noise in a review, and schema.org's
      // datePublished is documented as a date.
      datePublished: entry.created_at.slice(0, 10),
      reviewBody: entry.message,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: entry.rating,
        bestRating: BEST_RATING,
        worstRating: WORST_RATING,
      },
    })),
  }
}
