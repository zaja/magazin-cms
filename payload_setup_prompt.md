# PROMPT 1: Ubuntu Server Setup + Payload CMS Instalacija

```
Pomoći ću ti postaviti Payload CMS na Ubuntu serveru. Ovo je potpuno prazan Ubuntu server i treba napraviti sve od početka.

ZADATAK 1 - PRIPREMA UBUNTU SERVERA:

1. Instaliraj sve potrebne dependency-je:
   - Node.js 20.x LTS (koristiti nvm za instalaciju)
   - npm latest verziju
   - PostgreSQL 16
   - Git
   - Nginx (za reverse proxy)
   - PM2 (za process management)

2. Konfiguriraj PostgreSQL:
   - Kreiraj novu bazu podataka: payload_cms_db
   - Kreiraj database user: payload_user sa sigurnom lozinkom
   - Omogući remote connections ako je potrebno
   - Testiraj konekciju

3. Setup firewall (ufw):
   - Dozvoli SSH (port 22)
   - Dozvoli HTTP (port 80)
   - Dozvoli HTTPS (port 443)
   - Dozvoli PostgreSQL (port 5432) samo lokalno

ZADATAK 2 - PAYLOAD CMS INSTALACIJA:

1. Kreiraj direktorij za projekt u /var/www/payload-cms

2. Instaliraj Payload CMS sa TypeScript template-om:
   - npx create-payload-app@latest u /var/www/payload-cms
   - Odaberi: Database - PostgreSQL
   - Odaberi: Email adapter - Resend (dodaj i Nodemailer kao fallback)

3. Konfiguriraj environment varijable (.env):
   ```
   DATABASE_URI=postgresql://payload_user:password@localhost:5432/payload_cms_db
   PAYLOAD_SECRET=[generisi random secret]
   PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
   
   # Email - SMTP
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   SMTP_FROM_EMAIL=
   SMTP_FROM_NAME=
   
   # Email - Resend
   RESEND_API_KEY=
   RESEND_FROM_EMAIL=
   
   # Default admin
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=[generisi jak password]
   ```

4. Testiraj instalaciju:
   - npm run dev
   - Provjeri da li se aplikacija pokreće na localhost:3000
   - Provjeri pristup admin panelu na /admin
   - Provjeri database konekciju

ZADATAK 3 - PRODUCTION SETUP:

1. Build aplikaciju za production:
   - npm run build

2. Setup PM2:
   - Kreiraj PM2 ecosystem config (ecosystem.config.js)
   - Start aplikacija kroz PM2
   - Omogući auto-restart na reboot
   - pm2 save

3. Setup Nginx reverse proxy:
   - Konfiguriraj Nginx da proxy-a port 3000
   - Setup basic cache headers
   - Pripremi za SSL (kasnije dodavanje Let's Encrypt)

4. Kreiraj init script za automatski kreiranje admin usera na prvom pokretanju

NAPOMENE:
- Svi passwordi i secreti moraju biti generirani sigurno
- Payload folder mora imati ispravne permissions (www-data)
- Logovi moraju biti dostupni za debugging
- Kreiraj README.md sa instrukcijama za maintenance

Nakon što završiš, daj mi:
1. Sve korake koje si izvršio
2. Credentials za admin pristup
3. Database connection detalje
4. Status svih servisa
5. Eventualne errore ili warnings
```

---

# PROMPT 2: Izgradnja CMS Admin Panela - Collections i Features

