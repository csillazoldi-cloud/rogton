# Feladat — TESZTELŐ (E-3): próbák a fiók/belépés gépezetére

Írd meg a próbákat a mellékelt közös szerződés alapján. Vitest 5, Node 24. A próbák egy FUTÓ
alkalmazás ellen mennek HTTP-n (a `PROBA_CIM` környezeti változó, pl. `http://127.0.0.1:3000`),
valódi adatbázissal (a `DATABASE_URL` a `km_tulaj` szereppel — ezzel a próba közvetlenül is írhat/olvashat
a táblákban a `pg` csomaggal, pl. lejárt munkamenet beszúrásához vagy takarításhoz).

Fájlok, amiket visszaadsz:
1. `apps/web/probak/fiok.proba.ts` — a próbák
2. `apps/web/probak/segedek.ts` — közös segédek (kérés küldése JSON-nal, süti kiszedése a válaszból,
   egyedi teszt-e-mail generálása, közvetlen SQL a `pg`-vel, takarítás)
3. `apps/web/vitest.config.ts` — `include: ["probak/**/*.proba.ts"]`, `testTimeout: 20000`, soros futás

Lefedendő esetek (mind külön `it`, magyar névvel):
- regisztráció rendben → 201, `{ id }` uuid
- ugyanazzal az e-maillel újra → 409 `EMAIL_FOGLALT`
- e-mail NAGYBETŰVEL és szóközzel regisztrálva, kisbetűvel belépve → működik (kisbetűs tárolás)
- 9 karakteres jelszó → 400 `GYENGE_JELSZO`
- hibás JSON-törzs → 400 `ERVENYTELEN_ADAT`
- rossz jelszó → 401 `ROSSZ_BELEPES`; nem létező e-mail → 401 `ROSSZ_BELEPES` (ugyanaz a kód!)
- teszt-fiók üres jelszó-lenyomattal (`anna@teszt-a.example`, bármilyen jelszó) → 401 `ROSSZ_BELEPES`
- `/api/fiok/en` süti nélkül → 401 `NINCS_BELEPVE`; jó sütivel → 200, `email`, `nev`, `szervezetek: []`
- a süti `HttpOnly` és `SameSite=Lax`, `Path=/`
- szervezet létrehozása süti nélkül → 401; sütivel → 201 `{ id }`, utána `/api/fiok/en` mutatja `tulajdonos` szereppel
- két külön fiók két külön szervezetet hoz létre → egyik sem látja a másikét az `/api/fiok/en`-ben
- kilépés → 204, utána a régi sütivel `/api/fiok/en` → 401
- lejárt munkamenet: a `munkamenet` táblába közvetlenül beszúrt, múltbeli `lejar`-ú sor tokenjével → 401,
  és a sor törlődött
- takarítás: a próbák végén a létrehozott fiókok törlése (`DELETE FROM fiok WHERE email LIKE 'proba-%@proba.example'`)

Szabályok: nincs `any`; a válasz JSON-ját `unknown`-ként kezeld és ellenőrizd; semmilyen forrásfájlt ne
módosíts; a teszt-e-mailek formája `proba-<random>@proba.example`.
