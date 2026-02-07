# Magazin CMS

Content Management System izgrađen s [Payload CMS 3.x](https://payloadcms.com) i [Next.js 15](https://nextjs.org). Dizajniran za upravljanje blog/magazin web stranicama s naprednim funkcionalnostima.

## Značajke

### Sadržaj
- **Blog/Magazin** — Posts, Pages, Categories, Tags
- **Višejezičnost** — Podrška za English i Hrvatski (i18n)
- **Rich Text Editor** — Lexical editor s blokovima, tablicama, kodom
- **Version Control** — Drafts, autosave, version history
- **Scheduled Publishing** — Automatsko objavljivanje u zadano vrijeme
- **Media Library** — Upload s automatskim thumbnail generiranjem (6 veličina)

### Korisnici & Autentikacija
- **RBAC** — Admin, Editor, Author, Subscriber uloge
- **Magic Link Login** — Passwordless prijava za frontend korisnike
- **Member Auth** — Frontend korisnički računi s profilom

### Komunikacija
- **Komentari** — Nested comments s moderacijom i email notifikacijama
- **Newsletter** — Subscriber management s double opt-in
- **Email Templates** — Konfigurirajte sve email poruke iz admin panela
- **Email Provideri** — SMTP i Resend s fallback mehanizmom (DB config > env vars)

### SEO & Analitika
- **SEO** — Meta tagovi, Open Graph, structured data za svaki sadržaj
- **Sitemap** — Automatski generiran XML sitemap
- **Google Analytics** — Integracija s GA4
- **View Counter** — Praćenje pregleda postova

### Automatizacija
- **RSS Auto-Poster** — Import, AI prijevod i objavljivanje članaka s RSS feedova
- **Content Styles** — Konfigurirajte stil prijevoda (kratki, srednji, opširni)
- **Pixabay Integration** — Automatski pronađi stock slike za importirane članke
- **Cron Jobs** — Scheduled publishing, draft cleanup, RSS polling

## Tech Stack

| Komponenta | Tehnologija |
|------------|-------------|
| **CMS** | Payload CMS 3.x |
| **Frontend** | Next.js 15 (App Router) |
| **Database** | PostgreSQL 14+ |
| **Styling** | TailwindCSS |
| **UI Components** | shadcn/ui |
| **AI Translation** | Claude API (Anthropic) |
| **Stock Images** | Pixabay API |
| **Email** | SMTP / Resend |
| **Process Manager** | PM2 |

## Instalacija

### Preduvjeti

- Node.js 20+
- PostgreSQL 14+
- npm ili pnpm

### Quick Start

```bash
git clone https://github.com/zaja/magazin-cms.git
cd magazin-cms
npm install
npm run setup
npm run dev
```

Setup wizard automatski:
1. Generira `.env` s auto-generiranim secretima (`PAYLOAD_SECRET`, `CRON_SECRET`, `PREVIEW_SECRET`)
2. Pita za `DATABASE_URL` i `NEXT_PUBLIC_SERVER_URL`
3. Opcionalno pita za Claude i Pixabay API ključeve
4. Pokreće database migracije
5. Seeda default email templateove i content stilove

Otvori `http://localhost:3000/admin` i kreiraj prvog admin korisnika.

### Ručna instalacija

Ako preferirate ručni setup:

```bash
cp .env.example .env
# Uredite .env s pravim vrijednostima
npm install
npx payload migrate
npm run seed    # Opcionalno: seeda email templateove i content stilove
npm run dev
```

## NPM Scripts

| Script | Opis |
|--------|------|
| `npm run dev` | Pokreni development server |
| `npm run build` | Build za production |
| `npm run start` | Start production server |
| `npm run setup` | Interaktivni setup wizard |
| `npm run seed` | Seeda default email templateove i content stilove |
| `npm run rss:poll` | Poll RSS feedove za nove članke |
| `npm run rss:process` | Procesiraj pending RSS importe |
| `npm run rss:test-feed` | Testiraj RSS feed URL |
| `npm run rss:reprocess-failed` | Reprocessiraj failed importe |
| `npm run rss:cleanup` | Očisti stare importe |

## Struktura projekta

```
src/
├── app/
│   ├── (frontend)/              # Frontend routes & API
│   │   ├── api/
│   │   │   ├── auth/            # Magic link, session, profile
│   │   │   ├── cron/            # Scheduled tasks
│   │   │   ├── frontend/        # Public API (posts, comments, tags)
│   │   │   ├── subscribe/       # Newsletter subscription
│   │   │   └── search/          # Search endpoint
│   │   ├── posts/               # Blog pages
│   │   ├── category/            # Category pages
│   │   ├── tags/                # Tag pages
│   │   ├── account/             # Member account pages
│   │   └── subscribe/           # Subscribe page
│   └── (payload)/               # Admin panel
├── collections/                 # Payload collections
│   ├── Posts/                   # Blog posts (versioned, localized)
│   ├── Pages/                   # Static pages (versioned, localized)
│   ├── Categories.ts            # Hierarchical categories
│   ├── Tags.ts                  # Post tags
│   ├── Comments.ts              # Nested comments with moderation
│   ├── Media.ts                 # Media library (6 image sizes)
│   ├── Users/                   # Users with RBAC
│   ├── Subscribers.ts           # Newsletter subscribers
│   ├── RSSFeeds.ts              # RSS feed sources
│   └── ImportedPosts.ts         # RSS import queue
├── globals/                     # Global settings
│   ├── Settings.ts              # Site settings, language, timezone
│   ├── SEO.ts                   # Default SEO, structured data, sitemap
│   ├── EmailConfig.ts           # Email provider + 7 email templates
│   └── ContentStyles.ts         # AI translation style presets
├── services/                    # Business logic
│   ├── ClaudeTranslator.ts      # AI translation service
│   ├── ContentProcessor.ts      # RSS content processing pipeline
│   ├── PixabayService.ts        # Stock image search
│   ├── RSSPoller.ts             # RSS feed polling
│   ├── RateLimiter.ts           # Rate limiting for external APIs
│   └── MonitoringService.ts     # System monitoring
├── hooks/                       # Payload hooks
│   ├── emailNotifications.ts    # All email notification hooks
│   └── populatePublishedAt.ts   # Auto-set publish date
├── utilities/                   # Helper utilities
│   ├── emailService.ts          # Email service (SMTP/Resend + DB fallback)
│   ├── memberAuth.ts            # Frontend member authentication
│   ├── validateEnv.ts           # Environment variable validation
│   └── ...
├── jobs/                        # Cron job scripts
│   ├── cron-poll-feeds.ts       # RSS poll cron
│   └── cron-process-imports.ts  # RSS process cron
└── translations/                # i18n
    ├── en.json
    └── hr.json

scripts/
├── setup.ts                     # Interactive setup wizard
├── seed-defaults.ts             # Seed email templates + content styles
├── test-rss-feed.ts             # Test RSS feed URL
├── reprocess-failed.ts          # Reprocess failed RSS imports
└── cleanup-old-imports.ts       # Clean up old RSS imports

docs/
└── RSS-AUTO-POSTER.md           # Detailed RSS auto-poster documentation
```

## Collections

| Collection | Opis |
|------------|------|
| **Users** | Korisnici s ulogama: Admin, Editor, Author, Subscriber |
| **Posts** | Blog postovi s SEO, categories, tags, versioning, localization |
| **Pages** | Statične stranice s layout builder (Hero, CTA, Content, Archive blokovi) |
| **Categories** | Hijerarhijske kategorije s breadcrumbs |
| **Tags** | Tagovi za organizaciju sadržaja |
| **Comments** | Nested komentari s moderacijom (pending/approved/spam/deleted) |
| **Media** | Slike, videi, dokumenti s automatskim resize-om |
| **Subscribers** | Newsletter pretplatnici s double opt-in |
| **RSSFeeds** | RSS feed sources za auto-import |
| **ImportedPosts** | Queue importiranih članaka s statusom procesiranja |
| **Newsletters** | Ručni newsletteri s rich text editorom i audience odabirom |

## Globals

| Global | Opis |
|--------|------|
| **Settings** | Naziv stranice, logo, favicon, jezik, timezone, maintenance mode |
| **SEO** | Default meta tags, structured data, sitemap konfiguracija, social links |
| **EmailConfig** | SMTP/Resend provider + 7 email templateova (Lexical rich text) |
| **ContentStyles** | AI prijevod stilovi (kratki, srednji, opširni) s custom promptima |
| **Header** | Navigacija s mega-menu podrškom |
| **Footer** | Footer kolone, social linkovi |

## API Endpoints

### Frontend API

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/frontend/posts` | GET | Lista postova (pagination, filters) |
| `/api/frontend/posts/:slug` | GET | Pojedinačni post |
| `/api/frontend/posts/view` | POST | Inkrementiraj view counter |
| `/api/frontend/pages/:slug` | GET | Pojedinačna stranica |
| `/api/frontend/comments` | GET/POST | Komentari za post |
| `/api/frontend/tags` | GET | Lista tagova |
| `/api/search` | GET | Pretraživanje sadržaja |

### Newsletter

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/subscribe` | POST | Subscribe na newsletter |
| `/api/confirm-subscription` | GET | Potvrdi subscription (double opt-in) |
| `/api/unsubscribe` | GET | Unsubscribe |

### Autentikacija

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/auth/magic-link` | POST | Pošalji magic link za login |
| `/api/auth/verify` | GET | Verificiraj magic link token |
| `/api/auth/session` | GET | Provjeri korisničku sesiju |
| `/api/auth/update-profile` | POST | Ažuriraj profil |
| `/api/auth/logout` | POST | Odjava |

### Cron Jobs

| Endpoint | Method | Opis |
|----------|--------|------|
| `/api/cron/publish-scheduled` | GET | Objavi zakazane postove |
| `/api/cron/cleanup-drafts` | GET | Očisti stare draftove |

## Access Control

| Uloga | Permissions |
|-------|-------------|
| **Admin** | Full access — sve kolekcije, postavke, korisnici |
| **Editor** | Može upravljati svim sadržajem osim korisnika i postavki |
| **Author** | Može kreirati i upravljati samo svojim postovima |
| **Subscriber** | Read-only pristup frontend sadržaju |

## Sustav obavještavanja

Koristi **Payload Jobs Queue** za pouzdano, throttled slanje emailova.

### Tipovi obavijesti

| Tip | Opis | Frekvencija |
|-----|-------|-------------|
| **Instant obavijesti** | Batched email o novim postovima | Max 1x / 2 sata |
| **Tjedni digest** | Pregled svih postova iz tjedna | Ponedjeljak 8:00 (auto-scheduled) |
| **Ručni newsletter** | Admin piše i šalje kampanju | Ručno iz admin panela |
| **Komentar obavijesti** | Odgovor na komentar, odobrenje | Odmah |

### Kako radi

1. **Post objavljen** → hook kreira job `sendPostNotificationBatch` s `waitUntil: +2h`
2. **Payload Jobs runner** (autoRun svakih 5 min) provjerava queue
3. **Job handler** skupi sve neobaviještene postove i šalje **jedan email** po pretplatniku
   - 1 post → normalan email
   - 3+ postova → digest-style lista

### Pretplatničke preference

Svaki pretplatnik bira što želi primati:

| Preference | Default | Opis |
|-----------|---------|------|
| `newPosts` | `false` | Instant obavijesti o novim postovima (throttled) |
| `weeklyDigest` | `true` | Tjedni pregled svih novih postova |
| `newsletter` | `true` | Ručni newsletteri od urednika |
| `commentReplies` | `true` | Obavijesti o odgovorima na komentare |

### Ručni newsletter

1. Admin panel → **Newsletters** → Kreiraj novi
2. Napiši naslov i sadržaj (Lexical rich text editor)
3. Odaberi publiku (svi, newsletter pretplatnici, digest pretplatnici)
4. Klikni **"Pošalji newsletter"**
5. Job se kreira u queue i šalje u batchevima od 50 emailova

### Payload Jobs

| Task | Opis | Retry |
|------|------|-------|
| `sendPostNotificationBatch` | Batched obavijesti o novim postovima | 3x (exponential) |
| `sendWeeklyDigest` | Tjedni digest (auto-scheduled: pon 8:00) | 2x (fixed 5min) |
| `sendNewsletter` | Ručni newsletter | 3x (exponential) |

Jobs se automatski procesiraju svakih 5 minuta (`autoRun`). Nema potrebe za vanjskim cronom za obavijesti.

## Email Templates

Setup wizard seeda 7 email templateova koji se mogu urediti u admin panelu (Settings > Email Config):

| Template | Opis |
|----------|------|
| **Novi komentar (admin)** | Obavijest adminu o novom komentaru |
| **Komentar odobren** | Obavijest autoru da je komentar odobren |
| **Odgovor na komentar** | Obavijest o odgovoru na komentar |
| **Novi post (pretplatnici)** | Obavijest pretplatnicima o novom postu |
| **Potvrda pretplate** | Double opt-in email za newsletter |
| **Magic link login** | Passwordless login email |
| **Reset lozinke** | Email za resetiranje lozinke |

Templateovi koriste varijable poput `{{postTitle}}`, `{{authorName}}`, `{{magicLink}}` itd.

## RSS Auto-Poster

Sustav za automatski import, AI prijevod i objavljivanje članaka s vanjskih RSS feedova.

### Značajke

- **Automatski import** novih članaka s RSS feedova
- **AI prijevod** s engleskog na hrvatski (Claude AI)
- **Content Styles** — odaberite stil prijevoda po feedu (kratki, srednji, opširni)
- **SEO optimizacija** — automatski generira meta tagove i ključne riječi
- **Pixabay slike** — automatski pronađi relevantnu stock sliku
- **Deduplication** — sprječava duplicate importe
- **Media handling** — automatski download i optimizacija slika
- **Rate limiting** — poštuje ograničenja vanjskih servisa
- **Admin UI** — ručno pokretanje poll/process iz admin panela

### Workflow

1. **Poll** — `npm run rss:poll` dohvaća nove članke i sprema ih u `ImportedPosts` (status: `pending`)
2. **Process** — `npm run rss:process` prevodi s Claude AI, downloada slike, kreira draft postove
3. **Review** — Urednik pregledava draft postove u admin panelu i objavljuje ih

Više detalja: [docs/RSS-AUTO-POSTER.md](docs/RSS-AUTO-POSTER.md)

## Production Deployment

### Build & Start

```bash
npm run build
npm run start
```

### PM2 (preporučeno)

```bash
pm2 start ecosystem.config.cjs
pm2 restart magazin-cms
pm2 logs magazin-cms
```

### Cron Jobs

Dodaj u crontab (`crontab -e`):

```bash
# Publish scheduled posts (svake minute)
* * * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/publish-scheduled

# Cleanup old drafts (dnevno u 2am)
0 2 * * * curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/cleanup-drafts

# RSS poll (svakih 30 min) — opcionalno
*/30 * * * * cd /path/to/magazin-cms && npm run rss:poll >> /var/log/rss-poll.log 2>&1

# RSS process (svakih 5 min) — opcionalno
*/5 * * * * cd /path/to/magazin-cms && npm run rss:process >> /var/log/rss-process.log 2>&1
```

### Migracije

Schema se upravlja migracijama (`push: false`). Za nove migracije:

```bash
npx payload migrate:create
npx payload migrate
```

## Environment Variables

Setup wizard (`npm run setup`) automatski generira `.env`. Vidi `.env.example` za sve varijable.

### Obavezne

| Varijabla | Opis |
|-----------|------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PAYLOAD_SECRET` | JWT encryption secret (auto-generirano) |
| `NEXT_PUBLIC_SERVER_URL` | Public URL (bez trailing slash) |
| `CRON_SECRET` | Secret za cron job authentication (auto-generirano) |
| `PREVIEW_SECRET` | Secret za live preview (auto-generirano) |

### Opcionalne

| Varijabla | Opis |
|-----------|------|
| `CLAUDE_API_KEY` | Anthropic Claude API key za RSS prijevod |
| `PIXABAY_API_KEY` | Pixabay API key za stock slike |
| `RESEND_API_KEY` | Resend API key (fallback za email) |
| `SMTP_*` | SMTP konfiguracija (fallback za email) |
| `RSS_*` | RSS auto-poster tuning (vidi `.env.example`) |

> **Napomena**: Email konfiguracija se primarno postavlja u admin panelu (Settings > Email Config). Environment varijable služe kao fallback.

## Troubleshooting

### Server se ne pokreće

```bash
pm2 status
pm2 logs magazin-cms
npm run build && pm2 restart magazin-cms
```

### Database connection error

```bash
# Provjeri PostgreSQL
sudo systemctl status postgresql

# Testiraj konekciju
psql -h 127.0.0.1 -U your_user -d your_database
```

### Email se ne šalje

1. Provjeri konfiguraciju u admin panelu: Settings > Email Config
2. Testiraj slanje: Admin Panel > Email Config > Test Email
3. Ako nema DB config, provjeri `SMTP_*` ili `RESEND_*` u `.env`

### RSS import ne radi

1. Provjeri `CLAUDE_API_KEY` u `.env`
2. Testiraj feed: `npm run rss:test-feed -- <feed-url>`
3. Provjeri logs: `pm2 logs magazin-cms`
4. Vidi [docs/RSS-AUTO-POSTER.md](docs/RSS-AUTO-POSTER.md) za detalje

## Dokumentacija

| Dokument | Opis |
|----------|------|
| [README.md](README.md) | Ovaj dokument — pregled projekta i instalacija |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | Vodič za administratore — korištenje admin panela |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment upute |
| [API_REFERENCE.md](API_REFERENCE.md) | API dokumentacija |
| [docs/RSS-AUTO-POSTER.md](docs/RSS-AUTO-POSTER.md) | RSS auto-poster dokumentacija |
| [.env.example](.env.example) | Sve environment varijable s opisima |

## License

MIT
