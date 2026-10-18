# Feladat — TESZTELŐ (E-16): próbák a feliratok két szintjére (közös felülírás + szervezeti felülírás)

Vitest 5; futó alkalmazás ellen (`PROBA_CIM`), `DATABASE_URL` (km_tulaj). Mellékelve: a segédek (`segedek.ts`), az E-13 téma-próba
MINTÁNAK (`tema.proba.ts` — a fiókok/szervezetek felállítása, a `temaBol` burok-segéd, a rendszergazda SQL-lel), és a feliratok
szabályai (`feliratok.ts`: `FeliratSzintAllapot`, `FeliratHiba`, `FeliratFelulirasok`).

## Az API (mind `cache-control: no-store`; a válasz burka `{ feliratok: FeliratSzintAllapot }` — a hibás 400: `{ hiba, felirat_hibak, figyelmen_kivul }`)
- `GET /api/feliratok` → 200 (bármely tag); süti nélkül 401; szervezet nélkül 409. `feliratok.alatta.{hu,ro,en}` a hatásos alsóbb szint
  (alap + közös), `feliratok.kulcsok` az ismert kulcsok (rendezve, > 300 db), `alkalmazott`/`tervezet` null, `verziok` üres.
- `PUT /api/feliratok` törzs `{ "$schema": "km-feliratok/1", "feliratok": { "hu": { "belepes.gomb": "Belépés ide" }, "ro": {…} } }` → 200:
  `feliratok.tervezet.felulirasok` = CSAK az alsóbb szinttől eltérő szövegek (a változatlanul visszaküldött érték NEM kerül be);
  ismeretlen kulcs → nem hiba, a `figyelmen_kivul` listába kerül; hibás → 400 `ERVENYTELEN_ADAT` + `felirat_hibak` (`kulcs`, `nyelv`,
  `kod`: `emptyValue` üres szövegre, `badChar` `<`-re, `badLang` ismeretlen nyelvre, `badVersion` rossz `$schema`-ra) és SEMMI nem változik;
  nem tulajdonos → 403.
- `POST /api/feliratok/alkalmaz` → 200 / 409 `NINCS_TERVEZET`; `DELETE /api/feliratok` → 200 / 409; `POST /api/feliratok/visszaallit` `{ verzio }`
  → 200 (új tervezet) / 404 `NINCS_ILYEN_VERZIO`.
- `/api/feliratok/kozos…` ugyanez a rendszergazdának (`UPDATE fiok SET rendszergazda = true WHERE email = $1`, a végén vissza false);
  nem rendszergazda → 403.
- **A lap feliratai:** `GET /belepes` (süti nélkül) és `GET /onboarding/1` (sütivel) HTML-je a hatásos feliratokkal készül. A `belepes.gomb`
  szöveg a belépés lapján a gomb felirata (`<button …>Belépés</button>`); a `kozos.kilepes` („Kilépés”) minden belépett lap fejlécében látszik.

## Adatbázis
`kozos_felirat_verzio` (verzio, felulirasok jsonb, allapot), `szervezet_felirat_verzio` (szervezet_id, verzio, felulirasok, allapot); a csomag alapja a `felirat` tábla (kulcs, nyelv, szoveg).

Add vissza: `apps/web/probak/feliratok.proba.ts` — a `beforeAll`-ban két tulajdonos (A, B szervezet), egy harmadik fiók (C, saját szervezet),
egy negyedik SQL-lel `szerkeszto` az A-ban. Esetek, sorrendben:
1. 401 süti nélkül; 409 szervezet nélkül; A GET → 200, `kulcsok.length > 300`, `alatta.hu["kozos.kilepes"] === "Kilépés"`, `alkalmazott === null`.
2. A PUT `{ hu: { "kozos.kilepes": "Kilépés innen", "belepes.gomb": <az alatta.hu értéke változatlanul> }, ro: { "kozos.kilepes": "Ieșire de aici" }, en: { "nincs.ilyen": "x" } }`
   → 200: `tervezet.verzio === 1`, `tervezet.felulirasok.hu` PONTOSAN `{ "kozos.kilepes": "Kilépés innen" }`, `.ro` `{ "kozos.kilepes": "Ieșire de aici" }`,
   nincs `.en`; `figyelmen_kivul` = `["nincs.ilyen"]`; `alkalmazott === null`.
