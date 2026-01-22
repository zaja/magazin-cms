Claude Code Prompts za RSS Auto-Poster (Vanjski Cron Version)
🎯 Prompt 1: Setup Collections & Base Architecture
Kreiraj RSS Auto-Poster sistem za Payload CMS sa sljedećim zahtjevima:

## CONTEXT
- Payload CMS koristi Lexical rich text editor
- Cilj: automatski import članaka iz RSS feedova, prijevod na hrvatski kroz Claude API, i kreiranje draft postova
- Job scheduling: VANJSKI CRON (ne BullMQ, ne Payload jobs) - sistem mora biti stateless

## ZADATAK 1: Kreiraj Collections

### 1. RSS Feeds Collection (`src/collections/RSSFeeds.ts`)
Polja:
- name (text, required) - naziv feeda
- url (text, required, unique) - RSS feed URL
- active (checkbox, default: true)
- category (relationship → categories, optional)
- tags (relationship → tags, hasMany)
- checkInterval (number, default: 60) - interval u minutama
- lastChecked (date, readOnly)
- itemsProcessed (number, default: 0, readOnly)
- translateContent (checkbox, default: true)
- generateSEO (checkbox, default: true)
- autoPublish (select: draft/scheduled/published, default: draft)
- maxItemsPerCheck (number, default: 5)

Dodaj custom endpoints:
- POST /api/rss-feeds/test-feed - testira RSS feed prije dodavanja
- POST /api/rss-feeds/trigger-poll/:id - manual trigger polling za specific feed

### 2. Imported Posts Collection (`src/collections/ImportedPosts.ts`)
Polja:
- originalURL (text, required, unique)
- originalTitle (text, required)
- rssFeed (relationship → rss-feeds, required)
- post (relationship → posts, optional)
- status (select: pending/processing/completed/failed, default: pending)
- errorMessage (textarea, visible samo ako status === failed)
- translationTokens (number)
- processedAt (date)
- retryCount (number, default: 0)
- metadata (json) - za storing original article data
- lockedAt (date, optional) - za preventing concurrent processing
- lockedBy (text, optional) - process identifier

Admin config:
- Group: "Automation"
- useAsTitle: originalTitle
- Dodaj admin components za preview i retry funkcionalnost

## ZADATAK 2: Install Dependencies

Dodaj u package.json:
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "rss-parser": "^3.13.0",
    "@mozilla/readability": "^0.5.0",
    "jsdom": "^25.0.0",
    "turndown": "^7.2.0",
    "sharp": "^0.33.0",
    "@lexical/html": "^0.12.0",
    "lexical": "^0.12.0",
    "@sentry/node": "^7.100.0"
  },
  "devDependencies": {
    "@types/jsdom": "^21.1.0",
    "@types/turndown": "^5.0.0"
  }
}
```

## ZADATAK 3: Environment Variables

Kreiraj/ažuriraj `.env`:
CLAUDE_API_KEY=your_key_here
SENTRY_DSN=your_sentry_dsn
RSS_POLLER_ENABLED=true
RSS_MAX_CONCURRENT=2
RSS_RATE_LIMIT_DELAY_MS=3000
RSS_LOCK_TIMEOUT_MS=300000

## ZADATAK 4: Utility Functions

Kreiraj `src/utilities/lexical-converter.ts`:
- htmlToLexical(html: string) - konvertuje HTML u Lexical JSON format
- lexicalToHTML(lexicalJSON: any) - reverse conversion
Koristi @lexical/html pakete za konverziju

Kreiraj `src/utilities/slug-generator.ts`:
- generateSlug(title: string) - generiše URL-safe slug sa podrškom za hrvatska slova (đ, č, ć, š, ž)

## ZADATAK 5: Cron Entry Points

Kreiraj `src/jobs/cron-poll-feeds.ts`:
```typescript
/**
 * Entry point za vanjski cron job za polling RSS feedova
 * Usage: node dist/jobs/cron-poll-feeds.js
 * 
 * Cron setup (crontab):
 * */30 * * * * cd /path/to/app && node dist/jobs/cron-poll-feeds.js >> /var/log/rss-poll.log 2>&1
 */

import payload from 'payload';
import { RSSPoller } from '../services/RSSPoller';

const run = async () => {
  // Initialize Payload (bez Express servera)
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    local: true, // VAŽNO: local mode za cron jobs
  });
  
  const poller = new RSSPoller(payload);
  await poller.pollAllFeeds();
  
  process.exit(0);
};

