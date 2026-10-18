# Feladat — TESZTELŐ (E-10): próbák a profil módosítására a fiókoldalon

Vitest 5; futó alkalmazás ellen (`PROBA_CIM`), `DATABASE_URL` (km_tulaj). Mellékelve: a segédek (`./segedek`), a szerződés
részlete, és az E-9 próba mintának (`jovahagyas.proba.ts`: fiók + szervezet a `beforeAll`-ban, a piszkozat mentése és
jóváhagyása — FIGYELEM: regisztráció 201, szervezet 201, belépés 200, jóváhagyás 200; a jóváhagyáshoz a piszkozatban
kell `bemutatkozas.nev` és `bemutatkozas.osszefoglalo`).

Add vissza: `apps/web/probak/profil.proba.ts` — esetek:
- `PUT /api/profil` süti nélkül → 401
- új szervezettel, jóváhagyott profil NÉLKÜL `PUT /api/profil` `{ nev: "X" }` → 409 `NINCS_JOG`
- a `beforeAll`-ban: piszkozat mentése (`nev` "Próba Műhely", `osszefoglalo` kitöltve, `osszefoglalo_forras` "ai",
  `kommunikacio.celkozonseg` "családok", `celkozonseg_forras` "ai", `nyelvek` ["hu"]) és jóváhagyás → 200
- `PUT /api/profil` `{ osszefoglalo: "Javított összefoglaló" }` → 200: `profil.osszefoglalo` az új, `profil.osszefoglalo_forras === "ai"`,
  `profil.osszefoglalo_modositva === true` (módosított javaslat), `profil.frissitve` ISO dátum
- `PUT /api/profil` `{ cel: "Több érdeklődő" }` → 200: `profil.cel === "Több érdeklődő"`, `profil.cel_forras === "sajat"`,
  `profil.cel_modositva === false`, és a `profil.kesobbre` NEM tartalmaz "cel"-t, de tartalmaz "hangnem"-et és "arculat"-ot
- `PUT /api/profil` `{ hangnem_leiras: "közvetlen" }` → 200: `hangnem_forras === "sajat"`, `hangnem_minta === ""`,
  `kesobbre` nem tartalmaz "hangnem"-et
- `PUT /api/profil` `{ nyelvek: ["hu", "ro"] }` → 200: `nyelvek` ["hu","ro"], `nyelvek_forras === "sajat"`
- `PUT /api/profil` `{ nev: "" }` → 400 `ERVENYTELEN_ADAT`, `mezok.nev` létezik
- `PUT /api/profil` `{ nyelvek: ["xx"] }` → 400 `ERVENYTELEN_ADAT`
- `PUT /api/profil` `{ arculat: { allapot: "kesobb", tervezet: null, verzio: 1, jovahagyott_verzio: null, verziok: {} } }` → 200:
  `profil.arculat.allapot === "kesobb"`, `kesobbre` tartalmaz "arculat"-ot
- `GET /api/profil` → 200 és a `profil.osszefoglalo` a javított (a módosítások megmaradtak)
- SQL: a `szervezet_profil.frissitve` újabb, mint a `jovahagyva`
- takarítás a végén (`takaritas`, `lezar`)

Nincs `any`; `unknown` válaszok ellenőrizve; a válaszokat a szerződés sémáival (`SzervezetProfil.safeParse`) is ellenőrizd.
