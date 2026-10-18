# Feladat — ÉPÍTŐ (F9-A10): a kezdőlapi hírcímek a saját hírükre visznek; a fő gomb a valódi számmal

TypeScript 7 strict, Next.js 16 app router, React 19. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza, TELJES fájltartalommal. Nincs új csomag, nincs `any`, nincs beégetett szín/betű/méret — csak a meglévő CSS-osztályok. Felirat CSAK kulcsból (`t("…")`), három nyelven. Magyar azonosítók és megjegyzések, mint a mellékelt fájlokban. CSAK az alább felsorolt 3 fájlt adod vissza; minden más sor betűre ugyanaz marad, mint a mellékletben.

## MÉRT tények (2026-09-14, a teszten)

- A kezdőlap Hírek csempéjén a három cím (`Kezdolap.tsx`, `hf.elso_cimek.map(...)`) mind `href="/hirfigyelo"` — a kattintás a lista tetejére visz, nem a hírre. Az adat (`kezdolap/index.ts`) már adja a `talalat_id`-t minden címhez.
- A fő gomb szövege „Hírek megnyitása” (`kezdolap.fo_gomb_hirek`), a szám (`hf.uj`) külön mutatóban áll.
- A Hírek lapon (`Attekintes.tsx`) a részletpanel a `detailId` állapotból nyílik (`setDetailId(k.fo_talalat_id)` + `megtekint(k)`); a lap a `szuro` állapottal szűr (`"new" | "saved" | "hidden" | "all"`; az `"new"` a nem elrejtettek). A lap URL-paramétert ma nem olvas.

## Mit kell megírni

### 1. `apps/web/app/kezdolap/Kezdolap.tsx` (mellékelve)

- A három cím `Link`-je: `href={`/hirfigyelo?talalat=${encodeURIComponent(c.talalat_id)}`}`.
- A fő gomb: ha `voltFutas` és `hf !== null` és `hf.uj > 0` (és a szerep nem néző — a nézőnél marad a mai), a felirat `t("kezdolap.fo_gomb_hirek_n", { n: szamFormaz.format(hf.uj) })`; különben a mai `t(foGombKulcs)`. (A `szamFormaz` a fájlban létezik.)

### 2. `apps/web/app/hirfigyelo/Attekintes.tsx` (mellékelve — TELJES fájlt adsz vissza, csak ez a változás)

- Új `useEffect`, ami a betöltés után EGYSZER fut (`betoltve` igazra váltásakor; egy `useRef<boolean>` őrzi, hogy másodszor ne): a `window.location.search`-ből (`new URLSearchParams(...)`) kiolvassa a `talalat` paramétert; ha van, és a `kartyak` között van `k.fo_talalat_id === talalat`, akkor: ha a kártya `jeloles === "elrejtett"`, `setSzuro("all")`; majd `setDetailId(k.fo_talalat_id)` és `void megtekint(k)`. Ha nincs ilyen kártya, nem történik semmi (nincs hibaüzenet).
- A `useSearchParams` NEM használható (Suspense-határ kellene) — a `window.location.search` a `useEffect`-ben megfelel, mert a komponens `"use client"`.
- Semmi más nem változik.

### 3. ÚJ migráció: `apps/web/adatbazis/migraciok/0071_f9_a10_kezdolap_hirek_gomb.sql`

Fejléc: `-- F9-A10: a kezdőlap fő gombja a valódi számmal`. Egy `INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();` (a mellékelt 0062 minta szerint):
- `kezdolap.fo_gomb_hirek_n`: hu „Mind a {n} új hír megtekintése” · ro „Vezi toate cele {n} știri noi” · en „See all {n} new stories”

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm hatar` 0; `pnpm tokenor` 0. Bármelyik kezdőlapi címre kattintva a Hírek lapon UGYANAZ a hír nyílik a részletpanelben; a fő gombon a valódi szám. Add vissza a 3 fájlt.