run().catch((error) => {
  console.error('Cron job failed:', error);
  process.exit(1);
});
```

Kreiraj `src/jobs/cron-process-imports.ts`:
```typescript
/**
 * Entry point za vanjski cron job za procesiranje imported posts
 * Usage: node dist/jobs/cron-process-imports.js
 * 
 * Cron setup (crontab):
 * */5 * * * * cd /path/to/app && node dist/jobs/cron-process-imports.js >> /var/log/rss-process.log 2>&1
 */

import payload from 'payload';
import { ContentProcessor } from '../services/ContentProcessor';

const run = async () => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    local: true,
  });
  
  const processor = new ContentProcessor(payload);
  await processor.processPendingBatch();
  
  process.exit(0);
};

run().catch((error) => {
  console.error('Cron job failed:', error);
  process.exit(1);
});
```

## IMPLEMENTATION NOTES:
- Koristi TypeScript
- Svi errori moraju biti properly handled
- Loguj sve operacije za debugging
- Collections moraju biti eksportovane u payload.config.ts
- Dodaj JSDoc komentare za sve funkcije
- Cron jobs moraju biti standalone executable scripts
- **KRITIČNO**: Payload.init({ local: true }) za cron jobs

Implementiraj ove fajlove sa kompletnim, production-ready kodom.

🎯 Prompt 2: Core Services Implementation
Implementiraj core services za RSS Auto-Poster sistem:

## CONTEXT
- Već postoje Collections: rss-feeds, imported-posts
- Payload CMS koristi Lexical editor
- Instaliran @anthropic-ai/sdk, rss-parser, @mozilla/readability, sharp
- Job scheduling: VANJSKI CRON - services moraju biti stateless i handle concurrent execution

## ZADATAK 1: Claude Translation Service

Kreiraj `src/services/ClaudeTranslator.ts`:
```typescript
export class ClaudeTranslator {
  private client: Anthropic;
  private maxRetries = 3;
  
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }
  
  async translateArticle(
    originalContent: string, 
    originalTitle: string
  ): Promise<TranslatedArticle>
  
  async generateSEOMetadata(
    content: string, 
    title: string
  ): Promise<SEOMetadata>
}

interface TranslatedArticle {
  title: string;
  content: string; // HTML format
  excerpt: string;
  seo: SEOMetadata;
  tokensUsed: number;
}

interface SEOMetadata {
  metaTitle: string; // max 60 chars
  metaDescription: string; // max 160 chars
  keywords: string[];
}
```

REQUIREMENTS za translateArticle():
- Koristi model: claude-sonnet-4-20250514
- Temperature: 0.3 za konzistentan output
- Max tokens: 4096
- Implementiraj retry logic sa exponential backoff
- Prompt mora biti specifičan za hrvatski jezik i SEO optimizaciju
- Validacija output-a (provjeri da su svi fields prisutni)
- Striktno parsiranje JSON response-a (handle ```json``` wrapper)
- Error handling sa detaljnim error messages

Prompt struktura:
- Jasno definiraj task (prijevod + SEO optimizacija)
- Daj specifična pravila za hrvatski jezik
- Zahtjevaj striktni JSON output
- Uključi pravila za HTML strukture preserve
- Uključi SEO best practices (meta length limits)

Primjer Claude prompta:
Ti si ekspert za SEO optimizaciju i prijevod sa engleskog na hrvatski jezik.
ZADATAK: Prevedi članak i optimiziraj ga za hrvatske search engine-e.
ORIGINALNI NASLOV: ${originalTitle}
ORIGINALNI SADRŽAJ:
${originalContent.substring(0, 3000)}
PRAVILA PRIJEVODA:

Jezik: prirodni hrvatski, NE doslovan prijevod
Ton: zadrži profesionalan ali pristupačan ton
Struktura: očuvaj HTML tagove (<p>, <h2>, <ul>, <li>, <strong>, <em>)
Idiomi: prilagodi hrvatske idiome i izraze
Linkovi: zadrži sve <a> tagove sa originalnim href

SEO PRAVILA:

Meta naslov: max 60 znakova, mora sadržavati glavnu ključnu riječ
Meta opis: 150-160 znakova, mora biti klikabilan i informativan
Keywords: 5-10 ključnih riječi, specifične za hrvatski market
Excerpt: 200-300 znakova, sažetak koji privlači čitanje

IZLAZNI FORMAT - striktno JSON:
{
"title": "naslov članka na hrvatskom",
"content": "<p>HTML formatirani sadržaj...</p>",
"excerpt": "sažetak članka",
"seo": {
"metaTitle": "SEO naslov",
"metaDescription": "SEO opis",
"keywords": ["ključna riječ 1", "ključna riječ 2"]
}
}
VAŽNO: Odgovori SAMO sa JSON objektom, bez dodatnog teksta.

## ZADATAK 2: Content Processor Service

Kreiraj `src/services/ContentProcessor.ts`:
```typescript
export class ContentProcessor {
  private payload: Payload;
  private translator: ClaudeTranslator;
  private rateLimiter: RateLimiter;
  
