# Feladat — TESZTELŐ (E-13): próbák a téma két szintjére (közös alap + szervezeti felülírás)

Vitest 5; futó alkalmazás ellen (`PROBA_CIM`), `DATABASE_URL` (km_tulaj, teljes jog). Mellékelve: a segédek (`./segedek`:
`keres`, `veletlenEmail`, `sql`, `takaritas`, `lezar`), az E-10 próba MINTÁNAK (`profil.proba.ts`: fiók + szervezet a
`beforeAll`-ban — regisztráció 201, belépés 200, szervezet 201; a sütik `belepes.sutik.join("; ")`), a design-system
téma-szabályai (`tema-szintek.ts`: `TemaHiba`, `SzervezetTemaAllapot`, `KozosTemaAllapot`, `egyesit`, `felulirasokSzamol`,
`temaEllenoriz`, `TOKEN_KULCSOK`) és az API-pontok leírása alább.

## Az API (mind `cache-control: no-store`)
- `GET /api/tema` → 200 `{ tema: SzervezetTemaAllapot }` (bármely tag); süti nélkül 401; szervezet nélkül 409.
- `PUT /api/tema` törzs `{ "$schema": "km-theme/2", "tokens": { ...RÉSZLEGES vagy teljes... } }` → 200 `{ tema }`, benne `tema.tervezet.felulirasok` = CSAK a közös alaptól eltérő tokenek; ismeretlen kulcs nem hiba, a `tema.figyelmen_kivul` listába kerül; hibás érték → 400 `{ hiba: "ERVENYTELEN_ADAT", tema_hibak: TemaHiba[], figyelmen_kivul }` és SEMMI nem változik; nem tulajdonos (szerep `szerkeszto`/`nezo`) → 403 `NINCS_JOG`.
- `POST /api/tema/alkalmaz` → 200 `{ tema }` (`tema.alkalmazott.verzio` = a volt tervezet verziója, `tema.tervezet === null`, `tema.hatasos` = alap + felülírás); nincs tervezet → 409 `NINCS_TERVEZET`.
- `DELETE /api/tema` → 200 (a tervezet korábbi lesz); nincs tervezet → 409.
- `POST /api/tema/visszaallit` `{ verzio }` → 200: abból ÚJ tervezet lett (`tema.tervezet.felulirasok` = annak a verziónak a felülírásai; az alkalmazott NEM változott); nem létező verzió → 404 `NINCS_ILYEN_VERZIO`.
- `GET|PUT|DELETE /api/tema/kozos`, `POST /api/tema/kozos/alkalmaz`, `POST /api/tema/kozos/visszaallit` — ugyanez a közös alapra (`KozosTemaAllapot`: `alkalmazott.tokenek` teljes készlet, `tervezet`, `verziok`); NEM rendszergazda → 403 `NINCS_JOG`. A rendszergazda-jelölést a próba SQL-lel adja: `UPDATE fiok SET rendszergazda = true WHERE email = $1` — és a végén visszaveszi (`false`).
- A lap feje: `GET /belepes` (süti nélkül) és `GET /fiok` (sütivel) HTML-jében `<style id="km-tokenek">:root{--bg:...;...}</style>` — a belépett szervezet HATÁSOS tokenjei (közös alap + alkalmazott felülírás); belépés nélkül a közös alap. A `/fiok` sütivel 200-at ad (jóváhagyott profil nélkül is).

## Adatbázis (a próba SQL-lel is ellenőriz)
- `tema` (közös alap): `verzio`, `allapot` ('tervezet'|'alkalmazott'|'korabbi'), `definicio` jsonb (`{ $schema, name, tokens }`), `alkalmazva`. Pontosan egy 'alkalmazott'.
- `szervezet_tema`: `szervezet_id`, `verzio`, `felulirasok` jsonb, `allapot`, `alkalmazva`. Szervezetenként legfeljebb egy tervezet és egy alkalmazott.

