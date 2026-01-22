#!/usr/bin/env node
/**
 * Import Processing Cron Job
 *
 * Processes pending imported posts (translation + post creation)
 *
 * Usage: npx tsx src/jobs/cron-process-imports.ts
 *
 * Cron setup (crontab -e):
 * *\/5 * * * * cd /path/to/payload && npx tsx src/jobs/cron-process-imports.ts >> /var/log/rss-process.log 2>&1
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ContentProcessor } from '../services/ContentProcessor'

const run = async () => {
  const startTime = Date.now()
  console.log(`[Process Imports] Starting at ${new Date().toISOString()}`)

  try {
    // Check if polling is enabled
    if (process.env.RSS_POLLER_ENABLED !== 'true') {
      console.log('[Process Imports] Processing is disabled (RSS_POLLER_ENABLED !== true)')
      process.exit(0)
    }

    // Check if Claude API key is configured
    if (!process.env.CLAUDE_API_KEY) {
      console.error('[Process Imports] CLAUDE_API_KEY is not configured')
      process.exit(1)
    }

    // Initialize Payload
    const payload = await getPayload({ config })
    console.log('[Process Imports] Payload initialized')

    // Process batch
    const processor = new ContentProcessor(payload)
    const batchSize = parseInt(process.env.RSS_BATCH_SIZE || '5', 10)
    const result = await processor.processPendingBatch(batchSize)

    // Log summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[Process Imports] Completed in ${duration}s`)
    console.log(`[Process Imports] Processed: ${result.processed}`)
    console.log(`[Process Imports] Succeeded: ${result.succeeded}`)
    console.log(`[Process Imports] Failed: ${result.failed}`)

    if (result.errors.length > 0) {
      console.error(`[Process Imports] Errors:`)
      result.errors.forEach((err) => {
        console.error(`  - ${err.id}: ${err.error}`)
      })
    }

    process.exit(0)
  } catch (error) {
    console.error('[Process Imports] Fatal error:', error)
    process.exit(1)
  }
}

run()
