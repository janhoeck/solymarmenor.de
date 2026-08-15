# Web Vitals messen und SEO-Grundlagen korrigieren

**Datum:** 2026-08-15
**Status:** Design freigegeben, Umsetzung ausstehend

## Ziel

Zwei Dinge, die zusammengehören: die Web Vitals echter Besucher selbst erheben und auswerten,
und die technischen SEO-Grundlagen der Seite in Ordnung bringen — vorrangig die kanonischen
URLs, die derzeit auf Weiterleitungen zeigen.

## Ausgangslage

### Der Anlass und was er nicht ist

Die Google Search Console meldet unter *Nutzerfreundlichkeit → Core Web Vitals* für Mobil und
Computer „Keine Daten". Dieser Bericht speist sich ausschließlich aus dem CrUX-Datensatz
(Chrome User Experience Report), also aus anonymisierten Feldmessungen echter Chrome-Nutzer.
Er lässt sich **nicht durch Code auf der Seite aktivieren**. „Keine Daten" bedeutet, dass die
Stichprobe über das rollierende 28-Tage-Fenster zu klein für eine belastbare Aussage ist.

Daraus folgt der Zuschnitt dieses Vorhabens: Es liefert die gleiche Information aus eigener
Quelle, und es behebt die SEO-Mängel, die den Traffic überhaupt erst in die Nähe der
CrUX-Schwelle bringen können. Es bringt keine Daten in den Search-Console-Bericht.

### Befunde

1. **Die Web-Vitals-Messung existiert, verwirft aber ihre Ergebnisse.**
   `src/components/shared/WebVitals.tsx:6` ruft `useReportWebVitals(console.table)`. Die Werte
   landen in der Browser-Konsole des Besuchers und sind für den Betreiber unsichtbar. Die
   Komponente ist in `src/app/[locale]/layout.tsx:163` eingehängt, es fehlt also nur die Senke.

2. **Die kanonischen URLs zeigen für Englisch auf Weiterleitungen.**
   `src/i18n/routing.ts` fährt `localePrefix: 'as-needed'` bei `defaultLocale: 'en'`, und
   `src/proxy.ts` setzt das über `createMiddleware(routing)` durch. Englische Seiten leben damit
   unter `/aboutus`, und `/en/aboutus` leitet dorthin weiter. `generateCanonicalMetadata`
   (`src/lib/metadata.ts:22`) setzt die URL aber unbedingt als `/{locale}/{pfad}` zusammen. Das
   Canonical jeder englischen Seite verweist folglich auf eine Weiterleitung, ebenso alle sieben
   `/en/…`-Einträge in der Sitemap. Dass die Search Console genau 7 indexierte HTTPS-Seiten
   meldet — die Zahl der Seiten *eines* Sprachsatzes — passt zu diesem Bild.

3. **`x-default` fehlt in den Alternates.** `src/lib/metadata.ts:23` erzeugt Einträge nur für die
   drei Locales. Die statische Sitemap hat `x-default`, die ausgelieferten `<link rel="alternate">`
   im HTML nicht — zwei Quellen, die sich widersprechen.

4. **`metadataBase` ist nicht gesetzt.** Relative Angaben in `openGraph` und `alternates` können
   damit nicht korrekt aufgelöst werden; Next warnt darüber im Build.

5. **Das OG-Bild ist das Favicon.** `src/app/[locale]/layout.tsx:139` gibt
   `https://solymarmenor.com/favicon.ico` als Vorschaubild an, deklariert als 800×800 — eine
   `.ico`-Datei, die kein Social-Netzwerk als Vorschau rendert, in einem Seitenverhältnis, das
   die Netzwerke ohnehin beschneiden würden. Erwartet werden 1200×630.

6. **`siteName` lautet „Home".** `src/app/[locale]/layout.tsx:136`.

7. **Die OG-URL der Objektseiten kennt die Sprache nicht.**
   `src/app/[locale]/property/[slug]/layout.tsx:27` setzt fest
   `https://solymarmenor.com/property/${slug}` — für `de` und `es` zeigt die OG-URL damit auf die
   englische Seite.

