# Ellenőrzés — R-2 · Tagok és meghívás (a Design csomagja, 2026-09-12 20:43)

Mérve az `atado/` csomagon (python a `feliratok.json`-on és a `.dc.html` törzsén; `_artboardok.mjs` a képekhez). Minden szám mérés.

## 1. Összegzés

**Hibátlan, beépíthető.** 7/7 artboard, 0 pixel-térköz a rajz törzsében, 0 beégetett szín, 70 kulcs három nyelven hiánytalanul; a rajz minden
kattintható eleme mögött megnevezett végpont áll, és a hibakódok a rendszer szavaival egyeznek. A Design hat kérdésére lent a válasz — négyre a
kód ad választ, kettő döntés (D-F30).

## 2. A mérés

| Mit | Eredmény |
|---|---|
| Artboardok | **7/7** (01 normál · 02 első használat · 03 meghívás A/B/C · 04 szerep-átállítás · 05 zárt utak A/B/C · 06 telefon · 07 beváltó lap A/B/C) |
| px-térköz a rajz törzsében | **0**; beégetett hex: **0** |
| Feliratkulcsok | **70**, mind a három nyelven; előtagok `tagok.*`, `meghivo.*` (+ a `kozos.*`, `nav.*` az R-1-ből) |
| Kulcs a rajzon, ami nincs a JSON-ban | csak az R-1 sávjának kulcsai (a rendszerben megvannak) |
| Végpont-megfelelés | a 9 művelet mind létező végpontra mutat (ATADO 3. pont) |
| Amit a rendszerben pótolok | 4 kulcs a rajzon kívül: két oldalcím, „A meghívó hét napig él" (az 1. kérdésre), betöltési hiba — a 0054 migrációban |

## 3. A Design kérdései — válaszok (a kódból mérve)

| # | Kérdés | Válasz |
|---|---|---|
| 1 | Meddig él a meghívó, állítható-e? | **Fix 7 nap** (`MEGHIVO_ERVENYESSEG_NAP = 7`), nem állítható. A párbeszédbe egy mondat kerül a kiadás előtt: `meghivo.elettartam` — a kódban pótolom, a rajz nem változik. |
| 2 | A szerkesztő visszavonhatja-e más meghívóját? | **Igen, bármelyiket**: a visszavonás jogát a szerep adja, a kiadóra nem szűkít (`meghivoVisszavon` → `dont(ktx, "meghivo_visszavon")`). A szerkesztő nézetén a Visszavonás látszik. |
| 3 | A szerkesztő nézete: Meghívás van, Szerep/Eltávolítás nincs — kell 8. artboard? | **Nem kell.** Így épül: Meghívás **van** (nézőt/szerkesztőt hívhat), a Szerep lenyíló és az Eltávolítás **nincs** (nem halvány — nincs). |
| 4 | Az eltávolított tag munkája marad-e (pl. a jóváhagyó neve)? | **Marad, de ma a név eltűnne**: a jóváhagyó nevét a kód a *tagsági* listából keresi, nem a fiókból (`Fiok.tsx`, `kezdolap/index.ts`). Ezt az F-3e építésben javítom: a név a fiókból jön, a tagságtól függetlenül — így a rajz mondata igaz. |
| 5 | Kilépés a munkatérből — a Tagok lapon is? | **Nem**, csak az R-3 Saját fiók lapon (munkaterenként). A Tagok lapon az 05/A zárt állapota jegyzet marad. |
| 6 | Amit a feladatlap kért, de a gépezet nem tud | nincs ilyen — egyezik. |

## 4. Döntések ebből (D-F30)

A beváltó lapon **nincs felső sáv** (a látogató még nem tag) — elfogadva. A `MAR_TAG` semleges, nem hibaszínű — elfogadva. A saját sor vezérlői nem
aktívak, a `MAGAT_NEM` a felületen nem fordul elő — elfogadva. A megerősítés alsó sáv, nem párbeszéd — elfogadva (E-50 tanulsága).

## 5. Ami az építéshez kell a gépezetből (nem a rajz hibája)

- **A meghívó megtekintése jegy alapján, belépés előtt** (07/B: „X meghívott a Y munkatérbe") — ehhez nincs végpont; a beváltás (`POST /api/meghivo/elfogad`)
  egyben elfogad. Épül: `GET /api/meghivo/{jegy}` (nyilvános, csak a meghívó nevét, a munkatér nevét, a szerepet és az állapotot adja; a jegyet nem naplózza).
- **Belépés/regisztráció után vissza a beváltó lapra** (07/B) — a belépőlap ma mindig a kezdőlapra visz; kap egy `vissza` címet (csak saját, `/`-rel kezdődő út).
- **A taglista neve és e-mailje**: a `GET /api/tagok` a modul `Tag` alakját adja (fiók-azonosító, szerep, csatlakozás); a nevet és az e-mailt a befogadó teszi
  hozzá (a `szervezet/reszletek` mintájára) — a rajz ezt kéri, a végpont bővül, a modul nem.
