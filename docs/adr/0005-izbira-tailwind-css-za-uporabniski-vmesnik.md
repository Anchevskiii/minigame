# Izbira Tailwind CSS za oblikovanje uporabniškega vmesnika

## Kontekst in opis problema

Uporabniški vmesnik igre zahteva specifično retro vizualno podobo (cenzurirani bloki besedila, videz pisalnega stroja, podpora za temno temo in CRT način). Kako učinkovito pristopiti k oblikovanju brez obsežnih nepreglednih CSS datotek ali togih komponentnih knjižnic?

## Obravnavane alternative

* Tailwind CSS
* Klasični ločeni CSS / CSS moduli
* Vnaprej pripravljena knjižnica komponent (MUI, Ant Design)

## Sprejeta odločitev in utemeljitev

Izbrana možnost: "Tailwind CSS", ker s pristopom orodnih razredov omogoča hitro stiliziranje neposredno v JSX komponentah, preprosto podporo za menjavo tem ter majhno končno CSS datoteko v produkciji.

### Posledice

* Dobro, ker omogoča hitro prilagajanje videza komponent po meri brez zapuščanja JSX kode.
* Dobro, ker preprosto podpira različne teme s pomočjo Tailwind razredov.
* Dobro, ker orodje ob gradnji samodejno odstrani neuporabljene sloge.
* Slabo, ker povzroča daljše sezname razredov v JSX atributih `className`.
* Slabo, ker zahteva poznavanje specifičnih imen razredov knjižnice Tailwind.