8. **Sitemap und robots.txt liegen statisch in `public/`.** Alle 21 `lastmod`-Werte in
   `public/sitemap.xml` stammen vom 20.06.2025 bzw. 23.07.2025 und altern nicht mit den Daten,
   obwohl die Objekte ein gepflegtes `updatedAt` tragen. `/privacy` fehlt in allen drei Sprachen,
   die Route existiert aber (`src/app/[locale]/privacy/page.tsx`). `public/robots.txt:6` enthält
   eine `Host:`-Direktive, die ausschließlich Yandex auswertet.

9. **Der `keywords`-Block umfasst rund 60 Einträge** (`src/app/[locale]/layout.tsx:38`),
   darunter Tippfehler-Varianten wie `los alcarzares` und `los alcarez`. Google wertet das
   Meta-Tag seit Jahren nicht aus; Bing behandelt Häufung eher als Negativsignal.

10. **Es gibt kein Structured Data.** Keine einzige `application/ld+json`-Auszeichnung im Projekt,
    obwohl `src/data/property-schema.ts` mit Adresse, Geokoordinaten, Ausstattung, Check-in-Zeiten,
    Preisen und Bilddimensionen bereits alles erzwingt, was eine `VacationRental`-Auszeichnung
    benötigt.

11. **Es existiert kein Migrationspfad.** `drizzle.config.ts` verweist auf `out: './drizzle'`,
    das Verzeichnis gibt es nicht. Die `guestbook`-Tabelle (`src/utils/db/schema.ts`) ist an
    drizzle-kit vorbei entstanden, und `nixpacks.toml` führt im Deploy keine Migration aus.

## Entscheidungen

Getroffen im Brainstorming, sie begrenzen den Lösungsraum:

- **Eigene Erfassung statt Drittanbieter.** Ein eigener Endpunkt schreibt in die vorhandene
  Postgres-Datenbank. Kein GA4, kein externes RUM — damit entfällt die Einwilligungspflicht,
  und es kommt kein weiterer Dienst in den Betrieb.
- **Rohereignisse speichern, beim Lesen aggregieren.** Eine Zeile pro Messwert. Vorab
  aggregierte Histogramme wurden verworfen: sie machen Perzentile zu Schätzungen und verhindern
  jede nachträglich aufkommende Auswertungsfrage, um ein Größenproblem zu lösen, das bei diesem
  Traffic nicht existiert.
- **Einzelversand statt Puffern.** Jede Metrik geht sofort per `sendBeacon` raus. LCP und TTFB
  stehen früh fest, CLS und INP erst beim Verstecken der Seite; wer sammelt und am Ende sendet,
  verliert die frühen Werte bei hartem Schließen des Tabs.
- **Auswertung als CLI-Report**, keine Web-Route. Passt zur vorhandenen Skript-Kultur
  (`images:sync`, `validate:content`) und schafft keine schützenswerte öffentliche Oberfläche.
- **Kanonische Domain ist `solymarmenor.com`.**
- **Migration per drizzle-kit**, versioniert unter `drizzle/`.
- **Kein Datenfeld, das auf eine Person zeigt.** Keine IP, kein Cookie, keine Kennung.

## Nicht-Ziele

- **Keine LCP-/CLS-/INP-Optimierung in diesem Durchgang.** Erst messen, dann gezielt ändern.
  Welche Bilder `priority` brauchen, entscheidet der erste Report, nicht eine Vermutung.
- **Keine Web-Oberfläche für die Vitals-Daten** und damit keine Auth-Schicht.
- **Kein Sampling, kein Rate-Limit-Backend.** Bei dieser Besucherzahl unnötig.
- **Keine Inhalts- oder Keyword-Strategie.** Nur Technik und Auszeichnung.
- **Keine Änderung an `localePrefix`.** Die Routing-Strategie bleibt `as-needed`; korrigiert wird
  der Code, der sie nicht beachtet.

---

## Teil A — Web-Vitals-Erfassung

### A1. Datenmodell

Neue Tabelle in `src/utils/db/schema.ts`:

```ts
export const webVitals = pgTable(
  'web_vitals',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    metric: varchar('metric', { length: 8 }).notNull(),
    value: doublePrecision('value').notNull(),
    rating: varchar('rating', { length: 20 }).notNull(),
    path: varchar('path', { length: 256 }).notNull(),
    locale: varchar('locale', { length: 5 }).notNull(),
    device: varchar('device', { length: 8 }).notNull(),
    navigation_type: varchar('navigation_type', { length: 20 }).notNull(),
  },
  (table) => [index('web_vitals_metric_created_at_idx').on(table.metric, table.created_at)]
)
```

