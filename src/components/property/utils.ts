import { ContentBlock } from '@/types/ContentBlock'
import { Description, DescriptionItem, TranslationMap } from '@/types/PropertyConfiguration'

/**
 * Type guard to check if a content item is a simple TranslatedText.
 */
export function isTranslatedText(item: DescriptionItem): item is TranslationMap {
  return !('bulletpoints' in item)
}

/**
 * Safely retrieves the translated string for the given locale.
 * Falls back to an empty string if the translation is missing.
 *
 * @param locale - The current locale (e.g., "de", "en", "es").
 * @param translatedText - The translation object.
 * @returns The text in the selected locale or an empty string.
 */
export function getTranslation(locale: string, translatedText: TranslationMap): string {
  return translatedText[locale as keyof TranslationMap] ?? ''
}

export function convertDescription(locale: string, description: Description): ContentBlock {
  return description.map((item) => {
    if (isTranslatedText(item)) {
      return getTranslation(locale, item)
    }

    return {
      text: item.text ? getTranslation(locale, item.text) : undefined,
      bulletpoints: item.bulletpoints
        ? item.bulletpoints.map((bulletpoint) => getTranslation(locale, bulletpoint))
        : [],
    }
  })
}
