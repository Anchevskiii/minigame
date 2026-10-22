# 5. Uporabniške zgodbe in pogoji sprejemljivosti

Dokument vsebuje 15 uporabniških zgodb z natančnimi pogoji sprejemljivosti (*Acceptance Criteria*). Uporabniške zgodbe izhajajo iz funkcionalnosti, definiranih v 1. nalogi, ter sledijo standardni strukturi:
> **Kot [uporabniška vloga] želim [dejanje/cilj], da [razlog/vrednost].**

Vsi pogoji sprejemljivosti so zastavljeni po načelih **INVEST** (neodvisni, pogajalski, vredni, ocenljivi, obvladljivi in preverljivi).

---

### US-01: Pametno ugibanje in razkrivanje besed
* **Povezana funkcionalnost:** 1. Pametno razkrivanje besed s prepoznavo korena besede [MVP]
* **Uporabniška vloga:** Gost, Registriran igralec
* **Uporabniška zgodba:**
  Kot igralec želim vnašati besede v iskalno polje, da z odpiranjem zadetkov postopoma ugotovim vsebino in temo članka.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Ob pritisku tipke Enter ali kliku na gumb »Ugibaj« sistem preveri vneseno besedo glede na celotno besedilo članka.
  2. Sistem s pomočjo algoritma stemanja prepozna koren besede in sočasno odpre vse njene slovnične oblike (npr. vnos »odkriti« odpre tudi »odkril«, »odkritje«, »odkrijejo«).
  3. Če je beseda prisotna, se vsi njeni začrnjeni bloki animirano razkrijejo in obarvajo.
  4. Če beseda v besedilu ne obstaja, sistem v stranski vrstici zabeleži poskus z oznako 0 zadetkov.
  5. Sistem prepreči ponovni vnos že prej uganjene besede in uporabnika o tem obvesti brez povečanja števca poskusov.

---

### US-02: Samodejni pomik do najdene besede v besedilu
* **Povezana funkcionalnost:** 3. Interaktivni cenzurirani dokument [MVP]
* **Uporabniška vloga:** Gost, Registriran igralec
* **Uporabniška zgodba:**
  Kot igralec želim, da se pogled po uspešnem ugibanju samodejno premakne na prvo razkrito besedo, da takoj preberem nov kontekst.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Po pravilnem ugibanju se zaslon z zveznim pomikom (*smooth scroll*) samodejno postavi na prvi primerek te besede v članku.
  2. Vsi najdeni primerki uganjene besede so na zaslonu začasno vizualno poudarjeni z rumeno ali svetlo obrobo.
  3. V vnosni vrstici se prikažeta gumba »Prejšnji« in »Naslednji« za hitro premikanje med vsemi pojavitvami te besede.
  4. Števec v orodni vrstici jasno prikazuje trenutno pozicijo (npr. »Zadetek 2 od 5«).

---

### US-03: Uporaba osnovnega namiga (kontekstna beseda)
* **Povezana funkcionalnost:** 2. Sistem pomoči z dvema vrstama namigov [MVP]
* **Uporabniška vloga:** Gost, Registriran igralec
* **Uporabniška zgodba:**
  Kot igralec želim uporabiti osnovni namig, da pridobim pomoč pri razumevanju teme, ko se mi pri reševanju zatakne.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. V spodnji vnosni vrstici je vseskozi viden gumb za odpiranje okna s pomočjo.
  2. Ob izbiri osnovnega namiga sistem naključno razkrije eno pogosto besedo v besedilu, ki pred tem še ni bila uganjena.
  3. Števec uporabljenih namigov v trenutni igri se poveča za 1.
  4. Osnovni namig je na posamezno igro omejen na največ 3 uporabe.

---

### US-04: Uporaba glavnega namiga (beseda v naslovu)
* **Povezana funkcionalnost:** 2. Sistem pomoči z dvema vrstama namigov [MVP]
* **Uporabniška vloga:** Gost, Registriran igralec
* **Uporabniška zgodba:**
  Kot igralec želim uporabiti glavni namig, da se mi razkrije ena beseda v naslovu, ko ne morem uganiti celotnega gesla.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Glavni namig je na voljo le, če so v naslovu članka vsaj 2 besedi in je vsaj ena še neodprta.
  2. Pred razkritjem sistem prikaže potrditveno okno z opozorilom, da gre za večjo pomoč.
  3. Ob potrditvi sistem razkrije natanko eno naključno besedo neposredno v naslovu članka.
  4. Glavni namig je mogoče uporabiti največ enkrat na posamezno igro.

---

