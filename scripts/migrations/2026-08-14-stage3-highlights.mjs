// One-off: replaces propertyDetails with highlights.
// Apartment values are confirmed. House values are carried over from v1, whose
// block is a byte-identical clone of the apartment's — they are reported as
// unconfirmed and must be checked by a human.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'src/data/properties')

const LABELS = {
  guests: { de: 'Gäste', en: 'Guests', es: 'Huéspedes' },
  bedrooms: { de: 'Schlafzimmer', en: 'Bedrooms', es: 'Dormitorios' },
  beds: { de: 'Betten', en: 'Beds', es: 'Camas' },
  bathrooms: { de: 'Badezimmer', en: 'Bathrooms', es: 'Baños' },
  area: { de: 'Fläche', en: 'Area', es: 'Superficie' },
}

const ICONS = { guests: 'group', bedrooms: 'bed', beds: 'bed', bathrooms: 'bathtub', area: 'area_size' }

const VALUES = {
  apartment: { guests: 4, bedrooms: 2, beds: 4, bathrooms: 1, area: 95 },
  // Carried over from the v1 clone. `bedrooms` is omitted because v1 has no value for it.
  house: { guests: 4, beds: 4, bathrooms: 1, area: 95 },
}

for (const [id, values] of Object.entries(VALUES)) {
  const file = path.join(DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))

  delete data.propertyDetails
  data.highlights = Object.entries(values).map(([key, value]) => ({
    key,
    icon: ICONS[key],
    value,
    ...(key === 'area' ? { unit: 'sqm' } : {}),
    label: LABELS[key],
  }))

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  console.log(`${id}: ${data.highlights.length} highlights`)
}

console.log(`
UNCONFIRMED — the house block was a clone of the apartment's. Verify in
src/data/properties/house.json: guests, beds, bathrooms, area — and add
"bedrooms" (the description text mentions two bedrooms with two single beds
and one double bed, which suggests bedrooms=2 and beds=3, not 4).`)
