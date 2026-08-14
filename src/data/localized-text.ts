import { z } from 'zod'

/** Locales the site is translated into. `de` is the editorial language. */
export const LOCALES = ['de', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

/** The locale content falls back to. Independent of `routing.defaultLocale`, which governs URLs. */
const FALLBACK_LOCALE: Locale = 'de'

/**
 * A translated string. Only `de` is mandatory, so additional locales can be
 * filled in field by field rather than all at once.
 */
export const localizedTextSchema = z
  .object({
    de: z.string().min(1),
    en: z.string().min(1).optional(),
    es: z.string().min(1).optional(),
  })
  .strict()

export type LocalizedText = z.infer<typeof localizedTextSchema>

/**
 * Resolves a localized string: requested locale, then german, then the first
 * value present. Always returns a non-empty string for schema-valid input.
 */
export function resolveText(text: LocalizedText, locale: string): string {
  const requested = (LOCALES as readonly string[]).includes(locale)
    ? text[locale as Locale]
    : undefined

  return requested ?? text[FALLBACK_LOCALE] ?? Object.values(text).find(Boolean) ?? ''
}
