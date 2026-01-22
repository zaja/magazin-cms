# RSS Auto-Poster System

Automatski sustav za import članaka iz RSS feedova, prijevod na hrvatski kroz Claude AI, i kreiranje draft postova u Payload CMS.

## Arhitektura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   RSS Feeds     │────▶│  Imported Posts  │────▶│     Posts       │
│   Collection    │     │   Collection     │     │   Collection    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   RSSPoller     │────▶│ContentProcessor  │────▶│  Payload Post   │
│   Service       │     │   Service        │     │   Created       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │
        │               ┌───────┴───────┐
        │               ▼               ▼
        │       ┌──────────────┐ ┌─────────────┐
        │       │   Claude AI  │ │    Sharp    │
        │       │  Translator  │ │   Images    │
        │       └──────────────┘ └─────────────┘
        │
┌───────┴───────────────────────────────────────────────┐
│                  External Cron Jobs                    │
│  */30 * * * * - Poll feeds                            │
│  */5 * * * *  - Process imports                       │
└───────────────────────────────────────────────────────┘
```

## Setup

### 1. Environment Variables

Dodaj u `.env`:

```bash
# RSS Auto-Poster Configuration
CLAUDE_API_KEY=your_claude_api_key_here
RSS_POLLER_ENABLED=true
RSS_MAX_CONCURRENT=2
RSS_RATE_LIMIT_DELAY_MS=3000
RSS_LOCK_TIMEOUT_MS=300000
RSS_BATCH_SIZE=5
```

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_API_KEY` | Anthropic API key za prijevod | Required |
| `RSS_POLLER_ENABLED` | Enable/disable RSS polling | `true` |
| `RSS_MAX_CONCURRENT` | Max concurrent API requests | `2` |
| `RSS_RATE_LIMIT_DELAY_MS` | Delay between batches (ms) | `3000` |
| `RSS_LOCK_TIMEOUT_MS` | Lock timeout for processing (ms) | `300000` |
| `RSS_BATCH_SIZE` | Items to process per cron run | `5` |

### 2. Dependencies

Već instalirane dependencies:
- `@anthropic-ai/sdk` - Claude AI SDK
- `rss-parser` - RSS feed parsing
- `@mozilla/readability` - Article content extraction
- `turndown` - HTML to Markdown conversion
- `sharp` - Image optimization

### 3. Generate Types

```bash
npm run generate:types
npm run generate:importmap
```

### 4. Build Application

```bash
npm run build
```

## Cron Job Setup

### Linux/macOS (crontab)

```bash
crontab -e
```

Dodaj:

```cron
# RSS Feed Polling - svakih 30 minuta
*/30 * * * * cd /path/to/magazin-cms && npm run rss:poll >> /var/log/rss-poll.log 2>&1

# Import Processing - svakih 5 minuta  
*/5 * * * * cd /path/to/magazin-cms && npm run rss:process >> /var/log/rss-process.log 2>&1
```

### PM2 (alternativa)

```javascript
// ecosystem.config.cjs - dodaj
{
  name: 'rss-poll',
  script: 'npx',
  args: 'tsx src/jobs/cron-poll-feeds.ts',
  cron_restart: '*/30 * * * *',
  autorestart: false,
}
```

## Korištenje

### 1. Dodavanje RSS Feed-a

1. Otvori Admin Panel → **Automation** → **RSS Feeds**
2. Klikni **Create New**
3. Popuni:
   - **Name**: Naziv feeda (npr. "TechCrunch")
   - **URL**: RSS feed URL
   - **Category**: Defaultna kategorija za postove
   - **Tags**: Defaultni tagovi
   - **Check Interval**: Koliko često provjeravati (min)
   - **Max Items Per Check**: Max broj članaka po provjeri
   - **Translate Content**: Prevedi na hrvatski
   - **Auto Publish**: draft/scheduled/published

### 2. Testiranje Feed-a

Prije dodavanja, testiraj feed:

```bash
npm run rss:test-feed https://example.com/feed.xml
```

### 3. Manual Trigger

Kroz API endpoint:

