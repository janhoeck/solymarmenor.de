# Web Vitals und SEO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Web Vitals echter Besucher selbst erheben und auswerten, und die technischen
SEO-Grundlagen korrigieren — allen voran die kanonischen URLs, die derzeit auf Weiterleitungen zeigen.

**Architecture:** Drei unabhängige, einzeln deploybare Phasen. **B** (Aufgaben 1–6) korrigiert
Metadata, Sitemap und robots. **A** (Aufgaben 7–11) schreibt Messwerte per `sendBeacon` in eine
neue Postgres-Tabelle und wertet sie über ein CLI-Skript aus. **C** (Aufgaben 12–16) ergänzt
JSON-LD (VacationRental, BreadcrumbList, LodgingBusiness/WebSite, Bewertungen). Aufgabe 17 schließt ab. Die Reihenfolge ist bewusst B → A → C: die Canonical-Korrektur
hat den größten erwarteten Effekt und braucht am längsten, bis Google sie verarbeitet hat.

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, next-intl 4, Drizzle ORM +
Postgres, Zod 4, sharp, `node --test` mit `--experimental-strip-types`, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-15-web-vitals-und-seo-design.md`

## Global Constraints

- **Kommentare und Skript-Ausgaben auf Englisch.** Prosa in `README.md` auf Deutsch.
- **Prettier-Vorgaben** aus `.prettierrc.json`: keine Semikolons, einfache Anführungszeichen
  (auch in JSX), Einrückung 2, `printWidth` 120, `trailingComma: "es5"`. Nach jeder Aufgabe
  `pnpm format` möglich, aber Code bitte direkt passend schreiben.
- **Tests laufen ohne Bundler** (`node --test --experimental-strip-types`). Daraus folgt bindend
  für jede Datei im Importgraphen eines Tests: relative Importe **mit** `.ts`-Endung, und **keine**
  `@/`-Pfad-Aliase. `allowImportingTsExtensions` ist in `tsconfig.json` bereits gesetzt.
- **Kanonische Domain:** `https://solymarmenor.com`.
- **Basis-URL:** `process.env.NEXT_PUBLIC_BASE_URL ?? 'https://solymarmenor.com'`.
- **Keine personenbezogenen Daten** in `web_vitals`: keine IP, kein Cookie, keine Kennung.
- **Baseline vor Beginn:** `pnpm test` meldet 89 bestandene Tests. Diese Zahl darf nur wachsen.
- **Jede Aufgabe endet mit einem Commit.** Bei Aufgaben ohne eigenen Test läuft vorher
  `pnpm check-types` und `pnpm lint`.

---

# Phase B — Technisches SEO

## Task 1: Kanonische URLs und hreflang korrigieren

Die wichtigste Änderung des ganzen Vorhabens. `src/proxy.ts` fährt next-intl mit
`localePrefix: 'as-needed'` bei `defaultLocale: 'en'` — englische Seiten leben unter `/aboutus`,
und `/en/aboutus` leitet dorthin weiter. `src/lib/metadata.ts:22` baut die URL aber unbedingt als
`/{locale}/{pfad}`, wodurch jedes englische Canonical auf eine Weiterleitung zeigt.

**Files:**
- Modify: `src/lib/metadata.ts` (vollständiger Ersatz des Inhalts)
- Test: `src/lib/metadata.test.ts` (neu)

**Interfaces:**
- Consumes: `routing` aus `src/i18n/routing.ts`
- Produces:
  - `BASE_URL: string` — ohne abschließenden Schrägstrich
  - `localizedPathname(pathname: string, locale: string): string` — führender Schrägstrich, kein abschließender
  - `absoluteUrl(pathname: string): string`
  - `generateCanonicalMetadata(locale: string, pathname: string): Metadata` — Signatur unverändert

- [ ] **Step 1: Write the failing test**

Create `src/lib/metadata.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { BASE_URL, absoluteUrl, generateCanonicalMetadata, localizedPathname } from './metadata.ts'

test('the default locale gets no prefix under localePrefix as-needed', () => {
  assert.equal(localizedPathname('/aboutus', 'en'), '/aboutus')
  assert.equal(localizedPathname('/', 'en'), '/')
})

test('every other locale gets a prefix', () => {
  assert.equal(localizedPathname('/aboutus', 'de'), '/de/aboutus')
  assert.equal(localizedPathname('/', 'de'), '/de')
  assert.equal(localizedPathname('/property/apartment', 'es'), '/es/property/apartment')
})

test('a missing leading slash and a trailing slash are both tolerated', () => {
  assert.equal(localizedPathname('aboutus', 'de'), '/de/aboutus')
  assert.equal(localizedPathname('/aboutus/', 'de'), '/de/aboutus')
})

test('absoluteUrl prefixes the base URL without doubling slashes', () => {
  assert.equal(absoluteUrl('/de/contact'), `${BASE_URL}/de/contact`)
  assert.equal(absoluteUrl('/'), `${BASE_URL}/`)
})

test('canonical points at the unprefixed URL for the default locale', () => {
  const metadata = generateCanonicalMetadata('en', '/aboutus')
  assert.equal(metadata.alternates?.canonical, 'https://solymarmenor.com/aboutus')
})

test('canonical carries the prefix for a non-default locale', () => {
  const metadata = generateCanonicalMetadata('de', '/aboutus')
  assert.equal(metadata.alternates?.canonical, 'https://solymarmenor.com/de/aboutus')
})

test('alternates cover every locale plus x-default', () => {
  const metadata = generateCanonicalMetadata('de', '/contact')

  assert.deepEqual(metadata.alternates?.languages, {
    en: 'https://solymarmenor.com/contact',
    de: 'https://solymarmenor.com/de/contact',
    es: 'https://solymarmenor.com/es/contact',
    'x-default': 'https://solymarmenor.com/contact',
  })
})

test('no emitted URL carries the default locale as a path prefix', () => {
  // Regression guard for the defect this task fixes. Under localePrefix
  // 'as-needed' the proxy redirects /en/... to /..., so any canonical or
  // alternate pointing at /en/... hands Google a redirect to index.
  for (const pathname of ['/', '/aboutus', '/property/apartment']) {
    for (const locale of ['en', 'de', 'es']) {
      const { alternates } = generateCanonicalMetadata(locale, pathname)
      const urls = [alternates?.canonical, ...Object.values(alternates?.languages ?? {})]

      for (const url of urls) {
        assert.ok(!/\/en(\/|$)/.test(String(url)), `${url} must not carry the default locale prefix`)
      }
    }
  }
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types src/lib/metadata.test.ts`

Expected: FAIL. Zuerst `ERR_MODULE_NOT_FOUND` für `../i18n/routing` (die fehlende `.ts`-Endung in
`metadata.ts`), nach deren Behebung `localizedPathname is not a function`.

- [ ] **Step 3: Replace the contents of `src/lib/metadata.ts`**

```ts
import { Metadata } from 'next'

import { routing } from '../i18n/routing.ts'

/** No trailing slash, so `absoluteUrl` can concatenate without checking. */
export const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://solymarmenor.com').replace(/\/+$/, '')

/**
 * The pathname a locale is actually served under.
 *
 * `src/proxy.ts` runs next-intl with `localePrefix: 'as-needed'`, so the default
 * locale is served without a prefix and `/en/aboutus` redirects to `/aboutus`.
 * Building `/{locale}/{path}` unconditionally — as this module did before —
 * pointed every English canonical and every English sitemap entry at a
 * redirect, which tells Google to index a URL that does not serve content.
 *
 * next-intl's own `getPathname` would answer this, but importing it pulls in
 * `next/navigation`, which does not resolve under `node --test`
 * (`ERR_MODULE_NOT_FOUND`). Using it would leave the riskiest change in this
 * file untested, so the rule is reimplemented here — it is one branch — and
 * pinned by `metadata.test.ts`. Reading `routing` rather than hard-coding 'en'
 * means a later change to `localePrefix` or `defaultLocale` carries over.
 *
 * Localized pathnames (`routing.pathnames`) are not covered; the project does
 * not use them. Introducing them means extending this function.
 */
export function localizedPathname(pathname: string, locale: string): string {
  const cleanPath = pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  const needsPrefix =
    routing.localePrefix === 'always' || (routing.localePrefix === 'as-needed' && locale !== routing.defaultLocale)

  return `/${[needsPrefix ? locale : '', cleanPath].filter(Boolean).join('/')}`
}

export function absoluteUrl(pathname: string): string {
  return `${BASE_URL}${pathname}`
}

export function generateCanonicalMetadata(locale: string, pathname: string): Metadata {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((lang) => [lang, absoluteUrl(localizedPathname(pathname, lang))])
  )

  // x-default names the variant for visitors whose language matches none of
  // the above. It was present in the old static sitemap but never in the
  // rendered HTML, so the two contradicted each other.
  languages['x-default'] = absoluteUrl(localizedPathname(pathname, routing.defaultLocale))

  return {
    alternates: {
      canonical: absoluteUrl(localizedPathname(pathname, locale)),
      languages,
    },
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/lib/metadata.test.ts`
Expected: PASS, 8 Tests.

- [ ] **Step 5: Run the full suite and the type check**

Run: `pnpm test` — erwartet: 97 bestanden, 0 Fehler.
Run: `pnpm check-types` — erwartet: keine Ausgabe.

- [ ] **Step 6: Commit**

```bash
git add src/lib/metadata.ts src/lib/metadata.test.ts
git commit -m "fix: stop pointing canonical and hreflang URLs at redirects"
```

---

## Task 2: Ein echtes OG-Bild erzeugen

`src/app/[locale]/layout.tsx:139` gibt `favicon.ico` als Vorschaubild an, deklariert als 800×800.
Kein soziales Netzwerk rendert eine `.ico`-Datei als Vorschau. Erwartet werden 1200×630.

Das Bild wird einmalig erzeugt und eingecheckt, nicht zur Laufzeit: der Bildoptimierer läuft auf
dem eigenen App-Server, und ein Bild, das sich praktisch nie ändert, dort bei jedem Cache-Miss neu
zu rechnen wäre verschenkte CPU — dieselbe Überlegung, die in `next.config.ts` schon AVIF
ausgeschlossen hat.

**Files:**
- Create: `scripts/generate-og-image.mjs`
- Create: `public/og/default.jpg` (Ausgabe des Skripts)
- Modify: `package.json` (Skript `og:generate`)

**Interfaces:**
- Produces: `public/og/default.jpg`, exakt 1200×630 — von Aufgabe 3 referenziert.

- [ ] **Step 1: Write the script**

Create `scripts/generate-og-image.mjs`:

```js
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
```

- [ ] **Step 2: Register the script in `package.json`**

Add to `"scripts"`, after `"images:downscale"`:

```json
"og:generate": "node scripts/generate-og-image.mjs",
```

- [ ] **Step 3: Run it and verify the output dimensions**

Run: `pnpm og:generate`
Expected: `Wrote public\og\default.jpg at 1200x630`

