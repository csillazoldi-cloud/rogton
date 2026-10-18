# Design-kérés — R-16 · Arculat: logók, színek, betűk egy helyen (12 Szervezet adatai)

2026-09-30 · Aitmetica SRL · Írta: a fejlesztő oldal (Claude), Csilla kérésére.
**Ezt a lapot egészben add át a Claude Designnak.** Mellette a fejlesztő oldal vázlata: `R16-arculat.dc.html` (nyolc állapot, asztali + telefon, a mérő programmal lemérve, `meres/`).
A vázlat kiindulópont és mérhető szerződés-javaslat, nem kész rajz: a képi döntés a Designé. A tokenek: `design/R15/tokenek.md`, az alapelemek: `design/R15/rajz/R15-szabalylap.dc.html`.

Kapcsolódik: `DESIGN-KERES-R15-02-KUTATAS-SZINEK.md` (09-28) — az első beállítás „Ezt találtuk rólad” lépése és a bevált színösszeállítások.
**Az a kérés az adat egyik vége (honnan jön), ez a másik (hol látja és javítja Tibor később, és hogyan használják a Képek).** Amit ott kérünk, itt nem ismételjük: a bevált összeállítások listáját onnan vesszük.

---

## 0. Miért

**Az elv (Csilla, 2026-09-30):** „we want Tibor to work as little as possible and give everything into his precious hands.”
A gép javasol, Tibor jóváhagy. Ami összerakást kér tőle (színválasztó, feltöltés), mindig csak második út, halk linkkel.
Ebből két döntés a vázlat átnézése után: a színeknél előbb a mi javaslatunk („at the colours I also need a suggestion from us, and the selector only after”), és a logónál legyen „nincs”, utána a gép készít egyet („at logo, he should have the option to say nincs, and then he can opt to create one”).

A tesztelők szavai, szó szerint:

- **B1 — Csilla (FONTOS):** „tobb logovarianst lehessen feltolteni.”
- **B2 — Csilla:** „Visual identitynel kellene legyen fonts es colours, ahogy a canvanak van.” — **Kati:** „Kellene fontfeltöltés is.”
- **A9 — Kati** (a „Vizuális arculat — tervezet” dobozról): „Ez nem tudom mi. Nem is csinál semmit, nincs is semmi értelme. Lennebb van lehetőség feltölteni az arculati elemeket, az pont elég.”
- **A5 — Kati:** „A picmess szerkesztő fasza. ... Nekem itt nem vette át az arculati elemeket pedig feltöltöttem őket.”
- **B3 — Csilla:** „A picmess generalasnal nem lehetne 4-5 style, amin belul fontot es szint cserelni? Tehat pl beauty, tech, minimal, colorful - egy egy template szett.” — **ebben a kérésben nem rajzoljuk** (6. pont), de ez a készlet lesz az, amiből a stílusok olvasnak.

Amit a kódban találtunk (2026-09-30, `main` 3e4916a, **kódból olvasva, élőben nem mérve**):

1. **A 12-es lapon ma két dolog áll egymás alatt, egy összecsukott „Vizuális arculat” alatt:** a tervezet-kártya (színfoltok, betűnevek, jelvény, „Szerkesztés” mögött
   színválasztó, betűválasztó, képvilág, követendő, kerülendő, lekerekítés, jóváhagyás) és az Arculati anyagok (logó · kézikönyv · referenciák · dokumentumok).
   A kártya tehát nem halott, de Tibor ezt nem látja: jelvény, „Nincs megadva”, „Későbbre hagyom”, és a lényeg egy gomb mögött.
2. **Betűválasztás már van — de nem az, amit a kép tud.** A választóban Georgia · Archivo · Space Grotesk · IBM Plex Sans · Cairo (cím) és Public Sans · IBM Plex Sans · Georgia · Tajawal (szöveg).
   A képgyártó öt betűt ismer: Archivo · Public Sans · Space Grotesk · IBM Plex Sans · Gelasio (a Georgia helyett). A Cairo és a Tajawal a képen csendben Public Sans lesz.
   **A kép ma egyetlen betűt használ** (a címbetűt, ha van, különben a szövegbetűt). Saját betű feltöltése nincs.
3. **Egy logó van, egy helyen.** A kép a logót mindig ugyanúgy teszi rá, világos és sötét háttérre egyaránt — a sötét hátterű változaton egy sötét logó eltűnik.
4. **A5 oka (valószínű, a kódból):** a kép a *jóváhagyott* arculatot használja, ha van. Jóváhagyott arculatnál a logó feltöltése új tervezetet nyit — a kép a régi, logó nélküli
   jóváhagyottból dolgozik tovább. „Későbbre hagyott” arculatnál a feltöltött logó be sem kerül. A kézikönyv, a minták és a dokumentumok semmilyen úton nem jutnak el a képhez.
   Ennek a javítása nem vár a rajzra (`gepezet.md` 1, `kerdesek.md` 5).
