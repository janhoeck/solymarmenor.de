import { BASE_URL } from '@/lib/metadata'
import { vitalsPayloadSchema } from '@/lib/vitals/schema'
import { db } from '@/utils/db'
import { webVitals } from '@/utils/db/schema'
import { NextRequest, NextResponse } from 'next/server'

/**
 * `next start` without `-H` hardcodes the server hostname to 'localhost' and never
 * consults the incoming Host or X-Forwarded-Host header, so behind a reverse proxy
 * `request.nextUrl.origin` is always the internal `https://localhost:<port>` origin —
 * never a real visitor's origin. Comparing against BASE_URL's origin instead works in
 * both dev and production, because it is fully server-controlled. Do not swap this back
 * to `request.nextUrl.origin`, and do not trust `x-forwarded-host` either: it is
 * attacker-settable unless the proxy strips it, which trades one bug for a weaker check.
 */
const ALLOWED_ORIGIN = new URL(BASE_URL).origin

/**
 * Real beacons are around 200 bytes. This is a cheap first bound, not a
 * complete one: a chunked request that never sends Content-Length still
 * reaches `request.json()` unbounded. It stops the trivial case — one
 * unauthenticated POST with a spoofed Origin claiming a huge body — from
 * making the server buffer and parse it before Zod ever sees it.
 */
const MAX_CONTENT_LENGTH_BYTES = 1024

/**
 * Collects Web Vitals from real visitors.
 *
 * The endpoint has to be public — it is called by every page view — so three
 * things stand between it and abuse: this same-origin check, the strict schema
 * in src/lib/vitals/schema.ts, and the absence of any route that reads the data back.
 *
 * The response is 204 in every case, including on rejection. A prober learns
 * nothing about what failed, and the browser has nothing to do with a reply
 * anyway: sendBeacon discards it.
 */
export async function POST(request: NextRequest) {
  const noContent = new NextResponse(null, { status: 204 })

  try {
    const origin = request.headers.get('origin')

    // sendBeacon always sends Origin. A missing or foreign one is not our page.
    if (!origin || origin !== ALLOWED_ORIGIN) {
      // Origin is attacker-settable, so it is truncated before logging —
      // the same reasoning that keeps the payload rejection below from
      // echoing attacker-supplied content. If NEXT_PUBLIC_BASE_URL ever
      // disagrees with the origin browsers actually use, this is the only
      // signal that every beacon is being silently discarded.
      console.warn('[vitals] rejected origin:', String(origin).slice(0, 64))
      return noContent
    }

    if (Number(request.headers.get('content-length')) > MAX_CONTENT_LENGTH_BYTES) {
      return noContent
    }

    const parsed = vitalsPayloadSchema.safeParse(await request.json())

    if (!parsed.success) {
      // Only code and path — both come from our own schema, never from the
      // caller. Never log `issue.input` or `issue.keys`: for an
      // unrecognized_keys violation those carry the entire attacker-supplied
      // request body and every attacker-chosen field name, unbounded.
      const summary = parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.code}`)
      console.warn('[vitals] rejected payload:', summary)
      return noContent
    }

    const payload = parsed.data

    await db.insert(webVitals).values({
      metric: payload.metric,
      value: payload.value,
      rating: payload.rating,
      path: payload.path,
      locale: payload.locale,
      device: payload.device,
      navigation_type: payload.navigationType,
    })
  } catch (error) {
    // Guards both a failing insert and a malformed-JSON `request.json()` throw.
    // Either way it must never surface to the visitor: this endpoint is
    // measurement, and measurement failing is not the page failing.
    console.error('[vitals] failed to store metric:', error)
  }

  return noContent
}
