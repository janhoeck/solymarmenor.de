import { db } from '@/utils/db'
import { webVitals } from '@/utils/db/schema'
import { NextRequest, NextResponse } from 'next/server'

import { vitalsPayloadSchema } from '@/lib/vitals/schema'

/**
 * Collects Web Vitals from real visitors.
 *
 * The endpoint has to be public — it is called by every page view — so three
 * things stand between it and abuse: this same-origin check, the strict schema
 * in ./schema.ts, and the absence of any route that reads the data back.
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
    if (!origin || origin !== request.nextUrl.origin) {
      return noContent
    }

    const parsed = vitalsPayloadSchema.safeParse(await request.json())

    if (!parsed.success) {
      console.warn('[vitals] rejected payload:', parsed.error.issues)
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
    // A failed insert must never surface to the visitor: this endpoint is
    // measurement, and measurement failing is not the page failing.
    console.error('[vitals] failed to store metric:', error)
  }

  return noContent
}