3. A PUT hibás: `{ hu: { "kozos.kilepes": "" }, ro: { "kozos.kilepes": "a<b" }, xx: { "kozos.kilepes": "y" } }` → 400, `felirat_hibak` 3 elem
   (`emptyValue`, `badChar`, `badLang`); GET → a tervezet a 2. szerinti. `$schema: "km-feliratok/0"` → 400 `badVersion`. Nem-JSON → 400.
4. Szerkesztő: GET 200; PUT 403; alkalmaz 403. B: alkalmaz tervezet nélkül 409; DELETE 409.
5. A alkalmaz → 200: `alkalmazott.verzio === 1`, `tervezet === null`, `verziok` 1 elem. **A lap:** `GET /onboarding/1` A sütijével → a HTML-ben
   „Kilépés innen” (és NEM „>Kilépés<”); B sütijével „Kilépés” (nem „innen”); C sütijével „Kilépés”; román nyelven (`Cookie: km_nyelv=ro`) A-nál „Ieșire de aici”.
   (A fejléc kilépés-gombja: keresd a szöveget a HTML-ben.)
6. **Tartaléknyelv:** SQL: `DELETE FROM felirat WHERE kulcs = 'kozos.kilepes' AND nyelv = 'en'` — utána A angolul (`km_nyelv=en`) a magyar felülírást
   látja („Kilépés innen”), C angolul a magyar alapot („Kilépés”); a végén visszaírod: `INSERT INTO felirat (kulcs, nyelv, szoveg) VALUES ('kozos.kilepes','en','Sign out')`.
   MEGJEGYZÉS: a lap feliratai 60 mp-ig gyorsítótárból jöhetnek — a próbában a törlés/visszaírás után hívd meg a `POST /api/belso/elvalasztas`
   helyett… NINCS ürítő pont; ezért ezt a 6. esetet úgy írd, hogy a törlés UTÁN egy `PUT`+`alkalmaz` legyen A-nál (az alkalmazás üríti a szervezeti
   és a közös gyorsítótárat, az alap-gyorsítótár 60 mp): ha az alap-gyorsítótár miatt nem determinisztikus, jelöld `it.skip`-pel és írd le a jegyzetben.
7. A 2. tervezet `{ hu: { "kozos.kilepes": "Kilépés (2)" } }` + alkalmaz → `alkalmazott.verzio === 2`, `verziok` 2 elem; `visszaallit { verzio: 1 }` → 200,
   `tervezet.verzio === 3`, `tervezet.felulirasok.hu["kozos.kilepes"] === "Kilépés innen"`, `alkalmazott.verzio === 2`; `visszaallit { verzio: 99 }` → 404.
8. A: PUT `{ hu: { "kozos.kilepes": <az alatta.hu érték, „Kilépés”> } }` → `tervezet.felulirasok` `{}` (= visszaállítás a közösre); alkalmaz → a lap újra „Kilépés”.
9. **Közös:** A nem rendszergazda → GET `/api/feliratok/kozos` 403. Rendszergazda (SQL): GET 200 (`alatta.hu["kozos.kilepes"] === "Kilépés"`, `alkalmazott === null`);
   PUT `{ hu: { "kozos.kilepes": "Kijelentkezés" } }` → 200; alkalmaz → 200. Utána C GET `/api/feliratok` → `alatta.hu["kozos.kilepes"] === "Kijelentkezés"`;
   C lapja „Kijelentkezés”. Visszaállítás: PUT `{ hu: { "kozos.kilepes": "Kilépés" } }` (= üres felülírás) + alkalmaz; C lapja újra „Kilépés”. SQL: pontosan egy
   `kozos_felirat_verzio` 'alkalmazott'. A végén `rendszergazda = false`.
10. Takarítás: `takaritas()`, `lezar()`; a `kozos_felirat_verzio` sorai maradhatnak.

Nincs `any`; a válaszokat `FeliratSzintAllapot.safeParse`-szal is ellenőrizd (import `@km/design-system`). Egy `describe`, sorrendfüggő `it`-ek.
