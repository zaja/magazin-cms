/**
 * Seed default data required for CMS to function properly.
 * Seeds: Content Styles + Email Templates
 * Run with: npx tsx scripts/seed-defaults.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// ─── Lexical helpers ───────────────────────────────────────────────

const lexicalParagraph = (text: string) => ({
  type: 'paragraph',
  children: [
    { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
  ],
  direction: 'ltr' as const,
  format: '' as const,
  indent: 0,
  version: 1,
})

const wrapRoot = (children: object[]) => ({
  root: {
    type: 'root',
    children,
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

// ─── Content Style Prompts ─────────────────────────────────────────

const SHORT_PROMPT = `Ti si novinar i urednik za hrvatski tech/news portal.

ZADATAK: Napiši KRATAK članak na hrvatskom temeljen na ovom izvornom članku. NE prevodi doslovno - sažmi i prepiši ključne informacije.

ORIGINALNI NASLOV: {title}

ORIGINALNI SADRŽAJ:
{content}

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
  },
  "imageKeywords": "2-4 engleske ključne riječi za stock fotografiju"
}

VAŽNO: Odgovori SAMO sa JSON objektom. Članak mora biti KRATAK i INFORMATIVAN.`

const MEDIUM_PROMPT = `Ti si novinar i urednik za hrvatski tech/news portal.

ZADATAK: Napiši SREDNJE DUŽINE članak na hrvatskom temeljen na ovom izvornom članku. Zadrži sve važne detalje, ali prepiši svojim riječima.

ORIGINALNI NASLOV: {title}

ORIGINALNI SADRŽAJ:
{content}

PRAVILA PISANJA:
1. Napiši članak od 5-10 paragrafa (400-800 riječi ukupno)
2. Zadrži sve VAŽNE informacije, citate i podatke
3. Dodaj kontekst i objašnjenja gdje je potrebno
4. Piši u informativnom, novinarskom stilu
5. Koristi prirodni hrvatski jezik - ne doslovan prijevod
6. HTML format: koristi <p> za paragrafe, <strong> za naglašavanje, <h3> za podnaslove
7. Prenesi važne direktne citate (2-4 max)
8. Dodaj podnaslove za bolju čitljivost

STRUKTURA ČLANKA:
- Uvodni paragraf: tko, što, kada, gdje (najvažnije odmah)
- Razvoj priče: detalji, kontekst, pozadina
- Citati i izjave relevantnih osoba
- Analiza ili implikacije
- Zaključak: budući razvoj ili perspektiva

SEO PRAVILA:
1. Meta naslov: max 60 znakova, privlačan za klik
2. Meta opis: 150-160 znakova, informativan
3. Keywords: 5-8 ključnih riječi za hrvatski market
4. Excerpt: 200-300 znakova

IZLAZNI FORMAT - striktno JSON:
{
  "title": "privlačan naslov na hrvatskom",
  "content": "<p>Paragraf 1...</p><h3>Podnaslov</h3><p>Paragraf 2...</p>",
  "excerpt": "kratki sažetak (200-300 znakova)",
  "seo": {
    "metaTitle": "SEO naslov (max 60 znakova)",
    "metaDescription": "SEO opis (150-160 znakova)",
    "keywords": ["ključna riječ 1", "ključna riječ 2"]
  },
  "imageKeywords": "2-4 engleske ključne riječi za stock fotografiju"
}

VAŽNO: Odgovori SAMO sa JSON objektom.`

const FULL_PROMPT = `Ti si novinar i urednik za hrvatski tech/news portal.

ZADATAK: Napiši OPŠIRNI članak na hrvatskom temeljen na ovom izvornom članku. Prenesi gotovo sve informacije iz originala, ali prepiši svojim riječima na hrvatskom.

ORIGINALNI NASLOV: {title}

ORIGINALNI SADRŽAJ:
{content}

PRAVILA PISANJA:
1. Napiši opširan članak od 10-20 paragrafa (800-1500+ riječi)
2. Prenesi SVE važne informacije, podatke, citate i detalje
3. Zadrži dubinu i kontekst originalnog članka
4. Dodaj objašnjenja tehničkih pojmova za hrvatsku publiku
5. Piši u profesionalnom novinarskom stilu
6. Koristi prirodni hrvatski jezik - ne doslovan prijevod
7. HTML format: koristi <p>, <strong>, <em>, <h3>, <h4>, <blockquote>, <ul>/<li>
8. Prenesi sve važne direktne citate
9. Koristi podnaslove za strukturu
10. Dodaj kontekst specifičan za hrvatsko/europsko tržište gdje je relevantno

STRUKTURA ČLANKA:
- Uvodni paragraf: snažan lead koji privlači pažnju
- Razvoj priče: kronološki ili tematski
- Detaljni podaci i statistike
- Citati i izjave svih relevantnih osoba
- Kontekst i pozadina
- Analiza i implikacije
- Zaključak: perspektiva i budući razvoj

SEO PRAVILA:
1. Meta naslov: max 60 znakova, privlačan za klik
2. Meta opis: 150-160 znakova, informativan
3. Keywords: 8-12 ključnih riječi za hrvatski market
4. Excerpt: 250-300 znakova

IZLAZNI FORMAT - striktno JSON:
{
  "title": "privlačan naslov na hrvatskom",
  "content": "<p>Paragraf 1...</p><h3>Podnaslov</h3><p>Paragraf 2...</p>",
  "excerpt": "kratki sažetak (250-300 znakova)",
  "seo": {
    "metaTitle": "SEO naslov (max 60 znakova)",
    "metaDescription": "SEO opis (150-160 znakova)",
    "keywords": ["ključna riječ 1", "ključna riječ 2"]
  },
  "imageKeywords": "2-4 engleske ključne riječi za stock fotografiju"
}

VAŽNO: Odgovori SAMO sa JSON objektom. Članak mora biti DETALJAN i INFORMATIVAN.`

// ─── Main seed function ────────────────────────────────────────────

async function seedDefaults() {
  console.log('\n🌱 Seeding default data...\n')

  const payload = await getPayload({ config })

  // ── 1. Content Styles ──────────────────────────────────────────
  console.log('📝 Seeding content styles...')

  await payload.updateGlobal({
    slug: 'content-styles',
    data: {
      styles: [
        {
          name: 'Kratki sažetak',
          key: 'short',
          description:
            'Kratak članak od 3-5 paragrafa (150-400 riječi). Samo ključne informacije.',
          prompt: SHORT_PROMPT,
          maxTokens: 4096,
          isDefault: true,
        },
        {
          name: 'Srednji članak',
          key: 'medium',
          description:
            'Članak srednje dužine od 5-10 paragrafa (400-800 riječi). Detaljniji s kontekstom.',
          prompt: MEDIUM_PROMPT,
          maxTokens: 8192,
          isDefault: false,
        },
        {
          name: 'Opširni članak',
          key: 'full',
          description:
            'Opširan članak od 10-20 paragrafa (800-1500+ riječi). Gotovo potpuni prijevod.',
          prompt: FULL_PROMPT,
          maxTokens: 16000,
          isDefault: false,
        },
      ],
    },
  } as any)

  console.log('   ✅ Content styles: short, medium, full')

  // ── 2. Email Templates ─────────────────────────────────────────
  console.log('📧 Seeding email templates...')

  await payload.updateGlobal({
    slug: 'email-config',
    data: {
      templates: {
        newCommentAdminSubject: 'Novi komentar na post: {{postTitle}}',
        newCommentAdmin: wrapRoot([
          lexicalParagraph(
            'Korisnik {{authorName}} je ostavio novi komentar na post "{{postTitle}}":',
          ),
          lexicalParagraph('{{commentContent}}'),
          lexicalParagraph('Pregledaj komentar u admin panelu: {{adminUrl}}'),
        ]),
        commentApprovedSubject: 'Vaš komentar je odobren!',
        commentApproved: wrapRoot([
          lexicalParagraph('Pozdrav {{authorName}},'),
          lexicalParagraph(
            'Vaš komentar na post "{{postTitle}}" je odobren i sada je vidljiv svima.',
          ),
          lexicalParagraph('Pogledajte ga ovdje: {{postUrl}}'),
        ]),
        commentReplySubject: 'Novi odgovor na vaš komentar: {{postTitle}}',
        commentReply: wrapRoot([
          lexicalParagraph('Pozdrav {{authorName}},'),
          lexicalParagraph(
            '{{replyAuthor}} je odgovorio na vaš komentar na postu "{{postTitle}}".',
          ),
          lexicalParagraph('Pogledajte odgovor: {{postUrl}}'),
        ]),
        newPostSubscriberSubject: 'Novi članak: {{postTitle}}',
        newPostSubscriber: wrapRoot([
          lexicalParagraph('{{postExcerpt}}'),
          lexicalParagraph('Pročitajte cijeli članak: {{postUrl}}'),
          lexicalParagraph(
            'Ne želite više primati obavijesti? {{unsubscribeUrl}}',
          ),
        ]),
        subscribeConfirmationSubject: 'Potvrdite pretplatu na newsletter',
        subscribeConfirmation: wrapRoot([
          lexicalParagraph(
            'Hvala na pretplati na naš newsletter! Kliknite na link ispod da potvrdite svoju email adresu:',
          ),
          lexicalParagraph('{{confirmUrl}}'),
          lexicalParagraph(
            'Ako niste zatražili ovu pretplatu, možete ignorirati ovaj email ili se odjaviti: {{unsubscribeUrl}}',
          ),
        ]),
        passwordResetSubject: 'Resetiranje lozinke',
        passwordReset: wrapRoot([
          lexicalParagraph('Pozdrav {{userName}},'),
          lexicalParagraph(
            'Primili smo zahtjev za resetiranje vaše lozinke. Kliknite na link ispod da postavite novu lozinku:',
          ),
          lexicalParagraph('{{resetUrl}}'),
          lexicalParagraph(
            'Ako niste zatražili resetiranje lozinke, možete ignorirati ovaj email.',
          ),
        ]),
        magicLinkSubject: 'Vaš link za prijavu',
        magicLink: wrapRoot([
          lexicalParagraph('Pozdrav,'),
          lexicalParagraph(
            'Primili smo zahtjev za prijavu na vaš račun ({{email}}). Kliknite na link ispod da se prijavite:',
          ),
          lexicalParagraph('{{loginUrl}}'),
          lexicalParagraph(
            'Link vrijedi {{expiresIn}}. Ako niste zatražili prijavu, možete ignorirati ovaj email.',
          ),
        ]),
        weeklyDigestSubject: 'Tjedni pregled — {{postCount}} novih članaka',
        weeklyDigest: wrapRoot([
          lexicalParagraph('Evo što smo objavili ovaj tjedan:'),
          lexicalParagraph('{{postList}}'),
          lexicalParagraph(
            'Upravljaj obavijestima: {{preferencesUrl}} · Odjavi se: {{unsubscribeUrl}}',
          ),
        ]),
        postNotificationBatchSubject: '{{postCount}} novih članaka na portalu',
        postNotificationBatch: wrapRoot([
          lexicalParagraph('Objavljeni su novi članci:'),
          lexicalParagraph('{{postList}}'),
          lexicalParagraph(
            'Upravljaj obavijestima: {{preferencesUrl}} · Odjavi se: {{unsubscribeUrl}}',
          ),
        ]),
      } as any,
    },
  })

  console.log('   ✅ Email templates: 9 templates seeded')

  console.log('\n✅ All defaults seeded successfully!\n')
  process.exit(0)
}

seedDefaults().catch((err) => {
  console.error('\n❌ Seed failed:', err)
  process.exit(1)
})
