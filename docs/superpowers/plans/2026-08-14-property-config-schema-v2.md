# Property-Config Schema v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die beiden Objekt-Configs aus `public/propertyConfigs/` in ein validiertes, erweiterbares
Schema überführen, dessen Blöcke sich ohne Neumodellierung auf Postgres-Tabellen abbilden lassen.

**Architecture:** Ein Zod-Schema in `src/data/property-schema.ts` ist die einzige Quelle der
Wahrheit; der TypeScript-Typ entsteht per `z.infer`. Die JSON-Dateien werden statisch importiert und
beim Modul-Import geparst, sodass fehlerhafte Daten den Build brechen statt eine 404 in Produktion zu
erzeugen. Sämtliche Zugriffe laufen über ein `async` Repository (`src/lib/properties/repository.ts`),
das später gegen Drizzle ausgetauscht wird, ohne einen einzigen Aufrufer zu ändern.

**Tech Stack:** Next 16 (App Router, React 19), TypeScript 5 (`strict`, `noUncheckedIndexedAccess`),
Zod 4, next-intl 4, pnpm 11, Node 22.16.

## Global Constraints

- **Node-Version:** v22.16.0. `--experimental-strip-types` ist erforderlich, Typ-Stripping ist nicht
  per Default aktiv (`process.features.typescript === false`).
- **Testkommando:** `node --test --experimental-strip-types "src/**/*.test.ts"`. Die Glob-Form ist
  zwingend — `node --test <verzeichnis>` findet `.ts`-Dateien in dieser Node-Version **nicht**.
  Das Glob-Muster muss in Anführungszeichen stehen, damit Node es expandiert und nicht die Shell.
- **Kein neues Testframework.** Ausschließlich `node:test` und `node:assert/strict`. Keine neue
  Dependency in `package.json` außer den bereits vorhandenen.
- **JSON-Importe brauchen Import-Attribute:** `import data from './x.json' with { type: 'json' }`.
  Ohne Attribut schlägt der Node-Testlauf mit `ERR_IMPORT_ATTRIBUTE_MISSING` fehl. Verifiziert:
  funktioniert unter `node --test` **und** `tsc --noEmit`.
- **Dateien unter `src/data/` und `src/lib/properties/` verwenden ausschließlich relative Importe
  mit expliziter `.ts`-Endung** (z. B. `import { x } from './amenities.ts'`). Pfad-Aliase `@/…`
  werden von Node nicht aufgelöst, und diese Module müssen unter `node --test` ladbar bleiben.
- **`noUncheckedIndexedAccess` ist aktiv:** jeder Array-/Index-Zugriff liefert `T | undefined` und
  muss geprüft oder mit `!` bestätigt werden.
- **Locales:** `de`, `en`, `es`. Redaktionssprache und Pflichtsprache ist `de`.
  `routing.defaultLocale` ist `'en'` und steuert ausschließlich URLs — nicht die Fallback-Kette.
- **Sprache im Code:** Bezeichner, Kommentare und Commit-Messages auf Englisch (bestehende
  Konvention). Diese Plandatei und die Spec sind Deutsch.
- **Commit-Format:** Conventional Commits (`feat:`, `refactor:`, `fix:`, `chore:`, `docs:`).
- **Nach jeder Task müssen `pnpm check-types` und `pnpm lint` fehlerfrei durchlaufen.**
- **Ein grünes `pnpm test` sagt nichts über Typen.** Nodes `--experimental-strip-types` entfernt
  Typannotationen, ohne sie zu prüfen. Typfehler — insbesondere veraltete `Property`-Fixtures in
  Testdateien — fallen ausschließlich bei `pnpm check-types` und `pnpm build` auf. Beide sind nach
  jeder Task zu laufen, nicht nur die Tests.
- **Jede Schemaänderung erfordert eine Suche nach Fixtures.** `src/lib/properties/repository.test.ts`
  und `src/data/property-schema.test.ts` bauen `Property`-Objekte von Hand. Sie stehen nicht in den
  Dateilisten der einzelnen Tasks, müssen aber bei jeder Feldänderung mitgezogen werden. Das ist in
  diesem Plan bereits dreimal aufgelaufen.

## Abweichungen von der Spec

Die Spec sieht **ein** einmaliges Migrationsskript vor. Da die Umstellung in drei einzeln
deploybaren Etappen erfolgt, wird daraus **ein Skript je datenverändernder Task** unter
`scripts/migrations/`. Alle werden in Task 16 gelöscht. Begründung: ein einziges Skript müsste den
Sprung v1 → v2 in einem Zug machen und würde die Etappengrenzen aufheben.

Zusätzlich gegenüber der Spec geklärt: die Saisonzeiträume sind **nicht** offen. Sie stehen
hartcodiert in `BookItCard.tsx:19` (`[9,10,11,0,1,2]` = Nebensaison Oktober–März) und als Text in
`public/locales/de.json` (`bookIt.mainSeason.range` = „April - September"). Task 14 übernimmt sie in
die Daten.

## Dateistruktur

| Datei | Verantwortung | Task |
|---|---|---|
| `src/data/property-schema.ts` | Zod-Schema + abgeleitete Typen, einzige Quelle der Wahrheit | 1, wächst in 7, 8, 10, 12, 13, 14, 15 |
| `src/data/property-schema.test.ts` | Schema-Verhalten (Pflichtfelder, Enums, Ablehnung) | 1 |
| `src/data/localized-text.ts` | `LocalizedText`, `resolveText` mit Fallback-Kette | 7 |
| `src/data/amenities.ts` | Registry: Amenity-Key → Kategorie + Icon, Kategoriereihenfolge | 13 |
| `src/data/highlight-keys.ts` | Registry: Highlight-Key → Default-Icon | 12 |
| `src/data/properties/apartment.json` | Objektdaten Wohnung | 2 |
| `src/data/properties/house.json` | Objektdaten Haus | 2 |
| `src/data/properties/index.ts` | Statischer Index, parst beide Dateien beim Import | 3 |
| `src/data/properties/data.test.ts` | Beide Datendateien erfüllen das Schema | 3 |
| `src/lib/properties/repository.ts` | `getProperties`, `getPropertyBySlug`, `getPropertyById` | 3 |
| `src/lib/properties/repository.test.ts` | Repository-Verhalten inkl. `draft`-Filter | 3 |
| `scripts/migrations/*.mjs` | Einmalige Datentransformationen, in Task 16 gelöscht | 2, 8, 10, 12–15 |
| `scripts/images-sync.mjs` | Bilddimensionen ermitteln, Abweichungen melden | 10 |
| `scripts/validate-content.mjs` | Prüfungen jenseits von Zod (Dateien, Keys, Eindeutigkeit) | 16 |
| `src/types/PropertyConfiguration.ts` | **gelöscht** in Task 1 | 1 |
| `src/lib/load-property-configs.ts` | **gelöscht** in Task 4 | 4 |
| `src/types/ContentBlock.ts`, `src/components/property/utils.ts` | **gelöscht** in Task 9 | 9 |

---

# Etappe 1 — Fundament und Sicherheit

Nach Abschluss ist nach außen nichts Sichtbares verändert. Die Etappe ist für sich deploybar.

---

### Task 1: Zod-Schema als Quelle der Wahrheit

Bildet die **heutige** Struktur ab (noch `imageSources`, `propertyDetails`, `price`, kategorisierte
`amenities`, `houseRules.checkIn`) und ergänzt nur die Kopfdaten. Die Umbenennungen folgen in
Etappe 2 und 3.

**Files:**
- Create: `src/data/property-schema.ts`
- Create: `src/data/property-schema.test.ts`
- Modify: `tsconfig.json` (Pfad-Alias `@/data/*`, `allowImportingTsExtensions`)
- Modify: `package.json` (Skript `test`)
- Delete: `src/types/PropertyConfiguration.ts` (erst in Schritt 7 dieser Task)

**Interfaces:**
- Consumes: `IconType` aus `src/types/IconType.ts` (reine String-Union, importierbar per
  `../types/IconType.ts`).
- Produces:
  - `propertySchema: z.ZodType` — parst ein vollständiges Objekt
  - `type Property = z.infer<typeof propertySchema>`
  - `translationMapSchema`, `type TranslationMap` (wird in Task 7 durch `LocalizedText` ersetzt)
  - `descriptionSchema`, `type Description` (wird in Task 8 ersetzt)

- [ ] **Step 1: `tsconfig.json` erweitern**

In `compilerOptions` ergänzen:

```jsonc
"allowImportingTsExtensions": true,
```

und in `paths` als ersten Eintrag:

```jsonc
"@/data/*": [
  "data/*"
],
```

`allowImportingTsExtensions` ist zulässig, weil `noEmit: true` gesetzt ist.

- [ ] **Step 2: Testskript in `package.json` ergänzen**

In `scripts` nach `"lint"` einfügen:

```json
"test": "node --test --experimental-strip-types \"src/**/*.test.ts\"",
```

- [ ] **Step 3: Den fehlschlagenden Test schreiben**

Create `src/data/property-schema.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { propertySchema, translationMapSchema } from './property-schema.ts'

const validTranslation = { de: 'Titel', en: 'Title', es: 'Título' }

const validProperty = {
  schemaVersion: 2,
  id: 'apartment',
  slug: 'apartment',
  status: 'published',
  kind: 'apartment',
  updatedAt: '2026-08-14',
  icalUrl: 'https://www.airbnb.de/calendar/ical/123.ics?t=abc',
  title: validTranslation,
  subtitle: validTranslation,
  description: [validTranslation],
  price: { perNight: { offSeason: 70, mainSeason: 85 }, cleaning: 85 },
  location: {
    lat: 37.75,
    lng: -0.84,
    address: {
      street: 'Calle Isla de Ibiza',
      houseNumber: '13',
      postalCode: '30710',
      city: 'Los Alcázares',
      country: 'ES',
    },
    description: [validTranslation],
  },
  // Five entries because the schema requires them — PropertyImageGrid indexes [1]..[4].
  imageSources: [
    '/images/apartment/coverPhoto.webp',
    '/images/apartment/IMG_9806.webp',
    '/images/apartment/IMG_9808.webp',
    '/images/apartment/IMG_9809.webp',
    '/images/apartment/IMG_9810.webp',
  ],
  propertyDetails: [{ type: 'bed', amount: 4, title: validTranslation, subtitle: validTranslation }],
  amenities: { general: ['parking'], kitchen: ['oven'] },
  houseRules: {
    checkIn: validTranslation,
    checkOut: validTranslation,
    rules: ['party', 'pet', 'smoking'],
  },
}

test('accepts a complete property', () => {
  const parsed = propertySchema.parse(validProperty)
  assert.equal(parsed.id, 'apartment')
  assert.equal(parsed.slug, 'apartment')
})

test('rejects an unknown top-level key', () => {
  assert.throws(() => propertySchema.parse({ ...validProperty, sauna: true }))
})

test('rejects a schemaVersion other than 2', () => {
  assert.throws(() => propertySchema.parse({ ...validProperty, schemaVersion: 1 }))
})

test('rejects an unknown status', () => {
  assert.throws(() => propertySchema.parse({ ...validProperty, status: 'archived' }))
})

test('rejects a country that is not an ISO alpha-2 code', () => {
  const property = structuredClone(validProperty)
  property.location.address.country = 'Spain'
  assert.throws(() => propertySchema.parse(property))
})

test('rejects an amenity that is not a known icon type', () => {
  const property = structuredClone(validProperty)
  property.amenities.general = ['teleporter']
  assert.throws(() => propertySchema.parse(property))
})

test('requires the german translation', () => {
  assert.throws(() => translationMapSchema.parse({ en: 'Title', es: 'Título' }))
})

test('accepts a translation with german only', () => {
  assert.deepEqual(translationMapSchema.parse({ de: 'Titel' }), { de: 'Titel' })
})
```

- [ ] **Step 4: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './property-schema.ts'`

- [ ] **Step 5: Schema implementieren**

Create `src/data/property-schema.ts`:

```ts
import { z } from 'zod'

import type { IconType } from '../types/IconType.ts'

/** Locales the site is translated into. `de` is the editorial language. */
export const LOCALES = ['de', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

/**
 * A translated string. Only `de` is mandatory so that additional locales can be
 * filled in field by field instead of all at once.
 */
export const translationMapSchema = z
  .object({
    de: z.string().min(1),
    en: z.string().min(1).optional(),
    es: z.string().min(1).optional(),
  })
  .strict()

export type TranslationMap = z.infer<typeof translationMapSchema>

const descriptionItemSchema = z.union([
  translationMapSchema,
  z
    .object({
      text: translationMapSchema.optional(),
      bulletpoints: z.array(translationMapSchema).min(1),
    })
    .strict(),
])

export const descriptionSchema = z.array(descriptionItemSchema)
export type Description = z.infer<typeof descriptionSchema>

/**
 * Icon identifiers rendered by `src/components/property/iconMapping.ts`.
 * Kept in sync with `IconType`; the satisfies clause fails the build on drift.
 */
const ICON_TYPES = [
  'area_size', 'group', 'pool', 'parking', 'air_conditioner', 'wlan', 'tv', 'barrier_free',
  'elevator', 'refrigerator', 'freezer', 'cooker', 'oven', 'microwave', 'coffee_machine',
  'pots_pans', 'dishes', 'bed_linen', 'shower', 'bathtub', 'hairdryer', 'towels', 'vacuum',
  'washing_machine', 'washing_rack', 'baby_bed', 'bed', 'high_chair', 'terrace', 'balcony',
  'fire_extinguisher', 'smoke_detector', 'kettle', 'pet', 'party', 'smoking', 'checkin', 'checkout',
] as const satisfies readonly IconType[]

const iconTypeSchema = z.enum(ICON_TYPES)

const addressSchema = z
  .object({
    building: z.string().min(1).optional(),
    street: z.string().min(1),
    houseNumber: z.string().min(1),
    floorApartment: z.string().min(1).optional(),
    postalCode: z.string().min(1),
    city: z.string().min(1),
    /** ISO 3166-1 alpha-2, uppercase. Rendered localized by the UI. */
    country: z.string().regex(/^[A-Z]{2}$/),
    /** Renamed to `note` in task 2, together with the data and AddressCard. */
    description: translationMapSchema.optional(),
  })
  .strict()

const locationSchema = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: addressSchema,
    description: descriptionSchema,
  })
  .strict()

