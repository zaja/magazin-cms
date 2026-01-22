#!/usr/bin/env npx tsx
/**
 * Requeue all failed imports for retry
 * Usage: npx tsx scripts/reprocess-failed.ts [--days=7]
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const reprocessFailed = async (days?: number) => {
  console.log('[Reprocess] Starting...')

  const payload = await getPayload({ config })
  console.log('[Reprocess] Payload initialized')

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let whereClause: any = { status: { equals: 'failed' } }

  if (days) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    whereClause = {
      and: [{ status: { equals: 'failed' } }, { processedAt: { greater_than: cutoffDate } }],
    }
    console.log(`[Reprocess] Looking for failed imports from last ${days} days`)
  }

  const failed = await payload.find({
    collection: 'imported-posts' as 'posts',
    where: whereClause,
    limit: 1000,
  })

  console.log(`[Reprocess] Found ${failed.docs.length} failed imports`)

  if (failed.docs.length === 0) {
    console.log('[Reprocess] Nothing to reprocess')
    process.exit(0)
  }

  let processed = 0
  for (const doc of failed.docs) {
    const record = doc as unknown as Record<string, unknown>
    await payload.update({
      collection: 'imported-posts' as 'posts',
      id: String(doc.id),
      data: {
        status: 'pending',
        retryCount: ((record.retryCount as number) || 0) + 1,
        errorMessage: null,
        lockedAt: null,
        lockedBy: null,
      } as Record<string, unknown>,
    })
    processed++

    if (processed % 10 === 0) {
      console.log(`[Reprocess] Reset ${processed}/${failed.docs.length}...`)
    }
  }

  console.log(`✓ All ${processed} failed imports reset to pending`)
  process.exit(0)
}

// Parse arguments
const daysArg = process.argv.find((arg) => arg.startsWith('--days='))
const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : undefined

reprocessFailed(days).catch((error) => {
  console.error('[Reprocess] Error:', error)
  process.exit(1)
})
