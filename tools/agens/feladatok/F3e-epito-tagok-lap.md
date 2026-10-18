# F-3e · Építő — a Tagok lap (`/tagok`) az R-2 rajz szerint (01–06. artboard)

CÉL: a `apps/web/app/tagok/` lap: kiszolgálói `page.tsx` + kliens `Tagok.tsx` + `tagok.css`, a mellékelt artboardok szerint. A felső sáv KÉSZ
(`apps/web/app/_kozos/FelsoSav.tsx`, nem módosítod). Az adat KÉSZ típusból jön (`apps/web/tagok/tipusok.ts`, hiteles, nem módosítod); a kiszolgálói
összeállítót (`tagokNezet`, `apps/web/tagok/index.ts`) párhuzamosan más írja — te a típusra építs: `import { tagokNezet } from "../../tagok"`.

FORRÁS: az artboard-HTML-ek (a rajz hiteles szövege és szerkezete, inline stílusokkal — a tokenneveket ONNAN), a `feliratok.json` (minden szöveg kulcsa;
csak ezeket hívd), az `ATADO.md` és az `ELLENORZES.md` (a döntések), a minták: `app/kezdolap/page.tsx` (kiszolgálói lap + sáv), `app/kezdolap/Kezdolap.tsx`,
`app/gephaz/Gephaz.tsx` (kliens-komponens stílusa, `hivas()` PUT/POST-ra), `app/_kozos/kliens.tsx` (`hivas`), `app/_kozos/hibaszoveg.ts` (`apiHivas` POST, `hibaKod`).

A VÉGPONTOK (a válasz sikerkor `{ hozzaferes: … }`, hibakor `{ hiba: "<KÓD>" }`; a hibakódok mondatai a `hozzaferes.hiba_<kód kisbetűvel>` kulcsokon MEGVANNAK):
- `POST /api/tagok/meghivo` `{ szerep, email? }` → 201 `{ hozzaferes: { meghivo, jegy, link } }` — a `link` a `/meghivo/<jegy>` út; a párbeszéd „B" panelje az
  `window.location.origin + link` teljes címet mutatja, másolható (`navigator.clipboard.writeText`), és **csak egyszer**. Szerkesztőnek `tulajdonos` szerepre 403 `NAGYOBB_SZEREP`.
- `DELETE /api/tagok/meghivo/{id}` → 200; hibák 404 `NINCS_ILYEN_MEGHIVO`, 410 `MEGHIVO_VISSZAVONVA`/`MEGHIVO_FELHASZNALVA`.
- `PUT /api/tagok/{fiokId}` `{ szerep }` → 200; `DELETE /api/tagok/{fiokId}` → 200 (csak tulajdonos).
- Siker után `router.refresh()` (a lap kiszolgálói adata újratöltődik).

MIT CSINÁLJ:
1. `apps/web/app/tagok/page.tsx`: süti → `aktualisFiok`; nincs → `redirect("/belepes")`; `aktualisSzervezet` nincs → `redirect("/szervezet/uj")`; a szerep a
   `fiok.szervezetek`-ből; **néző → `redirect("/kezdolap")`** (nem látja a lapot); `const nezet = await tagokNezet(fiok, szervezet, szerep)`;
   `const sav = felsoSavAdat(fiok, szervezet, szerep, await ujTalalatSzam(fiok, szervezet.id))` (a `../../kezdolap`-ból); `generateMetadata = () => oldalcim("tagok.oldalcim")`;
   `dynamic = "force-dynamic"`; importok: `../_kozos/fiok.css`, `../_kozos/felsosav.css`, `./tagok.css`; `<FelsoSav adat={sav} aktiv="nincs" />` + `<Tagok nezet={nezet} />`.
