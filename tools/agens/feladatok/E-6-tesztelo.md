# Feladat — TESZTELŐ (E-6): próbák az onboarding-piszkozatra

Vitest 5, Node 24; futó alkalmazás ellen HTTP-n (`PROBA_CIM`), valódi adatbázissal (`DATABASE_URL`, km_tulaj).
Mellékelve a meglévő segédek (`apps/web/probak/segedek.ts` — `keres`, `veletlenEmail`, `sql`, `takaritas`,
`sutiErtek`) és a szerződés. Az E-3 próbákat (`fiok.proba.ts`) NE módosítsd.

Add vissza: `apps/web/probak/onboarding.proba.ts` — esetek (külön `it`, magyar névvel):
- piszkozat süti nélkül → GET 401 `NINCS_BELEPVE`
- új fiók szervezet nélkül → GET 409 `NINCS_JOG`
- szervezet létrehozása után → GET 200, `piszkozat.verzio === 1`, `piszkozat.lepes === 1`, `frissitve === null`
- PUT egy kitöltött piszkozattal (nev, forras_tipus "weboldal", weboldal, arculat_forrasok) → 200, `frissitve` ISO-dátum
- kilépés, ugyanazzal a fiókkal újra belépés → GET visszaadja ugyanazt a tartalmat (nev, weboldal egyezik)
- PUT hibás törzzsel (`lepes: 9`) → 400 `ERVENYTELEN_ADAT`, `mezok.lepes` létezik
- PUT ismételten (ugyanaz a szervezet) → továbbra is EGY sor van az `onboarding_piszkozat` táblában a szervezethez (SQL-lel ellenőrizve)
- két külön fiók, két külön szervezet, két különböző piszkozat → mindkettő csak a sajátját kapja vissza
- `POST /api/onboarding/osszefoglalo` weboldallal → 200, `forras === "teszt"`, az `osszefoglalo` tartalmazza a nevet
- `POST /api/onboarding/osszefoglalo` üres forrással → 400 `ERVENYTELEN_ADAT`
- takarítás a végén (a segédek `takaritas()`-a a fiókokat törli; a piszkozat cascade-dal megy)

Szabályok: nincs `any`; a válaszokat `unknown`-ként ellenőrizd (a segédek mintájára); teszt-e-mail:
`proba-<random>@proba.example`; a segédeket importáld, ne írd újra.
