# Feladat — TESZTELŐ (E-29c): az AI válaszainak nyelve élő próbákban

Eddig a hírfigyelő AI-ja MINDIG magyarul válaszolt. Mostantól a FELÜLET nyelvén válaszol: azén, aki a futást indította,
a napi automatikus futásnál a szervezet tulajdonosáén. Ehhez a nyelvváltás a fiókra is mentődik.

Mellékletben: `API-LAP.md` (a hírfigyelő API-ja), `segedek.ts` (a próbák segédfüggvényei: `keres`, `sql`, `veletlenEmail`, `takaritas`, `lezar`),
`hirfigyelo.proba.ts` (a stílus és a belépés-minta mércéje: regisztráció → belépés → szervezet → sütik).

## Ami elkészült, és amit bizonyítani kell

1. **`POST /api/nyelv` `{ nyelv: "ro" }`** → 204, a nyelv-süti beáll, ÉS ha van belépett fiók, a `fiok` tábla `nyelv` oszlopa is `ro` lesz.
   Belépés nélkül is 204, csak a fiókra nem ment semmit. Hibás érték (`{ nyelv: "xx" }`) → 400 `ERVENYTELEN_ADAT`.
2. **A sorba tett futás viszi a nyelvet**: `POST /api/hirfigyelo/futas` után a `GET /api/hirfigyelo/futas/sor/{id}` válaszában
   a tétel `adat` mezőjében `nyelv` szerepel, és az értéke a fiók nyelve (`ro`, ha előtte románra váltott).
   Ugyanez a `POST /api/hirfigyelo/ertekeles-ujra` tételére is.
3. **A nyelv nélküli fiók magyart kap**: friss fiók (nem váltott nyelvet) → a tétel `adat.nyelv` értéke `hu`.
4. **A `fiok.nyelv` az egyetlen tárolt hely**: SQL-lel ellenőrizd (`SELECT nyelv FROM fiok WHERE id = ...`), hogy a nyelvváltás után `ro`,
   és hogy egy másik fiók nyelvét NEM írta át.

## Amit készítesz: `apps/web/probak/nyelv-ai.proba.ts` (vitest, ÉLŐ próbák a futó alkalmazás ellen)

A minta a `hirfigyelo.proba.ts`: `beforeAll`-ban regisztráció + belépés + szervezet létrehozása a `keres` segédfüggvénnyel; a végén `takaritas()` és `lezar()`.
A `PROBA_CIM` és a `DATABASE_URL` környezeti változóból jön (a segédek intézik). NE indíts valódi AI-futást: a sortétel megvizsgálása elég —
a `POST /api/hirfigyelo/futas` 202-t ad, és a tétel `var` állapotban is olvasható; ha a beállítás hiányzik, előbb mentsd el egy `PUT /api/hirfigyelo/beallitas`-szal.

Legalább 6 próba a fenti négy ponthoz. A `nyelv` mező helye a válaszban: `{ hirfigyelo: { sor: { adat: { nyelv } } } }`.

## Szabályok

TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), vitest, magyar `it(...)`-leírások és megjegyzések.
NINCS `any`, nincs `console.log`, nincs új npm-függőség. A `keres` visszatérése `{ statusz, fejlecek, sutik, torzs }` — a `torzs` típusát `as`-szal szűkítsd.
A süti-továbbadás a `sutik` mezővel megy (lásd a mintát). NE találj ki nem létező útvonalat vagy mezőt.

A választ ADD VISSZA A FÁJLT TELJES EGÉSZÉBEN, ```ts blokkban, fölötte a fájl útvonalával.
