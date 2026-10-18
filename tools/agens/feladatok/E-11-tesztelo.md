# Feladat — TESZTELŐ (E-11): a hibautak próbái — nem tűnik el adat, nincs hamis siker

Vitest 5; futó alkalmazás ellen (`PROBA_CIM`), `DATABASE_URL` (km_tulaj — ezzel SQL-t is futtathatsz a `sql()` segéddel).
A tesztkörnyezetben `AI_SZOLGALTATO=teszt`, `AI_HAVI_KERET_USD=5`. Mellékelve: a segédek (`./segedek`), a szerződés
részlete, és az E-9 próba mintának (`jovahagyas.proba.ts`: fiók + szervezet a `beforeAll`-ban; regisztráció 201,
szervezet 201, belépés 200; a piszkozat GET → módosítás → PUT).

Add vissza: `apps/web/probak/hibautak.proba.ts` — esetek (mindegyiknél a lényeg: a HIBA UTÁN a korábbi adat változatlan):

## A) Mentési hiba — érvénytelen piszkozat nem írja felül a jót
- piszkozat mentése jó adattal (`bemutatkozas.nev` "Próba Műhely", `leiras` kitöltve) → 200
- `PUT /api/onboarding/piszkozat` hibás törzzsel (`{ verzio: 1, lepes: 9 }`) → 400 `ERVENYTELEN_ADAT`, `mezok.lepes` létezik
- `PUT /api/onboarding/piszkozat` nem JSON törzzsel (szöveg: `nem json`, `content-type: text/plain`) → 400
- `GET /api/onboarding/piszkozat` → a `nev` továbbra is "Próba Műhely", a `frissitve` UGYANAZ, mint a jó mentésé

## B) Forráshiba — a forrás nem érhető el, a piszkozat marad
- `POST /api/onboarding/osszefoglalo` `{ forras_tipus: "weboldal", weboldal: "nincs-ilyen-tartomany-e11.example" }` → 502 `FORRAS_NEM_ELERHETO`
- `POST /api/onboarding/osszefoglalo` `{ forras_tipus: "weboldal", weboldal: "http://127.0.0.1:8400/" }` → 400 `ERVENYTELEN_ADAT`, `mezok.weboldal === "FORRAS_TILTOTT_CIM"`
- utána `GET /api/onboarding/piszkozat` → változatlan (`nev` "Próba Műhely"; `osszefoglalo` üres)
- a hibás forrás-kísérlet NEM kerül az `ai_hivas` táblába AI-hibaként (SQL: a szervezethez nincs `allapot='hiba'` sor `feladat='osszefoglalo'`-val) — ha ez nem így van, a próba mondja meg, hány ilyen sor van (`expect` üzenettel)

## C) AI-kiesés — a havi keret kimerült, kézi úton folytatható
- SQL: `INSERT INTO ai_koltseg_honap (honap, becsult_usd, hivasok) VALUES (to_char(now(), 'YYYY-MM'), 999, 1) ON CONFLICT (honap) DO UPDATE SET becsult_usd = 999`
  — jegyezd meg az előző értéket (SELECT előtte), és az `afterAll`-ban állítsd vissza (ha nem volt sor: DELETE)
- `POST /api/onboarding/osszefoglalo` `{ forras_tipus: "leiras", leiras: "Kézműves pékség Marosvásárhelyen." }` → 429 `AI_KERET_KIMERULT`
- `POST /api/onboarding/javaslatok` → 429 `AI_KERET_KIMERULT`
- `POST /api/onboarding/hangnem` `{ irany: "kozvetlenebb", hangnem_leiras: "közvetlen", hangnem_minta: "Minta.", tartalomnyelv: "hu" }` → 429
- kézi folytatás: `PUT /api/onboarding/piszkozat` `bemutatkozas.osszefoglalo` "Saját összefoglaló", `osszefoglalo_forras` "sajat" → 200;
  `GET` → megvan
- a keret visszaállítása után `POST /api/onboarding/osszefoglalo` (leírásból) → 200 újra

## D) Nincs hamis siker — a jóváhagyás hibája nem törli a piszkozatot
- `PUT` piszkozat `bemutatkozas.nev` ÜRES, `osszefoglalo` kitöltve → 200
- `POST /api/onboarding/jovahagyas` → 400 `HIANYOS_PROFIL`, `mezok.nev === "ures"`
- `GET /api/onboarding/piszkozat` → a piszkozat MEGVAN (`osszefoglalo` kitöltve, `frissitve` nem null)
- `GET /api/profil` → `profil === null`

- takarítás a végén (`takaritas`, `lezar`).

Nincs `any`; `unknown` válaszok ellenőrizve. A `keres` segéd `torzs` mezője JSON-t küld; a nem JSON törzshöz használj
közvetlen `fetch`-et a `PROBA_CIM`-mel és a sütivel (`cookie` fejléc).
