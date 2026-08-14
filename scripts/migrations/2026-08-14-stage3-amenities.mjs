// One-off: flattens the categorised amenities into a single ordered list.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { AMENITY_CATEGORY_ORDER } from '../../src/data/amenities.ts'

const DIR = path.join(process.cwd(), 'src/data/properties')

for (const id of ['apartment', 'house']) {
  const file = path.join(DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))

  data.amenities = AMENITY_CATEGORY_ORDER.flatMap((category) => data.amenities[category] ?? [])

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  console.log(`${id}: ${data.amenities.length} amenities`)
}
