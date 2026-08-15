// Reports the p75 of each Web Vital over a time window, split by device and by
// path — the same shape Google Search Console would show, computed from our own
// measurements because CrUX has too little traffic from this site to report on.
//
// Usage: pnpm vitals:report [--days=28] [--prune]
//
//   --days    window in days (default 28, matching the CrUX window)
//   --prune   also delete rows older than 90 days
import postgres from 'postgres'

const args = process.argv.slice(2)

/** Reads `--name=value` from the command line, with a fallback. */
function numericFlag(name, fallback) {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  if (!match) return fallback

  const value = Number(match.slice(`--${name}=`.length))
  if (!Number.isFinite(value) || value <= 0) {
    console.error(`--${name} must be a positive number, got "${match}"`)
    process.exit(1)
  }

  return value
}

const DAYS = numericFlag('days', 28)
const PRUNE = args.includes('--prune')
const RETENTION_DAYS = 90

/**
 * A p75 built from fewer samples than this is noise. The device table keeps such
 * rows but labels them inline (`'N (too few)'`); the path table excludes them from
 * the p75 listing entirely and instead reports how many groups it left out.
 */
const MIN_SAMPLES = 10

/** Official Core Web Vitals thresholds: [good, needs-improvement] upper bounds. */
const THRESHOLDS = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
}

const METRIC_ORDER = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']

function verdict(metric, p75) {
  const bounds = THRESHOLDS[metric]
  if (!bounds) return ''

  if (p75 <= bounds[0]) return 'good'
  if (p75 <= bounds[1]) return 'needs work'
  return 'poor'
}

function format(metric, p75) {
  return metric === 'CLS' ? p75.toFixed(3) : `${Math.round(p75)} ms`
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is not set. Put it in .env.local or export it before running this.')
  process.exit(1)
}

const sql = postgres(databaseUrl)

try {
  const [{ count: total }] = await sql`
    select count(*)::int as count from web_vitals
    where created_at >= now() - make_interval(days => ${DAYS})
  `

  if (total === 0) {
    console.log(`No measurements in the last ${DAYS} days. Nothing to report.`)
  } else {
    console.log(`Web Vitals p75 over the last ${DAYS} days (${total} measurements)\n`)

    const byDevice = await sql`
      select metric, device,
             percentile_cont(0.75) within group (order by value) as p75,
             count(*)::int as samples
      from web_vitals
      where created_at >= now() - make_interval(days => ${DAYS})
      group by metric, device
    `

    console.log('By device')
    console.table(
      byDevice
        .sort(
          (a, b) => METRIC_ORDER.indexOf(a.metric) - METRIC_ORDER.indexOf(b.metric) || a.device.localeCompare(b.device)
        )
        .map((row) => ({
          metric: row.metric,
          device: row.device,
          p75: format(row.metric, Number(row.p75)),
          verdict: verdict(row.metric, Number(row.p75)),
          samples: row.samples < MIN_SAMPLES ? `${row.samples} (too few)` : row.samples,
        }))
    )

    // No HAVING here (unlike byDevice's implicit threshold via the "(too few)" label):
    // we need every group's sample count to report how many were left out below.
    const byPathAll = await sql`
      select metric, path,
             percentile_cont(0.75) within group (order by value) as p75,
             count(*)::int as samples
      from web_vitals
      where created_at >= now() - make_interval(days => ${DAYS})
      group by metric, path
    `

    const byPath = byPathAll.filter((row) => row.samples >= MIN_SAMPLES)
    const omitted = byPathAll.length - byPath.length

    if (byPath.length === 0) {
      console.log(`\nBy path: no path has ${MIN_SAMPLES} or more measurements yet.`)
    } else {
      console.log('\nBy path')
      console.table(
        byPath
          .sort((a, b) => METRIC_ORDER.indexOf(a.metric) - METRIC_ORDER.indexOf(b.metric) || b.p75 - a.p75)
          .map((row) => ({
            metric: row.metric,
            path: row.path,
            p75: format(row.metric, Number(row.p75)),
            verdict: verdict(row.metric, Number(row.p75)),
            samples: row.samples,
          }))
      )
      if (omitted > 0) {
        console.log(`${omitted} metric/path groups omitted (fewer than ${MIN_SAMPLES} measurements).`)
      }
    }
  }

  if (PRUNE) {
    const deleted = await sql`
      delete from web_vitals where created_at < now() - make_interval(days => ${RETENTION_DAYS})
    `
    console.log(`\nPruned ${deleted.count} rows older than ${RETENTION_DAYS} days.`)
  }
} finally {
  await sql.end()
}
