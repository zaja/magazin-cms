import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    // Delete drafts older than 30 days that were never published
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const oldDrafts = await payload.find({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'draft' } },
          { updatedAt: { less_than: thirtyDaysAgo.toISOString() } },
        ],
      },
      limit: 100,
      depth: 0,
    })

    if (oldDrafts.docs.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    let deletedCount = 0

    for (const draft of oldDrafts.docs) {
      try {
        await payload.delete({
          collection: 'posts',
          id: draft.id,
        })
        deletedCount++
        console.log(`Deleted old draft: ${draft.title}`)
      } catch (error) {
        console.error(`Failed to delete draft ${draft.id}:`, error)
      }
    }

    return NextResponse.json({ success: true, deleted: deletedCount })
  } catch (error) {
    console.error('Cron cleanup-drafts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