Wenn stattdessen die Fehlermeldung zur Quellgröße erscheint, ist der Pfad falsch — dann
`--source=` auf ein Cover mit mindestens 1200×630 setzen.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-og-image.mjs public/og/default.jpg package.json
git commit -m "feat: generate a real 1200x630 Open Graph image"
```

---

## Task 3: Metadata im Root-Layout korrigieren

Behebt vier Befunde auf einmal: fehlendes `metadataBase`, `keywords` mit rund 60 Einträgen,
`siteName: 'Home'` und das Favicon als OG-Bild.

**Files:**
- Modify: `src/app/[locale]/layout.tsx:31-152` (die `generateMetadata`-Funktion)

**Interfaces:**
- Consumes: `BASE_URL`, `absoluteUrl`, `localizedPathname`, `generateCanonicalMetadata` aus Aufgabe 1;
  `public/og/default.jpg` aus Aufgabe 2

- [ ] **Step 1: Extend the import in `src/app/[locale]/layout.tsx`**

Ersetze Zeile 5:

```ts
import { generateCanonicalMetadata } from '@/lib/metadata'
```

durch:

```ts
import { BASE_URL, absoluteUrl, generateCanonicalMetadata, localizedPathname } from '@/lib/metadata'
```

Der `@/`-Alias ist hier korrekt: diese Datei wird nie von einem Test importiert, nur von Next
gebündelt.

- [ ] **Step 2: Replace the body of `generateMetadata`**

Ersetze den gesamten `return { … }`-Block (Zeilen 36–152) durch:

```ts
  const homeUrl = absoluteUrl(localizedPathname('/', locale))

  return {
    // Without this, Next cannot resolve relative URLs in openGraph and
    // alternates, and warns about it at build time.
    metadataBase: new URL(BASE_URL),
    title: t('title'),
    description: t('description'),
    // No `keywords`. The meta keywords tag has been ignored by Google for
    // years, and the ~60 entries this replaced included misspelling variants
    // ('los alcarzares', 'los alcarez') that Bing treats as a stuffing signal.
    ...generateCanonicalMetadata(locale, '/'),
    icons: {
      icon: '/favicon.ico',
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: homeUrl,
      siteName: 'Sol y Mar Menor',
      images: [
        {
          url: absoluteUrl('/og/default.jpg'),
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [absoluteUrl('/og/default.jpg')],
    },
  }
```

- [ ] **Step 3: Verify types and lint**

Run: `pnpm check-types` — erwartet: keine Ausgabe.
Run: `pnpm lint` — erwartet: keine neuen Warnungen.

- [ ] **Step 4: Verify the rendered output**

Run: `pnpm build`, danach `pnpm start`, dann in einem zweiten Terminal:

```bash
curl -s http://localhost:3000/aboutus | grep -oE '<link rel="canonical"[^>]*>|<meta property="og:[^>]*>|<link rel="alternate"[^>]*>'
```

Expected: `canonical` endet auf `/aboutus` **ohne** `/en`, `og:image` zeigt auf
`/og/default.jpg`, und unter den `alternate`-Zeilen steht ein `hreflang="x-default"`.
Kein `<meta name="keywords">` mehr im Dokument.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/layout.tsx"
git commit -m "fix: set metadataBase, drop meta keywords, use a real OG image"
```

---

## Task 4: Metadata der Objektseiten korrigieren

`src/app/[locale]/property/[slug]/layout.tsx:27` setzt die OG-URL fest auf
`https://solymarmenor.com/property/${slug}` — ohne Sprache. Für `de` und `es` verweist die
Vorschau damit auf die englische Seite.

**Files:**
- Modify: `src/app/[locale]/property/[slug]/layout.tsx:1-40`

**Interfaces:**
- Consumes: `absoluteUrl`, `localizedPathname`, `generateCanonicalMetadata` aus Aufgabe 1

- [ ] **Step 1: Replace the imports and `generateMetadata`**

Ersetze Zeile 4:

```ts
import { generateCanonicalMetadata } from '@/lib/metadata'
```

durch:

```ts
import { absoluteUrl, generateCanonicalMetadata, localizedPathname } from '@/lib/metadata'
```

Ersetze den `return { … }`-Block der `generateMetadata`-Funktion (Zeilen 24–39) durch:

```ts
  const title = resolveText(propertyConfiguration.title, locale)
  const description = resolveText(propertyConfiguration.subtitle, locale)
  const cover = propertyConfiguration.images.cover

  return {
    title,
    description,
    ...generateCanonicalMetadata(locale, `/property/${slug}`),
    openGraph: {
      title,
      description,
      // Built from the routing config rather than hard-coded, so the preview
      // URL points at the page in the language it describes.
      url: absoluteUrl(localizedPathname(`/property/${propertyConfiguration.slug}`, locale)),
      images: [
        {
          url: absoluteUrl(cover.src),
          width: cover.width,
          height: cover.height,
          alt: title,
        },
      ],
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(cover.src)],
    },
  }
```

- [ ] **Step 2: Verify types and lint**

Run: `pnpm check-types` — erwartet: keine Ausgabe.
Run: `pnpm lint` — erwartet: keine neuen Warnungen.

- [ ] **Step 3: Verify the rendered output**

Bei laufendem `pnpm start`:

```bash
curl -s http://localhost:3000/de/property/apartment | grep -oE '<meta property="og:url"[^>]*>|<link rel="canonical"[^>]*>'
```

Expected: beide URLs enthalten `/de/property/apartment`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/property/[slug]/layout.tsx"
git commit -m "fix: carry the locale into property Open Graph URLs"
```

---

## Task 5: Sitemap dynamisch erzeugen

`public/sitemap.xml` trägt 21 eingefrorene `lastmod`-Werte vom Juni bzw. Juli 2025, listet alle
sieben `/en/…`-URLs (die weiterleiten) und kennt `/privacy` nicht, obwohl die Route existiert.

**Files:**
- Create: `src/app/sitemap.ts`
- Test: `src/app/sitemap.test.ts`
- Delete: `public/sitemap.xml`

**Interfaces:**
- Consumes: `absoluteUrl`, `localizedPathname` aus Aufgabe 1; `getProperties` aus
  `src/lib/properties/repository.ts`; `routing` aus `src/i18n/routing.ts`
- Produces: `STATIC_ROUTES: readonly string[]`, `default async function sitemap(): Promise<MetadataRoute.Sitemap>`

- [ ] **Step 1: Write the failing test**

Create `src/app/sitemap.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getProperties } from '../lib/properties/repository.ts'
import sitemap, { STATIC_ROUTES } from './sitemap.ts'

test('covers every static route in every locale', async () => {
  const entries = await sitemap()
  const urls = new Set(entries.map((entry) => entry.url))

  assert.equal(urls.size, entries.length, 'the sitemap must not contain a duplicate URL')

  for (const route of STATIC_ROUTES) {
    assert.ok(urls.has(`https://solymarmenor.com${route === '/' ? '/' : route}`), `missing en entry for ${route}`)
    assert.ok(urls.has(`https://solymarmenor.com/de${route === '/' ? '' : route}`), `missing de entry for ${route}`)
    assert.ok(urls.has(`https://solymarmenor.com/es${route === '/' ? '' : route}`), `missing es entry for ${route}`)
  }
})

test('covers every published property in every locale', async () => {
  const entries = await sitemap()
  const urls = new Set(entries.map((entry) => entry.url))
  const properties = await getProperties()

  assert.ok(properties.length > 0, 'the fixture data must contain at least one published property')

  for (const property of properties) {
    assert.ok(urls.has(`https://solymarmenor.com/property/${property.slug}`))
    assert.ok(urls.has(`https://solymarmenor.com/de/property/${property.slug}`))
    assert.ok(urls.has(`https://solymarmenor.com/es/property/${property.slug}`))
  }
})

test('no entry points at a URL the proxy would redirect', async () => {
  // The old static sitemap listed /en/aboutus and six siblings. Under
  // localePrefix 'as-needed' every one of them 307s to the unprefixed URL,
  // so the sitemap was handing Google seven redirects.
  for (const entry of await sitemap()) {
    assert.ok(!/\/en(\/|$)/.test(entry.url), `${entry.url} would redirect`)
  }
})

test('every entry carries alternates for all locales plus x-default', async () => {
  for (const entry of await sitemap()) {
    assert.deepEqual(Object.keys(entry.alternates?.languages ?? {}).sort(), ['de', 'en', 'es', 'x-default'])
  }
})

test('property entries date from the property data, not from a constant', async () => {
  const entries = await sitemap()
  const properties = await getProperties()
  const first = properties[0]

  assert.ok(first, 'the fixture data must contain at least one published property')

  const entry = entries.find((candidate) => candidate.url.endsWith(`/property/${first.slug}`))

  assert.equal(entry?.lastModified, first.updatedAt)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types src/app/sitemap.test.ts`
Expected: FAIL mit `ERR_MODULE_NOT_FOUND` für `./sitemap.ts`.

- [ ] **Step 3: Write `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next'

import { routing } from '../i18n/routing.ts'
import { absoluteUrl, localizedPathname } from '../lib/metadata.ts'
import { getProperties } from '../lib/properties/repository.ts'

/**
 * Every page that is not a property. Kept here rather than derived from the
 * filesystem: `src/app/[locale]/` also holds `layout.tsx` and `loading.tsx`
 * files, and a route added without a sitemap entry should be a deliberate
 * decision, not a silent omission. `sitemap.test.ts` fails if an entry is
 * missing for any locale.
 */
export const STATIC_ROUTES = ['/', '/aboutus', '/contact', '/guestbook', '/imprint', '/privacy'] as const

/**
 * The static pages carry no per-page timestamp, so they share one date that is
 * bumped by hand when their content actually changes. A build timestamp would
 * be worse than none: it would claim every page changed on every deploy, and a
 * sitemap that cries wolf gets its lastmod ignored.
 */
const STATIC_PAGES_UPDATED_AT = '2026-08-15'

/**
 * One entry per locale variant, each carrying the full alternate set — the
 * shape the old static file used and the one Google documents for hreflang.
 *
 * `changefreq` and `priority` are deliberately absent. Google has stated it
 * ignores both, and the values in the old static file (`daily` on property
 * pages that change a few times a year) claimed otherwise.
 */
function entry(pathname: string, locale: string, lastModified: string): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((alternate) => [alternate, absoluteUrl(localizedPathname(pathname, alternate))])
  )
  languages['x-default'] = absoluteUrl(localizedPathname(pathname, routing.defaultLocale))

  return {
    url: absoluteUrl(localizedPathname(pathname, locale)),
    lastModified,
    alternates: { languages },
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await getProperties()

  const pages = [
    ...STATIC_ROUTES.map((route) => ({ pathname: route as string, lastModified: STATIC_PAGES_UPDATED_AT })),
    ...properties.map((property) => ({
      pathname: `/property/${property.slug}`,
      lastModified: property.updatedAt,
    })),
  ]

  return pages.flatMap(({ pathname, lastModified }) =>
    routing.locales.map((locale) => entry(pathname, locale, lastModified))
  )
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/app/sitemap.test.ts`
Expected: PASS, 5 Tests.

- [ ] **Step 5: Delete the static sitemap**

```bash
git rm public/sitemap.xml
```

Beide gleichzeitig auszuliefern ginge nicht: `public/sitemap.xml` würde die Route
`app/sitemap.ts` beschatten, weil statische Dateien Vorrang haben.

- [ ] **Step 6: Verify the generated XML**

Run: `pnpm build`, dann `pnpm start`, dann:

```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"
```

Expected: `24` — sechs statische Routen plus zwei Objekte, mal drei Sprachen: (6 + 2) x 3.
Die alte statische Datei hatte 21, weil ihr `/privacy` in allen drei Sprachen fehlte.

```bash
curl -s http://localhost:3000/sitemap.xml | grep -c "solymarmenor.com/en"
```

Expected: `0`.

- [ ] **Step 7: Commit**

```bash
git add src/app/sitemap.ts src/app/sitemap.test.ts
git commit -m "feat: generate the sitemap from routing config and property data"
```

---

## Task 6: robots.txt dynamisch erzeugen

`public/robots.txt:6` enthält eine `Host:`-Direktive, die ausschließlich Yandex auswertet.

**Files:**
- Create: `src/app/robots.ts`
- Delete: `public/robots.txt`

**Interfaces:**
- Consumes: `absoluteUrl` aus Aufgabe 1

- [ ] **Step 1: Write `src/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next'

import { absoluteUrl } from '../lib/metadata.ts'

/**
 * Replaces the static public/robots.txt. Two changes of substance: the `Host:`
 * directive is gone (only Yandex ever read it), and /api/ is disallowed — the
 * ICS and vitals endpoints are not pages and have nothing to offer a crawler.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
```

- [ ] **Step 2: Delete the static file**

```bash
git rm public/robots.txt
```

- [ ] **Step 3: Verify the generated output**

Run: `pnpm build`, dann `pnpm start`, dann:

```bash
curl -s http://localhost:3000/robots.txt
```

Expected:

```
User-Agent: *
Allow: /
Disallow: /api/

Sitemap: https://solymarmenor.com/sitemap.xml
```

- [ ] **Step 4: Run the full suite**

Run: `pnpm test` — erwartet: 108 bestanden, 0 Fehler.
Run: `pnpm check-types` und `pnpm lint` — erwartet: sauber.

- [ ] **Step 5: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat: generate robots.txt and drop the Yandex-only Host directive"
```

---

# Phase A — Web-Vitals-Erfassung

## Task 7: Tabelle, Migration und Datenbank-Skripte

Es gibt bisher keinen Migrationspfad: `drizzle.config.ts` verweist auf `out: './drizzle'`, das
Verzeichnis existiert nicht, und `nixpacks.toml` führt im Deploy nichts aus. Diese Aufgabe legt
ihn an.

**Files:**
- Modify: `src/utils/db/schema.ts`
- Create: `scripts/db-migrate.mjs`
- Create: `drizzle/` (von drizzle-kit erzeugt)
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Produces: `webVitals` Tabellenobjekt, importierbar aus `src/utils/db/schema.ts`

- [ ] **Step 1: Add the table to `src/utils/db/schema.ts`**

Ersetze die Importzeile:

```ts
import { bigint, doublePrecision, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
```

Ergänze unterhalb der `guestbook`-Tabelle:

```ts
/**
 * One row per reported metric. Aggregation happens at read time in
 * scripts/vitals-report.mjs rather than in pre-computed buckets: exact
 * percentiles beat estimates, and at this traffic the row count is not a
 * problem — five rows per page view is a few thousand a month.
 *
 * Deliberately holds nothing that points at a person: no IP, no cookie, no
 * identifier. That is what keeps this free of consent requirements, and it
 * means a leak of this table would disclose nothing.
 */
export const webVitals = pgTable(
  'web_vitals',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    metric: varchar('metric', { length: 8 }).notNull(),
    // double precision, because CLS is unitless and below 1 while every other
    // metric is whole milliseconds.
    value: doublePrecision('value').notNull(),
    rating: varchar('rating', { length: 20 }).notNull(),
    path: varchar('path', { length: 256 }).notNull(),
    locale: varchar('locale', { length: 5 }).notNull(),
    device: varchar('device', { length: 8 }).notNull(),
    // 20, because 'back-forward-cache' is 18 characters.
    navigation_type: varchar('navigation_type', { length: 20 }).notNull(),
  },
  // The only query shape the report uses: a time window per metric.
  (table) => [index('web_vitals_metric_created_at_idx').on(table.metric, table.created_at)]
)
```

- [ ] **Step 2: Write the migration runner**

Create `scripts/db-migrate.mjs`:

```js
// Applies pending Drizzle migrations from drizzle/ to DATABASE_URL.
//
// The deploy does not run this: nixpacks.toml only builds and starts. Run it by
// hand against production before deploying a release that needs a new table.
//
// Usage: pnpm db:migrate
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Put it in .env.local or export it before running this.')
  process.exit(1)
}

// max: 1 because the migrator runs statements in order on a single connection.
const client = postgres(databaseUrl, { max: 1 })

try {
  await migrate(drizzle(client), { migrationsFolder: 'drizzle' })
  console.log('Migrations applied.')
} finally {
  await client.end()
}
```

- [ ] **Step 3: Register both scripts in `package.json`**

Add to `"scripts"`:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "node --env-file-if-exists=.env.local scripts/db-migrate.mjs",
```

`--env-file-if-exists` liest `.env.local`, ohne zu scheitern, wenn die Datei fehlt (etwa in CI,
wo `DATABASE_URL` aus der Umgebung kommt).

- [ ] **Step 4: Generate the migration**

Run: `pnpm db:generate`
Expected: eine neue Datei `drizzle/0000_*.sql` plus `drizzle/meta/`.

- [ ] **Step 5: Inspect the generated SQL before running it**

Run: `cat drizzle/0000_*.sql`

**Diese Prüfung ist zwingend.** Da es keine Migrationshistorie gibt, vergleicht drizzle-kit das
Schema gegen nichts und erzeugt daher voraussichtlich auch ein `CREATE TABLE "guestbook"`. Diese
Tabelle existiert in Produktion bereits und **enthält die Gästebucheinträge**. Vor dem Ausführen:

- `CREATE TABLE "guestbook"` zu `CREATE TABLE IF NOT EXISTS "guestbook"` ändern, und
- ein etwaiges `DROP TABLE`, `ALTER TABLE … DROP COLUMN` oder `TRUNCATE` ersatzlos entfernen.

`CREATE TABLE "web_vitals"` und der `CREATE INDEX` bleiben unverändert.

- [ ] **Step 6: Apply the migration**

Run: `pnpm db:migrate`
Expected: `Migrations applied.`

Verify:

```bash
node --env-file-if-exists=.env.local -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql\`select count(*) from web_vitals\`.then((r) => { console.log('web_vitals rows:', r[0].count); return sql.end() });
"
```

Expected: `web_vitals rows: 0`

- [ ] **Step 7: Document it in `README.md`**

Ergänze nach dem Abschnitt „Build" einen neuen Abschnitt:

```markdown
## Datenbank

Migrationen liegen in `drizzle/` und werden **nicht** vom Deploy ausgeführt.

| Befehl | Zweck |
|---|---|
| `pnpm db:generate` | aus `src/utils/db/schema.ts` eine Migration nach `drizzle/` erzeugen |
| `pnpm db:migrate` | ausstehende Migrationen auf `DATABASE_URL` anwenden |

Vor einem Release, das eine neue Tabelle braucht, `pnpm db:migrate` von Hand gegen die
Produktionsdatenbank fahren — sonst startet die App gegen ein Schema, das es dort nicht gibt.

Erzeugtes SQL vor dem Ausführen lesen. Die `guestbook`-Tabelle ist vor Einführung der
Migrationen entstanden und steht in keiner Historie; drizzle-kit will sie deshalb unter Umständen
neu anlegen.
```

- [ ] **Step 8: Verify and commit**

Run: `pnpm check-types` und `pnpm test` — erwartet: sauber, 108 Tests.

```bash
git add src/utils/db/schema.ts scripts/db-migrate.mjs drizzle package.json README.md
git commit -m "feat: add the web_vitals table and a migration path"
```

---

## Task 8: Nutzlast-Validierung

Eigene Datei unter `src/lib/`, aus zwei Gründen: der Test kann sie ohne Next-Laufzeit importieren,
und sowohl die Route (Aufgabe 9) als auch die Client-Komponente (Aufgabe 10) brauchen sie.
`tsconfig.json` hat einen `@/lib/*`-Alias, aber **keinen** `@/app/*` — unter `src/app/` läge sie
für die Komponente nicht erreichbar.

**Files:**
- Create: `src/lib/vitals/schema.ts`
- Test: `src/lib/vitals/schema.test.ts`

**Interfaces:**
- Produces:
  - `VITALS_METRICS: readonly ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']`
  - `vitalsPayloadSchema` — Zod-Schema
  - `type VitalsPayload = z.infer<typeof vitalsPayloadSchema>`

- [ ] **Step 1: Write the failing test**

Create `src/lib/vitals/schema.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { vitalsPayloadSchema } from './schema.ts'

const valid = {
  metric: 'LCP',
  value: 1234.5,
  rating: 'good',
  path: '/de/property/apartment',
  locale: 'de',
  device: 'mobile',
  navigationType: 'navigate',
}

test('accepts a well-formed payload', () => {
  assert.equal(vitalsPayloadSchema.safeParse(valid).success, true)
})

test('accepts the root path', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, path: '/' }).success, true)
})

test('accepts every navigation type the bundled web-vitals can produce', () => {
  for (const navigationType of ['navigate', 'reload', 'back-forward', 'back-forward-cache', 'prerender', 'restore']) {
    assert.equal(vitalsPayloadSchema.safeParse({ ...valid, navigationType }).success, true, navigationType)
  }
})

test('rejects an unknown metric', () => {
  // FID was replaced by INP in 2024 and is not collected.
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'FID' }).success, false)
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'Next.js-hydration' }).success, false)
})

test('rejects an unknown locale', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, locale: 'fr' }).success, false)
})

test('rejects a path that is not a path', () => {
  const bad = ['relative', '/with space', '/query?a=1', '/frag#x', `/${'a'.repeat(300)}`, 'https://evil.example/x']

  for (const path of bad) {
    assert.equal(vitalsPayloadSchema.safeParse({ ...valid, path }).success, false, path)
  }
})

test('rejects durations outside the plausible range', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, value: -1 }).success, false)
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, value: 60_001 }).success, false)
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, value: Number.NaN }).success, false)
})

test('bounds CLS separately, because it is unitless', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'CLS', value: 0.05 }).success, true)
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'CLS', value: 11 }).success, false)
  // 5000 is a plausible LCP but an impossible CLS; without the per-metric
  // bound this would pass on the shared 60000 ceiling.
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, metric: 'CLS', value: 5000 }).success, false)
})

test('rejects unknown fields', () => {
  assert.equal(vitalsPayloadSchema.safeParse({ ...valid, ip: '1.2.3.4' }).success, false)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types src/lib/vitals/schema.test.ts`
Expected: FAIL mit `ERR_MODULE_NOT_FOUND` für `./schema.ts`.

- [ ] **Step 3: Write `src/lib/vitals/schema.ts`**

```ts
import { z } from 'zod'

import { routing } from '../../i18n/routing.ts'

/**
 * The metrics worth storing. `next/web-vitals` also reports Next's own timings
 * ('Next.js-hydration' and siblings) and the retired FID, none of which this
 * collects — the allowlist doubles as the filter.
 */
export const VITALS_METRICS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const

/**
 * The complete set the bundled web-vitals can emit. Derived from its own
 * normalisation, which takes PerformanceNavigationTiming.type, replaces
 * underscores with hyphens, and adds the three cases the timing entry cannot
 * express.
 */
const NAVIGATION_TYPES = ['navigate', 'reload', 'back-forward', 'back-forward-cache', 'prerender', 'restore'] as const

/** A page view slower than a minute is a broken measurement, not a slow page. */
const MAX_DURATION_MS = 60_000

/** CLS is unitless; anything above 1 is already catastrophic. */
const MAX_CLS = 10

export const vitalsPayloadSchema = z
  .object({
    metric: z.enum(VITALS_METRICS),
    value: z.number().finite().nonnegative(),
    rating: z.enum(['good', 'needs-improvement', 'poor']),
    // No query, no fragment, no host: this is a pathname and nothing else.
    // Bounded at 256 to match the column and to cap what one request can store.
    path: z
      .string()
      .min(1)
      .max(256)
      .regex(/^\/[\w\-/]*$/),
    locale: z.enum(routing.locales),
    device: z.enum(['mobile', 'desktop']),
    navigationType: z.enum(NAVIGATION_TYPES),
  })
  .strict()
  .refine((payload) => payload.value <= (payload.metric === 'CLS' ? MAX_CLS : MAX_DURATION_MS), {
    message: 'value out of range for this metric',
    path: ['value'],
  })

export type VitalsPayload = z.infer<typeof vitalsPayloadSchema>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/lib/vitals/schema.test.ts`
Expected: PASS, 9 Tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/vitals/schema.ts src/lib/vitals/schema.test.ts
git commit -m "feat: validate web vitals payloads"
```

---

## Task 9: Der Endpunkt

**Files:**
- Create: `src/app/api/vitals/route.ts`

**Interfaces:**
- Consumes: `vitalsPayloadSchema` aus `@/lib/vitals/schema` (Aufgabe 8); `db` aus `src/utils/db`; `webVitals` aus Aufgabe 7
- Produces: `POST /api/vitals`, antwortet immer `204`

- [ ] **Step 1: Write `src/app/api/vitals/route.ts`**

```ts
import { db } from '@/utils/db'
import { webVitals } from '@/utils/db/schema'
import { NextRequest, NextResponse } from 'next/server'

import { vitalsPayloadSchema } from '@/lib/vitals/schema'

/**
 * Collects Web Vitals from real visitors.
 *
 * The endpoint has to be public — it is called by every page view — so three
 * things stand between it and abuse: this same-origin check, the strict schema
 * in ./schema.ts, and the absence of any route that reads the data back.
 *
 * The response is 204 in every case, including on rejection. A prober learns
 * nothing about what failed, and the browser has nothing to do with a reply
 * anyway: sendBeacon discards it.
 */
export async function POST(request: NextRequest) {
  const noContent = new NextResponse(null, { status: 204 })

  try {
    const origin = request.headers.get('origin')

    // sendBeacon always sends Origin. A missing or foreign one is not our page.
    if (!origin || origin !== request.nextUrl.origin) {
      return noContent
    }

    const parsed = vitalsPayloadSchema.safeParse(await request.json())

    if (!parsed.success) {
      console.warn('[vitals] rejected payload:', parsed.error.issues)
      return noContent
    }

    const payload = parsed.data

    await db.insert(webVitals).values({
      metric: payload.metric,
      value: payload.value,
      rating: payload.rating,
      path: payload.path,
      locale: payload.locale,
      device: payload.device,
      navigation_type: payload.navigationType,
    })
  } catch (error) {
    // A failed insert must never surface to the visitor: this endpoint is
    // measurement, and measurement failing is not the page failing.
    console.error('[vitals] failed to store metric:', error)
  }

  return noContent
}
```

- [ ] **Step 2: Verify types and lint**

Run: `pnpm check-types` — erwartet: keine Ausgabe.
Run: `pnpm lint` — erwartet: keine neuen Warnungen.

- [ ] **Step 3: Verify the endpoint by hand**

Bei laufendem `pnpm build && pnpm start`:

```bash
# Accepted: correct Origin, valid payload
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/vitals \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d '{"metric":"LCP","value":1200,"rating":"good","path":"/de","locale":"de","device":"mobile","navigationType":"navigate"}'

# Rejected: foreign Origin
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/vitals \
  -H 'Content-Type: application/json' -H 'Origin: https://evil.example' \
  -d '{"metric":"LCP","value":1200,"rating":"good","path":"/de","locale":"de","device":"mobile","navigationType":"navigate"}'
```

Expected: beide `204`. Danach prüfen, dass **nur** die erste gespeichert wurde:

```bash
node --env-file-if-exists=.env.local -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql\`select metric, value, path from web_vitals\`.then((r) => { console.table(r); return sql.end() });
"
```

Expected: genau eine Zeile, `LCP / 1200 / /de`.

- [ ] **Step 4: Clean up the probe row and commit**

```bash
node --env-file-if-exists=.env.local -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql\`delete from web_vitals\`.then(() => sql.end());
"
git add src/app/api/vitals/route.ts
git commit -m "feat: add the web vitals collection endpoint"
```

---

## Task 10: Der Client

`src/components/shared/WebVitals.tsx:6` ruft `useReportWebVitals(console.table)` — die Werte landen
in der Konsole des Besuchers und sind für den Betreiber unsichtbar.

**Files:**
- Modify: `src/components/shared/WebVitals.tsx` (vollständiger Ersatz)

**Interfaces:**
- Consumes: `VITALS_METRICS` aus Aufgabe 8; `POST /api/vitals` aus Aufgabe 9
- Bereits eingehängt in `src/app/[locale]/layout.tsx:163` — dort ist nichts zu ändern.

- [ ] **Step 1: Replace `src/components/shared/WebVitals.tsx`**

```tsx
'use client'

import { VITALS_METRICS } from '@/lib/vitals/schema'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'

const ENDPOINT = '/api/vitals'

/**
 * Coarse form factor, derived without touching anything identifying: the
 * boolean is all that leaves the browser, never the User-Agent itself. The
 * userAgentData path is the accurate one and covers Chromium — which is
 * exactly the population CrUX measures — and the regex is the fallback for
 * everything else.
 */
function deviceType(): 'mobile' | 'desktop' {
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData

  if (typeof uaData?.mobile === 'boolean') {
    return uaData.mobile ? 'mobile' : 'desktop'
  }

  return /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

/**
 * Reports Core Web Vitals to our own endpoint.
 *
 * One beacon per metric, sent the moment the metric settles, rather than one
 * batched request on visibilitychange: LCP and TTFB are final early while CLS
 * and INP only finalise when the page is hidden, so buffering trades the early
 * values away for a saving of four ~200-byte requests.
 *
 * Google Search Console will not show any of this. Its Core Web Vitals report
 * reads CrUX, which needs far more traffic than this site has. This is the
 * same information from our own measurements.
 */
export const WebVitals = () => {
  const pathname = usePathname()
  const locale = useLocale()

  useReportWebVitals((metric) => {
    // useReportWebVitals also fires for Next's own timings
    // ('Next.js-hydration' and siblings) and for the retired FID.
    if (!(VITALS_METRICS as readonly string[]).includes(metric.name)) {
      return
    }

    // Local runs would otherwise skew the numbers with a developer machine's
    // measurements against a dev server.
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    const body = JSON.stringify({
      metric: metric.name,
      // Sub-millisecond resolution is meaningless; three decimals is more than
      // CLS needs.
      value: Math.round(metric.value * 1000) / 1000,
      rating: metric.rating,
      path: pathname,
      locale,
      device: deviceType(),
      navigationType: metric.navigationType,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      return
    }

    // keepalive lets the request outlive the page, which is the whole point of
    // sendBeacon and the reason a plain fetch would lose the last metrics.
    void fetch(ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Nothing to do: a lost measurement is not worth surfacing to a visitor.
    })
  })

  return null
}
```

- [ ] **Step 2: Verify types and lint**

Run: `pnpm check-types` — erwartet: keine Ausgabe.
Run: `pnpm lint` — erwartet: keine neuen Warnungen.

- [ ] **Step 3: Verify end to end against a production build**

`NODE_ENV` ist unter `pnpm start` bereits `production`, der Guard greift also nicht.

Run: `pnpm build && pnpm start`. Dann `http://localhost:3000/de` im Browser öffnen, ein wenig
scrollen und klicken (damit INP und CLS etwas zu messen haben), und den Tab schließen.

```bash
node --env-file-if-exists=.env.local -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql\`select metric, round(value::numeric, 1) as value, rating, path, device from web_vitals order by id\`
  .then((r) => { console.table(r); return sql.end() });
"
```

Expected: mehrere Zeilen, darunter mindestens `TTFB`, `FCP` und `LCP`, mit `path = /de` und
plausiblem `device`. Kein `Next.js-hydration`, kein `FID`.

- [ ] **Step 4: Clean up the probe rows and commit**

```bash
node --env-file-if-exists=.env.local -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql\`delete from web_vitals\`.then(() => sql.end());
"
git add src/components/shared/WebVitals.tsx
git commit -m "feat: report web vitals to our own endpoint instead of the console"
```

---

## Task 11: Der Auswertungs-Report

**Files:**
- Create: `scripts/vitals-report.mjs`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: Tabelle `web_vitals` aus Aufgabe 7
- Produces: `pnpm vitals:report [--days=28] [--prune]`

- [ ] **Step 1: Write `scripts/vitals-report.mjs`**

```js
// Reports the p75 of each Web Vital over a time window, split by device and by
// path — the same shape Google Search Console would show, computed from our own
// measurements because CrUX has too little traffic from this site to report on.
//
// Usage: pnpm vitals:report [--days=28] [--prune]
//
//   --days    window in days (default 28, matching the CrUX window)
//   --prune   also delete rows older than 90 days
import postgres from 'postgres'

const args = process.argv.slice(2)

/** Reads `--name=value` from the command line, with a fallback. */
function numericFlag(name, fallback) {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  if (!match) return fallback

  const value = Number(match.slice(`--${name}=`.length))
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`--${name} must be a positive number, got "${match}"`)
    process.exit(1)
  }

  return value
}

const DAYS = numericFlag('days', 28)
const PRUNE = args.includes('--prune')
const RETENTION_DAYS = 90

/** A p75 built from fewer samples than this is noise, and is labelled as such. */
const MIN_SAMPLES = 10

/** Official Core Web Vitals thresholds: [good, needs-improvement] upper bounds. */
const THRESHOLDS = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
}

const METRIC_ORDER = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']

function verdict(metric, p75) {
  const bounds = THRESHOLDS[metric]
  if (!bounds) return ''

  if (p75 <= bounds[0]) return 'good'
  if (p75 <= bounds[1]) return 'needs work'
  return 'poor'
}

function format(metric, p75) {
  return metric === 'CLS' ? p75.toFixed(3) : `${Math.round(p75)} ms`
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Put it in .env.local or export it before running this.')
  process.exit(1)
}

const sql = postgres(databaseUrl)

try {
  const [{ count: total }] = await sql`
    select count(*)::int as count from web_vitals
    where created_at >= now() - make_interval(days => ${DAYS})
  `

  if (total === 0) {
    console.log(`No measurements in the last ${DAYS} days. Nothing to report.`)
  } else {
    console.log(`Web Vitals p75 over the last ${DAYS} days (${total} measurements)\n`)

    const byDevice = await sql`
      select metric, device,
             percentile_cont(0.75) within group (order by value) as p75,
             count(*)::int as samples
      from web_vitals
      where created_at >= now() - make_interval(days => ${DAYS})
      group by metric, device
    `

    console.log('By device')
    console.table(
      byDevice
        .sort((a, b) => METRIC_ORDER.indexOf(a.metric) - METRIC_ORDER.indexOf(b.metric) || a.device.localeCompare(b.device))
        .map((row) => ({
          metric: row.metric,
          device: row.device,
          p75: format(row.metric, Number(row.p75)),
          verdict: verdict(row.metric, Number(row.p75)),
          samples: row.samples < MIN_SAMPLES ? `${row.samples} (too few)` : row.samples,
        }))
    )

    const byPath = await sql`
      select metric, path,
             percentile_cont(0.75) within group (order by value) as p75,
             count(*)::int as samples
      from web_vitals
      where created_at >= now() - make_interval(days => ${DAYS})
      group by metric, path
      having count(*) >= ${MIN_SAMPLES}
      order by metric, p75 desc
    `

    if (byPath.length === 0) {
      console.log(`\nBy path: no path has ${MIN_SAMPLES} or more measurements yet.`)
    } else {
      console.log('\nBy path')
      console.table(
        byPath
          .sort((a, b) => METRIC_ORDER.indexOf(a.metric) - METRIC_ORDER.indexOf(b.metric) || b.p75 - a.p75)
          .map((row) => ({
            metric: row.metric,
            path: row.path,
            p75: format(row.metric, Number(row.p75)),
            verdict: verdict(row.metric, Number(row.p75)),
            samples: row.samples,
          }))
      )
    }
  }

  if (PRUNE) {
    const deleted = await sql`
      delete from web_vitals where created_at < now() - make_interval(days => ${RETENTION_DAYS})
    `
    console.log(`\nPruned ${deleted.count} rows older than ${RETENTION_DAYS} days.`)
  }
} finally {
  await sql.end()
}
```

- [ ] **Step 2: Register the script in `package.json`**

Add to `"scripts"`:

```json
"vitals:report": "node --env-file-if-exists=.env.local scripts/vitals-report.mjs",
```

- [ ] **Step 3: Verify against seeded data**

Die Tabelle ist leer, also erst den leeren Fall prüfen:

Run: `pnpm vitals:report`
Expected: `No measurements in the last 28 days. Nothing to report.`

Dann Testdaten einspielen, die beide Schwellenseiten abdecken:

```bash
node --env-file-if-exists=.env.local -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
const rows = [];
for (let i = 0; i < 12; i++) {
  rows.push({ metric: 'LCP', value: 1000 + i * 50, rating: 'good', path: '/de', locale: 'de', device: 'mobile', navigation_type: 'navigate' });
  rows.push({ metric: 'LCP', value: 4200 + i * 50, rating: 'poor', path: '/de/property/apartment', locale: 'de', device: 'mobile', navigation_type: 'navigate' });
  rows.push({ metric: 'CLS', value: 0.02, rating: 'good', path: '/de', locale: 'de', device: 'desktop', navigation_type: 'navigate' });
}
sql\`insert into web_vitals \${sql(rows)}\`.then(() => { console.log('seeded', rows.length); return sql.end() });
"
```

Run: `pnpm vitals:report`

Expected: „By device" zeigt `LCP / mobile` mit einem p75 im schlechten Bereich und
`CLS / desktop` mit `0.020 / good`. „By path" zeigt `/de/property/apartment` mit `poor` über
`/de` mit `good`. Alle `samples` sind ≥ 12, also ohne „(too few)"-Kennzeichnung.

Run: `pnpm vitals:report --days=1 --prune`
Expected: derselbe Bericht plus `Pruned 0 rows older than 90 days.`

- [ ] **Step 4: Clean up the seeded data**

```bash
node --env-file-if-exists=.env.local -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
sql\`delete from web_vitals\`.then(() => sql.end());
"
```

- [ ] **Step 5: Document it in `README.md`**

Ergänze einen Abschnitt nach „Datenbank":

```markdown
## Web Vitals

Die Seite misst die Web Vitals ihrer Besucher selbst und schreibt sie nach `web_vitals`.
Gespeichert wird nichts, was auf eine Person zeigt: keine IP, kein Cookie, keine Kennung — nur
Metrik, Wert, Pfad, Sprache, Gerätetyp und Navigationsart.

| Befehl | Zweck |
|---|---|
| `pnpm vitals:report` | p75 je Metrik über 28 Tage, nach Gerät und Pfad |
| `pnpm vitals:report --days=7` | kürzeres Fenster |
| `pnpm vitals:report --prune` | zusätzlich Zeilen älter als 90 Tage löschen |

Das 28-Tage-Fenster ist bewusst dasselbe, das CrUX verwendet — damit sind die Zahlen mit dem
vergleichbar, was Google sähe.

**Der Core-Web-Vitals-Bericht der Search Console bleibt davon unberührt.** Er speist sich
ausschließlich aus CrUX, und CrUX braucht mehr Chrome-Besucher, als diese Seite hat. „Keine
Daten" dort ist keine Fehlfunktion, sondern eine Aussage über die Stichprobengröße.
```

- [ ] **Step 6: Commit**

```bash
git add scripts/vitals-report.mjs package.json README.md
git commit -m "feat: report web vitals p75 by device and path"
```

---

# Phase C — Structured Data

## Task 12: JSON-LD-Baustein

**Files:**
- Create: `src/components/shared/JsonLd/JsonLd.tsx`
- Create: `src/lib/structured-data/text.ts`
- Test: `src/lib/structured-data/text.test.ts`

**Interfaces:**
- Produces:
  - `<JsonLd data={…} />`
  - `plainText(blocks: PropertyContentBlock[], locale: string): string`

- [ ] **Step 1: Write the failing test**

Create `src/lib/structured-data/text.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { PropertyContentBlock } from '../../data/property-schema.ts'
import { plainText } from './text.ts'

test('joins paragraph blocks in the requested locale', () => {
  const blocks: PropertyContentBlock[] = [
    { type: 'paragraph', text: { de: 'Erster Satz.', en: 'First sentence.' } },
    { type: 'paragraph', text: { de: 'Zweiter Satz.', en: 'Second sentence.' } },
  ]

  assert.equal(plainText(blocks, 'en'), 'First sentence. Second sentence.')
  assert.equal(plainText(blocks, 'de'), 'Erster Satz. Zweiter Satz.')
})

test('falls back to German for an untranslated locale', () => {
  const blocks: PropertyContentBlock[] = [{ type: 'paragraph', text: { de: 'Nur Deutsch.' } }]

  assert.equal(plainText(blocks, 'es'), 'Nur Deutsch.')
})

test('strips the inline markup the editorial texts are allowed to carry', () => {
  const blocks: PropertyContentBlock[] = [
    { type: 'paragraph', text: { de: 'Ein <strong>schönes</strong> Haus.<br>Mit <em>Pool</em>.' } },
  ]

  // JSON-LD values are plain text: markup left in place would be shown
  // verbatim in a search result.
  assert.equal(plainText(blocks, 'de'), 'Ein schönes Haus. Mit Pool.')
})

test('ignores list and note blocks', () => {
  const blocks: PropertyContentBlock[] = [
    { type: 'paragraph', text: { de: 'Beschreibung.' } },
    { type: 'list', items: [{ de: 'Punkt' }] },
    { type: 'note', variant: 'info', text: { de: 'Hinweis' } },
  ]

  assert.equal(plainText(blocks, 'de'), 'Beschreibung.')
})

test('returns an empty string when there is no paragraph', () => {
  assert.equal(plainText([{ type: 'list', items: [{ de: 'Punkt' }] }], 'de'), '')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types src/lib/structured-data/text.test.ts`
Expected: FAIL mit `ERR_MODULE_NOT_FOUND` für `./text.ts`.

- [ ] **Step 3: Write `src/lib/structured-data/text.ts`**

```ts
import { resolveText } from '../../data/localized-text.ts'
import type { PropertyContentBlock } from '../../data/property-schema.ts'

/**
 * Flattens editorial content blocks into the plain sentence JSON-LD wants.
 *
 * Only paragraphs contribute: a list rendered as running text reads as a
 * run-on sentence, and notes are interface furniture rather than description.
 *
 * The markup strip matters. `localized-text.ts` allows <strong>, <em> and <br>
 * in these texts, and a JSON-LD value is plain text — leaving the tags in
 * would put them verbatim into a search result. <br> becomes a space so two
 * sentences do not run together.
 */
export function plainText(blocks: PropertyContentBlock[], locale: string): string {
  return blocks
    .filter((block) => block.type === 'paragraph')
    .map((block) => resolveText(block.text, locale))
    .join(' ')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<\/?(?:strong|em)>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/lib/structured-data/text.test.ts`
Expected: PASS, 5 Tests.

- [ ] **Step 5: Write `src/components/shared/JsonLd/JsonLd.tsx`**

```tsx
export type JsonLdProps = {
  data: object
}

/**
 * Renders a JSON-LD block.
 *
 * dangerouslySetInnerHTML rather than a child string, because React would
 * escape the quotes and leave Google unable to parse it. The `<` replacement
 * closes the one hole that matters: a "</script>" inside any string value
 * would otherwise end the block early. < is valid inside a JSON string,
 * so parsers read it as the character it is.
 */
export const JsonLd = (props: JsonLdProps) => (
  <script
    type='application/ld+json'
    dangerouslySetInnerHTML={{ __html: JSON.stringify(props.data).replace(/</g, '\\u003c') }}
  />
)
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm check-types` und `pnpm lint` — erwartet: sauber.

```bash
git add src/components/shared/JsonLd/JsonLd.tsx src/lib/structured-data/text.ts src/lib/structured-data/text.test.ts
git commit -m "feat: add a JSON-LD renderer and plain-text extraction"
```

---

## Task 13: `VacationRental` je Objektseite

**Achtung bei `houseRules.rules`:** Die Liste nennt das **Verbotene**, nicht das Erlaubte. Die
Übersetzungen belegen es — `descriptions.pet` lautet „Keine Haustiere erlaubt". `petsAllowed` muss
daher die **Negation** sein. Ein direkt übernommenes `includes('pet')` stünde als Falschaussage
im Structured Data.

**Files:**
- Create: `src/lib/structured-data/vacation-rental.ts`
- Test: `src/lib/structured-data/vacation-rental.test.ts`
- Modify: `src/app/[locale]/property/[slug]/page.tsx`

**Interfaces:**
- Consumes: `plainText` aus Aufgabe 12; `absoluteUrl`, `localizedPathname` aus Aufgabe 1
- Produces: `buildVacationRental(property: Property, locale: string, amenityNames: string[]): object`

- [ ] **Step 1: Write the failing test**

Create `src/lib/structured-data/vacation-rental.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Property } from '../../data/property-schema.ts'
import { buildVacationRental } from './vacation-rental.ts'

const translation = { de: 'Text' }

const property: Property = {
  schemaVersion: 2,
  id: 'fixture',
  slug: 'fixture',
  status: 'published',
  kind: 'apartment',
  updatedAt: '2026-08-15',
  title: { de: 'Ferienhaus', en: 'Holiday home' },
  subtitle: translation,
  description: [{ type: 'paragraph', text: { de: 'Ein <strong>schönes</strong> Haus.' } }],
  pricing: {
    currency: 'EUR',
    rates: [
      { season: 'main', pricePerNight: 90, periods: [{ from: '04-01', to: '09-30' }] },
      { season: 'off', pricePerNight: 60, periods: [{ from: '10-01', to: '03-31' }] },
    ],
    fees: [],
    minNights: null,
  },
  location: {
    lat: 37.75,
    lng: -0.85,
    address: {
      street: 'Calle Mayor',
      houseNumber: '7',
      postalCode: '30710',
      city: 'Los Alcázares',
      country: 'ES',
    },
    description: [{ type: 'paragraph', text: translation }],
  },
  images: {
    cover: { src: '/images/fixture/cover.webp', width: 1600, height: 1200 },
    gallery: [
      { src: '/images/fixture/b.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/c.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/d.webp', width: 1600, height: 1067 },
      { src: '/images/fixture/e.webp', width: 1600, height: 1067 },
    ],
  },
  highlights: [
    { key: 'guests', icon: 'group', value: 6, label: translation },
    { key: 'bedrooms', icon: 'bed', value: 3, label: translation },
    { key: 'bathrooms', icon: 'shower', value: 2, label: translation },
    { key: 'area', icon: 'area', value: 95, unit: 'sqm', label: translation },
  ],
  amenities: ['parking', 'pool'],
  houseRules: { checkInFrom: '15:00', checkOutUntil: '11:00', rules: ['pet', 'smoking'] },
}

test('describes the property as a VacationRental in the requested locale', () => {
  const data = buildVacationRental(property, 'en', ['Parking', 'Pool'])

  assert.equal(data['@context'], 'https://schema.org')
  assert.equal(data['@type'], 'VacationRental')
  assert.equal(data.name, 'Holiday home')
  assert.equal(data.url, 'https://solymarmenor.com/property/fixture')
})

test('uses the locale-prefixed URL for a non-default locale', () => {
  assert.equal(buildVacationRental(property, 'de', []).url, 'https://solymarmenor.com/de/property/fixture')
})

test('strips markup out of the description', () => {
  assert.equal(buildVacationRental(property, 'de', []).description, 'Ein schönes Haus.')
})

test('makes every image URL absolute', () => {
  const data = buildVacationRental(property, 'de', [])

  assert.equal(data.image.length, 5)
  assert.equal(data.image[0], 'https://solymarmenor.com/images/fixture/cover.webp')
  assert.ok(data.image.every((url) => url.startsWith('https://')))
})

test('maps the address and coordinates', () => {
  const data = buildVacationRental(property, 'de', [])

  assert.deepEqual(data.address, {
    '@type': 'PostalAddress',
    streetAddress: 'Calle Mayor 7',
    postalCode: '30710',
    addressLocality: 'Los Alcázares',
    addressCountry: 'ES',
  })
  assert.deepEqual(data.geo, { '@type': 'GeoCoordinates', latitude: 37.75, longitude: -0.85 })
})

test('reads occupancy, rooms and floor size out of the highlights', () => {
  const data = buildVacationRental(property, 'de', [])

  assert.equal(data.numberOfBedrooms, 3)
  assert.equal(data.numberOfBathroomsTotal, 2)
  assert.deepEqual(data.occupancy, { '@type': 'QuantitativeValue', maxValue: 6 })
  assert.deepEqual(data.floorSize, { '@type': 'QuantitativeValue', value: 95, unitCode: 'MTK' })
})

test('omits highlights the property does not carry', () => {
  const withoutRooms: Property = { ...property, highlights: [{ key: 'guests', icon: 'group', value: 2, label: translation }] }
  const data = buildVacationRental(withoutRooms, 'de', [])

  assert.ok(!('numberOfBedrooms' in data))
  assert.ok(!('floorSize' in data))
  assert.deepEqual(data.occupancy, { '@type': 'QuantitativeValue', maxValue: 2 })
})

test('inverts houseRules.rules, which lists what is forbidden', () => {
  // The translations settle the semantics: descriptions.pet reads
  // "Keine Haustiere erlaubt". Copying includes('pet') straight through would
  // publish the opposite of the truth.
  const data = buildVacationRental(property, 'de', [])

  assert.equal(data.petsAllowed, false)
  assert.equal(data.smokingAllowed, false)

  const permissive: Property = { ...property, houseRules: { ...property.houseRules, rules: [] } }
  const permissiveData = buildVacationRental(permissive, 'de', [])

  assert.equal(permissiveData.petsAllowed, true)
  assert.equal(permissiveData.smokingAllowed, true)
})

test('spans the price range across every season', () => {
  assert.equal(buildVacationRental(property, 'de', []).priceRange, '€60–€90')
})

test('lists the amenity names it was given', () => {
  const data = buildVacationRental(property, 'de', ['Parkmöglichkeit', 'Pool'])

  assert.deepEqual(data.amenityFeature, [
    { '@type': 'LocationFeatureSpecification', name: 'Parkmöglichkeit', value: true },
    { '@type': 'LocationFeatureSpecification', name: 'Pool', value: true },
  ])
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types src/lib/structured-data/vacation-rental.test.ts`
Expected: FAIL mit `ERR_MODULE_NOT_FOUND` für `./vacation-rental.ts`.

- [ ] **Step 3: Write `src/lib/structured-data/vacation-rental.ts`**

```ts
import { resolveText } from '../../data/localized-text.ts'
import type { Property } from '../../data/property-schema.ts'
import { absoluteUrl, localizedPathname } from '../metadata.ts'
import { plainText } from './text.ts'

/** UN/CEFACT code for square metre, which is what schema.org expects. */
const SQUARE_METRE = 'MTK'

type QuantitativeValue = {
  '@type': 'QuantitativeValue'
  value?: number
  maxValue?: number
  unitCode?: string
}

/**
 * Declared rather than inferred. The optional fields below are produced by
 * conditional spreads, which TypeScript infers as a union of two object shapes
 * — and a union makes `data.numberOfBedrooms` an error in the tests rather than
 * an optional read. Naming the shape also documents what this emits.
 */
export type VacationRentalData = {
  '@context': string
  '@type': 'VacationRental'
  name: string
  description: string
  url: string
  image: string[]
  address: {
    '@type': 'PostalAddress'
    streetAddress: string
    postalCode: string
    addressLocality: string
    addressCountry: string
  }
  geo: { '@type': 'GeoCoordinates'; latitude: number; longitude: number }
  checkinTime: string
  checkoutTime: string
  petsAllowed: boolean
  smokingAllowed: boolean
  priceRange: string
  numberOfBedrooms?: number
  numberOfBathroomsTotal?: number
  occupancy?: QuantitativeValue
  floorSize?: QuantitativeValue
  amenityFeature: Array<{ '@type': 'LocationFeatureSpecification'; name: string; value: boolean }>
}

function highlight(property: Property, key: string): number | undefined {
  return property.highlights.find((entry) => entry.key === key)?.value
}

/**
 * Builds the VacationRental description of a property.
 *
 * Amenity names come in from the caller rather than being resolved here: their
 * labels live in next-intl, whose server API would drag a Next runtime into a
 * function that is otherwise pure and therefore testable.
 *
 * Every field is derived from data `property-schema.ts` already enforces, so
 * this adds no new editorial burden.
 */
export function buildVacationRental(property: Property, locale: string, amenityNames: string[]): VacationRentalData {
  const nightlyRates = property.pricing.rates.map((rate) => rate.pricePerNight)
  const bedrooms = highlight(property, 'bedrooms')
  const bathrooms = highlight(property, 'bathrooms')
  const guests = highlight(property, 'guests')
  const area = highlight(property, 'area')
  const { address } = property.location

  return {
    '@context': 'https://schema.org',
    '@type': 'VacationRental',
    name: resolveText(property.title, locale),
    description: plainText(property.description, locale),
    url: absoluteUrl(localizedPathname(`/property/${property.slug}`, locale)),
    image: [property.images.cover, ...property.images.gallery].map((image) => absoluteUrl(image.src)),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${address.street} ${address.houseNumber}`,
      postalCode: address.postalCode,
      addressLocality: address.city,
      addressCountry: address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.location.lat,
      longitude: property.location.lng,
    },
    checkinTime: property.houseRules.checkInFrom,
    checkoutTime: property.houseRules.checkOutUntil,
    // houseRules.rules lists what is NOT allowed — see descriptions.pet,
    // "Keine Haustiere erlaubt". Hence the negation; copying the membership
    // test straight through would publish the opposite of the truth.
    petsAllowed: !property.houseRules.rules.includes('pet'),
    smokingAllowed: !property.houseRules.rules.includes('smoking'),
    priceRange: `€${Math.min(...nightlyRates)}–€${Math.max(...nightlyRates)}`,
    // Spread-or-nothing rather than an undefined value: JSON.stringify would
    // drop an undefined anyway, but an explicitly absent key is easier to
    // assert on and reads the same in the output.
    ...(bedrooms === undefined ? {} : { numberOfBedrooms: bedrooms }),
    ...(bathrooms === undefined ? {} : { numberOfBathroomsTotal: bathrooms }),
    ...(guests === undefined ? {} : { occupancy: { '@type': 'QuantitativeValue', maxValue: guests } }),
    ...(area === undefined ? {} : { floorSize: { '@type': 'QuantitativeValue', value: area, unitCode: SQUARE_METRE } }),
    amenityFeature: amenityNames.map((name) => ({
      '@type': 'LocationFeatureSpecification',
      name,
      value: true,
    })),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/lib/structured-data/vacation-rental.test.ts`
Expected: PASS, 10 Tests.

- [ ] **Step 5: Render it on the property page**

Ersetze `src/app/[locale]/property/[slug]/page.tsx` vollständig:

```tsx
import { PropertyView } from '@/components/property/PropertyView'
import { JsonLd } from '@/components/shared/JsonLd/JsonLd'
import { buildVacationRental } from '@/lib/structured-data/vacation-rental'
import { getPropertyBySlug } from '@/lib/properties/repository'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