  constructor(payload: Payload)
  
  /**
   * Process batch of pending imports (for cron job)
   * Handles locking to prevent concurrent processing
   */
  async processPendingBatch(batchSize: number = 5): Promise<ProcessResult>
  
  async processImportedPost(importedPostId: string): Promise<void>
  
  async fetchArticleContent(url: string): Promise<ArticleContent>
  
  async downloadAndOptimizeImage(
    imageUrl: string, 
    altText?: string
  ): Promise<string | null> // returns media ID
  
  async validateTranslatedContent(
    data: TranslatedArticle
  ): Promise<ValidationResult>
  
  private async acquireLock(importedPostId: string): Promise<boolean>
  
  private async releaseLock(importedPostId: string): Promise<void>
  
  private async createPayloadPost(
    translatedData: TranslatedArticle,
    feed: any,
    featuredImageId?: string
  ): Promise<any>
}

interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{id: string, error: string}>;
}
```

REQUIREMENTS:

1. **processPendingBatch()**:
   - Fetch pending imported-posts (limit = batchSize)
   - Exclude locked items (gdje je lockedAt < 5min ago)
   - Za svaki item:
     * Try acquireLock()
     * If locked successfully → processImportedPost()
     * Always releaseLock() u finally block
   - Return summary statistics
   - Handle rate limiting (RSS_MAX_CONCURRENT, RSS_RATE_LIMIT_DELAY_MS)

2. **acquireLock()**:
   - Atomic update: set lockedAt = now(), lockedBy = process.pid
   - Only if: lockedAt is null OR lockedAt < (now - LOCK_TIMEOUT)
   - Return true ako je lock acquired
   - Ovo sprečava da dva cron job instance procesiraju isti post

3. **releaseLock()**:
   - Set lockedAt = null, lockedBy = null
   - Samo ako lockedBy === current process

4. **fetchArticleContent()**:
   - Koristi @mozilla/readability za content extraction
   - Fallback na basic DOM parsing ako Readability failed
   - Extract featured image iz og:image meta tag
   - Handle različite URL formate i redirects
   - 10s timeout za fetch
   - Error handling za 404, 500, network errors

5. **downloadAndOptimizeImage()**:
   - Resize na max width 1200px
   - Compress sa sharp (quality: 85)
   - Convert sve formate u JPEG
   - Skip ako image > 10MB
   - Generate alt text ako nije provide-an
   - Upload u Payload media collection
   - Return media ID

6. **validateTranslatedContent()**:
   - Check content length (min 500 chars)
   - Validate SEO meta lengths
   - Check za broken HTML tags
   - Validate Lexical JSON structure
   - Return array of issues

7. **createPayloadPost()**:
   - Convert HTML → Lexical JSON (koristi lexical-converter utility)
   - Set slug (koristi slug-generator utility)
   - Apply feed category/tags
   - Calculate publishDate based on autoPublish setting:
     * draft: current date
     * scheduled: random 1-48h u budućnosti
     * published: current date
   - Set initial status prema feed.autoPublish
   - Link back to imported-posts record

## ZADATAK 3: Rate Limiter

Kreiraj `src/services/RateLimiter.ts`:
```typescript
export class RateLimiter {
  private queue: QueueItem[] = [];
  private processing = false;
  private maxConcurrent: number;
  private minDelay: number;
  
  constructor(
    maxConcurrent = parseInt(process.env.RSS_MAX_CONCURRENT || '2'),
    minDelay = parseInt(process.env.RSS_RATE_LIMIT_DELAY_MS || '3000')
  )
  
  async add<T>(fn: () => Promise<T>): Promise<T>
  
  private async process(): Promise<void>
}