const propertyDetailSchema = z
  .object({
    type: iconTypeSchema,
    amount: z.number().int().positive(),
    title: translationMapSchema,
    subtitle: translationMapSchema,
  })
  .strict()

const amenitiesSchema = z
  .object({
    general: z.array(iconTypeSchema).optional(),
    outdoorArea: z.array(iconTypeSchema).optional(),
    kitchen: z.array(iconTypeSchema).optional(),
    bedroom: z.array(iconTypeSchema).optional(),
    bathroom: z.array(iconTypeSchema).optional(),
    baby: z.array(iconTypeSchema).optional(),
  })
  .strict()

const houseRulesSchema = z
  .object({
    checkIn: translationMapSchema,
    checkOut: translationMapSchema,
    rules: z.array(z.enum(['pet', 'party', 'smoking'])),
    description: descriptionSchema.optional(),
  })
  .strict()

const priceSchema = z
  .object({
    perNight: z.object({ offSeason: z.number().positive(), mainSeason: z.number().positive() }).strict(),
    cleaning: z.number().positive().optional(),
  })
  .strict()

export const propertySchema = z
  .object({
    schemaVersion: z.literal(2),
    id: z.string().regex(/^[a-z0-9-]+$/),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    status: z.enum(['published', 'draft']),
    kind: z.enum(['apartment', 'house']),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Replaced by `calendar.secretRef` in task 5, together with the route and the component. */
    icalUrl: z.url().optional(),
    title: translationMapSchema,
    subtitle: translationMapSchema,
    description: descriptionSchema,
    price: priceSchema,
    location: locationSchema,
    imageSources: z.array(z.string().startsWith('/images/')).min(5),
    propertyDetails: z.array(propertyDetailSchema),
    amenities: amenitiesSchema,
    houseRules: houseRulesSchema,
  })
  .strict()

export type Property = z.infer<typeof propertySchema>
```

`.strict()` auf jeder Ebene bedeutet: jedes Feld, das in den Daten steht, muss im Schema stehen.
Deshalb bildet dieses Schema `icalUrl` noch ab — die Daten enthalten das Feld bis Task 5, und
`CalendarCard.tsx:23,39` liest es. Schema, Daten, Route und Komponente wechseln in Task 5
gemeinsam auf `calendar.secretRef`; ein früherer Teilschritt würde entweder den Typcheck brechen
oder den Kalender bis Task 5 stillegen.

`imageSources` verlangt mindestens 5 Einträge, weil `PropertyImageGrid.tsx:62` fest auf
`imageSources[1]` bis `imageSources[4]` zugreift.

- [ ] **Step 6: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm test`
Expected: PASS — 8 Tests

- [ ] **Step 7: Alten Typ entfernen und Consumer umhängen**

`src/types/PropertyConfiguration.ts` löschen. In allen Dateien, die daraus importieren, den Import
ersetzen durch:

```ts
import type { Property } from '@/data/property-schema'
```

und die Typverwendung `PropertyConfiguration` → `Property`. Betroffen sind:
`PropertyView.tsx`, `PropertyCard.tsx`, `PropertyImageGrid.tsx`, `CalendarCard.tsx`,
`PropertyDetailsSection.tsx`, `PropertyDetailItem.tsx` (nutzt `PropertyDetailItem` → wird
`Property['propertyDetails'][number]`), `AmenitiesSection.tsx`, `HouseRulesSection.tsx`,
`DescriptionSection.tsx`, `LocationDescriptionSection.tsx`, `AddressCard.tsx`,
`BookItCard.tsx` (nutzt `PriceConfig` → wird `Property['price']`),
`src/components/property/utils.ts`, `src/lib/load-property-configs.ts`.

Nachschlagen mit: `rg -l "types/PropertyConfiguration" src`

- [ ] **Step 8: Typen und Lint prüfen**

Run: `pnpm check-types && pnpm lint`
Expected: beide fehlerfrei. Erwartete Restfehler zu `schemaVersion`/`slug`, die in den JSON-Daten
noch fehlen, treten hier **nicht** auf, weil noch nichts das Schema gegen die Dateien anwendet.

- [ ] **Step 9: Build prüfen**

Run: `pnpm build`
Expected: erfolgreich.

Falls Turbopack die `.ts`-Endung in Importen ablehnt: `allowImportingTsExtensions` zurücknehmen und
`ICON_TYPES` samt `IconType`-Import in `property-schema.ts` inlinen, sodass die Datei keine
relativen Importe mehr hat. Der Test importiert dann weiterhin `./property-schema.ts`, was Node
verlangt und Next nicht sieht.

- [ ] **Step 10: Commit**

Reihenfolge beachten: `git rm` zuerst, sonst hat `git add src/` die Löschung bereits gestaged und
`git rm` bricht mit „did not match any files" ab.

```bash
git rm src/types/PropertyConfiguration.ts
git add tsconfig.json package.json src/data src/components src/lib src/app
git commit -m "refactor: derive property types from a zod schema"
```

---

### Task 2: Daten aus `public/` herausnehmen und Kopfdaten ergänzen

Neben dem Umzug erledigt diese Task zwei Feldwechsel, die die Daten betreffen: `country` von
Freitext auf ISO-Code und `address.description` auf `address.note`. Beide ändern Daten, Schema und
lesende Komponente **gemeinsam** — dieselbe Regel wie beim iCal-Feld in Task 5.

**Files:**
- Create: `scripts/migrations/2026-08-14-stage1-head-fields.mjs`
- Create: `src/data/properties/apartment.json` (aus `public/propertyConfigs/apartment.json`)
- Create: `src/data/properties/house.json` (aus `public/propertyConfigs/house.json`)
- Delete: `public/propertyConfigs/`
- Modify: `src/data/property-schema.ts` (`address.description` → `address.note`)
- Modify: `src/data/property-schema.test.ts`
- Modify: `src/components/property/sections/locationDescriptionSection/AddressCard.tsx:40`
- Modify: `src/lib/load-property-configs.ts:8,19` (Pfad, temporär bis Task 4)

**Interfaces:**
- Consumes: `propertySchema` aus `src/data/property-schema.ts` (Task 1).
- Produces: `src/data/properties/{apartment,house}.json` mit Kopfdaten, ISO-Ländercode und
  `address.note`; das Schema entsprechend angepasst.

- [ ] **Step 1: Migrationsskript schreiben**

Create `scripts/migrations/2026-08-14-stage1-head-fields.mjs`:

```js
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
    // `rest` still carries the source `id`, so the head fields go AFTER the spread —
    // otherwise the later spread silently wins and the explicit values are dead code.
    ...rest,
    schemaVersion: 2,
    id,
    slug: id,
    status: 'published',
    kind: KIND_BY_ID[id],
    updatedAt: UPDATED_AT,
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
```

`icalUrl` bleibt hier bewusst in den Daten. Es wandert in Task 5 zusammen mit Route und Komponente
nach `.env` — siehe die Begründung unter Task 1, Schritt 5.

- [ ] **Step 2: Schema und `AddressCard` auf `note` umstellen**

Das Skript aus Schritt 1 schreibt `address.note` statt `address.description`. Schema und lesende
Komponente müssen im selben Schritt nachziehen, sonst bricht der Typcheck.

In `src/data/property-schema.ts` in `addressSchema`:

```ts
    /** Free-form hint about finding the address, e.g. a map correction. */
    note: translationMapSchema.optional(),
```

(ersetzt das Feld `description` samt seinem Übergangskommentar)

In `src/data/property-schema.test.ts` in `validProperty.location.address` das Feld `description`
— falls dort gesetzt — auf `note` umbenennen, und diesen Test anhängen:

```ts
test('rejects a leftover address description field', () => {
  const property = structuredClone(validProperty)
  property.location.address.description = { de: 'Hinweis' }
  assert.throws(() => propertySchema.parse(property))
})
```

In `src/components/property/sections/locationDescriptionSection/AddressCard.tsx:40` die beiden
Zugriffe auf `address.description` auf `address.note` umstellen. Prüfen mit:

Run: `rg -n "address\.description" src`
Expected: genau ein Treffer, und zwar die Zeile im negativen Test oben. Jeder weitere Treffer ist
Produktionscode, der noch das alte Feld liest.

- [ ] **Step 3: Skript ausführen**

Run: `node scripts/migrations/2026-08-14-stage1-head-fields.mjs`
Expected: zwei `migrated …`-Zeilen.

- [ ] **Step 4: Altes Verzeichnis entfernen und Loader-Pfad umbiegen**

```bash
git rm -r public/propertyConfigs
```

In `src/lib/load-property-configs.ts` beide Vorkommen von `'public/propertyConfigs'` (Zeile 8 und 19)
durch `'src/data/properties'` ersetzen. Das ist eine Zwischenlösung — die Datei verschwindet in
Task 4.

- [ ] **Step 5: Verifizieren, dass die Daten das Schema erfüllen**

Run:

```bash
node --experimental-strip-types -e "
import('./src/data/property-schema.ts').then(async (m) => {
  const { readFileSync } = await import('node:fs')
  for (const id of ['apartment', 'house']) {
    m.propertySchema.parse(JSON.parse(readFileSync('src/data/properties/' + id + '.json', 'utf-8')))
    console.log(id, 'ok')
  }
})
"
```

Expected: `apartment ok` und `house ok`. Bei einem Zod-Fehler die gemeldeten Pfade in den JSONs
korrigieren — nicht das Schema aufweichen.

- [ ] **Step 6: Build prüfen und committen**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm build`
Expected: erfolgreich, Objektseiten rendern unverändert. Der Kalender funktioniert weiterhin, weil
`icalUrl` bis Task 5 in den Daten bleibt.

Das `git rm -r public/propertyConfigs` aus Schritt 3 hat die Löschung bereits gestaged.

```bash
git add src/data scripts/migrations src/lib/load-property-configs.ts src/components/property/sections/locationDescriptionSection/AddressCard.tsx
git commit -m "refactor: move property configs out of the public directory"
```

---

### Task 3: Statischer Index und Repository

**Files:**
- Create: `src/data/properties/index.ts`
- Create: `src/data/properties/data.test.ts`
- Create: `src/lib/properties/repository.ts`
- Create: `src/lib/properties/repository.test.ts`

**Interfaces:**
- Consumes: `propertySchema`, `type Property` aus `src/data/property-schema.ts` (Task 1);
  die JSON-Dateien aus Task 2.
- Produces:
  - `properties: Property[]` aus `src/data/properties/index.ts` (alle Objekte, ungefiltert)
  - `getProperties(): Promise<Property[]>` — nur `status === 'published'`, stabil sortiert nach `id`
  - `getPropertyBySlug(slug: string): Promise<Property | undefined>` — nur veröffentlichte
  - `getPropertyById(id: string): Promise<Property | undefined>` — nur veröffentlichte

- [ ] **Step 1: Den fehlschlagenden Test für die Daten schreiben**

Create `src/data/properties/data.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { properties } from './index.ts'

test('both property files satisfy the schema', () => {
  assert.equal(properties.length, 2)
})

