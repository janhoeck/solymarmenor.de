// Reads image dimensions from disk, writes them into the property data and
// reports drift between the files on disk and the entries in the data.
// Usage: pnpm images:sync [--check]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const CHECK_ONLY = process.argv.includes('--check')
const DATA_DIR = path.join(process.cwd(), 'src/data/properties')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

/** Minimal WebP dimension reader. Covers the VP8, VP8L and VP8X chunk variants. */
function readWebpSize(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('not a webp file')
  }

  const chunk = buffer.toString('ascii', 12, 16)

  if (chunk === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
  }

  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }

  if (chunk === 'VP8X') {
    return {
      width: (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1,
      height: (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1,
    }
  }

  throw new Error(`unsupported webp chunk: ${chunk}`)
}

function sizeOf(src) {
  const file = path.join(PUBLIC_DIR, src)
  return readWebpSize(readFileSync(file))
}

const PROPERTY_IDS = readdirSync(DATA_DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.replace(/\.json$/, ''))

let problems = 0

for (const id of PROPERTY_IDS) {
  const file = path.join(DATA_DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))
  const entries = [data.images.cover, ...data.images.gallery]

  for (const entry of entries) {
    try {
      const { width, height } = sizeOf(entry.src)
      if (CHECK_ONLY && (entry.width !== width || entry.height !== height)) {
        console.error(`  stale dimensions: ${entry.src} (data ${entry.width}x${entry.height}, file ${width}x${height})`)
        problems += 1
      }
      entry.width = width
      entry.height = height
    } catch (error) {
      console.error(`  missing or unreadable: ${entry.src} — ${error.message}`)
      problems += 1
    }
  }

  const referenced = new Set(entries.map((entry) => entry.src))
  const onDisk = readdirSync(path.join(PUBLIC_DIR, 'images', id))
    .filter((name) => name.endsWith('.webp'))
    .map((name) => `/images/${id}/${name}`)

  for (const src of onDisk) {
    if (!referenced.has(src)) {
      console.error(`  on disk but not in the data: ${src}`)
      problems += 1
    }
  }

  if (!CHECK_ONLY) {
    writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  }

  console.log(`${id}: ${entries.length} images`)
}

if (problems > 0) {
  console.error(`\n${problems} problem(s) found`)
  process.exit(1)
}
console.log('\nall images consistent')
