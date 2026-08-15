// Applies pending Drizzle migrations from drizzle/ to DATABASE_URL.
//
// The deploy does not run this: nixpacks.toml only builds and starts. Run it by
// hand against production before deploying a release that needs a new table.
//
// Usage: pnpm db:migrate
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
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
