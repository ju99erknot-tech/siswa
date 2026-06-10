import { NextRequest, NextResponse } from 'next/server'

// ── Allowed origins — lock down CORS in production ──────────
const ALLOWED_ORIGINS = new Set([
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.NEXT_PUBLIC_SITE_URL, // e.g. https://kesiswaan.sdn02cibadak.sch.id
].filter(Boolean))

function getCorsOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin') || ''
  // In development, allow any localhost origin
  if (process.env.NODE_ENV === 'development') return origin || '*'
  // In production, only allow whitelisted origins
  return ALLOWED_ORIGINS.has(origin) ? origin : ''
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    const corsOrigin = getCorsOrigin(request)

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Validate that it's an external URL (http/https)
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 })
    }

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        ...(corsOrigin && { 'Access-Control-Allow-Origin': corsOrigin }),
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // 1 day + 7 day stale
      },
    })
  } catch (error) {
    console.error('[proxy-image] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  const corsOrigin = getCorsOrigin(request)
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...(corsOrigin && { 'Access-Control-Allow-Origin': corsOrigin }),
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
