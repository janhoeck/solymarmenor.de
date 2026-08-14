// Caps the images under public/images at a maximum edge length and re-encodes
// them as WebP.
//
// Why: the property photos went online straight from the camera, 4032x3024 at
// 3-4 MB each, while they are never displayed wider than about 2000px. Every
// request to /_next/image had to decode that full resolution before it could
// even start scaling, which on a small container is what turned browsing the
// gallery into a seconds-per-image wait.
//
// Usage: pnpm images:downscale [--check] [--max=2560] [--quality=82] [--no-backup]
//
//   --check      write nothing, only report what would happen
//   --max        maximum long edge in pixels (default 2560)
//   --quality    WebP quality (default 82)
//   --no-backup  do not copy the originals to .image-originals/
//
// Run `pnpm images:sync` afterwards: otherwise the dimensions in
// src/data/properties/*.json no longer match the files on disk.
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)
const CHECK_ONLY = args.includes('--check')
const BACKUP = !args.includes('--no-backup')

/** Reads `--name=value` from the command line, with a fallback. */
function numericFlag(name, fallback) {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  if (!match) {
    return fallback
  }

  const value = Number(match.slice(name.length + 3))
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`  error: --${name} needs a positive number, got "${match}"`)
    process.exit(1)
  }
  return value
}

const MAX_EDGE = numericFlag('max', 2560)
const QUALITY = numericFlag('quality', 82)

const IMAGES_DIR = path.join(process.cwd(), 'public/images')
const BACKUP_DIR = path.join(process.cwd(), '.image-originals')

/** Every .webp file below dir, recursively. */
function collectWebp(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      found.push(...collectWebp(full))
    } else if (entry.name.endsWith('.webp')) {
      found.push(full)
    }
  }
  return found
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/**
 * Shrinks one file if it needs it. Returns what happened so the caller can
 * report without having to hit the disk a second time.
 */
async function downscale(file) {
  const relative = path.relative(process.cwd(), file)
  const before = statSync(file).size
  const source = readFileSync(file)
  const metadata = await sharp(source).metadata()

  // Applying the EXIF orientation can swap width and height. For the "does this
  // need shrinking" decision that does not matter, the long edge stays the same.
  const longEdge = Math.max(metadata.width, metadata.height)
  if (longEdge <= MAX_EDGE) {
    return { relative, skipped: true, before, after: before, width: metadata.width, height: metadata.height }
  }

  const pipeline = sharp(source)
    // No argument: apply the EXIF orientation and then drop it. Otherwise the
    // header would claim an orientation the pixels no longer have and
    // images-sync would write swapped dimensions into the property data.
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 5 })

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true })

  if (!CHECK_ONLY) {
    if (BACKUP) {
      const target = path.join(BACKUP_DIR, path.relative(process.cwd(), file))
      mkdirSync(path.dirname(target), { recursive: true })
      copyFileSync(file, target)
    }
    writeFileSync(file, data)
  }

  return { relative, skipped: false, before, after: data.length, width: info.width, height: info.height }
}

/** Runs the tasks with bounded concurrency. sharp is already multi-threaded
 *  internally, so unbounded fan-out does not make it any faster. */
async function mapWithLimit(items, limit, worker) {
  const results = new Array(items.length)
  let next = 0

  async function run() {
    while (next < items.length) {
      const index = next
      next += 1
      results[index] = await worker(items[index])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run))
  return results
}

const files = collectWebp(IMAGES_DIR)
if (files.length === 0) {
  console.error(`  error: no .webp files below ${IMAGES_DIR}`)
  process.exit(1)
}

console.log(
  `${CHECK_ONLY ? 'Checking' : 'Downscaling'} ${files.length} images to max ${MAX_EDGE}px, WebP quality ${QUALITY}` +
    `${CHECK_ONLY || !BACKUP ? '' : `, originals to ${path.relative(process.cwd(), BACKUP_DIR)}/`}`
)

const results = await mapWithLimit(files, 4, downscale)

let totalBefore = 0
let totalAfter = 0
let changed = 0

for (const result of results) {
  totalBefore += result.before
  totalAfter += result.after
  if (result.skipped) {
    continue
  }
  changed += 1
  console.log(
    `  ${result.relative}: ${formatBytes(result.before)} -> ${formatBytes(result.after)} ` +
      `(${result.width}x${result.height})`
  )
}

const saved = totalBefore - totalAfter
console.log(
  `\n${changed} of ${files.length} images ${CHECK_ONLY ? 'would be downscaled' : 'downscaled'}, ` +
    `${files.length - changed} already small enough.`
)
console.log(
  `Total: ${formatBytes(totalBefore)} -> ${formatBytes(totalAfter)}, ` +
    `${formatBytes(saved)} saved (${((saved / totalBefore) * 100).toFixed(0)}%).`
)

if (!CHECK_ONLY && changed > 0) {
  console.log('\nRun `pnpm images:sync` now so the property data picks up the new dimensions.')
}
