# Gépezet — R-16 · Arculat (12 Szervezet adatai)

Az elv (Csilla, 2026-09-30): „we want Tibor to work as little as possible and give everything into his precious hands.” A gép javasol, Tibor jóváhagy; ami összerakást kér tőle (színválasztó, feltöltés), mindig csak második.

Ami a rajzhoz új adatot, tárolást vagy viselkedést kér. A sorszámokra a `DESIGN-KERES-R16-ARCULAT.md` 2. pontja és a rajz hivatkozik.
Honnan tudjuk, ami „VAN”: a kódból olvasva (2026-09-30, `main` 3e4916a), **élőben nem mérve**.

## Épül (a rajz jóváhagyása után, ebben a sorrendben)

1. **A5 javítása előbb, rajz nélkül is.** A képek ma a *jóváhagyott* pillanatképet használják, ha van (`vizual/helyzet.ts` `kepArculat`: `jov ?? tervezet`).
   Három eset, amikor a feltöltött logó nem jut el a képig:
   - jóváhagyott arculatnál a logó-feltöltés ÚJ tervezetet nyit (D-F31), a kép viszont a régi pillanatképből dolgozik, amelyben nincs logó;
   - „későbbre hagyott” arculatnál (`allapot = kesobb`) a feltöltés nem írja be a `logo_fajl_id`-t (`ArculatAnyagok.tsx`, `feltolt`: `arculat.allapot !== "kesobb"`);
   - tervezet nélkül (`tervezet = null`) sem.
   Javaslat: a logó (és az R-16 után minden logóváltozat és betűfájl) **nem az arculati állapotgép része**, hanem a munkatér saját fájlja: a kép mindig a legfrissebb feltöltött logót kapja. A színek és a betűk maradnak a jóváhagyás alatt.
   A kézikönyv, a referenciák és a dokumentumok ma semmilyen úton nem jutnak el a képekig — ezt a rajz nem is ígéri (lásd 8).
2. **Logóváltozatok.** Négy hely: `vilagos` (világos háttérre) · `sotet` (sötét háttérre) · `egyszinu` · `negyzetes`. Adat: `ArculatTervezet.logo_fajl_id` helyett
   `logok: { vilagos?, sotet?, egyszinu?, negyzetes? }` (fájl-azonosítók) — a régi mező a `vilagos` helyre költözik (migráció, adatvesztés nélkül; a pillanatképekben is).
   `FajlCel` marad `logo`; a változat a fájl mellé kerül (`arculat_fajl.logo_valtozat`, új oszlop, új migráció).
3. **Több logó egyszerre + a gép dönti el a helyét.** A feltöltő több fájlt fogad (a referencia/dokumentum mezőben ma is, A-7). Besorolás fájlonként, a képből:
   átlátszóság, átlagos világosság a nem átlátszó részen, színszám (1 szín → `egyszinu`), arány (≈ 1:1 → `negyzetes`). Ha két fájl ugyanarra a helyre esne, a második a következő üres helyre.
   Egy helyre koppintva csak az az egy cserélődik. A mai csere-megerősítő (R-6 05/A) jóváhagyott állapotban megmarad.
4. **Logó-választás képenként.** A képgyártó (`packages/vizual-core/src/helyzet.ts`) a kép hátterének világossága szerint választ: világos háttér → `vilagos`, sötét/színes → `sotet`,
   és ha az hiányzik, `egyszinu` fehérre színezve (átlátszó PNG-nél), végül a cég neve betűvel (mai viselkedés). A márkaréteg ugyanezt már tudja a referencia-márkára
   (`Marka.emblema.valtozatok`: háttérkulcs → SVG, `html.ts`) — ezt a mintát követjük. A `HelyzetArculat.logo` egy adat-URL-ből `logok` térképpé bővül.
5. **Olvasható szöveg minden színen.** A szín cseréjekor a gép maga választ világos vagy sötét betűt a háttérhez (a vizual-core `fenyesseg` függvénye megvan). Tibor nem tud rossz színt választani; figyelmeztetés nincs.
6. **Színösszeállítás-javaslatok (12d — ez az út).** A „Csere” a Színeknél NEM választót nyit, hanem 3–4 kész összeállítást (fő · második · háttér), mindegyik egy kész képen (a „színes” változat, hogy a szín legyen a kép).
   Sorrend: (a) a logóból vagy a honlapról (ha van: `onboarding/szinek.ts` `jeloltek` + a feltöltött logó színei); (b)–(d) a 09-28 kérés bevált összeállításaiból (természetes · meleg · friss · megbízható · elegáns · játékos)
   azok, amelyek a cég szakmájához illenek (szakma → hangulat tábla a kódban; ahol a szakma ismeretlen: természetes · megbízható · meleg). A mostani mindig az első, ✓-val.
   Mintakép: a `helyzet-minta` POST változata (9) összeállításonként, ugyanazzal a szöveggel. Egy koppintás + „Ez legyen” = mentés.
6b. **Más színt (12d2 — a kivétel).** A logóból kinyert 3–5 szín (a honlap-színek szűrőjével: fehér/fekete/szürke ki) és egy 12 színű, rögzített gyűrű (a bevált összeállítások színeiből; egy lista a kódban). Csak a „Más színt” mögül nyílik.
7. **Két betű a képen.** Ma a kép EGY betűt használ (`betu_cim || betu_szoveg`, `kepArculat`). Kell: `HelyzetArculat.betu_cim` + `betu_szoveg`, a képgyártó a címre az elsőt, a többire a másodikat.
   A választható lista **pontosan a képgyártó betűi**: archivo · public-sans · space-grotesk · ibm-plex-sans · gelasio (`BETUK`, `tools/vizual/referencia/betuk-munkater/`).
   A mai választó (`ArculatBlokk.tsx`) Georgia/Cairo/Tajawal elemei ma csendben Public Sansra esnek vissza a képen — a listát a képgyártóéhoz igazítjuk (a Georgia → Gelasio megfeleltetés marad).
