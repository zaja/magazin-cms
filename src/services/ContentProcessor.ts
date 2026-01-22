/**
 * Content Processor Service
 * Handles fetching, processing, and creating posts from imported RSS items
 */

import type { Payload } from 'payload'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import sharp from 'sharp'
import { ClaudeTranslator, type TranslatedArticle } from './ClaudeTranslator'
import { RateLimiter } from './RateLimiter'
import { htmlToLexical } from '../utilities/lexical-converter'
import { generateSlug, generateUniqueSlug } from '../utilities/slug-generator'

export interface ProcessResult {
  processed: number
  succeeded: number
  failed: number
  errors: Array<{ id: string; error: string }>
}

export interface ArticleContent {
  title: string
  content: string
  excerpt: string
  featuredImage: string | null
  author: string | null
}

export interface ValidationResult {
  valid: boolean
  issues: string[]
}

const LOCK_TIMEOUT_MS = parseInt(process.env.RSS_LOCK_TIMEOUT_MS || '300000', 10)
const MAX_RETRIES = 3

export class ContentProcessor {
  private payload: Payload
  private translator: ClaudeTranslator
  private rateLimiter: RateLimiter
  private processId: string

  constructor(payload: Payload) {
    this.payload = payload
    this.translator = new ClaudeTranslator()
    this.rateLimiter = new RateLimiter()
    this.processId = `proc_${process.pid}_${Date.now()}`
  }

  /**
   * Processes a batch of pending imports
   */
  async processPendingBatch(batchSize = 5): Promise<ProcessResult> {
    const result: ProcessResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    }

    console.log(`[ContentProcessor] Starting batch processing (size: ${batchSize})`)

    const lockCutoff = new Date(Date.now() - LOCK_TIMEOUT_MS)

    const pendingImports = await this.payload.find({
      collection: 'imported-posts',
      where: {
        and: [
          { status: { equals: 'pending' } },
          {
            or: [{ lockedAt: { exists: false } }, { lockedAt: { less_than: lockCutoff } }],
          },
        ],
      },
      limit: batchSize,
      sort: 'createdAt',
    })

    console.log(`[ContentProcessor] Found ${pendingImports.docs.length} pending imports`)

    for (const importDoc of pendingImports.docs) {
      const importId = String(importDoc.id)

      try {
        const locked = await this.acquireLock(importId)
        if (!locked) {
          console.log(`[ContentProcessor] Could not acquire lock for ${importId}, skipping`)
          continue
        }

        result.processed++

        console.log(`[ContentProcessor] Processing import ${importId}`)
        await this.processImportedPost(importId)

        result.succeeded++
        console.log(`[ContentProcessor] Successfully processed ${importId}`)
      } catch (error) {
        result.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push({ id: importId, error: errorMessage })
        console.error(`[ContentProcessor] Failed to process ${importId}: ${errorMessage}`)

        await this.handleProcessingError(importId, errorMessage)
      } finally {
        await this.releaseLock(importId)
      }
    }

