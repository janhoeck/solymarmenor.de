import type { IconType } from '../types/IconType.ts'

/**
 * Display order of amenity categories. The identifiers match the existing
 * next-intl keys under `pages.property.equipmentFeaturesSection.subHeadlines`.
 */
export const AMENITY_CATEGORY_ORDER = [
  'general',
  'kitchen',
  'bathroom',
  'outdoorArea',
  'bedroom',
  'baby',
] as const

export type AmenityCategory = (typeof AMENITY_CATEGORY_ORDER)[number]

/**
 * Adding an amenity means one entry here plus one message key per locale.
 *
 * The keys double as icon identifiers: they are passed straight into
 * `iconMapping`, so every key must be an `IconType`. `Partial<Record<IconType,
 * …>>` states exactly that at compile time — a key that is not an icon fails
 * `pnpm check-types` — without demanding that every icon be an amenity. There
 * is no `icon` field, because it would only ever repeat the key.
 */
export const AMENITIES = {
  parking: { category: 'general' },
  air_conditioner: { category: 'general' },
  wlan: { category: 'general' },
  tv: { category: 'general' },
  barrier_free: { category: 'general' },
  elevator: { category: 'general' },
  fire_extinguisher: { category: 'general' },
  smoke_detector: { category: 'general' },
  vacuum: { category: 'general' },
  washing_rack: { category: 'general' },
  washing_machine: { category: 'general' },
  pool: { category: 'outdoorArea' },
  balcony: { category: 'outdoorArea' },
  terrace: { category: 'outdoorArea' },
  cooker: { category: 'kitchen' },
  oven: { category: 'kitchen' },
  dishes: { category: 'kitchen' },
  pots_pans: { category: 'kitchen' },
  coffee_machine: { category: 'kitchen' },
  microwave: { category: 'kitchen' },
  freezer: { category: 'kitchen' },
  refrigerator: { category: 'kitchen' },
  kettle: { category: 'kitchen' },
  bed_linen: { category: 'bedroom' },
  hairdryer: { category: 'bathroom' },
  towels: { category: 'bathroom' },
  shower: { category: 'bathroom' },
  bathtub: { category: 'bathroom' },
  baby_bed: { category: 'baby' },
  high_chair: { category: 'baby' },
} as const satisfies Partial<Record<IconType, { category: AmenityCategory }>>

export type AmenityKey = keyof typeof AMENITIES

/**
 * Cast to a non-empty tuple so `z.enum` infers the literal union rather than
 * `string` — without it, `Property['amenities']` degrades to `string[]` and
 * `groupAmenitiesByCategory` no longer accepts it.
 */
export const AMENITY_KEYS = Object.keys(AMENITIES) as [AmenityKey, ...AmenityKey[]]

/** Groups amenity keys by category, in display order, skipping empty categories. */
export function groupAmenitiesByCategory(
  keys: AmenityKey[],
): Array<{ category: AmenityCategory; keys: AmenityKey[] }> {
  return AMENITY_CATEGORY_ORDER.map((category) => ({
    category,
    keys: keys.filter((key) => AMENITIES[key].category === category),
  })).filter((group) => group.keys.length > 0)
}
