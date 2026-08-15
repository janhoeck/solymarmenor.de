import { BASE_URL, absoluteUrl, localizedPathname } from '../metadata.ts'

const SITE_NAME = 'Sol y Mar Menor'

/**
 * The site-level entity graph.
 *
 * Both nodes carry an `@id` so the WebSite can point its publisher at the
 * business node instead of repeating it — that is what tells a consumer the
 * two describe one thing rather than two, and it is the same @id the guestbook
 * markup in reviews.ts uses.
 *
 * No `potentialAction`/SearchAction: the site has no search, and claiming one
 * that does not exist is the kind of markup that gets a site's structured data
 * distrusted wholesale.
 */
export function buildSiteGraph(locale: string) {
  const organizationId = `${BASE_URL}/#organization`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // LodgingBusiness, not Organization: Task 16 marks up the same @id on
        // the guestbook page, and one identifier carrying two different types
        // across pages is what makes a consumer distrust the whole graph.
        // LodgingBusiness is a subtype of Organization, so WebSite.publisher
        // still accepts it, and it is the more accurate type for a holiday let.
        //
        // No `logo`: schema.org means an actual logo there, and this project has
        // none — src/components/shared/Logo/Logo.tsx draws a CSS circle with the
        // letters SM, not an image file. `image` takes a photo of the business
        // honestly; an omitted optional field beats a wrong one.
        '@type': 'LodgingBusiness',
        '@id': organizationId,
        name: SITE_NAME,
        url: BASE_URL,
        image: absoluteUrl('/og/default.jpg'),
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        name: SITE_NAME,
        url: absoluteUrl(localizedPathname('/', locale)),
        inLanguage: locale,
        publisher: { '@id': organizationId },
      },
    ],
  }
}
