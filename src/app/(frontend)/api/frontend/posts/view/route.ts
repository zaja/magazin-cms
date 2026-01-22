import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    // Get current post
    const post = await payload.findByID({
      collection: 'posts',
      id: postId,
      depth: 0,
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Increment view count
    await payload.update({
      collection: 'posts',
      id: postId,
      data: {
        viewCount: (post.viewCount || 0) + 1,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking view:', error)
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 })
  }
}