test('every id is unique', () => {
  const ids = properties.map((property) => property.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('every slug is unique', () => {
  const slugs = properties.map((property) => property.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})
```

Der Test, der prüft, dass keine Kalender-URL in den Daten steht, gehört **nicht** hierher: die Daten
tragen `icalUrl` planmäßig bis Task 5. Er wird dort ergänzt, wo er zum ersten Mal zutrifft.

- [ ] **Step 2: Den fehlschlagenden Test für das Repository schreiben**

Create `src/lib/properties/repository.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getProperties, getPropertyById, getPropertyBySlug } from './repository.ts'

test('returns every published property', async () => {
  const result = await getProperties()
  assert.ok(result.length >= 1)
  assert.ok(result.every((property) => property.status === 'published'))
})

test('returns properties in a stable order', async () => {
  const first = await getProperties()
  const second = await getProperties()
  assert.deepEqual(
    first.map((property) => property.id),
    second.map((property) => property.id),
  )
})

test('finds a property by slug', async () => {
  const result = await getPropertyBySlug('apartment')
  assert.equal(result?.id, 'apartment')
})

test('finds a property by id', async () => {
  const result = await getPropertyById('house')
  assert.equal(result?.id, 'house')
})

test('returns undefined for an unknown slug', async () => {
  assert.equal(await getPropertyBySlug('does-not-exist'), undefined)
})
```

- [ ] **Step 3: Tests laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './index.ts'` und `Cannot find module './repository.ts'`

- [ ] **Step 4: Index implementieren**

Create `src/data/properties/index.ts`:

```ts
import { type Property, propertySchema } from '../property-schema.ts'
import apartment from './apartment.json' with { type: 'json' }
import house from './house.json' with { type: 'json' }

/**
 * Parsing happens at module load, so invalid data fails the build instead of
 * producing a 404 at runtime. Add a new property by adding an import here.
 */
export const properties: Property[] = [apartment, house].map((raw) => propertySchema.parse(raw))
```

- [ ] **Step 5: Repository implementieren**

Create `src/lib/properties/repository.ts`:

```ts
import { properties } from '../../data/properties/index.ts'
import type { Property } from '../../data/property-schema.ts'

/**
 * The single seam between the app and the property data source. Everything else
 * goes through here, so swapping the JSON files for Postgres later changes this
 * file only. Async on purpose, even though nothing awaits yet.
 */

const published = properties
  .filter((property) => property.status === 'published')
  .sort((a, b) => a.id.localeCompare(b.id))

export async function getProperties(): Promise<Property[]> {
  return published
}

export async function getPropertyBySlug(slug: string): Promise<Property | undefined> {
  return published.find((property) => property.slug === slug)
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  return published.find((property) => property.id === id)
}
```

- [ ] **Step 6: Tests laufen lassen und Erfolg bestätigen**

Run: `pnpm test`
Expected: PASS — 17 Tests (8 aus Task 1, 4 Daten, 5 Repository)

- [ ] **Step 7: Commit**

```bash
git add src/data/properties/index.ts src/data/properties/data.test.ts src/lib/properties
git commit -m "feat: add validated property index and repository"
```

---

### Task 4: Consumer auf das Repository umstellen

`getProperties()` ist `async`. next-intl erlaubt `useTranslations`/`useLocale` **nicht** in `async`
Server-Komponenten — dort müssen `getTranslations`/`getLocale` aus `next-intl/server` verwendet
werden. Das betrifft genau `PropertyListSection`.

**Files:**
- Modify: `src/app/[locale]/property/[slug]/page.tsx` (komplett)
- Modify: `src/app/[locale]/property/[slug]/layout.tsx:3,16`
- Modify: `src/components/home/PropertyListSection/PropertyListSection.tsx` (komplett)
- Delete: `src/lib/load-property-configs.ts`

**Interfaces:**
- Consumes: `getProperties`, `getPropertyBySlug` aus `src/lib/properties/repository.ts` (Task 3).
- Produces: keine neuen Exporte.

- [ ] **Step 1: `page.tsx` umstellen**

Replace `src/app/[locale]/property/[slug]/page.tsx` entirely:

```tsx
import { PropertyView } from '@/components/property/PropertyView'
import { getPropertyBySlug } from '@/lib/properties/repository'
import { notFound } from 'next/navigation'

type Params = Promise<{ slug: string }>

export default async function PropertyPage({ params }: { params: Params }) {
  const { slug } = await params

  const property = await getPropertyBySlug(slug)
  if (!property) {
    notFound()
  }

  return <PropertyView configuration={property} />
}
```

- [ ] **Step 2: `layout.tsx` umstellen**

In `src/app/[locale]/property/[slug]/layout.tsx` Zeile 3 ersetzen:

```ts
import { getPropertyBySlug } from '@/lib/properties/repository'
```

und Zeile 16:

```ts
const propertyConfiguration = await getPropertyBySlug(slug)
```

- [ ] **Step 3: `PropertyListSection` auf async umstellen**

Replace `src/components/home/PropertyListSection/PropertyListSection.tsx` entirely:

```tsx
import { TextWithHeadline } from '@/components/home/TextWithHeadline'
import { PropertyCard } from '@/components/shared/PropertyCard/PropertyCard'
import { getProperties } from '@/lib/properties/repository'
import { getTranslations } from 'next-intl/server'
import React from 'react'

export const PropertyListSection = async () => {
  const t = await getTranslations('pages.home.properties')
  const properties = await getProperties()

  return (
    <section
      id='property-list-section'
      className='py-16 md:py-24'
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <TextWithHeadline
          title={t('title')}
          subtitle={t('subtitle')}
        />
        <div className='mx-auto grid max-w-6xl gap-8 md:grid-cols-2 md:gap-10'>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              propertyConfiguration={property}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
```

`PropertyCard` bleibt synchron und darf `useTranslations` weiter verwenden — die Einschränkung gilt
nur für Komponenten, die selbst `await` benutzen.

- [ ] **Step 4: Falls `PropertyListSection` in einer Client-Komponente gerendert wird, prüfen**

Run: `rg -n "PropertyListSection" src -g "*.tsx"`
Expected: nur die Definition und ein Aufruf aus einer Server-Komponente. Erscheint der Aufruf in
einer Datei mit `'use client'` am Anfang, muss stattdessen der Aufrufer die Daten laden und als Prop
durchreichen — dann in dieser Task melden statt improvisieren.

- [ ] **Step 5: Alten Loader löschen**

```bash
git rm src/lib/load-property-configs.ts
```

Run: `rg -n "load-property-configs" src`
Expected: keine Treffer.

- [ ] **Step 6: Typen, Lint, Build und Tests prüfen**

Run: `pnpm check-types && pnpm lint && pnpm test && pnpm build`
Expected: alles fehlerfrei.

- [ ] **Step 7: Startseite und eine Objektseite manuell prüfen**

Run: `pnpm dev`
Öffnen: `http://localhost:3000/de` — beide Objektkarten sichtbar.
Öffnen: `http://localhost:3000/de/property/apartment` — Seite rendert vollständig.
Öffnen: `http://localhost:3000/de/property/gibtsnicht` — 404.

- [ ] **Step 8: Commit**

```bash
git add src/app src/components/home/PropertyListSection/PropertyListSection.tsx
git commit -m "refactor: load properties through the repository"
```

---

### Task 5: `/api/ics` vom offenen Proxy auf Objekt-IDs umstellen

Heute übergibt `CalendarCard.tsx:39` die vollständige Token-URL an `/api/ics?url=…`; sie steht damit
im ausgelieferten HTML. Zusätzlich prüft `route.ts:14` nur `icalUrl.includes('airbnb')`, was auf
jede URL zutrifft, die den String irgendwo enthält — der Endpunkt lädt derzeit beliebige Adressen
serverseitig und gibt den Rumpf zurück.

Diese Task wechselt Schema, Daten, Route und Komponente **gemeinsam** von `icalUrl` auf
`calendar.secretRef`. Der Zuschnitt ist Absicht: jeder Teilschritt für sich würde entweder den
Typcheck brechen (Feld weg, Komponente liest es noch) oder den Kalender stilllegen (Daten weg,
Route kennt die neue Quelle noch nicht).

**Files:**
- Create: `scripts/migrations/2026-08-14-stage1-ical-secrets.mjs`
- Modify: `src/data/property-schema.ts` (`icalUrl` → `calendar`)
- Modify: `src/data/property-schema.test.ts`
- Modify: `src/data/properties/*.json` (per Skript)
- Modify: `src/app/api/ics/route.ts` (komplett)
- Modify: `src/components/property/calendar/CalendarCard.tsx:19-40`
- Modify: `src/components/property/PropertyView.tsx:39`
- Modify: `.env.local` (nicht committet)

**Interfaces:**
- Consumes: `getPropertyById` aus `src/lib/properties/repository.ts` (Task 3).
- Produces:
  - `calendar?: { provider: 'airbnb'; secretRef: string }` im Schema, `icalUrl` entfällt
  - `CalendarCard` nimmt `propertyId: string` und `hasCalendar: boolean` statt `propertyConfig`

- [ ] **Step 1: Schema umstellen**

In `src/data/property-schema.ts` vor `propertySchema` ergänzen:

```ts
/**
 * Points at the name of an environment variable, never at its value, so the
 * calendar token never enters the data files or the client bundle.
 */
const calendarSchema = z
  .object({
    provider: z.literal('airbnb'),
    secretRef: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  })
  .strict()
```

In `propertySchema` die Zeile `icalUrl: z.url().optional(),` samt Kommentar ersetzen durch:

```ts
    calendar: calendarSchema.optional(),
```

In `src/data/property-schema.test.ts` in `validProperty` das Feld `icalUrl` ersetzen durch
`calendar: { provider: 'airbnb', secretRef: 'ICAL_APARTMENT' },` und diese beiden Tests anhängen:

```ts
test('rejects a calendar that carries a url instead of a variable name', () => {
  assert.throws(() =>
    propertySchema.parse({
      ...validProperty,
      calendar: { provider: 'airbnb', secretRef: 'https://www.airbnb.de/calendar/ical/1.ics' },
    }),
  )
})

test('rejects a leftover icalUrl field', () => {
  assert.throws(() => propertySchema.parse({ ...validProperty, icalUrl: 'https://example.com' }))
})
```

Der zweite Test ist die Absicherung gegen ein Zurückrutschen: `.strict()` lässt das alte Feld nicht
mehr durch.

- [ ] **Step 2: Daten migrieren und Token nach `.env.local` holen**

Create `scripts/migrations/2026-08-14-stage1-ical-secrets.mjs`:

```js
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
```

Run: `node scripts/migrations/2026-08-14-stage1-ical-secrets.mjs`
Expected: zwei `icalUrl -> ICAL_*`-Zeilen und die zwei Werte.

Die beiden ausgegebenen Zeilen an `.env.local` anhängen. Vorher prüfen, dass die Datei ignoriert ist:

Run: `git check-ignore -v .env.local`
Expected: eine Trefferzeile. Ohne Treffer **nicht** fortfahren, sondern `.env.local` in `.gitignore`
ergänzen.

Zusätzlich an `src/data/properties/data.test.ts` anhängen — ab jetzt trifft die Aussage zu und wird
zur Regressionssicherung:

```ts
test('no property carries a calendar url in its data', () => {
  const serialized = JSON.stringify(properties)
  assert.ok(!serialized.includes('airbnb.de/calendar'))
})
```

Run: `pnpm test`
Expected: PASS — die Datentests parsen beide Dateien gegen das neue Schema, und die Kalender-URL
ist aus den Daten verschwunden.

- [ ] **Step 3: Route umschreiben**

Replace `src/app/api/ics/route.ts` entirely:

```ts
import { getPropertyById } from '@/lib/properties/repository'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Resolves the calendar URL server-side from an environment variable, so the
 * token never reaches the client and the route cannot be pointed at a
 * caller-supplied address.
 */
export async function GET(request: NextRequest) {
  try {
    const propertyId = request.nextUrl.searchParams.get('property')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property parameter is missing' }, { status: 400 })
    }

    const property = await getPropertyById(propertyId)
    const secretRef = property?.calendar?.secretRef

    if (!secretRef) {
      return NextResponse.json({ error: 'Unknown property' }, { status: 404 })
    }

    const icalUrl = process.env[secretRef]

    if (!icalUrl) {
      console.error(`Calendar error: environment variable ${secretRef} is not set`)
      return NextResponse.json({ error: 'Calendar is not configured' }, { status: 500 })
    }

    const response = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Error fetching calendar: ${response.status}`)
    }

    return new NextResponse(await response.text(), {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Calendar error:', error)
    return NextResponse.json({ error: 'Error loading calendar' }, { status: 500 })
  }
}
```

`process.env[secretRef]` ist ein dynamischer Zugriff. Next ersetzt `process.env.X` nur in
Client-Bundles statisch; in einer Route Handler läuft der Zugriff serverseitig zur Laufzeit und
funktioniert. Das wird in Schritt 4 geprüft.

- [ ] **Step 4: `CalendarCard` auf die Objekt-ID umstellen**

In `src/components/property/calendar/CalendarCard.tsx` die Zeilen 15–40 ersetzen:

```tsx
export type CalendarCardProps = {
  propertyId: string
  hasCalendar: boolean
}

export const CalendarCard = (props: CalendarCardProps) => {
  const { propertyId, hasCalendar } = props
  const locale = useLocale()

  if (!hasCalendar) {
    return null
  }

  const getCalendarLocale = () => {
    switch (locale) {
      case 'de':
        return deLocale
      case 'es':
        return esLocale
      case 'en':
      default:
        return enLocale
    }
  }

  const apiUrl = `/api/ics?property=${encodeURIComponent(propertyId)}`
```

Den Import von `Property` bzw. `PropertyConfiguration` in Zeile 3 entfernen.

- [ ] **Step 5: Aufrufer anpassen**

In `src/components/property/PropertyView.tsx` Zeile 39 ersetzen:

```tsx
<CalendarCard
  propertyId={configuration.id}
  hasCalendar={Boolean(configuration.calendar)}
/>
```

- [ ] **Step 6: Manuell prüfen**

Run: `pnpm dev`

1. `http://localhost:3000/de/property/apartment` öffnen — der Kalender lädt und zeigt belegte Tage.
2. Im Seitenquelltext nach `airbnb` suchen (Strg+U, Strg+F): **kein Treffer**.
3. `http://localhost:3000/api/ics?property=gibtsnicht` → `404` mit `{"error":"Unknown property"}`.
4. `http://localhost:3000/api/ics?url=https://example.com/airbnb` → `400` mit
   `{"error":"Property parameter is missing"}`.

- [ ] **Step 7: Typen, Lint, Tests und Build prüfen**

Run: `pnpm check-types && pnpm lint && pnpm test && pnpm build`
Expected: alles fehlerfrei.

- [ ] **Step 8: Commit**

`.env.local` ist ignoriert und wird nicht committet.

```bash
git add src/data src/app/api/ics/route.ts src/components/property/calendar/CalendarCard.tsx src/components/property/PropertyView.tsx scripts/migrations
git commit -m "fix: resolve calendar urls server-side instead of proxying client input"
```

---

### Task 6: Kalender-Token rotieren

Diese Task enthält **keine Codeänderung** und muss von einer Person mit Airbnb-Zugang ausgeführt
werden. Sie gehört zwingend nach Task 5, damit der neue Token nicht erneut ausgeliefert wird.

- [ ] **Step 1: Neue Kalender-Links erzeugen**

Für beide Inserate in Airbnb: *Kalender → Verfügbarkeit → Kalender synchronisieren →
Kalender exportieren*. Dort den bestehenden Link entfernen und neu generieren lassen. Der neue Link
hat einen anderen `?t=`-Parameter.

- [ ] **Step 2: `.env.local` aktualisieren**

`ICAL_APARTMENT` und `ICAL_HOUSE` auf die neuen URLs setzen.

- [ ] **Step 3: Werte in der Deployment-Umgebung setzen**

Dieselben zwei Variablen in der Hosting-Umgebung hinterlegen (`nixpacks.toml` deutet auf einen
Container-Host hin — die Variablen dort als Environment Secrets eintragen, nicht ins Image backen).

- [ ] **Step 4: Prüfen**

Run: `pnpm dev`, Objektseite öffnen, Kalender lädt weiterhin.

Zusätzlich prüfen, dass die alten URLs tot sind: die alte URL aus der Git-Historie im Browser öffnen
— Airbnb muss `404` oder eine leere Datei liefern.

- [ ] **Step 5: Notiz im Repo hinterlegen**

`.env.local` selbst wird nicht committet. Stattdessen `README.md` um einen Abschnitt ergänzen:

```markdown
## Environment

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | Postgres-Verbindung (Gästebuch) |
| `ICAL_APARTMENT` | Airbnb-Kalender-Export der Ferienwohnung |
| `ICAL_HOUSE` | Airbnb-Kalender-Export des Ferienhauses |

Die `ICAL_*`-Werte enthalten ein Zugriffstoken und dürfen nicht in Dateien unter `public/`,
in den Objektdaten oder im Client-Bundle landen. Referenziert werden sie ausschließlich über
`calendar.secretRef` in `src/data/properties/*.json`.
```

```bash
git add README.md
git commit -m "docs: document the ical environment variables"
```

**Etappe 1 ist hier abgeschlossen und deploybar.**

---

# Etappe 2 — Inhalte

---

### Task 7: `LocalizedText` mit Fallback-Kette

**Files:**
- Create: `src/data/localized-text.ts`
- Create: `src/data/localized-text.test.ts`
- Modify: `src/data/property-schema.ts` (`translationMapSchema` → `localizedTextSchema`)

**Interfaces:**
- Consumes: `LOCALES`, `Locale` aus `src/data/property-schema.ts` (Task 1) — werden nach
  `localized-text.ts` verschoben und dort re-exportiert.
- Produces:
  - `localizedTextSchema`, `type LocalizedText = { de: string; en?: string; es?: string }`
  - `resolveText(text: LocalizedText, locale: string): string`
  - `LOCALES`, `type Locale`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

Create `src/data/localized-text.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { localizedTextSchema, resolveText } from './localized-text.ts'

test('returns the requested locale', () => {
  assert.equal(resolveText({ de: 'Hallo', en: 'Hello', es: 'Hola' }, 'es'), 'Hola')
})

test('falls back to german when the locale is missing', () => {
  assert.equal(resolveText({ de: 'Hallo' }, 'es'), 'Hallo')
})

test('falls back to german for an unknown locale', () => {
  assert.equal(resolveText({ de: 'Hallo', en: 'Hello' }, 'fr'), 'Hallo')
})

test('never returns an empty string for valid data', () => {
  assert.notEqual(resolveText({ de: 'Hallo' }, 'en'), '')
})

test('requires german', () => {
  assert.throws(() => localizedTextSchema.parse({ en: 'Hello' }))
})

test('rejects an empty german string', () => {
  assert.throws(() => localizedTextSchema.parse({ de: '' }))
})

test('rejects an unknown locale key', () => {
  assert.throws(() => localizedTextSchema.parse({ de: 'Hallo', fr: 'Bonjour' }))
})
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './localized-text.ts'`

- [ ] **Step 3: Implementieren**

Create `src/data/localized-text.ts`:

```ts
import { z } from 'zod'

/** Locales the site is translated into. `de` is the editorial language. */
export const LOCALES = ['de', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]

/** The locale content falls back to. Independent of `routing.defaultLocale`, which governs URLs. */
const FALLBACK_LOCALE: Locale = 'de'

/**
 * A translated string. Only `de` is mandatory, so additional locales can be
 * filled in field by field rather than all at once.
 */
export const localizedTextSchema = z
  .object({
    de: z.string().min(1),
    en: z.string().min(1).optional(),
    es: z.string().min(1).optional(),
  })
  .strict()

export type LocalizedText = z.infer<typeof localizedTextSchema>

/**
 * Resolves a localized string: requested locale, then german, then the first
 * value present. Always returns a non-empty string for schema-valid input.
 */
export function resolveText(text: LocalizedText, locale: string): string {
  const requested = (LOCALES as readonly string[]).includes(locale)
    ? text[locale as Locale]
    : undefined

  return requested ?? text[FALLBACK_LOCALE] ?? Object.values(text).find(Boolean) ?? ''
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm test`
Expected: PASS — 7 neue Tests

- [ ] **Step 5: Schema umhängen**

In `src/data/property-schema.ts`:
- `LOCALES`, `Locale` und `translationMapSchema` entfernen.
- Am Dateianfang ergänzen:

```ts
import { type LocalizedText, localizedTextSchema } from './localized-text.ts'

export { type LocalizedText, localizedTextSchema, LOCALES, type Locale } from './localized-text.ts'
```

- Alle Vorkommen von `translationMapSchema` durch `localizedTextSchema` ersetzen.
- `export type TranslationMap` entfernen.

In `src/data/property-schema.test.ts` den Import von `translationMapSchema` und die beiden Tests
`requires the german translation` / `accepts a translation with german only` entfernen — sie leben
jetzt in `localized-text.test.ts`.

- [ ] **Step 6: `getTranslation` ersetzen**

Run: `rg -n "getTranslation" src`

Jeden Treffer auf `resolveText` umstellen. Die Argumentreihenfolge dreht sich:
`getTranslation(locale, text)` → `resolveText(text, locale)`. Betroffen sind `PropertyCard.tsx:45,46`,
`PropertyDetailsSection.tsx:25,27`, `PropertyDetailItem.tsx:20,21`, `HouseRulesSection.tsx:28,33`,
`AddressCard.tsx`, `LocationDescriptionSection.tsx`, `layout.tsx:23,26`,
`src/components/property/utils.ts:19`.

Import in Komponenten: `import { resolveText } from '@/data/localized-text'`.

`getTranslation` aus `src/components/property/utils.ts` entfernen; `convertDescription` und
`isTranslatedText` bleiben vorerst und verschwinden in Task 9.

- [ ] **Step 7: Alles prüfen und committen**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm build`
Expected: alles fehlerfrei.

```bash
git add src/data src/components src/app
git commit -m "refactor: resolve localized text through an explicit fallback chain"
```

---

### Task 8: Content-Blöcke mit Diskriminator

> **Task 8 und Task 9 werden gemeinsam ausgeführt und gemeinsam abgenommen.** Task 8 ersetzt
> `descriptionSchema` durch `contentBlocksSchema` und entfernt den Typ `Description`. Genau darauf
> arbeitet aber `src/components/property/utils.ts:8-24` (`'bulletpoints' in item`, `item.text`), und
> die Sections rufen `convertDescription` auf. Task 8 allein bricht deshalb `pnpm check-types`;
> repariert wird es erst durch Task 9. Es ist derselbe Zuschnittfehler wie beim iCal-Feld: Schema,
> Daten und lesende Komponente müssen zusammen wechseln. Die Schrittfolge unten bleibt gültig,
> Task 9 schließt direkt an, und erst am Ende von Task 9 müssen Typcheck, Tests und Build grün sein.

**Files:**
- Create: `scripts/migrations/2026-08-14-stage2-content-blocks.mjs`
- Modify: `src/data/property-schema.ts` (`descriptionSchema` ersetzen)
- Modify: `src/data/property-schema.test.ts`
- Modify: `src/data/properties/apartment.json`, `src/data/properties/house.json` (per Skript)

**Interfaces:**
- Consumes: `localizedTextSchema` (Task 7).
- Produces:
  - `contentBlockSchema`, `type PropertyContentBlock`
  - `contentBlocksSchema = z.array(contentBlockSchema)`
  - Der Name ist bewusst `PropertyContentBlock`, weil `ContentBlock` bereits von
    `src/types/ContentBlock.ts` und der Komponente `src/components/shared/ContentBlock/` belegt ist.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

An `src/data/property-schema.test.ts` anhängen:

```ts
import { contentBlockSchema } from './property-schema.ts'

test('accepts a paragraph block', () => {
  const block = contentBlockSchema.parse({ type: 'paragraph', text: { de: 'Text' } })
  assert.equal(block.type, 'paragraph')
})

test('accepts a list block with an intro', () => {
  const block = contentBlockSchema.parse({
    type: 'list',
    intro: { de: 'Einleitung' },
    items: [{ de: 'Erster Punkt' }],
  })
  assert.equal(block.type, 'list')
})

test('accepts a list block without an intro', () => {
  assert.doesNotThrow(() => contentBlockSchema.parse({ type: 'list', items: [{ de: 'Punkt' }] }))
})

test('rejects a list block without items', () => {
  assert.throws(() => contentBlockSchema.parse({ type: 'list', items: [] }))
})

test('accepts a note block', () => {
  const block = contentBlockSchema.parse({
    type: 'note',
    variant: 'warning',
    text: { de: 'Haustiere sind nicht gestattet.' },
  })
  assert.equal(block.type, 'note')
})

test('rejects a block without a type', () => {
  assert.throws(() => contentBlockSchema.parse({ text: { de: 'Text' } }))
})

test('rejects an unknown block type', () => {
  assert.throws(() => contentBlockSchema.parse({ type: 'video', text: { de: 'Text' } }))
})
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `contentBlockSchema is not exported`

- [ ] **Step 3: Schema implementieren**

In `src/data/property-schema.ts` `descriptionItemSchema` und `descriptionSchema` ersetzen durch:

```ts
/**
 * A block of editorial content. Discriminated by `type` so new block kinds can
 * be added without touching existing data or breaking the renderer.
 */
export const contentBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: localizedTextSchema }).strict(),
  z
    .object({
      type: z.literal('list'),
      intro: localizedTextSchema.optional(),
      items: z.array(localizedTextSchema).min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal('note'),
      variant: z.enum(['info', 'warning']),
      text: localizedTextSchema,
    })
    .strict(),
])

