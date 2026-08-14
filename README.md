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

## Build

```bash
pnpm build
```

Requires `DATABASE_URL` to be set at build time for the guestbook page.

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
