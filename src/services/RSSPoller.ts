/**
 * RSS Feed Polling Service
 * Fetches RSS feeds and queues new items for processing
 */

import type { Payload } from 'payload'
import Parser from 'rss-parser'

interface RSSItem {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  contentEncoded?: string
  contentSnippet?: string
  author?: string
  creator?: string
  categories?: string[]
  guid?: string
  media?: string
  mediaThumbnail?: string
}

export interface PollResult {
  feedsChecked: number
  newItemsFound: number
  duplicatesSkipped: number
  errors: Array<{ feedId: string; feedName: string; error: string }>
  timestamp: Date
}

export interface FeedPollResult {
  feedId: string
  feedName: string
  itemsFound: number
  newItems: number
  duplicates: number
}

type CustomParser = Parser<Record<string, unknown>, RSSItem>

export class RSSPoller {
  private payload: Payload
  private parser: CustomParser

  constructor(payload: Payload) {
    this.payload = payload

    // Initialize parser with custom fields
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'media', { keepArray: false }],
          ['content:encoded', 'contentEncoded'],
          ['dc:creator', 'creator'],
          ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
        ],
      },
      timeout: 10000,
    })
  }

  /**
   * Polls all active feeds that are due for checking
   *
   * @returns Summary of polling results
   */
  async pollAllFeeds(): Promise<PollResult> {
    const result: PollResult = {
      feedsChecked: 0,
      newItemsFound: 0,
      duplicatesSkipped: 0,
      errors: [],
      timestamp: new Date(),
    }

    console.log('[RSSPoller] Starting to poll all active feeds')

    // Fetch active feeds
    const feeds = await this.payload.find({
      collection: 'rss-feeds' as 'posts',
      where: {
        active: { equals: true },
      },
      sort: 'lastChecked',
      limit: 100,
    })

    console.log(`[RSSPoller] Found ${feeds.docs.length} active feeds`)

    for (const feed of feeds.docs) {
      const feedId = String(feed.id)
      const feedRecord = feed as unknown as Record<string, unknown>
      const feedName = (feedRecord.name as string) || 'Unknown'
      const checkInterval = (feedRecord.checkInterval as number) || 60
      const lastChecked = feedRecord.lastChecked ? new Date(feedRecord.lastChecked as string) : null

      // Check if feed is due for polling
      if (lastChecked) {
        const nextCheck = new Date(lastChecked.getTime() + checkInterval * 60 * 1000)
        if (nextCheck > new Date()) {
          console.log(`[RSSPoller] Skipping ${feedName} - not due yet`)
          continue
        }
      }

      try {
        console.log(`[RSSPoller] Polling feed: ${feedName}`)
        const feedResult = await this.pollFeed(feedId)

        result.feedsChecked++
        result.newItemsFound += feedResult.newItems
        result.duplicatesSkipped += feedResult.duplicates

        console.log(
          `[RSSPoller] ${feedName}: ${feedResult.newItems} new, ${feedResult.duplicates} duplicates`,
        )

        // Delay between feeds to be nice to servers
        await this.sleep(2000 + Math.random() * 1000)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        result.errors.push({ feedId, feedName, error: errorMessage })
        console.error(`[RSSPoller] Error polling ${feedName}:`, errorMessage)
      }
    }

    console.log(
      `[RSSPoller] Polling complete: ${result.feedsChecked} feeds, ${result.newItemsFound} new items`,
    )
    return result
  }

  /**
   * Polls a single feed by ID
   *
   * @param feedId - ID of the feed to poll
   * @returns Polling results for this feed
   */
  async pollFeed(feedId: string): Promise<FeedPollResult> {
    const feedDoc = await this.payload.findByID({
      collection: 'rss-feeds' as 'posts',
      id: feedId,
    })

    const feed = feedDoc as unknown as Record<string, unknown>
    const feedName = (feed.name as string) || 'Unknown'
    const feedUrl = feed.url as string
    const maxItems = (feed.maxItemsPerCheck as number) || 5

    if (!feedUrl) {
      throw new Error('Feed URL is missing')
    }

    const result: FeedPollResult = {
      feedId,
      feedName,
      itemsFound: 0,
      newItems: 0,
      duplicates: 0,
    }

    try {
      // Parse RSS feed
      const rssFeed = await this.parser.parseURL(feedUrl)
      result.itemsFound = rssFeed.items.length

      // Process top N items
      const itemsToProcess = rssFeed.items.slice(0, maxItems)

      for (const item of itemsToProcess) {
        if (!item.link || !item.title) {
          console.log('[RSSPoller] Skipping item without link or title')
          continue
        }

        const isDupe = await this.isDuplicate(item, feedId)

        if (isDupe) {
          result.duplicates++
        } else {
          await this.queueItemForProcessing(item, feed)
          result.newItems++
        }
      }

      // Update feed's lastChecked and itemsProcessed
      const currentItemsProcessed = (feed.itemsProcessed as number) || 0
      await this.payload.update({
        collection: 'rss-feeds' as 'posts',
        id: feedId,
        data: {
          lastChecked: new Date().toISOString(),
          itemsProcessed: currentItemsProcessed + result.newItems,
        } as Record<string, unknown>,
      })
    } catch (error) {
      // Re-throw with more context
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to parse feed ${feedUrl}: ${message}`)
    }

    return result
  }

  /**
   * Checks if an RSS item has already been imported
   *
   * @param item - RSS item to check
   * @param feedId - ID of the source feed
   * @returns true if duplicate
   */
  private async isDuplicate(item: RSSItem, feedId: string): Promise<boolean> {
    if (!item.link) return false

    const normalizedUrl = this.normalizeUrl(item.link)

    // Check by URL
    const byUrl = await this.payload.find({
      collection: 'imported-posts' as 'posts',
      where: {
        originalURL: { equals: normalizedUrl },
      },
      limit: 1,
    })

    if (byUrl.docs.length > 0) {
      return true
    }

    // Check by title + feed combination
    if (item.title) {
      const byTitle = await this.payload.find({
        collection: 'imported-posts' as 'posts',
        where: {
          and: [{ originalTitle: { equals: item.title } }, { rssFeed: { equals: feedId } }],
        },
        limit: 1,
      })

      if (byTitle.docs.length > 0) {
        return true
      }
    }

    return false
  }

  /**
   * Normalizes a URL by removing tracking parameters, www, hash, and trailing slash
   *
   * @param url - URL to normalize
   * @returns Normalized URL
   */
  normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url)

      // Remove tracking parameters
      const trackingParams = [
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'ref',
        'source',
        'fbclid',
        'gclid',
        'mc_cid',
        'mc_eid',
      ]
      trackingParams.forEach((param) => parsed.searchParams.delete(param))

      // Remove hash
      parsed.hash = ''

      // Remove www
      parsed.hostname = parsed.hostname.replace(/^www\./, '')

      // Get normalized URL
      let normalized = parsed.toString()

      // Remove trailing slash
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1)
      }

      return normalized
    } catch {
      // Return original if parsing fails
      return url
    }
  }

  /**
   * Queues an RSS item for processing by creating an imported-posts record
   *
   * @param item - RSS item to queue
   * @param feed - Source feed data
   */
  private async queueItemForProcessing(
    item: RSSItem,
    feed: Record<string, unknown>,
  ): Promise<void> {
    const normalizedUrl = this.normalizeUrl(item.link!)

    const metadata = {
      rawContent: item.content || item.contentEncoded || item.contentSnippet || '',
      author: item.author || item.creator || null,
      categories: item.categories || [],
      pubDate: item.pubDate || null,
      media: this.extractMediaUrl(item),
      guid: item.guid || null,
    }

    await this.payload.create({
      collection: 'imported-posts',
      data: {
        originalURL: normalizedUrl,
        originalTitle: item.title || 'Untitled',
        rssFeed: feed.id as number,
        status: 'pending',
        retryCount: 0,
        metadata,
      },
    })

    console.log(`[RSSPoller] Queued: ${item.title}`)
  }

  /**
   * Extracts media URL from RSS item
   */
  private extractMediaUrl(item: RSSItem): string | null {
    // Check various media fields
    if (item.media) {
      if (typeof item.media === 'string') {
        return item.media
      }
      if (typeof item.media === 'object') {
        const mediaObj = item.media as Record<string, Record<string, string>>
        if (mediaObj['$']?.url) {
          return mediaObj['$'].url
        }
      }
    }

    if (item.mediaThumbnail) {
      if (typeof item.mediaThumbnail === 'string') {
        return item.mediaThumbnail
      }
      if (typeof item.mediaThumbnail === 'object') {
        const thumb = item.mediaThumbnail as Record<string, Record<string, string>>
        if (thumb['$']?.url) {
          return thumb['$'].url
        }
      }
    }

    return null
  }

  /**
   * Helper to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
