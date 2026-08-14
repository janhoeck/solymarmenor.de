import { z } from 'zod'

/** Locales the site is translated into. `de` is the editorial language. */
export const LOCALES = ['de', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

/**
 * The locale content falls back to. Independent of `routing.defaultLocale`,
 * which governs URLs. Kept as a literal rather than annotated `Locale`, so
 * `text[FALLBACK_LOCALE]` is the required `de` field and stays a plain `string`.
 */
const FALLBACK_LOCALE = 'de' as const satisfies Locale

/**
 * The inline markup a localized string may carry. `PropertyContent` renders
 * these texts through `dangerouslySetInnerHTML` so the editorial texts can use
 * emphasis and line breaks, which only holds while the markup is limited to
 * this set. Attribute-bearing variants are not matched on purpose: `<strong>`
 * passes, `<strong onclick="…">` does not.
 */
const ALLOWED_INLINE_MARKUP = /<(?:\/?(?:strong|em)|br\s*\/?)>/g

/**
 * Whether a string carries no markup beyond `ALLOWED_INLINE_MARKUP`. Removing
 * the allowed tags must leave no `<` behind — anything else, including
 * `<script>`, `<img …>` and `<a href …>`, is rejected.
 */
function hasOnlyAllowedMarkup(value: string): boolean {
  return !value.replace(ALLOWED_INLINE_MARKUP, '').includes('<')
}

const markupSafeString = z
  .string()
  .min(1)
  .refine(hasOnlyAllowedMarkup, {
    message: 'only <strong>, <em> and <br> markup is allowed, without attributes',
  })

/**
 * A translated string. Only `de` is mandatory, so additional locales can be
 * filled in field by field rather than all at once.
 *
 * The markup restriction is enforced here rather than at the render site, so it
 * survives the planned move of this content into Postgres — where the same
 * database also holds rows written by an unauthenticated public form.
 */
export const localizedTextSchema = z
  .object({
    de: markupSafeString,
    en: markupSafeString.optional(),
    es: markupSafeString.optional(),
  })
  .strict()

export type LocalizedText = z.infer<typeof localizedTextSchema>

/**
 * Resolves a localized string: the requested locale, otherwise German. An
 * unknown locale, or one this text has not been translated into yet, falls back
 * the same way. `de` is required and non-empty on `LocalizedText`, so the result
 * is always a non-empty string — no further fallback can ever be reached.
 */
export function resolveText(text: LocalizedText, locale: string): string {
  const requested = (LOCALES as readonly string[]).includes(locale)
    ? text[locale as Locale]
    : undefined

  return requested ?? text[FALLBACK_LOCALE]
}
