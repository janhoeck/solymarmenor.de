// One-off: turns imageSources into the images object. Dimensions are filled by images-sync.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'src/data/properties')

for (const id of ['apartment', 'house']) {
  const file = path.join(DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))
  const [cover, ...gallery] = data.imageSources

  delete data.imageSources
  data.images = {
    // width/height are placeholders; images-sync overwrites them from the files.
    cover: { src: cover, width: 1, height: 1 },
    gallery: gallery.map((src) => ({ src, width: 1, height: 1 })),
  }

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  console.log(`${id}: 1 cover + ${gallery.length} gallery images`)
}
