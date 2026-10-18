# F-7a + F-5c · Tesztelő — `apps/web/probak/csomag.proba.ts` (vitest, a FUTÓ kiszolgáló ellen, HTTP + SQL)

CÉL: egy próbafájl, ami a csomag-gépezetet és az eseménynapló 30 napos takarítását bizonyítja. A minta: `kezdolap.proba.ts` (melléklet) — így épül itt egy
próbafájl: regisztráció, belépés, szervezet a `keres()`-sel; `sql()` közvetlen SQL a próba-adatbázison (km_tulaj); `takaritas()` és `lezar()` az `afterAll`-ban.
A `keres()` visszatérése `{ statusz, fejlecek, sutik, torzs }`; a sütiket `belA.sutik.join("; ")`-vel adod tovább a `sutik` opcióban. A `segedek.ts` is melléklet.

TÉNYEK (ezek igazak, nem kell ellenőrizni):
- `POST /api/szervezet` `{ nev }` → 201, a törzs `{ id }` — a szervezet azonosítója.
- Új szervezet csomagja `pilot`, moduljai `["hirfigyelo"]`, ár és pénznem `null`.
- `GET /api/csomag` (belépve, van munkatér) → 200 `{ csomag: { kod: "pilot", modulok: ["hirfigyelo"], ar_havi: null, penznem: null }, modulok: [{ modul: "hirfigyelo", benne: true }] }`.
- `GET /api/csomag` belépés nélkül → 401 `{ hiba: "NINCS_BELEPVE" }`.
- `GET /api/hirfigyelo/attekintes` (belépve) → 200 normál esetben. Ha a szervezet csomagjában NINCS a `hirfigyelo` modul → 403 `{ hiba: "MODUL_NEM_ELERHETO" }`.
  Ezt így állítod elő SQL-lel: `INSERT INTO csomag (kod, modulok) VALUES ('proba-ures', '{}') ON CONFLICT (kod) DO NOTHING;` majd
  `UPDATE szervezet SET csomag_kod = 'proba-ures' WHERE id = $1;` — utána a 403; visszaállítás: `UPDATE szervezet SET csomag_kod = 'pilot' WHERE id = $1;` → újra 200.
  Az `afterAll`-ban `DELETE FROM csomag WHERE kod = 'proba-ures'` (előbb a szervezet visszaállítva, különben a hivatkozás miatt nem törölhető).
- A takarítás: az SQL-függvény `esemeny_takarit(nap int)` a `nap`-nál régebbi `esemeny` sorokat törli, és a törölt sorok számát adja vissza.
  Próba: `INSERT INTO esemeny (szervezet_id, fajta, sulyossag, fiok_id, ido, adat) VALUES ($1, 'futas_kesz', 'info', NULL, now() - interval '40 days', '{}'::jsonb)` (régi) és egy
  ugyanilyen `now() - interval '1 day'`-jel (friss); `SELECT esemeny_takarit(30) AS n` → a friss marad, a régi eltűnik: `SELECT count(*)::int AS n FROM esemeny WHERE szervezet_id = $1` → 1.
  A visszaadott `n` legalább 1 (más régi sor is lehet a táblában, ezért `>= 1`, nem `=== 1`). A `sql<T>()` a sorok tömbjét adja: `(await sql<{ n: number }>("SELECT …", [id]))[0]!.n`.

ESETEK (`describe("Csomag és megőrzés (F-7a, F-5c)")`), legalább 6:
1. új szervezet csomagja pilot, a modul benne; 2. belépés nélkül 401; 3. a hírfigyelő áttekintője 200 a pilot csomaggal;
4. üres csomaggal a hírfigyelő 403 MODUL_NEM_ELERHETO, és a `GET /api/csomag` ekkor `modulok: [{ modul: "hirfigyelo", benne: false }]`; 5. visszaállítva újra 200;
6. a takarítás a 40 napos sort törli, az 1 naposat megtartja.

HATÁR: egy fájl. TypeScript szigorú (`noUncheckedIndexedAccess` → a tömb-index `| undefined`, ezért `[0]!` vagy `toBeDefined()`). Relatív importban nincs `.js`.
Csak a fájlt add vissza, gondolkodás nélkül: `=== FÁJL: apps/web/probak/csomag.proba.ts ===` … `=== FÁJL VÉGE ===`. Semmi más szöveg.
