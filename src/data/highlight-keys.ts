/**
 * The facts shown as the summary row on a property page. `propertySchema`
 * builds its `highlights[].key` enum from this array, so it is the only list.
 *
 * There is deliberately no default key-to-icon mapping here: `icon` is
 * mandatory on every highlight, so a default could never apply, and a second
 * copy of the mapping would only be able to drift from the data.
 */
export const HIGHLIGHT_KEYS = ['guests', 'bedrooms', 'beds', 'bathrooms', 'area'] as const