Add vissza: `apps/web/probak/tema.proba.ts` — esetek (a `beforeAll`-ban KÉT tulajdonos fiók KÉT szervezettel (A és B), egy HARMADIK fiók
a saját szervezetével (C), és egy NEGYEDIK fiók, amit SQL-lel `szerkeszto` szerepben az A szervezetbe teszel:
`INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'szerkeszto')` — a fiók id-ját a `GET /api/fiok/en` adja):
1. `GET /api/tema` süti nélkül → 401; szervezet nélküli fiókkal → 409.
2. A: `GET /api/tema` → 200; `tema.alap` 43 kulcs (`TOKEN_KULCSOK.length`), `tema.alkalmazott === null`, `tema.tervezet === null`, `tema.verziok` üres, `tema.hatasos` egyenlő `tema.alap`-pal.
3. A: `PUT /api/tema` `{ $schema: "km-theme/2", tokens: { "--primary": "#ff0000", "--r-btn": "0px", "--bg": <az alap --bg értéke változatlanul>, "--nincs-ilyen": "x" } }` → 200: `tema.tervezet.verzio === 1`, `tema.tervezet.felulirasok` PONTOSAN `{ "--primary": "#ff0000", "--r-btn": "0px" }` (a változatlan `--bg` NEM került bele), `tema.figyelmen_kivul` = `["--nincs-ilyen"]`, `tema.alkalmazott === null`, és `tema.hatasos["--primary"]` MÉG az alap értéke (a tervezet nem él).
4. A: `PUT /api/tema` ugyanaz másodszor `{ "--primary": "#00ff00" }`-val → 200, `tema.tervezet.verzio === 1` (felülírta, nem új verzió), `felulirasok["--primary"] === "#00ff00"`, és nincs `--r-btn` benne (a teljes küldött készlet számít).
5. A: `PUT /api/tema` hibás: `{ $schema: "km-theme/2", tokens: { "--primary": "piros", "--fs-base": "99px", "--motion": "gyors" } }` → 400 `ERVENYTELEN_ADAT`, `tema_hibak` 3 elem: token `--primary` kod `badColor`, `--fs-base` kod `outOfRange` (parameterek.min 12, max 20), `--motion` kod `badEnum`; utána `GET /api/tema` → a tervezet még a 4. lépés szerinti (semmi nem változott).
6. A: `PUT /api/tema` `{ $schema: "km-theme/1", tokens: {} }` → 400, `tema_hibak[0].kod === "badVersion"`; `PUT` nem-JSON törzzsel → 400.
7. Szerkesztő (4. fiók, A szervezet): `GET /api/tema` → 200 (láthatja); `PUT /api/tema` → 403 `NINCS_JOG`; `POST /api/tema/alkalmaz` → 403.
8. B: `POST /api/tema/alkalmaz` tervezet nélkül → 409 `NINCS_TERVEZET`; `DELETE /api/tema` → 409.
9. A: `POST /api/tema/alkalmaz` → 200: `alkalmazott.verzio === 1`, `alkalmazott.felulirasok["--primary"] === "#00ff00"`, `tervezet === null`, `hatasos["--primary"] === "#00ff00"`, `hatasos["--bg"] === alap["--bg"]`, `verziok` 1 elem `allapot: "alkalmazott"`, `alkalmazva` ISO szöveg. SQL: `szervezet_tema` A-ra 1 sor, allapot 'alkalmazott'.
10. B: `PUT /api/tema` `{ "--primary": "#0000ff" }` majd `alkalmaz` → 200. **Elválasztás (A-11):** `GET /api/tema` A-val → `hatasos["--primary"] === "#00ff00"`; B-vel → `"#0000ff"`; C-vel → az alap értéke (`tema.alkalmazott === null`).
11. **A lap feje:** `GET /fiok` A sütijével → 200, a HTML-ben `<style id="km-tokenek">` és benne `--primary:#00ff00`; B sütijével `--primary:#0000ff`; C sütijével az alap `--primary` értéke; `GET /belepes` süti nélkül → az alap értéke. (Regex: `/<style id="km-tokenek">([^<]*)<\/style>/`, benne `--primary:` utáni érték a `;`-ig.)
12. A: második tervezet `{ "--primary": "#123456" }` + alkalmaz → `alkalmazott.verzio === 2`, `verziok` 2 elem (verzio 2 'alkalmazott', verzio 1 'korabbi'). `POST /api/tema/visszaallit` `{ verzio: 1 }` → 200: `tervezet.verzio === 3`, `tervezet.felulirasok["--primary"] === "#00ff00"`, `alkalmazott.verzio === 2` (nem változott, élesbe csak alkalmazással). `alkalmaz` → `alkalmazott.verzio === 3`, `hatasos["--primary"] === "#00ff00"`. `visszaallit { verzio: 99 }` → 404 `NINCS_ILYEN_VERZIO`; `{ verzio: "x" }` → 400.
13. A: `PUT` tervezet `{ "--accent": "#abcdef" }` → `DELETE /api/tema` → 200, `tervezet === null`, `alkalmazott.verzio === 3` változatlan; SQL: a sor allapot 'korabbi' (nem törlődött).
14. A: `PUT /api/tema` az ALAP készlettel (`tokens: tema.alap` teljes) → 200, `tervezet.felulirasok` üres objektum `{}` (= „Alapértékek”: minden a közösből); alkalmaz → `hatasos` egyenlő `alap`-pal.
15. **Közös alap:** A (nem rendszergazda): `GET /api/tema/kozos` → 403; `PUT` → 403. SQL: `UPDATE fiok SET rendszergazda = true WHERE email = $1` (A e-mailje). `GET /api/tema/kozos` → 200: `tema.alkalmazott.verzio >= 1`, `tema.alkalmazott.tokenek` 43 kulcs, `tema.tervezet === null`. `PUT /api/tema/kozos` `{ "--bg": "#101010" }` (részleges is jó) → 200, `tema.tervezet.tokenek["--bg"] === "#101010"` és a tervezet TELJES (43 kulcs); `POST /api/tema/kozos/alkalmaz` → 200, `alkalmazott.tokenek["--bg"] === "#101010"`, a régi alkalmazott verzió `korabbi` a `verziok` listában. SQL: pontosan egy `tema` sor 'alkalmazott'. Utána `GET /api/tema` C-vel → `tema.alap["--bg"] === "#101010"` és `hatasos["--bg"] === "#101010"` (a közös változás mindenkire hat); A-val `hatasos["--primary"]` még az A saját értéke (a felülírás megmaradt a közös változás mellett).
16. **Visszaállítás a közösnél:** `POST /api/tema/kozos/visszaallit` `{ verzio: <az eredeti alkalmazott verzió> }` → 200 (új tervezet), `alkalmaz` → az eredeti `--bg` újra él. A végén: `UPDATE fiok SET rendszergazda = false WHERE email = $1`.
17. Takarítás az `afterAll`-ban: a szerkesztő tagság törlése SQL-lel a `takaritas()` előtt nem kell (cascade), de a `tema` táblában a próba által létrehozott sorokat NE töröld — csak ellenőrizd, hogy pontosan egy 'alkalmazott' maradt, és az eredeti `--bg` él; `takaritas()`, `lezar()`.

Nincs `any`; `unknown` válaszok ellenőrizve; a válaszokat a design-system sémáival (`SzervezetTemaAllapot.safeParse`, `KozosTemaAllapot.safeParse`, `TemaHiba`) is ellenőrizd (import `@km/design-system`-ből). Egy `describe`, sorrendfüggő `it`-ek (a Vitest sorban futtatja őket egy fájlon belül).
