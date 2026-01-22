#!/usr/bin/env npx tsx
/**
 * Test RSS feed before adding to system
 * Usage: npx tsx scripts/test-rss-feed.ts <rss_url>
 */

import 'dotenv/config'
import Parser from 'rss-parser'

const testFeed = async (url: string) => {
  console.log(`Testing RSS feed: ${url}\n`)

  try {
    const parser = new Parser({
      timeout: 10000,
      customFields: {
        item: [
          ['media:content', 'media'],
          ['content:encoded', 'contentEncoded'],
          ['dc:creator', 'author'],
        ],
      },
    })

    const feed = await parser.parseURL(url)

    console.log(`✓ Feed Title: ${feed.title}`)
    console.log(`✓ Feed Description: ${feed.description || 'N/A'}`)
    console.log(`✓ Feed Link: ${feed.link || 'N/A'}`)
    console.log(`✓ Items Found: ${feed.items.length}\n`)

    console.log('Latest 5 items:')
    console.log('─'.repeat(60))

    feed.items.slice(0, 5).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.title}`)
      console.log(`   URL: ${item.link}`)
      console.log(`   Date: ${item.pubDate || 'N/A'}`)
      console.log(`   Author: ${item.creator || item.author || 'N/A'}`)

      // Show content preview
      const content = item.contentSnippet || item.content || ''
      if (content) {
        console.log(`   Preview: ${content.substring(0, 100)}...`)
      }
    })

    console.log('\n' + '─'.repeat(60))
    console.log('✓ Feed is valid and can be added to the system')
  } catch (error) {
    console.error('✗ Feed test failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

const url = process.argv[2]
if (!url) {
  console.error('Usage: npx tsx scripts/test-rss-feed.ts <rss_url>')
  console.error('Example: npx tsx scripts/test-rss-feed.ts https://example.com/feed.xml')
  process.exit(1)
}

testFeed(url)