type Params = Promise<{ locale: string; slug: string }>

export default async function PropertyPage({ params }: { params: Params }) {
  const { locale, slug } = await params

  const property = await getPropertyBySlug(slug)
  if (!property) {
    notFound()
  }

  const t = await getTranslations({ locale, namespace: 'pages.property.equipmentFeaturesSection' })
  const amenityNames = property.amenities.map((amenity) => t(`descriptions.${amenity}`))

  return (
    <>
      <JsonLd data={buildVacationRental(property, locale, amenityNames)} />
      <PropertyView configuration={property} />
    </>
  )
}
```

- [ ] **Step 6: Verify the rendered markup**

Run: `pnpm check-types`, dann `pnpm build && pnpm start`, dann:

```bash
curl -s http://localhost:3000/de/property/apartment | grep -o '<script type="application/ld+json">.*</script>' | head -1
```

Expected: ein JSON-LD-Block mit `"@type":"VacationRental"`, absoluten Bild-URLs und
`"petsAllowed":false`.

Den Block anschließend in den Schema-Validator unter https://validator.schema.org/ einfügen.
Expected: keine Fehler.

- [ ] **Step 7: Commit**

```bash
git add src/lib/structured-data/vacation-rental.ts src/lib/structured-data/vacation-rental.test.ts "src/app/[locale]/property/[slug]/page.tsx"
git commit -m "feat: describe properties as schema.org VacationRental"
```

---

## Task 14: `BreadcrumbList` je Objektseite

Von allen Auszeichnungen hier die mit der realistischsten Aussicht auf ein sichtbares Rich Result.

**Files:**
- Create: `src/lib/structured-data/breadcrumbs.ts`
- Test: `src/lib/structured-data/breadcrumbs.test.ts`
- Modify: `src/app/[locale]/property/[slug]/page.tsx`

**Interfaces:**
- Consumes: `absoluteUrl`, `localizedPathname` aus Aufgabe 1
- Produces: `buildBreadcrumbs(trail: { name: string; pathname: string }[], locale: string): object`

- [ ] **Step 1: Write the failing test**

Create `src/lib/structured-data/breadcrumbs.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildBreadcrumbs } from './breadcrumbs.ts'