`value` ist bewusst `double precision`: CLS ist einheitenlos und kleiner als 1, alle übrigen
Metriken sind Millisekunden. `rating` wird vom Client übernommen, weil `next/web-vitals` es
gegen die offiziellen Schwellen bereits berechnet — eine zweite Schwellentabelle im Projekt
könnte nur von der offiziellen abweichen.

Der Index deckt die einzige Abfrageform des Reports ab: ein Zeitfenster je Metrik.

### A2. Migration

`pnpm db:generate` (neu, `drizzle-kit generate`) erzeugt die SQL-Migration nach `drizzle/`,
`pnpm db:migrate` (neu) spielt sie über den Migrator von `drizzle-orm/postgres-js` ein. Das
Verzeichnis `drizzle/` und beide Skripte kommen ins Repository; das Deploy führt weiterhin keine
Migration automatisch aus, der Aufruf gegen die Produktionsdatenbank erfolgt bewusst von Hand und
ist im README beschrieben.

Die erste generierte Migration darf **nur** `web_vitals` anlegen. Falls drizzle-kit aus dem
Abgleich mit der leeren Historie zusätzlich ein `CREATE TABLE guestbook` erzeugt, wird die
Anweisung vor dem Ausführen zu `CREATE TABLE IF NOT EXISTS` entschärft oder entfernt — die
Tabelle existiert in Produktion bereits und enthält Daten.

### A3. Erfassung im Client

`src/components/shared/WebVitals.tsx` wird umgebaut:

- Meldet an `/api/vitals` per `navigator.sendBeacon(url, new Blob([json], { type: 'application/json' }))`.
  Fällt auf `fetch(url, { method: 'POST', keepalive: true, … })` zurück, wo `sendBeacon` fehlt.
- Sendet nur die fünf relevanten Metriken: `LCP`, `INP`, `CLS`, `FCP`, `TTFB`. Die von Next
  zusätzlich gemeldeten Eigenmetriken (`Next.js-hydration` und Verwandte) und das abgelöste `FID`
  werden verworfen.
- Sendet nur bei `process.env.NODE_ENV === 'production'`, damit lokale Messungen die Zahlen
  nicht verrauschen.
- `path` aus `usePathname()` von `next/navigation` — also inklusive Locale-Präfix, so wie der
  Browser die URL sieht. Query und Hash sind darin ohnehin nicht enthalten.
- `locale` aus `useLocale()` von next-intl.
- `device`: `navigator.userAgentData?.mobile` wenn vorhanden, sonst `/Mobi/.test(navigator.userAgent)`.
  Nur das abgeleitete Boolean wird gesendet, nie der User-Agent selbst.
- `value` wird auf drei Nachkommastellen gerundet — bei Millisekunden ist mehr Auflösung
  bedeutungslos, bei CLS ausreichend.

### A4. Der Endpunkt

`src/app/api/vitals/route.ts`, `POST`. Der Endpunkt ist notwendigerweise öffentlich; drei
Schranken begrenzen den Missbrauch:

1. **Same-Origin-Prüfung.** Der `Origin`-Header, den `sendBeacon` mitschickt, muss zur eigenen
   Herkunft passen. Fehlt er oder passt er nicht, wird verworfen.
2. **Zod-Validierung** mit Allowlist der fünf Metriknamen, Allowlist für `rating`, `device`,
   `navigation_type` und `locale` (gegen `routing.locales`), Pfad-Regex `^/[\w\-/]*$` mit
   Längenlimit 256 und Wertebereich `0 ≤ value ≤ 60000` für Zeitmetriken bzw. `0 ≤ value ≤ 10`
   für CLS.
3. **Kein Lesepfad.** Es gibt keine Route, die diese Daten ausliefert.

