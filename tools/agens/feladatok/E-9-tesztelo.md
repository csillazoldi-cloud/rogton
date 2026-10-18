# Feladat — TESZTELŐ (E-9): próbák az arculat-javaslatra és a profil jóváhagyására

Vitest 5; futó alkalmazás ellen (`PROBA_CIM`), `DATABASE_URL` (km_tulaj). A tesztkörnyezetben `AI_SZOLGALTATO=teszt`
(a teszt-csatlakozó rögzített minta-JSON-t ad: az arculatnál `elsodleges: "#2f5d4e"`, `lekerekites: 8`).
Mellékelve: a segédek (`./segedek`), a szerződés részlete, és az E-8 próba mintának (`javaslatok.proba.ts`: fiók +
szervezet a `beforeAll`-ban; FIGYELEM: regisztráció 201, szervezet 201, belépés 200; a piszkozat mentése
`PUT /api/onboarding/piszkozat` a teljes piszkozattal — előbb GET, majd a módosított objektum PUT).

Add vissza: `apps/web/probak/jovahagyas.proba.ts` — esetek:
- `POST /api/onboarding/arculat` süti nélkül → 401
- `POST /api/onboarding/jovahagyas` süti nélkül → 401; `GET /api/profil` süti nélkül → 401
- szervezet nélküli fiókkal `POST /api/onboarding/jovahagyas` → 409 `NINCS_JOG`
- új szervezettel, piszkozat nélkül `POST /api/onboarding/jovahagyas` → 409 `NINCS_PISZKOZAT`
- üres piszkozattal `POST /api/onboarding/arculat` → 400 `ERVENYTELEN_ADAT`, `mezok.forras === "ures"`
- a piszkozat mentése után (`bemutatkozas.nev` ÜRES, `osszefoglalo` kitöltve, `forras_tipus` "leiras", `leiras` kitöltve):
  `POST /api/onboarding/jovahagyas` → 400 `HIANYOS_PROFIL`, `mezok.nev === "ures"`
- `POST /api/onboarding/arculat` ezzel a piszkozattal → 200: `tervezet.elsodleges` `#rrggbb` alakú, `tervezet.hatter`
  is, `tervezet.lekerekites` egész 0–24, `tervezet.eredet` "ai" (nincs megjelölt arculati forrás), `tervezet.nyelv` "hu",
  `forras === "teszt"`; utána az `ai_hivas` táblában van `feladat='arculat_javaslat'`, `allapot='ok'` sor a szervezethez (SQL)
- a piszkozat frissítése: `bemutatkozas.nev` "Próba Műhely", `kommunikacio.celkozonseg` "családok", `celkozonseg_forras`
  "sajat", `kommunikacio.cel_kesobb` true, `kommunikacio.nyelvek` ["hu","ro"], `nyelvek_forras` "sajat",
  `arculat` = `{ allapot: "tervezet", tervezet: <az előző válasz tervezete>, verzio: 1, jovahagyott_verzio: null, verziok: {} }`
  → PUT 200
- `POST /api/onboarding/jovahagyas` → 200: `profil.nev === "Próba Műhely"`, `profil.osszefoglalo` nem üres,
  `profil.celkozonseg === "családok"`, `profil.cel === ""` (későbbre hagyva → üres), `profil.nyelvek` ["hu","ro"],
  `profil.kesobbre` tartalmazza "cel", "hangnem", "arculat" elemet és NEM tartalmazza "celkozonseg", "nyelvek" elemet,
  `profil.arculat.allapot === "tervezet"`, `profil.jovahagyva` ISO dátum
- utána `GET /api/onboarding/piszkozat` → 200 és a piszkozat ÜRES (`bemutatkozas.nev === ""`, `frissitve === null`)
  — a jóváhagyás törölte (R-06)
- `GET /api/profil` → 200, `profil.nev === "Próba Műhely"`
- SQL: a `szervezet_profil` táblában pontosan egy sor a szervezethez, `jovahagyta` = a fiók azonosítója
  (a fiók azonosítója: `GET /api/fiok/en` → `id`)
- ismételt `POST /api/onboarding/jovahagyas` → 409 `NINCS_PISZKOZAT`
- takarítás a végén (`takaritas`, `lezar`)

Nincs `any`; `unknown` válaszok ellenőrizve; a válaszokat a szerződés sémáival (`safeParse`) is ellenőrizd, ahol van.
