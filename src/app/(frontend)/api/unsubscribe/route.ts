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
        unsubscribeToken: { equals: token },
      },
      limit: 1,
    })

    if (subscribers.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
    }

    const subscriber = subscribers.docs[0]

    if (subscriber.status === 'unsubscribed') {
      return NextResponse.json({
        success: true,
        message: 'You have already unsubscribed.',
      })
    }

    await payload.update({
      collection: 'subscribers',
      id: subscriber.id,
      data: {
        status: 'unsubscribed',
        unsubscribedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed successfully.',
    })
  } catch (error) {
    console.error('Error unsubscribing:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
