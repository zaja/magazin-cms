import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimitResponse, checkRateLimit, getClientIp } from '@/utilities/rateLimit'
import crypto from 'crypto'
import { emailService } from '@/utilities/emailService'

export async function POST(request: NextRequest) {
  // Stricter rate limiting for subscriptions (5 per minute)
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit(`${ip}:/api/subscribe`, { limit: 5, windowMs: 60000 })
  if (!rateLimitResult.success) {
    return rateLimitResponse(rateLimitResult)
  }

  try {
    const payload = await getPayload({ config })
    await emailService.initialize(payload)
    const body = await request.json()

    const { email, name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email je obavezan' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()

    // Check if already exists
    const existing = await payload.find({
      collection: 'subscribers',
      where: {
        email: { equals: normalizedEmail },
      },
      limit: 1,
    })

    let subscriberId: number
    let isNewSubscriber = false

    if (existing.docs.length > 0) {
      const subscriber = existing.docs[0]
      subscriberId = subscriber.id

      if (subscriber.status === 'active') {
        // Already active - check if newsletter is enabled
        if (subscriber.preferences?.newsletter) {
          return NextResponse.json({
            success: true,
            message: 'Već ste pretplaćeni na newsletter!',
          })
        }
        // Enable newsletter preference and send confirmation
        await payload.update({
          collection: 'subscribers',
          id: subscriberId,
          data: {
            preferences: {
              ...subscriber.preferences,
              newsletter: true,
            },
          },
        })
        return NextResponse.json({
          success: true,
          message: 'Newsletter pretplata je aktivirana!',
        })
      }

      if (subscriber.status === 'unsubscribed') {
        // Reactivate with pending status
        await payload.update({
          collection: 'subscribers',
          id: subscriberId,
          data: {
            status: 'pending',
            preferences: {
              ...subscriber.preferences,
              newsletter: true,
            },
          },
        })
      }
      // For pending status, just resend verification
    } else {
      // Create new subscriber with only newsletter enabled
      const newSubscriber = await payload.create({
        collection: 'subscribers',
        data: {
          email: normalizedEmail,
          name: name || undefined,
          status: 'pending',
          preferences: {
            newPosts: false,
            commentReplies: false,
            newsletter: true,
          },
        },
        context: {
          skipConfirmationEmail: true, // We send our own magic link
        },
      })
      subscriberId = newSubscriber.id
      isNewSubscriber = true
    }

    // Generate magic link token for verification + auto-login
    const magicLinkToken = crypto.randomBytes(32).toString('hex')
    const magicLinkExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours for newsletter

    await payload.update({
      collection: 'subscribers',
      id: subscriberId,
      data: {
        magicLinkToken,
        magicLinkExpiry: magicLinkExpiry.toISOString(),
      },
    })

    // Send verification email with magic link
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    const verifyUrl = `${serverUrl}/api/auth/verify?token=${magicLinkToken}&source=newsletter`

    await emailService.send({
      to: normalizedEmail,
      subject: 'Potvrdite pretplatu na newsletter',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Potvrdite pretplatu na newsletter</h2>
          <p>Hvala na prijavi! Kliknite na gumb ispod za potvrdu email adrese${isNewSubscriber ? ' i kreiranje računa' : ''}.</p>
          <p style="margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600;">
              Potvrdi pretplatu
            </a>
          </p>
          <p style="font-size: 14px; color: #666;">
            Ako niste zatražili ovu pretplatu, možete sigurno ignorirati ovaj email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      success: true,
      message: 'Provjerite email za potvrdu pretplate.',
    })
  } catch (error) {
    console.error('Error subscribing:', error)
    return NextResponse.json({ error: 'Greška pri pretplati' }, { status: 500 })
  }
}