interface QueueItem {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}
```

REQUIREMENTS:
- Queue pattern sa FIFO
- Process max N requests concurrent (configurable)
- Min delay između batcha
- Properly propagate errors
- Log queue status
- Thread-safe (za concurrent cron runs)

## ZADATAK 4: Error Handling & Sentry Integration

U svim servisima:
- Wrap sve async operacije u try-catch
- Log errors sa contextom (feed ID, post ID, URL)
- Sentry.captureException() za sve errors
- Sentry tags: { service, operation, feedId }
- Graceful degradation gdje moguće
- Update imported-posts sa detaljnim error messages

Implementiraj retry logic:
- Max 3 retries per imported post
- Exponential backoff (1min, 5min, 15min)
- Track retryCount u DB
- Nakon 3 failed attempts → status = 'failed'

## IMPLEMENTATION NOTES:
- Svi servisi moraju biti TypeScript classes
- Export interfaces/types
- Comprehensive JSDoc comments
- Stateless design - svaki cron run mora biti independent
- Locking mechanism za preventing concurrent processing
- Production-ready error messages
- Detaljni console.log statements za debugging (ide u cron log files)

Generiši kompletan, production-ready kod za sve servise sa fokusnom na stateless design i concurrent execution safety.

🎯 Prompt 3: RSS Polling & Cron Integration
Implementiraj RSS polling service i cron job integration:

## CONTEXT
- Payload CMS sa Lexical editor
- Servisi već implementirani: ClaudeTranslator, ContentProcessor, RateLimiter
- Collections: rss-feeds, imported-posts
- Job scheduling: VANJSKI CRON (ne BullMQ) - sve mora biti stateless

## ZADATAK 1: RSS Poller Service

Kreiraj `src/services/RSSPoller.ts`:
```typescript
import Parser from 'rss-parser';
import { Payload } from 'payload';

export class RSSPoller {
  private payload: Payload;
  private parser: Parser;
  
  constructor(payload: Payload)
  
  /**
   * Poll all active feeds (called by cron job)
   */
  async pollAllFeeds(): Promise<PollResult>
  
  async pollFeed(feedId: string): Promise<FeedPollResult>
  
  private async isDuplicate(item: RSSItem, feedId: string): Promise<boolean>
  
  private normalizeUrl(url: string): string
  
  private async queueItemForProcessing(
    item: RSSItem, 
    feed: any
  ): Promise<void>
}

interface PollResult {
  feedsChecked: number;
  newItemsFound: number;
  duplicatesSkipped: number;
  errors: Array<{feedId: string, feedName: string, error: string}>;
  timestamp: Date;
}

interface FeedPollResult {
  feedId: string;
  feedName: string;
  itemsFound: number;
  newItems: number;
  duplicates: number;
}
```

REQUIREMENTS:

1. **Constructor**:
   - Initialize rss-parser sa custom fields:
```typescript
     customFields: {
       item: [
         ['media:content', 'media'],
         ['content:encoded', 'contentEncoded'],
         ['dc:creator', 'author'],
         ['media:thumbnail', 'mediaThumbnail']
       ]
     }
```

2. **pollAllFeeds()**:
   - Fetch active feeds iz DB (where: { active: true })
   - Sort by lastChecked ASC (oldest first)
   - Filter by checkInterval (poll samo one gdje je lastChecked + interval < now)
   - Poll svaki feed sequential (ne concurrent - da ne bombardujemo RSS servere)
   - Delay 2-3s između svakog feed-a
   - Collect results i errors
   - Return comprehensive summary
   - Log summary na kraju

3. **pollFeed()**:
   - Try-catch wrap cijele funkcije
   - Fetch RSS feed sa parser.parseURL()
   - Uzmi top N items (feed.maxItemsPerCheck)
   - Za svaki item:
     * Provjeri isDuplicate()
     * Ako nije duplicate → queueItemForProcessing()
   - Update feed.lastChecked = now()
   - Increment feed.itemsProcessed za broj novih items
   - Return statistics
   - Handle parser errors (invalid XML, network timeout, 404)

4. **isDuplicate()**:
   - Normalize URL (remove tracking params, www, hash, trailing slash)
   - Check u imported-posts:
     * By normalizedURL
     * By originalTitle + feedId (exact match)
   - Use Payload find() sa where clause
   - Return true ako postoji ANY match

5. **normalizeUrl()**:
```typescript
   normalizeUrl(url: string): string {
     try {
       const parsed = new URL(url);
       
       // Remove tracking parameters
       const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 
                               'utm_content', 'utm_term', 'ref', 'source'];
       trackingParams.forEach(param => parsed.searchParams.delete(param));
       
       // Remove hash
       parsed.hash = '';
       
       // Remove www
       parsed.hostname = parsed.hostname.replace(/^www\./, '');
       
       // Remove trailing slash
       let normalized = parsed.toString();
       if (normalized.endsWith('/')) {
         normalized = normalized.slice(0, -1);
       }
       
       return normalized;
     } catch (error) {
       return url; // Return original if parsing fails
     }
   }
```

6. **queueItemForProcessing()**:
   - Create imported-posts record sa:
```typescript
     {
       originalURL: normalizedUrl,
       originalTitle: item.title,
       rssFeed: feed.id,
       status: 'pending',
       retryCount: 0,
       metadata: {
         rawContent: item.content || item.contentEncoded || item.contentSnippet,
         author: item.author || item.creator,
         categories: item.categories || [],
         pubDate: item.pubDate,
         media: item.media || item.mediaThumbnail,
         guid: item.guid
       }
     }
