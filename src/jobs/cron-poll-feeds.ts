#!/usr/bin/env node
/**
 * RSS Feed Polling Cron Job
 *
 * Polls all active RSS feeds and queues new items for processing
 *
 * Usage: npx tsx src/jobs/cron-poll-feeds.ts
 *
 * Cron setup (crontab -e):
 * *\/30 * * * * cd /path/to/payload && npx tsx src/jobs/cron-poll-feeds.ts >> /var/log/rss-poll.log 2>&1
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RSSPoller } from '../services/RSSPoller'

const run = async () => {
  const startTime = Date.now()
  console.log(`[RSS Poll] Starting at ${new Date().toISOString()}`)

  try {
    // Check if polling is enabled
    if (process.env.RSS_POLLER_ENABLED !== 'true') {
      console.log('[RSS Poll] Polling is disabled (RSS_POLLER_ENABLED !== true)')
      process.exit(0)
    }

    // Initialize Payload
    const payload = await getPayload({ config })
    console.log('[RSS Poll] Payload initialized')

    // Run polling
    const poller = new RSSPoller(payload)
    const result = await poller.pollAllFeeds()

    // Log summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[RSS Poll] Completed in ${duration}s`)
    console.log(`[RSS Poll] Feeds checked: ${result.feedsChecked}`)
    console.log(`[RSS Poll] New items: ${result.newItemsFound}`)
    console.log(`[RSS Poll] Duplicates skipped: ${result.duplicatesSkipped}`)

    if (result.errors.length > 0) {
      console.error(`[RSS Poll] Errors: ${result.errors.length}`)
      result.errors.forEach((err) => {
        console.error(`  - ${err.feedName}: ${err.error}`)
      })
    }

    process.exit(0)
  } catch (error) {
    console.error('[RSS Poll] Fatal error:', error)
    process.exit(1)
  }
}

run()