export type PropertyContentBlock = z.infer<typeof contentBlockSchema>

export const contentBlocksSchema = z.array(contentBlockSchema).min(1)
```

Alle Verwendungen von `descriptionSchema` durch `contentBlocksSchema` ersetzen:
`propertySchema.description`, `locationSchema.description`, `houseRulesSchema.description`.
`export type Description` entfernen.

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm test`
Expected: PASS für die neuen Blocktests. Die Tests aus Task 1, die `description: [validTranslation]`
verwenden, schlagen jetzt fehl — in `property-schema.test.ts` in `validProperty` beide
`description`-Felder auf `[{ type: 'paragraph', text: validTranslation }]` ändern, danach PASS.

- [ ] **Step 5: Migrationsskript schreiben**

Create `scripts/migrations/2026-08-14-stage2-content-blocks.mjs`:

```js
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
```

- [ ] **Step 6: Skript ausführen und Ergebnis prüfen**

Run: `node scripts/migrations/2026-08-14-stage2-content-blocks.mjs`
Expected: `converted apartment`, `converted house`, `note blocks created: 1`
(der Haustier-Hinweis in `apartment.json`).

Run: `pnpm test`
Expected: PASS — `data.test.ts` parst beide Dateien gegen das neue Schema.

- [ ] **Step 7: Commit**

```bash
git add src/data scripts/migrations
git commit -m "refactor: model editorial content as discriminated blocks"
```

---

### Task 9: Content-Blöcke rendern

**Die geteilte `ContentBlock`-Komponente bleibt unangetastet.** Sie rendert einfache Strings und
wird außerhalb des Objektbereichs an zwölf Stellen genutzt: `src/app/[locale]/privacy/page.tsx`
(acht), `src/app/[locale]/imprint/page.tsx` (drei) und `src/components/shared/RichText/RichText.tsx`
(eine) — alle übergeben `t()`-Ergebnisse, keine `LocalizedText`. Sie umzuwidmen würde drei
unbeteiligte Seiten brechen. Der Objekt-Renderer bekommt deshalb eine eigene Komponente; die beiden
haben unterschiedliche Eingaben und gehören getrennt. Aus demselben Grund bleibt auch
`src/types/ContentBlock.ts` bestehen — die geteilte Komponente braucht ihn.

**Files:**
- Create: `src/components/property/content/PropertyContent.tsx`
- Modify: `src/components/property/sections/descriptionSection/DescriptionSection.tsx`
- Modify: `src/components/property/sections/locationDescriptionSection/LocationDescriptionSection.tsx`
- Modify: `src/components/property/sections/houseRulesSection/HouseRulesSection.tsx:53`
- Delete: `src/components/property/utils.ts`

