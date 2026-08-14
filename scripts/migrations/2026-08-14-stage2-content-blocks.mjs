// One-off: converts v1 description arrays into discriminated content blocks.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'src/data/properties')

// Paragraphs that carry their own label in the running text become note blocks.
const NOTE_PREFIXES = {
  de: /^Wichtiger Hinweis:\s*/,
  en: /^Important note:\s*/,
  es: /^Nota importante:\s*/,
}

function toBlock(item) {
  if ('bulletpoints' in item) {
    return {
      type: 'list',
      ...(item.text ? { intro: item.text } : {}),
      items: item.bulletpoints,
    }
  }

  const isNote = NOTE_PREFIXES.de.test(item.de ?? '')
  if (!isNote) {
    return { type: 'paragraph', text: item }
  }

  const text = {}
  for (const [locale, value] of Object.entries(item)) {
    text[locale] = NOTE_PREFIXES[locale] ? value.replace(NOTE_PREFIXES[locale], '') : value
  }
  return { type: 'note', variant: 'warning', text }
}

let noteCount = 0

for (const id of ['apartment', 'house']) {
  const file = path.join(DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))

  const convert = (items) => {
    const blocks = items.map(toBlock)
    noteCount += blocks.filter((block) => block.type === 'note').length
    return blocks
  }

  data.description = convert(data.description)
  data.location.description = convert(data.location.description)
  if (data.houseRules.description) {
    data.houseRules.description = convert(data.houseRules.description)
  }

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  console.log(`converted ${id}`)
}

console.log(`note blocks created: ${noteCount}`)
