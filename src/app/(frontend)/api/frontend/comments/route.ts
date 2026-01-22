import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { sanitizeComment, sanitizeUrl } from '@/utilities/sanitize'
import {
  rateLimitResponse,
  checkRateLimit,
  getClientIp,
  addRateLimitHeaders,
} from '@/utilities/rateLimit'
import { getMemberSession } from '@/utilities/memberAuth'

export async function GET(request: NextRequest) {
  // Rate limiting
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit(`${ip}:/api/comments:GET`, { limit: 100, windowMs: 60000 })
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult)
  }

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    const comments = await payload.find({
      collection: 'comments',
      where: {
        post: { equals: postId },
        status: { equals: 'approved' },
      },
      sort: 'createdAt',
      depth: 1,
      limit: 100,
    })

    const response = NextResponse.json(comments)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    addRateLimitHeaders(response, rateLimitResult)

    return response
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Stricter rate limiting for POST (10 per minute)
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit(`${ip}:/api/comments:POST`, { limit: 10, windowMs: 60000 })
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult)
  }

  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const { postId, content, parentCommentId, website } = body

    if (!postId || !content) {
      return NextResponse.json({ error: 'postId i content su obavezni' }, { status: 400 })
    }

    // Check if user is logged in
    const member = await getMemberSession()
    if (!member) {
      return NextResponse.json(
        { error: 'Morate biti prijavljeni za komentiranje', requiresAuth: true },
        { status: 401 },
      )
    }

    // Get subscriber details
    const subscriber = await payload.findByID({
      collection: 'subscribers',
      id: member.subscriberId,
    })

    if (!subscriber || subscriber.status !== 'active') {
      return NextResponse.json(
        { error: 'Vaš račun nije aktivan', requiresAuth: true },
        { status: 401 },
      )
    }

    // Convert postId to number if it's a string (PostgreSQL uses numeric IDs)
    const numericPostId = typeof postId === 'string' ? parseInt(postId, 10) : postId

    if (isNaN(numericPostId)) {
      return NextResponse.json({ error: 'Neispravan ID posta' }, { status: 400 })
    }

    // Validate that the post exists
    try {
      const post = await payload.findByID({
        collection: 'posts',
        id: numericPostId,
        depth: 0,
      })
      if (!post) {
        return NextResponse.json({ error: 'Post nije pronađen' }, { status: 404 })
      }
    } catch {
      return NextResponse.json({ error: 'Neispravan ID posta' }, { status: 400 })
    }

    // Sanitize inputs
    const sanitizedContent = sanitizeComment(content)
    const sanitizedWebsite = website ? sanitizeUrl(website) : undefined

    // Basic spam check
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'click here']
    const isSpam = spamKeywords.some((keyword) => sanitizedContent.toLowerCase().includes(keyword))

    // Logged-in users get auto-approved (unless spam)
    const comment = await payload.create({
      collection: 'comments',
      data: {
        post: numericPostId,
        parentComment: parentCommentId || undefined,
        author: {
          name: subscriber.name || member.email.split('@')[0],
          email: member.email,
          website: sanitizedWebsite || undefined,
        },
        content: sanitizedContent,
        status: isSpam ? 'spam' : 'approved', // Auto-approve for logged-in users
        subscribedToReplies: true, // Logged-in users get reply notifications
      },
    })

    // Enable comment replies preference if not already
    if (!subscriber.preferences?.commentReplies) {
      await payload.update({
        collection: 'subscribers',
        id: subscriber.id,
        data: {
          preferences: {
            ...subscriber.preferences,
            commentReplies: true,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: isSpam ? 'Vaš komentar je označen za pregled.' : 'Vaš komentar je objavljen!',
      id: comment.id,
      approved: !isSpam,
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Greška pri slanju komentara' }, { status: 500 })
  }
}