**Interfaces:**
- Consumes: `PropertyContentBlock` (Task 8), `resolveText` (Task 7).
- Produces: `PropertyContent` mit `blocks: PropertyContentBlock[]`.

- [ ] **Step 1: Objekt-Renderer anlegen**

Create `src/components/property/content/PropertyContent.tsx`:

```tsx
import { List, P } from '@/components/ui'
import { resolveText } from '@/data/localized-text'
import type { PropertyContentBlock } from '@/data/property-schema'
import { useLocale } from 'next-intl'
import { twMerge } from 'tailwind-merge'

export type PropertyContentProps = {
  blocks: PropertyContentBlock[]
}

/**
 * Renders the editorial blocks of a property. Distinct from the shared
 * ContentBlock component, which renders plain strings for the legal pages.
 */
export const PropertyContent = (props: PropertyContentProps) => {
  const { blocks } = props
  const locale = useLocale()

  return (
    <div className='flex flex-col gap-4 prose max-w-none'>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <P
                key={index}
                dangerouslySetInnerHTML={{ __html: resolveText(block.text, locale) }}
              />
            )

          case 'list':
            return (
              <div key={index}>
                {block.intro && (
                  <P dangerouslySetInnerHTML={{ __html: resolveText(block.intro, locale) }} />
                )}
                <List>
                  {block.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      dangerouslySetInnerHTML={{ __html: resolveText(item, locale) }}
                    />
                  ))}
                </List>
              </div>
            )

          case 'note':
            return (
              <div
                key={index}
                className={twMerge([
                  'rounded-md border-l-4 px-4 py-3',
                  block.variant === 'warning'
                    ? 'border-destructive bg-destructive/5'
                    : 'border-primary bg-primary/5',
                ])}
              >
                <P
                  className='!mt-0 !mb-0'
                  dangerouslySetInnerHTML={{ __html: resolveText(block.text, locale) }}
                />
              </div>
            )
        }
      })}
    </div>
  )
}
```

**`dangerouslySetInnerHTML` bleibt — bewusste Entscheidung, kein Versehen.** Begründung (vom
Auftraggeber bestätigt): die Texte sollen Inline-Auszeichnung wie `<strong>` oder `<em>` tragen
können. Die Daten stammen ausschließlich aus dem eigenen Repository und durchlaufen keinen
Nutzereingabe-Pfad — es gibt keine Route, über die Fremdtext in ein `LocalizedText` gelangt. Diese
Begründung gehört als Kommentar in die Komponente, damit sie nicht bei jedem Review neu diskutiert
wird:

```tsx
/**
 * Content is authored in this repository and never sourced from user input, so
 * inline markup (<strong>, <em>) in the texts is rendered on purpose. Any future
 * path that lets third-party text reach a LocalizedText must sanitize first.
 */
```

- [ ] **Step 2: Aufrufer umstellen**

Run: `rg -n "convertDescription" src`

Genau drei Dateien im Objektbereich rufen es auf. Jeden Treffer der Form

```tsx
<ContentBlock items={convertDescription(locale, propertyConfig.description)} />
```

ersetzen durch

```tsx
<PropertyContent blocks={propertyConfig.description} />
```

Betroffen: `DescriptionSection.tsx`, `LocationDescriptionSection.tsx`,
`HouseRulesSection.tsx:53` (dort `blocks={houseRules.description}`). Dabei den Import von
`@/components/shared/ContentBlock/ContentBlock` durch
`@/components/property/content/PropertyContent` ersetzen. Wo `useLocale()` danach ungenutzt ist,
den Aufruf und den Import entfernen.

**Nicht anfassen:** `privacy/page.tsx`, `imprint/page.tsx` und `RichText.tsx` verwenden weiterhin
die geteilte `ContentBlock`-Komponente mit `items`. Sie bleiben unverändert.

- [ ] **Step 3: Tote Datei löschen**

```bash
git rm src/components/property/utils.ts
```

Run: `rg -n "property/utils" src`
Expected: keine Treffer.

Run: `rg -n "ContentBlock" src -g '!*.test.ts'`
Expected: nur noch die geteilte Komponente selbst, `src/types/ContentBlock.ts`, `RichText.tsx`,
`privacy/page.tsx` und `imprint/page.tsx` — keine Treffer mehr unter `src/components/property/`.

- [ ] **Step 4: Prüfen**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm build`
Expected: alles fehlerfrei.

Run: `pnpm dev`, `http://localhost:3000/de/property/apartment` öffnen.
Erwartet: Beschreibung, Listen und Lagetext wie zuvor; der Haustier-Hinweis erscheint jetzt als
hervorgehobener Block mit linkem Rahmen und ohne das Präfix „Wichtiger Hinweis:".

- [ ] **Step 5: Commit**

Das `git rm` aus Schritt 3 hat die Löschung bereits gestaged.

```bash
git add src/components
git commit -m "feat: render content blocks by type and highlight notes"
```

---

### Task 10: Bilder als Objekte mit Dimensionen

> **Task 10 und Task 11 werden gemeinsam ausgeführt und gemeinsam abgenommen.** Task 10 ersetzt
> `imageSources` durch `images` in Schema und Daten. Darauf greifen aber `PropertyImageGrid.tsx`,
> `PropertyView.tsx:24`, `PropertyCard.tsx` und `layout.tsx` zu; repariert wird das erst in Task 11.
> Derselbe Zuschnittfehler wie beim iCal-Feld und bei den Content-Blöcken: Schema, Daten und lesende
> Komponenten müssen zusammen wechseln. Der Typcheck darf zwischen den beiden Hälften rot sein, am
> Ende von Task 11 muss alles grün sein.

**Files:**
- Create: `scripts/images-sync.mjs`
- Create: `scripts/migrations/2026-08-14-stage2-images.mjs`
- Modify: `src/data/property-schema.ts` (`imageSources` → `images`)
- Modify: `src/data/property-schema.test.ts`
- Modify: `package.json` (Skript `images:sync`)
- Modify: `src/data/properties/*.json` (per Skript)

**Interfaces:**
- Consumes: `localizedTextSchema` (Task 7).
- Produces: `images: { cover: PropertyImage; gallery: PropertyImage[] }` mit
  `PropertyImage = { src: string; width: number; height: number; alt?: LocalizedText; category?: ImageCategory }`.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

An `src/data/property-schema.test.ts` anhängen:

```ts
import { imagesSchema } from './property-schema.ts'

const validImage = { src: '/images/apartment/coverPhoto.webp', width: 1600, height: 1067 }

const validGallery = Array.from({ length: 4 }, () => validImage)

test('accepts images with a cover and a gallery', () => {
  const parsed = imagesSchema.parse({ cover: validImage, gallery: validGallery })
  assert.equal(parsed.cover.width, 1600)
})

test('rejects a source outside the images directory', () => {
  assert.throws(() => imagesSchema.parse({ cover: { ...validImage, src: '/other/x.webp' }, gallery: [] }))
})

test('rejects a non-positive dimension', () => {
  assert.throws(() => imagesSchema.parse({ cover: { ...validImage, width: 0 }, gallery: [] }))
})

test('requires at least four gallery images for the grid', () => {
  assert.throws(() => imagesSchema.parse({ cover: validImage, gallery: [validImage] }))
})

test('accepts an optional alt text and category', () => {
  assert.doesNotThrow(() =>
    imagesSchema.parse({
      cover: validImage,
      gallery: Array.from({ length: 4 }, () => ({
        ...validImage,
        alt: { de: 'Wohnzimmer' },
        category: 'living',
      })),
    }),
  )
})
```

Der vierte Test macht die bisher implizite Annahme explizit: `PropertyImageGrid` rendert vier
Vorschaubilder neben dem Cover.

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `imagesSchema is not exported`

- [ ] **Step 3: Schema implementieren**

In `src/data/property-schema.ts` `imageSources` ersetzen. Vor `propertySchema` ergänzen:

```ts
const imageCategorySchema = z.enum([
  'exterior', 'living', 'bedroom', 'kitchen', 'bathroom', 'outdoor', 'pool', 'surroundings',
])

const imageSchema = z
  .object({
    src: z.string().startsWith('/images/'),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    /** Optional; the UI falls back to the property title. */
    alt: localizedTextSchema.optional(),
    category: imageCategorySchema.optional(),
  })
  .strict()

export const imagesSchema = z
  .object({
    cover: imageSchema,
    /** At least four, because PropertyImageGrid renders four thumbnails next to the cover. */
    gallery: z.array(imageSchema).min(4),
  })
  .strict()
```

In `propertySchema` die Zeile `imageSources: …` ersetzen durch `images: imagesSchema,`.

- [ ] **Step 4: Test laufen lassen**

Run: `pnpm test`
Expected: PASS für die Bildtests. `validProperty` in `property-schema.test.ts` von `imageSources` auf
`images: { cover: validImage, gallery: Array.from({ length: 4 }, () => validImage) }` umstellen.

- [ ] **Step 5: `images-sync.mjs` schreiben**

Create `scripts/images-sync.mjs`:

```js
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

let problems = 0

for (const id of ['apartment', 'house']) {
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
```

- [ ] **Step 6: Migrationsskript schreiben und ausführen**

Create `scripts/migrations/2026-08-14-stage2-images.mjs`:

```js
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
```

Run:

```bash
node scripts/migrations/2026-08-14-stage2-images.mjs
node scripts/images-sync.mjs
```

Expected: `apartment: 1 cover + 41 gallery images`, `house: 1 cover + 70 gallery images`, danach
`all images consistent`. Meldet das Skript Dateien „on disk but not in the data", diese Liste
festhalten und der nutzenden Person melden — nicht automatisch anhängen, die Reihenfolge ist
redaktionell.

- [ ] **Step 7: `package.json` und ESLint ergänzen**

In `scripts` nach `"test"` einfügen:

```json
"images:sync": "node scripts/images-sync.mjs",
```

`images-sync.mjs` ist das erste Skript, das dauerhaft im Repo bleibt. ESLint kennt für `scripts/`
bislang keine Node-Globals, weshalb jedes `process`, `console` und `URL` dort eine
`no-undef`-Warnung erzeugt. In `eslint.config.js` einen Override ergänzen — `globals` ist bereits
als devDependency vorhanden:

```js
{
  files: ['scripts/**/*.{js,mjs}', '*.config.{js,mjs}'],
  languageOptions: {
    globals: globals.node,
  },
},
```

Run: `pnpm lint`
Expected: 0 Fehler und weniger Warnungen als vorher — die `no-undef`-Warnungen aus `scripts/` und
`postcss.config.js` sind verschwunden.

- [ ] **Step 8: Prüfen und committen**

Run: `pnpm test`
Expected: PASS — `data.test.ts` parst beide Dateien gegen das neue Bildschema.

```bash
git add src/data scripts package.json
git commit -m "refactor: model images as objects with intrinsic dimensions"
```

---

### Task 11: Bildkomponenten umstellen

**Files:**
- Modify: `src/components/property/images/PropertyImageGrid.tsx` (komplett)
- Modify: `src/components/property/PropertyView.tsx:24`
- Modify: `src/components/shared/PropertyCard/PropertyCard.tsx:29-36`
- Modify: `src/app/[locale]/property/[slug]/layout.tsx:28-33`

**Interfaces:**
- Consumes: `images` aus dem Schema (Task 10), `resolveText` (Task 7).
- Produces: `PropertyImageGrid` nimmt `images: Property['images']` und `fallbackAlt: string`.

- [ ] **Step 1: `PropertyImageGrid` umstellen**

In `src/components/property/images/PropertyImageGrid.tsx`:

Zeilen 3 und 18–25 ersetzen:

```tsx
import type { Property } from '@/data/property-schema'
import { resolveText } from '@/data/localized-text'
import { useLocale } from 'next-intl'

export type PropertyImageGridProps = {
  images: Property['images']
  fallbackAlt: string
}

export const PropertyImageGrid = (props: PropertyImageGridProps) => {
  const { images, fallbackAlt } = props
  const locale = useLocale()

  const allImages = [images.cover, ...images.gallery]
  const [selectedIndex, setSelectedIndex] = useState(0)

  const altFor = (image: Property['images']['cover']) =>
    image.alt ? resolveText(image.alt, locale) : fallbackAlt
```

In `handlePrevClick`/`handleNextClick` `imageSources.length` durch `allImages.length` ersetzen.

Das Cover (Zeilen 50–57):

```tsx
<Image
  fill
  priority
  src={images.cover.src}
  alt={altFor(images.cover)}
  className='object-cover hover:brightness-75 transition-all'
  sizes='(max-width: 768px) 100vw, 50vw'
/>
```

Die vier Vorschaubilder (Zeilen 61–77):

```tsx
{images.gallery.slice(0, 4).map((image) => (
  <div
    key={image.src}
    className='relative'
  >
    <Image
      fill
      src={image.src}
      alt={altFor(image)}
      className='object-cover hover:brightness-75 transition-all'
      sizes='(max-width: 768px) 50vw, 25vw'
    />
  </div>
))}
```

Der Dialogzähler (Zeile 86): `{selectedIndex + 1} / {allImages.length}`.

Das große Bild (Zeilen 99–103) — jetzt mit bekannten Dimensionen statt `<img>`:

