# [REDACTED] — Spletna igra z ugibanjem cenzuriranih besedil (MVP)

Spletna deduktivna igra z besedami, kjer igralci postopoma razkrivajo cenzuriran enciklopedični članek (Wikipedia) in z logičnim sklepanjem ugotavljajo naslov oziroma glavno temo članka.

Projekt je v celoti implementiran v skladu s specifikacijami v mapi [`docs/`](docs/) ter arhitekturnimi odločitvami ([`docs/adr/`](docs/adr/)).

---

## 🛠️ Uporabljene tehnologije

| Področje | Tehnologija |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite |
| **Oblikovanje** | Tailwind CSS v4 (3 barvne teme: Temna, Svetla, Visokokontrastna) |
| **Backend API** | Node.js, Express, TypeScript |
| **Podatkovna baza** | PostgreSQL (Supabase) + varen lokalni hibridni način |
| **Dostop do baze (ORM)** | Prisma ORM (`prisma/schema.prisma`) |
| **Avtentikacija in avtorizacija** | Supabase Auth (JWT) + RBAC (`PLAYER`, `EDITOR`, `ADMIN`) |
| **Varnost** | Helmet, CORS, Express Rate Limit, Anti-Cheat strežniško maskiranje, SSRF zaščita |

---

## 🔒 Varnostna zasnova (Security-First)

Ker je repozitorij javen, je aplikacija zasnovana z najvišjo stopnjo varnosti:
1. **Strežniško preverjanje ugibanj in Anti-Cheat maskiranje ([ADR 0003](docs/adr/0003-streznisko-preverjanje-ugibanj.md)):** Strežnik odjemalcu ob nalaganju igre nikoli ne pošlje surovega besedila skritih žetonov ali naslova članka. Neodkrite besede so maskirane z bloki `█`, polni naslov in povezava do Wikipedije pa se razkrijeta šele, ko strežnik potrdi zmago.
2. **Strogo ločevanje skrivnih ključev:** Strežniški ključi (`SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DIRECT_URL`) se uporabljajo izključno v zalednem strežniku (`backend/`) in niso nikoli izpostavljeni brskalniku (`VITE_*`). Datoteka `.env` je zaščitena v `.gitignore`.
3. **Zaščita API končnih točk:** Uporabljeni so varnostni vmesniki `helmet`, `cors` in `express-rate-limit` za zaščito pred zlorabami in brute-force napadi.
4. **SSRF zaščita pri uvozu iz Wikipedije:** Uredniški uvoznik (`backend/src/utils/wiki-importer.ts`) dovoljuje izključno varne `https://*.wikipedia.org/wiki/...` naslove.

---

## 📁 Struktura repozitorija

```text
├── backend/                  # Zaledni strežnik (Express API + TypeScript)
│   └── src/
│       ├── lib/              # Prisma odjemalec, Supabase Admin in hibridna shramba
│       ├── middleware/       # JWT avtentikacija, RBAC in varnostni vmesniki (Helmet/RateLimit)
│       ├── routes/           # API poti (auth, game, stats, leaderboard, admin)
│       └── utils/            # Strežniški Porter Stemmer, maskiranje ugank, Wikipedia uvoz
├── prisma/                   # Podatkovni model (8 tabel + 5 PostgreSQL ENUM tipov) in seed skripta
├── public/puzzles/           # Predpripravljene dnevne in arhivske uganke
├── scripts/                  # Avtomatski testi pogojev sprejemljivosti (US-01 do US-15)
├── src/                      # Uporabniški vmesnik (React + TypeScript + Tailwind CSS)
│   ├── components/           # Glava, dokument, vnosna vrstica, stranska vrstica, modalna okna
│   ├── context/              # AuthContext (prijava, registracija, vloge)
│   ├── hooks/                # Stanje igre (useGame), teme (useTheme), modalna okna (useModals)
│   └── utils/                # Zvočni učinki (Web Audio API), pravila namigov, deljenje rezultatov
└── docs/                     # Projektna dokumentacija in žični modeli
    ├── wireframes/           # Žični modeli (WF-01 do WF-04)
    └── adr/                  # Arhitekturne odločitve (ADR 0001 do ADR 0006)
```

---

## 🚀 Navodila za lokalni zagon

Aplikacija podpira **dva načina delovanja**:
1. **Takojšnji lokalni zagon (Gostujoči in Demo način)** — deluje takoj po namestitvi brez nastavljanja zunanjih ključev ali baze.
2. **Polni produkcijski način s Supabase PostgreSQL in Supabase Auth** — uporabi oblak Supabase, ko izpolnite datoteko `.env`.

