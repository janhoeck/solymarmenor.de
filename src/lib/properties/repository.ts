import { properties } from '../../data/properties/index.ts'
import type { Property } from '../../data/property-schema.ts'

/**
 * The single seam between the app and the property data source. Everything else
 * goes through here, so swapping the JSON files for Postgres later changes this
 * file only. Async on purpose, even though nothing awaits yet.
 */

const published = properties
  .filter((property) => property.status === 'published')
  .sort((a, b) => a.id.localeCompare(b.id))

export async function getProperties(): Promise<Property[]> {
  return published
}

export async function getPropertyBySlug(slug: string): Promise<Property | undefined> {
  return published.find((property) => property.slug === slug)
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  return published.find((property) => property.id === id)
}
