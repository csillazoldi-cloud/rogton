# Feladat — TESZTELŐ (E-8): próbák a 2. lépés javaslataira

Vitest 5; futó alkalmazás ellen (`PROBA_CIM`), `DATABASE_URL` (km_tulaj). A tesztkörnyezetben `AI_SZOLGALTATO=teszt`
(a teszt-csatlakozó rögzített minta-JSON-t ad: célközönség „Lakástulajdonosok…", nyelvek ["hu","ro"]).
Mellékelve: a segédek (`./segedek`), a szerződés, és az E-7 próba mintának (`osszefoglalo.proba.ts`: fiók + szervezet a
`beforeAll`-ban; FIGYELEM: regisztráció 201, szervezet 201, belépés 200).

Add vissza: `apps/web/probak/javaslatok.proba.ts` — esetek:
- `POST /api/onboarding/javaslatok` süti nélkül → 401
- szervezet nélküli fiókkal → 409 `NINCS_JOG`
- üres piszkozattal (nincs összefoglaló, nincs leírás) → 400 `ERVENYTELEN_ADAT`, `mezok.forras === "ures"`
- a piszkozat mentése után (`PUT /api/onboarding/piszkozat`: `bemutatkozas.osszefoglalo` kitöltve, `forras_tipus` "leiras",
  `leiras` kitöltve) → 200: `celkozonseg` nem üres, `cel` nem üres, `hangnem_leiras`, `hangnem_minta` nem üres,
  `nyelvek` tömb csak érvényes kódokkal, `tartalomnyelv` "hu", `forras === "teszt"`
- utána az `ai_hivas` táblában a szervezethez van `feladat='javaslatok'`, `allapot='ok'` sor (SQL)
- `POST /api/onboarding/hangnem` `{ irany: "kozvetlenebb", hangnem_leiras: "közvetlen", hangnem_minta: "Minta.", tartalomnyelv: "hu" }`
  → 200, `hangnem_leiras` és `hangnem_minta` nem üres, `forras === "teszt"`
- `POST /api/onboarding/hangnem` hibás iránnyal (`irany: "valami"`) → 400 `ERVENYTELEN_ADAT`, `mezok.irany` létezik
- a piszkozat GET-je a 2. lépés mezőivel (`kommunikacio.nyelvek` üres tömb alapból, `kommunikacio.javaslatok_kerve === false`)
- takarítás a végén

Nincs `any`; `unknown` válaszok ellenőrizve.