```
Sada kada je Payload CMS instaliran, trebaš izgraditi kompletan CMS sa svim potrebnim kolekcijama i funkcionalnostima.

PROJEKT STRUKTURA:
/var/www/payload-cms/
├── src/
│   ├── collections/
│   │   ├── Pages.ts
│   │   ├── Posts.ts
│   │   ├── Tags.ts
│   │   ├── Categories.ts
│   │   ├── Comments.ts
│   │   ├── Media.ts
│   │   ├── Users.ts
│   │   └── Subscribers.ts
│   ├── globals/
│   │   ├── Settings.ts
│   │   ├── SEO.ts
│   │   └── EmailConfig.ts
│   ├── fields/
│   │   ├── slug.ts
│   │   ├── seo.ts
│   │   └── richText.ts
│   ├── hooks/
│   │   ├── emailNotifications.ts
│   │   └── versionControl.ts
│   ├── utilities/
│   │   ├── emailService.ts (SMTP + Resend)
│   │   └── i18n.ts
│   ├── translations/
│   │   ├── en.json
│   │   └── hr.json
│   └── payload.config.ts

---

ZADATAK 1 - KONFIGURIRAJ PAYLOAD.CONFIG.TS:

1. Setup osnovne opcije:
   - Admin panel URL: /admin
   - Server URL iz env varijable
   - TypeScript strict mode

2. Konfiguriraj i18n (internacionalizacija):
   - Default jezik: English (en)
   - Dodatni jezici: Hrvatski (hr)
   - Implementiraj language switcher u admin panelu
   - Svi UI elementi moraju biti prevedeni

3. Setup authentication:
   - Email + password login
   - Cookie based sessions
   - Token expiration: 7 dana
   - Password requirements (min 8 chars, uppercase, number)

4. Upload/Media postavke:
   - Max file size: 10MB
   - Dozvoljeni tipovi: images (jpg, png, webp, svg), videos (mp4, webm), documents (pdf, doc, docx)
   - Automatska generacija thumbnails: small (300px), medium (800px), large (1920px)
   - Image optimization na upload

5. Email adapter konfiguracija:
   - Primary: Resend API (iz env)
   - Fallback: Nodemailer SMTP (iz env)
   - Email templates folder

---

ZADATAK 2 - KREIRAJ COLLECTIONS:

### 1. PAGES COLLECTION (Pages.ts)

Fields:
- title (text, required, localized hr/en)
- slug (text, unique, auto-generate from title)
- content (richText - TipTap editor sa svim funkcionalnostima)
- status (select: draft, published, archived)
- featuredImage (upload relationship)
- seo (group):
  - metaTitle (text, max 60 chars)
  - metaDescription (textarea, max 160 chars)
  - metaKeywords (text)
  - ogImage (upload relationship)
  - ogTitle (text)
  - ogDescription (textarea)
- publishDate (date)
- author (relationship -> Users)

Features:
- **Versions**: Enable drafts and published versions
- **Version History**: Track all changes with restore functionality
- **Auto-save**: Every 30 seconds
- Access Control: Admin i Editor mogu create/edit

Hooks:
- beforeChange: Auto-generate slug from title
- afterChange: Clear cache, send notifications if published

---

### 2. POSTS COLLECTION (Posts.ts)

Fields:
- title (text, required, localized)
- slug (text, unique)
- excerpt (textarea, required, max 300 chars) // ISJEČAK
- content (richText - TipTap)
- featuredImage (upload, required)
- categories (relationship -> Categories, has many)
- tags (relationship -> Tags, has many)
- status (select: draft, scheduled, published, archived)
- publishDate (date, can be future for scheduling)
- author (relationship -> Users)
- readingTime (number, auto-calculated)
- viewCount (number, default 0)
- allowComments (checkbox, default true)
- seo (group - same as Pages)

Features:
- **Versions**: Enable full version history
- **Auto-save**: Every 30 seconds
- **Scheduled Publishing**: Cron job checks publishDate
- Reading time calculator (words / 200 WPM)

Hooks:
- beforeChange: Calculate reading time, auto-generate slug
- afterChange: 
  - Send email to subscribers (novi post notifikacija)
  - Clear cache
  - Update sitemap

---

### 3. TAGS COLLECTION (Tags.ts)

Fields:
- name (text, required, unique, localized)
- slug (text, unique)
- description (textarea, optional)
- color (text, hex color picker)
- postCount (number, virtual field - calculated)

Features:
- Simple CRUD
- Auto-count related posts

Hooks:
- beforeChange: Auto-generate slug
- beforeDelete: Check if used in posts (prevent deletion)

---

### 4. CATEGORIES COLLECTION (Categories.ts)

Fields:
- name (text, required, localized)
- slug (text, unique)
- description (richText)
- parent (relationship -> self, for nested categories)
- image (upload)
- order (number, for sorting)

Features:
- Hierarchical structure (parent/child)
- Drag & drop reordering in admin

---

### 5. COMMENTS COLLECTION (Comments.ts)

Fields:
- post (relationship -> Posts, required)
- parentComment (relationship -> self, for nested replies)
- author (group):
  - name (text, required)
  - email (email, required)
  - website (text, url validation, optional)
  - avatar (text, Gravatar URL auto-generated)
- content (textarea, required)
- status (select: pending, approved, spam, deleted)
- ipAddress (text, auto-captured)
- userAgent (text, auto-captured)
- subscribedToReplies (checkbox, default false)
- createdAt (date, auto)

Features:
- Nested comments (threads)
- Spam detection (simple keyword filter)
- Email notifications kada se odobri

Hooks:
- afterCreate: 
  - Send email to admin (novi komentar pending)
  - If parent comment exists, notify original commenter (ako je subscribed)
- afterChange:
  - If status changed to 'approved', send notification to commenter
  - If reply to comment, notify parent commenter

---

### 6. MEDIA COLLECTION (Media.ts)

Ovo će već biti dio Payload upload-a, ali treba extended fields:

Additional Fields:
- altText (text, required for images - SEO)
- caption (textarea)
- credit (text)
- tags (relationship -> Tags)
- folder (text, for organization)
- usageCount (number, tracks where it's used)

Features:
- Advanced filters (by type, size, date, tags)
- Bulk operations (delete, tag, move to folder)
- Image editing (crop, resize) - integriraj Cloudinary ili sharp library

---

### 7. SUBSCRIBERS COLLECTION (Subscribers.ts)

Fields:
- email (email, unique, required)
- name (text, optional)
- status (select: active, unsubscribed, bounced)
- preferences (group):
  - newPosts (checkbox, default true)
  - commentReplies (checkbox, default true)
  - newsletter (checkbox, default true)
- subscribedAt (date)
- confirmedAt (date)
- unsubscribedAt (date)
- confirmationToken (text, hidden)

Features:
- Double opt-in email confirmation
- Unsubscribe link generation
- Preference center

Hooks:
- afterCreate: Send confirmation email
- beforeChange: Generate unsubscribe token

---

### 8. USERS COLLECTION (Users.ts)

Extend default Payload Users:

Additional Fields:
- firstName (text)
- lastName (text)
- bio (textarea)
- avatar (upload)
- role (select: admin, editor, author, subscriber)
- social (group):
  - twitter (text)
  - linkedin (text)
  - website (text)

Access Control:
- Admin: Full access
- Editor: Can manage all content except users
- Author: Can only manage own posts
- Subscriber: Read-only access

---

ZADATAK 3 - GLOBALS (Globalne Postavke):

### 1. SETTINGS GLOBAL (Settings.ts)

Fields:
- siteName (text, required, localized)
- siteDescription (textarea, localized)
- logo (upload)
- favicon (upload)
- domain (text, url)
- language (select: en, hr, default en)
- timezone (select)
- postsPerPage (number, default 10)
- dateFormat (text)
- allowRegistration (checkbox)
- moderateComments (checkbox, default true)
- maintenanceMode (checkbox)
- maintenanceMessage (richText)

---

### 2. SEO GLOBAL (SEO.ts)

Default SEO settings:

Fields:
- defaultMetaTitle (text)
- defaultMetaDescription (textarea)
- defaultOgImage (upload)
- twitterHandle (text)
- googleAnalyticsId (text)
- googleSiteVerification (text)
- structuredDataOrganization (json):
  - name
  - logo
  - social links
- robots (textarea, default robots.txt content)
- sitemap (group):
  - enabled (checkbox)
  - priority (number)
  - changefreq (select)

---

### 3. EMAIL CONFIG GLOBAL (EmailConfig.ts)

Fields:
- provider (select: smtp, resend)
- smtp (group):
  - host (text)
  - port (number)
  - secure (checkbox)
  - user (text)
  - password (text, encrypted)
  - fromEmail (email)
  - fromName (text)
- resend (group):
  - apiKey (text, encrypted)
  - fromEmail (email)
  - fromName (text)
- templates (group):
  - newCommentAdmin (richText)
  - newCommentApproved (richText)
  - commentReply (richText)
  - newPostSubscriber (richText)
  - subscribeConfirmation (richText)
  - passwordReset (richText)
- testEmail (email, for sending test emails)

UI:
- "Send Test Email" button in admin
- Email template preview
- Last sent emails log (last 50)

---

ZADATAK 4 - UTILITIES & SERVICES:

### 1. Email Service (utilities/emailService.ts)

Funkcije:
```typescript
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  template?: string;
  data?: any;
}

