'use client'

import { VITALS_METRICS } from '@/lib/vitals/schema'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'

const ENDPOINT = '/api/vitals'

/**
 * Coarse form factor, derived without touching anything identifying: the
 * boolean is all that leaves the browser, never the User-Agent itself. The
 * userAgentData path is the accurate one and covers Chromium — which is
 * exactly the population CrUX measures — and the regex is the fallback for
 * everything else.
 */
function deviceType(): 'mobile' | 'desktop' {
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData

  if (typeof uaData?.mobile === 'boolean') {
    return uaData.mobile ? 'mobile' : 'desktop'
  }

  return /Mobi/.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

/**
 * Reports Core Web Vitals to our own endpoint.
 *
 * One beacon per metric, sent the moment the metric settles, rather than one
 * batched request on visibilitychange: LCP and TTFB are final early while CLS
 * and INP only finalise when the page is hidden, so buffering trades the early
 * values away for a saving of four ~200-byte requests.
 *
 * Google Search Console will not show any of this. Its Core Web Vitals report
 * reads CrUX, which needs far more traffic than this site has. This is the
 * same information from our own measurements.
 */
export const WebVitals = () => {
  const pathname = usePathname()
  const locale = useLocale()

  useReportWebVitals((metric) => {
    // useReportWebVitals also fires for Next's own timings
    // ('Next.js-hydration' and siblings) and for the retired FID.
    if (!(VITALS_METRICS as readonly string[]).includes(metric.name)) {
      return
    }

    // Local runs would otherwise skew the numbers with a developer machine's
    // measurements against a dev server.
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    const body = JSON.stringify({
      metric: metric.name,
      // Sub-millisecond resolution is meaningless; three decimals is more than
      // CLS needs.
      value: Math.round(metric.value * 1000) / 1000,
      rating: metric.rating,
      path: pathname,
      locale,
      device: deviceType(),
      navigationType: metric.navigationType,
    })

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      return
    }

    // keepalive lets the request outlive the page, which is the whole point of
    // sendBeacon and the reason a plain fetch would lose the last metrics.
    void fetch(ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Nothing to do: a lost measurement is not worth surfacing to a visitor.
    })
  })

  return null
}
