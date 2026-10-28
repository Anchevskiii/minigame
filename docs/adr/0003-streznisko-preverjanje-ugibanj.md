# Preverjanje ugibanj na strežniku

## Kontekst in opis problema

V igri z ugibanjem cenzuriranih enciklopedičnih člankov je ključno preprečiti goljufanje. Če bi odjemalec v brskalniku prejel celotno necenzurirano besedilo ali rešitev, bi jo bilo enostavno prebrati preko orodij za razvijalce (DevTools).

## Obravnavane alternative

* Strežniško preverjanje preko REST API
* Odjemalsko preverjanje v brskalniku
* Šifrirano besedilo na odjemalcu z delnim dešifriranjem

## Sprejeta odločitev in utemeljitev

Izbrana možnost: "Strežniško preverjanje preko REST API", ker rešitev in polno necenzurirano besedilo ostaneta izključno na strežniku, odjemalec pa pošlje poskus in prejme le indekse razkritih besed ter število najdb.

### Posledice

* Dobro, ker preprečuje goljufanje, saj rešitev nikoli ne zapusti strežnika pred koncem igre.
* Dobro, ker omogoča centraliziran nadzor nad številom poskusov in porabljenimi namigi.
* Slabo, ker vsako ugibanje zahteva omrežno zahtevo in delujočo internetno povezavo.
* Slabo, ker povzroča večjo obremenitev strežnika pri velikem številu sočasnih igralcev.