const trail = [
  { name: 'Home', pathname: '/' },
  { name: 'Holiday home', pathname: '/property/fixture' },
]

test('numbers the trail from one', () => {
  const data = buildBreadcrumbs(trail, 'en')

  assert.equal(data['@type'], 'BreadcrumbList')
  assert.deepEqual(
    data.itemListElement.map((item) => item.position),
    [1, 2]
  )
})

test('resolves each item to an absolute URL in the given locale', () => {
  const data = buildBreadcrumbs(trail, 'de')

  assert.deepEqual(
    data.itemListElement.map((item) => item.item),
    ['https://solymarmenor.com/de', 'https://solymarmenor.com/de/property/fixture']
  )
})

test('omits the default locale prefix', () => {
  const data = buildBreadcrumbs(trail, 'en')

  assert.deepEqual(
    data.itemListElement.map((item) => item.item),
    ['https://solymarmenor.com/', 'https://solymarmenor.com/property/fixture']
  )
})

test('carries the names through', () => {
  const data = buildBreadcrumbs(trail, 'en')

  assert.deepEqual(
    data.itemListElement.map((item) => item.name),
    ['Home', 'Holiday home']
  )
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types src/lib/structured-data/breadcrumbs.test.ts`
Expected: FAIL mit `ERR_MODULE_NOT_FOUND` für `./breadcrumbs.ts`.

- [ ] **Step 3: Write `src/lib/structured-data/breadcrumbs.ts`**

```ts
import { absoluteUrl, localizedPathname } from '../metadata.ts'

export type BreadcrumbStep = {
  name: string
  pathname: string
}

/**
 * Builds the breadcrumb trail. Of the markup in this project, this is the one
 * with a realistic chance of a visible rich result — Google renders breadcrumb
 * trails in place of the raw URL in a search snippet.
 */
export function buildBreadcrumbs(trail: BreadcrumbStep[], locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: absoluteUrl(localizedPathname(step.pathname, locale)),
    })),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/lib/structured-data/breadcrumbs.test.ts`
Expected: PASS, 4 Tests.

- [ ] **Step 5: Render it on the property page**

In `src/app/[locale]/property/[slug]/page.tsx` den Import ergänzen:

```tsx
import { buildBreadcrumbs } from '@/lib/structured-data/breadcrumbs'
import { resolveText } from '@/data/localized-text'
```

Und alles ab der Zeile `return (` bis zum Ende der Funktion ersetzen durch (die
`navigation`-Zeile kommt also noch **vor** das `return`):

```tsx
  // 'components.navigation' is the namespace LayoutNavigation.tsx already uses;
  // reusing it keeps the breadcrumb label identical to the visible nav item.
  const navigation = await getTranslations({ locale, namespace: 'components.navigation' })

  return (
    <>
      <JsonLd data={buildVacationRental(property, locale, amenityNames)} />
      <JsonLd
        data={buildBreadcrumbs(
          [
            { name: navigation('home'), pathname: '/' },
            { name: resolveText(property.title, locale), pathname: `/property/${property.slug}` },
          ],
          locale
        )}
      />
      <PropertyView configuration={property} />
    </>
  )
```

Der Schlüssel ist bereits in allen drei Sprachdateien vorhanden — „Startseite" / „Home" /
„Inicio" — es sind also keine neuen Übersetzungen nötig. Zur Kontrolle:

```bash
node -e "for (const l of ['de','en','es']) console.log(l, require('./public/locales/'+l+'.json').components.navigation.home)"
```

Expected: `de Startseite`, `en Home`, `es Inicio`.

- [ ] **Step 6: Verify and commit**

Run: `pnpm check-types` und `pnpm test` — erwartet: sauber.
Run: `pnpm build && pnpm start`, dann:

```bash
curl -s http://localhost:3000/de/property/apartment | grep -c 'application/ld+json'
```

Expected: `2`.

```bash
git add src/lib/structured-data/breadcrumbs.ts src/lib/structured-data/breadcrumbs.test.ts "src/app/[locale]/property/[slug]/page.tsx"
git commit -m "feat: add breadcrumb structured data to property pages"
```

---

## Task 15: `LodgingBusiness` und `WebSite` auf der Startseite

**Files:**
- Create: `src/lib/structured-data/site.ts`
- Test: `src/lib/structured-data/site.test.ts`
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `absoluteUrl`, `localizedPathname` aus Aufgabe 1
- Produces: `buildSiteGraph(locale: string): object`

- [ ] **Step 1: Write the failing test**

Create `src/lib/structured-data/site.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildSiteGraph } from './site.ts'

