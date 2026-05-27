import { bigint, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const guestbook = pgTable('guestbook', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  name: varchar('name'),
  message: text('message'),
  rating: bigint('rating', { mode: 'number' }).notNull().default(0),
})
