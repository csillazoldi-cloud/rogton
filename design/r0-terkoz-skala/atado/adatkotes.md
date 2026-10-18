# Adatkötés — R-0 · Térköz-skála

Ez a rajz nem ügyféladatból dolgozik, hanem **a rendszer saját adatából**: a token-táblából és
egy mérésből. Ezért az adatkötés rövid, de van, és pontosan meg kell mondani, mi honnan jön —
különben a Theme-lap számai kitalált számok lennének.

## 1. A skála maga (1., 4. és 5. artboard)

| Elem a rajzon | Adat | Ma megvan? |
|---|---|---|
| a fok neve (`--ter-0` … `--ter-14`) | **token-tábla**: a téma tokenjeinek neve | a tábla megvan, ez a tizenöt sor új |
| a fok értéke (0px … 80px) | **token-tábla**: az aktív téma értéke, a Theme lapról állítva | igen, ugyanaz a gépezet, mint az 53 mai tokennél |
| a köz rajza (a vonal hossza) | **számolt**: a fok értéke, pixelben — nincs mögötte új adat | igen |
| „248 helyen” használati számláló | **használat-számolás**: a kód átvizsgálása fokonként | **nincs meg — ez az egyetlen új gépezet** |
| a mező zárt volta a `--ter-0`-nál | a fok sorszáma (a nullás fok nem állítható) | — szabály, nem adat |
| „68 token · 6 csoport” | a token-tábla sorainak és csoportjainak száma | igen, számolt |
| „mentetlen tervezet” jelvény | a Theme-lap tervezetének léte — ma is így működik | igen |

## 2. Az átállási mérleg (1. artboard) és az előtte–utána (3. artboard)

| Elem | Adat |
|---|---|
| 790 · 179 · 34 · 18 | a 2026-09-01-i mappamásolaton végzett **mérés** a stíluslapok és az R-1 rajza térköz-értékein |
| a bal oldali részlet pixelértékei (22 · 9 · 7 · 13 · 26 · 10 · 16) | a meglévő stíluslapokból kiolvasott mai értékek |
| a jobb oldali részlet fokai | a `ATADO.md` 3. pontjának átállási kulcsa, gépiesen alkalmazva |
| „Mozdul” oszlop | számolt: a fok értéke mínusz a mai érték |

**A mérés kora:** a másolat tíz napos, tehát a számok nagyságrendre pontosak, utolsó egységre
nem. A javítás előtt a mérést le kell futtatni a mai kódon — lásd `kerdesek.md` 2.1.

## 3. Amit a rajz megépítésre kötelez

| Elem | Mi kell mögé |
|---|---|
| a tizenöt fok | tizenöt új sor a token-táblában, a Theme-lap szerkesztőjével és a monotonitás ellenőrzésével |
| a mai hét térköz-token (+ az R-1/R-2 három tokenje) | átírás `var(--ter-*)`-ra a `szarmaztat()`-ban |
| 1021 pixelérték a stíluslapokban | gépies átírás az átállási kulcs szerint |
| a használati számláló | **használat-számolás**: fokonként hány helyen szerepel a kódban. Két út: építéskor számolt szám (nincs új tábla, de a Theme-lap adatot kap a buildből), vagy a mérés eredményének tárolása a token-táblában. Egyik sincs meg ma. |
| a köz rajza | semmi új — a fok értékéből számolt szélesség |

## 4. Halott vezérlő nincs

A rajzon négy vezérlő van, mindegyik mögött gépezet:

| Vezérlő | Mi hajtja |
|---|---|
| a fokok szerkesztőmezői | a téma tokenjeinek szerkesztése — ma is működik az 53 tokenre |
| „Alkalmazás” | a tervezet alkalmazása — ma is működik |
| „Tervezet elvetése” | a tervezet elvetése — ma is működik |
| a csoportválasztó fülek (Szín · Betű · … · Térköz) | a Theme-lap saját csoportjai — a lap szerkezete, nem új végpont |

A `--ter-0` mezője **szándékosan zárt**, nem halott: a térköz hiánya nem állítható érték,
és ezt a csoport súgója ki is mondja.

## 5. Amit a rajz NEM tartalmaz

- **Fok felvétele és törlése.** A skála zárt — nincs „+ Új fok” gomb, mert nem is lenne szabad
  megnyomni.
- **Külön telefonos skála.** Nincs, és a lap ezt ki is mondja: a lépcső ugyanaz, csak a
  fokválasztás más.
- **Automatikus átállítás.** A rajzon nincs „Írja át a kódot” gomb: az 1021 hely átírása
  fejlesztői munka, nem felületi művelet.