/**
 * The two graph nodes have different shapes, so indexing the array yields a
 * union and `node.publisher` would not type-check. Round-tripping through JSON
 * — which is exactly what `<JsonLd />` does before the markup reaches a crawler
 * — gives plain records to assert against, and incidentally proves the output
 * is serialisable.
 */
function nodesOf(locale: string): Record<string, unknown>[] {
  const graph = JSON.parse(JSON.stringify(buildSiteGraph(locale))) as {
    '@context': string
    '@graph': Record<string, unknown>[]
  }

  return graph['@graph']
}

test('emits a LodgingBusiness and a WebSite in one graph', () => {
  assert.equal(buildSiteGraph('de')['@context'], 'https://schema.org')
  assert.deepEqual(
    nodesOf('de').map((node) => node['@type']),
    ['LodgingBusiness', 'WebSite']
  )
})

test('uses the same @id as the guestbook markup, so both describe one entity', () => {
  // Task 16 emits '<BASE_URL>/#organization' too. If these ever drift apart,
  // the reviews stop attaching to the business this page describes.
  assert.equal(nodesOf('de')[0]?.['@id'], 'https://solymarmenor.com/#organization')
})

test('gives both nodes stable identifiers so they can reference each other', () => {
  const [organization, website] = nodesOf('de')

  assert.equal(organization?.['@id'], 'https://solymarmenor.com/#organization')
  assert.deepEqual(website?.publisher, { '@id': 'https://solymarmenor.com/#organization' })
})

