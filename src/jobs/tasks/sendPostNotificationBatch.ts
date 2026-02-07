import type { Payload } from 'payload'
import { emailService } from '../../utilities/emailService'

/**
 * Sends batched new-post notifications to subscribers.
 *
 * Instead of sending one email per published post, this task collects all
 * posts published since the last notification run and sends a single email
 * per subscriber (or one email if only 1 post).
 */
export async function sendPostNotificationBatch({
  input,
  req,
}: {
  input: { postId?: number }
  req: { payload: Payload }
}): Promise<{ output: { sent: number; posts: number }; state: 'succeeded' }> {
  const { payload } = req

  await emailService.initialize(payload)

  // Find all published posts that haven't had notifications sent yet
  const posts = await payload.find({
    collection: 'posts',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { notificationSent: { equals: false } },
      ],
    },
    limit: 50,
    depth: 0,
    sort: '-publishedAt',
  })

  if (posts.docs.length === 0) {
    return { output: { sent: 0, posts: 0 }, state: 'succeeded' }
  }

  // Get active subscribers who want instant notifications
  const subscribers = await payload.find({
    collection: 'subscribers',
    where: {
      and: [
        { status: { equals: 'active' } },
        { 'preferences.newPosts': { equals: true } },
      ],
    },
    limit: 1000,
    depth: 0,
  })

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  let sentCount = 0

  if (subscribers.docs.length > 0) {
    const batchSize = 50
    for (let i = 0; i < subscribers.docs.length; i += batchSize) {
      const batch = subscribers.docs.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (subscriber) => {
          const unsubscribeUrl = `${serverUrl}/api/unsubscribe?token=${subscriber.unsubscribeToken}`
          const preferencesUrl = `${serverUrl}/account/preferences?token=${subscriber.unsubscribeToken}`

          let subject: string
          let html: string

          if (posts.docs.length === 1) {
            // Single post — normal notification
            const post = posts.docs[0]
            const postUrl = `${serverUrl}/posts/${post.slug}`

            const variables = {
              postTitle: post.title || '',
              postExcerpt: (post as any).excerpt || '',
              postUrl,
              unsubscribeUrl,
              preferencesUrl,
            }

            const template = await emailService.getTemplate('newPostSubscriber', variables)
            subject = template?.subject || `Novi članak: ${post.title}`
            html =
              template?.html ||
              `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">${post.title}</h2>
                <p>${(post as any).excerpt || ''}</p>
                <p><a href="${postUrl}" style="background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Pročitaj članak</a></p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  <a href="${preferencesUrl}">Upravljaj obavijestima</a> · <a href="${unsubscribeUrl}">Odjavi se</a>
                </p>
              </div>
            `
          } else {
            // Multiple posts — digest-style notification
            const postListHtml = posts.docs
              .map((post) => {
                const postUrl = `${serverUrl}/posts/${post.slug}`
                return `
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #eee;">
                    <a href="${postUrl}" style="color: #1a1a1a; text-decoration: none; font-size: 18px; font-weight: 600;">${post.title}</a>
                    <p style="margin: 4px 0 0; color: #666; font-size: 14px;">${(post as any).excerpt || ''}</p>
                  </td>
                </tr>`
              })
              .join('')

            subject = `${posts.docs.length} novih članaka na portalu`
            html = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">${posts.docs.length} novih članaka</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  ${postListHtml}
                </table>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                  <a href="${preferencesUrl}">Upravljaj obavijestima</a> · <a href="${unsubscribeUrl}">Odjavi se</a>
                </p>
              </div>
            `
          }

          const result = await emailService.send({ to: subscriber.email, subject, html })
          if (result.success) sentCount++
        }),
      )
    }
  }

  // Mark all posts as notified
  for (const post of posts.docs) {
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: { notificationSent: true },
    })
  }

  console.log(
    `[sendPostNotificationBatch] Sent ${sentCount} emails for ${posts.docs.length} posts`,
  )

  return { output: { sent: sentCount, posts: posts.docs.length }, state: 'succeeded' }
}
