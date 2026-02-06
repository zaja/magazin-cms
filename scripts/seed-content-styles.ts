/**
 * Seed default content styles
 * Run with: npx tsx scripts/seed-content-styles.ts
 */

import { getPayload } from 'payload'
import config from '../src/payload.config'

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

async function seed() {
  const payload = await getPayload({ config })

  await payload.updateGlobal({
    slug: 'content-styles',
    data: {
      styles: [
        {
          name: 'Kratki sažetak',
          key: 'short',
          description: 'Kratak članak od 3-5 paragrafa (150-400 riječi). Samo ključne informacije.',
          prompt: SHORT_PROMPT,
          maxTokens: 4096,
          isDefault: true,
        },
        {
          name: 'Srednji članak',
          key: 'medium',
          description: 'Članak srednje dužine od 5-10 paragrafa (400-800 riječi). Detaljniji s kontekstom.',
          prompt: MEDIUM_PROMPT,
          maxTokens: 8192,
          isDefault: false,
        },
        {
          name: 'Opširni članak',
          key: 'full',
          description: 'Opširan članak od 10-20 paragrafa (800-1500+ riječi). Gotovo potpuni prijevod.',
          prompt: FULL_PROMPT,
          maxTokens: 16000,
          isDefault: false,
        },
      ],
    },
  } as any)

  console.log('✅ Content styles seeded successfully!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
