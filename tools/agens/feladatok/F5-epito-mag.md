# F-5 · Építő — az eseménynapló- és értesítés-modul magja: `packages/esemeny-core`

CÉL: elkészül a `@km/esemeny-core` a mellékelt SZERZŐDÉS (`docs/ESEMENY-SZERZODES.md`) szerint, a `docs/MODULSZABALY.md` kötelező
szerkezetével; a próbái adatbázis nélkül zöldek.

FORRÁS: a szerződés (minden név, típus, függvény szó szerint), a modulszabály, mintának a `packages/hozzaferes-core` fájljai
(host.ts, package.json, vitest.config.ts, tsconfig.json, README.md — ugyanez a stílus).

MIT CSINÁLJ — a fájlok:
- `package.json` (`@km/esemeny-core` 0.1.0; exports `./src/index.ts`; `tipus`, `proba`; deps `@km/contracts`, `zod 4.5.4`; dev `vitest 5.0.0`), `tsconfig.json`, `vitest.config.ts`.
- `src/host.ts` — a szerződés 2., 3., 4. pontja: `EsemenyFajta`, `Sulyossag`, `Csatorna`, `EsemenyHibaKod`, `Esemeny`, `ErtesitesBeallitas` (+ zod séma:
  `ErtesitesBeallitasSema = z.partialRecord(EsemenyFajta, Csatorna)` vagy azzal egyenértékű szigorú séma, ismeretlen kulcs → hiba), `ALAP_ERTESITES`,
  `MENTES_KIMARADT_ALAPBOL_BE`, `KimenoUzenet`, `HostKontextus`, `EsemenyTar`, `ErtesitesTar`, `Ora`, `Azonosito`, `KimenoCsatorna`, `Feliratozo`, `Kornyezet`.
- `src/szabalyok.ts` — `ALAP_SULYOSSAG`, `hatasosErtesites()`, `kimenoUzenet()` (a felirat kulcsai `esemeny.<fajta>_cim`, `esemeny.<fajta>_szoveg`, az `adat`
  értékei a behelyettesítéshez; ha a feliratozó a kulcsot adja vissza (nincs felirat), a cím a fajta, a szöveg az adat JSON-ja).
- `src/folyamat.ts` — `feljegyez()` (ismeretlen fajta → ISMERETLEN_FAJTA; id az azonosítóból, ido az órából, sulyossag az ALAP_SULYOSSAG-ból ha nincs
  megadva; `tar.ir`; majd a hatásos beállítás: `kimeno` → `csatorna.kuld(kimenoUzenet(...))`; a küldés hibája NEM dob: `kikuldve:false, kuldesHiba`),
  `naplo()`, `ertesitesLekerdez()`, `ertesitesSzervezetiMent()` (csak tulajdonos), `ertesitesKozosMent()`.
- `src/index.ts` — csak újraexportál.
- `probak/segedek.ts` (memória-tár, rögzített óra, sorszámozott azonosító, gyűjtő csatorna, egyszerű feliratozó) és `probak/*.proba.ts` — LEGALÁBB:
  a) alapból SEMMI nem megy ki (`feljegyez` → `kikuldve:false`, a tárban 1 esemény); b) közös "kimeno" a `futas_hiba`-ra → kimegy, a cím/szöveg a feliratozóból;
  c) szervezeti felülírás "nincs" a közös "kimeno" fölött → nem megy ki; d) a csatorna hibája → a tárban ott az esemény, `kikuldve:false`, `kuldesHiba` kitöltve;
  e) ismeretlen fajta → ISMERETLEN_FAJTA, a tárban semmi; f) `hatasosErtesites` három rétege; g) `ALAP_SULYOSSAG`: futas_hiba "hiba", tag_eltavolitva "figyelem",
  belepes "info"; h) `ertesitesSzervezetiMent` nézőként NINCS_JOG, tulajdonosként ok, ismeretlen fajta a testben → ERVENYTELEN_ADAT; i) `naplo` legújabb elöl,
  limit; j) `kimenoUzenet` felirat nélkül is ad címet és szöveget.
- `README.md` — PONTOSAN öt szakasz (Mit csinál · Mit kér a befogadótól · Mit ad vissza · Hibakódok · Beillesztés), magyarul.

HATÁR: csak `packages/esemeny-core/`. KÉSZ, HA: `pnpm --filter @km/esemeny-core proba` és `tipus` zöld; tiltott import nincs (csak `./`, `zod`, `@km/contracts`);
`Date`, `Math.random`, `crypto`, `process.env` nincs a `src/`-ben. TILOS: `any`; a szerződéstől eltérő nevek.
Visszaadás: minden fájl teljes tartalommal, külön `=== FÁJL: packages/esemeny-core/... ===` blokkban.