### US-05: Zmaga in deljenje rezultata brez razkritja gesla
* **Povezana funkcionalnost:** 4. Kratek povzetek rezultata za deljenje [MVP]
* **Uporabniška vloga:** Gost, Registriran igralec
* **Uporabniška zgodba:**
  Kot igralec želim ob zmagi videti svojo statistiko in skopirati povzetek za deljenje, da prijateljem pokažem rezultat brez razkritja rešitve.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Ko igralec ugane vse ključne besede v naslovu, se celotno preostalo besedilo članka takoj razkrije in sproži se animacija zmage.
  2. Odpre se modalno okno s podatki o igri: zaporedna številka uganke, število ugibanj, natančnost v %, porabljen čas in število namigov.
  3. Klik na gumb »Deli rezultat« v odložišče skopira strukturirano besedilo z emoji ikonami, ki ne vsebuje naslova članka.
  4. Uporabnik po kliku prejme jasno vizualno potrditev (»Rezultat skopiran v odložišče!«).

---

### US-06: Registracija in prijava uporabnika
* **Povezana funkcionalnost:** 5. Prijava in vodenje uporabniških profilov [MVP]
* **Uporabniška vloga:** Gost
* **Uporabniška zgodba:**
  Kot gost se želim registrirati in prijaviti z elektronskim naslovom in geslom, da se moji dosežki trajno shranjujejo.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Obrazec za registracijo zahteva veljaven e-poštni naslov, unikatno uporabniško ime in geslo z najmanj 6 znaki.
  2. Sistem ob neveljavnih podatkih ali zasedenem uporabniškem imenu izpiše natančno opozorilo.
  3. Prijava poteka prek storitve Supabase Auth, ki uporabniku nastavi varno JWT sejo.
  4. Po uspešni prijavi se v glavi strani namesto gumba za prijavo izpiše uporabniško ime ter gumb za odjavo.

---

### US-07: Samodejno shranjevanje in nadaljevanje igre
* **Povezana funkcionalnost:** 6. Shranjevanje in nadaljevanje igre [MVP]
* **Uporabniška vloga:** Registriran igralec
* **Uporabniška zgodba:**
  Kot registriran igralec želim, da se moj napredek sproti shranjuje, da lahko igro zaprem in jo kasneje nadaljujem na drugi napravi.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Vsaka vnesena beseda se skupaj z rezultatom sproti zapiše v tabelo `guess_logs` v bazi podatkov.
  2. Ob osvežitvi strani ali ponovni prijavi se iz baze samodejno naložijo vsa pretekla ugibanja za današnji dan.
  3. Dokument se takoj prikaže z vsemi že razkritimi besedami in natančnim števcem poskusov.
  4. Če je uporabnik današnjo uganko že rešil, se ob ponovnem obisku prikaže že dokončan članek z možnostjo pregleda rezultata.

---

### US-08: Brskanje in reševanje preteklih ugank v arhivu
* **Povezana funkcionalnost:** 7. Zgodovinski arhiv preteklih ugank
* **Uporabniška vloga:** Registriran igralec
* **Uporabniška zgodba:**
  Kot registriran igralec želim dostopati do arhiva preteklih ugank, da lahko rešujem izzive iz preteklih dni, ki sem jih zamudil.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Stran arhiva prikazuje kronološki seznam vseh preteklih objavljenih ugank z datumom in zaporedno številko.
  2. Pri vsaki uganki je jasno označen status: »Rešeno« (z zabeleženim številom poskusov) ali »Nerešeno«.
  3. Klik na katerokoli preteklo uganko odpre igralni vmesnik za izbrani datum.
  4. Neregistriranim gostom sistem ob kliku na arhiv prikaže prijazen poziv k prijavi.

---

### US-09: Pregled javne lestvice najboljših igralcev
* **Povezana funkcionalnost:** 8. Lestvica najboljših igralcev
* **Uporabniška vloga:** Gost, Registriran igralec
* **Uporabniška zgodba:**
  Kot igralec želim pregledati lestvico najboljših, da vidim svojo uvrstitev v primerjavi z drugimi reševalci.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Lestvica za današnji dan prikazuje mesto, uporabniško ime, število ugibanj, natančnost in porabljen čas.
  2. Rezultati so primarno razvrščeni po najmanjšem številu poskusov, sekundarno pa po krajšem času reševanja.
  3. Prijavljen uporabnik ima svojo vrstico na lestvici posebej barvno poudarjeno.
  4. Lestvica ponuja preklop med dnevnimi rezultati in skupno lestvico najdaljših nizov zaporednih zmag (*streak*).

---

### US-10: Uvoz novega članka iz Wikipedije
* **Povezana funkcionalnost:** 9. Uredniški vmesnik za pripravo novih člankov
* **Uporabniška vloga:** Urednik vsebin
* **Uporabniška zgodba:**
  Kot urednik želim vnesti spletno povezavo do Wikipedije, da sistem samodejno prenese besedilo in pripravi osnutek cenzure.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Vnosno polje sprejme veljaven URL naslov do članka na Wikipediji.
  2. Sistem prek javnega Wikipedia API-ja prenese naslov in uvodne odstavke ter očisti odvečne HTML značke in reference.
  3. Sistem samodejno označi veznike, predloge in ločila kot vidne, vse ostale besede pa nadomesti z začrnjenimi bloki.
  4. Urednik v vmesniku takoj vidi predogled prenesenega besedila s podatkom o skupnem številu besed.

