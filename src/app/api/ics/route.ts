import { getPropertyById } from '@/lib/properties/repository'
import { NextRequest, NextResponse } from 'next/server'

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

    const response = await fetch(icalUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Error fetching calendar: ${response.status}`)
    }

    return new NextResponse(await response.text(), {
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
