# Vodič za Administratore - Magazin CMS

## Sadržaj

1. [Prijava u Admin Panel](#prijava-u-admin-panel)
2. [Kreiranje Objava](#kreiranje-objava)
3. [Upravljanje Medijima](#upravljanje-medijima)
4. [Moderiranje Komentara](#moderiranje-komentara)
5. [Upravljanje Pretplatnicima](#upravljanje-pretplatnicima)
6. [Verzije i Drafts](#verzije-i-drafts)
7. [Zakazano Objavljivanje](#zakazano-objavljivanje)
8. [SEO Postavke](#seo-postavke)
9. [Globalne Postavke](#globalne-postavke)

---

## Prijava u Admin Panel

1. Otvorite `/admin` u pregledniku
2. Unesite email i lozinku
3. Kliknite "Prijava"

### Uloge korisnika

| Uloga | Ovlasti |
|-------|---------|
| **Admin** | Puni pristup svim postavkama i sadržaju |
| **Editor** | Može uređivati sav sadržaj, ali ne i korisnike |
| **Author** | Može kreirati i uređivati samo svoje objave |
| **Subscriber** | Samo čitanje |

---

## Kreiranje Objava

### Nova objava

1. Idite na **Objave** u lijevom izborniku
2. Kliknite **Kreiraj novu**
3. Ispunite polja:
   - **Naslov** (obavezno)
   - **Isječak** - kratki opis do 300 znakova (obavezno)
   - **Sadržaj** - koristi rich text editor
   - **Naslovna slika** - uploadajte sliku
   - **Kategorije** - odaberite jednu ili više
   - **Tagovi** - dodajte relevantne tagove

### Spremanje

- **Spremi kao draft** - objava neće biti vidljiva na stranici
- **Objavi** - objava postaje vidljiva odmah
- **Zakažaj** - postavite datum objave u budućnosti

### Rich Text Editor

Editor podržava:
- Naslove (H1-H6)
- **Podebljano**, *kurziv*, ~~precrtano~~
- Numerirane i nenumerirane liste
- Linkove
- Slike inline
- Blokove koda
- Tablice
- Citate

---

## Upravljanje Medijima

### Upload

1. Idite na **Media** u lijevom izborniku
2. Kliknite **Kreiraj novu** ili povucite datoteke
3. Ispunite:
   - **Alt tekst** (obavezno za SEO)
   - **Naslov**
   - **Credit** - autor fotografije

### Podržani formati

- **Slike**: JPG, PNG, WebP, SVG, GIF
- **Video**: MP4, WebM
- **Dokumenti**: PDF, DOC, DOCX

### Veličine slika

Sustav automatski generira:
- Thumbnail (300px)
- Small (480px)
- Medium (768px)
- Large (1024px)
- XLarge (1920px)
- OG Image (1200x630px)

---

## Moderiranje Komentara

### Pregled komentara

1. Idite na **Komentari** u lijevom izborniku
2. Filtrirajte po statusu:
   - **Pending** - čekaju odobrenje
   - **Approved** - odobreni
   - **Spam** - označeni kao spam
   - **Deleted** - obrisani

### Odobravanje komentara

1. Otvorite komentar
2. Promijenite status na **Approved**
3. Spremite

> **Napomena**: Kad odobrite komentar, autor će automatski primiti email obavijest (ako je konfiguriran email).

### Brisanje komentara

1. Otvorite komentar
2. Promijenite status na **Deleted**
3. Spremite

---

## Upravljanje Pretplatnicima

### Pregled pretplatnika

1. Idite na **Pretplatnici** u lijevom izborniku
2. Vidjet ćete listu svih pretplatnika s njihovim statusom

### Statusi

| Status | Značenje |
|--------|----------|
| **Pending** | Čeka potvrdu emailom |
| **Active** | Aktivni pretplatnik |
| **Unsubscribed** | Odjavljen |

### Postavke pretplatnika

Svaki pretplatnik može odabrati:
- Obavijesti o novim objavama
- Obavijesti o odgovorima na komentare
- Newsletter

---

## Verzije i Drafts

### Autosave

Sustav automatski sprema vaš rad svakih 30 sekundi.

### Verzije

1. Otvorite objavu
2. Kliknite na **Verzije** tab
3. Vidjet ćete povijest svih promjena
4. Kliknite na verziju za pregled
5. Kliknite **Vrati** za vraćanje na tu verziju

### Draft vs Published

- **Draft** - radna verzija, nije vidljiva na stranici
- **Published** - javno dostupna verzija

Možete imati draft promjene dok je objavljena verzija još uvijek aktivna.

---

## Zakazano Objavljivanje

### Kako zakazati objavu

1. Kreirajte novu objavu ili otvorite postojeći draft
2. U desnom sidebaru pronađite **Datum objave**
3. Postavite datum i vrijeme u budućnosti
4. Status ostavite na **Draft**
5. Spremite

Sustav će automatski objaviti sadržaj u zadano vrijeme.

> **Napomena**: Cron job provjerava zakazane objave svake minute.

---

## SEO Postavke

### SEO za pojedinačnu objavu

Svaka objava ima SEO tab s poljima:
- **Meta naslov** - do 60 znakova
- **Meta opis** - do 160 znakova
- **OG slika** - slika za društvene mreže

### Globalne SEO postavke

1. Idite na **Globals** → **SEO**
2. Postavite:
   - Default meta naslov
   - Default meta opis
   - Default OG slika
   - Google Analytics ID
   - Structured Data

---

## Globalne Postavke

### Site Settings

1. Idite na **Globals** → **Settings**
2. Konfigurirajte:
   - **Naziv stranice**
   - **Opis stranice**
   - **Logo**
   - **Favicon**
   - **Objava po stranici**
   - **Maintenance mode**

### Email Konfiguracija

1. Idite na **Globals** → **Email Config**
2. Odaberite provider (SMTP ili Resend)
3. Ispunite potrebne podatke
4. Testirajte slanje

---

## Često Postavljana Pitanja

### Kako promijeniti lozinku?

1. Kliknite na svoje ime u gornjem desnom kutu
2. Odaberite **Account**
3. Unesite novu lozinku
4. Spremite

### Kako dodati novog korisnika?

1. Idite na **Korisnici**
2. Kliknite **Kreiraj novog**
3. Ispunite podatke i odaberite ulogu
4. Spremite

### Slika se ne prikazuje?

1. Provjerite je li slika uploadana
2. Provjerite je li ispunjen alt tekst
3. Osvježite stranicu

---

## Kontakt

Za tehničku podršku kontaktirajte administratora sustava.