```tsx
<Image
  src={allImages[selectedIndex]!.src}
  alt={altFor(allImages[selectedIndex]!)}
  width={allImages[selectedIndex]!.width}
  height={allImages[selectedIndex]!.height}
  className='max-w-full max-h-full w-auto h-auto rounded-xl object-contain'
  sizes='100vw'
/>
```

Das `!` ist nötig, weil `noUncheckedIndexedAccess` aktiv ist; `selectedIndex` bleibt durch beide
Handler im gültigen Bereich.

- [ ] **Step 2: `PropertyView` anpassen**

Zeile 24 ersetzen:

```tsx
<PropertyImageGrid
  images={configuration.images}
  fallbackAlt={resolveText(configuration.title, locale)}
/>
```

`PropertyView` braucht dafür `const locale = useLocale()` und die Importe für `useLocale` und
`resolveText`.

- [ ] **Step 3: `PropertyCard` auf das Cover aus den Daten umstellen**

Zeilen 29–36 ersetzen — der hartcodierte Pfad `/images/${id}/coverPhoto.webp` entfällt:

```tsx
<Image
  fill
  src={propertyConfiguration.images.cover.src}
  alt={resolveText(propertyConfiguration.title, locale)}
  className='object-cover transition-transform duration-700 group-hover:scale-110'
  quality={80}
  sizes='(max-width: 40rem) 90vw, 350px'
/>
```

Außerdem Zeile 71 auf den Slug umstellen: `href={`/property/${propertyConfiguration.slug}`}`.

- [ ] **Step 4: Open-Graph-Bild aus den Daten nehmen**

In `src/app/[locale]/property/[slug]/layout.tsx` die Zeilen 27–33 ersetzen:

```ts
url: `https://solymarmenor.com/property/${propertyConfiguration.slug}`,
images: [
  {
    url: `https://solymarmenor.com${propertyConfiguration.images.cover.src}`,
    width: propertyConfiguration.images.cover.width,
    height: propertyConfiguration.images.cover.height,
  },
],
```

- [ ] **Step 5: Prüfen**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm build`
Expected: alles fehlerfrei.

Run: `pnpm dev`

1. Startseite: beide Karten zeigen ihr Titelbild.
2. Objektseite: Bildraster wie zuvor, Lightbox durchblätterbar, Zähler stimmt.
3. In den DevTools unter *Network* prüfen, dass die Bilder mit `width`/`height`-Attributen
   ausgeliefert werden und beim Laden kein Layout-Shift auftritt (Lighthouse: CLS).

- [ ] **Step 6: Commit**

```bash
git add src/components src/app
git commit -m "feat: render images from data with alt text and dimensions"
```

**Etappe 2 ist hier abgeschlossen und deploybar.**

---

# Etappe 3 — Struktur

---

### Task 12: `propertyDetails` → `highlights`

**Files:**
- Create: `src/data/highlight-keys.ts`
- Create: `scripts/migrations/2026-08-14-stage3-highlights.mjs`
- Modify: `src/data/property-schema.ts`
- Modify: `src/data/property-schema.test.ts`
- Modify: `src/components/property/sections/propertyDetailsSection/PropertyDetailsSection.tsx:29-34`
- Modify: `src/components/property/sections/propertyDetailsSection/PropertyDetailItem.tsx` (komplett)
- Modify: `src/components/shared/PropertyCard/PropertyCard.tsx:22-23,48-59`

**Interfaces:**
- Consumes: `localizedTextSchema` (Task 7), `IconType`.
- Produces:
  - `HIGHLIGHT_KEYS`, `type HighlightKey`, `DEFAULT_HIGHLIGHT_ICONS` aus `src/data/highlight-keys.ts`
  - `highlightSchema`, `type PropertyHighlight` aus `src/data/property-schema.ts`

- [ ] **Step 1: Registry anlegen**

Create `src/data/highlight-keys.ts`:

```ts
import type { IconType } from '../types/IconType.ts'

/** The facts shown as the summary row on a property page. */
export const HIGHLIGHT_KEYS = ['guests', 'bedrooms', 'beds', 'bathrooms', 'area'] as const
export type HighlightKey = (typeof HIGHLIGHT_KEYS)[number]

export const DEFAULT_HIGHLIGHT_ICONS = {
  guests: 'group',
  bedrooms: 'bed',
  beds: 'bed',
  bathrooms: 'bathtub',
  area: 'area_size',
} as const satisfies Record<HighlightKey, IconType>
```

- [ ] **Step 2: Den fehlschlagenden Test schreiben**

An `src/data/property-schema.test.ts` anhängen:

```ts
import { highlightsSchema } from './property-schema.ts'

const guests = { key: 'guests', icon: 'group', value: 4, label: { de: 'Gäste' } }

test('accepts a highlight', () => {
  assert.equal(highlightsSchema.parse([guests])[0]?.value, 4)
})

test('accepts a highlight with a unit', () => {
  assert.doesNotThrow(() =>
    highlightsSchema.parse([{ key: 'area', icon: 'area_size', value: 95, unit: 'sqm', label: { de: 'Fläche' } }]),
  )
})

test('rejects an unknown highlight key', () => {
  assert.throws(() => highlightsSchema.parse([{ ...guests, key: 'sauna' }]))
})

test('rejects a duplicated highlight key', () => {
  assert.throws(() => highlightsSchema.parse([guests, guests]))
})

test('rejects a zero value', () => {
  assert.throws(() => highlightsSchema.parse([{ ...guests, value: 0 }]))
})
```

- [ ] **Step 3: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `highlightsSchema is not exported`

- [ ] **Step 4: Schema implementieren**

In `src/data/property-schema.ts` `propertyDetailSchema` ersetzen:

```ts
import { HIGHLIGHT_KEYS } from './highlight-keys.ts'

const highlightSchema = z
  .object({
    /** Carries the meaning; `icon` only carries the presentation. */
    key: z.enum(HIGHLIGHT_KEYS),
    icon: iconTypeSchema,
    value: z.number().int().positive(),
    unit: z.enum(['sqm']).optional(),
    label: localizedTextSchema,
    /** Only for values the UI cannot derive from `value` and `unit`. */
    caption: localizedTextSchema.optional(),
  })
  .strict()

export type PropertyHighlight = z.infer<typeof highlightSchema>

export const highlightsSchema = z
  .array(highlightSchema)
  .min(1)
  .refine(
    (highlights) => new Set(highlights.map((highlight) => highlight.key)).size === highlights.length,
    { message: 'each highlight key may appear only once' },
  )
```

In `propertySchema` `propertyDetails: …` durch `highlights: highlightsSchema,` ersetzen.

- [ ] **Step 5: Test laufen lassen**

Run: `pnpm test`
Expected: PASS. `validProperty` in `property-schema.test.ts` von `propertyDetails` auf
`highlights: [guests]` umstellen.

- [ ] **Step 6: Migrationsskript schreiben und ausführen**

Create `scripts/migrations/2026-08-14-stage3-highlights.mjs`:

```js
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
```

Run: `node scripts/migrations/2026-08-14-stage3-highlights.mjs`
Expected: zwei Zeilen plus der UNCONFIRMED-Hinweis. Den Hinweis an die nutzende Person weitergeben.

- [ ] **Step 7: `PropertyDetailItem` umstellen**

Replace `src/components/property/sections/propertyDetailsSection/PropertyDetailItem.tsx` entirely:

```tsx
import { IconWithText } from '@/components/property/components/IconWithText'
import { iconMapping } from '@/components/property/iconMapping'
import { resolveText } from '@/data/localized-text'
import type { PropertyHighlight } from '@/data/property-schema'
import { useLocale, useTranslations } from 'next-intl'

export type PropertyDetailItemProps = {
  highlight: PropertyHighlight
}

export const PropertyDetailItem = (props: PropertyDetailItemProps) => {
  const { highlight } = props

  const locale = useLocale()
  const t = useTranslations('pages.property.highlights')
  const Icon = iconMapping[highlight.icon]

  const description = highlight.caption
    ? resolveText(highlight.caption, locale)
    : t(highlight.unit === 'sqm' ? 'valueSqm' : 'value', { value: highlight.value })

  return (
    <IconWithText
      icon={Icon}
      label={resolveText(highlight.label, locale)}
      description={description}
    />
  )
}
```

- [ ] **Step 8: Messages ergänzen**

In `public/locales/de.json` unter `pages.property` einfügen:

```json
"highlights": {
  "value": "{value}",
  "valueSqm": "{value} m²"
}
```

In `en.json` und `es.json` identisch (die Werte sind sprachneutral; der Eintrag existiert, damit
Formatzahlen später je Sprache angepasst werden können).

- [ ] **Step 9: `PropertyDetailsSection` und `PropertyCard` umstellen**

`PropertyDetailsSection.tsx`: Zeile 14 `propertyDetails` → `highlights`, Zeilen 29–34:

```tsx
{highlights.map((highlight) => (
  <PropertyDetailItem
    key={highlight.key}
    highlight={highlight}
  />
))}
```

`PropertyCard.tsx`: Zeilen 22–23 ersetzen:

```tsx
const guests = propertyConfiguration.highlights.find((highlight) => highlight.key === 'guests')
const beds = propertyConfiguration.highlights.find((highlight) => highlight.key === 'beds')
```

und in Zeilen 48–59 `bedPropertySummary`/`groupPropertySummary` durch `beds`/`guests` sowie
`.amount` durch `.value` ersetzen.

- [ ] **Step 10: Prüfen und committen**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm build`
Run: `pnpm dev` — Objektseite zeigt fünf Kennzahlen (Haus vier), Startseitenkarten zeigen Betten und
Gäste wie zuvor.

Erwartete sichtbare Änderung: Die Aufteilung dreht sich. Bisher stand oben „Schlafzimmer" und
darunter „4 Betten"; jetzt trägt die Beschriftung das Substantiv (`Betten`) und die Zeile darunter
den Wert (`4`). Die Wohnung zeigt zusätzlich `Schlafzimmer: 2`, was bisher fehlte. Ist das
unerwünscht, ist `caption` je Highlight der vorgesehene Weg zurück zu einem freien Text — dann in
dieser Task melden statt das Schema zu ändern.

```bash
git add src/data src/components public/locales scripts/migrations
git commit -m "refactor: replace property details with keyed highlights"
```

---

### Task 13: Amenity-Registry und flache Liste

**Files:**
- Create: `src/data/amenities.ts`
- Create: `src/data/amenities.test.ts`
- Create: `scripts/migrations/2026-08-14-stage3-amenities.mjs`
- Modify: `src/data/property-schema.ts`
- Modify: `src/components/property/sections/amenitiesSection/AmenitiesSection.tsx` (komplett)
- Modify: `src/components/shared/PropertyCard/PropertyCard.tsx:61-66`

**Interfaces:**
- Consumes: `IconType`.
- Produces:
  - `AMENITIES: Record<AmenityKey, { category: AmenityCategory; icon: IconType }>`
  - `AMENITY_KEYS`, `type AmenityKey`
  - `AMENITY_CATEGORY_ORDER`, `type AmenityCategory`
  - `groupAmenitiesByCategory(keys: AmenityKey[]): Array<{ category: AmenityCategory; keys: AmenityKey[] }>`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

Create `src/data/amenities.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { AMENITIES, AMENITY_CATEGORY_ORDER, groupAmenitiesByCategory } from './amenities.ts'

test('every amenity has a known category', () => {
  for (const [key, entry] of Object.entries(AMENITIES)) {
    assert.ok(
      (AMENITY_CATEGORY_ORDER as readonly string[]).includes(entry.category),
      `${key} has unknown category ${entry.category}`,
    )
  }
})

test('groups amenities in category order', () => {
  const grouped = groupAmenitiesByCategory(['oven', 'parking', 'pool'])
  assert.deepEqual(
    grouped.map((group) => group.category),
    ['general', 'outdoorArea', 'kitchen'],
  )
})

test('omits categories without amenities', () => {
  const grouped = groupAmenitiesByCategory(['parking'])
  assert.equal(grouped.length, 1)
  assert.deepEqual(grouped[0]?.keys, ['parking'])
})

test('returns nothing for an empty list', () => {
  assert.deepEqual(groupAmenitiesByCategory([]), [])
})
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './amenities.ts'`

- [ ] **Step 3: Registry implementieren**

Create `src/data/amenities.ts`:

```ts
import type { IconType } from '../types/IconType.ts'

/**
 * Display order of amenity categories. The identifiers match the existing
 * next-intl keys under `pages.property.equipmentFeaturesSection.subHeadlines`.
 */
export const AMENITY_CATEGORY_ORDER = [
  'general',
  'outdoorArea',
  'kitchen',
  'bedroom',
  'bathroom',
  'baby',
] as const

export type AmenityCategory = (typeof AMENITY_CATEGORY_ORDER)[number]

