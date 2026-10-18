# E-11 — A hibautak: mentési hiba, AI-kiesés, forráshiba (2026-09-07)

Az ATADO 6.4 kötelező állapotviselkedése: hibánál nincs hamis sikeroldal, az adatok megmaradnak, AI-kieséskor kézi
úton folytatható, a forrás- és az AI-hiba külön hibakód. Ez a lap azt rögzíti, **hogyan idéztük elő** mindhármat, és
**mit láttunk**. A képernyőképek a `Claude outputs` mappában (`e11-*.png`).

## Hogyan idézzük elő (megismételhető)

| Hiba | Gépi próba (`apps/web/probak/hibautak.proba.ts`, 17 eset) | Képernyőn |
|---|---|---|
| **Forráshiba** | nem létező tartomány → `502 FORRAS_NEM_ELERHETO`; belső cím (`127.0.0.1`) → `400 FORRAS_TILTOTT_CIM`; a piszkozat változatlan; az `ai_hivas` táblába NEM kerül AI-hiba | 1. lépés, weboldal: `nincs-ilyen-tartomany-e11.example` → „Ezt az oldalt most nem tudtuk elérni.” doboz, Újrapróbálom / Bemásolom a szöveget; a név és a cím megmarad |
| **AI-kiesés** | a havi keret kimerítése SQL-lel (`ai_koltseg_honap.becsult_usd = 999`) → összefoglaló, javaslatok, hangnem mind `429 AI_KERET_KIMERULT`; kézi összefoglaló menthető; a keret visszaállítása után újra 200 | a kiszolgáló 503-at ad → „Az AI-szolgáltatás most nem érhető el.” doboz, Újrapróbálom / Ezt használom összefoglalóként → a leírás lesz az összefoglaló, „Te adtad meg” jelvénnyel |
| **Mentési hiba** | érvénytelen és nem-JSON piszkozat → `400`, a korábbi jó piszkozat (és a `frissitve`) változatlan | a mentés 500-at ad → a fejlécben piros pont + „A mentés nem sikerült — az adataid megvannak” + **Újrapróbálás**; a „Mentés és kilépés” NEM lép ki; Újrapróbálás a javult kiszolgálónál → „Mentve: 08:15”; újratöltés után a beírt név megvan |
| **Nincs hamis siker** | jóváhagyás hiányzó névvel → `400 HIANYOS_PROFIL`, a piszkozat megvan, `GET /api/profil` → null | a jóváhagyás 500-at ad → „A mentés nem sikerült. Minden adatod megvan — próbáld újra a jóváhagyást.” doboz, a 3. lépés marad; a javult kiszolgálónál a gomb → kész lap |

A képernyős előidézés a felhőben Playwright-tal történt (a hálózati réteg elvágása 500/503-mal — a felület ugyanaz,
mint élesben), a teszt-NAS-on pedig valódi kiszolgálóoldali hibával (lásd a NAS-naplót: a keret kimerítése és a
piszkozat-tábla írásjogának ideiglenes elvétele, azonnal visszaállítva).

## Amit az E-11 javított

- **Hiba:** a javaslat-, hangnem- és arculat-hívásnál a kimerült havi keret `500 BELSO_HIBA` volt `429 AI_KERET_KIMERULT`
  helyett (a keret-ellenőrzés kivétele nem volt lefordítva a javaslat-hibára). A gépi próba találta meg. Javítva
  (`keretVagyJavaslatHiba`).
- A fejléc mentés-állapota mostantól a v6 szerint: pont + szöveg; siker: „Mentve: {idő}”; hiba: „A mentés nem sikerült —
  az adataid megvannak” + **Újrapróbálás** gomb (eddig: „Nem sikerült menteni — újrapróbáljuk”, gomb nélkül). Ugyanez a
  fiókoldalon a profil mentésénél. Feliratok: migráció `0016`.

## Ami szándékosan nem része

- A weboldal-letöltés 10 s-os időkorlátja és a NAS-ról nem elérhető saját cím (E-1 tanulság) nem hiba, adottság.
- Hálózat-szakadás a böngészőben (offline): a `hivas` segéd 0-s státusszal tér vissza, a felület ugyanazt a hibaállapotot
  mutatja, mint az 500-nál — külön nem játszottuk végig.
