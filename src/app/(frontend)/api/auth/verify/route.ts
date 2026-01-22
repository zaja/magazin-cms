import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(process.env.PAYLOAD_SECRET || 'your-secret-key')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const redirectTo = searchParams.get('redirectTo') || '/account'

    if (!token) {
      return NextResponse.redirect(new URL('/account/login?error=missing_token', request.url))
    }

    const payload = await getPayload({ config })

    // Find subscriber with this token
    const result = await payload.find({
      collection: 'subscribers',
      where: { magicLinkToken: { equals: token } },
      limit: 1,
    })

    if (result.docs.length === 0) {
      return NextResponse.redirect(new URL('/account/login?error=invalid_token', request.url))
    }

    const subscriber = result.docs[0]

    // Check if token is expired
    if (subscriber.magicLinkExpiry) {
      const expiry = new Date(subscriber.magicLinkExpiry)
      if (expiry < new Date()) {
        return NextResponse.redirect(new URL('/account/login?error=expired_token', request.url))
      }
    }

    // Clear the magic link token (one-time use)
    await payload.update({
      collection: 'subscribers',
      id: subscriber.id,
      data: {
        magicLinkToken: null,
        magicLinkExpiry: null,
        // Activate if pending
        status: subscriber.status === 'pending' ? 'active' : subscriber.status,
        confirmedAt:
          subscriber.status === 'pending' ? new Date().toISOString() : subscriber.confirmedAt,
      },
    })

    // Create JWT session token
    const sessionToken = await new SignJWT({
      subscriberId: subscriber.id,
      email: subscriber.email,
      name: subscriber.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('member_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    })

    // Redirect to intended destination
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
    return NextResponse.redirect(new URL(redirectTo, serverUrl))
  } catch (error) {
    console.error('Verify token error:', error)
    return NextResponse.redirect(new URL('/account/login?error=verification_failed', request.url))
  }
}
