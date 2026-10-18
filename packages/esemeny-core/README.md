# @rogton/esemeny-core

## 1. Mit csinál

A rendszerben történő dolgokról — belépés, meghívás, futás, keret kimerülése — egységes
feljegyzés készül: mi történt, kinél, mikor, ki tette. Egy második szabály eldönti, melyik
fajta eseményről kell értesíteni: van egy közös alapbeállítás és egy szervezeti felülírás,
ami nincs felülírva, az a közösből jön. Ha egy eseményt értesíteni kell, a modul egy rövid
üzenetet ad a befogadónak, aki a saját csatornáján elküldi. Alapból SEMMIRŐL nem megy
értesítés — csak amit bekapcsolnak.

## 2. Mit kér a befogadótól

A `host.ts` portjai — mindegyik egy sor:

- `EsemenyTar.ir(e)` — egy esemény tárolása.
- `EsemenyTar.lista(szervezet_id, szuro?)` — a szervezet eseményei, legújabb elöl, limit alap 100.
- `EsemenyTar.rendszerLista(szuro?)` — a szervezet nélküli (rendszer-) események.
- `ErtesitesTar.kozos()` — a közös alapbeállítás (üres = `ALAP_ERTESITES`).
- `ErtesitesTar.kozosMent(b)` — a közös alapbeállítás mentése.
- `ErtesitesTar.szervezeti(szervezet_id)` — a szervezeti felülírás (csak a felülírt fajták).
- `ErtesitesTar.szervezetiMent(szervezet_id, b)` — a szervezeti felülírás mentése.
- `Ora.most()` — az aktuális idő ISO szövegként.
- `Azonosito.uj()` — egyedi azonosító.
- `KimenoCsatorna.kuld(u)` — a kimenő üzenet elküldése; a titok a befogadónál van.
- `Feliratozo(kulcs, ertekek?)` — a befogadó feliratrendszere (`esemeny.<fajta>_cim` / `_szoveg`).

## 3. Mit ad vissza

Bejárat-függvények (mind `Eredmeny<T>`-t ad):

- `feljegyez(k, e)` — feljegyzés + (ha a hatásos beállítás „kimeno") a kimenő üzenet elküldése.
- `naplo(k, ktx, szuro?)` — a szervezet eseményei, legújabb elöl.
- `ertesitesLekerdez(k, ktx)` — a közös, a szervezeti és a hatásos beállítás.
- `ertesitesSzervezetiMent(k, ktx, b)` — a szervezeti felülírás mentése (csak tulajdonos).
- `ertesitesKozosMent(k, b)` — a közös alapbeállítás mentése (a jogot a befogadó ellenőrzi).

Tiszta függvények: `hatasosErtesites(kozos, szervezeti)`, `kimenoUzenet(e, felirat)`.

Konstansok: `ALAP_ERTESITES`, `ALAP_SULYOSSAG`, `MENTES_KIMARADT_ALAPBOL_BE`.

## 4. Hibakódok

- `NINCS_JOG` — a szerep nem elég a művelethez (pl. nem tulajdonos menti a szervezetit).
- `ERVENYTELEN_ADAT` — a bemenet nem felel meg az `ErtesitesBeallitas` sémának.
- `ISMERETLEN_FAJTA` — a feljegyzett esemény fajtája nem ismert.

HTTP: `NINCS_JOG` 403 · `ERVENYTELEN_ADAT` 400 · `ISMERETLEN_FAJTA` 400.

## 5. Beillesztés

1. A `packages/esemeny-core` mappa másolása, felvétel a workspace-listába.
2. A `host.ts` portjainak megírása a saját tárolóra (a webalkalmazásban Postgres + drizzle
   az `esemeny` és az `ertesites_beallitas` táblával; a referencia-hostban SQLite).
3. `Ora`: `() => new Date().toISOString()`; `Azonosito`: `crypto.randomUUID()`;
   `KimenoCsatorna`: a vaultból vett `ERTESITES_WEBHOOK_URL`-re küldő hívó.
4. A modul próbáinak futtatása (`pnpm --filter @rogton/esemeny-core proba`) — adatbázis nélkül
   zöldek.
5. Három határőr-szabály felvétele a `.dependency-cruiser.cjs`-be.
6. A hibakódok fordítása feliratokra (`esemeny.hiba_*`), a HTTP-státusz a szerződés 6.
   pontja szerint.
