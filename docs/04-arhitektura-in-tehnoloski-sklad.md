# 4. Arhitektura in tehnološki sklad

## Arhitekturna zasnova sistema

Aplikacija uporablja standardno **3-nivojsko spletno arhitekturo**, ki ločuje predstavitev, poslovno logiko in hrambo podatkov:

1. **Uporabniški vmesnik (Frontend):** Spletna aplikacija v brskalniku (React + TypeScript) za igranje, pregled rezultatov in urejanje vsebin. Za prijavo in upravljanje seje neposredno komunicira s storitvijo Supabase Auth.
2. **Strežnik (Backend API):** Zaledni strežnik v Node.js (Express + TypeScript) skrbi za preverjanje ugibanj, zaščito rešitev, izračun statistike ter preko **Prisma ORM** komunicira s PostgreSQL bazo.
3. **Podatkovna baza in avtentikacija (Supabase + PostgreSQL):** Gostovana PostgreSQL relacijska baza podatkov z vgrajenim sistemom za varno avtentikacijo uporabnikov (**Supabase Auth**).

---

## Arhitekturni diagram prenosa podatkov

```mermaid
flowchart TD
    Client[React Odjemalec]
    Auth[Supabase Auth]
    Server[Express Strežnik]
    DB[(PostgreSQL Baza)]
    Wiki[Wikipedia API]

    Client -->|1. Prijava in seja| Auth
    Client -->|2. REST API klici| Server
    Server -->|3. Prisma poizvedbe| DB
    Server -->|4. Uvoz člankov| Wiki
```

### Shematski pregled komunikacijskih tokov

| Korak | Od pošiljatelja | Do prejemnika | Protokol / Format | Namen komunikacije |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **React Odjemalec** | **Supabase Auth** | HTTPS / JWT | Registracija, prijava in pridobitev varnega sejnega žetona. |
| **2** | **React Odjemalec** | **Express Strežnik** | REST API (JSON) | Pošiljanje poskusov ugibanj, pridobivanje stanja uganke in lestvice. |
| **3** | **Express Strežnik** | **PostgreSQL Baza** | SQL prek Prisma ORM | Varno shranjevanje zgodovine iger, profilov in žetonov besedila. |
| **4** | **Express Strežnik** | **Wikipedia API** | HTTPS REST | Samodejni uvoz vsebine novih člankov ob pripravi dnevnih izzivov. |

---

## Glavni deli sistema in komunikacija

1. **Uporabniški vmesnik (Frontend):**
   * Prikazuje cenzurirani članek, vnosno polje za ugibanje, stransko vrstico s seznamom poskusov ter pregledna okna (lestvica, navodila, arhiv).
   * Za prijavo in registracijo uporablja odjemalca `@supabase/supabase-js`.
   * Za igralne podatke komunicira z Express strežnikom preko **REST API** klicev z JSON formatom.
2. **Zaledni strežnik (Backend API):**
   * Nudi končne točke za potek igre (`/api/game`), lestvico in profil (`/api/stats`, `/api/leaderboard`) ter urejanje ugank (`/api/admin/puzzles`).
   * Vmesni program (*auth middleware*) preveri Supabase JWT žeton, pridobi uporabnikovo vlogo (`PLAYER`, `EDITOR`, `ADMIN`) in zaščiti dostop do podatkov.
   * Skrbi za pošteno igro (rešitev članka ostane skrita na strežniku).
3. **Podatkovna baza in avtentikacija (Supabase PostgreSQL):**
   * Relacijska baza PostgreSQL, ki hrani profile igralcev, sezname ugank, vsebine ter dnevnike ugibanj.
   * Vgrajena shema `auth.users` samodejno skrbi za varno hrambo prijavnih podatkov.
4. **Prisma ORM:**
   * Omogoča popolnoma tipsko varno izvajanje poizvedb na strežniku preko preproste in berljive sheme (`schema.prisma`).
5. **Zunanji vir (Wikipedia API):**
   * Uredniški del strežnika iz javnega Wikipedia API-ja potegne besedilo izbranega članka, ga očisti in pripravi za cenzuro.

---

## Avtentikacija in upravljanje uporabnikov

* Za celoten proces avtentikacije se uporablja **Supabase Auth**.
* Supabase samodejno poskrbi za varno zgoščevanje gesel, potrjevanje elektronskih naslovov ter izdajo varnih **JWT sejnih žetonov**.
* Ob registraciji se v bazi ustvari zapis v `auth.users`, v naši javni tabeli `users` pa se zabeleži uporabniško ime ter vloga (`PLAYER`, `EDITOR`, `ADMIN`).
* Express strežnik ob vsaki zaščiteni zahtevi prebere žeton iz glave zahteve (`Authorization: Bearer <token>`) ali piškotka ter s pomočjo Supabase varnostnega ključa overi identiteto igralca.