5. **A honlapról megtalált logó** ma csak egy cím, nincs elmentve fájlként. A honlap színei (fő · második · háttér, és további jelöltek) megvannak.

## 1. Szabályok — ugyanazok, mint eddig

- T1–T10 (`DESIGN-KERES-R15-TIBOR.md`), a jelölések a `design/R15/tokenek.md` 3. pontja szerint (`data-r15="kerdes" | fo-gomb | teendo | info | kesz | reszletek | eredmeny"`, `data-r15-forras="gep"`, `data-r15-kepernyo`).
- Csak tokenből. A cég saját színei (a színfoltok, a mintakép) ügyfélkreatívként kivételek, mint a mai mintakártyán.
- Minden szöveg feliratkulcsból, három nyelven (hu · ro · en), előtag: `r16.arculat.` — a vázlat kulcsai: `feliratok.json`.
- **Halott vezérlő tilos.** Csak az rajzolható, aminek a 2. pontban VAN vagy ÉPÜL gépezete.
- Asztali 1440 és telefon 390, vízszintes görgetés nélkül; a Visszajelzés lebegő gombjának fenntartott helye (`--lebego-hely-*`).
- **Tilos szavak a képernyőn:** hex · szín kód · paletta · token · séma · AI-javaslat · arculati elem · variáns · verzió · modul — és ami a mérő listáján van. A „logóváltozat” helyett a hely neve („Sötét háttérre”).
- Tibor soha nem ír be színt. Összeállítást választ képről; egyenként színt csak a „Más színt” mögött koppint.
- A gép javaslata az első; ami összerakást kér (választó, feltöltés), az második és halk.
- **Semmi nem kerül le** Vilmos szava nélkül: a kézikönyv, a referenciák, a dokumentumok, a csere-megerősítő, a hibák ágai (R-6) mind megmaradnak — csak hátrébb.

## 2. A gépezet — ebből rajzolhatsz

| # | Mi | Állapot | Honnan |
|---|---|---|---|
| a | Három szín: fő · második · háttér, tervezet / jóváhagyott, verziók | **VAN** | `ArculatTervezet`, `arculatJovahagy` |
| b | Színcsere a böngésző színválasztójával | **VAN** (de a rajz nem használja — T3) | `ArculatBlokk.tsx` |
| c | Színek a honlapról (fő · második · háttér + jelöltek) | **VAN** a gépben · a képernyő a 09-28 rajzra vár | `onboarding/szinek.ts` |
| d | Színek a feltöltött logóból („A logódból”) | **ÉPÜL** | gepezet 6 |
| d2 | 3–4 kész színösszeállítás javaslatként, szakma szerint, mindegyik mintaképen | **ÉPÜL** | gepezet 6 |
| e | 12 bevált szín a gyűrűben (csak „Más színt” mögött) | **ÉPÜL** (a 09-28 összeállításokból) | gepezet 6b |
| f | Olvasható szöveg bármely színen — a gép választ világos/sötét betűt | **ÉPÜL** (a számítás megvan) | gepezet 5 |
| g | Egy logó feltöltése, csere-megerősítő, hibák | **VAN** | `ArculatAnyagok.tsx`, R-6 |
| h | Négy logóhely (világos · sötét · egy színnel · négyzetes), több egyszerre, a gép sorolja be | **ÉPÜL** | gepezet 2–3 |
| i | A kép hátteréhez illő logó választása | **ÉPÜL** (a márkarétegben a minta megvan) | gepezet 4 |
| j | A honlapon talált logó elmentése fájlként | **ÉPÜL** | gepezet 10 |
| k | Két betű a képen (cím + szöveg) | **ÉPÜL** (ma egy) | gepezet 7 |
| l | Az öt betű, amit a képgyártó tud | **VAN** | `vizual-core` `BETUK` |
| m | Saját betű feltöltése (TTF · OTF · WOFF2), ékezet-ellenőrzés | **ÉPÜL** · licenc: kerdesek 2 | gepezet 8 |
| n | „Így néz ki” mintakép a mentett összeállítással | **VAN** | `GET /api/vizual/helyzet-minta/[helyzet]` |
| o | Mintakép a még szerkesztett összeállítással, ~1 mp | **ÉPÜL** | gepezet 9 |
| p | Kézikönyv · referenciák (több) · dokumentumok (több) | **VAN** | `ArculatAnyagok.tsx`, A-7 |
| q | A kézikönyv / referenciák hatása a képre | **NINCS** — ne rajzold, hogy a gép „olvassa” | — |
| r | Stílus-szettek (B3) | **NINCS** — 6. pont | — |
| t | „Nincs logóm” → névlogó a névből, a címbetűből és a színekből (3 stílus), a négy hely kitöltése, ékezetekkel | **ÉPÜL** | gepezet 13 |
| s | Képvilág, követendő, kerülendő, lekerekítés | **VAN** (a gép használja) · a rajzon Részletek mögött | `ArculatTervezet` |

