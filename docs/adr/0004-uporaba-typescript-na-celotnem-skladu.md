# Uporaba TypeScript na celotnem skladu

## Kontekst in opis problema

Sistem sestavljata spletni odjemalec (React) in zaledni strežnik (Node.js/Express). Uporaba različnih jezikov ali dinamično tipiziranega JavaScripta pogosto povzroča neskladja pri prenosu podatkov prek API-ja in otežuje refaktoriranje.

## Obravnavane alternative

* TypeScript na obeh straneh (React + Express)
* Čisti JavaScript (ES6+) na obeh straneh
* Mešan sklad (npr. Python/FastAPI za backend in TypeScript za frontend)

## Sprejeta odločitev in utemeljitev

Izbrana možnost: "TypeScript na obeh straneh", ker omogoča enoten programski jezik v celotnem repozitoriju, neposredno souporabo podatkovnih tipov med odjemalcem in strežnikom ter zgodnje odkrivanje napak že v fazi prevajanja.

### Posledice

* Dobro, ker statično preverjanje tipov preprečuje napake že med razvojem pred zagonom.
* Dobro, ker omogoča varno in hitrejše refaktoriranje programske kode.
* Dobro, ker nudi polno podporo za samodejno dopolnjevanje v urejevalniku kode.
* Slabo, ker zahteva konfiguracijo prevajalnika (`tsconfig.json`) in dodaten korak prevajanja.
* Slabo, ker zahteva začetni čas za definiranje vseh tipov in vmesnikov.
