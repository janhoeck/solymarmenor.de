import { properties } from '../../data/properties/index.ts'
import type { Property } from '../../data/property-schema.ts'

/**
 * The single seam between the app and the property data source. Everything else
 * goes through here, so swapping the JSON files for Postgres later changes this
 * file only. Async on purpose, even though nothing awaits yet.
 *
 * The filtering and sorting below happens inside each function call, not once at
 * module scope, so the future Postgres version can replace `selectPublished(properties)`
 * with an `await`ed query and keep the same function bodies otherwise.
 */

/**
 * Filters to published properties and sorts them by id. Pure and synchronous, so
 * it is trivial to test with synthetic input independent of the real data.
 */
export function selectPublished(all: Property[]): Property[] {
  return all.filter((property) => property.status === 'published').sort((a, b) => a.id.localeCompare(b.id))
}

export async function getProperties(): Promise<Property[]> {
  return selectPublished(properties)
}

export async function getPropertyBySlug(slug: string): Promise<Property | undefined> {
  return selectPublished(properties).find((property) => property.slug === slug)
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  return selectPublished(properties).find((property) => property.id === id)
}
