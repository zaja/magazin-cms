import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const payload = await getPayload({ config })
    const { slug } = await params

    const pages = await payload.find({
      collection: 'pages',
      where: {
        slug: { equals: slug },
        _status: { equals: 'published' },
      },
      limit: 1,
      depth: 2,
    })

    if (!pages.docs.length) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const page = pages.docs[0]

    const response = NextResponse.json(page)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    return response
  } catch (error) {
    console.error('Error fetching page:', error)
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 })
  }
}
