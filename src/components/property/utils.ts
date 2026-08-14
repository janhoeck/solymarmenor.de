import { ContentBlock } from '@/types/ContentBlock'
import type { Description, LocalizedText } from '@/data/property-schema'
import { resolveText } from '@/data/localized-text'

/**
 * Type guard to check if a content item is a simple TranslatedText.
 */
export function isTranslatedText(item: Description[number]): item is LocalizedText {
  return !('bulletpoints' in item)
}

export function convertDescription(locale: string, description: Description): ContentBlock {
  return description.map((item) => {
    if (isTranslatedText(item)) {
      return resolveText(item, locale)
    }

    return {
      text: item.text ? resolveText(item.text, locale) : undefined,
      bulletpoints: item.bulletpoints
        ? item.bulletpoints.map((bulletpoint) => resolveText(bulletpoint, locale))
        : [],
    }
  })
}
