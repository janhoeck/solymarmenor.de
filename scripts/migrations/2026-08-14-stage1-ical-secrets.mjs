// One-off: replaces the inline iCal url with a reference to an environment
// variable and prints the extracted values for .env.local.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'src/data/properties')
const SECRET_REF_BY_ID = { apartment: 'ICAL_APARTMENT', house: 'ICAL_HOUSE' }

const extracted = []

for (const [id, secretRef] of Object.entries(SECRET_REF_BY_ID)) {
  const file = path.join(DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))

  if (!data.icalUrl) {
    console.log(`${id}: no icalUrl, skipping`)
    continue
  }

  extracted.push(`${secretRef}=${data.icalUrl}`)
  delete data.icalUrl
  data.calendar = { provider: 'airbnb', secretRef }

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  console.log(`${id}: icalUrl -> ${secretRef}`)
}

console.log('\nAdd to .env.local — these are the OLD tokens and must be rotated (task 6):')
for (const line of extracted) console.log(`  ${line}`)