```bash
# Test feed URL
curl -X POST http://localhost:3000/api/rss-feeds/test-feed \
  -H "Content-Type: application/json" \
  -d '{"feedUrl": "https://example.com/feed.xml"}'

# Trigger polling za specifični feed
curl -X POST http://localhost:3000/api/rss-feeds/trigger-poll/FEED_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Monitoring

#### Health Check

```bash
curl http://localhost:3000/api/rss-feeds/health
```

Response:
```json
{
  "healthy": true,
  "checks": {
    "payloadConnected": true,
    "claudeApiAvailable": true,
    "pendingQueueSize": 5,
    "failureRate24h": 2.5
  },
  "issues": []
}
```

#### Admin Dashboard

U Admin Panel → **Automation** → **Imported Posts** možeš vidjeti:
- Status svih importa (pending/processing/completed/failed)
- Error messages za failed importe
- Token usage za prijevode

## Utility Scripts

### Test RSS Feed

```bash
npm run rss:test-feed <url>
```

### Reprocess Failed Imports

```bash
# Sve failed importe
npm run rss:reprocess-failed

# Samo zadnjih 7 dana
npm run rss:reprocess-failed -- --days=7
```

### Cleanup Old Imports

```bash
# Obriši importe starije od 30 dana
npm run rss:cleanup -- --older-than=30
```

## Troubleshooting

### Common Issues

#### 1. "CLAUDE_API_KEY is not configured"

Dodaj `CLAUDE_API_KEY` u `.env` file.

#### 2. Feed parsing fails

- Provjeri je li URL validan RSS/Atom feed
- Testiraj s `npm run rss:test-feed <url>`
- Neki feedovi zahtijevaju User-Agent header

#### 3. High failure rate

- Provjeri Claude API rate limits
- Povećaj `RSS_RATE_LIMIT_DELAY_MS`
- Smanji `RSS_BATCH_SIZE`

#### 4. Duplicate content

- Normalizacija URL-a uklanja tracking parametre
- Provjera se radi i po naslovu + feed kombinaciji

#### 5. Images not downloading

- Timeout je 15s za slike
- Max veličina 10MB
- Provjeri CORS/firewall postavke

### Log Files

- Poll logs: `/var/log/rss-poll.log`
- Process logs: `/var/log/rss-process.log`

### Manual Commands

```bash
# Poll svih feedova ručno
npm run rss:poll

# Process pending imports ručno
npm run rss:process
```

## Cost Tracking

### Claude API Pricing (približno)

- Input tokens: ~$3 / million tokens
- Output tokens: ~$15 / million tokens

### Procjena troškova

Prosječni članak:
- ~2000 input tokena
- ~1500 output tokena
- Trošak: ~$0.03 po članku

Za 100 članaka dnevno: ~$3/dan, ~$90/mjesec

### Praćenje u Dashboard

Token usage se bilježi u `translationTokens` polju svakog imported post-a.

## Security Considerations

1. **Claude API Key** - Nikad ne commitaj u git
2. **Access Control** - Samo authenticated korisnici mogu pristupiti collections
3. **Rate Limiting** - Ugrađeno za zaštitu API limita
4. **Locking** - Sprječava concurrent processing istog posta

## API Reference

### Collections

#### RSS Feeds (`/api/rss-feeds`)

| Field | Type | Description |
|-------|------|-------------|
| name | text | Feed name |
| url | text | RSS feed URL (unique) |
| active | checkbox | Enable polling |
| category | relationship | Default category |
| tags | relationship[] | Default tags |
| checkInterval | number | Check interval (minutes) |
| lastChecked | date | Last poll timestamp |
| itemsProcessed | number | Total items imported |
| translateContent | checkbox | Enable translation |
| generateSEO | checkbox | Generate SEO metadata |
| autoPublish | select | draft/scheduled/published |
| maxItemsPerCheck | number | Max items per poll |

#### Imported Posts (`/api/imported-posts`)

| Field | Type | Description |
|-------|------|-------------|
| originalURL | text | Original article URL (unique) |
| originalTitle | text | Original title |
| rssFeed | relationship | Source feed |
| post | relationship | Created Payload post |
| status | select | pending/processing/completed/failed |
| errorMessage | textarea | Error details |
| translationTokens | number | Claude tokens used |
| processedAt | date | Processing timestamp |
| retryCount | number | Retry attempts |
| metadata | json | Raw article data |

### Custom Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rss-feeds/test-feed` | Test RSS feed URL |
| POST | `/api/rss-feeds/trigger-poll/:id` | Trigger manual poll |
| GET | `/api/rss-feeds/health` | Health check |
| POST | `/api/imported-posts/retry/:id` | Retry failed import |

## Development

### Running Locally

```bash
# Start dev server
npm run dev

# In another terminal, run poll manually
npm run rss:poll

# Or process imports
npm run rss:process
```

### Testing

```bash
# Test a feed
npm run rss:test-feed https://feeds.feedburner.com/TechCrunch

# Check health
curl http://localhost:3000/api/rss-feeds/health
```