8. **Saját betű feltöltése.** Új fájltípusok: `ttf`, `otf`, `woff2` (`FajlTipus` bővítése, tartalom-alapú felismerés, 10 MB), új cél: `FajlCel = "betu"`. Feltöltéskor a gép megnézi:
   van-e benne á é í ó ö ő ú ü ű (és ă â î ș ț, ha a munkatér nyelvei közt a román) — ami hiányzik, azt a tartalék betű írja, és ezt egy halk sor mondja (`r16.arculat.betu.hianyzo_betuk`).
   A betű a képgyártóhoz a logóhoz hasonlóan, munkaterenként jut el (`@font-face` adat-URL-ből vagy a képgyártó munkatér-mappájából). A betű a választólistában „Saját: <név>” sorként jelenik meg.
   **Licenc:** a feltöltő felel érte — egy mondat a feltöltés mellett (kerdesek 2).
9. **„Így néz ki” — a minta a szerkesztett összeállítással.** A mai `GET /api/vizual/helyzet-minta/[helyzet]` a mentett arculatot rajzolja. Kell egy változat, amely a
   még nem jóváhagyott összeállítást kapja (`POST`, a törzsben a színek/betűk/logók), hogy a kép a koppintás után ~1 mp-en belül újra készüljön. Két kép: a világos és a „színes” változat (VZ-3), hogy a sötét hátterű logó is látszódjon.
   „Másik minta” = a következő helyzet (kesz → akcio → uj → …), a Képek lap példaszövegeivel (`peldakFrissen`).
10. **A megtalált logó mentése fájlként.** Az első beállítás kutatása ma csak a logó címét adja (`honlapSzinek(...).logo`). Letöltés (`@km/letolto`, ugyanazzal a védelemmel), típus-ellenőrzés, mentés `arculat_fajl`-ba `logo`/`vilagos` helyre, `eredet = "honlap"`.
    Így a 12b „Ezt találtuk” logója valódi fájl, és a kép már az első napon a cég logójával készül.
11. **A tervezet-doboz beolvasztása (A9).** Ha Vilmos igent mond (kerdesek 1): a `Fiok.tsx` `<details>` alatti „Vizuális arculat — tervezet” kártya és az `ArculatBlokk` szerkesztője helyére ez a szakasz lép.
    A mai mezők közül a képvilág, követendő, kerülendő és lekerekítés a „Részletek” mögé kerül (a gép használja — `onboarding/arculat.ts`, poszt-író), semmi nem vész el. Az állapotgép (tervezet → jóváhagyott, verziók) marad.
12. **Egy jóváhagyás.** 12b „Igen, ez mi vagyunk” = `arculatJovahagy` (van). 12a „Így jó, logó nélkül” = ugyanaz. Minden későbbi „Ez legyen” (12d összeállítás, 12d2 szín, 12e betű, 12g névlogó) azonnal ment és jóváhagy (új verzió), mert Tibor a képen már látta, mit választ.
13. **Névlogó a gép kezéből (12g — „Nincs logóm” → „Készítsünk egyet?”).** Új gépezet: névlogó-készítő a `vizual-core`-ban, tiszta függvény: `(cégnév, címbetű, színek, stílus) → SVG`.
    - Három stílus: csak a név · kis kör + név · négyzetes kezdőbetű + név. Semmi rajzolt kép, semmi AI-kép — ezt nem is ígérjük.
      **c10 (2026-09-30, UTOKERES-12G):** a három stílus elrendezésben különbözik — szó (`nev`) · kezdőbetű körben, alatta a név (`kor`, álló) ·
      a név kerettel egy második színű sávban (`negyzet`, fekvő). A tárolt enum-értékek nem változtak (TERV 1.7 R1); a négyzetes hely mindháromnál a kezdőbetűs négyzet.
    - A betű a munkatér címbetűje (az öt beépített, vagy a saját feltöltött); a szöveg útvonallá alakítva kerül az SVG-be (a betűfájl nélkül is ugyanúgy néz ki), ezért kell egy betű-útvonal könyvtár a képgyártóba (pl. opentype.js).
    - **Ékezetek:** a magyar (á é í ó ö ő ú ü ű) és román (ă â î ș ț) betűk kötelezők; próba: „Ördögh Ősz Árpád Kft.”, „Știință și Țară SRL”, hosszú, 40+ betűs név (két sorra törés vagy kisebb méret, nem vágás).
    - A négy változat magától: világos háttérre (fő szín), sötét háttérre (háttérszín / második), egy színnel (fekete és fehér), négyzetes (a kezdőbetű a négyzetben, név nélkül).
    - Tárolás: négy PNG (és az SVG) `arculat_fajl`-ként, `logo` cél, a négy `logo_valtozat` helyen, `eredet = "gep"`. Ha a cég később színt vagy címbetűt vált, a gép-készítette logó újra készül (a feltöltött soha).
    - Mintakép stílusonként: a `helyzet-minta` POST változata (9) a jelölt névlogóval.
    - „Inkább feltöltöm” → 12f. A „Nincs logóm” a 12a logó-sorában és a 12f-en is ott van.

## Nincs (a rajz nem is ígéri)
- Stílus-szettek (B3: beauty · tech · minimal · colorful) — ezekből a készletből fognak olvasni, később.
- A kézikönyv PDF automatikus beolvasása (színek, betűk a kézikönyvből) — a „Fájlok” alatt marad, a gépnek nincs ilyen útja ma.
- Szín kód beírása — szándékosan nincs (T3).
