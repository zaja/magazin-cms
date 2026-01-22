/**
 * Claude AI Translation Service
 * Handles article translation and SEO metadata generation
 */

import Anthropic from '@anthropic-ai/sdk'

export interface TranslatedArticle {
  title: string
  content: string
  excerpt: string
  seo: SEOMetadata
  tokensUsed: number
}

export interface SEOMetadata {
  metaTitle: string
  metaDescription: string
  keywords: string[]
}

interface ClaudeResponse {
  title: string
  content: string
  excerpt: string
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
}

export class ClaudeTranslator {
  private client: Anthropic
  private maxRetries = 3
  private model = 'claude-sonnet-4-20250514'

  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY

    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is not set')
    }

    this.client = new Anthropic({
      apiKey,
    })
  }

  /**
   * Translates an article from English to Croatian with SEO optimization
   *
   * @param originalContent - Original article HTML content
   * @param originalTitle - Original article title
   * @returns Translated article with SEO metadata
   */
  async translateArticle(
    originalContent: string,
    originalTitle: string,
  ): Promise<TranslatedArticle> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`[ClaudeTranslator] Translation attempt ${attempt}/${this.maxRetries}`)

        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: this.buildTranslationPrompt(originalContent, originalTitle),
            },
          ],
        })

        const textContent = response.content.find((c) => c.type === 'text')
        if (!textContent || textContent.type !== 'text') {
          throw new Error('No text content in Claude response')
        }

        const parsed = this.parseClaudeResponse(textContent.text)
        this.validateTranslation(parsed)

        const tokensUsed =
          (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)

        console.log(`[ClaudeTranslator] Translation successful, tokens used: ${tokensUsed}`)

        return {
          title: parsed.title,
          content: parsed.content,
          excerpt: parsed.excerpt,
          seo: parsed.seo,
          tokensUsed,
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`[ClaudeTranslator] Attempt ${attempt} failed:`, lastError.message)

        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 2s, 4s, 8s
          console.log(`[ClaudeTranslator] Retrying in ${delay / 1000}s...`)
          await this.sleep(delay)
        }
      }
    }

    throw new Error(`Translation failed after ${this.maxRetries} attempts: ${lastError?.message}`)
  }

  /**
   * Generates SEO metadata for existing content
   *
   * @param content - Article content
   * @param title - Article title
   * @returns SEO metadata
   */
  async generateSEOMetadata(content: string, title: string): Promise<SEOMetadata> {
    const prompt = `Ti si SEO ekspert za hrvatski jezik.

NASLOV: ${title}

SADRŽAJ (prvih 1000 znakova):
${content.substring(0, 1000)}

Generiraj SEO metapodatke za ovaj članak.

PRAVILA:
- Meta naslov: max 60 znakova, mora sadržavati glavnu ključnu riječ
- Meta opis: 150-160 znakova, informativan i klikabilan
- Ključne riječi: 5-10 relevantnih ključnih riječi za hrvatski market

IZLAZNI FORMAT - striktno JSON:
{
  "metaTitle": "SEO naslov",
  "metaDescription": "SEO opis",
  "keywords": ["ključna riječ 1", "ključna riječ 2"]
}

VAŽNO: Odgovori SAMO sa JSON objektom, bez dodatnog teksta.`

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response')
    }

    const parsed = this.parseJSON<SEOMetadata>(textContent.text)

    return {
      metaTitle: parsed.metaTitle?.substring(0, 60) || title.substring(0, 60),
      metaDescription: parsed.metaDescription?.substring(0, 160) || '',
      keywords: parsed.keywords || [],
    }
  }

  /**
   * Builds the translation prompt for Claude
   * Creates a condensed summary instead of full translation
   */
  private buildTranslationPrompt(content: string, title: string): string {
    // Truncate content if too long (leave room for response)
    const maxContentLength = 8000
    const truncatedContent =
      content.length > maxContentLength ? content.substring(0, maxContentLength) + '...' : content

    return `Ti si novinar i urednik za hrvatski tech/news portal.

ZADATAK: Napiši KRATAK članak na hrvatskom temeljen na ovom izvornom članku. NE prevodi doslovno - sažmi i prepiši ključne informacije.

ORIGINALNI NASLOV: ${title}

ORIGINALNI SADRŽAJ:
${truncatedContent}

PRAVILA PISANJA:
1. SAŽMI sadržaj na 3-5 paragrafa (150-400 riječi ukupno)
2. Izvuci samo KLJUČNE informacije i činjenice
3. Piši u informativnom, novinarskom stilu
4. Koristi prirodni hrvatski jezik
5. NE kopiraj strukturu originala - napiši kao novi članak
6. HTML format: koristi <p> za paragrafe, <strong> za naglašavanje
7. Ako ima direktnih citata, prenesi najvažnije (1-2 max)

STRUKTURA ČLANKA:
- Uvodni paragraf: tko, što, kada, gdje (najvažnije odmah)
- Srednji dio: kontekst i detalji
- Zaključak: implikacije ili budući razvoj

SEO PRAVILA:
1. Meta naslov: max 60 znakova, privlačan za klik
2. Meta opis: 150-160 znakova, informativan
3. Keywords: 5-8 ključnih riječi za hrvatski market
4. Excerpt: 150-200 znakova

IZLAZNI FORMAT - striktno JSON:
{
  "title": "privlačan naslov na hrvatskom",
  "content": "<p>Paragraf 1...</p><p>Paragraf 2...</p>",
  "excerpt": "kratki sažetak (150-200 znakova)",
  "seo": {
    "metaTitle": "SEO naslov (max 60 znakova)",
    "metaDescription": "SEO opis (150-160 znakova)",
    "keywords": ["ključna riječ 1", "ključna riječ 2"]
  }
}

VAŽNO: Odgovori SAMO sa JSON objektom. Članak mora biti KRATAK i INFORMATIVAN.`
  }

  /**
   * Parses Claude response, handling potential JSON code block wrapper
   */
  private parseClaudeResponse(text: string): ClaudeResponse {
    return this.parseJSON<ClaudeResponse>(text)
  }

  /**
   * Parses JSON from text, handling code block wrappers
   */
  private parseJSON<T>(text: string): T {
    let jsonStr = text.trim()

    // Remove markdown code block if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7)
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3)
    }

    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3)
    }

    jsonStr = jsonStr.trim()

    try {
      return JSON.parse(jsonStr) as T
    } catch (error) {
      console.error('[ClaudeTranslator] Failed to parse JSON:', jsonStr.substring(0, 200))
      throw new Error(`Invalid JSON response from Claude: ${error}`)
    }
  }

  /**
   * Validates translated content structure
   */
  private validateTranslation(data: ClaudeResponse): void {
    const errors: string[] = []

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Missing or empty title')
    }

    if (!data.content || data.content.trim().length < 50) {
      errors.push('Content too short (min 50 characters)')
    }

    if (!data.excerpt || data.excerpt.trim().length < 30) {
      errors.push('Excerpt too short (min 30 characters)')
    }

    if (!data.seo) {
      errors.push('Missing SEO metadata')
    } else {
      if (!data.seo.metaTitle) {
        errors.push('Missing SEO meta title')
      }
      if (!data.seo.metaDescription) {
        errors.push('Missing SEO meta description')
      }
      if (!Array.isArray(data.seo.keywords) || data.seo.keywords.length === 0) {
        errors.push('Missing or empty keywords array')
      }
    }

    if (errors.length > 0) {
      throw new Error(`Translation validation failed: ${errors.join(', ')}`)
    }
  }

  /**
   * Helper function to sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Tests if the Claude API is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }],
      })
      return true
    } catch {
      return false
    }
  }
}
