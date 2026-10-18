# Feladat — ÉPÍTŐ (R13-Q1): élő próbák a kredit- és a saját-szűrés végpontokhoz

Vitest, TypeScript strict, nincs `any`. Magyar azonosítók (ékezet nélkül) és magyar megjegyzések. Egyetlen fájl:
`=== FÁJL: apps/web/probak/kredit.proba.ts ===` … `=== FÁJL VÉGE ===`, TELJES fájl.

A minta mellékelve (`minta-koltseg.proba.ts`: fiók + munkatér létrehozása, rendszergazda-jelölés SQL-lel, takarítás);
a segédek (`segedek.ts`: `keres`, `veletlenEmail`, `sql`, `takaritas`, `lezar`, `sutiKinyer`). PONTOSAN így használd
őket. Az élő rendszert hívja (`PROBA_CIM`), az adatbázist a `sql`-lel éri el.

## A végpontok (ez a szerződés)

- `GET /api/hirfigyelo/sajat-szures` (bármely tag) → 200 `{ szures: { fokozat: "nagyon_szigoru" | "kozepes" | "laza", eloszures: boolean } }`;
  alap: `{ fokozat: "nagyon_szigoru", eloszures: true }`.
- `PUT /api/hirfigyelo/sajat-szures` törzs `{ fokozat, eloszures }` → 200 ugyanazzal; rossz törzs (pl. `{ fokozat: "nagyon" }`) → 400.
  Megjegyzés: a hírfigyelő modul a munkatér csomagjától függ; az új munkatér alapcsomagja („radar”) tartalmazza.
- `GET /api/kredit/sajat` (bármely tag) → 200 `{ kredit: { honap: "YYYY-MM", havi: number, felhasznalt: number, maradt: number,
  kulon_megadott: boolean, munkater_elfogyott: boolean, bontas: { hirek, poszt, iranytu, egyeb } } }`.
  Egy tagú munkatérben a havi = a munkatér teljes havi kreditje (alap 1000).
- `GET /api/kredit/tagok` (csak TULAJDONOS) → 200 `{ kredit: { honap, munkater: { havi, felhasznalt, kiosztott, kiosztatlan },
  tagok: [{ fiok_id, nev, szerep, kulon: number | null, havi, felhasznalt, maradt }] } }`; belépés nélkül 401.
- `PUT /api/kredit/tagok/{fiokId}` (tulajdonos) törzs `{ havi: number | null }` → 200; nem tag fiókra 404; rossz törzs 400.
- `PUT /api/kredit/munkater/{szervezetId}` (CSAK rendszergazda) törzs `{ havi: number | null }` → 200; közönséges tagnak 403.
- `GET /api/kredit/munkaterek` (csak rendszergazda) → 200 `{ kredit: { munkaterek: [{ szervezet_id, havi, felhasznalt }] } }`; tagnak 403.

## Próbák (legalább ezek)
1. Belépés nélkül a `GET /api/kredit/sajat` és a `GET /api/hirfigyelo/sajat-szures` 401.
2. Új munkatér tulajdonosa: `sajat-szures` alap = nagyon szigorú + be; `PUT { fokozat: "kozepes", eloszures: false }` után a GET ezt adja; rossz fokozat 400.
3. `GET /api/kredit/sajat`: honap formátum, havi 1000, felhasznalt 0, maradt 1000.
4. `PUT /api/kredit/munkater/{sajat szervezet}` közönséges tagnak 403; a rendszergazdának (a `gazda` fiók, mint a mintában) `{ havi: 300 }` → 200, és utána a tag `GET /api/kredit/sajat` havija 300; a végén `{ havi: null }` → vissza 1000.
5. Két tag: a tulajdonos meghív egy második fiókot. A meghívás útja bonyolult — HELYETTE SQL-lel tedd be a második fiókot a munkatérbe: `INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'szerkeszto')`. Ekkor a `GET /api/kredit/tagok` két tagot ad, havi 500 / 500. `PUT /api/kredit/tagok/{masodik} { havi: 200 }` után 800 / 200 (a tulajdonosé az egyenlő rész: 1000 − 200). `{ havi: null }` után vissza 500 / 500.
6. A `GET /api/kredit/tagok` a szerkesztőnek (a második fiók) 403.
7. `PUT /api/kredit/tagok/00000000-0000-4000-8000-000000000000 { havi: 10 }` a tulajdonosnak 404.
8. A felhasznált kredit a `kredit_mozgas` táblából jön: SQL-lel szúrj be a második fióknak egy sort (`INSERT INTO kredit_mozgas (szervezet_id, fiok_id, honap, ezred, feladat) VALUES ($1, $2, $3, 1500, 'poszt_szoveg')`, a honap a `GET /api/kredit/sajat` válaszából), és a második fiók `GET /api/kredit/sajat`-ja: felhasznalt 1.5, bontas.poszt 1.5.

`afterAll`: a rendszergazda-jelölés és a kredit visszaállítása, `takaritas()`, `lezar()` — mint a mintában.
A blokkon kívül legfeljebb 10 sor magyarázat.