    console.log(
      `[ContentProcessor] Batch complete: ${result.succeeded}/${result.processed} succeeded`,
    )
    return result
  }

  /**
   * Processes a single imported post
   */
  async processImportedPost(importedPostId: string): Promise<void> {
    const importRecord = (await this.payload.findByID({
      collection: 'imported-posts',
      id: importedPostId,
      depth: 1,
    })) as unknown as Record<string, unknown>

    if (!importRecord) {
      throw new Error(`Import record ${importedPostId} not found`)
    }

    const originalURL = importRecord.originalURL as string
    const metadata = (importRecord.metadata as Record<string, unknown>) || {}
    const rssFeed = importRecord.rssFeed as Record<string, unknown>

    if (!rssFeed) {
      throw new Error('RSS feed not found for import')
    }

    // Fetch article content
    const articleContent = await this.fetchArticleContent(originalURL)

    // Translate content if enabled
    let translatedData: TranslatedArticle
    const translateContent = rssFeed.translateContent !== false

    if (translateContent) {
      translatedData = await this.rateLimiter.add(() =>
        this.translator.translateArticle(articleContent.content, articleContent.title),
      )
    } else {
      translatedData = {
        title: articleContent.title,
        content: articleContent.content,
        excerpt: articleContent.excerpt,
        seo: {
          metaTitle: articleContent.title.substring(0, 60),
          metaDescription: articleContent.excerpt.substring(0, 160),
          keywords: [],
        },
        tokensUsed: 0,
      }
    }

    // Validate translated content
    const validation = await this.validateTranslatedContent(translatedData)
    if (!validation.valid) {
      throw new Error(`Content validation failed: ${validation.issues.join(', ')}`)
    }

    // Download featured image
    let featuredImageId: number | null = null
    const imageUrl = articleContent.featuredImage || (metadata.media as string)

    if (imageUrl) {
      try {
        featuredImageId = await this.downloadAndOptimizeImage(imageUrl, translatedData.title)
      } catch (error) {
        console.warn(`[ContentProcessor] Failed to download image: ${error}`)
      }
    }

    // Create Payload post
    const post = await this.createPayloadPost(translatedData, rssFeed, featuredImageId)

    // Update import record as completed
    await this.payload.update({
      collection: 'imported-posts' as 'posts',
      id: importedPostId,
      data: {
        status: 'completed',
        post: post.id,
        translationTokens: translatedData.tokensUsed,
        processedAt: new Date().toISOString(),
      } as Record<string, unknown>,
    })

    console.log(`[ContentProcessor] Created post ${post.id} from import ${importedPostId}`)
  }

  /**
   * Fetches and extracts article content from URL
   */
  async fetchArticleContent(url: string): Promise<ArticleContent> {
    console.log(`[ContentProcessor] Fetching content from ${url}`)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSSImporter/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      const dom = new JSDOM(html, { url })
      const document = dom.window.document

      const reader = new Readability(document)
      const article = reader.parse()

      if (article) {
        const ogImage =
          document.querySelector('meta[property="og:image"]')?.getAttribute('content') || null

        return {
          title: article.title,
          content: article.content,
          excerpt: article.excerpt || article.textContent?.substring(0, 300) || '',
          featuredImage: ogImage,
          author: article.byline || null,
        }
      }

      // Fallback
      const title =
        document.querySelector('h1')?.textContent ||
        document.querySelector('title')?.textContent ||
        'Untitled'

      const content =
        document.querySelector('article')?.innerHTML ||
        document.querySelector('.content')?.innerHTML ||
        document.querySelector('main')?.innerHTML ||
        '<p>Content could not be extracted.</p>'

      return {
        title,
        content,
        excerpt: title.substring(0, 300),
        featuredImage: null,
        author: null,
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Downloads and optimizes an image
   */
  async downloadAndOptimizeImage(imageUrl: string, altText?: string): Promise<number | null> {
    console.log(`[ContentProcessor] Downloading image: ${imageUrl}`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSSImporter/1.0)',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())

      const optimized = await sharp(buffer)
        .resize(1200, undefined, { withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()

      const urlPath = new URL(imageUrl).pathname
      const originalName = urlPath.split('/').pop() || 'image'
      const filename = `${generateSlug(originalName)}-${Date.now()}.jpg`

      const media = await this.payload.create({
        collection: 'media',
        data: {
          alt: altText || 'Imported image',
        },
        file: {
          data: optimized,
          mimetype: 'image/jpeg',
          name: filename,
          size: optimized.length,
        },
      })

      console.log(`[ContentProcessor] Uploaded image as media ${media.id}`)
      return media.id as number
    } catch (error) {
      console.error(`[ContentProcessor] Image download failed:`, error)
      return null
    }
  }

  /**
   * Validates translated content
   */
  async validateTranslatedContent(data: TranslatedArticle): Promise<ValidationResult> {
    const issues: string[] = []

    if (!data.title || data.title.length < 5) {
      issues.push('Title too short')
    }

    if (!data.content || data.content.length < 100) {
      issues.push('Content too short (min 100 characters)')
    }

    if (!data.excerpt || data.excerpt.length < 20) {
      issues.push('Excerpt too short')
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }

  /**
   * Creates a Payload post from translated data
   */
  private async createPayloadPost(
    translatedData: TranslatedArticle,
    feed: Record<string, unknown>,
    featuredImageId: number | null,
  ): Promise<{ id: number | string }> {
    const lexicalContent = htmlToLexical(translatedData.content)

    // Debug: Log the full Lexical structure
    console.log('[ContentProcessor] HTML content length:', translatedData.content.length)
    console.log('[ContentProcessor] Lexical structure:', JSON.stringify(lexicalContent, null, 2))

    const baseSlug = generateSlug(translatedData.title)
    const existingSlugs = await this.getExistingSlugs()
    const slug = generateUniqueSlug(baseSlug, existingSlugs)

    const autoPublish = (feed.autoPublish as string) || 'draft'
    let publishedAt: string | null = null
    let _status: 'draft' | 'published' = 'draft'

    if (autoPublish === 'published') {
      _status = 'published'
      publishedAt = new Date().toISOString()
    } else if (autoPublish === 'scheduled') {
      _status = 'draft'
      const hoursFromNow = Math.floor(Math.random() * 47) + 1
      publishedAt = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString()
    }

    const postData: Record<string, unknown> = {
      title: translatedData.title,
      slug,
      excerpt: translatedData.excerpt.substring(0, 300),
      content: lexicalContent,
      _status,
      publishedAt,
      meta: {
        title: translatedData.seo.metaTitle || translatedData.title.substring(0, 60),
        description: translatedData.seo.metaDescription,
      },
    }

    if (featuredImageId) {
      postData.heroImage = featuredImageId
      postData.meta = {
        ...(postData.meta as object),
        image: featuredImageId,
      }
    }

    if (feed.category) {
      postData.categories = [
        typeof feed.category === 'object' ? (feed.category as { id: number }).id : feed.category,
      ]
    }

    if (feed.tags && Array.isArray(feed.tags)) {
      postData.tags = (feed.tags as Array<{ id: number } | number>).map((tag) =>
        typeof tag === 'object' ? tag.id : tag,
      )
    }

    const post = await this.payload.create({
      collection: 'posts',
      data: postData as any,
      locale: 'hr',
    })

    return { id: post.id }
  }

  /**
   * Gets existing post slugs
   */
  private async getExistingSlugs(): Promise<string[]> {
    const posts = await this.payload.find({
      collection: 'posts',
      limit: 1000,
      depth: 0,
    })

    return posts.docs.map((p) => p.slug).filter((s): s is string => !!s)
  }

  /**
   * Acquires a processing lock
   */
  private async acquireLock(importedPostId: string): Promise<boolean> {
    try {
      const lockCutoff = new Date(Date.now() - LOCK_TIMEOUT_MS)

      const current = (await this.payload.findByID({
        collection: 'imported-posts',
        id: importedPostId,
      })) as unknown as Record<string, unknown>

      const lockedAt = current.lockedAt ? new Date(current.lockedAt as string) : null

      if (lockedAt && lockedAt > lockCutoff && current.lockedBy !== this.processId) {
        return false
      }

      await this.payload.update({
        collection: 'imported-posts',
        id: importedPostId,
        data: {
          lockedAt: new Date().toISOString(),
          lockedBy: this.processId,
        },
      })

      return true
    } catch (error) {
      console.error(`[ContentProcessor] Failed to acquire lock:`, error)
      return false
    }
  }

  /**
   * Releases a processing lock
   */
  private async releaseLock(importedPostId: string): Promise<void> {
    try {
      await this.payload.update({
        collection: 'imported-posts',
        id: importedPostId,
        data: {
          lockedAt: null,
          lockedBy: null,
        },
      })
    } catch (error) {
      console.error(`[ContentProcessor] Failed to release lock:`, error)
    }
  }

  /**
   * Handles processing errors
   */
  private async handleProcessingError(importedPostId: string, errorMessage: string): Promise<void> {
    const importRecord = (await this.payload.findByID({
      collection: 'imported-posts',
      id: importedPostId,
    })) as unknown as Record<string, unknown>

    const retryCount = ((importRecord.retryCount as number) || 0) + 1
    const status = retryCount >= MAX_RETRIES ? 'failed' : 'pending'

    await this.payload.update({
      collection: 'imported-posts',
      id: importedPostId,
      data: {
        status,
        retryCount,
        errorMessage,
        processedAt: new Date().toISOString(),
      },
    })
  }
}
