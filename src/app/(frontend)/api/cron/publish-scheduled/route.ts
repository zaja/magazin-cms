import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const now = new Date()

    // Find posts that are scheduled and their publishedAt date has passed
    const scheduledPosts = await payload.find({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'draft' } },
          { publishedAt: { less_than_equal: now.toISOString() } },
          { publishedAt: { exists: true } },
        ],
      },
      limit: 50,
      depth: 0,
    })

    if (scheduledPosts.docs.length === 0) {
      return NextResponse.json({ success: true, published: 0 })
    }

    let publishedCount = 0

    for (const post of scheduledPosts.docs) {
      try {
        await payload.update({
          collection: 'posts',
          id: post.id,
          data: {
            _status: 'published',
          },
        })
        publishedCount++
        console.log(`Published scheduled post: ${post.title}`)
      } catch (error) {
        console.error(`Failed to publish post ${post.id}:`, error)
      }
    }

    return NextResponse.json({ success: true, published: publishedCount })
  } catch (error) {
    console.error('Cron publish-scheduled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
