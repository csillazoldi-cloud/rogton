# Adatkötés — R-3 · Saját fiók

Az útvonal: `/sajat-fiok`. A belépés minden szerepnek jár.

| A rajzon | Honnan / mivel | Szabály |
|---|---|---|
| Név mező kezdőértéke, e-mail, utolsó belépés, munkaterek listája | `GET /api/fiok/en` | minden belépett fiók |
| Név mentése | `PUT /api/fiok/nev` `{ nev }` | üres → `ERVENYTELEN_ADAT` |
| E-mail mező | ugyanaz a válasz, **csak kijelzés** | a felületen nem módosítható (D1) |
| Jelszó megváltoztatása | `PUT /api/fiok/jelszo` `{ jelenlegi, uj }` | `uj` legalább 10 karakter (a felület előbb zárja a gombot); rossz jelenlegi → `ROSSZ_JELENLEGI_JELSZO` |
| „{n} másik eszközről kiléptettük" | **a jelszóváltás válaszából** — a kiléptetett munkamenetek száma | ez az eszköz nem lép ki (D-F19) |
| Kiléptetés minden más eszközről | `POST /api/fiok/kileptetes-mindenhol` | a válasz: hány munkamenet szűnt meg |
| A felület nyelve | `POST /api/nyelv` | a fiókon tárolt választás |
| Munkatér sorai (név, szerep) | `GET /api/fiok/en` | — |
| „most ebben vagy" jelvény | az aktuális munkatér a fiókon tárolt választásból (D-F25) | — |
| Kilépek → az alsó sáv megerősítése után | `POST /api/tagok/kilep` | az egyetlen tulajdonosnak zárt: `UTOLSO_TULAJDONOS` |

**Hibakódok és a helyük:**

| Kód | Hol áll |
|---|---|
| `ERVENYTELEN_ADAT` | 03. artboard, a Név mező alatt |
| `ROSSZ_JELENLEGI_JELSZO` | 03. artboard, a Jelenlegi jelszó mező alatt |
| `UTOLSO_TULAJDONOS` | 01. és 04. artboard, a zárt „Kilépek" gomb mellett |

A 10 karakteres követelmény **nem** végponti hibakód a rajzon: a felület előbb zárja a gombot (`sajat.jelszo_rovid`). A végpont ettől függetlenül ellenőriz.

## Ami a sávot érinti

A sávban a **fiók neve** mostantól a `/sajat-fiok`-ra visz (eddig a `/fiok`-ra, ami az ügyfélprofil). Telefonon a hamburger legalsó sora, a `nav.sajat_fiok_sor` kulccsal („{nev} · {szerepek}").

A **felület nyelve** két helyen áll: a sávban (gyors váltás) és ezen a lapon (a fiók beállításai között). Ugyanaz a végpont, ugyanaz az érték.
