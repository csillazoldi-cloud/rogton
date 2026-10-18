# Feladat — TESZTELŐ (E-26): a Finomhangolás folyamatának élő próbái a kiszolgálón

Mellékelve: `API-LAP.md` (az „E-26” szakasz), `segedek.ts` (a `keres` segéd), `hirfigyelo-felulet.proba.ts` (a fiók + jóváhagyott profil létrehozásának mintája; a `keres`
sütikezelése), `folyamat-finomhangolas.reszlet.ts`. A kiszolgálón a teszt-AI fut: a `hf_szabaly_javaslat` válasza determinisztikus (a javaslat érvényes beállítás, `mi_alapjan`
a kapott visszajelzés-azonosítók), a `hf_relevancia` a témák szavaira „fontos”-t ad.

Készítsd el: **`apps/web/probak/hirfigyelo-finomhangolas.proba.ts`** (vitest, egy `describe`, a lépések egymásra épülnek; `beforeAll`: fiók + szervezet + jóváhagyott profil (a
minta szerint) + néző fiók, aktív beállítás (`PUT beallitas` a `hirfigyelo.proba.ts` 2. próbájának törzsével — témák: „Marosvasarhely”), egy RSS-forrás (`PROBA_RSS`, alap
`https://marosvasarhelyiek.ro/feed`) + ellenőrzés, majd `POST futas { proba: true }` → 202 → a `futas/sor/{id}` kérdezése 3 mp-enként, amíg `kesz`):
1. `GET finomhangolas` → 200; `minta` ≠ null, `minta.szabaly_verzio` 1, `mintaLejart` false, `tetelek.length` = `minta.talalat_ids.length` > 0, minden tételnek van `cim`;
   `visszajelzesek` üres; `javaslatok` üres; `verziok.length` 1.
2. Visszajelzés: az 1. tételre `POST visszajelzes { talalat_id, fajta: "fontos" }` → 200; a 2. tételre `nem_relevans` + `okok: ["nem_ez_a_tema"]` → 200; néző → 403;
   `GET finomhangolas` → `visszajelzesek.length` 2.
3. `POST javaslat {}` → 200 `javaslat.allapot` "fuggo", `javaslat.szabaly_verzio` 1, `mi_alapjan` tartalmazza a 2 visszajelzés `id`-jét; másodszor `POST javaslat` → 400
   (`hibak` "nincs_visszajelzes" — nincs új visszajelzés).
4. `POST javaslat/{id}/kiprobal` → 200 `osszehasonlitas` tömb, minden elem `talalat_id` a minta találatai közül, `valtozas` ∈ elorebb|hatrebb|valtozatlan; utána `GET
   finomhangolas` → a javaslat `allapot` "kiprobalt", `minta_id` = a minta `id`-je. Nem létező javaslat → 404.
5. `POST javaslat/{id}/dont { dontes: "elfogad" }` → 200 `ujVerzio.verzio` 2, `ujVerzio.eredet` "javaslat"; `GET beallitas` → `aktiv.verzio` 2; `GET finomhangolas` →
   `verziok.length` 2, a javaslat `elfogadva`. Ugyanarra a javaslatra újra `dont` → nem 200 (409 vagy 400 — írd ki, mit ad).
6. Visszaállítás: `POST beallitas/visszaallit { verzio: 1 }` → 200 `uj.verzio` 3, `uj.eredet` "visszaallitas"; `GET beallitas` → `aktiv.verzio` 3; néző → 403; `verzio: 99` → 404.
7. A lap: belépve `GET /hirfigyelo/finomhangolas` → 200, a HTML tartalmazza a `data-screen-label="HF-III Finomhangolás"` szöveget; belépés nélkül → átirányítás `/belepes`.
8. Elvetés: új visszajelzés a 3. tételre (`nem_relevans`, `okok: ["ismetlodo"]`) + a 4.-re (`fontos`) → `POST javaslat` → 200 → `dont { elvet }` → 200 `javaslat.allapot`
   "elvetve", `ujVerzio` null/hiányzik; `GET beallitas` → `aktiv.verzio` marad 3.

Szabályok: TypeScript 7 (`noUncheckedIndexedAccess` — `!` vagy őrzés), a `keres` segéd (süti-lánc a `belepes` válaszából, mint a mintában); magyar nevek; a próbák
között ne legyen véletlen függés a futás sorrendjétől (vitest sorban futtatja a fájl `it`-jeit).
