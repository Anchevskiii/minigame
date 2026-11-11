# [REDACTED] — Spletna igra z ugibanjem cenzuriranih besedil

[![CI Pipeline](https://github.com/Anchevskiii/minigame/actions/workflows/ci.yml/badge.svg)](https://github.com/Anchevskiii/minigame/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.x-2d3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ed.svg)](https://www.docker.com/)
[![Linter](https://img.shields.io/badge/Linter-Oxlint-orange.svg)](https://oxc-project.github.io/)

**[REDACTED]** je spletna deduktivna igra z besedami, kjer igralci postopoma dešifrirajo in razkrivajo cenzuriran enciklopedični članek (Wikipedia). Z logičnim sklepanjem, prepoznavanjem konteksta in strateškim ugibanjem ključnih pojmov poskušajo ugotoviti naslov oziroma osrednjo temo članka.

Projekt je zgrajen po načelih **varnosti na prvem mestu (*Security-First*)**, čiste arhitekture, modularnosti in sodobnih inženirskih praks z avtomatiziranim testiranjem ter popolno podporo za Docker okolje.

---

## 🌟 Glavne funkcionalnosti

* **Strežniški Anti-Cheat mehanizem ([ADR 0003](docs/adr/0003-streznisko-preverjanje-ugibanj.md)):** Neodkrite besede so maskirane z bloki (`█`). Brskalnik nikoli ne prejme celotnega besedila ali naslova članka vnaprej; naslov in Wikipedia vir se razkrijeta šele ob strežniško potrjeni zmagi.
* **Pametno razkrivanje s Porter Stemmerjem:** Algoritem samodejno povezuje sklanjatve, množino in korene besed (npr. *gravitacija* $\rightarrow$ *gravitacijski*, *planet* $\rightarrow$ *planeti*).
* **Stopnjevan sistem pomoči (namigi):**
  * Do 3 osnovni namigi na igro (razkritje pomembne kontekstualne besede).
  * 1 namig za naslov (razkritje posamezne besede v naslovu, na voljo pri večbesednih naslovih s potrditvenim oknom).
* **Dostopnost in prilagodljivost tem ([ADR 0005](docs/adr/0005-izbira-tailwind-css-za-uporabniski-vmesnik.md)):** 3 barvne teme (Temna, Svetla, Visokokontrastna - WCAG AAA), prilagojena tipografija in sintetični zvočni učinki preko Web Audio API.
* **Uredniška konzola z SSRF zaščito ([US-10](docs/05-uporabniske-zgodbe.md)):** Uvoz poljubnega članka iz Wikipedije, avtomatska tokenizacija, koledar načrtovanih objav in samodejni razporejevalnik ob 00:00 UTC.
* **Upravljanje vlog (RBAC):** Vloge `PLAYER`, `EDITOR` in `ADMIN` z zaščito pred samo-odvzemom skrbniških pravic.
* **Igralna statistika, nizi in značke:** Spremljanje zgodovine, natančnosti, niza zmag (*streak*), dnevne lestvice ter sistem 6 odklepljivih dosežkov.

---

## 🛠️ Tehnološki sklad

| Sloj | Tehnologije |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti |
| **Backend API** | Node.js 20, Express, TypeScript, tsx |
| **Podatkovna baza** | PostgreSQL 16 (Lokalni Docker vsebnik ali oblačni Supabase) |
| **ORM & Migracije** | Prisma ORM 6 (`prisma/schema.prisma` — 8 tabel + 5 PostgreSQL `ENUM` tipov) |
| **Avtentikacija & Varnost** | JWT, Bcrypt / Supabase Auth, Helmet, CORS, Express Rate Limit, SSRF filter |
| **Kakovost & Testi** | Oxlint (ultra hiter linter), TypeScript strict check, avtomatizirani E2E testi pogojev sprejemljivosti |
| **Kontejnerizacija & CI** | Docker, Docker Compose (Multi-stage build), GitHub Actions Pipeline |

---

## 🚀 Hitri zagon (3 načini vzpostavitve)

Izberite način, ki najbolj ustreza vašim trenutnim potrebam:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. ALL-IN-ONE DOCKER:  `docker compose up --build`                          │
│    -> En sam ukaz. Dvigne bazo, zgradi app, potisne shemo, seeda podatke.  │
│    -> Odprite http://localhost:3001                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. LOKALNI RAZVOJ (PRIPOROČENO):                                            │
│    -> `docker compose up postgres -d`  (dvigne samo bazo)                   │
│    -> `npm install && npm run db:setup && npm run dev`                      │
│    -> Odprite http://localhost:5173 (Vite HMR)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. KONTEJNERSKI LIVE-RELOAD:                                                │
│    -> `docker compose -f docker-compose.dev.yml up`                         │
│    -> Vse teče v Dockerju z montirano kodo in takojšnjim osveževanjem.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Možnost 1: All-in-One Docker (Najhitreje za preizkus / Ocenjevanje)

Ne potrebujete nameščenega Node.js ali Prisme — potrebujete le Docker:

```bash
# 1. Klonirajte repozitorij
git clone https://github.com/Anchevskiii/minigame.git
cd minigame

# 2. Zaženite celoten sistem z enim ukazom
docker compose up --build
```

**Kaj se zgodi v ozadju?**
1. Zažene se vsebnik `postgres:16-alpine` s trajnim volumnom `pgdata`.
2. Aplikacijski vsebnik počaka na zdravstveni signal baze (*healthcheck*).
3. Samodejno se izvede `prisma db push` (generiranje tabel in ENUM tipov).
4. Samodejno se izvede `prisma db seed` (idempotentno polnjenje začetnih uporabnikov in ugank).
5. Zažene se produkcijski Express strežnik, ki na istem portu streži API in React aplikacijo.

👉 Odprite brskalnik na: **`http://localhost:3001`**

*Za zaustavitev vnesite `Ctrl+C` ali v drugem terminalu `docker compose down` (podatki v bazi se ohranijo).*

---

### Možnost 2: Lokalni razvoj (Baza v Dockerju, koda lokalno) — *Priporočeno za razvijalce*

Najboljša izbira za aktivno programiranje, pisanje testov in takojšnje razhroščevanje:

```bash
# 1. Zaženite lokalno PostgreSQL bazo v ozadju
docker compose up postgres -d

# 2. Pripravite okoljske spremenljivke
cp .env.example .env

# 3. Namestite odvisnosti
npm install

# 4. Sinhronizirajte bazo in napolnite začetne podatke
npm run db:setup

# 5. Zaženite razvojni strežnik s sočasnim backendom in Vite HMR
npm run dev
```

* **Frontend (Vite HMR):** `http://localhost:5173`
* **Backend API:** `http://localhost:3001`
* **Prisma Studio (Pregledovalnik baze):** `npx prisma studio` (odpre `http://localhost:5555`)

---

### Možnost 3: Kontejnerski razvoj v živo (Live Reload v Dockerju)

Če želite razvijati povsem znotraj kontejnerjev, a še vedno imeti takojšnje osveževanje kode (*Hot Module Replacement*):

```bash
docker compose -f docker-compose.dev.yml up
```

Lokalne mape `src/`, `backend/`, `prisma/` in `public/` so zvezane v vsebnik, zato se vsaka sprememba datoteke takoj pozna na `http://localhost:5173`.

---

### Možnost 4: Brez Dockerja (Vgrajena spominska shramba)

Če na računalniku nimate nameščenega Dockerja ali zunanje baze, aplikacija samodejno preklopi na varno vgrajeno spominsko shrambo (*In-Memory Store*):

```bash
npm install
npm run dev
```

Aplikacija naloži pripravljene uganke iz `public/puzzles/` in deluje takoj za gostujočega uporabnika in demo račune.

---

## 🔑 Predpripravljeni demo računi

V oknu za prijavo lahko z enim klikom izberete enega izmed demonstracijskih računov (geslo za vse je **`geslo123`**):

| Vloga | E-pošta | Geslo | Dovoljenja in zmožnosti |
| :--- | :--- | :--- | :--- |
| **Igralec (`PLAYER`)** | `igralec@redacted.si` | `geslo123` | Igranje dnevne uganke in arhiva, beleženje niza zmag, osebna statistika, odklepanje značk, pregled lestvice |
| **Urednik (`EDITOR`)** | `urednik@redacted.si` | `geslo123` | Vse pravice igralca + **Uredniška konzola** (uvoz iz Wikipedije z SSRF zaščito, urejanje cenzure, načrtovanje v koledarju) |
| **Administrator (`ADMIN`)** | `admin@redacted.si` | `geslo123` | Vse pravice urednika + **Upravljanje uporabnikov** (dodeljevanje in spreminjanje vlog z zaščito pred samo-odvzemom) |

---

## 🧪 Testiranje, kakovost kode in CI/CD cevovodi

Projekt ima vgrajene skripte za preverjanje kakovosti in avtomatske teste:

```bash
# Zagon celotne zbirke E2E testov pogojev sprejemljivosti (US-01 do US-15) in logike igre
npm test

# Hiter statični pregled kode (Oxlint)
npm run lint

# Preverjanje TypeScript tipov in produkcijska gradnja
npm run build
```

### GitHub Actions CI Cevovod (`.github/workflows/ci.yml`)

Repozitorij vsebuje avtomatiziran CI delovni tok za GitHub Actions, ki se sproži ob vsakem potisku (*push*) ali zahtevku za združitev (*pull request*) na vejah `main` in `development`:
1. **Storitev PostgreSQL:** Samodejno zažene preizkusni PostgreSQL vsebnik.
2. **Predpomnjenje odvisnosti (*Dependency Cache*):** Uporablja `actions/setup-node` s predpomnjenjem `npm` za hitro izvajanje.
3. **Pregled kakovosti:** Zažene `oxlint`.
4. **Validacija podatkovnega modela:** Izvede `prisma generate`, `prisma db push` in `prisma db seed`.
5. **Gradnja aplikacije:** Preveri TypeScript prevajanje in Vite paket (`npm run build`).
6. **Avtomatski testi:** Izvede celotno zbirko testov pogojev sprejemljivosti (`npm test`).

---

## 💾 Upravljanje baze podatkov (Prisma ORM)

| Ukaz | Opis |
| :--- | :--- |
| `npm run db:setup` | Sinhronizira shemo baze podatkov in napolni začetne podatke (push + seed) |
| `npm run db:push` | Posodobi tabele in PostgreSQL ENUM tipe v bazi glede na `schema.prisma` |
| `npm run db:seed` | Zažene idempotentno skripto `prisma/seed.ts` (uporablja `upsert`, ne briše podatkov) |
| `npx prisma studio` | Odpre vizualni brskalnik po bazi podatkov na `http://localhost:5555` |

---

## 📁 Struktura repozitorija

```text
├── .github/
│   └── workflows/ci.yml       # GitHub Actions avtomatiziran CI/CD cevovod
├── backend/                   # Express zaledni API strežnik (TypeScript)
│   └── src/
│       ├── lib/               # Prisma odjemalec in hibridna shramba
│       ├── middleware/        # JWT avtentikacija, RBAC in varnost (Helmet, RateLimit)
│       ├── routes/            # API končne točke (auth, game, stats, leaderboard, admin)
│       └── utils/             # Porter Stemmer, maskiranje ugank, SSRF Wikipedia uvoznik
├── prisma/                    # Prisma podatkovni model (8 tabel + 5 PostgreSQL ENUM tipov)
│   ├── schema.prisma          # Shema baze podatkov
│   └── seed.ts                # Idempotentno začetno polnjenje baze
├── public/puzzles/            # Vzorčne in arhivske enciklopedične uganke
├── scripts/                   # Avtomatizirani E2E testi pogojev sprejemljivosti in igre
├── src/                       # React 19 Frontend uporabniški vmesnik
│   ├── components/            # Komponente glave, dokumenta, vnosne vrstice, modalnih oken
│   ├── context/               # AuthContext (stanje prijave in uporabniške vloge)
│   ├── hooks/                 # Reaktivni kavlji (useGame, useTheme, useModals)
│   └── utils/                 # Zvočni učinki (Web Audio API), deljenje rezultatov
├── docs/                      # Celovita tehnična dokumentacija projekta
│   ├── wireframes/            # Žični modeli (WF-01 do WF-04)
│   └── adr/                   # Arhitekturne odločitve (ADR 0001 do ADR 0006)
├── docker-compose.yml         # Privzeta All-in-One Docker konfiguracija
├── docker-compose.dev.yml     # Kontejnerska razvojna konfiguracija z Live Reload
├── Dockerfile                 # Večstopenjska produkcijska gradnja (Multi-stage build)
├── Dockerfile.dev             # Razvojna Docker gradnja
└── docker-entrypoint.sh       # Samodejni inicializacijski zaganjalnik z zdravstvenim pregledom
```

---

## 📚 Tehnična dokumentacija in arhitekturne odločitve (ADR)

* [01 - Zasnova rešitve](docs/01-zasnova-resitve.md)
* [02 - Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
* [03 - Podatkovni model](docs/03-podatkovni-model.md)
* [04 - Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
* [05 - Uporabniške zgodbe in pogoji sprejemljivosti](docs/05-uporabniske-zgodbe.md)
* [06 - Žični modeli](docs/06-wireframes.md)

### Arhitekturni zapisi (MADR)
* [ADR 0001: Izbira Supabase za bazo in avtentikacijo](docs/adr/0001-izbira-supabase-za-bazo-in-avtentikacijo.md)
* [ADR 0002: Uporaba Prisma ORM za dostop do baze podatkov](docs/adr/0002-uporaba-prisma-orm.md)
* [ADR 0003: Preverjanje ugibanj na strežniku (Anti-Cheat maskiranje)](docs/adr/0003-streznisko-preverjanje-ugibanj.md)
* [ADR 0004: Uporaba TypeScript na celotnem skladu](docs/adr/0004-uporaba-typescript-na-celotnem-skladu.md)
* [ADR 0005: Izbira Tailwind CSS za uporabniški vmesnik](docs/adr/0005-izbira-tailwind-css-za-uporabniski-vmesnik.md)
* [ADR 0006: Uporaba PostgreSQL ENUM tipov](docs/adr/0006-uporaba-postgresql-enum-tipov.md)

---

## 📄 Licenca

Projekt je odprtokoden pod licenco MIT.
