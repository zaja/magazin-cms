import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const payload = await getPayload({ config })
    const { slug } = await params

    const posts = await payload.find({
      collection: 'posts',
      where: {
        slug: { equals: slug },
        _status: { equals: 'published' },
      },
      limit: 1,
      depth: 2,
    })

    if (posts.docs.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const post = posts.docs[0]

    // Increment view count
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: {
        viewCount: (post.viewCount || 0) + 1,
      },
    })

    const response = NextResponse.json(post)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return response
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}
