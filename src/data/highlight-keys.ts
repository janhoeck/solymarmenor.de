import type { IconType } from '../types/IconType.ts'

/** The facts shown as the summary row on a property page. */
export const HIGHLIGHT_KEYS = ['guests', 'bedrooms', 'beds', 'bathrooms', 'area'] as const
export type HighlightKey = (typeof HIGHLIGHT_KEYS)[number]

export const DEFAULT_HIGHLIGHT_ICONS = {
  guests: 'group',
  bedrooms: 'bed',
  beds: 'bed',
  bathrooms: 'bathtub',
  area: 'area_size',
} as const satisfies Record<HighlightKey, IconType>