```
   - Log queued item

Error handling:
- Catch RSS parse errors (invalid XML)
- Catch network errors (timeout, DNS)
- Catch DB errors
- Continue sa ostalim feedovima ako jedan failed
- Log sve errors sa full context
- Sentry.captureException() za sve errors

## ZADATAK 2: Finalize Cron Entry Points

Update `src/jobs/cron-poll-feeds.ts`:
```typescript
#!/usr/bin/env node
/**
 * RSS Feed Polling Cron Job
 * 
 * Polls all active RSS feeds and queues new items for processing
 * 
 * Usage: node dist/jobs/cron-poll-feeds.js
 * 
 * Cron setup (crontab -e):
 * */30 * * * * cd /path/to/payload && node dist/jobs/cron-poll-feeds.js >> /var/log/rss-poll.log 2>&1
 */

import 'dotenv/config';
import payload from 'payload';
import * as Sentry from '@sentry/node';
import { RSSPoller } from '../services/RSSPoller';

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
  });
}

const run = async () => {
  const startTime = Date.now();
  console.log(`[RSS Poll] Starting at ${new Date().toISOString()}`);
  
  try {
    // Initialize Payload in local mode
    await payload.init({
      secret: process.env.PAYLOAD_SECRET!,
      local: true,
    });
    
    console.log('[RSS Poll] Payload initialized');
    
    // Run polling
    const poller = new RSSPoller(payload);
    const result = await poller.pollAllFeeds();
    
    // Log summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[RSS Poll] Completed in ${duration}s`);
    console.log(`[RSS Poll] Feeds checked: ${result.feedsChecked}`);
    console.log(`[RSS Poll] New items: ${result.newItemsFound}`);
    console.log(`[RSS Poll] Duplicates skipped: ${result.duplicatesSkipped}`);
    
    if (result.errors.length > 0) {
      console.error(`[RSS Poll] Errors: ${result.errors.length}`);
      result.errors.forEach(err => {
        console.error(`  - ${err.feedName}: ${err.error}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('[RSS Poll] Fatal error:', error);
    Sentry.captureException(error);
    await Sentry.close(2000);
    process.exit(1);
  }
};

run();
```

Update `src/jobs/cron-process-imports.ts`:
```typescript
#!/usr/bin/env node
/**
 * Import Processing Cron Job
 * 
 * Processes pending imported posts (translation + post creation)
 * 
 * Usage: node dist/jobs/cron-process-imports.js
 * 
 * Cron setup (crontab -e):
 * */5 * * * * cd /path/to/payload && node dist/jobs/cron-process-imports.js >> /var/log/rss-process.log 2>&1
 */

import 'dotenv/config';
import payload from 'payload';
import * as Sentry from '@sentry/node';
import { ContentProcessor } from '../services/ContentProcessor';

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1,
  });
}

const run = async () => {
  const startTime = Date.now();
  console.log(`[Process Imports] Starting at ${new Date().toISOString()}`);
  
  try {
    // Initialize Payload in local mode
    await payload.init({
      secret: process.env.PAYLOAD_SECRET!,
      local: true,
    });
    
    console.log('[Process Imports] Payload initialized');
    
    // Process batch
    const processor = new ContentProcessor(payload);
    const batchSize = parseInt(process.env.RSS_BATCH_SIZE || '5');
    const result = await processor.processPendingBatch(batchSize);
    
    // Log summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Process Imports] Completed in ${duration}s`);
    console.log(`[Process Imports] Processed: ${result.processed}`);
    console.log(`[Process Imports] Succeeded: ${result.succeeded}`);
    console.log(`[Process Imports] Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.error(`[Process Imports] Errors:`);
      result.errors.forEach(err => {
        console.error(`  - ${err.id}: ${err.error}`);
      });
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('[Process Imports] Fatal error:', error);
    Sentry.captureException(error);
    await Sentry.close(2000);
    process.exit(1);
  }
};

run();
```

## ZADATAK 3: Manual Trigger Endpoints

Update `src/collections/RSSFeeds.ts` - dodaj endpoints:
```typescript
endpoints: [
  {
    path: '/test-feed',
    method: 'post',
    handler: async (req, res) => {
      const { feedUrl } = req.body;
      
      if (!feedUrl) {
        return res.status(400).json({
          success: false,
          error: 'feedUrl is required'
        });
      }
      
      try {
        const Parser = require('rss-parser');
        const parser = new Parser();
        const feed = await parser.parseURL(feedUrl);
        
        res.json({
          success: true,
          feedTitle: feed.title,
          feedDescription: feed.description,
          itemsFound: feed.items.length,
          latestItems: feed.items.slice(0, 5).map(item => ({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
          })),
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
      }
    },
  },
  {
    path: '/trigger-poll/:id',
    method: 'post',
    handler: async (req, res) => {
      const { id } = req.params;
      
      try {
        const { RSSPoller } = require('../services/RSSPoller');
        const poller = new RSSPoller(req.payload);
        
        const result = await poller.pollFeed(id);
        
        res.json({ 
          success: true, 
          result 
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    },
  },
]
```

## ZADATAK 4: Build Configuration

Update `package.json` scripts:
```json
{
  "scripts": {
    "build:jobs": "tsc src/jobs/*.ts --outDir dist/jobs --module commonjs --esModuleInterop",
    "cron:poll": "node dist/jobs/cron-poll-feeds.js",
    "cron:process": "node dist/jobs/cron-process-imports.js"
  }
}
```

## IMPLEMENTATION NOTES:
- Svi cron jobs moraju biti standalone executable
- Proper Payload local mode initialization
- Comprehensive logging (stdout/stderr za cron logs)
- Exit codes: 0 = success, 1 = failure
- Sentry integration za error tracking
- Graceful error handling - ne crashati sve ako jedan feed failed
- TypeScript strict mode
- Stateless design - svaki run je independent

Generiši kompletan kod sa production-ready error handling i logging.

🎯 Prompt 4: Admin UI, Monitoring & Documentation
Dodaj admin UI enhancements, monitoring i dokumentaciju za RSS Auto-Poster:

## CONTEXT
- RSS Auto-Poster već implementiran sa Collections i Services
- Vanjski cron za scheduling
- Payload CMS sa Lexical editor

## ZADATAK 1: Admin UI Components

### 1. RSS Stats Dashboard Widget

Kreiraj `src/components/RSSStatsWidget.tsx`:
```typescript
/**
 * Dashboard widget prikazuje RSS Auto-Poster statistike
 * Dodaj u payload.config.ts admin dashboard
 */

import React, { useEffect, useState } from 'react';

interface Stats {
  todayImports: { completed: number; failed: number };
  weekImports: { completed: number; failed: number };
  claudeTokensToday: number;
  activeFeeds: number;
  pendingImports: number;
  lastPollTime: Date | null;
}

export const RSSStatsWidget: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchStats();
    // Refresh svaki 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const fetchStats = async () => {
    // Fetch from Payload API
    // Implement statistics queries
  };
  
  return (
    <div className="rss-stats-widget">
      {/* UI implementation */}
</div>
);
};

REQUIREMENTS:
- Fetch data iz Collections preko Payload REST API
- Display:
  * Today's imports (completed/failed) sa progress bar
  * This week's total
  * Claude API tokens used today + estimated cost
  * Active feeds count
  * Pending imports count
  * Last successful poll timestamp
- Real-time refresh (30s interval)
- Error handling ako API call failed
- Loading states
- Click na stats → navigate to filtered collection view
- Responsive design

### 2. Imported Posts Preview Component

Kreiraj `src/components/ImportedPostPreview.tsx`:
```typescript
/**
 * Custom field component za imported-posts
 * Shows side-by-side preview of original vs translated
 */

import React, { useState } from 'react';
import { useField } from 'payload/components/forms';

export const ImportedPostPreview: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  
  const { value: metadata } = useField({ path: 'metadata' });
  const { value: post } = useField({ path: 'post' });
  
  return (
    <div>
      <button onClick={() => setShowModal(true)}>
        Preview Translation
      </button>
      
      {showModal && (
        <Modal>
          <div className="preview-grid">
            <div className="original">
              <h3>Original Content</h3>
              {/* Display metadata.rawContent */}
            </div>
            <div className="translated">
              <h3>Translated Content</h3>
              {/* Fetch and display post content */}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
```

REQUIREMENTS:
- Modal sa side-by-side comparison
- Left: Original content (iz metadata)
- Right: Translated content (iz linked post)
- Display SEO metadata comparison
- Show translation token usage
- Responsive layout

### 3. Retry Failed Import Component

Kreiraj `src/components/RetryImport.tsx`:
```typescript
/**
 * Button za retry failed imports
 * Visible samo kada status === 'failed'
 */

import React from 'react';
import { useField, useForm } from 'payload/components/forms';

export const RetryImport: React.FC = () => {
  const { value: status } = useField({ path: 'status' });
  const { submit } = useForm();
  
  const handleRetry = async () => {
    // Reset status to 'pending'
    // Increment retryCount
    // Clear errorMessage
    // Clear locks
    await submit({
      status: 'pending',
      retryCount: (retryCount || 0) + 1,
      errorMessage: null,
      lockedAt: null,
      lockedBy: null,
    });
  };
  
  if (status !== 'failed') return null;
  
  return (
    <button onClick={handleRetry}>
      Retry Import
    </button>
  );
};
```

### 4. Integriraj Components u Collections

Update `src/collections/ImportedPosts.ts`:
```typescript
import { ImportedPostPreview } from '../components/ImportedPostPreview';
import { RetryImport } from '../components/RetryImport';

fields: [
  // ... existing fields
  {
    name: 'preview',
    type: 'ui',
    admin: {
      components: {
        Field: ImportedPostPreview,
      },
      condition: (data) => data.status === 'completed',
    },
  },
  {
    name: 'retry',
    type: 'ui',
    admin: {
      components: {
        Field: RetryImport,
      },
      condition: (data) => data.status === 'failed',
    },
  },
]
```

## ZADATAK 2: Monitoring Service & Health Check

Kreiraj `src/services/MonitoringService.ts`:
```typescript
export class MonitoringService {
  private payload: Payload;
  
  constructor(payload: Payload)
  
  async getSystemHealth(): Promise<HealthStatus>
  
  async getFailureRate(hours: number = 24): Promise<number>
  
  async getStatistics(period: 'today' | 'week' | 'month'): Promise<Statistics>
  
  async checkAndAlert(): Promise<void>
}

interface HealthStatus {
  healthy: boolean;
  checks: {
    payloadConnected: boolean;
    claudeApiAvailable: boolean;
    pendingQueueSize: number;
    failureRate24h: number;
  };
  issues: string[];
}

interface Statistics {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  claudeTokensUsed: number;
  estimatedCost: number;
  averageProcessingTime: number;
  topFeeds: Array<{ name: string; imports: number }>;
}
```

REQUIREMENTS:
- getSystemHealth():
  * Check Payload connection
  * Check Claude API (simple ping)
  * Count pending imports
  * Calculate failure rate
  * Return health status

- getFailureRate():
  * Query imported-posts za period
  * Calculate: (failed / total) * 100

- getStatistics():
  * Aggregate data za period
  * Calculate costs (input/output tokens * pricing)
  * Find top performing feeds
  * Average processing time

- checkAndAlert():
  * Run health checks
  * If failure rate > 20% → log warning
  * If pending queue > 50 → log warning
  * If Claude API fails → log error
  * Integrate sa Sentry

Kreiraj Health Check Endpoint:

`src/collections/RSSFeeds.ts` - add endpoint:
```typescript
{
  path: '/health',
  method: 'get',
  handler: async (req, res) => {
    const { MonitoringService } = require('../services/MonitoringService');
    const monitor = new MonitoringService(req.payload);
    const health = await monitor.getSystemHealth();
    
    res.status(health.healthy ? 200 : 503).json(health);
  }
}
```

## ZADATAK 3: Utility Scripts

Kreiraj `scripts/test-rss-feed.ts`:
```typescript
#!/usr/bin/env tsx
/**
 * Test RSS feed prije dodavanja u sistem
 * Usage: npm run test-feed <rss_url>
 */

import 'dotenv/config';
import Parser from 'rss-parser';

const testFeed = async (url: string) => {
  console.log(`Testing RSS feed: ${url}\n`);
  
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(url);
    
    console.log(`✓ Feed Title: ${feed.title}`);
    console.log(`✓ Feed Description: ${feed.description || 'N/A'}`);
    console.log(`✓ Items Found: ${feed.items.length}\n`);
    
    console.log('Latest 5 items:');
    feed.items.slice(0, 5).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.title}`);
      console.log(`   URL: ${item.link}`);
      console.log(`   Date: ${item.pubDate || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('✗ Feed test failed:', error.message);
    process.exit(1);
  }
};

const url = process.argv[2];
if (!url) {
  console.error('Usage: npm run test-feed <rss_url>');
  process.exit(1);
}

testFeed(url);
```

Kreiraj `scripts/reprocess-failed.ts`:
```typescript
#!/usr/bin/env tsx
/**
 * Requeue all failed imports for retry
 * Usage: npm run reprocess-failed [--days=7]
 */

import 'dotenv/config';
import payload from 'payload';

const reprocessFailed = async (days?: number) => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET!,
    local: true,
  });
  
  const where: any = { status: { equals: 'failed' } };
  
  if (days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    where.processedAt = { greater_than: cutoffDate };
  }
  
  const failed = await payload.find({
    collection: 'imported-posts',
    where,
    limit: 1000,
  });
  
  console.log(`Found ${failed.docs.length} failed imports`);
  
  for (const doc of failed.docs) {
    await payload.update({
      collection: 'imported-posts',
      id: doc.id,
      data: {
        status: 'pending',
        retryCount: (doc.retryCount || 0) + 1,
        errorMessage: null,
        lockedAt: null,
        lockedBy: null,
      },
    });
  }
  
  console.log('✓ All failed imports reset to pending');
  process.exit(0);
};

const daysArg = process.argv.find(arg => arg.startsWith('--days='));
const days = daysArg ? parseInt(daysArg.split('=')[1]) : undefined;

reprocessFailed(days);
```

Kreiraj `scripts/cleanup-old-imports.ts`:
```typescript
#!/usr/bin/env tsx
/**
 * Delete old completed/failed imports
 * Usage: npm run cleanup-imports --older-than=30
 */

import 'dotenv/config';
import payload from 'payload';

const cleanup = async (days: number) => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET!,
    local: true,
  });
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const oldImports = await payload.find({
    collection: 'imported-posts',
    where: {
      and: [
        {
          or: [
            { status: { equals: 'completed' } },
            { status: { equals: 'failed' } },
          ],
        },
        { processedAt: { less_than: cutoffDate } },
      ],
    },
    limit: 10000,
  });
  
  console.log(`Found ${oldImports.docs.length} old imports to delete`);
  
  for (const doc of oldImports.docs) {
    await payload.delete({
      collection: 'imported-posts',
      id: doc.id,
    });
  }
  
  console.log('✓ Cleanup completed');
  process.exit(0);
};

const daysArg = process.argv.find(arg => arg.startsWith('--older-than='));
if (!daysArg) {
  console.error('Usage: npm run cleanup-imports --older-than=30');
  process.exit(1);
}

const days = parseInt(daysArg.split('=')[1]);
cleanup(days);
```

## ZADATAK 4: Documentation

Kreiraj `docs/RSS-AUTO-POSTER.md`:

Include:
1. **Setup Instructions**
   - Dependencies installation
   - Environment variables
   - Cron setup (provide exact crontab entries)
   - Build process

2. **Usage Guide**
   - Adding RSS feed
   - Monitoring imports
   - Handling failures
   - Manual triggers

3. **Cron Job Configuration**
```bash
   # RSS Feed Polling - every 30 minutes
   */30 * * * * cd /path/to/payload && node dist/jobs/cron-poll-feeds.js >> /var/log/rss-poll.log 2>&1
   
   # Import Processing - every 5 minutes
   */5 * * * * cd /path/to/payload && node dist/jobs/cron-process-imports.js >> /var/log/rss-process.log 2>&1
```

4. **Monitoring & Troubleshooting**
   - Health check endpoint
   - Log locations
   - Common errors
   - Performance tuning

5. **Cost Tracking**
   - Claude API pricing
   - Token usage calculation
   - Monthly estimates

Update `package.json` scripts:
```json
{
  "scripts": {
    "test-feed": "tsx scripts/test-rss-feed.ts",
    "reprocess-failed": "tsx scripts/reprocess-failed.ts",
    "cleanup-imports": "tsx scripts/cleanup-old-imports.ts"
  }
}
```

## IMPLEMENTATION NOTES:
- Svi React components koriste Payload UI primitives
- TypeScript strict mode
- Responsive design
- Accessibility (ARIA labels)
- Error boundaries
- Loading states
- Scripts moraju biti executable
- Comprehensive documentation
- Production-ready

Generiši kompletan kod za sve komponente, servise i dokumentaciju.

📋 Kako Koristiti Ove Prompte
Setup Process:

Kopiraj Prompt 1 → Claude Code

Generiše Collections, utilities, cron entry points
Review i commit


Kopiraj Prompt 2 → Claude Code

Generiše core services (Translator, Processor, RateLimiter)
Review i commit


Kopiraj Prompt 3 → Claude Code

Generiše RSSPoller i cron integration
Review i commit


Kopiraj Prompt 4 → Claude Code

Generiše admin UI, monitoring, scripts
Review i commit


Build & Deploy:

bash   npm install
   npm run build
   npm run build:jobs
   
   # Setup cron
   crontab -e
   # Add:
   # */30 * * * * cd /path/to/app && node dist/jobs/cron-poll-feeds.js >> /var/log/rss-poll.log 2>&1
   # */5 * * * * cd /path/to/app && node dist/jobs/cron-process-imports.js >> /var/log/rss-process.log 2>&1