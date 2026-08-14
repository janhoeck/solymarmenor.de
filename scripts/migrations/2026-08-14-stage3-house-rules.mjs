// One-off: extracts the times out of the check-in/check-out sentences and
// renames `description` to `notes`. Aborts if the three locales disagree.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'src/data/properties')

/** Pulls "15:00" out of "Check-in ab 15:00 Uhr" / "Check-in from 3:00 PM". */
function extractTime(translations) {
  const times = new Set()

  for (const [locale, text] of Object.entries(translations)) {
    const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (!match) throw new Error(`no time found in ${locale}: "${text}"`)

    let hours = Number(match[1])
    const minutes = match[2]
    const meridiem = match[3]?.toUpperCase()

    if (meridiem === 'PM' && hours !== 12) hours += 12
    if (meridiem === 'AM' && hours === 12) hours = 0

    times.add(`${`${hours}`.padStart(2, '0')}:${minutes}`)
  }

  if (times.size !== 1) {
    throw new Error(`locales disagree on the time: ${[...times].join(', ')}`)
  }
  return [...times][0]
}

for (const id of ['apartment', 'house']) {
  const file = path.join(DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))
  const { checkIn, checkOut, rules, description } = data.houseRules

  data.houseRules = {
    checkInFrom: extractTime(checkIn),
    checkOutUntil: extractTime(checkOut),
    rules,
    ...(description ? { notes: description } : {}),
  }

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  console.log(`${id}: check-in ${data.houseRules.checkInFrom}, check-out ${data.houseRules.checkOutUntil}`)
}
