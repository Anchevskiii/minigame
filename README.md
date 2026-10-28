# [REDACTED] — Spletna igra z ugibanjem cenzuriranih besedil

Spletna igra z besedami, kjer igralci postopoma razkrivajo cenzuriran enciklopedični članek (Wikipedia) in z logičnim sklepanjem ugotavljajo naslov oziroma glavno temo članka.

---

## 🛠️ Uporabljene tehnologije

| Področje | Tehnologija |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite |
| **Oblikovanje** | Tailwind CSS |
| **Backend API** | Node.js, Express, TypeScript |
| **Podatkovna baza** | PostgreSQL (Supabase) |
| **Dostop do baze (ORM)** | Prisma ORM |
| **Avtentikacija** | Supabase Auth (JWT) |

---

## 📁 Struktura repozitorija

```text
├── frontend/       # Uporabniški vmesnik (React + Vite)
├── backend/        # Zaledni strežnik (Express API)
└── docs/           # Projektna dokumentacija
    ├── wireframes/ # Žični modeli (WF-01 do WF-04)
    └── adr/        # Arhitekturne odločitve (MADR zapisi)
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

---

## 🚀 Lokalni zagon

```bash
# Namestitev odvisnosti
npm install

# Zagon razvojnega strežnika
npm run dev
```
Aplikacija bo dostopna na `http://localhost:5173`.
