import type { IconType } from '../types/IconType.ts'

/**
 * Display order of amenity categories. The identifiers match the existing
 * next-intl keys under `pages.property.equipmentFeaturesSection.subHeadlines`.
 */
export const AMENITY_CATEGORY_ORDER = [
  'general',
  'outdoorArea',
  'kitchen',
  'bedroom',
  'bathroom',
  'baby',
] as const

export type AmenityCategory = (typeof AMENITY_CATEGORY_ORDER)[number]

/** Adding an amenity means one entry here plus one message key per locale. */
export const AMENITIES = {
  parking: { category: 'general', icon: 'parking' },
  air_conditioner: { category: 'general', icon: 'air_conditioner' },
  wlan: { category: 'general', icon: 'wlan' },
  tv: { category: 'general', icon: 'tv' },
  barrier_free: { category: 'general', icon: 'barrier_free' },
  elevator: { category: 'general', icon: 'elevator' },
  fire_extinguisher: { category: 'general', icon: 'fire_extinguisher' },
  smoke_detector: { category: 'general', icon: 'smoke_detector' },
  vacuum: { category: 'general', icon: 'vacuum' },
  washing_rack: { category: 'general', icon: 'washing_rack' },
  washing_machine: { category: 'general', icon: 'washing_machine' },
  pool: { category: 'outdoorArea', icon: 'pool' },
  balcony: { category: 'outdoorArea', icon: 'balcony' },
  terrace: { category: 'outdoorArea', icon: 'terrace' },
  cooker: { category: 'kitchen', icon: 'cooker' },
  oven: { category: 'kitchen', icon: 'oven' },
  dishes: { category: 'kitchen', icon: 'dishes' },
  pots_pans: { category: 'kitchen', icon: 'pots_pans' },
  coffee_machine: { category: 'kitchen', icon: 'coffee_machine' },
  microwave: { category: 'kitchen', icon: 'microwave' },
  freezer: { category: 'kitchen', icon: 'freezer' },
  refrigerator: { category: 'kitchen', icon: 'refrigerator' },
  kettle: { category: 'kitchen', icon: 'kettle' },
  bed_linen: { category: 'bedroom', icon: 'bed_linen' },
  hairdryer: { category: 'bathroom', icon: 'hairdryer' },
  towels: { category: 'bathroom', icon: 'towels' },
  shower: { category: 'bathroom', icon: 'shower' },
  bathtub: { category: 'bathroom', icon: 'bathtub' },
  baby_bed: { category: 'baby', icon: 'baby_bed' },
  high_chair: { category: 'baby', icon: 'high_chair' },
} as const satisfies Record<string, { category: AmenityCategory; icon: IconType }>

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
