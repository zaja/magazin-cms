import type { Payload } from 'payload'
import { emailService } from '../../utilities/emailService'

/**
 * Sends a manually composed newsletter to subscribers.
 * Created when admin clicks "Send" on a Newsletter document.
 */
export async function sendNewsletter({
  input,
  req,
}: {
  input: { newsletterId: number }
  req: { payload: Payload }
}): Promise<{ output: { sent: number }; state: 'succeeded' }> {
  const { payload } = req

  await emailService.initialize(payload)

  // Fetch the newsletter — use 'as any' because collection type is generated after build
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newsletter = await (payload as any).findByID({
    collection: 'newsletters',
    id: input.newsletterId,
    depth: 0,
  })

  if (!newsletter) {
    throw new Error(`Newsletter ${input.newsletterId} not found`)
  }

  if (newsletter.status === 'sent') {
    console.log(`[sendNewsletter] Newsletter ${input.newsletterId} already sent, skipping`)
    return { output: { sent: 0 }, state: 'succeeded' }
  }

  // Build audience query based on newsletter audience setting
  const audience = newsletter.audience as string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereConditions: any[] = [
    { status: { equals: 'active' } },
  ]

  if (audience === 'newsletter_only') {
    whereConditions.push({ 'preferences.newsletter': { equals: true } })
  } else if (audience === 'digest_subscribers') {
    whereConditions.push({ 'preferences.weeklyDigest': { equals: true } })
  }
  // 'all_active' — no additional filter

  const subscribers = await payload.find({
    collection: 'subscribers',
    where: { and: whereConditions },
    limit: 5000,
    depth: 0,
  })

  if (subscribers.docs.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).update({
      collection: 'newsletters',
      id: input.newsletterId,
      data: {
        status: 'sent',
        sentAt: new Date().toISOString(),
        sentCount: 0,
      },
    })
    console.log('[sendNewsletter] No subscribers found for audience:', audience)
    return { output: { sent: 0 }, state: 'succeeded' }
  }

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const subject = newsletter.subject as string
  const contentHtml = newsletter.contentHtml as string | undefined

  // Use contentHtml if available, otherwise use a simple text fallback
  const bodyHtml = contentHtml || '<p>Newsletter content</p>'

  let sentCount = 0
  const batchSize = 50

  for (let i = 0; i < subscribers.docs.length; i += batchSize) {
    const batch = subscribers.docs.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (subscriber) => {
        const unsubscribeUrl = `${serverUrl}/api/unsubscribe?token=${subscriber.unsubscribeToken}`
        const preferencesUrl = `${serverUrl}/account/preferences?token=${subscriber.unsubscribeToken}`

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${bodyHtml}
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

  // Mark newsletter as sent
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (payload as any).update({
    collection: 'newsletters',
    id: input.newsletterId,
    data: {
      status: 'sent',
      sentAt: new Date().toISOString(),
      sentCount,
    },
  })

  console.log(`[sendNewsletter] Sent ${sentCount} emails for newsletter "${subject}"`)

  return { output: { sent: sentCount }, state: 'succeeded' }
}