class EmailService {
  async send(options: EmailOptions): Promise<void>
  async sendWithResend(options: EmailOptions): Promise<void>
  async sendWithSMTP(options: EmailOptions): Promise<void>
  async renderTemplate(template: string, data: any): Promise<string>
  async sendTestEmail(to: string): Promise<void>
}
```

Features:
- Auto fallback (Resend fails → SMTP)
- Template rendering (Handlebars ili EJS)
- Queue system (Bull.js) za bulk emails
- Rate limiting
- Logging svih poslatih emailova

---

### 2. i18n Utility (utilities/i18n.ts)

Funkcije:
- Load translations from JSON files
- Interpolation support
- Pluralization rules
- Date/time formatting po locale
- Number formatting

---

ZADATAK 5 - HOOKS & AUTOMATION:

### 1. Email Notifications Hook (hooks/emailNotifications.ts)

Implementiraj:
- newCommentNotification (admin dobiva email)
- commentApprovedNotification (commenter dobiva email)
- commentReplyNotification (parent commenter dobiva email)
- newPostNotification (subscriberi dobivaju email)
- welcomeEmailSubscriber (nakon confirmation)

Svaki email mora imati:
- Unsubscribe link
- Preference center link
- HTML i plain text verziju

---

### 2. Version Control Hook (hooks/versionControl.ts)

Features:
- Auto-save draft svake izmjene
- Compare versions UI
- Restore to previous version funkcija
- Show who made changes i kada
- Diff view (što se promijenilo)

---

ZADATAK 6 - ADMIN UI CUSTOMIZATION:

1. Custom Dashboard:
   - Statistika: Broj postova, komentara, subscribera
   - Recent activity feed
   - Quick actions (New Post, Approve Comments)
   - Storage usage meter

2. Custom Components:
   - TipTap Rich Text Editor custom config:
     - Headings (H1-H6)
     - Bold, Italic, Underline, Strike
     - Lists (bullet, numbered)
     - Link insertion
     - Image upload inline
     - Code blocks (syntax highlighting)
     - Tables
     - Blockquotes
     - Horizontal rule
     - Text color & highlight
     - Undo/Redo
     - Character count

3. Media Library enhancements:
   - Grid/List view toggle
   - Folder organization
   - Bulk upload
   - Image crop/resize modal (integriraj react-image-crop)
   - Advanced filters

4. Language Switcher:
   - Dropdown u admin header-u
   - Svaki admin može odabrati svoj jezik
   - Content fields su localized (en/hr)

---

ZADATAK 7 - FRONTEND API ROUTES:

Kreiraj REST API endpoints za frontend:

```
GET  /api/posts - Lista postova (pagination, filters)
GET  /api/posts/:slug - Single post
GET  /api/pages/:slug - Single page
GET  /api/tags - Svi tagovi
POST /api/comments - Submit komentar
POST /api/subscribe - Subscribe to newsletter
GET  /api/search?q=term - Search content
```

Svi endpoints trebaju:
- Cache headers (60 min)
- CORS configuration
- Rate limiting
- Error handling

---

ZADATAK 8 - CRON JOBS & SCHEDULED TASKS:

Setup node-cron ili Payload jobs:

1. Scheduled post publishing (svaki 1 min):
   - Provjeri Posts gdje je publishDate <= now && status = 'scheduled'
   - Update status to 'published'
   - Send notifikacije subscriberima

2. Email queue processing (svaki 30 sec):
   - Process pending emails from queue

3. Cleanup old drafts (daily u 2am):
   - Delete drafts older than 30 days

4. Sitemap regeneration (daily u 3am):
   - Generate fresh sitemap.xml

5. Database backup (daily u 4am):
   - Backup PostgreSQL database

---

ZADATAK 9 - TRANSLATIONS:

Kreiraj potpune prijevode:

**src/translations/hr.json:**
```json
{
  "general": {
    "save": "Spremi",
    "cancel": "Odustani",
    "delete": "Obriši",
    "edit": "Uredi",
    ...
  },
  "collections": {
    "posts": {
      "singular": "Objava",
      "plural": "Objave",
      ...
    },
    ...
  },
  "fields": {
    "title": "Naslov",
    "content": "Sadržaj",
    ...
  }
}
```

Pokrij SVE UI elemente admin panela.

---

ZADATAK 10 - TESTING & SECURITY:

1. Security:
   - CSRF protection
   - Rate limiting na API endpoints
   - Input sanitization (prevent XSS)
   - SQL injection protection (Payload već ima)
   - File upload validation
   - Helmet.js za security headers

2. Environment validation:
   - Provjeri sve env varijable na startup
   - Kreiraj .env.example

3. Error handling:
   - Custom error pages (404, 500)
   - Error logging (Winston ili Pino)
   - Sentry integration (optional)

---

ZADATAK 11 - DOKUMENTACIJA:

Kreiraj:

1. **README.md** sa:
   - Project overview
   - Installation steps
   - Environment variables
   - Deployment instructions
   - API documentation
   - Troubleshooting

2. **ADMIN_GUIDE.md** (na hrvatskom):
   - Kako kreirati post
   - Kako uploadati media
   - Kako moderirati komentare
   - Kako koristiti verzije
   - Kako slati newslettere

3. **API_REFERENCE.md**:
   - Svi API endpoints
   - Request/response primjeri
   - Authentication

---

FINALNI CHECKLIST:

Nakon što završiš SVE gore navedeno, provjeri:

✅ Admin panel radi na /admin
✅ Mogu se kreirati Pages i Posts
✅ TipTap editor radi savršeno
✅ Media library s upload/crop/resize radi
✅ Komentari se mogu submitati i moderirati
✅ Email notifikacije rade (testiraj SMTP i Resend)
✅ Hrvatski jezik je potpuno preveden
✅ Version history i restore rade
✅ SEO fields su dostupni svugdje
✅ Scheduled publishing radi
✅ Subscribe/unsubscribe flow radi
✅ API endpoints vraćaju podatke
✅ Database backup automatski radi
✅ Security headers su postavljeni
✅ Error handling je implementiran
✅ Dokumentacija je kompletna

---

KONAČNI KORAK:

Daj mi:
1. Kompletnu strukturu direktorija
2. Sve kreirane kolekcije i njihova polja
3. Screenshots admin panela (Pages, Posts, Media, Settings)
4. Test rezultate (email, verzije, API)
5. Lista svih instaliranih npm paketa
6. Production deployment checklist
7. Backup i restore proceduru

VAŽNO:
- TypeScript strict mode za sve
- ESLint + Prettier konfiguracija
- Svi passwordi i API keys SAMO u .env
- Git ignore .env file
- Napravi initial commit nakon što sve radi
```