---

### US-11: Nastavitev težavnosti in razporeditev objave
* **Povezana funkcionalnost:** 9. Uredniški vmesnik za pripravo novih člankov
* **Uporabniška vloga:** Urednik vsebin
* **Uporabniška zgodba:**
  Kot urednik želim določiti težavnost uganke in datum objave, da se izziv samodejno aktivira na izbrani dan.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Urednik izbere težavnost iz nabora ENUM vrednosti (`EASY`, `MEDIUM`, `HARD`).
  2. Urednik v koledarju izbere datum objave; sistem zavrne izbiro datuma, ki že ima dodeljeno uganko.
  3. Ob shranitvi dobi uganka v bazi status `SCHEDULED`.
  4. Strežnik ob polnoči (00:00 UTC) na določeni datum status samodejno spremeni v `PUBLISHED`.

---

### US-12: Pridobivanje značk in dosežkov
* **Povezana funkcionalnost:** 10. Značke in dosežki za igralce
* **Uporabniška vloga:** Registriran igralec
* **Uporabniška zgodba:**
  Kot registriran igralec želim prejemati značke za posebne dosežke, da imam dodatno motivacijo za redno igranje.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Sistem po zmagi preveri pogoje za dosežke (npr. `FIRST_WIN` ob prvi zmagi, `STREAK_7` ob 7 zaporednih dneh, `NO_HINTS` ob igri brez namigov).
  2. Ob izpolnjenem pogoju se v tabelo `user_achievements` zapiše nov zapis z datumom in časom odklepa.
  3. Igralec na zaslonu takoj prejme obvestilo z ikono in imenom osvojene značke.
  4. V profilu igralca je viden celoten seznam vseh dosežkov z oznako, kateri so že odklenjeni in kateri še zaklenjeni.

---

### US-13: Izbira barvne teme in zvočnih učinkov
* **Povezana funkcionalnost:** 12. Izbira grafične podobe in zvočni učinki
* **Uporabniška vloga:** Gost, Registriran igralec
* **Uporabniška zgodba:**
  Kot igralec želim preklapljati med različnimi barvnimi načini in zvokom tipkanja, da videz in vzdušje prilagodim svojemu okusu.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Uporabnik lahko v nastavitvah izbira med tremi temami: Svetla (papir), Temna (oglje) in Terminal (zeleni fosfor).
  2. Menjava teme se uveljavi takoj brez ponovnega nalaganja strani z uporabo ustreznih Tailwind CSS razredov.
  3. Uporabnik lahko z enim klikom na ikono zvočnika vklopi ali izklopi zvočne učinke mehanskega pisalnega stroja (Web Audio API).
  4. Izbrana tema in stanje zvoka se shranita v lokalno shrambo brskalnika (`localStorage`) in ostaneta enaka ob naslednjem obisku.

---

### US-14: Pregled osebne statistike in profil igralca
* **Povezana funkcionalnost:** 5. Prijava in vodenje uporabniških profilov (Statistika profila)
* **Uporabniška vloga:** Registriran igralec
* **Uporabniška zgodba:**
  Kot registriran igralec želim v svojem profilu pregledati svojo osebno statistiko uspešnosti, da vidim svojo dolgoročno natančnost, število zmag in doseženi niz.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Uporabnik lahko v svojem profilu pregleda skupno število odigranih iger (`games_played`), število zmag (`games_won`) in izračunan odstotek zmag.
  2. Profil prikazuje trenutni niz zaporednih zmag (`current_streak`) ter najdaljši doseženi niz (`max_streak`).
  3. Prikazana je kumulativna natančnost ugibanj (`accuracy_percentage`), izračunana na podlagi vseh poskusov (`total_guesses`) in zadetkov (`hit_guesses`).
  4. Vsi statistični podatki se črpajo neposredno iz tabele `user_stats`, ki se samodejno posodobi ob vsaki zaključeni igralni seji.

---

### US-15: Upravljanje uporabnikov in vlog
* **Povezana funkcionalnost:** 5. Prijava in vodenje uporabniških profilov (Administracija)
* **Uporabniška vloga:** Administrator
* **Uporabniška zgodba:**
  Kot administrator želim upravljati vloge registriranih uporabnikov, da lahko določenim članom podelim uredniške pravice.
* **Pogoji sprejemljivosti (Acceptance Criteria):**
  1. Administrator ima dostop do pregleda vseh registriranih uporabnikov z njihovim uporabniškim imenom, e-pošto in trenutno vlogo (`PLAYER`, `EDITOR`, `ADMIN`).
  2. Administrator lahko posameznemu uporabniku spremeni vlogo prek spustnega menija.
  3. Sprememba vloge se takoj zapiše v bazo podatkov in uveljavi ob naslednji zahtevi uporabnika.
  4. Sistem administratorju onemogoči odvzem lastne administratorske vloge, s čimer se prepreči izguba nadzora nad sistemom.
