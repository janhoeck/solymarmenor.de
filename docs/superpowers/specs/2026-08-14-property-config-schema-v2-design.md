# Property-Config Schema v2

**Datum:** 2026-08-14
**Status:** Design freigegeben, Umsetzung ausstehend

## Ziel

Die Objektdaten in `public/propertyConfigs/*.json` so umbauen, dass sie validiert, erweiterbar
und ohne Neumodellierung in eine Postgres-Datenbank überführbar sind. Der Umbau erfolgt in drei
einzeln deploybaren Etappen; das Zielschema wird vorab vollständig festgelegt, damit die Etappen
nicht gegeneinander arbeiten.

## Ausgangslage

Zwei Objekte (`apartment`, `house`), je ~17 KB JSON, gelesen über `src/lib/load-property-configs.ts`
per `fs` und `process.cwd()`, typisiert über einen handgepflegten Typ in
`src/types/PropertyConfiguration.ts`, konsumiert von 18 Dateien unter `src/`.

Befunde, die den Umbau motivieren:

1. **Die Configs liegen in `public/` und werden statisch ausgeliefert.** Unter
   `https://solymarmenor.de/propertyConfigs/apartment.json` war der vollständige Objekt-Datensatz
   inklusive der Airbnb-iCal-URLs samt Token abrufbar. Gelesen werden die Dateien ausschließlich
   serverseitig (`load-property-configs.ts:19`), sie müssen dort also gar nicht liegen.
2. **Keine Validierung.** `JSON.parse(...) as PropertyConfiguration` (`load-property-configs.ts:21`)
   ist ein ungeprüfter Cast. Ein Tippfehler in den Daten fällt erst als 404 in Produktion auf, weil
   der Loader Fehler nur loggt und `undefined` zurückgibt.
3. **Fakten und Anzeigetexte sind vermischt.** `propertyDetails` speichert `amount: 4` *und*
   `subtitle: {de: "4 Betten", …}`; `checkIn` enthält den Satz „Check-in ab 15:00 Uhr" statt der
   Uhrzeit. Ableitbarer Text wird dreifach gepflegt und ist nicht auswertbar.
4. **`DescriptionItem` ist eine Union ohne Diskriminator** (`TranslationMap | {text?, bulletpoints}`),
   erkannt über `'bulletpoints' in item` (`src/components/property/utils.ts:8`). Ein neuer Blocktyp
   bricht den Type Guard.
5. **`imageSources` ist ein nacktes String-Array.** Keine Alt-Texte, keine Dimensionen, das
   Cover-Bild nur per Konvention auf Index 0.
6. **Amenity-Kategorien sind im TypeScript-Typ verdrahtet** (`Extract<IconType, 'pool' | …>`), eine
   neue Ausstattung erfordert eine Typänderung. `AmenitiesSection.tsx` rendert sechs fest
   verdrahtete Kategorieblöcke.
7. **`id` ist zugleich Dateiname, URL-Slug und Primärschlüssel.**
8. **`TranslationMap` verlangt `de`, `en` und `es` als Pflichtfelder.** Eine vierte Sprache
   erfordert die vollständige Übersetzung beider Objekte in einem Schritt, sonst kompiliert es nicht.
9. **Preise ohne Währung und ohne definierte Saisonzeiträume.**
10. **`house.json` → `propertyDetails` ist ein unveränderter Klon aus `apartment.json`**, inklusive
    `area_size: 95`. Die Werte für das Haus sind fachlich zu prüfen.
11. **Die iCal-URL wird über den Client geführt.** `CalendarCard.tsx:39` baut
    `/api/ics?url=<Token-URL>`, die URL steht damit im ausgelieferten HTML jeder Objektseite — das
    Verschieben der Configs aus `public/` allein behebt die Offenlegung des Tokens also nicht.
    Zusätzlich ist `src/app/api/ics/route.ts` dadurch ein offener Proxy: die Prüfung
    `icalUrl.includes('airbnb')` (`route.ts:14`) trifft auf jede URL zu, die den String an
    beliebiger Stelle enthält, etwa `https://fremde-domain.example/airbnb`. Der Endpunkt lädt
    serverseitig eine beliebige Adresse und gibt den Rumpf zurück.

