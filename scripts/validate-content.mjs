// Checks what the zod schema cannot see: files on disk, cross-references and
// uniqueness across properties. Exits non-zero on any problem.
import { existsSync } from 'node:fs'
import path from 'node:path'

import { AMENITIES } from '../src/data/amenities.ts'
import { properties } from '../src/data/properties/index.ts'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const problems = []

const slugs = new Set()
const ids = new Set()

for (const property of properties) {
  const where = `${property.id}`

  if (ids.has(property.id)) problems.push(`${where}: duplicate id`)
  if (slugs.has(property.slug)) problems.push(`${where}: duplicate slug "${property.slug}"`)
  ids.add(property.id)
  slugs.add(property.slug)

  for (const image of [property.images.cover, ...property.images.gallery]) {
    if (!existsSync(path.join(PUBLIC_DIR, image.src))) {
      problems.push(`${where}: image file missing — ${image.src}`)
    }
  }

  for (const key of property.amenities) {
    if (!(key in AMENITIES)) problems.push(`${where}: unknown amenity "${key}"`)
  }

  if (property.images.gallery.length < 4) {
    problems.push(`${where}: gallery needs at least 4 images for the grid`)
  }

  const seasons = property.pricing.rates.map((rate) => rate.season)
  if (new Set(seasons).size !== seasons.length) {
    problems.push(`${where}: duplicate season in pricing.rates`)
  }
}

if (problems.length > 0) {
  console.error('Content validation failed:')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log(`Content validation passed for ${properties.length} properties.`)