/** Adding an amenity means one entry here plus one message key per locale. */
export const AMENITIES = {
  parking: { category: 'general', icon: 'parking' },
  air_conditioner: { category: 'general', icon: 'air_conditioner' },
  wlan: { category: 'general', icon: 'wlan' },
  tv: { category: 'general', icon: 'tv' },
  barrier_free: { category: 'general', icon: 'barrier_free' },
  elevator: { category: 'general', icon: 'elevator' },
  fire_extinguisher: { category: 'general', icon: 'fire_extinguisher' },
  smoke_detector: { category: 'general', icon: 'smoke_detector' },
  vacuum: { category: 'general', icon: 'vacuum' },
  washing_rack: { category: 'general', icon: 'washing_rack' },
  washing_machine: { category: 'general', icon: 'washing_machine' },
  pool: { category: 'outdoorArea', icon: 'pool' },
  balcony: { category: 'outdoorArea', icon: 'balcony' },
  terrace: { category: 'outdoorArea', icon: 'terrace' },
  cooker: { category: 'kitchen', icon: 'cooker' },
  oven: { category: 'kitchen', icon: 'oven' },
  dishes: { category: 'kitchen', icon: 'dishes' },
  pots_pans: { category: 'kitchen', icon: 'pots_pans' },
  coffee_machine: { category: 'kitchen', icon: 'coffee_machine' },
  microwave: { category: 'kitchen', icon: 'microwave' },
  freezer: { category: 'kitchen', icon: 'freezer' },
  refrigerator: { category: 'kitchen', icon: 'refrigerator' },
  kettle: { category: 'kitchen', icon: 'kettle' },
  bed_linen: { category: 'bedroom', icon: 'bed_linen' },
  hairdryer: { category: 'bathroom', icon: 'hairdryer' },
  towels: { category: 'bathroom', icon: 'towels' },
  shower: { category: 'bathroom', icon: 'shower' },
  bathtub: { category: 'bathroom', icon: 'bathtub' },
  baby_bed: { category: 'baby', icon: 'baby_bed' },
  high_chair: { category: 'baby', icon: 'high_chair' },
} as const satisfies Record<string, { category: AmenityCategory; icon: IconType }>

export type AmenityKey = keyof typeof AMENITIES

/**
 * Cast to a non-empty tuple so `z.enum` infers the literal union rather than
 * `string` — without it, `Property['amenities']` degrades to `string[]` and
 * `groupAmenitiesByCategory` no longer accepts it.
 */
export const AMENITY_KEYS = Object.keys(AMENITIES) as [AmenityKey, ...AmenityKey[]]