Die Allowlist für `navigation_type` umfasst genau sechs Werte: `navigate`, `reload`,
`back-forward`, `back-forward-cache`, `prerender`, `restore`. Das ist die vollständige Menge, die
das in Next gebündelte web-vitals erzeugen kann — abgelesen aus der Ableitung in
`node_modules/next/dist/compiled/web-vitals/web-vitals.js`, wo der `type` des
`PerformanceNavigationTiming` mit `replace(/_/g, '-')` normalisiert und um `back-forward-cache`,
`prerender` und `restore` ergänzt wird. Der längste Wert hat 18 Zeichen, daher `varchar(20)`.

Die Antwort ist in **jedem** Fall `204 No Content` — auch bei Validierungsfehlern. Ein Prober
bekommt so keine Rückmeldung darüber, was ihn hat scheitern lassen. Fehler werden serverseitig
geloggt.

Bekannte Grenze: Wer es darauf anlegt, kann trotzdem gültig aussehende Werte einliefern. Der
Schaden wäre verzerrte Statistik; die Aufbewahrungsgrenze aus A5 begrenzt ihn zeitlich.

### A5. Auswertung

`scripts/vitals-report.mjs`, aufgerufen über `pnpm vitals:report`. Ausgabe auf Englisch, wie die
übrigen Skripte des Projekts.

- `--days=<n>`, Vorgabe **28** — dasselbe rollierende Fenster wie CrUX, damit die Zahlen mit dem
  vergleichbar sind, was Google sähe.
- Ausgabe: p75 je Metrik über `percentile_cont(0.75)`, aufgeschlüsselt nach `device`, dazu eine
  Aufschlüsselung nach `path`. Je Zeile die Stichprobengröße und die Ampel gegen die offiziellen
  Schwellen: LCP 2500/4000 ms, INP 200/500 ms, CLS 0,1/0,25, FCP 1800/3000 ms, TTFB 800/1800 ms.
- Zeilen mit weniger als **10** Messwerten werden als solche gekennzeichnet — ein p75 aus drei
  Werten ist keine Aussage.
- `--prune` löscht Zeilen älter als 90 Tage. Bei dieser Besucherzahl Hygiene, keine Notwendigkeit:
  fünf Zeilen pro Seitenaufruf ergeben selbst bei 1000 Aufrufen im Monat nur 60 000 Zeilen im Jahr.

---

## Teil B — Technisches SEO

### B1. Kanonische URLs und hreflang

`src/lib/metadata.ts` wird umgebaut: Statt `/{locale}/{pfad}` unbedingt zusammenzusetzen, leitet
`generateCanonicalMetadata` den Pfad künftig aus `routing.localePrefix` und `routing.defaultLocale`
ab. Damit folgt die URL-Erzeugung der Routing-Konfiguration; änderte sich `localePrefix` später,
zöge die Metadata-Erzeugung ohne weitere Änderung nach.

**Nachträgliche Korrektur zum Brainstorming.** Ursprünglich war vorgesehen, dafür `getPathname`
aus `src/i18n/navigation.ts` zu verwenden. Das ist verworfen: `next-intl/navigation` importiert
`next/navigation`, und das lässt sich unter `node --test --experimental-strip-types` nicht
auflösen (`ERR_MODULE_NOT_FOUND`, empirisch geprüft). Die Kernkorrektur dieses Vorhabens wäre
damit die einzige ungetestete Änderung — inakzeptabel für den Teil mit dem größten Risiko.

Stattdessen eine reine Funktion `localizedPathname(pathname, locale)` in `src/lib/metadata.ts`,
die alle drei Modi von `localePrefix` abbildet (`as-needed`, `always`, `never`). Sie liest
`routing` aus `src/i18n/routing.ts`, das sich in Node sauber importieren lässt (ebenfalls
geprüft). Die Regel für `as-needed` ist eine Zeile — Präfix genau dann, wenn die Locale nicht
die `defaultLocale` ist —, und ein Test pinnt sie fest.

Bekannte Grenze dieser Entscheidung: Die Funktion bildet `routing.pathnames` (lokalisierte
Pfadnamen) nicht ab. Das Projekt nutzt sie nicht; würden sie eingeführt, müsste diese Funktion
mitwachsen. Ein Test hält das fest.

Damit `src/lib/metadata.ts` überhaupt aus einem Test importierbar ist, muss sein Import
`'../i18n/routing'` die Endung `.ts` bekommen — so wie es `src/lib/properties/repository.ts`
bereits vormacht. `allowImportingTsExtensions` ist in `tsconfig.json` gesetzt, Turbopack stört
sich nicht daran.

