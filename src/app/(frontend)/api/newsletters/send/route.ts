import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Check authentication — only logged-in admin/editor can send
    const { user } = await payload.auth({ headers: request.headers })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { newsletterId } = body

    if (!newsletterId) {
      return NextResponse.json({ error: 'Newsletter ID is required' }, { status: 400 })
    }

    // Fetch the newsletter to validate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newsletter = await (payload as any).findByID({
      collection: 'newsletters',
      id: newsletterId,
      depth: 0,
    })

    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }

    if (newsletter.status === 'sent') {
      return NextResponse.json({ error: 'Newsletter je već poslan' }, { status: 400 })
    }

    // Convert rich text content to HTML for the email
    // The task handler will use contentHtml field
    // For now, store a simple HTML version
    if (newsletter.content?.root) {
      const contentHtml = lexicalToSimpleHtml(newsletter.content.root)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).update({
        collection: 'newsletters',
        id: newsletterId,
        data: {
          status: 'queued',
          contentHtml,
        },
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload as any).update({
        collection: 'newsletters',
        id: newsletterId,
        data: { status: 'queued' },
      })
    }

    // Queue the send job
    await payload.jobs.queue({
      task: 'sendNewsletter' as 'schedulePublish',
      input: { newsletterId } as any,
      queue: 'notifications',
    })

    return NextResponse.json({
      success: true,
      message: 'Newsletter je dodan u red za slanje!',
    })
  } catch (error) {
    console.error('Error queuing newsletter:', error)
    return NextResponse.json({ error: 'Greška pri slanju newslettera' }, { status: 500 })
  }
}

// Simple Lexical to HTML converter for newsletter content
function lexicalToSimpleHtml(node: any): string {
  if (!node) return ''

  if (node.type === 'text') {
    let text = node.text || ''
    const fmt = node.format || 0
    if (fmt & 1) text = `<strong>${text}</strong>`
    if (fmt & 2) text = `<em>${text}</em>`
    if (fmt & 4) text = `<s>${text}</s>`
    if (fmt & 8) text = `<u>${text}</u>`
    return text
  }

  const children = (node.children || []).map(lexicalToSimpleHtml).join('')

  switch (node.type) {
    case 'root':
      return children
    case 'paragraph':
      return `<p>${children}</p>`
    case 'heading':
      return `<${node.tag || 'h2'}>${children}</${node.tag || 'h2'}>`
    case 'list':
      return node.listType === 'number' ? `<ol>${children}</ol>` : `<ul>${children}</ul>`
    case 'listitem':
      return `<li>${children}</li>`
    case 'link':
      return `<a href="${node.fields?.url || '#'}">${children}</a>`
    case 'linebreak':
      return '<br>'
    case 'quote':
      return `<blockquote>${children}</blockquote>`
    default:
      return children
  }
}
