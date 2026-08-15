import { BASE_URL } from '../metadata.ts'

/**
 * Shared identity constants for the site's structured-data entity graph.
 *
 * `SITE_NAME` and `ORGANIZATION_ID` used to be independently derived in
 * site.ts, reviews.ts and the root layout. Three sources of truth for the
 * same string is how they drift — as happened with the business node's `url`,
 * which reviews.ts set to the guestbook page while site.ts set it to
 * `BASE_URL`, even though both describe the same `@id`.
 */
export const SITE_NAME = 'Sol y Mar Menor'

/** The `@id` shared by every node that represents the business itself. */
export const ORGANIZATION_ID = `${BASE_URL}/#organization`
