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
