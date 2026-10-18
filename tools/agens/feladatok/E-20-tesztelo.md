# Feladat — TESZTELŐ (E-20): élő API-próbák a Hírfigyelőhöz (`apps/web/probak/hirfigyelo.proba.ts`)

Mellékelve: a szerződés (`HIRFIGYELO-SZERZODES.md`, 2.12 és az API-útvonalak listája lent), a meglévő próba-minta (`feliratok.proba.ts` eleje:
`keres`, sütik, regisztráció → belépés → szervezet; `sql()` segéd), és a `segedek.ts`. A próba ÉLŐ kiszolgáló ellen fut (`PROBA_CIM`), a
teszt-AI-csatlakozóval (`AI_SZOLGALTATO=teszt` a kiszolgálón — a válaszok determinisztikusak: a témanév szerepel a szövegben → `fontos`).

API (mind `/api/hirfigyelo/…`, JSON, süti-alapú belépés; siker: `{ hirfigyelo: … }`; hibák: `{ hiba: KÓD }` — `NINCS_BELEPVE` 401,
`NINCS_JOG` 403 (nézőnek) / 409 (szervezet nélkül), `NINCS_BEALLITAS` 409, `FUT_MAR` 409, `ERVENYTELEN_ADAT` 400 + `hibak`, `NINCS_ILYEN_VERZIO` 404,
`NINCS_ILYEN_JAVASLAT` 404, `MINTA_LEJART` 409):
`GET attekintes` · `GET/PUT beallitas` (PUT törzs: a `Beallitas` séma: `{ celok, temak: [{nev, nevvaltozatok, megkulonboztetes}], foldrajzi_fokusz, nyelvek,
kizarasok, idozites: {mod:"kezi"|"napi", ora, perc, idozona}, szabad_szoveg }` → `{ hirfigyelo: { uj: BeallitasVerzio|null, verziok } }`) ·
`PUT/DELETE beallitas/tervezet` · `POST beallitas/visszaallit {verzio}` · `GET/POST forrasok {cim}` → `{ hirfigyelo: { forras } }` ·
`POST forrasok/{id}/ellenoriz` · `POST futas {proba}` → `{ hirfigyelo: { futas, ujTalalatok, minta } }` · `GET futas` · `POST ertekeles-ujra` ·
`POST talalatok/{id}/megtekint` · `POST talalatok/{id}/jelol {jeloles}` · `POST visszajelzes {talalat_id, fajta, okok, sajat_indok}` ·
`POST javaslat` → `{ hirfigyelo: { javaslat } }` · `POST javaslat/{id}/kiprobal` · `POST javaslat/{id}/dont {dontes}` · `GET osszkep`.

Írd meg a próbafájlt (vitest, sorszámozott `it`-ek, magyar nevek), `describe("hirfigyelo API (E-20)")`, `beforeAll`-ban: A szervezet
(tulajdonos) + a B szervezet (másik tulajdonos, az elválasztáshoz) + egy NÉZŐ fiók, aki az A szervezet tagja `nezo` szereppel — ha nincs
meghívó-API, a tagságot `sql()`-lel szúrd be a `tagsag` táblába (oszlopok: `szervezet_id, fiok_id, szerep`; a fiók id-ját az e-mail alapján
kérdezd le). Források: a `PROBA_RSS` környezeti változó (alap: `https://marosvasarhelyiek.ro/feed`) — ha a letöltés a kiszolgálón nem
sikerül (nincs hálózat), a futás `hiba`/`reszleges` állapotát fogadd el és a találat-számos állításokat hagyd ki (írd ki `console.log`-gal),
DE a többi (állapotok, jogok, elválasztás, verziók) akkor is fusson.

Esetek: 1. süti nélkül 401; szervezet nélküli fiók 409; néző PUT beallitas → 403, GET attekintes → 200. 2. PUT beallitas érvénytelen (üres témák)
→ 400 `hibak` van; jó → `uj.verzio` 1; ugyanaz újra → `uj` null; módosítva → 2; `visszaallit {verzio:1}` → 3 (`eredet: "visszaallitas"`); `{verzio:99}` → 404.
3. tervezet PUT/DELETE — a verziók száma nem változik. 4. forrás: facebook-cím → `nem_tamogatott` mentve; `PROBA_RSS` → `ellenorzes_alatt`,
ellenőrzés után `hasznalhato` VAGY `hibas` (hálózat nélkül) — mindkettőt fogadd el, de írd ki. 5. futás beállítás nélkül (B szervezet) → 409
`NINCS_BEALLITAS`. 6. futás A-nál `{proba:true}` → 200, `futas.allapot` ∈ {kesz, reszleges, hiba, ai_fuggoben}; ha voltak új találatok:
mind `uj`, `ertekeles_allapot` `kesz`; **A-10**: még egy futás → `uj_talalatok` 0 és a `GET attekintes` találatszáma nem nő. 7. elválasztás:
B `GET attekintes` → 0 találat, B nem látja A forrásait. 8. megtekint → `ujDb` eggyel csökken; jelol elrejtett → verziók száma változatlan.
9. visszajelzés + javaslat → `fuggo`; kiprobal → 200 vagy 409 `MINTA_LEJART`/`ERVENYTELEN_ADAT` ha nincs minta (írd ki); dont elfogad → új verzió
`eredet: ai_javaslat`; dont másikra elvet → `elvetve`; nem létező javaslat → 404. 10. osszkep → 200 (ha van értékelt találat) vagy 400.
`afterAll`: a létrehozott szervezetek adatai maradhatnak (a próba-e-mailek időbélyegesek).

Add vissza az EGY fájlt (`=== FÁJL: apps/web/probak/hirfigyelo.proba.ts ===`). Ne írj más fájlt.
