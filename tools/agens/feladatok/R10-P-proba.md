# Feladat — PRÓBAÍRÓ (R10-P): a sémaváltás élő próbái

Egy vitest próbafájlt írsz, ami a FUTÓ rendszert hívja HTTP-n. Minta a mellékelt `tema.proba.ts` (ugyanezt a végpontcsaládot méri) és a segédek a `segedek.ts`-ben (`keres`, `veletlenEmail`, `takaritas`, `lezar`, `sql`). Ugyanazokat a segédeket használd, ugyanúgy. Magyar azonosítók, nincs `any`. Kimenet: `=== FÁJL: apps/web/probak/sema.proba.ts ===` … `=== FÁJL VÉGE ===`.

## Tények
- `PUT /api/tema/sema` törzs `{ kod: "ejkek" | "vilagos" | "sotet" }` — tulajdonos; szerkesztő és néző: 403 `NINCS_JOG`; belépés nélkül 401. Válasz: a szervezet téma-állapota, benne `sema_kod`, `verzio` (az alkalmazott verzió száma nő), és a `hatasos` tokenek.
- `PUT /api/tema/kozos/sema` ugyanez a közös alapra, csak rendszergazdának (403 másnak) — a próbában csak a 403-at mérd, rendszergazda-fiók nincs.
- `GET /api/tema` a hatásos tokeneket adja (`hatasos["--bg"]` stb.).
- `POST /api/tema/visszaallit` törzs `{ verzio }` — az előző verzióra visszaáll.
- Ismeretlen kód: 400 `ISMERETLEN_SEMA`.

## Esetek (mind külön `it`)
1. belépés nélkül → 401.
2. néző → 403; szerkesztő → 403.
3. tulajdonos, `vilagos` → 200, `sema_kod === "vilagos"`, `hatasos["--bg"] === "#F7F7F5"`, `hatasos["--aurora-opacity"] === "0"`; `GET /api/tema` ugyanezt adja (a gyorsítótár ürült).
4. tulajdonos, `sotet` → `hatasos["--bg"] === "#15161C"`; a `verzio` nagyobb, mint az előző.
5. tulajdonos, `ejkek` → a `hatasos["--bg"]` egyenlő a belépés utáni ELSŐ `GET /api/tema` értékével (a mostani alap).
6. visszaállítás az előző verzióra → a `sema_kod` az előző séma kódja.
7. ismeretlen kód (`"lila"`) → 400 `ISMERETLEN_SEMA`.
8. a közös végpont tulajdonosként → 403.

A végén `takaritas()`. Ne írj mást.