test('points the WebSite at the requested locale', () => {
  assert.equal(nodesOf('de')[1]?.url, 'https://solymarmenor.com/de')
  assert.equal(nodesOf('en')[1]?.url, 'https://solymarmenor.com/')
})

test('declares the language of the variant', () => {
  assert.equal(nodesOf('es')[1]?.inLanguage, 'es')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types src/lib/structured-data/site.test.ts`
Expected: FAIL mit `ERR_MODULE_NOT_FOUND` für `./site.ts`.

- [ ] **Step 3: Write `src/lib/structured-data/site.ts`**

```ts
import { BASE_URL, absoluteUrl, localizedPathname } from '../metadata.ts'

const SITE_NAME = 'Sol y Mar Menor'

/**
 * The site-level entity graph.
 *
 * Both nodes carry an `@id` so the WebSite can point its publisher at the
 * business node instead of repeating it — that is what tells a consumer the
 * two describe one thing rather than two, and it is the same @id the guestbook
 * markup in reviews.ts uses.
 *
 * No `potentialAction`/SearchAction: the site has no search, and claiming one
 * that does not exist is the kind of markup that gets a site's structured data
 * distrusted wholesale.
 */
export function buildSiteGraph(locale: string) {
  const organizationId = `${BASE_URL}/#organization`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // LodgingBusiness, not Organization: Task 16 marks up the same @id on
        // the guestbook page, and one identifier carrying two different types
        // across pages is what makes a consumer distrust the whole graph.
        // LodgingBusiness is a subtype of Organization, so WebSite.publisher
        // still accepts it, and it is the more accurate type for a holiday let.
        //
        // No `logo`: schema.org means an actual logo there, and this project has
        // none — src/components/shared/Logo/Logo.tsx draws a CSS circle with the
        // letters SM, not an image file. `image` takes a photo of the business
        // honestly; an omitted optional field beats a wrong one.
        '@type': 'LodgingBusiness',
        '@id': organizationId,
        name: SITE_NAME,
        url: BASE_URL,
        image: absoluteUrl('/og/default.jpg'),
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        name: SITE_NAME,
        url: absoluteUrl(localizedPathname('/', locale)),
        inLanguage: locale,
        publisher: { '@id': organizationId },
      },
    ],
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/lib/structured-data/site.test.ts`
Expected: PASS, 5 Tests.

- [ ] **Step 5: Render it on the home page**

Ersetze `src/app/[locale]/page.tsx` vollständig:

```tsx
import { HomeView } from '@/components/home/HomeView'
import { JsonLd } from '@/components/shared/JsonLd/JsonLd'
import { buildSiteGraph } from '@/lib/structured-data/site'
import React from 'react'

type Params = Promise<{ locale: string }>

export default async function HomePage({ params }: { params: Params }) {
  const { locale } = await params

  return (
    <>
      <JsonLd data={buildSiteGraph(locale)} />
      <HomeView />
    </>
  )
}
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm check-types`, dann `pnpm build && pnpm start`, dann:

```bash
curl -s http://localhost:3000/de | grep -o '"@type":"LodgingBusiness"'
```

Expected: eine Fundstelle.

```bash
git add src/lib/structured-data/site.ts src/lib/structured-data/site.test.ts "src/app/[locale]/page.tsx"
git commit -m "feat: add LodgingBusiness and WebSite structured data"
```

---

## Task 16: Bewertungen auf der Gästebuchseite

**Zwei Einschränkungen, die im Code als Kommentar festgehalten gehören:**

1. `src/utils/db/schema.ts` kennt keine Zuordnung eines Gästebucheintrags zu einem Objekt. Die
   Bewertungen können daher nur der Site als Ganzes zugeschrieben werden.
2. Google zeigt seit 2019 **keine** Sterne-Snippets für selbst gehostete Bewertungen über das
   eigene Unternehmen. Diese Auszeichnung ist korrekt und hilft beim Verständnis der Entität, sie
   wird aber keine Sterne erzeugen.

**Files:**
- Create: `src/lib/structured-data/reviews.ts`
- Test: `src/lib/structured-data/reviews.test.ts`
- Modify: `src/app/[locale]/guestbook/page.tsx`

**Interfaces:**
- Consumes: `GuestbookEntry` aus `src/components/shared/GuestbookForm/types.ts`; `BASE_URL` aus Aufgabe 1
- Produces: `buildGuestbookRatings(entries: GuestbookEntry[], locale: string): object | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/structured-data/reviews.test.ts`:

```ts
import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { GuestbookEntry } from '../../components/shared/GuestbookForm/types.ts'
import { buildGuestbookRatings } from './reviews.ts'

const entries: GuestbookEntry[] = [
  { id: 1, name: 'Anna', message: 'Wunderbar.', rating: 5, created_at: '2026-07-01T10:00:00.000Z' },
  { id: 2, name: 'Ben', message: 'Sehr schön.', rating: 4, created_at: '2026-07-02T10:00:00.000Z' },
  { id: 3, name: 'Cara', message: 'Gut.', rating: 3, created_at: '2026-07-03T10:00:00.000Z' },
]

const unrated: GuestbookEntry = { id: 4, name: 'Dan', message: 'Hallo.', rating: 0, created_at: '2026-07-04T10:00:00.000Z' }

/** Narrows away the null return so each test can assert on the payload. */
function ratingsOf(input: GuestbookEntry[]) {
  const data = buildGuestbookRatings(input, 'de')
  assert.ok(data, 'expected ratings for this input')

  return data
}

test('averages the ratings and counts them', () => {
  const { aggregateRating } = ratingsOf(entries)

  assert.equal(aggregateRating['@type'], 'AggregateRating')
  assert.equal(aggregateRating.ratingValue, 4)
  assert.equal(aggregateRating.reviewCount, 3)
  assert.equal(aggregateRating.bestRating, 5)
  assert.equal(aggregateRating.worstRating, 1)
})

test('rounds the average to one decimal', () => {
  const fourth: GuestbookEntry = { id: 4, name: 'Eve', message: 'Top.', rating: 5, created_at: '2026-07-04T10:00:00.000Z' }

  // (5 + 4 + 3 + 5) / 4 = 4.25
  assert.equal(ratingsOf([...entries, fourth]).aggregateRating.ratingValue, 4.3)
})

test('maps each entry to a Review', () => {
  const { review } = ratingsOf(entries)

  assert.equal(review.length, 3)
  assert.deepEqual(review[0], {
    '@type': 'Review',
    author: { '@type': 'Person', name: 'Anna' },
    datePublished: '2026-07-01',
    reviewBody: 'Wunderbar.',
    reviewRating: { '@type': 'Rating', ratingValue: 5, bestRating: 5, worstRating: 1 },
  })
})

test('skips entries without a rating, which would drag the average down', () => {
  // `rating` defaults to 0 in the database; treating that as a zero-star review
  // would misreport the average as 3.
  const { aggregateRating } = ratingsOf([...entries, unrated])

  assert.equal(aggregateRating.reviewCount, 3)
  assert.equal(aggregateRating.ratingValue, 4)
})

test('returns null when there is nothing to aggregate', () => {
  assert.equal(buildGuestbookRatings([], 'de'), null)
  assert.equal(buildGuestbookRatings([unrated], 'de'), null)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --experimental-strip-types src/lib/structured-data/reviews.test.ts`
Expected: FAIL mit `ERR_MODULE_NOT_FOUND` für `./reviews.ts`.

- [ ] **Step 3: Write `src/lib/structured-data/reviews.ts`**

```ts
import type { GuestbookEntry } from '../../components/shared/GuestbookForm/types.ts'
import { BASE_URL, absoluteUrl, localizedPathname } from '../metadata.ts'

const BEST_RATING = 5
const WORST_RATING = 1

/**
 * Marks up the guestbook as reviews of the business.
 *
 * Two limits worth knowing before expecting anything of this:
 *
 * 1. The guestbook has no property association — `guestbook` in
 *    src/utils/db/schema.ts holds no property id — so the reviews belong to the
 *    site as a whole, not to the apartment or the house individually.
 * 2. Google has not shown star snippets for self-serving reviews (a business
 *    hosting reviews about itself) since 2019. This markup is valid and helps a
 *    consumer understand the entity, but it will not put stars in a search
 *    result. Anyone expecting otherwise will be disappointed.
 *
 * Returns null when there is nothing to report, so the caller renders no empty
 * AggregateRating — a rating of zero out of nothing is worse than silence.
 */
export function buildGuestbookRatings(entries: GuestbookEntry[], locale: string) {
  // `rating` defaults to 0 in the database, which is not a rating anyone gave.
  // Counting those as zero-star reviews would misreport the average.
  const rated = entries.filter((entry) => entry.rating >= WORST_RATING && entry.rating <= BEST_RATING)

  if (rated.length === 0) {
    return null
  }

  const average = rated.reduce((sum, entry) => sum + entry.rating, 0) / rated.length

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${BASE_URL}/#organization`,
    name: 'Sol y Mar Menor',
    url: absoluteUrl(localizedPathname('/guestbook', locale)),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: Math.round(average * 10) / 10,
      reviewCount: rated.length,
      bestRating: BEST_RATING,
      worstRating: WORST_RATING,
    },
    review: rated.map((entry) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: entry.name },
      // Date only: the time of day is noise in a review, and schema.org's
      // datePublished is documented as a date.
      datePublished: entry.created_at.slice(0, 10),
      reviewBody: entry.message,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: entry.rating,
        bestRating: BEST_RATING,
        worstRating: WORST_RATING,
      },
    })),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test --experimental-strip-types src/lib/structured-data/reviews.test.ts`
Expected: PASS, 5 Tests.

- [ ] **Step 5: Render it on the guestbook page**

Ersetze `src/app/[locale]/guestbook/page.tsx` vollständig:

```tsx
'use server'

