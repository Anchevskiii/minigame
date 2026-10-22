# 2. Funkcionalnosti in obseg rešitve

## Uporabniške vloge

V sistemu so opredeljene štiri jasne uporabniške vloge:

### 1. Gost (Neregistriran obiskovalec)
* **Kaj lahko počne:**
  * Brezplačno igra današnjo dnevno uganko.
  * Vnaša besede, uporablja pomoč z namigi in razkriva besedilo.
  * Izbira med tremi vizualnimi temami (svetla, temna, zeleni terminal) ter vklopi ali izklopi zvok.
  * Po končani igri lahko skopira kratek povzetek rezultata za deljenje.
* **Česa ne more početi:**
  * Nima trajnega profila, zato se njegovi dosežki ne shranjujejo v bazo podatkov.
  * Nima dostopa do arhiva preteklih ugank.
  * Ne more se uvrstiti na javno lestvico najboljših igralcev.
  * Nima dostopa do urejanja člankov ali upravljanja sistema.

### 2. Registriran igralec
* **Kaj lahko počne:**
  * Vse možnosti, ki jih ima Gost.
  * Prijava z uporabniškim imenom in geslom.
  * Trajno beleženje statistike (niz zaporednih zmag, odstotek pravilnih ugibanj, število iger).
  * Dostop do arhiva preteklih člankov in njihovo reševanje.
  * Uvrstitev na javno lestvico najboljših igralcev.
  * Odklepanje značk in posebnih dosežkov.
* **Česa ne more početi:**
  * Ne more dodajati, spreminjati ali brisati uradnih ugank.
  * Nima dostopa do skrbniškega dela aplikacije.

### 3. Urednik vsebin
* **Kaj lahko počne:**
  * Uvaža nove članke iz Wikipedije v sistem.
  * Določa težavnost uganke (lahka, srednja, težka) in nastavlja vnaprej razkrite besede.
  * Pregleduje in preizkuša uganko v varnem predogledu pred objavo.
  * Načrtuje objave v koledarju (sistem vsak dan ob polnoči samodejno objavi nov članek).
  * Spremlja statistiko reševanja posameznih člankov (npr. povprečno število poskusov).
* **Česa ne more početi:**
  * Ne more spreminjati nastavitev strežnika ali strukture baze podatkov.
  * Ne more spreminjati vlog drugim uporabnikom ali brisati računov.

### 4. Administrator
* **Kaj lahko počne:**
  * Upravlja uporabniške račune (dodeljevanje vlog, izbris ali blokiranje uporabnikov).
  * Nadzoruje varnost, pregleduje morebitne goljufije pri rezultatih in upravlja celoten sistem.

---

## Predvidene funkcionalnosti

Sistem vsebuje 12 vsebinskih funkcionalnosti. Šest izmed njih predstavlja jedro prve delujoče različice (**[MVP]**), od tega so štiri značilne za samo igro (domenske):

1. **Pametno razkrivanje besed s prepoznavo korena besede [MVP - Domenska]**
   Igralec vnaša besede v poljubni slovnični obliki. Sistem prepozna osnovni koren besede in sočasno odpre vse njene oblike (npr. vnos besede *"odkriti"* odpre tudi *"odkril"*, *"odkritje"*, *"odkrije"*).

2. **Sistem pomoči z dvema vrstama namigov [MVP - Domenska]**
   Ko se igralcu ustavi, lahko uporabi pomoč:
   * *Osnovni namig:* Razkrije eno naključno pogosto besedo v besedilu, kar pomaga razumeti temo.
   * *Glavni namig:* Razkrije eno besedo neposredno v naslovu članka.

3. **Interaktivni cenzurirani dokument [MVP - Domenska]**
   Prikaz besedila z začrnjenimi bloki točne dolžine skritih besed (`██████`). Ob pravilnem odgovoru se beseda animirano razkrije v zeleni barvi, stran pa se samodejno pomakne do prve najdene besede v besedilu.

4. **Kratek povzetek rezultata za deljenje [MVP - Domenska]**
   Po zmagi sistem pripravi besedilo z ikonami (emoji), ki prikaže število poskusov, natančnost in čas, ne da bi razkril rešitev. Igralec ga lahko z enim klikom skopira in pošlje prijateljem.

5. **Prijava in vodenje uporabniških profilov [MVP - Sistemska]**
   Varna registracija in prijava z uporabo Supabase Auth (upravljanje varnih JWT sej in uporabniških računov) ter ločevanje pravic med gosti, prijavljenimi igralci in uredniki.

6. **Shranjevanje in nadaljevanje igre [MVP - Sistemska]**
   Napredek pri reševanju (odprte besede, čas, porabljeni poskusi) se za prijavljenega uporabnika sproti shranjuje v bazo podatkov. Igralec lahko igro začne na telefonu in zaključi na računalniku.

7. **Zgodovinski arhiv preteklih ugank**
   Prijavljeni igralci lahko brskajo po preteklih dneh in za nazaj rešujejo uganke, ki so jih zamudili.

8. **Lestvica najboljših igralcev**
   Javna lestvica z dnevnimi rezultati in skupnim seštevkom zmag, razvrščena po številu poskusov in porabljenem času.

9. **Uredniški vmesnik za pripravo novih člankov**
   Enostaven obrazec, kjer urednik vnese povezavo do članka, pregleda izluščeno besedilo in določi datum objave.

10. **Značke in dosežki za igralce**
    Igralci z dosežki (npr. *"Prva zmaga"*, *"7 zaporednih dni zmag"*, *"Rešeno brez namigov"*) zbirajo značke in napredujejo po stopnjah znanja.

11. **Predlogi tem s strani igralcev**
    Igralci lahko predlagajo zanimive teme za prihodnje uganke, drugi uporabniki pa lahko zanje glasujejo.

12. **Izbira grafične podobe in zvočni učinki**
    Uporabnik lahko izbira med tremi vizualnimi temami (retro papir, temni način, zeleni računalniški zaslon) ter vklopi zvočne učinke tipkanja na pisalni stroj.

---

## Kasnejše nadgradnje

1. **Skupno reševanje za dva igralca:** Dva igralca prek spletne povezave sočasno rešujeta isti članek in si delita razkrite besede.
2. **Dodatna podpora za slovensko Wikipedijo:** Poseben lematizator za slovenski jezik, prilagojen slovenskim sklonov in glagolskim oblikam.
3. **Pametni opisi in dodatni namigi z umetno inteligenco:** Samodejno ustvarjanje kratkih zagonetnih namigov glede na besede, ki jih je igralec že odkril.
4. **Mobilna aplikacija z opomniki:** Možnost namestitve na telefon z opozorilom ob polnoči, ko je na voljo nov dnevni izziv.
5. **Hitrostni turnirji:** Časovno omejena tekmovanja v živo, kjer vsi prijavljeni istočasno tekmujejo, kdo najhitreje ugane naslov članka.

---

## Izven obsega (Out of Scope)

* **Igranje v živo z nizko zakasnitvijo:** Aplikacija ne bo akcijska igra za več igralcev v realnem času.
* **Plačilni promet s pravim denarjem:** V okviru projekta ne bo prave integracije s plačilnimi sistemi (npr. Stripe ali bančne kartice).
* **Urejanje vsebine na Wikipediji:** Aplikacija le bere javno dostopna enciklopedična besedila in jih ne spreminja na izvirni spletni strani.
* **Slikovne in zvočne uganke:** Projekt je strogo osredotočen na besedilo in jezikovne uganke.
