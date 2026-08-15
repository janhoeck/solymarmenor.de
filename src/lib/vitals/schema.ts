import { z } from 'zod'

import { routing } from '../../i18n/routing.ts'

/**
 * The metrics worth storing. `next/web-vitals` also reports Next's own timings
 * ('Next.js-hydration' and siblings) and the retired FID, none of which this
 * collects — the allowlist doubles as the filter.
 */
export const VITALS_METRICS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const

/**
 * The complete set the bundled web-vitals can emit. Derived from its own
 * normalisation, which takes PerformanceNavigationTiming.type, replaces
 * underscores with hyphens, and adds the three cases the timing entry cannot
 * express.
 */
const NAVIGATION_TYPES = ['navigate', 'reload', 'back-forward', 'back-forward-cache', 'prerender', 'restore'] as const

/** A page view slower than a minute is a broken measurement, not a slow page. */
const MAX_DURATION_MS = 60_000

/** CLS is unitless; anything above 1 is already catastrophic. */
const MAX_CLS = 10

export const vitalsPayloadSchema = z
  .object({
    metric: z.enum(VITALS_METRICS),
    value: z.number().finite().nonnegative(),
    rating: z.enum(['good', 'needs-improvement', 'poor']),
    // No query, no fragment, no host: this is a pathname and nothing else.
    // Bounded at 256 to match the column and to cap what one request can store.
    path: z
      .string()
      .min(1)
      .max(256)
      .regex(/^\/[\w\-/]*$/),
    locale: z.enum(routing.locales),
    device: z.enum(['mobile', 'desktop']),
    navigationType: z.enum(NAVIGATION_TYPES),
  })
  .strict()
  .refine((payload) => payload.value <= (payload.metric === 'CLS' ? MAX_CLS : MAX_DURATION_MS), {
    message: 'value out of range for this metric',
    path: ['value'],
  })

export type VitalsPayload = z.infer<typeof vitalsPayloadSchema>
