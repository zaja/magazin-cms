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
  const contentHtml = newsletter.contentHtml as string | undefined

  // Use contentHtml if available, otherwise use a simple text fallback
  const bodyHtml = contentHtml || '<p>Newsletter content</p>'

  // Fetch site name from settings
  let siteName = 'Portal'
  try {
    const settings = await payload.findGlobal({ slug: 'settings' })
    siteName = (settings as unknown as Record<string, string>).siteName || siteName
  } catch {
    // ignore
  }

  const today = new Date().toLocaleDateString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  let sentCount = 0
  const batchSize = 50

  // Replace global tags in subject and body
  const replaceGlobalTags = (text: string) =>
    text
      .replace(/\{\{siteName\}\}/g, siteName)
      .replace(/\{\{siteUrl\}\}/g, serverUrl)
      .replace(/\{\{date\}\}/g, today)
      .replace(/\{\{subscriberCount\}\}/g, String(subscribers.docs.length))

  const subjectTemplate = replaceGlobalTags(newsletter.subject as string)

  for (let i = 0; i < subscribers.docs.length; i += batchSize) {
    const batch = subscribers.docs.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (subscriber) => {
        const unsubscribeUrl = `${serverUrl}/api/unsubscribe?token=${subscriber.unsubscribeToken}`
        const preferencesUrl = `${serverUrl}/account/preferences?token=${subscriber.unsubscribeToken}`
        const subscriberName = subscriber.name || 'pretplatniče'

        // Replace per-subscriber tags
        const replaceSubscriberTags = (text: string) =>
          text
            .replace(/\{\{subscriberName\}\}/g, subscriberName)
            .replace(/\{\{subscriberEmail\}\}/g, subscriber.email)
            .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl)
            .replace(/\{\{preferencesUrl\}\}/g, preferencesUrl)

        const subject = replaceSubscriberTags(subjectTemplate)
        const personalizedBody = replaceSubscriberTags(replaceGlobalTags(bodyHtml))

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${personalizedBody}
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

  console.log(`[sendNewsletter] Sent ${sentCount} emails for newsletter "${newsletter.subject}"`)

  return { output: { sent: sentCount }, state: 'succeeded' }
}
