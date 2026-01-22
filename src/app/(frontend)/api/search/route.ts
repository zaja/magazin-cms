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
  // Rate limiting for search (30 per minute)
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit(`${ip}:/api/search`, { limit: 30, windowMs: 60000 })
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult)
  }

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)

    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 },
      )
    }

    const results: {
      posts: unknown[]
      pages: unknown[]
    } = {
      posts: [],
      pages: [],
    }

    const baseWhere: Where = {
      _status: { equals: 'published' },
    }

    if (type === 'all' || type === 'posts') {
      const posts = await payload.find({
        collection: 'posts',
        where: {
          and: [
            baseWhere,
            {
              or: [{ title: { contains: query } }, { excerpt: { contains: query } }],
            },
          ],
        },
        limit,
        depth: 1,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          categories: true,
        },
      })
      results.posts = posts.docs
    }

    if (type === 'all' || type === 'pages') {
      const pages = await payload.find({
        collection: 'pages',
        where: {
          and: [
            baseWhere,
            {
              title: { contains: query },
            },
          ],
        },
        limit,
        depth: 0,
        select: {
          id: true,
          title: true,
          slug: true,
        },
      })
      results.pages = pages.docs
    }

    const response = NextResponse.json({
      query,
      results,
      totalResults: results.posts.length + results.pages.length,
    })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    addRateLimitHeaders(response, rateLimitResult)

    return response
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
