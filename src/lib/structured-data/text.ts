import { resolveText } from '../../data/localized-text.ts'
import type { PropertyContentBlock } from '../../data/property-schema.ts'

/**
 * Flattens editorial content blocks into the plain sentence JSON-LD wants.
 *
 * Only paragraphs contribute: a list rendered as running text reads as a
 * run-on sentence, and notes are interface furniture rather than description.
 *
 * The markup strip matters. `localized-text.ts` allows <strong>, <em> and <br>
 * in these texts, and a JSON-LD value is plain text — leaving the tags in
 * would put them verbatim into a search result. <br> becomes a space so two
 * sentences do not run together.
 */
export function plainText(blocks: PropertyContentBlock[], locale: string): string {
  return blocks
    .filter((block) => block.type === 'paragraph')
    .map((block) => resolveText(block.text, locale))
    .join(' ')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<\/?(?:strong|em)>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
