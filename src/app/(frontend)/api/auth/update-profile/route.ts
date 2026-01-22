import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getMemberSession } from '@/utilities/memberAuth'

export async function POST(request: NextRequest) {
  try {
    const session = await getMemberSession()

    if (!session) {
      return NextResponse.json({ error: 'Niste prijavljeni' }, { status: 401 })
    }

    const { name, preferences, status } = await request.json()

    const payload = await getPayload({ config })

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) {
      updateData.name = name
    }

    if (preferences) {
      updateData.preferences = preferences
    }

    if (status) {
      updateData.status = status
      if (status === 'unsubscribed') {
        updateData.unsubscribedAt = new Date().toISOString()
      }
    }

    await payload.update({
      collection: 'subscribers',
      id: session.subscriberId,
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Greška pri ažuriranju profila' }, { status: 500 })
  }
}
