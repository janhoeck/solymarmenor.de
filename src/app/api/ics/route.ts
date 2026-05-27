import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get iCal URL from query parameter
    const searchParams = request.nextUrl.searchParams
    const icalUrl = searchParams.get('url')

    if (!icalUrl) {
      return NextResponse.json({ error: 'URL parameter is missing' }, { status: 400 })
    }

    // Validation: URL should be from Airbnb
    if (!icalUrl.includes('airbnb')) {
      return NextResponse.json({ error: 'Only Airbnb URLs are allowed' }, { status: 400 })
    }

    const response = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Error fetching calendar: ${response.status}`)
    }

    const icalData = await response.text()

    return new NextResponse(icalData, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Calendar error:', error)
    return NextResponse.json({ error: 'Error loading Airbnb calendar' }, { status: 500 })
  }
}
