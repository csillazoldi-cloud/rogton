# Az R-7 csomag ellenőrzése a mai gépezet ellen

2026-09-13 18:20–18:50 · az orchestrator · a csomag: `atado/` (a Design 18:18-as zipje, `atado-csomag-2026-09-13.zip`)
Mérve a főág 8cc5d1b állapotán. Ahol „mérve" áll, ott a kódban néztem; ahol „a rajz szerint", ott a Design szövegét vettem át.

## 0. Az ítélet egy mondatban

**A csomag teljes és a kérés szerint készült** — öt lap, a kért artboardok (az OLVASD-ELOSZOR szerint 33; a `.dc.html` vászon-módú, az artboardok nevét gépi úton nem számoltam), hu/ro/en feliratok hiánytalanul (334 kulcs, mind a három nyelven), a hat döntés A-változata jelölve, a 8. pont négy kérdésére válasz.
**Négy helyen a rajz olyat mutat, aminek nincs gépezete** (1. tábla) — ezek a kérdés-listára mennek, nem épülnek. **Minden más építhető** — de a hat döntéshez kötött elem Vilmos szava nélkül nem.

## 1. Eltérések a gépezettől — ami a rajzon van, de nem építhető így

| # | Lap · artboard | A rajzon | Mérve | Mi lesz vele |
|---|---|---|---|---|
| E1 | R-7b 02 | a Hírek csempén „a 3 legfontosabb cím" | `HirfigyeloCsempe` (`apps/web/kezdolap/tipusok.ts:15`) számokat ad, címet nem | **kis gépezet épül**: a csempe kap egy `elso_cimek: {cim, kategoria}[]` mezőt (max 3, a legutóbbi futás fontos→érdekes sorrendjében) — DeepSeek, fél óra; a rajz marad |
| E2 | R-7b 06 | „forrás: román · összefoglaló: magyar" | az összefoglaló nyelve **nincs tárolva** a találaton (T-38, D-F41) | csak a „forrás: román" épül; az „összefoglaló: {nyelv}" a mag 0.4-gyel (T-38) — a rajzon marad, a képernyőn addig nincs |
| E3 | R-7c 06 | Megjelenés egyszerű nézet: **logó** | a Theme a SaaS felületének megjelenése; a logó az ügyfél **arculatának** része (R-13: a brand külön tartomány, nem a téma) — a Theme-nek nincs logó-tokenje | **nem épül** a Megjelenésen; a logó a Szervezet adatai → Arculat blokkban marad (R-7c 10). Kérdés a Designnak (K-R7c-6) |
| E4 | R-7c 06 | **világos/sötét** váltó | nincs világos paletta a design-systemben (mérve: `tokenek.ts`, `tema-alap.json` — nincs mód-token) | **nem épül** (halott vezérlő lenne); ha kell, külön kör: világos paletta 67 tokenre |
| E5 | R-7c 06 | fő szín: a `--primary-2` a `--primary`-ból származtatva | ma a `--primary-2` **külön alaptoken** (`tokenek.ts`) | **épül az R-7e-vel**: a `--primary-2` származtatottá válik (világosabb változat); a Theme haladó lapján a csúszkája elmarad — D-jegyzet |
| E6 | R-7b 05/07/10 | magyar cím + eredeti (DÖNTÉS 3.5 A) | fordított cím nincs a magban (T-38) | csak Vilmos igenje + mag 0.4 után; addig az eredeti cím áll (B) |
| E7 | R-7a 02/B, R-7d 03 | `kozos.kapcsolat`, a tájékoztató dátuma | Vilmos adata (rajtad-lista, 09-12 óta) | a rajz jól kezeli: adat nélkül a sor/lap nem kerül ki |