import { EmptyGuestbookView } from '@/components/guestbook/EmptyGuestbookView'
import { GuestbookView } from '@/components/guestbook/GuestbookView'
import { JsonLd } from '@/components/shared/JsonLd/JsonLd'
import { GuestbookEntry } from '@/components/shared/GuestbookForm/types'
import { buildGuestbookRatings } from '@/lib/structured-data/reviews'
import { db } from '@/utils/db'
import { guestbook } from '@/utils/db/schema'
import { desc } from 'drizzle-orm'

type Params = Promise<{ locale: string }>

export default async function GuestbookPage({ params }: { params: Params }) {
  const { locale } = await params
  const data = await db.select().from(guestbook).orderBy(desc(guestbook.created_at))

  if (data.length === 0) {
    return <EmptyGuestbookView />
  }

  const entries = data.map((entry) => ({
    ...entry,
    created_at: entry.created_at.toISOString(),
  })) as GuestbookEntry[]

  const ratings = buildGuestbookRatings(entries, locale)

  return (
    <>
      {ratings && <JsonLd data={ratings} />}
      <GuestbookView entries={entries} />
    </>
  )
}
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm check-types` und `pnpm test` — erwartet: sauber.
Run: `pnpm build && pnpm start`, dann:

```bash
curl -s http://localhost:3000/de/guestbook | grep -o '"@type":"AggregateRating"'
```

Expected: eine Fundstelle (sofern die Datenbank bewertete Einträge enthält).

```bash
git add src/lib/structured-data/reviews.ts src/lib/structured-data/reviews.test.ts "src/app/[locale]/guestbook/page.tsx"
git commit -m "feat: mark up guestbook entries as reviews"
```

---

## Task 17: Abschluss und Gesamtverifikation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the SEO conventions in `README.md`**

Ergänze einen Abschnitt „SEO":

```markdown
## SEO

