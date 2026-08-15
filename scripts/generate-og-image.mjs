// Produces the Open Graph preview image at public/og/default.jpg.
//
// Why a checked-in file rather than runtime generation: /_next/image runs on
// our own app server, and this image changes about never. Generating it per
// cache miss would spend CPU on a constant — the same reasoning that rules out
// AVIF in next.config.ts.
//
// The default source is the house cover at 1600x1200, which is the only cover
// large enough to fill 1200x630 without upscaling (the apartment cover is
// 1156x874, narrower than the 1200px target).
//
// Usage: pnpm og:generate [--source=public/images/house/coverPhoto.webp] [--quality=82]
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const args = process.argv.slice(2)

/** Reads `--name=value` from the command line, with a fallback. */
function flag(name, fallback) {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  return match ? match.slice(`--${name}=`.length) : fallback
}

const WIDTH = 1200
const HEIGHT = 630

const source = path.join(process.cwd(), flag('source', 'public/images/house/coverPhoto.webp'))
const target = path.join(process.cwd(), 'public/og/default.jpg')
const quality = Number(flag('quality', '82'))

const metadata = await sharp(source).metadata()

if (metadata.width < WIDTH || metadata.height < HEIGHT) {
  console.error(
    `Source ${source} is ${metadata.width}x${metadata.height}, smaller than the ${WIDTH}x${HEIGHT} target. ` +
      'Pick a larger source with --source; upscaling would look worse than the favicon it replaces.'
  )
  process.exit(1)
}

mkdirSync(path.dirname(target), { recursive: true })

// JPEG, not WebP: the Open Graph consumers that matter still include clients
// that will not render WebP previews, and the file is fetched by crawlers
// rather than by visitors, so its size barely matters.
await sharp(source).resize(WIDTH, HEIGHT, { fit: 'cover', position: 'attention' }).jpeg({ quality }).toFile(target)

const written = await sharp(target).metadata()
console.log(`Wrote ${path.relative(process.cwd(), target)} at ${written.width}x${written.height}`)