**Ami a rajzon nincs, de a gépezet tud** (nem hiba, csak tudni kell): a forrás **újraellenőrzése** csak `ellenorzes_alatt` állapotban volt gomb — a rajz minden hibás soron kéri („Újrapróbálás"), a végpont (`POST …/forrasok/[id]/ellenoriz`) bármely állapotban hívható; a tagok szerepváltása (`PUT /api/tagok/[fiokId]`) létezik — a Design K-R7c-4 kérdése erre vonatkozik.

## 2. Tokenek — az R-7e értékei a mai rendszer ellen

| A rajz kéri | Mérve | Építés |
|---|---|---|
| `--fs-base` 15 → 16; `--fs-md/sm/xs` arányos (0,9375 · 0,875 · 0,78, alsó korlát 12,5) | ma kivonásos (`index.ts:56`: base−1/−2/−3) | a származtatás cseréje a design-systemben + migráció a tárolt közös alapra (mint 0044/0052) |
| `--fs-title` 17, `--fs-h2` 26 (1,625×) | `--fs-title` alaptoken (16), `--fs-h2` származtatott | ugyanott |
| `--control-min` 44 → 46, `--control-min-s` 36 → 38 | alap 44, a -s = −8 | értékcsere; **a nem `--control-min`-ből élő mezők listája** még nincs (F-8.1 j) — az átkötés Kimi sokfájlos feladata |
| `--src-ai` → `--primary-2`; `--src-ai-bg` 14%; `--src-user` → `--text-mut`/7%; `--accent-link` → `--primary-2` | mind létező származtatott/alap token | értékcsere az `index.ts`-ben; `--accent-link` alaptoken → a tema-alap értéke változik |
| `--lh` 1,55 → 1,5 | alaptoken | értékcsere |
| **új**: `--urlap-max` 680 (640–720), `--lista-max` 1180 (1100–1200) | nincs | két új alaptoken (`AlapTokenek`, tema-alap, Theme-lap Egyéb fül), migráció — mint a D-F26 |
| a nyitólapi `--fs-h1` 42 | a nyitólap ma `--fs-hero`-t használ | nem kell új: a `--fs-hero` marad a nyitólapé |
| a navigáció aktív állapota `--panel-soft-2` + aláhúzás, nem `--grad-primary` | a felső sáv ma a kiemelőszínt használja | a FelsoSav CSS-e változik — ez az R-7b/c beépítés része |

**Ütközés a mai szabállyal:** az R-7e a Theme Betűméret fülének három csúszkájából egyet hagy (`--fs-base`), a többi számított. Ez a **rendszergazda** lapját is változtatja — a rajz 8.4 válasza szerint ez a szándék; a rendszergazdának kézi felülírás nincs (nincs gépezet). Elfogadva, D-jegyzettel.

## 3. A 18 kérdés — válasz a kódból, vagy Vilmosé

**R-7a**
1. 02/B a `{kapcsolat}` nélkül — **a hivatkozás rejtve marad**, amíg nincs adat (halott vezérlő tilos). Ez a DÖNTÉS 3.4-től is függ (Vilmos).
2. 03: név + weboldal VAGY leírás — a mag (`onboarding-core`) egyiket sem teszi kötelezővé; az összefoglaló végpont weboldalból VAGY szövegből dolgozik (A-01: URL nélkül is végigvihető). **Egyik sem kötelező**, de a „Javaslat készítése" csak akkor aktív, ha valamelyik ki van töltve — ez a mai működés.
3. 05: a három nyelv elöl **fix** (hu · ro · en — a felület nyelvei), a lista többi része lenyílóban. A munkatér nyelve szerinti sorrend nincs a gépezetben.
4. 06: a „részletek" a javaslat **forrását** mutatja (weboldal / szöveg / te adtad meg) — a mezőnkénti `*_forras` és `*_modositva` adat megvan (`profile-core`); a teljes AI-válasz nincs tárolva. **Ahogy rajzoltad.**
5. Piszkozat-mentés: ma **mezőelhagyásra és lépésváltásra** ment (`usePiszkozat`), nem gépelésre — a „Mentve {ido}" ritkán frissül; marad.

**R-7b**
1. 02: az üzemállapot-sor **helyben nyílik** — nincs hozzá külön végpont, az adat a `GET /api/kezdolap`-ban van. Ahogy rajzoltad.
2. „További helyi hírek ({n})": a **háttér-kategória összes, nem elrejtett** találata (az „új" külön jelvény marad a kártyán).
3. 06: a részletes összefoglaló hossza — a prompt v3 (F-8.3) **legfeljebb 2 bekezdést** ad; a rajz kettője jó.
4. 08: a „Napi figyelés bekapcsolása" **a gombsorban harmadikként**, de csak sikeres próba után aktív; a mondat a próba eredménye alatt — ahogy rajzoltad. Gépezet: a beállítás `idozites.mod: "napi"` mentése (`PUT beallitas`), nincs új végpont.
5. Forrás-állapotok mondatai: `korlatozott` → „Ezt az oldalt csak részben tudjuk feldolgozni (nincs hírcsatorna, a szöveg egy részét látjuk)."; `nem_tamogatott` → „Ezt az oldalt nem tudjuk figyelni (belépés mögött van, vagy nem hírportál)." — a `hf.srcState_*` kulcsokban, én írom (szöveg nem kér előzetes jóváhagyást).

