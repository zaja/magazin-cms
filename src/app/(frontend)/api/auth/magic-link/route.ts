import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'
import { emailService } from '@/utilities/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email je obavezan' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    await emailService.initialize(payload)

    // Find or create subscriber
    const subscriber = await payload.find({
      collection: 'subscribers',
      where: { email: { equals: email.toLowerCase() } },
      limit: 1,
    })

    let subscriberId: number

    if (subscriber.docs.length === 0) {
      // Create new subscriber - preferences unchecked by default for direct login
      // User can enable them in account settings
      const newSubscriber = await payload.create({
        collection: 'subscribers',
        data: {
          email: email.toLowerCase(),
          status: 'active', // Auto-activate for magic link signup
          preferences: {
            newPosts: false,
            commentReplies: false,
            newsletter: false,
          },
        },
        context: {
          skipConfirmationEmail: true, // Magic link sends its own email
        },
      })
      subscriberId = newSubscriber.id
    } else {
      subscriberId = subscriber.docs[0].id

      // Reactivate if unsubscribed
      if (subscriber.docs[0].status === 'unsubscribed') {
        await payload.update({
          collection: 'subscribers',
          id: subscriberId,
          data: { status: 'active' },
        })
      }
    }

    // Generate magic link token
    const magicLinkToken = crypto.randomBytes(32).toString('hex')
    const magicLinkExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await payload.update({
      collection: 'subscribers',
      id: subscriberId,
      data: {
        magicLinkToken,
        magicLinkExpiry: magicLinkExpiry.toISOString(),
      },
    })

    // Send magic link email
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const verifyUrl = `${serverUrl}/api/auth/verify?token=${magicLinkToken}${redirectTo ? `&redirectTo=${encodeURIComponent(redirectTo)}` : ''}`

    const variables = {
      loginUrl: verifyUrl,
      email: email.toLowerCase(),
      expiresIn: '15 minuta',
    }

    const template = await emailService.getTemplate('magicLink', variables)

    await emailService.send({
      to: email,
      subject: template?.subject || 'Vaš link za prijavu',
      html:
        template?.html ||
        `
        <p>Primili smo zahtjev za prijavu na vaš račun (${email}). Kliknite na link ispod da se prijavite:</p>
        <p><a href="${verifyUrl}" style="background: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600;">Prijavi se</a></p>
        <p>Link vrijedi 15 minuta. Ako niste zatražili prijavu, možete ignorirati ovaj email.</p>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Link za prijavu je poslan na vaš email',
    })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json({ error: 'Greška pri slanju linka za prijavu' }, { status: 500 })
  }
}
