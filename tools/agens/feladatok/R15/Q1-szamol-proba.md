# R-15 · Q1 — gépi próba a `apps/web/r15/szamol.ts` tiszta függvényeire

Írd meg: `apps/web/probak/r15-szamol.proba.ts` (vitest: `import { describe, it, expect } from "vitest";`, import `from "../r15/szamol"`).
A mellékelt `szamol.ts` a mérce. TÉNYEK (ezeket kell ellenőrizni, ≥ 14 `it`):
- `rovidCim("Nem is térkő, hanem díszburkolat! A prémium kültéri megoldások új szintjét képviseli")` → `"Nem is térkő, hanem díszburkolat!"`; 8 szónál hosszabb első mondat → az első 8 szó + `…`; ≤ 8 szó változatlan.
- `napjaVolt(null)` → `null`; ugyanaz a nap → 0; előző nap → 1; `napjaVolt("2026-09-23T10:00:00Z", new Date("2026-09-27T05:00:00Z"))` → 4; érvénytelen dátum → `null`. Bukaresti idő: `napjaVolt("2026-09-26T22:30:00Z", new Date("2026-09-27T05:00:00Z"))` → 0 (Bukarestben már 27-e volt).
- `halad(1, 2, 2)` → `{ poszt_kesz: 1, kep_letoltve: 2, varo: 2, arany: 1/3 }`; `halad(0,0,0).arany` → 0; `halad(5,0,0).arany` → 1.
- `forrasNev("https://www.magyarepitok.hu/x")` → `"magyarepitok.hu"`; hibás URL → `""`.
- `sorok("Cím sor\n\nElső mondat. Második.\n\n#a #b")` → `{ elso: "Cím sor", masodik: "Első mondat." }`; csak hashtag-sor → üres elso.
- `posztKesz` igaz, ha bármelyik cella `allapot: "vegleges"`; hamis üres `szovegek`-nél.
- `rovidNev`: ha `forras.rovid_nev` van, az; különben a `rovid_cim`/`cim` első 3 szava (+`…`, ha több), a végéről a `.!?…` levágva.
- `varoPoszt(m, "hu")`: a `hu` nyelvű `fb` cella szövegéből `elso_sor`, `van_szoveg: true`; üres cellákkal `van_szoveg: false`.
Egy `PosztMunka` minta-objektumot építs (mezők: id, szervezet_id (uuid), cim, forras {tipus, azonosito, cim, url, szoveg, rovid_nev, rovid_cim, otlet}, szovegek[{felulet, nyelv, szoveg, javaslat, hashtagek, allapot, veglegesitve, nyelvre_szabva, elavult_forditas}], osszhang: null, piros_veglegesites: false, letrehozva, frissitve) — `as PosztMunka` típussal (`import type { PosztMunka } from "@km/contracts";`).
Visszaadás: `=== FÁJL: apps/web/probak/r15-szamol.proba.ts ===` … `=== FÁJL VÉGE ===`, semmi más.
