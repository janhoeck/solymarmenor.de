import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { GuestbookEntry } from '../../components/shared/GuestbookForm/types.ts'
import { buildGuestbookRatings } from './reviews.ts'

const entries: GuestbookEntry[] = [
  { id: 1, name: 'Anna', message: 'Wunderbar.', rating: 5, created_at: '2026-07-01T10:00:00.000Z' },
  { id: 2, name: 'Ben', message: 'Sehr schön.', rating: 4, created_at: '2026-07-02T10:00:00.000Z' },
  { id: 3, name: 'Cara', message: 'Gut.', rating: 3, created_at: '2026-07-03T10:00:00.000Z' },
]

const unrated: GuestbookEntry = {
  id: 4,
  name: 'Dan',
  message: 'Hallo.',
  rating: 0,
  created_at: '2026-07-04T10:00:00.000Z',
}

/** Narrows away the null return so each test can assert on the payload. */
function ratingsOf(input: GuestbookEntry[]) {
  const data = buildGuestbookRatings(input, 'de')
  assert.ok(data, 'expected ratings for this input')

  return data
}

test('averages the ratings and counts them', () => {
  const { aggregateRating } = ratingsOf(entries)

  assert.equal(aggregateRating['@type'], 'AggregateRating')
  assert.equal(aggregateRating.ratingValue, 4)
  assert.equal(aggregateRating.reviewCount, 3)
  assert.equal(aggregateRating.bestRating, 5)
  assert.equal(aggregateRating.worstRating, 1)
})

test('rounds the average to one decimal', () => {
  const fourth: GuestbookEntry = {
    id: 4,
    name: 'Eve',
    message: 'Top.',
    rating: 5,
    created_at: '2026-07-04T10:00:00.000Z',
  }

  // (5 + 4 + 3 + 5) / 4 = 4.25
  assert.equal(ratingsOf([...entries, fourth]).aggregateRating.ratingValue, 4.3)
})

test('maps each entry to a Review', () => {
  const { review } = ratingsOf(entries)

  assert.equal(review.length, 3)
  assert.deepEqual(review[0], {
    '@type': 'Review',
    author: { '@type': 'Person', name: 'Anna' },
    datePublished: '2026-07-01',
    reviewBody: 'Wunderbar.',
    reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5, worstRating: 1 },
  })
})

test('skips entries without a rating, which would drag the average down', () => {
  // `rating` defaults to 0 in the database; treating that as a zero-star review
  // would misreport the average as 3.
  const { aggregateRating } = ratingsOf([...entries, unrated])

  assert.equal(aggregateRating.reviewCount, 3)
  assert.equal(aggregateRating.ratingValue, 4)
})

test('returns null when there is nothing to aggregate', () => {
  assert.equal(buildGuestbookRatings([], 'de'), null)
  assert.equal(buildGuestbookRatings([unrated], 'de'), null)
})

// Pinned separately from the tests above: earlier passes of this plan tested
// the aggregate math but never pinned the three fields that make the markup
// attach to the right entity. A wrong '@id' here means the reviews describe
// nothing; a wrong '@type' on the right '@id' means a crawler that already
// saw LodgingBusiness at this '@id' (site.ts, Task 15) distrusts the graph.
test('identifies the same LodgingBusiness node Task 15 emits on the home page', () => {
  const data = ratingsOf(entries)

  assert.equal(data['@context'], 'https://schema.org')
  assert.equal(data['@type'], 'LodgingBusiness')
  assert.equal(data['@id'], 'https://solymarmenor.com/#organization')
})
