/**
 * Single source of truth for the set of icon identifiers used across the site.
 * `IconType` is derived from this array so the two can never drift apart —
 * unlike a hand-maintained union type mirrored by a separate array, there is
 * nothing left to keep in sync.
 *
 * Kept free of imports and side effects: `src/data/property-schema.ts` imports
 * this file and must stay loadable under `node --test --experimental-strip-types`.
 */
export const ICON_TYPES = [
  'area_size',
  'group',
  'pool',
  'parking',
  'air_conditioner',
  'wlan',
  'tv',
  'barrier_free',
  'elevator',
  'refrigerator',
  'freezer',
  'cooker',
  'oven',
  'microwave',
  'coffee_machine',
  'pots_pans',
  'dishes',
  'bed_linen',
  'shower',
  'bathtub',
  'hairdryer',
  'towels',
  'vacuum',
  'washing_machine',
  'washing_rack',
  'baby_bed',
  'bed',
  'high_chair',
  'terrace',
  'balcony',
  'fire_extinguisher',
  'smoke_detector',
  'kettle',
  'pet',
  'party',
  'smoking',
  'checkin',
  'checkout',
] as const

export type IconType = (typeof ICON_TYPES)[number]