---

# BONUS PROMPT: Frontend Next.js Integracija (Opciono)

```
Nakon što je admin panel kompletno postavljen, kreiraj Next.js 15 frontend aplikaciju koja konzumira Payload CMS API.

STRUKTURA:
/var/www/payload-frontend/
├── app/
│   ├── [locale]/
│   │   ├── (pages)/
│   │   │   ├── [slug]/page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   │   └── tag/[slug]/page.tsx
│   │   ├── subscribe/page.tsx
│   │   └── layout.tsx
│   └── api/
│       ├── comments/route.ts
│       └── subscribe/route.ts
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── BlogCard.tsx
│   ├── CommentForm.tsx
│   └── SubscribeForm.tsx
└── lib/
    └── payload.ts (API helper functions)

Features:
- Server-side rendering (SSR) za SEO
- Static generation (SSG) za Pages
- Incremental Static Regeneration (ISR) za Blog
- Multi-language support (en/hr)
- Tailwind CSS styling
- TypeScript
- Responsive design
- Image optimization (next/image)

ZADATAK:
Implementiraj kompletan frontend sa:
1. Homepage (featured posts, latest posts)
2. Blog lista sa pagination
3. Single blog post sa komentarima
4. Pages rendering
5. Tag archive
6. Search functionality
7. Subscribe forma
8. Language switcher
9. SEO optimization (metadata, structured data)
10. Sitemap i robots.txt generacija

Koristi Payload REST API za sve podatke.
```

---

# KAKO KORISTITI OVE PROMPTE:

1. **Kopiraj PROMPT 1** u Claude Code
2. Pričekaj da završi setup servera i Payload instalaciju
3. **Kopiraj PROMPT 2** u Claude Code  
4. Pričekaj izgradnju kompletnog CMS-a
5. **(Opciono) Kopiraj BONUS PROMPT** za frontend

Svaki prompt daje Claude-u precizne instrukcije što treba napraviti. Claude Code će automatski kreirati sve datoteke, instalirati pakete, konfigurirati sve i dati ti feedback.