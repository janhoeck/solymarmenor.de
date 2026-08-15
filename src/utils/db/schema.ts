import { bigint, doublePrecision, index, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const guestbook = pgTable('guestbook', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  name: varchar('name'),
  message: text('message'),
  rating: bigint('rating', { mode: 'number' }).notNull().default(0),
})

/**
 * One row per reported metric. Aggregation happens at read time in
 * scripts/vitals-report.mjs rather than in pre-computed buckets: exact
 * percentiles beat estimates, and at this traffic the row count is not a
 * problem — five rows per page view is a few thousand a month.
 *
 * Deliberately holds nothing that points at a person: no IP, no cookie, no
 * identifier. That is what keeps this free of consent requirements, and it
 * means a leak of this table would disclose nothing.
 */
export const webVitals = pgTable(
  'web_vitals',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    metric: varchar('metric', { length: 8 }).notNull(),
    // double precision, because CLS is unitless and below 1 while every other
    // metric is whole milliseconds.
    value: doublePrecision('value').notNull(),
    rating: varchar('rating', { length: 20 }).notNull(),
    path: varchar('path', { length: 256 }).notNull(),
    locale: varchar('locale', { length: 5 }).notNull(),
    device: varchar('device', { length: 8 }).notNull(),
    // 20, because 'back-forward-cache' is 18 characters.
    navigation_type: varchar('navigation_type', { length: 20 }).notNull(),
  },
  // The only query shape the report uses: a time window per metric.
  (table) => [index('web_vitals_metric_created_at_idx').on(table.metric, table.created_at)]
)
