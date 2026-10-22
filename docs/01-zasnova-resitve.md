# 1. Zasnova rešitve

## Ime rešitve
**[REDACTED]** — Spletna igra z ugibanjem cenzuriranih enciklopedičnih besedil.

---

## Namen rešitve in problem, ki ga naslavlja

Večina današnjih priljubljenih spletnih iger z besedami (npr. *Wordle*, *Besedle*) temelji na ugibanju posameznih, 5-črkovnih besed brez širšega konteksta ali zgodbe. Po drugi strani so enciklopedični članki (npr. na Wikipediji) polni zanimivih informacij, vendar jih le redko beremo na igriv način.

Aplikacija **[REDACTED]** povezuje igro in učenje:
* Izbrani enciklopedični članek pretvori v cenzuriran dokument.
* Skoraj vse besede v besedilu so prekrite s črnimi bloki (`██████`), vidni ostanejo le ločila in osnovni vezniki ter predlogi.
* Igralec z vpisovanjem besed postopoma odpira besedilo ter z logičnim sklepanjem in branjem ugotavlja, katera je glavna tema oziroma naslov članka.

Rešitev ponuja privlačno, poučno in miselno igro za vsak dan. Hkrati urednikom omogoča enostaven vnos novih člankov, določanje težavnosti in načrtovanje dnevnih izzivov.

---

## Ciljni uporabniki

Aplikacija je namenjena trem glavnim skupinam uporabnikov:

1. **Ljubitelji miselnih in besednih iger:**
   * Igralci, ki želijo vsak dan rešiti kratek miselni izziv, spremljati svoj niz zmag (*streak*) in deliti rezultat s prijatelji.
2. **Učenci, študenti in radovedneži:**
   * Uporabniki, ki želijo skozi igro spoznavati zanimiva zgodovinska dejstva, znanost, geografijo ali znane osebnosti.
3. **Uredniki in učitelji:**
   * Osebe, ki želijo pripravljati sezname člankov, prilagajati težavnost in ustvarjati tematske uganke za druge.

---

## Kratek opis delovanja rešitve

* **Igralec** odpre spletno stran, kjer ga pričaka današnji cenzurirani članek (npr. o *Albertu Einsteinu* ali *Gravitaciji*). V spodnje polje vpisuje poljubne besede (npr. *"teorija"*, *"fizika"*, *"nagrada"*).
* Če je beseda v besedilu prisotna, se vsi njeni primerki takoj razkrijejo in obarvajo. Sistem samodejno prepozna tudi sorodne oblike iste besede.
* Če igralec ne ve, kako naprej, lahko uporabi pomoč (namig, ki razkrije eno naključno besedo ali besedo v naslovu).
* Igra je končana, ko igralec ugane ključne besede v naslovu članka. Takrat se celotno besedilo odpre, rezultat pa se shrani v profil igralca. Igralec lahko skopira kratek povzetek rezultata za deljenje s prijatelji.
* **Urednik** prek skrbniškega vmesnika vnese povezavo do članka, pregleda samodejno cenzuro in določi datum objave.
