// Checks what the zod schema cannot see: malformed JSON, files on disk,
// cross-references and uniqueness across properties. Reads and validates the
// JSON files itself (rather than importing `src/data/properties/index.ts`,
// which throws on the first invalid file) so every problem — unparsable
// JSON, a schema violation, or something the schema cannot express — is
// reported as a readable message instead of a crash. Exits non-zero on any
// problem.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { propertySchema } from '../src/data/property-schema.ts'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const DATA_DIR = path.join(process.cwd(), 'src/data/properties')

// Mirrors the discovery in `images-sync.mjs` so both scripts agree on what a
// property is.
const PROPERTY_IDS = readdirSync(DATA_DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.replace(/\.json$/, ''))

const problems = []
const properties = []

for (const id of PROPERTY_IDS) {
  const fileName = `${id}.json`
  let raw

  try {
    raw = JSON.parse(readFileSync(path.join(DATA_DIR, fileName), 'utf-8'))
  } catch (error) {
    problems.push(`${fileName}: not valid JSON — ${error.message}`)
    continue
  }

  const result = propertySchema.safeParse(raw)

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path.length > 0 ? issue.path.join('.') : '(root)'
      problems.push(`${fileName}: ${field}: ${issue.message}`)
    }
    continue
  }

  properties.push(result.data)
}

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