---

## Tehnološki sklad

| Področje | Tehnologija | Razlog za izbiro |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Hiter razvoj, komponentna zgradba in zanesljivost zaradi strogih tipov. |
| **Stili (CSS)** | Tailwind CSS | Hitro in konsistentno oblikovanje z orodnimi razredi (utility classes) ter preprosto upravljanje tem. |
| **Backend** | Node.js + Express (TypeScript) | Preprost in zanesljiv strežnik, ki omogoča souporabo istih TypeScript tipov kot frontend. |
| **Podatkovna baza** | Supabase (PostgreSQL) | Zmogljiva PostgreSQL baza z vgrajenim spletnim pregledovalnikom podatkov. |
| **Dostop do baze (ORM)** | Prisma ORM | Enostavno modeliranje v `schema.prisma`, samodejne migracije in orodje **Prisma Studio**. |
| **Avtentikacija** | Supabase Auth | Pripravljen, varen in zanesljiv sistem za prijavo, registracijo in upravljanje JWT sej. |
| **Delo z besedilom** | Porter Stemmer / NLP orodja | Algoritem za prepoznavo korena besede, ki omogoča pametno odpiranje sorodnih oblik. |
| **Zvočni učinki** | Web Audio API | Sintetiziranje zvokov tipkanja neposredno v brskalniku brez zunanjih zvočnih datotek. |

---

## Pomembne odločitve in utemeljitve

1. **Izbira Supabase za bazo in avtentikacijo:**
   * Supabase omogoča hiter zagon PostgreSQL baze brez zapletenega ročnega nameščanja na operacijskem sistemu. Vgrajen Auth modul odpravi potrebo po ročnem pisanju kode za šifriranje gesel in upravljanje sej.
2. **Uporaba Prisma ORM:**
   * Prisma ponuja deklarativno shemo (`schema.prisma`) in orodje **Prisma Studio**, ki omogoča pregled nad tabelami neposredno v brskalniku, kar je zelo priročno za predstavitev delovanja sistema.
3. **Uporaba TypeScripta na odjemalcu in strežniku:**
   * Enaki modeli podatkov na obeh straneh preprečujejo napake pri prenosu podatkov prek API-ja.
4. **Preverjanje ugibanj na strežniku:**
   * Rešitev uganke ostane na strežniku, s čimer se prepreči goljufanje prek brskalnikovih razvojnih orodij (DevTools).
5. **Izbira Tailwind CSS za oblikovanje:**
   * Priljubljeno orodje, ki omogoča hiter in dosleden razvoj odzivnega vmesnika z namenskim sistemom razredov ter preprosto preklapljanje med temami.
6. **Uporaba PostgreSQL ENUM tipov:**
   * Za vloge (`Role`), težavnost (`Difficulty`), statuse (`PuzzleStatus`, `SessionStatus`) in kode dosežkov (`AchievementCode`) so uporabljeni našteti tipi (ENUM). To zagotavlja integriteto na ravni podatkovne baze ter avtomatsko generira stroge TypeScript tipe v kodi, s čimer se preprečijo napake zaradi zatipkov.

---

## Navodila za lokalni zagon

### Zahteve
* Nameščen Node.js (različica 20 ali novejša)
* Brezplačen račun na [Supabase.com](https://supabase.com) (ali lokalni Supabase CLI prek Dockerja)

### 1. Namestitev knjižnic
```bash
npm install
```

### 2. Nastavitev okoljskih spremenljivk
V korenski mapi ustvarimo datoteko `.env`:
```env
PORT=3001
# Povezava do Supabase PostgreSQL baze (za Prisma ORM)
DATABASE_URL="postgresql://postgres:[GESLO]@db.[PROJEKT].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[GESLO]@db.[PROJEKT].supabase.co:5432/postgres"

# Supabase API ključi (za avtentikacijo)
SUPABASE_URL="https://[PROJEKT].supabase.co"
SUPABASE_ANON_KEY="vaš-javni-anon-kljuc"
SUPABASE_SERVICE_ROLE_KEY="vaš-skrivni-service-kljuc"

NODE_ENV=development
```

### 3. Priprava baze s Prisma ORM
```bash
# Uveljavitev sheme na Supabase bazi
npx prisma db push

# (Opcijsko) Zagon vizualnega urejevalnika baze v brskalniku
npx prisma studio
```

### 4. Zagon aplikacije
```bash
# Sočasen zagon Express strežnika (port 3001) in Vite odjemalca (port 5173)
npm run dev
```

Aplikacija bo dostopna v brskalniku na naslovu `http://localhost:5173`.