/** Groups amenity keys by category, in display order, skipping empty categories. */
export function groupAmenitiesByCategory(
  keys: AmenityKey[],
): Array<{ category: AmenityCategory; keys: AmenityKey[] }> {
  return AMENITY_CATEGORY_ORDER.map((category) => ({
    category,
    keys: keys.filter((key) => AMENITIES[key].category === category),
  })).filter((group) => group.keys.length > 0)
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm test`
Expected: PASS — 4 neue Tests

- [ ] **Step 5: Schema umstellen**

In `src/data/property-schema.ts` `amenitiesSchema` ersetzen:

Import an den Dateianfang zu den übrigen Importen:

```ts
import { AMENITY_KEYS } from './amenities.ts'
```

`amenitiesSchema` ersetzen durch:

```ts
const amenitiesSchema = z
  .array(z.enum(AMENITY_KEYS))
  .min(1)
  .refine((keys) => new Set(keys).size === keys.length, { message: 'duplicate amenity key' })
```

`z.enum(AMENITY_KEYS)` liefert dank der Tupel-Typisierung aus Schritt 3 die Literal-Union, sodass
`Property['amenities']` den Typ `AmenityKey[]` hat und direkt an `groupAmenitiesByCategory`
übergeben werden kann.

- [ ] **Step 6: Daten migrieren**

Create `scripts/migrations/2026-08-14-stage3-amenities.mjs`:

```js
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
```

Run: `node --experimental-strip-types scripts/migrations/2026-08-14-stage3-amenities.mjs`
Expected: `apartment: 27 amenities`, `house: 26 amenities`

Das Skript importiert eine `.ts`-Datei, deshalb ist `--experimental-strip-types` hier erforderlich.

- [ ] **Step 7: `AmenitiesSection` als Schleife**

Replace `src/components/property/sections/amenitiesSection/AmenitiesSection.tsx` entirely:

```tsx
import { Section } from '@/components/shared/Section/Section'
import { groupAmenitiesByCategory } from '@/data/amenities'
import type { Property } from '@/data/property-schema'
import { useTranslations } from 'next-intl'

import { AmenityFeaturesBlock } from './AmenityFeaturesBlock'

export type AmenitiesSectionProps = {
  propertyConfig: Property
}

export const AmenitiesSection = (props: AmenitiesSectionProps) => {
  const { propertyConfig } = props
  const t = useTranslations('pages.property.equipmentFeaturesSection')
  const groups = groupAmenitiesByCategory(propertyConfig.amenities)

  return (
    <Section title={t('headline')}>
      <div className='grid grid-cols-2 gap-10'>
        {groups.map((group) => (
          <AmenityFeaturesBlock
            key={group.category}
            headline={t(`subHeadlines.${group.category}`)}
            featureTypes={group.keys}
          />
        ))}
      </div>
    </Section>
  )
}
```

`AmenityFeaturesBlock` bleibt unverändert — sein Generic `T extends IconType` passt, weil jeder
Amenity-Key zugleich ein Icon-Name ist.

- [ ] **Step 8: `PropertyCard`-Badges aus den Daten speisen**

In `PropertyCard.tsx` die vier hartcodierten Badges (Zeilen 61–66) ersetzen:

```tsx
<div className='flex flex-wrap gap-2'>
  {(['pool', 'air_conditioner', 'wlan', 'parking'] as const)
    .filter((key) => propertyConfiguration.amenities.includes(key))
    .map((key) => (
      <Badge
        key={key}
        variant='secondary'
      >
        {tAmenity(key)}
      </Badge>
    ))}
</div>
```

Dafür oben `const tAmenity = useTranslations('pages.property.amenities')` ergänzen und prüfen, ob
dieser Message-Namespace existiert:

Run: `node -e "console.log(Object.keys(require('./public/locales/de.json').pages.property))"`

Existiert kein passender Namespace, stattdessen die bestehenden Keys unter
`pages.home.properties.card` weiterverwenden und die Zuordnung explizit halten:
`{ pool: 'pool', air_conditioner: 'airConditioner', wlan: 'wlan', parking: 'parking' }`.

- [ ] **Step 9: Prüfen und committen**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm build`
Run: `pnpm dev` — Ausstattungsbereich zeigt dieselben Einträge, aber keine leeren Überschriften mehr.

```bash
git add src/data src/components scripts/migrations
git commit -m "refactor: drive amenities from a registry instead of typed categories"
```

---

### Task 14: Preismodell

**Files:**
- Create: `scripts/migrations/2026-08-14-stage3-pricing.mjs`
- Modify: `src/data/property-schema.ts`
- Modify: `src/data/property-schema.test.ts`
- Modify: `src/components/property/bookIt/BookItCard.tsx:1-45`
- Modify: `src/components/property/PropertyView.tsx:38`

**Interfaces:**
- Consumes: nichts Neues.
- Produces: `pricingSchema`, `type PropertyPricing`; Hilfsfunktion
  `isDateInPeriod(period: { from: string; to: string }, date: Date): boolean` in
  `src/data/pricing.ts`.

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

Create `src/data/pricing.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isDateInPeriod } from './pricing.ts'

test('matches a date inside a period within one year', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date('2026-06-15')), true)
})

test('rejects a date outside a period within one year', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date('2026-11-15')), false)
})

test('matches a date in a period that wraps the year end', () => {
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date('2026-01-15')), true)
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date('2026-11-15')), true)
})

test('rejects a date outside a wrapping period', () => {
  assert.equal(isDateInPeriod({ from: '10-01', to: '03-31' }, new Date('2026-06-15')), false)
})

test('includes both boundaries', () => {
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date('2026-04-01')), true)
  assert.equal(isDateInPeriod({ from: '04-01', to: '09-30' }, new Date('2026-09-30')), true)
})
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './pricing.ts'`

- [ ] **Step 3: Implementieren**

Create `src/data/pricing.ts`:

```ts
/** A yearly recurring period, given as `MM-DD` boundaries, both inclusive. */
export type SeasonPeriod = { from: string; to: string }

/**
 * Whether a date falls inside a yearly recurring period. Periods may wrap the
 * year end (e.g. 10-01 to 03-31), in which case the range is the union of
 * [from, 12-31] and [01-01, to].
 */
export function isDateInPeriod(period: SeasonPeriod, date: Date): boolean {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const current = `${month}-${day}`

  if (period.from <= period.to) {
    return current >= period.from && current <= period.to
  }

  return current >= period.from || current <= period.to
}
```

- [ ] **Step 4: Test laufen lassen und Erfolg bestätigen**

Run: `pnpm test`
Expected: PASS — 5 neue Tests

- [ ] **Step 5: Schema erweitern**

In `src/data/property-schema.ts` `priceSchema` ersetzen:

```ts
const seasonPeriodSchema = z
  .object({
    from: z.string().regex(/^\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{2}-\d{2}$/),
  })
  .strict()

const pricingSchema = z
  .object({
    currency: z.literal('EUR'),
    rates: z
      .array(
        z
          .object({
            season: z.enum(['off', 'main', 'peak']),
            pricePerNight: z.number().positive(),
            periods: z.array(seasonPeriodSchema),
          })
          .strict(),
      )
      .min(1),
    fees: z.array(
      z
        .object({
          type: z.enum(['cleaning']),
          amount: z.number().positive(),
          basis: z.enum(['perStay', 'perNight', 'perPerson']),
        })
        .strict(),
    ),
    minNights: z.number().int().min(1).nullable(),
  })
  .strict()

export type PropertyPricing = z.infer<typeof pricingSchema>
```

In `propertySchema` `price: priceSchema` durch `pricing: pricingSchema,` ersetzen.
In `property-schema.test.ts` `validProperty.price` entsprechend auf `pricing` umstellen.

- [ ] **Step 6: Daten migrieren**

Create `scripts/migrations/2026-08-14-stage3-pricing.mjs`:

```js
// One-off: turns the two bare prices into a pricing block.
// The season periods are not new information: BookItCard hard-coded the off
// season as months [9,10,11,0,1,2] and the messages spell it out as
// "Oktober - März" / "April - September".
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'src/data/properties')

for (const id of ['apartment', 'house']) {
  const file = path.join(DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))
  const { perNight, cleaning } = data.price

  delete data.price
  data.pricing = {
    currency: 'EUR',
    rates: [
      { season: 'main', pricePerNight: perNight.mainSeason, periods: [{ from: '04-01', to: '09-30' }] },
      { season: 'off', pricePerNight: perNight.offSeason, periods: [{ from: '10-01', to: '03-31' }] },
    ],
    fees: cleaning ? [{ type: 'cleaning', amount: cleaning, basis: 'perStay' }] : [],
    minNights: null,
  }

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  console.log(`${id}: main ${perNight.mainSeason} €, off ${perNight.offSeason} €`)
}
```

Run: `node scripts/migrations/2026-08-14-stage3-pricing.mjs`
Expected: `apartment: main 85 €, off 70 €`, `house: main 110 €, off 60 €`

- [ ] **Step 7: `BookItCard` umstellen**

In `src/components/property/bookIt/BookItCard.tsx` die Zeilen 1–45 ersetzen:

```tsx
import { isDateInPeriod } from '@/data/pricing'
import type { PropertyPricing } from '@/data/property-schema'
import { Button, Card, CardContent, P, Separator, Small } from '@/components/ui'
import { useTranslations } from 'next-intl'
import { PiEnvelopeOpenLight, PiPhoneCallLight } from 'react-icons/pi'

import { Link } from '../../../i18n/navigation'
import { SeasonPrice } from './SeasonPrice'

export type BookItCardProps = {
  pricing: PropertyPricing
}

export const BookItCard = (props: BookItCardProps) => {
  const { pricing } = props

  const t = useTranslations('pages.property.bookIt')
  const today = new Date()

  const mainRate = pricing.rates.find((rate) => rate.season === 'main')
  const offRate = pricing.rates.find((rate) => rate.season === 'off')
  const cleaning = pricing.fees.find((fee) => fee.type === 'cleaning')?.amount

  const isActive = (rate: PropertyPricing['rates'][number] | undefined) =>
    Boolean(rate?.periods.some((period) => isDateInPeriod(period, today)))

  return (
    <Card>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-2 gap-2'>
          {mainRate && (
            <SeasonPrice
              isActive={isActive(mainRate)}
              price={mainRate.pricePerNight}
              seasonRange={t('mainSeason.range')}
              seasonType='main'
              title={t('mainSeason.title')}
            />
          )}
          {offRate && (
            <SeasonPrice
              isActive={isActive(offRate)}
              price={offRate.pricePerNight}
              seasonRange={t('offSeason.range')}
              seasonType='off'
              title={t('offSeason.title')}
            />
          )}
        </div>
        {cleaning && (
          <div className='p-2 bg-gray-50 rounded-md flex items-center'>
            <P>{t('cleaning.text', { cleaning })}</P>
            <Small className='text-muted-foreground pl-2'>{t('cleaning.once')}</Small>
          </div>
        )}
```

Die hartcodierte Monatsliste `[9, 10, 11, 0, 1, 2]` entfällt damit — welche Saison aktiv ist, steht
jetzt in den Daten.

- [ ] **Step 8: `PropertyView` anpassen**

Zeile 38: `<BookItCard pricing={configuration.pricing} />`

- [ ] **Step 9: Prüfen und committen**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm build`
Run: `pnpm dev` — die Buchungskarte hebt dieselbe Saison hervor wie zuvor (im August: Hauptsaison).

```bash
git add src/data src/components scripts/migrations
git commit -m "refactor: model pricing with currency, seasons and fees"
```

---

### Task 15: Check-in-Zeiten als Werte

**Files:**
- Create: `scripts/migrations/2026-08-14-stage3-house-rules.mjs`
- Modify: `src/data/property-schema.ts`
- Modify: `src/data/property-schema.test.ts`
- Modify: `src/components/property/sections/houseRulesSection/HouseRulesSection.tsx:25-35`
- Modify: `public/locales/{de,en,es}.json`

**Interfaces:**
- Consumes: `contentBlocksSchema` (Task 8).
- Produces: `houseRules: { checkInFrom: string; checkOutUntil: string; rules: […]; notes?: PropertyContentBlock[] }`

- [ ] **Step 1: Den fehlschlagenden Test schreiben**

An `src/data/property-schema.test.ts` anhängen:

```ts
import { houseRulesSchema } from './property-schema.ts'

const validRules = { checkInFrom: '15:00', checkOutUntil: '11:00', rules: ['party'] }

test('accepts house rules with times', () => {
  assert.equal(houseRulesSchema.parse(validRules).checkInFrom, '15:00')
})

test('rejects a time that is not HH:MM', () => {
  assert.throws(() => houseRulesSchema.parse({ ...validRules, checkInFrom: '15 Uhr' }))
})

test('rejects an impossible hour', () => {
  assert.throws(() => houseRulesSchema.parse({ ...validRules, checkInFrom: '25:00' }))
})

test('accepts optional notes', () => {
  assert.doesNotThrow(() =>
    houseRulesSchema.parse({ ...validRules, notes: [{ type: 'paragraph', text: { de: 'Hinweis' } }] }),
  )
})
```

- [ ] **Step 2: Test laufen lassen und Fehlschlag bestätigen**

Run: `pnpm test`
Expected: FAIL — `houseRulesSchema is not exported`

- [ ] **Step 3: Schema implementieren**

In `src/data/property-schema.ts` `houseRulesSchema` ersetzen und exportieren:

```ts
/** 24-hour clock time, `HH:MM`. The UI formats the localized sentence around it. */
const timeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

export const houseRulesSchema = z
  .object({
    checkInFrom: timeOfDaySchema,
    checkOutUntil: timeOfDaySchema,
    rules: z.array(z.enum(['pet', 'party', 'smoking'])),
    notes: contentBlocksSchema.optional(),
  })
  .strict()
```

`validProperty.houseRules` in `property-schema.test.ts` entsprechend anpassen.

- [ ] **Step 4: Test laufen lassen**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Daten migrieren**

Create `scripts/migrations/2026-08-14-stage3-house-rules.mjs`:

```js
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
```

Run: `node scripts/migrations/2026-08-14-stage3-house-rules.mjs`
Expected: beide Zeilen mit `check-in 15:00, check-out 11:00`. Bricht das Skript mit
„locales disagree" ab, ist das ein echter Datenfehler — die betroffene Übersetzung korrigieren und
erneut ausführen.

- [ ] **Step 6: Messages ergänzen**

In `public/locales/de.json` unter `pages.property.houseRulesSection` einfügen:

```json
"checkinTime": "ab {time} Uhr",
"checkoutTime": "vor {time} Uhr"
```

`en.json`:

```json
"checkinTime": "from {time}",
"checkoutTime": "before {time}"
```

`es.json`:

```json
"checkinTime": "desde las {time}",
"checkoutTime": "antes de las {time}"
```

- [ ] **Step 7: `HouseRulesSection` umstellen**

Die Zeilen 25–35 ersetzen:

```tsx
<IconWithText
  icon={iconMapping['checkin']}
  label={t('itemHeadlines.checkin')}
  description={t('checkinTime', { time: houseRules.checkInFrom })}
/>
<IconWithText
  icon={iconMapping['checkout']}
  label={t('itemHeadlines.checkout')}
  description={t('checkoutTime', { time: houseRules.checkOutUntil })}
/>
```

Zeile 53: `houseRules.description` → `houseRules.notes`.
`resolveText` und `useLocale` entfernen, falls danach ungenutzt.

- [ ] **Step 8: Prüfen und committen**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm build`
Run: `pnpm dev` — Hausregeln zeigen „Check-in / ab 15:00 Uhr" und „Check-out / vor 11:00 Uhr".
Sprache auf Englisch und Spanisch umschalten und beide Zeilen prüfen.

```bash
git add src/data src/components public/locales scripts/migrations
git commit -m "refactor: store check-in times as values instead of sentences"
```

---

### Task 16: Inhaltsvalidierung und Aufräumen

**Files:**
- Create: `scripts/validate-content.mjs`
- Modify: `package.json`
- Delete: `scripts/migrations/`

**Interfaces:**
- Consumes: `properties` (Task 3), `AMENITIES` (Task 13).
- Produces: `pnpm validate:content` mit Exit-Code 1 bei Problemen.

- [ ] **Step 1: Validierungsskript schreiben**

Create `scripts/validate-content.mjs`:

```js
// Checks what the zod schema cannot see: files on disk, cross-references and
// uniqueness across properties. Exits non-zero on any problem.
import { existsSync } from 'node:fs'
import path from 'node:path'

import { AMENITIES } from '../src/data/amenities.ts'
import { properties } from '../src/data/properties/index.ts'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const problems = []

const slugs = new Set()
const ids = new Set()

for (const property of properties) {
  const where = `${property.id}`

  if (ids.has(property.id)) problems.push(`${where}: duplicate id`)
  if (slugs.has(property.slug)) problems.push(`${where}: duplicate slug "${property.slug}"`)
  ids.add(property.id)
  slugs.add(property.slug)

  for (const image of [property.images.cover, ...property.images.gallery]) {
    if (!existsSync(path.join(PUBLIC_DIR, image.src))) {
      problems.push(`${where}: image file missing — ${image.src}`)
    }
  }

  for (const key of property.amenities) {
    if (!(key in AMENITIES)) problems.push(`${where}: unknown amenity "${key}"`)
  }

  if (property.images.gallery.length < 4) {
    problems.push(`${where}: gallery needs at least 4 images for the grid`)
  }

  const seasons = property.pricing.rates.map((rate) => rate.season)
  if (new Set(seasons).size !== seasons.length) {
    problems.push(`${where}: duplicate season in pricing.rates`)
  }
}

if (problems.length > 0) {
  console.error('Content validation failed:')
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}

console.log(`Content validation passed for ${properties.length} properties.`)
```

- [ ] **Step 2: Skript ausführen**

Run: `node --experimental-strip-types scripts/validate-content.mjs`
Expected: `Content validation passed for 2 properties.`

- [ ] **Step 3: Negativfall prüfen**

In `src/data/properties/apartment.json` versuchsweise den `src` des ersten Galeriebilds auf
`/images/apartment/gibtsnicht.webp` ändern.

Run: `node --experimental-strip-types scripts/validate-content.mjs`
Expected: Exit-Code 1 und `image file missing — /images/apartment/gibtsnicht.webp`.

Änderung anschließend zurücknehmen (`git checkout src/data/properties/apartment.json`).

- [ ] **Step 4: `package.json` ergänzen**

In `scripts`:

```json
"validate:content": "node --experimental-strip-types scripts/validate-content.mjs",
```

- [ ] **Step 5: Zwei Nachschärfungen aus dem Review von Task 5**

**`secretRef` von einer Formatprüfung zu einer Allowlist machen.** `^[A-Z][A-Z0-9_]*$` trifft auf
jeden SCREAMING_SNAKE-Namen zu, also auch auf `DATABASE_URL`. Ein Aufrufer kann das nicht
erreichen — der Wert steht in versionierten Daten —, aber eine unglückliche Datenänderung könnte
den Fetch auf ein fremdes Secret zeigen lassen. In `src/data/property-schema.ts`:

```ts
    secretRef: z.string().regex(/^ICAL_[A-Z0-9_]+$/),
```

Und den bestehenden Test in `src/data/property-schema.test.ts` um den Fall ergänzen:

```ts
test('rejects a secretRef that points at an unrelated environment variable', () => {
  assert.throws(() =>
    propertySchema.parse({
      ...validProperty,
      calendar: { provider: 'airbnb', secretRef: 'DATABASE_URL' },
    }),
  )
})
```

**Die Kalender-Regressionsprüfung schärfen.** In `src/data/properties/data.test.ts` prüft die
Zusicherung heute auf `airbnb.de/calendar` — eine `.com`-URL rutschte durch — und meldet im
Fehlerfall nur „expression evaluated to a falsy value". Ersetzen durch:

```ts
test('no property carries a calendar url in its data', () => {
  const serialized = JSON.stringify(properties)
  const match = serialized.match(/https?:\/\/[^"]*airbnb[^"]*/i)
  assert.equal(match, null, `calendar url leaked into the property data: ${match?.[0]}`)
})
```

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 6: `images-sync.mjs` die Objektliste selbst ermitteln lassen**

Das Skript trägt `['apartment', 'house']` fest im Code. Ein drittes Objekt würde damit stillschweigend
nicht geprüft — kein Fehler, nur eine Lücke, und genau die Art von leisem Ausfall, die dieser Umbau
beseitigen soll. Die Liste stattdessen aus dem Datenverzeichnis lesen:

```js
const PROPERTY_IDS = readdirSync(DATA_DIR)
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.replace(/\.json$/, ''))
```

`readdirSync` ist bereits importiert. Die Schleife `for (const id of ['apartment', 'house'])` durch
`for (const id of PROPERTY_IDS)` ersetzen.

Run: `pnpm images:sync --check`
Expected: dieselbe Ausgabe wie zuvor, weiterhin die Meldung zu `IMG_2209.webp` und Exit-Code 1.

- [ ] **Step 7: Migrationsskripte entfernen**

```bash
git rm -r scripts/migrations
```

Sie haben ihren Zweck erfüllt; ihre Wirkung liegt in den committeten JSON-Dateien und ihr Ablauf in
der Git-Historie.

- [ ] **Step 8: Gesamtdurchlauf**

Run: `pnpm test && pnpm check-types && pnpm lint && pnpm validate:content && pnpm images:sync --check && pnpm build`
Expected: alles fehlerfrei.

- [ ] **Step 9: README um die Datenpflege ergänzen**

An `README.md` anhängen:

```markdown
## Objektdaten

Die Objektdaten liegen in `src/data/properties/*.json` und werden beim Import gegen
`src/data/property-schema.ts` validiert — ungültige Daten brechen den Build.

| Befehl | Zweck |
|---|---|
| `pnpm test` | Schema- und Repository-Tests |
| `pnpm validate:content` | Bilddateien, Amenity-Keys, Eindeutigkeit von id/slug |
| `pnpm images:sync` | Bilddimensionen aus den Dateien übernehmen |
| `pnpm images:sync --check` | nur melden, nichts schreiben |

Ein neues Objekt: JSON-Datei in `src/data/properties/` anlegen und in
`src/data/properties/index.ts` importieren. Zugriff ausschließlich über
`src/lib/properties/repository.ts`.
```

- [ ] **Step 10: Commit**

Das `git rm -r scripts/migrations` aus Schritt 7 hat die Löschung bereits gestaged.

```bash
git add scripts package.json README.md src/data
git commit -m "feat: add content validation and document data maintenance"
```

**Etappe 3 ist hier abgeschlossen. Das Zielschema v2 ist vollständig erreicht.**

---

## Offene Datenpunkte nach Abschluss

Diese Werte sind strukturell vorhanden, inhaltlich aber noch zu bestätigen. Sie blockieren keine
Task, sollten aber vor dem DB-Umzug geklärt sein:

- **Die Fakten des Hauses** (`highlights` in `house.json`): Der v1-Block war ein Klon aus
  `apartment.json`. Der Beschreibungstext nennt zwei Schlafzimmer mit zwei Einzelbetten und einem
  Doppelbett — das deutet auf `bedrooms: 2` und `beds: 3` statt `beds: 4`, und die Fläche von 95 m²
  stammt vermutlich von der Wohnung. Task 12 gibt diese Punkte am Ende explizit aus.
- **Alt-Texte** für die Galerien (41 Bilder Wohnung, 70 Bilder Haus). Optional; ohne sie greift der
  Fallback auf den Objekttitel.
- **`minNights`** je Objekt, aktuell `null`.

## Self-Review

**Spec-Abdeckung:** Jede Anforderung der Spec ist einer Task zugeordnet — Kopfdaten (T1/T2),
Lokalisierung mit Fallback (T7), Content-Blöcke (T8/T9), Bilder (T10/T11), Highlights (T12),
Amenity-Registry (T13), Preise (T14), Hausregeln (T15), Zod als Quelle der Wahrheit (T1), statisches
Laden (T3), Repository (T3/T4), Registries (T12/T13), `images-sync` (T10), `validate:content` (T16),
Sicherheit inkl. Token-Rotation (T2/T5/T6).

**Zwei bewusste Abweichungen von der Spec**, jeweils oben begründet: mehrere Migrationsskripte statt
eines einzigen, und die Saisonzeiträume sind nicht offen, sondern aus `BookItCard.tsx:19` und den
Messages rekonstruierbar.

**Typkonsistenz:** `resolveText(text, locale)` behält diese Argumentreihenfolge in T7 bis T15;
`Property` heißt ab T1 durchgehend so; `PropertyContentBlock` ist bewusst von der bestehenden
`ContentBlock`-Komponente unterschieden; `getPropertyById` wird in T3 definiert und in T5 verwendet;
`AMENITY_CATEGORY_ORDER` wird in T13 definiert und im selben Task von der Migration und der
Komponente genutzt; `isDateInPeriod` wird in T14 definiert und im selben Task verwendet.
