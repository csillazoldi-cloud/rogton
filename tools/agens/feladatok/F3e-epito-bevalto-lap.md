# F-3e · Építő — a meghívó beváltó lapja (`/meghivo/<jegy>`) az R-2 rajz 07. artboardja szerint

CÉL: `apps/web/app/meghivo/[jegy]/page.tsx` (kiszolgálói) + `Bevalto.tsx` (kliens) + `bevalto.css`. **Ezen a lapon NINCS felső sáv** (a látogató még nem tag;
a rajz jegyzete kimondja) — csak a termékjel és a terméknév áll felül. Az adat KÉSZ típusból (`apps/web/tagok/tipusok.ts` → `BevaltoNezet`, nem módosítod); a
kiszolgálói összeállítót (`bevaltoNezet(jegy, fiok)`, `apps/web/tagok/index.ts`) párhuzamosan más írja — `import { bevaltoNezet } from "../../../tagok"`.

FORRÁS: a 07. artboard HTML-je, a `feliratok.json` (a `meghivo.*` kulcsok), az `ATADO.md` 2. pontja, az `ELLENORZES.md`; minták: `app/kezdolap/page.tsx`
(kiszolgálói lap), `app/belepes/BelepesUrlap.tsx` (kliens-űrlap stílusa, `apiHivas`), `app/_kozos/fiok.css` (`km-hatter`, `km-kozep`, `km-kartya`, `km-logo`, `km-cim` —
a belépőlap kártyás szerkezete: ezt használd, a beváltó lap annak a testvére).

A VÉGPONTOK: `GET /api/meghivo/{jegy}` → `{ meghivo: BevaltoNezet }` (a kiszolgálói lap hívja a `bevaltoNezet`-en át, nem te); `POST /api/meghivo/elfogad` `{ jegy }`
(belépett fiók) → 200 `{ hozzaferes: { szervezet_id, szerep } }`; hibák: 404 `NINCS_ILYEN_MEGHIVO`, 410 `MEGHIVO_LEJART` / `MEGHIVO_FELHASZNALVA` / `MEGHIVO_VISSZAVONVA`,
409 `MAR_TAG`. Elfogadás után `router.push("/kezdolap")` (a munkatér már a sávban áll — a rajz mondata).

MIT CSINÁLJ:
1. `page.tsx`: `const { jegy } = await params` (Next 16: a `params` ígéret); süti → `aktualisFiok` (lehet null — a lap belépés nélkül is él);
   `const nezet = await bevaltoNezet(jegy, fiok)`; `generateMetadata = () => oldalcim("meghivo.oldalcim")`; `dynamic = "force-dynamic"`; import `../../_kozos/fiok.css`, `./bevalto.css`;
   `<Bevalto nezet={nezet} jegy={jegy} />`. A jegy NEM kerül naplóba, szövegbe, címbe — csak a POST törzsébe.
2. `Bevalto.tsx` (`"use client"`), `export function Bevalto({ nezet, jegy }: { nezet: BevaltoNezet; jegy: string })`:
   - Felül: termékjel (`km-logo`) + `kozos.app_nev` — sáv nincs.
   - **A · belépett, a meghívó él** (`allapot === "kiadott" && belepve && !mar_tag`): `meghivo.bevalt_cim` (`{ nev, munkater }`), a szerep jelvény + a szerep leírása
     (`tagok.szerep_<szerep>_le`), `meghivo.bevalt_ki_vagy` (`{ email }`), gomb `meghivo.elfogad_gomb` → POST → siker: `/kezdolap`; hiba: a kód mondata (`hozzaferes.hiba_*`)
     a kártyán; alatta `meghivo.elfogad_megj`.
   - **B · belépés nélkül** (`!belepve`): ugyanaz a cím; `meghivo.belepes_kell` mondat; két gomb: `meghivo.belepes_gomb` → `Link` a `/belepes?vissza=/meghivo/<jegy>`-re,
     `meghivo.fiok_letrehozas_gomb` → `/regisztracio?vissza=/meghivo/<jegy>`; alatta `meghivo.belepes_megj`.
   - **C · a hibautak**, egy-egy kártya, a rajz szerint: `lejart` (hibaszín) · `elfogadott` = felhasználták (hibaszín) · `visszavont` és `nincs` = nem érvényes (hibaszín) ·
     `mar_tag` (SEMLEGES szín — tájékoztatás): mindegyik cím + következő lépés mondata (`meghivo.hiba_<eset>_cim/_szoveg` kulcsok a feliratok.json-ból).
   - Minden szöveg `t()`-ből; a dátum (ha kell) `Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeZone: "Europe/Bucharest" })`.
3. `bevalto.css` — osztályelőtag `km-bv-`; csak tokenek, minden térköz `var(--ter-N)`; telefonon (`max-width: 640px`) egy oszlop, a gombok teljes szélességűek.

HATÁR: a három fájl. `tipusok.ts`, `tagok/index.ts`, a belépőlap: NEM nyúlsz (a `vissza` paramétert a belépőlapon más köti be).
TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`.
A `t()` hiányzó kulcsra a kulcsot adja — CSAK a `feliratok.json` kulcsait és a `hozzaferes.hiba_*`, `kozos.app_nev` meglévőket hívd. Beégetett érték TILOS.
KÉSZ, HA: `pnpm --filter web tipus` zöld, tokenőr zöld; a lap a 07. artboard három állapotát és négy hibaútját adja.
Visszaadás: a három fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban. Semmi más szöveg.