Kanonische URLs, hreflang, Sitemap und robots.txt werden erzeugt, nicht gepflegt. Die statischen
Dateien `public/sitemap.xml` und `public/robots.txt` gibt es nicht mehr — sie hätten die Routen
`src/app/sitemap.ts` und `src/app/robots.ts` beschattet.

Alle URLs entstehen über `localizedPathname` in `src/lib/metadata.ts`. Diese Funktion bildet
`localePrefix: 'as-needed'` ab: Englisch ist die Standardsprache und wird **ohne** Präfix
ausgeliefert, `/en/aboutus` leitet auf `/aboutus` weiter. Wer eine URL selbst zusammensetzt,
riskiert, ein Canonical auf eine Weiterleitung zu richten — genau der Fehler, den `metadata.test.ts`
und `sitemap.test.ts` seither festnageln.

Eine neue Seite braucht einen Eintrag in `STATIC_ROUTES` in `src/app/sitemap.ts`; fehlt er,
schlägt `sitemap.test.ts` fehl.

Structured Data liegt in `src/lib/structured-data/`, gerendert über `<JsonLd />`. Die
Bewertungen im Gästebuch erzeugen **keine** Sterne in Google-Suchergebnissen: selbst gehostete
Bewertungen über das eigene Unternehmen sind davon seit 2019 ausgenommen.
```

- [ ] **Step 2: Run the complete verification**

```bash
pnpm check-types
pnpm lint
pnpm test
pnpm validate:content
pnpm build
```

Expected: alle fünf ohne Fehler. `pnpm test` meldet **146** bestandene Tests: 89 aus der Baseline
plus 14 (Aufgabe 1) + 5 (5) + 9 (8) + 5 (12) + 10 (13) + 4 (14) + 5 (15) + 5 (16).
Aufgabe 1 trägt 14 statt der ursprünglich geplanten 8 bei: sechs Tests für `needsLocalePrefix`
kamen aus Ruling 4 dazu (siehe Ledger). Weicht die Zahl
ab, fehlt eine Testdatei oder eine ist nicht vom Glob `src/**/*.test.ts` erfasst — nicht
weitermachen, bevor das geklärt ist.

- [ ] **Step 3: Verify the deployed-shape output once more**

Bei laufendem `pnpm start`:

```bash
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml | grep -c "<url>"       # 24
curl -s http://localhost:3000/sitemap.xml | grep -c "com/en"      # 0
curl -s http://localhost:3000/aboutus | grep -c 'name="keywords"' # 0
curl -s http://localhost:3000/de/property/apartment | grep -c 'application/ld+json' # 2
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document the SEO and web vitals conventions"
```

- [ ] **Step 5: Deployment-Hinweise an den Betreiber**

Nach dem Deploy sind drei Dinge von Hand zu tun — sie stehen nicht im Code und passieren sonst nicht:

1. **`pnpm db:migrate` gegen die Produktionsdatenbank fahren**, bevor die neue Version läuft.
   Ohne die Tabelle `web_vitals` schlägt jeder Beacon fehl (folgenlos für Besucher, aber es kommen
   keine Daten an).
2. **In der Search Console die neue Sitemap einreichen** unter
   `https://solymarmenor.com/sitemap.xml`. Die alte Datei hatte denselben Pfad, ein erneutes
   Einreichen stößt aber die Neuverarbeitung an.
3. **Prüfen, ob `solymarmenor.de` existiert** und per 301 auf `solymarmenor.com` weiterleitet.
   Läuft dort eine zweite Kopie der Inhalte, konkurrieren beide Domains um dieselben Rankings.

---

## Nach diesem Plan

Ausdrücklich **nicht** Teil dieses Plans, in dieser Reihenfolge sinnvoll als Nächstes:

1. **Metrik-Optimierung anhand der Daten.** Nach ein bis zwei Wochen `pnpm vitals:report` laufen
   lassen und gezielt die schlechteste Metrik angehen — typischerweise LCP über `priority` auf
   dem Cover-Bild und korrekte `sizes`-Angaben. Erst messen, dann ändern.
2. **Objektbezug im Gästebuch.** Eine Property-Spalte in `guestbook` würde die Bewertungen dem
   jeweiligen Objekt zuordnen statt nur der Site.
3. **Tippfehler in den Übersetzungen.** `public/locales/de.json` enthält unter
   `pages.property.houseRulesSection.itemHeadlines.party` „Veranstalltungen" (doppeltes l) und
   unter `equipmentFeaturesSection.descriptions.tv` „Fernsehr". Beide stehen sichtbar auf der Seite.
