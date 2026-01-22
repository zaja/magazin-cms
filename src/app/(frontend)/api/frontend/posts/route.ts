import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import type { Where } from 'payload'
import {
  rateLimitResponse,
  checkRateLimit,
  getClientIp,
  addRateLimitHeaders,
} from '@/utilities/rateLimit'

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit(`${ip}:/api/posts`, { limit: 100, windowMs: 60000 })
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult)
  }

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')

    const conditions: Where[] = [{ _status: { equals: 'published' } }]

    if (category) {
      conditions.push({ 'categories.slug': { equals: category } })
    }

    if (tag) {
      conditions.push({ 'tags.slug': { equals: tag } })
    }

    const where: Where = conditions.length > 1 ? { and: conditions } : conditions[0]

    const posts = await payload.find({
      collection: 'posts',
      where,
      page,
      limit: Math.min(limit, 50),
      sort: '-publishedAt',
      depth: 1,
    })

    const response = NextResponse.json(posts)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    addRateLimitHeaders(response, rateLimitResult)

    return response
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
