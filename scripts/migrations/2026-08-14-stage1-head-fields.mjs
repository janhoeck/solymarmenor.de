// One-off: moves the v1 configs into src/data/properties and adds the v2 head fields.
// Run once, then delete (task 16).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const SOURCE_DIR = path.join(process.cwd(), 'public/propertyConfigs')
const TARGET_DIR = path.join(process.cwd(), 'src/data/properties')
const UPDATED_AT = '2026-08-14'

const KIND_BY_ID = { apartment: 'apartment', house: 'house' }

mkdirSync(TARGET_DIR, { recursive: true })

for (const id of Object.keys(KIND_BY_ID)) {
  const source = JSON.parse(readFileSync(path.join(SOURCE_DIR, `${id}.json`), 'utf-8'))
  const { location, ...rest } = source

  // v1 stored the country as free text and the map hint under `address.description`.
  const { description: addressNote, country, ...address } = location.address

  const migrated = {
    schemaVersion: 2,
    id,
    slug: id,
    status: 'published',
    kind: KIND_BY_ID[id],
    updatedAt: UPDATED_AT,
    ...rest,
    location: {
      ...location,
      address: {
        ...address,
        country: country === 'Spain' ? 'ES' : country,
        ...(addressNote ? { note: addressNote } : {}),
      },
    },
  }

  writeFileSync(path.join(TARGET_DIR, `${id}.json`), `${JSON.stringify(migrated, null, 2)}\n`, 'utf-8')
  console.log(`migrated ${id}`)
}
