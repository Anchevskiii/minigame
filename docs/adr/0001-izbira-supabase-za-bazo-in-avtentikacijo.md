# Izbira Supabase za podatkovno bazo in avtentikacijo

## Kontekst in opis problema

Za delovanje spletne igre potrebujemo zanesljivo relacijsko bazo podatkov (uporabniki, uganke, statistika) in varen sistem za avtentikacijo (registracija, prijava, JWT seje). Kako vzpostaviti zaledno infrastrukturo z minimalnim časom postavitve in vzdrževanja?

## Obravnavane alternative

* Supabase (upravljan PostgreSQL + Supabase Auth)
* Lastna PostgreSQL instanca z lastno avtentikacijo
* Firebase (Firestore NoSQL + Firebase Auth)

## Sprejeta odločitev in utemeljitev

Izbrana možnost: "Supabase", ker ponuja polno gostovano PostgreSQL bazo ter že vgrajen sistem za avtentikacijo uporabnikov, kar bistveno pospeši začetek razvoja in odpravi potrebo po ročnem upravljanju strežnika.

### Posledice

* Dobro, ker omogoča takojšnjo uporabo brez konfiguracije lastnega strežnika za bazo.
* Dobro, ker ima že vgrajeno varno hrambo gesel in izdajanje JWT žetonov za seje.
* Dobro, ker omogoča neposreden dostop prek standardnega PostgreSQL protokola.
* Slabo, ker ustvarja odvisnost od zunanjega ponudnika storitve v oblaku.
* Slabo, ker se brezplačna instanca ob daljši neaktivnosti začasno zaustavi.