Zusätzlich kommt `'x-default'` in `alternates.languages` und zeigt auf die Variante der
`defaultLocale` — bei `as-needed` also auf die präfixlose URL.

`metadataBase: new URL(BASE_URL)` wird im Root-Layout gesetzt.

### B2. Sitemap und robots

`src/app/sitemap.ts` ersetzt `public/sitemap.xml`; die statische Datei wird gelöscht. Die Sitemap
wird erzeugt aus:

- der Liste statischer Routen (`/`, `/aboutus`, `/contact`, `/guestbook`, `/imprint`, `/privacy`),
- den veröffentlichten Objekten aus `src/lib/properties/repository.ts` (`status === 'published'`),
- gekreuzt mit `routing.locales`,

mit denselben über `localizedPathname` erzeugten URLs wie die Canonicals, `alternates.languages`
inklusive `x-default`, und `lastModified` aus `updatedAt` des jeweiligen Objekts, wo es eines gibt.

`src/app/robots.ts` ersetzt `public/robots.txt`; die statische Datei wird gelöscht. Inhalt:
`allow: '/'`, `disallow: '/api/'`, Verweis auf die Sitemap. Die `Host:`-Direktive entfällt.

### B3. Metadata-Korrekturen

- `keywords` wird ersatzlos entfernt (`src/app/[locale]/layout.tsx:38`).
- `siteName` wird von `'Home'` auf `'Sol y Mar Menor'` gesetzt.
- `openGraph.url` im Root-Layout und in `src/app/[locale]/property/[slug]/layout.tsx:27` wird
  über dieselbe `localizedPathname`-Erzeugung gebildet und trägt damit die Sprache.
- `openGraph.images` verweist auf ein echtes 1200×630-Bild statt auf `favicon.ico`.
- `twitter`-Card (`summary_large_image`) kommt dazu, damit Vorschauen auch dort greifen.

### B4. OG-Bild

`scripts/generate-og-image.mjs` schneidet mit dem bereits vorhandenen `sharp` aus dem Cover eines
Objekts ein 1200×630-Bild und legt es unter `public/og/default.jpg` ab. Erzeugt wird es einmalig
und eingecheckt, nicht zur Laufzeit — der Bildoptimierer läuft auf dem eigenen App-Server, und
für ein Bild, das sich praktisch nie ändert, wäre Laufzeit-Erzeugung verschenkte CPU.

Die Objektseiten behalten ihr Cover-Bild als OG-Bild.

---

## Teil C — Structured Data

Neue Einheit `src/lib/structured-data/`, je Typ eine Datei mit einer reinen Funktion
`Property → object` bzw. `… → object`, gerendert über eine gemeinsame Komponente
`<JsonLd data={…} />`, die `<script type="application/ld+json">` ausgibt.

### C1. `VacationRental` je Objektseite

Gespeist aus `src/data/property-schema.ts`, ohne neue Datenfelder:

| JSON-LD | Quelle |
|---|---|
| `name`, `description` | `title`, `description` (über `resolveText` in der Seitensprache) |
| `image` | `images.cover` und `images.gallery`, als absolute URLs |
| `address` (`PostalAddress`) | `location.address` |
| `geo` (`GeoCoordinates`) | `location.lat`, `location.lng` |
| `amenityFeature` (`LocationFeatureSpecification`) | `amenities`, Namen aus next-intl |
| `checkinTime`, `checkoutTime` | `houseRules.checkInFrom`, `houseRules.checkOutUntil` |
| `numberOfBedrooms`, `numberOfBathroomsTotal`, `occupancy` | `highlights` (`bedrooms`, `bathrooms`, `guests`) |
| `floorSize` (`QuantitativeValue`, `MTK`) | `highlights` (`area`) |
| `priceRange` | Minimum und Maximum aus `pricing.rates[].pricePerNight` |
| `petsAllowed`, `smokingAllowed` | `houseRules.rules` |

### C2. `BreadcrumbList` je Objektseite

Startseite → Objekt. Davon sind Breadcrumb-Rich-Results realistisch zu erwarten.

### C3. `LodgingBusiness` und `WebSite` auf der Startseite

Name, URL, Bild, `inLanguage`.

