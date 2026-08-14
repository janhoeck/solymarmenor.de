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
 * A `<` that opens something tag-shaped: followed by a letter (`<script`), a
 * slash (`</div`), or `!` (`<!--`, `<!DOCTYPE`).
 *
 * A `<` followed by a space, a digit or the end of the string is ordinary
 * punctuation and must pass — these are marketing texts about prices, distances
 * and sizes, so "Preis < 100 €" and "< 5 Minuten zum Strand" are things the
 * owner may well write. Forbidding those, or demanding they be escaped as
 * `&lt;` inside a JSON file, would be worse than the problem this guard solves.
 *
 * Deliberately not a `/g` regex: `.test()` on a global pattern is stateful
 * across calls via `lastIndex`, which would make this return alternating
 * answers for the same input.
 */
const TAG_LIKE = /<[a-zA-Z/!]/

/**
 * Whether a string carries no markup beyond `ALLOWED_INLINE_MARKUP`. Removing
 * the allowed tags must leave nothing tag-shaped behind, so `<script>`,
 * `<img …>`, `<a href …>` and `</div>` are rejected while a literal `<` is not.
 */
function hasOnlyAllowedMarkup(value: string): boolean {
  return !TAG_LIKE.test(value.replace(ALLOWED_INLINE_MARKUP, ''))
}

const markupSafeString = z
  .string()
  .min(1)
  .refine(hasOnlyAllowedMarkup, {
    message:
      'only <strong>, <em> and <br> markup is allowed, without attributes; a literal "<" is fine when not followed by a letter, "/" or "!"',
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
