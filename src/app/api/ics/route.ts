import { getPropertyById } from '@/lib/properties/repository'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Every iCalendar feed starts with this line. Airbnb can answer an expired or
 * revoked token with an HTML error or login page under HTTP 200, which would
 * otherwise be forwarded as `text/calendar` and render as an empty calendar
 * with no signal anywhere.
 */
const ICALENDAR_PREFIX = 'BEGIN:VCALENDAR'

/**
 * Resolves the calendar URL server-side from an environment variable, so the
 * token never reaches the client and the route cannot be pointed at a
 * caller-supplied address.
 */
export async function GET(request: NextRequest) {
  try {
    const propertyId = request.nextUrl.searchParams.get('property')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property parameter is missing' }, { status: 400 })
    }

    const property = await getPropertyById(propertyId)
    const secretRef = property?.calendar?.secretRef

    if (!secretRef) {
      return NextResponse.json({ error: 'Unknown property' }, { status: 404 })
    }

    const icalUrl = process.env[secretRef]

    if (!icalUrl) {
      console.error(`Calendar error: environment variable ${secretRef} is not set`)
      return NextResponse.json({ error: 'Calendar is not configured' }, { status: 500 })
    }

    // The URL comes from the deployment environment, not from the caller, but an
    // operator typo such as `http://169.254.169.254/…` would turn this route into
    // a read-out of that address. Requiring https also rules out file: and data:.
    let protocol: string

    try {
      protocol = new URL(icalUrl).protocol
    } catch {
      console.error(`Calendar error: environment variable ${secretRef} is not a valid URL`)
      return NextResponse.json({ error: 'Calendar is not configured' }, { status: 500 })
    }

    if (protocol !== 'https:') {
      console.error(`Calendar error: environment variable ${secretRef} must use https, got ${protocol}`)
      return NextResponse.json({ error: 'Calendar is not configured' }, { status: 500 })
    }

    const response = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Error fetching calendar: ${response.status}`)
    }

    const body = await response.text()

    // `trimStart` also strips a byte-order mark, which counts as whitespace in
    // ECMAScript. An HTML error or login page is not tolerated: it starts with `<`.
    if (!body.trimStart().startsWith(ICALENDAR_PREFIX)) {
      throw new Error(`Calendar response is not iCalendar data (${body.length} bytes)`)
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Calendar error:', error)
    return NextResponse.json({ error: 'Error loading calendar' }, { status: 500 })
  }
}