**Nachträgliche Korrektur.** Ursprünglich als `Organization` geplant. Verworfen, weil C4
denselben `@id` unter `LodgingBusiness` auszeichnet — ein Bezeichner mit zwei verschiedenen
Typen auf zwei Seiten ist genau das, was einen Konsumenten den ganzen Graphen verwerfen lässt.
`LodgingBusiness` ist ein Untertyp von `Organization`, taugt also weiterhin als
`WebSite.publisher`, und ist für eine Ferienvermietung der genauere Typ.

Kein `logo`: schema.org meint damit ein echtes Logo, und das Projekt hat keines —
`src/components/shared/Logo/Logo.tsx` zeichnet einen CSS-Kreis mit den Buchstaben „SM", keine
Bilddatei. Stattdessen `image` mit einem Foto. Ein weggelassenes optionales Feld ist besser als
ein falsch belegtes.

### C4. `AggregateRating` und `Review` auf der Gästebuchseite

Aus `guestbook.rating` und `guestbook.message`, ausgezeichnet an der `LodgingBusiness`, die die
Site als Ganzes repräsentiert.

**Zwei Einschränkungen, ausdrücklich festgehalten:**

1. Das Gästebuch kennt keine Zuordnung zu einem Objekt (`src/utils/db/schema.ts` hat keine
   Property-Spalte). Die Bewertungen können daher nur der Site zugeschrieben werden, nicht dem
   Apartment oder dem Haus einzeln.
2. Google zeigt seit 2019 **keine** Sterne-Snippets für selbst gehostete Bewertungen über das
   eigene Unternehmen. Die Auszeichnung ist korrekt und hilft beim Verständnis der Entität, aber
   sie wird keine Sterne in den Suchergebnissen erzeugen. Wer etwas anderes erwartet, wird
   enttäuscht.

---

## Absicherung

Die Tests laufen über `pnpm test`, also `node --test --experimental-strip-types` ohne Bundler.
Daraus folgen zwei bindende Regeln für jede Datei im Importgraphen eines Tests: relative Importe
brauchen die Endung `.ts`, und die Pfad-Aliase aus `tsconfig.json` (`@/lib/*` und Verwandte)
dürfen dort nicht vorkommen — Node kennt sie nicht. Baseline vor Beginn: 89 Tests, alle grün.

Tests in der Art des Projekts (`node --test`, neben der zu testenden Datei):

- `src/lib/metadata.test.ts` — kanonische URL und Alternates für alle drei Locales; sichert
  ausdrücklich ab, dass Englisch **ohne** `/en`-Präfix erzeugt wird und `x-default` vorhanden ist.
- `src/app/sitemap.test.ts` — jede statische Route und jedes veröffentlichte Objekt kommt in jeder
  Sprache genau einmal vor; keine URL zeigt auf eine Weiterleitung.
- `src/lib/structured-data/*.test.ts` — Erzeugung gegen ein Beispielobjekt, Pflichtfelder vorhanden,
  Bild-URLs absolut.
- `src/lib/vitals/schema.test.ts` — die Zod-Validierung gegen gültige Nutzlasten sowie gegen
  überlange Pfade, unbekannte Metriken, Werte außerhalb des Bereichs und fremde Locales. Das
  Schema liegt unter `src/lib/`, nicht neben der Route: `tsconfig.json` kennt einen
  `@/lib/*`-Alias, aber keinen `@/app/*`, und die Client-Komponente braucht die Metrik-Allowlist
  ebenfalls.

Dazu `pnpm check-types`, `pnpm lint`, `pnpm test` und `pnpm build`. Die erzeugten JSON-LD-Blöcke
werden zusätzlich gegen den Schema-Validator geprüft.

## Reihenfolge der Umsetzung

Die drei Teile sind unabhängig und einzeln deploybar. Sinnvoll ist:

1. **Teil B** zuerst — die Canonical-Korrektur ist die Änderung mit dem größten erwarteten Effekt
   und braucht am längsten, bis Google sie verarbeitet hat.
2. **Teil A** danach, damit früh Daten auflaufen.
3. **Teil C** zuletzt.

Die eigentliche Metrik-Optimierung folgt in einem eigenen Durchgang, sobald der erste Report
genug Messwerte hat.
