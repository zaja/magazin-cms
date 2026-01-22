# Magazin CMS

Content Management System izgrađen s [Payload CMS](https://payloadcms.com) i [Next.js](https://nextjs.org). Dizajniran za upravljanje blog/magazin web stranicama s naprednim funkcionalnostima.

## Značajke

- **Višejezičnost**: Podrška za English i Hrvatski
- **Blog/Magazin**: Posts, Pages, Categories, Tags
- **Komentari**: Nested comments s moderacijom i email notifikacijama
- **Newsletter**: Subscriber management s double opt-in
- **SEO**: Kompletna SEO kontrola za svaki sadržaj
- **Media Library**: Upload s automatskim thumbnail generiranjem
- **Email**: SMTP i Resend podrška s fallback mehanizmom
- **Scheduled Publishing**: Automatsko objavljivanje u zadano vrijeme
- **Version Control**: Drafts, autosave, version history
- **RBAC**: Admin, Editor, Author, Subscriber uloge
- **RSS Auto-Poster**: Automatski import i prijevod članaka s RSS feedova

## Tech Stack

- **Backend**: Payload CMS 3.x
- **Frontend**: Next.js 15 (App Router)
- **Database**: PostgreSQL
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui

## Quick Start

### Preduvjeti

- Node.js 18+
- PostgreSQL 14+
- npm ili pnpm

### Instalacija

```bash
# Kloniraj repozitorij
git clone <repository-url>
cd magazin-cms

# Kopiraj environment varijable
cp .env.example .env

# Uredi .env s pravim vrijednostima
nano .env

# Instaliraj dependencies
npm install

# Kreiraj database migraciju
npx payload migrate:create

# Pokreni migraciju
npx payload migrate

# Pokreni development server
npm run dev
```

Otvori `http://localhost:3000/admin` i kreiraj admin korisnika.

## Struktura projekta

```
src/
├── app/
│   ├── (frontend)/          # Frontend routes
│   │   └── api/             # REST API endpoints
│   └── (payload)/           # Admin panel
├── collections/             # Payload collections
│   ├── Posts/               # Blog posts
│   ├── Pages/               # Static pages
│   ├── Categories.ts        # Hierarchical categories
│   ├── Tags.ts              # Post tags
│   ├── Comments.ts          # Comment system
│   ├── Media.ts             # Media library
│   ├── Users/               # User management
│   └── Subscribers.ts       # Newsletter subscribers
├── globals/                 # Global settings
│   ├── Settings.ts          # Site settings
│   ├── SEO.ts               # Default SEO
│   └── EmailConfig.ts       # Email configuration
├── hooks/                   # Payload hooks
│   └── emailNotifications.ts
├── utilities/               # Helper utilities
│   └── emailService.ts      # Email service (SMTP/Resend)
└── translations/            # i18n translations
    ├── en.json
    └── hr.json
```

## Collections

| Collection | Opis |
|------------|------|
| **Users** | Korisnici s ulogama: Admin, Editor, Author, Subscriber |
| **Posts** | Blog postovi s SEO, categories, tags, comments |
| **Pages** | Statične stranice s layout builder |
| **Categories** | Hijerarhijske kategorije |
| **Tags** | Tagovi za organizaciju sadržaja |
| **Comments** | Nested komentari s moderacijom |
| **Media** | Slike, videi, dokumenti |
| **Subscribers** | Newsletter pretplatnici |
| **RSSFeeds** | RSS feed sources za auto-import |
| **ImportedPosts** | Queue importiranih članaka |

## Globals

| Global | Opis |
|--------|------|
| **Settings** | Naziv stranice, logo, favicon, maintenance mode |
| **SEO** | Default meta tags, structured data, sitemap |
| **EmailConfig** | SMTP/Resend konfiguracija, email templates |

## API Endpoints

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/posts` | GET | Lista postova (pagination, filters) |
| `/api/posts/:slug` | GET | Pojedinačni post |
| `/api/comments` | GET | Komentari za post |
| `/api/comments` | POST | Submit komentar |
| `/api/subscribe` | POST | Subscribe na newsletter |
| `/api/confirm-subscription` | GET | Potvrdi subscription |
| `/api/unsubscribe` | GET | Unsubscribe |
| `/api/cron/publish-scheduled` | GET | Publish scheduled posts (cron) |
| `/api/cron/cleanup-drafts` | GET | Cleanup old drafts (cron) |
| `/api/rss-feeds/:id/trigger-poll` | POST | Ručno pokreni RSS poll |
| `/api/rss-feeds/process-single` | POST | Procesiraj pojedinačni import |

## Access Control

| Uloga | Permissions |
|-------|-------------|
| **Admin** | Full access - sve kolekcije i postavke |
| **Editor** | Može upravljati svim sadržajem osim korisnika |
| **Author** | Može upravljati samo svojim postovima |
| **Subscriber** | Read-only pristup |

## Production

### Build

```bash
# Build za production
npm run build

# Start production server
npm run start
```

### PM2 (preporučeno)

```bash
# Start s PM2
pm2 start ecosystem.config.cjs

# Restart
pm2 restart magazin-cms

# Logs
pm2 logs magazin-cms

# Status
pm2 status
```

### Cron Jobs

Dodaj u crontab (`crontab -e`):

```bash
# Publish scheduled posts (svake minute)
* * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/publish-scheduled

# Cleanup old drafts (dnevno u 2am)
0 2 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/cleanup-drafts

crontab -e
# Dodaj:
*/30 * * * * cd /home/zaja/magazin-cms && npm run rss:poll >> /var/log/rss-poll.log 2>&1
*/5 * * * * cd /home/zaja/magazin-cms && npm run rss:process >> /var/log/rss-process.log 2>&1
```

## RSS Auto-Poster

Sustav za automatski import, prijevod i objavljivanje članaka s vanjskih RSS feedova.

### Značajke

- **Automatski import** novih članaka s RSS feedova
- **AI prijevod** s engleskog na hrvatski (Claude AI)
- **SEO optimizacija** - automatski generira meta tagove i ključne riječi
- **Deduplication** - sprječava duplicate importe
- **Media handling** - automatski download i optimizacija slika
- **Rate limiting** - poštuje ograničenja vanjskih servisa
- **Admin UI** - ručno pokretanje poll/process iz admin panela

### NPM Scripts

```bash
# Poll sve aktivne feedove za nove članke
npm run rss:poll

# Procesiraj pending importe (prijevod + kreiranje posta)
npm run rss:process

# Testiraj RSS feed URL
npm run rss:test-feed -- <feed-url>

# Reprocessiraj failed importe
npm run rss:reprocess-failed

# Očisti stare importe (default: 30 dana)
npm run rss:cleanup
```

### Workflow

1. **Poll** - `rss:poll` dohvaća nove članke iz RSS feedova i sprema ih u `ImportedPosts` sa statusom `pending`
2. **Process** - `rss:process` uzima pending importe, prevodi ih s Claude AI, downloada slike i kreira draft postove
3. **Review** - Urednik pregledava draft postove u admin panelu i objavljuje ih

### Konfiguracija

Dodaj u `.env`:

```bash
# Claude AI API key (obavezno za prijevod)
CLAUDE_API_KEY=sk-ant-api03-xxx

# Opcionalno - rate limiting
RSS_MAX_CONCURRENT=2
RSS_RATE_LIMIT_DELAY_MS=2000
RSS_BATCH_SIZE=5
```

### Admin UI

- **RSSFeeds** collection - dodaj/uredi feedove, ručno pokreni poll
- **ImportedPosts** collection - pregledaj queue, ručno procesiraj pojedinačne importe

Više detalja: `docs/RSS-AUTO-POSTER.md`

## Development Tips

### Push Mode (Development)

U development mode-u, `push: true` je uključen u `payload.config.ts`. To znači da se schema automatski sinkronizira s bazom bez potrebe za eksplicitnim migracijama.

### Migracije (Production)

Za production deployment:

```bash
# Kreiraj migraciju
NODE_ENV=production npx payload migrate:create

# Pokreni migraciju
NODE_ENV=production npx payload migrate
```

### Database Reset (Development)

Ako migracija zapne:

```bash
PGPASSWORD=your_password psql -U payload_user -h 127.0.0.1 -d payload_cms_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO payload_user;"
rm src/migrations/*.ts src/migrations/*.json
npx payload migrate:create && npx payload migrate
npm run build
```

## Environment Variables

Vidi `.env.example` za sve potrebne varijable.

| Varijabla | Opis |
|-----------|------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PAYLOAD_SECRET` | JWT encryption secret (min 32 chars) |
| `NEXT_PUBLIC_SERVER_URL` | Public URL (bez trailing slash) |
| `CRON_SECRET` | Secret za cron job authentication |
| `RESEND_API_KEY` | Resend API key (optional) |
| `SMTP_*` | SMTP konfiguracija (optional) |
| `CLAUDE_API_KEY` | Anthropic Claude API key za RSS prijevod |

## Troubleshooting

### Server se ne pokreće

```bash
# Provjeri PM2 status
pm2 status

# Provjeri logs
pm2 logs magazin-cms

# Rebuild
npm run build && pm2 restart magazin-cms
```

### Database connection error

```bash
# Provjeri PostgreSQL
sudo systemctl status postgresql

# Provjeri connection
psql -U payload_user -h 127.0.0.1 -d payload_cms_db
```

## License

MIT
