/**
 * The metrics worth storing. `next/web-vitals` also reports Next's own timings
 * ('Next.js-hydration' and siblings) and the retired FID, none of which this
 * collects — the allowlist doubles as the filter.
 *
 * Kept in its own module, separate from schema.ts: WebVitals.tsx (mounted in
 * the root layout, so it loads on every page) only needs this allowlist, not
 * the Zod schema that validates the payload server-side. Importing schema.ts
 * from the client component pulled the whole `zod` dependency — and the
 * `vitalsPayloadSchema` object it builds at module scope — into the
 * always-loaded client bundle for a component that never validates anything.
 */
export const VITALS_METRICS = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const