## Entscheidungen

Getroffen im Brainstorming, sie begrenzen den Lösungsraum:

- **Objekttexte bleiben beim Objekt.** Keine Auslagerung der Beschreibungen nach next-intl. Vokabular
  (Amenity-Namen, Kategorie-Überschriften, Regel-Labels) liegt weiterhin in next-intl — so ist es
  bereits heute, nur die Keys stehen im JSON.
- **Umfang offen.** Die Struktur muss sowohl bei 2 als auch bei 50 Objekten tragen, ohne heute
  Overhead für den größeren Fall zu bauen.
- **Vorgehen in drei Etappen** mit vorab festgelegtem Zielschema.
- **Uhrzeiten sind Werte, keine Texte** — Ausnahme von „Texte beim Objekt", da formatierbar und
  vergleichbar.

## Nicht-Ziele

- Kein Admin-UI, kein Buchungssystem, keine Preisberechnung (nur die Datenstruktur dafür).
- Keine vierte Sprache — nur die Voraussetzung dafür schaffen.
- Kein Testframework (das Projekt hat keines, `.github/workflows/` ist leer).
- Keine Änderung bestehender URLs.
- Kein Umbau von `src/lib/metadata.ts` / SEO-Markup.
- Die Datenbank selbst ist nicht Teil dieses Specs, nur die Vorbereitung darauf.

## Zielschema v2

### Lokalisierung

```ts
type Locale = 'de' | 'en' | 'es'
type LocalizedText = Partial<Record<Locale, string>>
```

Pflicht ist ausschließlich `de` (Redaktionssprache), erzwungen über `.refine()`. Auflösung über eine
Fallback-Kette: **angefragte Sprache → `de` → erste vorhandene**. Heute liefert `getTranslation`
(`src/components/property/utils.ts:19`) bei einer Lücke einen leeren String, der unbemerkt als leeres
Element durchrutscht.

Die Kette ist bewusst unabhängig von `routing.defaultLocale` (aktuell `'en'`, `src/i18n/routing.ts`):
jene Einstellung steuert URLs, diese die inhaltliche Vollständigkeit.

### Content-Blöcke

Ersetzt `Description` / `DescriptionItem`. Wird von `description`, `location.description` und
`houseRules.notes` gemeinsam verwendet.

```ts
type ContentBlock =
  | { type: 'paragraph'; text: LocalizedText }
  | { type: 'list'; intro?: LocalizedText; items: LocalizedText[] }
  | { type: 'note'; variant: 'info' | 'warning'; text: LocalizedText }
```

`bulletpoints` heißt künftig `items`, `text` im Listenkontext heißt `intro`. Der Type Guard
`isTranslatedText` und `convertDescription` (`utils.ts:7`, `:23`) entfallen zugunsten eines Switch
über `type`.

