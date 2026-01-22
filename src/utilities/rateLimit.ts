import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60 * 1000 // 1 minute

let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export const defaultRateLimitConfig: RateLimitConfig = {
  limit: 100,
  windowMs: 60 * 1000, // 1 minute
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultRateLimitConfig,
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + config.windowMs,
    }
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: entry.resetTime,
    }
  }

  entry.count++
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  }
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    },
  )
}

export function withRateLimit(
  request: Request,
  config: RateLimitConfig = defaultRateLimitConfig,
): RateLimitResult | null {
  const ip = getClientIp(request)
  const url = new URL(request.url)
  const identifier = `${ip}:${url.pathname}`

  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    return result
  }

  return null
}

export function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toString())
  return response
}