### 1. korak: Namestitev odvisnosti

```bash
npm install
```

### 2. korak (Možnost A): Takojšnji zagon brez konfiguracije `.env`

Za takojšnji preizkus delovanja za **gostujočega uporabnika** ter **vse tri vloge (Igralec, Urednik, Administrator)**:

```bash
npm run dev
```

Ukaz hkrati zažene:
* **Backend API strežnik** na `http://localhost:3001`
* **Frontend Vite strežnik** na `http://localhost:5173` (s samodejnim posredovanjem `/api` klicev na `localhost:3001`)

Odprite brskalnik na **`http://localhost:5173`**.

#### 🔑 Predpripravljeni demonstracijski računi (v oknu »Prijava«):
V modalnem oknu za prijavo lahko z enim klikom izberete enega izmed predpripravljenih računov (geslo za vse je `geslo123`):

| Vloga | E-pošta | Geslo | Dostopne funkcionalnosti |
| :--- | :--- | :--- | :--- |
| **Igralec (`PLAYER`)** | `igralec@redacted.si` | `geslo123` | Igranje dnevne uganke in arhiva, sinhronizacija seje, osebna statistika, značke, lestvica |
| **Urednik (`EDITOR`)** | `urednik@redacted.si` | `geslo123` | Vse pravice igralca + **Uredniška konzola** (uvoz članka iz Wikipedije, predogled cenzure, koledar objav) |
| **Administrator (`ADMIN`)** | `admin@redacted.si` | `geslo123` | Vse pravice urednika + **Upravljanje vlog uporabnikov** (dodeljevanje vlog in zaščita pred samo-odvzemom) |

---

### 2. korak (Možnost B): Povezava s Supabase PostgreSQL in Prisma ORM

Če želite aplikacijo povezati s svojo Supabase PostgreSQL bazo:

1. Kopirajte predlogo okoljskih spremenljivk:
   ```bash
   cp .env.example .env
   ```
2. V datoteko `.env` vnesite podatke iz nadzorne plošče vašega Supabase projekta (`Project Settings -> Database` in `Project Settings -> API`):
   * `DATABASE_URL` in `DIRECT_URL`
   * `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   * `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. Ustvarite tabele in PostgreSQL `ENUM` tipe ter napolnite začetne podatke:
   ```bash
   npx prisma generate
   npm run db:push
   npm run db:seed
   ```
4. Zaženite aplikacijo:
   ```bash
   npm run dev
   ```

---

## 🧪 Preverjanje pogojev sprejemljivosti, grajenje in lintanje

V projektu so pripravljeni avtomatski testi, ki preverijo vse uporabniške zgodbe (`US-01` do `US-15`), strežniško maskiranje (`ADR 0003`) in varnostne mehanizme:

```bash
# Zagon end-to-end testov pogojev sprejemljivosti (US-01 do US-15) in logike igre
npm test

# Preverjanje kakovosti kode (Oxlint)
npm run lint

# Preverjanje tipov (TypeScript) in produkcijska gradnja (Vite)
npm run build
```

---

## 📚 Projektna dokumentacija

1. [01 - Zasnova rešitve](docs/01-zasnova-resitve.md)
2. [02 - Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
3. [03 - Podatkovni model](docs/03-podatkovni-model.md)
4. [04 - Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
5. [05 - Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
6. [06 - Žični modeli](docs/06-wireframes.md)

### Arhitekturne odločitve (ADR)
* [Predloga MADR](docs/adr/adr-template.md)
* [ADR 0001: Izbira Supabase za bazo in avtentikacijo](docs/adr/0001-izbira-supabase-za-bazo-in-avtentikacijo.md)
* [ADR 0002: Uporaba Prisma ORM za dostop do baze](docs/adr/0002-uporaba-prisma-orm.md)
* [ADR 0003: Preverjanje ugibanj na strežniku](docs/adr/0003-streznisko-preverjanje-ugibanj.md)
* [ADR 0004: Uporaba TypeScript na celotnem skladu](docs/adr/0004-uporaba-typescript-na-celotnem-skladu.md)
* [ADR 0005: Izbira Tailwind CSS za uporabniški vmesnik](docs/adr/0005-izbira-tailwind-css-za-uporabniski-vmesnik.md)
* [ADR 0006: Uporaba PostgreSQL ENUM tipov](docs/adr/0006-uporaba-postgresql-enum-tipov.md)
