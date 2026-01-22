import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // requests per window

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record) {
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return false
  }

  if (now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return false
  }

  record.count++
  return record.count > MAX_REQUESTS
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit API routes (excluding admin)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/admin')) {
    const key = getRateLimitKey(request)

    if (isRateLimited(key)) {
      const errorResponse = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      )
      return addSecurityHeaders(errorResponse)
    }
  }

  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

export const config = {
  matcher: ['/api/:path*'],
}
