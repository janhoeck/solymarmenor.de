// Checks what the zod schema cannot see: malformed JSON, files on disk,
// cross-references and uniqueness across properties. Reads and validates the
// JSON files itself (rather than importing `src/data/properties/index.ts`,
// which throws on the first invalid file) so every problem — unparsable
// JSON, a schema violation, or something the schema cannot express — is
// reported as a readable message instead of a crash. Exits non-zero on any
// problem.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { isDateInPeriod } from '../src/data/pricing.ts'
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

/**
 * A non-leap year, so 02-29 is not walked. A period ending on 02-29 still covers
 * 02-28 here, and a gap of exactly that one day is not something the schema can
 * express anyway.
 */
const COVERAGE_YEAR = 2027

/** `MM-DD` label for a day of `COVERAGE_YEAR`, for readable messages. */
function labelOf(date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

/** Collapses consecutive day labels into `from..to` ranges. */
function toRanges(labels) {
  const ranges = []

  for (const label of labels) {
    const last = ranges.at(-1)
    if (last && last.endIndex === label.index - 1) {
      last.to = label.value
      last.endIndex = label.index
    } else {
      ranges.push({ from: label.value, to: label.value, endIndex: label.index })
    }
  }

  return ranges.map((range) => (range.from === range.to ? range.from : `${range.from}..${range.to}`))
}

/**
 * Every day of the year must be priced by exactly one rate period. A gap leaves
 * the "current price" badge unset, and an overlap makes two seasons claim the
 * same day — neither is visible in the data or caught by the schema, which can
 * only see one period at a time.
 */
function checkRatePeriodCoverage(property, report) {
  const uncovered = []
  const overlapping = new Map()
  const date = new Date(COVERAGE_YEAR, 0, 1)

  for (let index = 0; date.getFullYear() === COVERAGE_YEAR; index += 1) {
    const matches = property.pricing.rates.flatMap((rate) =>
      rate.periods.filter((period) => isDateInPeriod(period, date)).map(() => rate.season),
    )

    if (matches.length === 0) {
      uncovered.push({ value: labelOf(date), index })
    } else if (matches.length > 1) {
      const seasons = matches.join(', ')
      const days = overlapping.get(seasons) ?? []
      days.push({ value: labelOf(date), index })
      overlapping.set(seasons, days)
    }

    date.setDate(date.getDate() + 1)
  }

  if (uncovered.length > 0) {
    report(`no rate period covers: ${toRanges(uncovered).join(', ')}`)
  }

  for (const [seasons, days] of overlapping) {
    report(`covered by more than one rate period (${seasons}): ${toRanges(days).join(', ')}`)
  }
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

  checkRatePeriodCoverage(property, (message) => problems.push(`${where}: ${message}`))
}

if (problems.length > 0) {
  console.error('Content validation failed:')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log(`Content validation passed for ${properties.length} properties.`)
