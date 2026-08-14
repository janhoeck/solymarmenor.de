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
| `pnpm validate:content` | JSON- und Schema-Fehler lesbar melden, dazu was Zod nicht sieht: fehlende Bilddateien, Eindeutigkeit von id/slug, doppelte Saisons |
| `pnpm images:sync` | Bilddimensionen aus den Dateien übernehmen |
| `pnpm images:sync --check` | nur melden, nichts schreiben |

Ein neues Objekt: JSON-Datei in `src/data/properties/` anlegen und in
`src/data/properties/index.ts` importieren. Zugriff ausschließlich über
`src/lib/properties/repository.ts`.
