import { z } from 'zod'

import { ICON_TYPES } from '../types/IconType.ts'
import { HIGHLIGHT_KEYS } from './highlight-keys.ts'
import { localizedTextSchema } from './localized-text.ts'

export { type LocalizedText, localizedTextSchema, LOCALES, type Locale } from './localized-text.ts'

/**
 * A block of editorial content. Discriminated by `type` so new block kinds can
 * be added without touching existing data or breaking the renderer.
 */
export const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: localizedTextSchema }).strict(),
  z
    .object({
      type: z.literal('list'),
      intro: localizedTextSchema.optional(),
      items: z.array(localizedTextSchema).min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('note'),
      variant: z.enum(['info', 'warning']),
      text: localizedTextSchema,
    })
    .strict(),
])

export type PropertyContentBlock = z.infer<typeof contentBlockSchema>

export const contentBlocksSchema = z.array(contentBlockSchema).min(1)

/**
 * Icon identifiers rendered by `src/components/property/iconMapping.ts`.
 * `ICON_TYPES` is imported from `IconType.ts`, which is its source of truth, so
 * there is no second list that could drift out of sync with `IconType`.
 */
const iconTypeSchema = z.enum(ICON_TYPES)

const addressSchema = z
  .object({
    building: z.string().min(1).optional(),
    street: z.string().min(1),
    houseNumber: z.string().min(1),
    floorApartment: z.string().min(1).optional(),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    /** ISO 3166-1 alpha-2, uppercase. Rendered localized by the UI. */
    country: z.string().regex(/^[A-Z]{2}$/),
    /** Free-form hint about finding the address, e.g. a map correction. */
    note: localizedTextSchema.optional(),
  })
  .strict()

const locationSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: addressSchema,
    description: contentBlocksSchema,
  })
  .strict()

const highlightSchema = z
  .object({
    /** Carries the meaning; `icon` only carries the presentation. */
    key: z.enum(HIGHLIGHT_KEYS),
    icon: iconTypeSchema,
    value: z.number().int().positive(),
    unit: z.enum(['sqm']).optional(),
    label: localizedTextSchema,
    /** Only for values the UI cannot derive from `value` and `unit`. */
    caption: localizedTextSchema.optional(),
  })
  .strict()

export type PropertyHighlight = z.infer<typeof highlightSchema>

export const highlightsSchema = z
  .array(highlightSchema)
  .min(1)
  .refine((highlights) => new Set(highlights.map((highlight) => highlight.key)).size === highlights.length, {
    message: 'each highlight key may appear only once',
  })

const amenitiesSchema = z
  .object({
    general: z.array(iconTypeSchema).optional(),
    outdoorArea: z.array(iconTypeSchema).optional(),
    kitchen: z.array(iconTypeSchema).optional(),
    bedroom: z.array(iconTypeSchema).optional(),
    bathroom: z.array(iconTypeSchema).optional(),
    baby: z.array(iconTypeSchema).optional(),
  })
  .strict()

const houseRulesSchema = z
  .object({
    checkIn: localizedTextSchema,
    checkOut: localizedTextSchema,
    rules: z.array(z.enum(['pet', 'party', 'smoking'])),
    description: contentBlocksSchema.optional(),
  })
  .strict()

const priceSchema = z
  .object({
    perNight: z.object({ offSeason: z.number().positive(), mainSeason: z.number().positive() }).strict(),
    cleaning: z.number().positive().optional(),
  })
  .strict()

/**
 * Points at the name of an environment variable, never at its value, so the
 * calendar token never enters the data files or the client bundle.
 */
const calendarSchema = z
  .object({
    provider: z.literal('airbnb'),
    secretRef: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  })
  .strict()

const imageCategorySchema = z.enum([
  'exterior',
  'living',
  'bedroom',
  'kitchen',
  'bathroom',
  'outdoor',
  'pool',
  'surroundings',
])

const imageSchema = z
  .object({
    src: z.string().startsWith('/images/'),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    /** Optional; the UI falls back to the property title. */
    alt: localizedTextSchema.optional(),
    category: imageCategorySchema.optional(),
  })
  .strict()

export const imagesSchema = z
  .object({
    cover: imageSchema,
    /** At least four, because PropertyImageGrid renders four thumbnails next to the cover. */
    gallery: z.array(imageSchema).min(4),
  })
  .strict()

export const propertySchema = z
  .object({
    schemaVersion: z.literal(2),
    id: z.string().regex(/^[a-z0-9-]+$/),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    status: z.enum(['published', 'draft']),
    kind: z.enum(['apartment', 'house']),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    calendar: calendarSchema.optional(),
    title: localizedTextSchema,
    subtitle: localizedTextSchema,
    description: contentBlocksSchema,
    price: priceSchema,
    location: locationSchema,
    images: imagesSchema,
    highlights: highlightsSchema,
    amenities: amenitiesSchema,
    houseRules: houseRulesSchema,
  })
  .strict()

export type Property = z.infer<typeof propertySchema>
