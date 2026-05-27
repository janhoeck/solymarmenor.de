import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required')
}

const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>
}

const client = globalForDb.__pgClient ?? postgres(databaseUrl, { prepare: false })
if (process.env.NODE_ENV !== 'production') {
  globalForDb.__pgClient = client
}

export const db = drizzle(client, { schema })
