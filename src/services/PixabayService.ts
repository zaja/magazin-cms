/**
 * Pixabay Image Service
 * Fetches royalty-free images from Pixabay API based on keywords
 */

import type { Payload } from 'payload'
import { generateSlug } from '../utilities/slug-generator'

interface PixabayImage {
  id: number
  webformatURL: string
  largeImageURL: string
  tags: string
  user: string
  userImageURL: string
  imageWidth: number
  imageHeight: number
}

interface PixabayResponse {
  total: number
  totalHits: number
  hits: PixabayImage[]
}

export class PixabayService {
  private apiKey: string
  private payload: Payload

  constructor(payload: Payload) {
    const apiKey = process.env.PIXABAY_API_KEY
    if (!apiKey) {
      throw new Error('PIXABAY_API_KEY environment variable is not set')
    }
    this.apiKey = apiKey
    this.payload = payload
  }

  /**
   * Search for a relevant image based on keywords, with fallback to fewer terms
   */
  async searchImage(query: string): Promise<PixabayImage | null> {
    try {
      const words = query
        .replace(/[^a-zA-ZčćžšđČĆŽŠĐ\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)

      if (words.length === 0) return null

      // Try progressively fewer keywords: all → first 3 → first 2 → first 1
      const attempts = [
        words.slice(0, 4),
        words.slice(0, 3),
        words.slice(0, 2),
        words.slice(0, 1),
      ].filter((a, i, arr) => {
        const key = a.join('+')
        return i === arr.findIndex((b) => b.join('+') === key)
      })

      for (const attempt of attempts) {
        const searchQuery = attempt.join('+')
        const result = await this.searchPixabay(searchQuery)
        if (result) return result
        console.log(`[Pixabay] No results for "${searchQuery}", trying fewer keywords...`)
      }

      console.log(`[Pixabay] No images found after all fallback attempts for: ${query}`)
      return null
    } catch (error) {
      console.error('[Pixabay] Search failed:', error)
      return null
    }
  }

  /**
   * Execute a single Pixabay API search
   */
  private async searchPixabay(query: string): Promise<PixabayImage | null> {
    const url = `https://pixabay.com/api/?key=${this.apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=1200&per_page=5&safesearch=true&lang=en`

    const response = await fetch(url, {
      headers: { 'User-Agent': 'MagazinCMS/1.0' },
    })

    if (!response.ok) {
      console.error(`[Pixabay] API error: ${response.status}`)
      return null
    }

    const data = (await response.json()) as PixabayResponse

    if (data.hits.length === 0) return null

    console.log(`[Pixabay] Found ${data.hits.length} images for: ${query}`)
    return data.hits[0]
  }

  /**
   * Search and download image, upload to Payload media collection
   * Returns the media ID or null
   */
  async fetchAndUploadImage(keywords: string, altText: string): Promise<number | null> {
    const image = await this.searchImage(keywords)
    if (!image) return null

    try {
      console.log(`[Pixabay] Downloading image ${image.id}: ${image.tags}`)

      const response = await fetch(image.largeImageURL, {
        headers: { 'User-Agent': 'MagazinCMS/1.0' },
      })

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`)
      }

      const buffer = Buffer.from(await response.arrayBuffer())

      // Optimize with sharp
      const sharp = (await import('sharp')).default
      const optimized = await sharp(buffer)
        .resize(1200, undefined, { withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()

      const filename = `${generateSlug(altText.substring(0, 40))}-${Date.now()}.jpg`

      const media = await this.payload.create({
        collection: 'media',
        data: {
          alt: `${altText} (Foto: ${image.user}/Pixabay)`,
        },
        file: {
          data: optimized,
          mimetype: 'image/jpeg',
          name: filename,
          size: optimized.length,
        },
      })

      console.log(`[Pixabay] Uploaded image as media ${media.id}`)
      return media.id as number
    } catch (error) {
      console.error('[Pixabay] Download/upload failed:', error)
      return null
    }
  }
}
