# Uporaba Prisma ORM za dostop do podatkovne baze

## Kontekst in opis problema

Za komunikacijo med Express strežnikom in PostgreSQL bazo potrebujemo orodje za upravljanje sheme in izvajanje poizvedb. Ročno pisanje SQL poizvedb prinaša tveganje za sintaktične napake in ne nudi tipske varnosti v TypeScriptu.

## Obravnavane alternative

* Prisma ORM
* Neobdelan SQL prek gonilnika pg
* TypeORM

## Sprejeta odločitev in utemeljitev

Izbrana možnost: "Prisma ORM", ker omogoča deklarativno modeliranje v `schema.prisma`, samodejno generira stroge TypeScript tipe za vse tabele ter vključuje orodje Prisma Studio za vizualni pregled podatkov.

### Posledice

* Dobro, ker so podatkovni modeli v bazi in TypeScript kodi vedno samodejno usklajeni.
* Dobro, ker preprečuje napake v poizvedbah in ščiti pred SQL vbrizgavanjem.
* Dobro, ker omogoča preproste migracije sheme z ukazom `prisma db push`.
* Slabo, ker zahteva dodaten korak generiranja odjemalca (`prisma generate`).
* Slabo, ker kompleksnejše analitične poizvedbe včasih zahtevajo neobdelan SQL.
