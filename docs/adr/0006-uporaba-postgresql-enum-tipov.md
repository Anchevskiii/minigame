# Uporaba PostgreSQL ENUM tipov za fiksna stanja

## Kontekst in opis problema

V podatkovnem modelu imamo več atributov s fiksnim naborom veljavnih vrednosti: vloge uporabnikov (`Role`), težavnost ugank (`Difficulty`) in statusi sej (`SessionStatus`). Kako zagotoviti veljavnost teh podatkov brez nepotrebnega zapletanja sheme?

## Obravnavane alternative

* PostgreSQL ENUM tipi
* Navadni tekstovni nizi (VARCHAR)
* Ločene šifrantične tabele s tujimi ključi

## Sprejeta odločitev in utemeljitev

Izbrana možnost: "PostgreSQL ENUM tipi", ker zagotavljajo integriteto podatkov neposredno na ravni baze, Prisma ORM pa iz njih samodejno generira ustrezne TypeScript tipe brez dodatnih poizvedb.

### Posledice

* Dobro, ker baza podatkov samodejno zavrne neveljavne vnose ali tipkarske napake.
* Dobro, ker so vrednosti avtomatsko usklajene med bazo in TypeScript kodo.
* Dobro, ker zasedajo manj pomnilnika in se hitreje primerjajo kot navadni nizi.
* Slabo, ker dodajanje ali spreminjanje vrednosti v ENUM tipu zahteva migracijo baze.