2. `apps/web/app/tagok/Tagok.tsx` (`"use client"`), `export function Tagok({ nezet }: { nezet: TagokNezet })`:
   - Fejléc: `h1` `tagok.cim` + `tagok.osszeg` (`{ n, m }` = tagok száma, élő meghívók száma), `tagok.bevezeto`; jobbra a **Meghívás** gomb (`tagok.meghivas_gomb`) —
     tulajdonosnak ÉS szerkesztőnek (D-F30/3).
   - **Első használat** (egy tag, nincs meghívó — 02. artboard): a lista helyett a rajz üres-állapot blokkja, a meghívás gombja hangsúlyos.
   - **Taglista** (01.): oszlopok a rajz szerint (Ki: név + e-mail · Szerep jelvény · Csatlakozott dátum · műveletek). A saját soron `tagok.ez_te_vagy` jelvény, a
     vezérlők NEM aktívak (05/B: halvány szöveg + mondat), nem gombok. Más soron: **tulajdonosnak** Szerep (lenyíló a soron: néző · szerkesztő · tulajdonos — a
     választás azonnal az alsó megerősítő sávot nyitja) és Eltávolítás; **szerkesztőnek ezek nincsenek** (nem halványan — sehogy).
   - **Megerősítő sáv** (04.): a képernyő aljára rögzül (`position: fixed; bottom: var(--ter-0)`), megnevezi a következményt (`tagok.megerosit_szerep` `{ nev, szerep }`,
     `tagok.megerosit_eltavolit` `{ nev }` — a kulcsokat a feliratok.json-ból), két gomb: megerősít · `kozos.megse`. Csak a megerősítés után megy a PUT/DELETE.
   - **Függő meghívók** (01.): `tagok.meghivok_cim` + jelvény; soronként címzett (vagy `tagok.meghivo_cimzett_nincs`), szerep, `meghivo.allapot_<allapot>`, a lejárat
     (`tagok.meghivo_lejar` `{ datum }`), Visszavonás (csak `kiadott`-nál; visszavont/lejárt sor halvány — 05/C).
   - **Meghívás párbeszéd** (03/A): szerep-választó három kártyával (a rajz leírásaival: `tagok.szerep_nezo_le`, …), szerkesztőnek a tulajdonos kártya tiltott a rajz „C"
     panelje szerint; „Kinek szól?" opcionális e-mail (`tagok.cimzett_megj`); a kiadás előtt a `meghivo.elettartam` mondat („hét napig él"); gombok `tagok.meghivo_kiadas`, `kozos.megse`.
     Siker → **„B" panel** (03/B): a link mezőben, Másolás gomb, a figyelmeztető blokk (`tagok.link_egyszer_cim/_szoveg`), Szerep · Meddig él · Címzett sorok, záró gomb
     `tagok.kimasoltam` → bezár + `router.refresh()`.
   - **Mi történt** (01. alja): `tagok.mi_tortent` fejléc, a `nezet.esemenyek` sorai (idő rövid alakban a felület nyelvén, `esemeny.<fajta>_cim` kulccsal a fajta neve — ezek
     a kulcsok MEGVANNAK —, a cselekvő neve), link `tagok.esemenynaplo_link` (→ `/gephaz`).
   - Minden szöveg `t()`-ből, dátumok `Intl.DateTimeFormat(nyelv, { …, timeZone: "Europe/Bucharest" })` (különben hidratálási hiba — mérve).
3. `apps/web/app/tagok/tagok.css` — osztályelőtag `km-tg-`; csak tokenek (szín/betű/méret/lekerekítés `var(--…)`, MINDEN térköz `var(--ter-N)`; pixel-térköz és puszta `0` tilos);
   `@media (max-width: 640px)` (06.): a lista kártyákká, a sáv az aljára rögzül teljes szélességben, a párbeszéd teljes szélességű.

HATÁR: a három fájl. `tipusok.ts`, `tagok/index.ts`, `FelsoSav`, más lapok: NEM nyúlsz.
TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`. `next/link` `Link`.
A `t()` hiányzó kulcsra a kulcsot adja — CSAK a `feliratok.json` kulcsait és a fent nevezett meglévőket (`hozzaferes.hiba_*`, `esemeny.*_cim`, `kozos.megse`, `nav.*`) hívd.
Beégetett szín/betű/méret/lekerekítés/pixel-térköz: TILOS.
KÉSZ, HA: `pnpm --filter web tipus` zöld, tokenőr zöld; a lap a hat artboard állapotát adja.
Visszaadás: a három fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban. Semmi más szöveg.
