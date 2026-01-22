import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const collection = searchParams.get('collection')
  const slug = searchParams.get('slug')
  const previewSecret = searchParams.get('previewSecret')

  // Validate preview secret
  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 401 })
  }

  if (!path || !collection || !slug) {
    return new Response('Missing required parameters', { status: 400 })
  }

  // Verify the document exists
  const payload = await getPayload({ config })

  const docs = await payload.find({
    collection: collection as 'posts' | 'pages',
    where: {
      slug: { equals: slug },
    },
    limit: 1,
    draft: true,
  })

  if (!docs.docs.length) {
    return new Response('Document not found', { status: 404 })
  }

  // Enable draft mode
  const draft = await draftMode()
  draft.enable()

  // Redirect to the preview path
  redirect(path)
}
