import type { Payload } from 'payload'
import { emailService } from '../../utilities/emailService'

/**
 * Sends a weekly digest email to subscribers who opted in.
 * Collects all posts published in the last 7 days and sends
 * a single summary email. If no posts were published, no email is sent.
 */
export async function sendWeeklyDigest({
  req,
}: {
  input: Record<string, never>
  req: { payload: Payload }
}): Promise<{ output: { sent: number; posts: number }; state: 'succeeded' }> {
  const { payload } = req

  await emailService.initialize(payload)

  // Get posts published in the last 7 days
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const posts = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { publishedAt: { greater_than: oneWeekAgo.toISOString() } },
      ],
    },
    limit: 50,
    depth: 0,
    sort: '-publishedAt',
  })

  if (posts.docs.length === 0) {
    console.log('[sendWeeklyDigest] No posts published this week, skipping digest')
    return { output: { sent: 0, posts: 0 }, state: 'succeeded' }
  }

  // Get active subscribers who want weekly digest
  const subscribers = await payload.find({
    collection: 'subscribers',
    where: {
      and: [
        { status: { equals: 'active' } },
        { 'preferences.weeklyDigest': { equals: true } },
      ],
    },
    limit: 1000,
    depth: 0,
  })

  if (subscribers.docs.length === 0) {
    console.log('[sendWeeklyDigest] No subscribers opted in for weekly digest')
    return { output: { sent: 0, posts: posts.docs.length }, state: 'succeeded' }
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  let sentCount = 0

  // Build post list HTML
  const postListHtml = posts.docs
    .map((post) => {
      const postUrl = `${serverUrl}/posts/${post.slug}`
      return `
      <tr>
        <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
          <a href="${postUrl}" style="color: #1a1a1a; text-decoration: none; font-size: 18px; font-weight: 600;">${post.title}</a>
          <p style="margin: 4px 0 0; color: #666; font-size: 14px;">${(post as unknown as Record<string, string>).excerpt || ''}</p>
        </td>
      </tr>`
    })
    .join('')

  const postListTable = `<table style="width: 100%; border-collapse: collapse;">${postListHtml}</table>`

  // Send in batches
  const batchSize = 50
  for (let i = 0; i < subscribers.docs.length; i += batchSize) {
    const batch = subscribers.docs.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (subscriber) => {
        const unsubscribeUrl = `${serverUrl}/api/unsubscribe?token=${subscriber.unsubscribeToken}`
        const preferencesUrl = `${serverUrl}/account/preferences?token=${subscriber.unsubscribeToken}`

        const variables = {
          postCount: String(posts.docs.length),
          postList: postListTable,
          siteUrl: serverUrl,
          preferencesUrl,
          unsubscribeUrl,
        }

        const template = await emailService.getTemplate('weeklyDigest', variables)
        const subject = template?.subject || `Tjedni pregled — ${posts.docs.length} ${posts.docs.length === 1 ? 'novi članak' : 'novih članaka'}`
        const html =
          template?.html ||
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px;">Tjedni pregled</h2>
            <p style="color: #666;">Evo što smo objavili ovaj tjedan:</p>
            ${postListTable}
            <p style="margin-top: 24px;">
              <a href="${serverUrl}" style="background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Posjeti portal</a>
            </p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              <a href="${preferencesUrl}">Upravljaj obavijestima</a> · <a href="${unsubscribeUrl}">Odjavi se</a>
            </p>
          </div>
        `

        const result = await emailService.send({ to: subscriber.email, subject, html })
        if (result.success) sentCount++
      }),
    )
  }

  console.log(
    `[sendWeeklyDigest] Sent ${sentCount} digest emails with ${posts.docs.length} posts`,
  )

  return { output: { sent: sentCount, posts: posts.docs.length }, state: 'succeeded' }
}
