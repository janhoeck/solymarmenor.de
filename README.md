# solymarmenor.de — Holiday Apartment

Next.js 16 app for the holiday apartment site.

## Stack

- Next.js (Turbopack)
- React 19
- Tailwind 4 + shadcn/ui (Radix primitives)
- next-intl
- Drizzle ORM + Postgres
- pnpm

## Development

```bash
pnpm install
pnpm dev
```

## Environment

Copy `.env.example` to `.env.local` and fill in. All three are deployment
prerequisites — without them the affected page renders empty and the only signal
is a server-side log.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string for the guestbook. Required at build time, because the guestbook page is prerendered. |
| `ICAL_APARTMENT` | Airbnb iCalendar export URL for the apartment, read by `/api/ics`. |
| `ICAL_HOUSE` | Airbnb iCalendar export URL for the house, read by `/api/ics`. |

The `ICAL_*` values contain an access token in the URL and must never be
committed. The property data does not hold them: `calendar.secretRef` in
`src/data/properties/*.json` names the variable (`"ICAL_APARTMENT"`), and the
route resolves it server-side, so the token never reaches the client bundle.
Rotating a calendar URL therefore means changing the environment only, not the
data.

## Build

```bash
pnpm build
```

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
Daten“ dort ist keine Fehlfunktion, sondern eine Aussage über die Stichprobengröße.

Bei Client-seitiger Navigation verzeichnet die Messung den Pfad, auf dem eine Metrik **final
wurde**, nicht zwingend den, der sie verursacht hat. Ein LCP gehört zum Dokumentaufruf; wechselt
der Besucher vorher die Seite, steht er unter der neuen Adresse. Das ist der Preis dafür, dass
pro Dokument gemessen wird — die Aufschlüsselung nach Pfad ist deshalb ein Hinweis, keine exakte
Zuordnung.

Der Origin-Check in `src/app/api/vitals/route.ts` vergleicht bewusst gegen die aus `BASE_URL`
abgeleitete Origin, nicht gegen `request.nextUrl.origin`. `next start` läuft ohne `-H`-Flag und
bindet den Hostnamen deshalb fest auf `localhost`, ohne je den weitergereichten `Host`-Header zu
befragen. Hinter Coolifys Reverse Proxy ist `nextUrl.origin` dadurch immer die interne Adresse
`https://localhost:<port>` — ein Vergleich dagegen würde jeden echten Besucher-Beacon abweisen
und dabei trotzdem jeden Testlauf auf derselben Maschine bestehen, weil dort Server und Client
dieselbe Origin teilen. Diese Prüfung nicht wieder auf `nextUrl.origin` „vereinfachen“.

## SEO

Kanonische URLs, hreflang, Sitemap und robots.txt werden erzeugt, nicht gepflegt. Die statischen
Dateien `public/sitemap.xml` und `public/robots.txt` gibt es nicht mehr — sie hätten die Routen
`src/app/sitemap.ts` und `src/app/robots.ts` beschattet.

Alle URLs entstehen über `localizedPathname` in `src/lib/metadata.ts`. Diese Funktion bildet
`localePrefix: 'as-needed'` ab: Englisch ist die Standardsprache und wird **ohne** Präfix
ausgeliefert, `/en/aboutus` leitet auf `/aboutus` weiter. Wer eine URL selbst zusammensetzt,
riskiert, ein Canonical auf eine Weiterleitung zu richten — genau der Fehler, den
`metadata.test.ts` und `sitemap.test.ts` seither festnageln.

Eine neue Seite braucht einen Eintrag in `STATIC_ROUTES` in `src/app/sitemap.ts`; fehlt er,
schlägt `sitemap.test.ts` fehl.

Structured Data liegt in `src/lib/structured-data/`, gerendert über `<JsonLd />`. Die
Bewertungen im Gästebuch erzeugen **keine** Sterne in Google-Suchergebnissen: selbst gehostete
Bewertungen über das eigene Unternehmen sind davon seit 2019 ausgenommen.

## Objektdaten

Die Objektdaten liegen in `src/data/properties/*.json` und werden beim Import gegen
`src/data/property-schema.ts` validiert — ungültige Daten brechen den Build.

| Befehl | Zweck |
|---|---|
| `pnpm test` | Schema- und Repository-Tests |
| `pnpm validate:content` | JSON- und Schema-Fehler lesbar melden, dazu was Zod nicht sieht: fehlende Bilddateien, Eindeutigkeit von id/slug, doppelte Saisons und ob jeder Tag des Jahres von genau einer Rate-Periode abgedeckt ist |
| `pnpm images:sync` | Bilddimensionen aus den Dateien übernehmen |
| `pnpm images:sync --check` | nur melden, nichts schreiben. Fehlende, unlesbare oder veraltete referenzierte Bilder sind Fehler (Exit 1); eine Datei auf der Platte, die die Daten nicht referenzieren, ist eine Warnung |
| `pnpm images:downscale` | neue Bilder auf max. 2560px begrenzen und als WebP neu kodieren. Danach immer `pnpm images:sync` |
| `pnpm images:downscale --check` | nur berichten, was verkleinert würde |

Ein neues Objekt: JSON-Datei in `src/data/properties/` anlegen und in
`src/data/properties/index.ts` importieren — den vergessenen Import fängt
`data.test.ts` ab. Zugriff ausschließlich über
`src/lib/properties/repository.ts`.

## Bilder

Bilder aus der Kamera gehören nicht unverändert nach `public/images/`. Der
Ablauf für neue Fotos:

```bash
# Dateien nach public/images/<objekt-id>/ legen, dann
pnpm images:downscale
pnpm images:sync
```

`/_next/image` optimiert zur Laufzeit auf unserem eigenen App-Server, nicht auf
einer Edge-Plattform. Jedes Pixel im Quellbild kostet dort CPU-Zeit bei jedem
Cache-Miss, und die Container-CPU ist um ein Vielfaches langsamer als ein
Entwicklungsrechner. Deshalb drei bewusste Entscheidungen:

- **Quellen auf 2560px begrenzt.** Vorher lagen hier 4032x3024 bei 3–4 MB pro
  Datei, angezeigt wird nie mehr als etwa 2000px.
- **Kein AVIF** (`next.config.ts`). Die Quellen sind bereits verlustbehaftetes
  WebP; ein AVIF-Encode kostete gemessen das Dreifache an CPU und lieferte dabei
  ~1,7x größere Dateien.
- **`deviceSizes` ohne 3840.** Größere Varianten wären hochskaliert, und je
  weniger Varianten existieren, desto öfter trifft der Optimizer-Cache.

## Deployment (Coolify)

Gebaut wird über `nixpacks.toml`, gestartet mit `next start`.

Die optimierten Bildvarianten legt Next unter `.next/cache/images` ab. Ohne
persistentes Volume ist dieses Verzeichnis nach jedem Deploy leer und der erste
Besucher bezahlt die Neukodierung jeder einzelnen Variante. In Coolify deshalb
unter *Storages* ein Volume auf den Pfad

```
/app/.next/cache/images
```

mounten. Das Verzeichnis wird nur zur Laufzeit beschrieben, der Build braucht es
nicht.

Die Varianten halten laut `minimumCacheTTL` 30 Tage. Der Cache-Key ist der
Bildpfad, nicht der Inhalt: Wird eine Datei unter **gleichem Namen** durch ein
anderes Foto ersetzt, liefert der Cache bis zu 30 Tage lang das alte Bild aus.
In dem Fall das Volume leeren oder die neue Datei unter neuem Namen ablegen.