**R-7c**
1. 06: a szín-minták **fix készlet** (négy szín) — az arculat színei nem kerülnek a Theme-be (R-13, E3). Ahogy rajzoltad.
2. 08: a jelszó módosítása **párbeszédben** (az R-3 v2 rajz szerint, ma is így). Marad.
3. 05: a rövid jel mellé a **döntő szint neve** egy szóval („munkatér" / „közös alap") — a gépezet adja (`kozos`/`szervezeti`/`hatasos`), nem kerül többe.
4. 09: a szerepváltás **létezik** (`PUT /api/tagok/[fiokId]`, tulajdonos): az R-2 rajzon soron belüli választó — az R-7c 09 ezt **kihagyta**; a beépítésnél az R-2 09 sora marad (nem eltérés, hiány a rajzon — K-R7c-4 a Designnak: kérünk egy sort).
5. 10: az arculati anyagok listája **6 fájl** után „továbbiak" — a mai R-6 blokk így működik.

**R-7d**
1. A példa-kártya **kitalált marad**, „Példa" jelöléssel — valódi hír a nyitólapon ügyféladat lenne (A-11).
2. A kérdés–válasz **három** kérdés elég most; a negyedik („Mennyi ideig tart a beállítás?") csak mért idővel — F-8.5 után.
3. A román cím — az emberi lektor kérdése (rajtad-lista, 09-12 óta); a gépi fordítás marad addig.
4. Az adatkezelés lap **ugyanaz a kulcskészlet**, mint a Beállítások → Adatkezelés fül — egy szöveg, két hely (R-09).

## 4. A hat döntés — mi épül nélkülük, mi nem

| Döntés | Rajzolva | Nélküle épül | Csak Vilmos igenjével |
|---|---|---|---|
| 3.1 menünevek | A | a **szerkezet** minden lapon (a nevek feliratkulcsok — a mai értékkel) | a kulcsok új értéke (egy migráció) |
| 3.2 Mentés és vissza | A | az onboarding minden más része | a gomb viselkedése és felirata (`keret.tsx` egy sora) |
| 3.3 „még nem működik" dobozok | A | az Értesítések/Adatkezelés/Saját fiók új szerkezete | a dobozok elrejtése a tulajdonosnál |
| 3.4 jelszó-visszaállítás | A | a belépő lap mezőnkénti hibái | a hivatkozás + 02/B (és a kapcsolat-adat) |
| 3.5 magyar cím | A | a kártya új alakja az eredeti címmel | a fordított cím (mag 0.4, T-38) |
| 3.6 nyitólap adatai | A | a nyitólap új szerkezete a példa-kártyával, adat nélküli sorok elhagyva | az árazás/kapcsolat sor és a tájékoztató dátuma |

## 5. Amit ez az ellenőrzés eldöntött (D-F42)

- **Az F-8.2 (szövegtisztítás) beolvad az R-7 beépítésébe**: a rajz 334 kulcsa lefedi a terv F-8.2 a–g tételeinek nagy részét (hibaüzenetek, esemény-mondatok, halasztási mondat, üres állapotok). Külön Kimi-lektor csak a rajzon **nem** szereplő szövegekre megy (Theme haladó lap magyar–angol keveredése, `hiba.*` kódok, ami a kulcslistában marad) — a beépítés végén, egy menetben. Így nincs kétszer átírt kulcs.
- **A beépítés sorrendje:** R-7e (tokenek — minden lap ebből él) → R-7b (kezdőlap + hírek, az első használat útja, E1 gépezettel) → R-7a (első beállítás) → R-7c (beállítások-szint) → R-7d (nyitólap). Laponként kirakás, kép, fordított ellenőrzés.
- **Ágensek:** R-7e DeepSeek (design-system + migráció) és Kimi (a mezők átkötése `--control-min`-re, sokfájlos); R-7b DeepSeek ×2 (Attekintes/Beallitas — egy lap ≤ 450 sor egy menetben) + Kimi (kezdőlap) + Qwen próbák; R-7a Kimi + DeepSeek (E1 nincs, de a keret és a 3 lépés) + Qwen; R-7c Kimi (sok lap, kis változás) + DeepSeek (Megjelenés egyszerű nézet); R-7d Qwen. Feliratok: a rajz `feliratok.json`-jából generált migráció laponként (mint a 0051).

## 6. Mi kell a kódolás indításához

1. **Vilmos szava a rajzra** („mehet") — EGYUTTMUKODES 8.: kód csak a rajz jóváhagyása után.
2. A hat döntés — ami nincs meg, azt a 4. tábla szerint kihagyjuk, a többi épül.
3. Két kérdés a Designnak (K-R7c-4: a szerepváltó sora; K-R7c-6: a logó nem a Theme-é) — nem blokkol, a beépítés a régi rajz sorával megy.

## 7. Kiegészítés a beépítés közben (2026-09-13 este, R-7b)

| # | Lap · artboard | Mit találtunk | Mi lett vele |
|---|---|---|---|
| E8 | R-7b 08 | a rajz nem mutatja a figyelési célok chipjeit (a magban kötelező, min 1), a szabad szövegmezőt és a „Mikor?" rádiót | D-F44: a célok és a szabad szöveg nem látszanak, az értékük megmarad (üres célnál az alap áll be); a rádiót a „Napi figyelés bekapcsolása" gomb váltja; a saját név külön téma. **K-R7b-6 a Designnak**: ha kell a célok választója, a Pontosítás szakaszba fér |
| E9 | R-7b 05 | `hf.forras_nyelve` helyőrzője `{nyelv}` — a régi `hf.srcLangTag` `{l}`-t használt | a kód a rajz kulcsát és helyőrzőjét használja |
| E10 | R-7b · feliratok | a Design a meglévő fogalmakra ÚJ kulcsokat adott (`nav.hirek`, `nav.szervezet_adatai`, `hf.gomb_*`) | a menü a MEGLÉVŐ kulcsokat tartja új értékkel (0064: `nav.gephaz` = „Beállítások" stb.), a lapok új elemei a rajz kulcsait — egy fogalom, egy kulcs |
| E11 | R-7b 04 | a hírfigyelő fülsor alatti „Közös profil … az onboardingból átvéve" sor a rajzon nincs | elmarad (audit 11. P2) |
| E12 | R-7c 01 | a tulajdonos Gépháza sorlista lett; a `kezdolap.proba.ts` 12. esete az „Ami itt nincs" blokk osztályát (`km-gh-tulaj-nincs`) várta | az őrpróba a sorlista sorára (`km-gh-sor`) igazítva, indokkal a próbában (EGYUTTMUKODES: őrpróbát némán nem igazítunk) |
| E13 | R-7c 06 · E5 | a `--primary-2` származtatása | nem a design-systemben (a stored témák strict sémája törne), hanem a Megjelenés egyszerű nézete írja a `--primary-2`-t a fő színből (30% a fehér felé) — a haladó lapon a két token külön marad |
| E14 | R-7c 03–04, 08 | a rajz A-változata (a „még nem működik" dobozok eltűnnek) | **nem épült** — Vilmos 3.3 B: a dobozok maradnak az R-4 jelölés-nyelvével |
| E15 | R-7d 01 | a példa-kártya szövegei a rajzon szabad szövegként | feliratkulcsba (0068: `nyitolap.pelda_*`), „Példa" jelöléssel, a gomb nem visz sehova |
