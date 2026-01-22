#!/usr/bin/env npx tsx
/**
 * Delete old completed/failed imports
 * Usage: npx tsx scripts/cleanup-old-imports.ts --older-than=30
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const cleanup = async (days: number) => {
  console.log(`[Cleanup] Starting cleanup of imports older than ${days} days...`)

  const payload = await getPayload({ config })
  console.log('[Cleanup] Payload initialized')

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  console.log(`[Cleanup] Cutoff date: ${cutoffDate.toISOString()}`)

  const oldImports = await payload.find({
    collection: 'imported-posts' as 'posts',
    where: {
      and: [
        {
          or: [{ status: { equals: 'completed' } }, { status: { equals: 'failed' } }],
        },
        { processedAt: { less_than: cutoffDate } },
      ],
    },
    limit: 10000,
  })

  console.log(`[Cleanup] Found ${oldImports.docs.length} old imports to delete`)

  if (oldImports.docs.length === 0) {
    console.log('[Cleanup] Nothing to clean up')
    process.exit(0)
  }

  let deleted = 0
  for (const doc of oldImports.docs) {
    await payload.delete({
      collection: 'imported-posts' as 'posts',
      id: String(doc.id),
    })
    deleted++

    if (deleted % 50 === 0) {
      console.log(`[Cleanup] Deleted ${deleted}/${oldImports.docs.length}...`)
    }
  }

  console.log(`✓ Cleanup completed: ${deleted} imports deleted`)
  process.exit(0)
}

// Parse arguments
const daysArg = process.argv.find((arg) => arg.startsWith('--older-than='))
if (!daysArg) {
  console.error('Usage: npx tsx scripts/cleanup-old-imports.ts --older-than=30')
  console.error('Example: npx tsx scripts/cleanup-old-imports.ts --older-than=60')
  process.exit(1)
}

const days = parseInt(daysArg.split('=')[1], 10)
if (isNaN(days) || days < 1) {
  console.error('Error: --older-than must be a positive number of days')
  process.exit(1)
}

cleanup(days).catch((error) => {
  console.error('[Cleanup] Error:', error)
  process.exit(1)
})
