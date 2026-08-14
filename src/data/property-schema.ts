import { z } from 'zod'

import { ICON_TYPES } from '../types/IconType.ts'

/** Locales the site is translated into. `de` is the editorial language. */
export const LOCALES = ['de', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

/**
 * A translated string. Only `de` is mandatory so that additional locales can be
 * filled in field by field instead of all at once.
 */
export const translationMapSchema = z
  .object({
    de: z.string().min(1),
    en: z.string().min(1).optional(),
    es: z.string().min(1).optional(),
  })
  .strict()

export type TranslationMap = z.infer<typeof translationMapSchema>

const descriptionItemSchema = z.union([
  translationMapSchema,
  z
    .object({
      text: translationMapSchema.optional(),
      bulletpoints: z.array(translationMapSchema).min(1),
    })
    .strict(),
])

export const descriptionSchema = z.array(descriptionItemSchema)
export type Description = z.infer<typeof descriptionSchema>

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
    note: translationMapSchema.optional(),
  })
  .strict()

const locationSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: addressSchema,
    description: descriptionSchema,
  })
  .strict()

const propertyDetailSchema = z
  .object({
    type: iconTypeSchema,
    amount: z.number().int().positive(),
    title: translationMapSchema,
    subtitle: translationMapSchema,
  })
  .strict()

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
    checkIn: translationMapSchema,
    checkOut: translationMapSchema,
    rules: z.array(z.enum(['pet', 'party', 'smoking'])),
    description: descriptionSchema.optional(),
  })
  .strict()

const priceSchema = z
  .object({
    perNight: z.object({ offSeason: z.number().positive(), mainSeason: z.number().positive() }).strict(),
    cleaning: z.number().positive().optional(),
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
    /** Replaced by `calendar.secretRef` in task 5, together with the route and the component. */
    icalUrl: z.url().optional(),
    title: translationMapSchema,
    subtitle: translationMapSchema,
    description: descriptionSchema,
    price: priceSchema,
    location: locationSchema,
    imageSources: z.array(z.string().startsWith('/images/')).min(5),
    propertyDetails: z.array(propertyDetailSchema),
    amenities: amenitiesSchema,
    houseRules: houseRulesSchema,
  })
  .strict()

export type Property = z.infer<typeof propertySchema>