## 3. Amit kérünk — nyolc állapot, mindegyik asztalon és telefonon

A 12-es lapon **egy** szakasz: „Logó, színek, betűk” (`r16.arculat.szakasz`). A mai tervezet-kártya és az Arculati anyagok helyett (A9: `kerdesek.md` 1).
Felépítés minden állapotban: kérdés-cím → egy teendő-lap három sorral (**Logó(k)** · **Színek** · **Betűk**, soronként egy halk „Csere”) → alatta halkan a **Fájlok** sor → mellette (telefonon fölötte) az **„Így néz ki”**: két kész kép a cég összeállításával, a világos és a színes változat.
A két kép az, ami Tibort meggyőzi — a sötét képen a gép maga választja a sötét hátterű logót.

1. **12a — üres (a gép nem talált semmit).** Minta: Cipó Pékség. „Kezdjük a logóddal” / „A színeket és a betűket addig mi választottuk.”
   A színek és a betűk egy bevált összeállításból előre kitöltve — **a kép sosem szürke**. A logó helye üres (itt a gép tényleg nem tudhatja). Fő gomb: „Logó feltöltése”; halkan: „Nincs logóm” (→ 12g) és „Így jó, logó nélkül” (jóváhagy).
2. **12b — „Ezt találtuk”.** Minta: Kövesi Térkő (zöld #2f5d50 · homok #c9a86a · krém #f1ede4). „Jól ismer a gép?” / „Ezt találtuk a honlapodon.”
   A megtalált logó, a három szín, a két betű (a betű a saját alakjában, egy szóval: „Erős”, „Tiszta”). Egy fő művelet: „Igen, ez mi vagyunk”. Honnan jött: „Honnan?” mögött. „Több logó” → 12f.
3. **12c — jóváhagyva.** „Így készülnek a képeid”, kész-pillanat: „Jóváhagyva. Minden új kép ezzel készül.” Négy logó a helyén. Fő gomb: „Kép készítése” (a Képek lapra, T9).
4. **12d — Színek: javaslatok (ez az út).** A Színek sor „Csere” gombja ide visz. „Melyik színek illenek hozzátok?” / „Ezeket a logódból és a szakmádból raktuk össze.”
   Négy kész kép egymás mellett (telefonon 2×2), mindegyik egy összeállítással, a „színes” változatban (a szín a kép, nem egy folt): „A logódból” (a mostani, ✓) · és három bevált, a szakmához illő (Kövesi Térkőnél: Természetes · Megbízható · Elegáns).
   Tibor ránéz, rábök, „Ez legyen”. Halkan: „Más színt” (→ 12d2) és „Mégse”.
5. **12d2 — Más színt (a kivétel).** „Melyik legyen a második szín?” Fülek: Fő · Második · Háttér. „A logódból:” 5 szín (a mostani karikázva), alatta egy 12 színű gyűrű.
   Koppintásra a mintakép azonnal átszíneződik. „Ez legyen” / halk „Mégse”. Szín kód, csúszka, színmező nincs.
6. **12e — betűk.** „Melyik betű illik hozzátok?” Fülek: Cím · Szöveg. Öt sor, mindegyik a saját betűjével írva (Erős · Tiszta · Modern · Hivatalos · Klasszikus); asztalon halkan mellette a betű neve.
   „Saját betűm van” → fájlválasztó (TTF, OTF vagy WOFF2); utána egy hatodik sor: „Saját: <név>”. Ha a betűből ékezet hiányzik, egy halk sor mondja, melyik betűvel pótoljuk (nem hiba, nem piros).
7. **12f — logók feltöltése.** „Töltsd fel a logóidat” / „Többet is egyszerre. Mi tudjuk, melyik hova.” Négy hely 2×2-ben: Világos háttérre · Sötét háttérre · Egy színnel · Négyzetes —
   mindegyik a saját hátterén mutatja a logót (ettől látszik, miért kell több). Egy hely: üres (+) · feltöltés közben (sáv) · kész (✓). „Logók kiválasztása” (több fájl), asztalon „vagy húzd ide őket”.
   „Melyik hova?” a Részletek mögött. Egy helyre koppintva csak az cserélődik. Halkan: „Nincs logóm” (→ 12g).
8. **12g — „Készítsünk egyet?”** A „Nincs logóm” ide visz. Minta: Cipó Pékség. „Készítsünk egyet?” / „A neved, a színeid és a betűd. Válassz egyet.”
   Három egyszerű névlogó: csak a név · kis kör + név · négyzetes kezdőbetű + név — a címbetűvel, a cég színeivel. Asztalon mindegyik a saját kész képén; telefonon a három logó egymás alatt, alatta a kiválasztott két kész képen.
   Egy koppintás + „Ez legyen”: a gép kitölti mind a négy helyet (világos · sötét · egy színnel · négyzetes) — Tibor végzett. Halk sor: „A négy helyre mi tesszük.”; halk link: „Inkább feltöltöm” (→ 12f).
   Rajzolt képet, „művészi” logót ne ígérj: név és egyszerű jel, becsületesen.

**Kérünk még** (nem kell mind a hat állapotra): a hibaág (nem betű / nem kép / túl nagy — egy mondat, mit tegyen, T7), és a Fájlok sor kinyitva (a mai három mező, változatlanul, csak halkabban).

**Tibor-táblázat** (a vázlat szerint; minden szakasz alatt a rajzon is):

| | Mit lát először? | Mi a dolga? | Kattintás |
|---|---|---|---|
| 12a | a pékség színeivel kész képet, nem szürkét | logót tölt fel, vagy „Így jó” | 1 |
| 12b | a saját logóját és színeit két kész képen | „Igen, ez mi vagyunk”, vagy egy sor cseréje | 1 |
| 12c | ✓ és a kész képeket | semmi kötelező; a Képekre megy | 1 |
| 12d | négy kész képet, négy színösszeállítással (a mostani ✓) | ránéz, rábök, „Ez legyen” | 2 (1, ha marad) |
| 12d2 | csak ha egyik sem jó: a logója színeit és a gyűrűt | koppint egy színre, „Ez legyen” | 2 |
| 12e | öt betűt, mindegyik a saját alakjában | koppint egyre, „Ez legyen” | 2 |
| 12f | négy helyet, kettő kész | kiválaszt több fájlt, vagy „Nincs logóm” | 1 + fájlválasztás |
| 12g | három kész névlogót a saját nevéből, kész képeken | rábök egyre, „Ez legyen” — a négy hely magától kész | 2 |

**A vázlat mérése** (`rajz_proba.py`, 2026-09-30): **16 / 16 képernyő zöld** — szószám asztalon 21–45 (≤ 60), telefonon 16–30 (≤ 40), minden képernyőn pontosan 1 fő gomb, doboz a dobozban nincs,
tiltott szó nincs, lebegő elem nem takar. Részletek: `meres/jelentes.md`, képek: `meres/kep/`. A Tibor-bíráló (gemma, a Dellen) még nem futott rajta.

## 4. Amit visszakérünk

- A nyolc állapot rajza (asztali 1440 + telefon 390, az első képernyő), `data-r15` jelölésekkel, `.dc.html`-ben — a vázlat ugyanígy készült, a mérő változtatás nélkül megy rajta.
- A hibaág és a kinyitott Fájlok sor.
- `feliratok.json` (hu · ro · en, `r16.arculat.`) — a vázlaté kiindulópont.
- `gepezet.md` kiegészítés, ha a rajz új viselkedést kér; `kerdesek.md` a nyitott döntésekkel.
- Ha a 12 színű gyűrű helyett jobb ötleted van (Tibornak, telefonon, szín kód nélkül): rajzold meg mellé.

## 5. Ami ebben a kérésben nincs

- Az első beállítás „Ezt találtuk rólad” lépése és a bevált összeállítások listája: a 09-28 kérés.
- A Képek lap maga: nem változik. Csak a kép kap más logót és két betűt (gepezet 4, 7).

## 6. Később (nem most, de ez a készlet lesz az alapjuk)

- **B3 — stílus-szettek** (beauty · tech · minimal · colorful): minden szett ebből a készletből olvassa a logót, a színeket és a betűket, és csak az elrendezést adja hozzá. A készletet ezért tartjuk tisztán adatnak (`gepezet.md` 2, 7).
- **B4 — szöveg tördelése a képen.**
- **B5 — emoji a képen.**