Absätze, die ihr Label im Fließtext tragen („Wichtiger Hinweis: Haustiere sind in der Wohnanlage
nicht gestattet."), werden zu `note`-Blöcken mit eigener Darstellung; das Label steht dann nicht mehr
dreisprachig im Text.

### Vollständiges Objekt

```jsonc
{
  "schemaVersion": 2,
  "id": "apartment",
  "slug": "apartment",
  "status": "published",              // published | draft
  "kind": "apartment",                // apartment | house
  "updatedAt": "2026-08-14",
  "calendar": { "provider": "airbnb", "secretRef": "ICAL_APARTMENT" },

  "title":    { "de": "…", "en": "…", "es": "…" },
  "subtitle": { "de": "…", "en": "…", "es": "…" },
  "description": [ /* ContentBlock[] */ ],

  "location": {
    "lat": 37.75631326446151,
    "lng": -0.8499044215669385,
    "address": {
      "building": "Puerto Marina",
      "street": "Calle Isla de Ibiza",
      "houseNumber": "13",
      "floorApartment": "1° A17",
      "postalCode": "30710",
      "city": "Los Alcázares",
      "country": "ES",
      "note": { "de": "…" }
    },
    "description": [ /* ContentBlock[] */ ]
  },

  "images": {
    "cover": { "src": "/images/apartment/coverPhoto.webp", "width": 1600, "height": 1067 },
    "gallery": [
      {
        "src": "/images/apartment/IMG_9806.webp",
        "width": 1600,
        "height": 1067,
        "alt": { "de": "Wohnzimmer mit Blick zum Balkon" },
        "category": "living"
      }
    ]
  },

  "highlights": [
    { "key": "guests",    "icon": "group",     "value": 4,  "label": { "de": "Gäste" } },
    { "key": "bedrooms",  "icon": "bed",       "value": 2,  "label": { "de": "Schlafzimmer" } },
    { "key": "beds",      "icon": "bed",       "value": 4,  "label": { "de": "Betten" } },
    { "key": "bathrooms", "icon": "bathtub",   "value": 1,  "label": { "de": "Badezimmer" } },
    { "key": "area",      "icon": "area_size", "value": 95, "unit": "sqm", "label": { "de": "Fläche" } }
  ],

  "amenities": ["parking", "air_conditioner", "wlan", "tv", "pool", "balcony", "cooker", "kettle"],

  "pricing": {
    "currency": "EUR",
    "rates": [
      { "season": "off",  "pricePerNight": 70, "periods": [] },
      { "season": "main", "pricePerNight": 85, "periods": [] }
    ],
    "fees": [{ "type": "cleaning", "amount": 85, "basis": "perStay" }],
    "minNights": null
  },

  "houseRules": {
    "checkInFrom": "15:00",
    "checkOutUntil": "11:00",
    "rules": ["party", "pet", "smoking"],
    "notes": [ /* ContentBlock[] */ ]
  }
}
```

### Feldregeln

| Feld | Regel |
|---|---|
| `schemaVersion` | Literal `2`. Dient dem späteren DB-/Import-Pfad, nicht der parallelen Unterstützung mehrerer Formen — Daten und Code sind gemeinsam in Git versioniert, Zwischenstände der Etappen sind transient. |
| `id` | Stabiler Schlüssel, wird später Fremdschlüssel bzw. externer Schlüssel der DB-Zeile. Unveränderlich. |
| `slug` | URL-Segment unter `/property/[slug]`. Startet identisch zu `id`, damit keine bestehende URL bricht. Ein sprechender SEO-Slug ist später eine Datenänderung plus Redirect. |
| `status` | `draft` wird vom Repository herausgefiltert. |
| `calendar.secretRef` | Name der Umgebungsvariable, nicht deren Wert. Optional — Objekte ohne Kalender lassen `calendar` weg. |
| `address.country` | ISO-3166-Alpha-2 (`"ES"`) statt Klartext, Anzeige lokalisiert über next-intl. |
| `address.note` | Ersetzt das heutige `address.description` (beim Haus der Google-Maps-Hinweis) — es ist ein einzelner Text, kein Block-Array. |
| `images.gallery[].alt` | Optional. Fallback: Objekt-`title` in der aktiven Sprache. |
| `images.gallery[].category` | Optional, Enum: `exterior`, `living`, `bedroom`, `kitchen`, `bathroom`, `outdoor`, `pool`, `surroundings`. |
| `highlights[].key` | Enum: `guests`, `bedrooms`, `beds`, `bathrooms`, `area`. Trägt die Bedeutung; `icon` trägt nur die Darstellung. Pro Objekt maximal einmal je `key`. |
| `highlights[].unit` | Optional, aktuell nur `sqm`. Die UI formatiert `value` + `unit`. |
| `highlights[].caption` | Optional. Nur setzen, wenn ein eigener Text nötig ist — nicht für Wiederholungen von `value`. |
| `amenities` | Flache Liste stabiler Keys, jeder muss in der Registry existieren. Duplikate sind ein Validierungsfehler. |
| `pricing.rates[].season` | Enum: `off`, `main`, `peak`. |
| `pricing.rates[].periods[]` | `{ "from": "MM-DD", "to": "MM-DD" }`, jährlich wiederkehrend. Leeres Array = keine Zeiträume hinterlegt; die UI verhält sich dann wie heute. |
| `pricing.fees[].basis` | Enum: `perStay`, `perNight`, `perPerson`. |
| `pricing.minNights` | Ganzzahl ≥ 1 oder `null`. `null` bedeutet „keine Mindestdauer hinterlegt"; die UI blendet die Angabe dann aus. |
| `houseRules.checkInFrom` / `checkOutUntil` | `HH:MM` (24 h). Die UI formatiert daraus den lokalisierten Satz. |

### Registries

Objektunabhängige Stammdaten, später Referenztabellen in der DB — sie wandern **nicht** in die
Property-Zeile.

`src/data/amenities.ts`:

```ts
export const AMENITY_CATEGORY_ORDER = [
  'general', 'outdoorArea', 'kitchen', 'bedroom', 'bathroom', 'baby',
] as const

export const AMENITIES = {
  pool:    { category: 'outdoorArea', icon: 'pool' },
  balcony: { category: 'outdoorArea', icon: 'balcony' },
  // …
} as const satisfies Record<string, { category: AmenityCategory; icon: IconType }>
```

Die Kategorie-Bezeichner bleiben exakt die heutigen (`general`, `outdoorArea`, `kitchen`, `bedroom`,
`bathroom`, `baby`), damit die bestehenden next-intl-Keys `pages.property.equipmentFeaturesSection.subHeadlines.*`
unverändert gültig bleiben. `AMENITY_CATEGORY_ORDER` legt die Anzeigereihenfolge deterministisch fest.

`src/data/highlight-keys.ts` analog für die fünf Highlight-Keys mit Default-Icon.

## Technische Umsetzung

### Zod als einzige Quelle der Wahrheit

`src/data/property-schema.ts` definiert das Schema, der Typ entsteht daraus:

```ts
export const propertySchema = z.object({ /* … */ })
export type Property = z.infer<typeof propertySchema>
```

`src/types/PropertyConfiguration.ts` entfällt. Typ und Daten können nicht mehr auseinanderlaufen.

### Statisches Laden statt `fs`

Sobald die Dateien `public/` verlassen, wird `path.join(process.cwd(), …)` fragil — Next traced beim
Build nur erkannte Abhängigkeiten, ein zur Laufzeit zusammengesetzter Pfad gehört nicht dazu.
Stattdessen ein expliziter Index:

```ts
// src/data/properties/index.ts
import apartment from './apartment.json'
import house from './house.json'

export const properties: Property[] = [apartment, house].map((raw) => propertySchema.parse(raw))
```

Ein fehlerhaftes JSON lässt damit den Build scheitern statt in Produktion eine 404 zu erzeugen. Ein
neues Objekt ist eine Import-Zeile statt einer Verzeichniskonvention.

### Repository als Naht zur Datenbank

Alle Consumer gehen künftig ausschließlich über `src/lib/properties/repository.ts`:

```ts
export async function getProperties(): Promise<Property[]>          // nur status: 'published'
export async function getPropertyBySlug(slug: string): Promise<Property | undefined>
export async function getPropertyById(id: string): Promise<Property | undefined>
```

Bewusst `async`, obwohl heute nichts asynchron ist: beim DB-Umzug ändert sich genau diese Datei und
kein einziger Aufrufer. `src/app/[locale]/property/[slug]/page.tsx:9` wird dafür von `use(params)` auf
`await params` umgestellt. Solange die JSONs die Quelle sind, bleibt das Ergebnis statisch und wird
zur Build-Zeit eingebettet.

`src/lib/load-property-configs.ts` entfällt.

### Migrationsskript

`scripts/migrate-properties.mjs`, einmalig, deterministisch, Ergebnis wird eingecheckt, Skript danach
gelöscht — es ist Werkzeug, kein Bestandteil des Codes.

Abbildungsregeln v1 → v2:

- `TranslationMap` → `LocalizedText` (unverändert übernommen, alle drei Sprachen vorhanden).
- Ein reiner `TranslationMap`-Eintrag in `description` → `{ type: 'paragraph', text }`.
- Ein `{text?, bulletpoints}`-Eintrag → `{ type: 'list', intro: text, items: bulletpoints }`.
- Absätze, die mit „Wichtiger Hinweis" beginnen → `{ type: 'note', variant: 'warning' }`, Präfix aus
  allen drei Sprachen entfernt.
- `imageSources[0]` → `images.cover`, Rest → `images.gallery` in unveränderter Reihenfolge;
  `width`/`height` aus den Dateien ermittelt, `alt` = `null`.
- `amenities.*` → flache, in Registry-Reihenfolge sortierte Liste.
- `propertyDetails` → `highlights`. Für die Wohnung gemäß der bestätigten Werte: 4 Gäste,
  2 Schlafzimmer, 4 Betten, 1 Bad, 95 m². Für das Haus übernimmt das Skript die v1-Werte
  unverändert (4 Gäste, 4 Betten, 1 Bad, 95 m²) und lässt `bedrooms` weg, da v1 dafür keinen Wert
  enthält; alle vier Werte werden im Abschlussbericht als **unbestätigt** ausgewiesen, weil der
  v1-Block ein Klon aus `apartment.json` ist. `null` wird nie geschrieben — `highlights[].value` ist
  im Schema eine Pflichtzahl, ein Platzhalter würde den Build brechen.
- `houseRules.checkIn` / `checkOut` → `checkInFrom` / `checkOutUntil`, Uhrzeit aus dem deutschen
  Text extrahiert und gegen die englische und spanische Fassung gegengeprüft; bei Abweichung Abbruch
  mit Meldung.
- `icalUrl` → entfällt, Wert wandert nach `.env`, im JSON bleibt `calendar.secretRef`.

Am Ende gibt das Skript eine Liste aller Felder aus, die es nicht auflösen konnte (Alt-Texte,
Saisonzeiträume, Hausfakten).

### `scripts/images-sync.mjs`

Liest `public/images/<id>/`, ergänzt `width`/`height` in der Config, meldet Bilddateien ohne
Config-Eintrag und Config-Einträge ohne Datei. Die redaktionelle Reihenfolge in `gallery` wird nicht
verändert. Wird als `pnpm images:sync` eingebunden.

### Absicherung

Das Projekt hat weder Tests noch aktive CI. Die Validierung hängt deshalb dort, wo ohnehin etwas
läuft:

- `propertySchema.parse` beim Import bricht `pnpm build` ab.
- `pnpm validate:content` prüft, was Zod nicht sieht: existieren alle referenzierten Bilddateien,
  ist jeder Amenity-Key in der Registry, ist jeder `slug` eindeutig, hat jedes Objekt genau ein
  Cover-Bild.

## Etappen

### Etappe 1 — Fundament und Sicherheit

Nach außen unsichtbar, für sich deploybar.

1. `public/propertyConfigs/*.json` → `src/data/properties/*.json` (Inhalt zunächst unverändert).
2. iCal-URLs aus dem JSON entfernen, Werte nach `.env` (`ICAL_APARTMENT`, `ICAL_HOUSE`),
   `calendar.secretRef` als Verweis.
3. **`/api/ics` von `?url=` auf `?property=<id>` umstellen.** Die Route schlägt den `secretRef` des
   Objekts nach und löst ihn serverseitig gegen `process.env` auf; unbekannte oder nicht
   veröffentlichte Objekte ergeben 404. Damit verlässt der Token den Server nicht mehr
   (`CalendarCard.tsx:39` übergibt künftig nur die Objekt-ID), und die Substring-Prüfung
   `includes('airbnb')` entfällt zusammen mit dem offenen Proxy — die Route kann keine
   fremdbestimmte Adresse mehr laden.
4. **Beide Airbnb-Kalender-Token rotieren.** Sie waren über `public/` abrufbar, standen im HTML jeder
   Objektseite und liegen in der Git-Historie; das Entfernen aus dem JSON macht die bereits
   ausgelieferten Werte nicht ungültig. Airbnb erlaubt das Neugenerieren des Kalenderlinks. Die
   Rotation erfolgt nach Schritt 3, damit der neue Token nicht erneut ausgeliefert wird.
5. `src/data/property-schema.ts` als Zod-Schema für den Stand nach dieser Etappe (v1-Struktur plus
   Kopfdaten, ohne `icalUrl`); `src/types/PropertyConfiguration.ts` entfernen.
6. Kopfdaten ergänzen: `schemaVersion`, `slug` (= `id`), `status`, `kind`, `updatedAt`.
7. Statischer Index + Repository, alle 18 Consumer umstellen, `load-property-configs.ts` löschen.

### Etappe 2 — Inhalte

1. `LocalizedText` mit Fallback-Kette, `getTranslation` ersetzen.
2. Content-Blöcke mit Diskriminator; `isTranslatedText` und `convertDescription` entfallen,
   `ContentBlock`-Komponente rendert über einen Switch.
3. Darstellung für `note`-Blöcke.
4. `images.cover` / `images.gallery` mit `width`, `height`, `alt`, `category`;
   `PropertyImageGrid` und `PropertyCard` umstellen.
5. `scripts/images-sync.mjs`.

Sichtbar: Hinweisblöcke erhalten eine eigene Darstellung, die Galerie lädt ohne Layout-Shift.

### Etappe 3 — Struktur

1. `propertyDetails` → `highlights`; `PropertyDetailsSection` / `PropertyDetailItem` umstellen.
2. Amenity-Registry, flache Liste im JSON, `AmenitiesSection` als Schleife über belegte Kategorien
   (leere Überschriften verschwinden).
3. `pricing` mit `currency`, `rates`, `fees`, `minNights`; `BookItCard` umstellen.
4. `houseRules` mit `checkInFrom` / `checkOutUntil`, Formatierung über next-intl.
5. `pnpm validate:content`.

## DB-Ausblick

Jeder v2-Block hat bereits die Form einer Tabelle. Drizzle ist eingerichtet (`drizzle.config.ts`,
`src/utils/db/schema.ts` mit `guestbook`), das Schema wächst nur.

| v2-Block | Tabelle |
|---|---|
| Kopf, Adresse, Check-in-Zeiten, Währung, `minNights` | `properties` |
| `title`, `subtitle` | `property_translations (property_id, locale)` |
| `description`, `location.description`, `houseRules.notes` | `property_content_blocks (property_id, section, position, type, payload jsonb)` |
| `images` | `property_images (position, src, width, height, category, is_cover)`, Alt-Texte je Locale |
| `amenities` | `property_amenities (property_id, amenity_key)` → Referenztabelle `amenities` |
| `highlights` | `property_highlights (key, icon, value, unit, position)` |
| `pricing.rates` / `.fees` | `property_rates` / `property_fees` |

Da sämtliche Zugriffe über `getProperties()` / `getPropertyBySlug()` laufen, ist der Umzug eine
Änderung an `repository.ts`. Die JSONs können danach als Seed-Daten weiterleben.

## Risiken

- **Ein Datenfehler blockiert den Deploy.** Gewollt — heute erzeugt derselbe Fehler eine 404 in
  Produktion. Abgemildert durch verständliche Zod-Fehlermeldungen und `pnpm validate:content` lokal.
- **Statische Imports legen jedes Objekt ins Bundle.** Bei 2–5 Objekten irrelevant, ab etwa 50
  spürbar. Da der Umfang offen ist: genau der Repository-Layer ist die Stelle, an der auf dynamisches
  Laden oder die DB umgestellt wird — ohne Änderung an den Aufrufern.
- **Etappe 2 und 3 fassen zusammen fast alle Property-Komponenten an.** Ohne Testabdeckung ist die
  Absicherung manuell. Die Etappen sind deshalb einzeln deploybar geschnitten, und Etappe 1 ändert
  bewusst nichts Sichtbares.

## Offene Datenpunkte

Struktur ist entschieden, diese Werte fehlen inhaltlich:

- Saisonzeiträume für `off` / `main` (bis dahin `periods: []`).
- Alt-Texte für die Galerie (42 Bilder Wohnung, 71 Bilder Haus) — optional, Fallback greift.
- Die Fakten des Hauses (Gäste, Schlafzimmer, Betten, Bäder, Fläche); der v1-Block ist ein Klon aus
  `apartment.json`.
- `minNights` je Objekt, falls zutreffend.
