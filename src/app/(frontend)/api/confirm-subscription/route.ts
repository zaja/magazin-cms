import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const subscribers = await payload.find({
      collection: 'subscribers',
      where: {
        confirmationToken: { equals: token },
      },
      limit: 1,
    })

    if (subscribers.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })
    }

    const subscriber = subscribers.docs[0]

    if (subscriber.status === 'active') {
      return NextResponse.json({
        success: true,
        message: 'Your subscription is already confirmed!',
      })
    }

    await payload.update({
      collection: 'subscribers',
      id: subscriber.id,
      data: {
        status: 'active',
        confirmedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Your subscription has been confirmed!',
    })
  } catch (error) {
    console.error('Error confirming subscription:', error)
    return NextResponse.json({ error: 'Failed to confirm subscription' }, { status: 500 })
  }
}
