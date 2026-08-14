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
