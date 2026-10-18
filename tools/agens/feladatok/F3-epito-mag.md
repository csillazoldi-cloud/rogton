# F-3 · Építő — a hozzáférés-modul magja: `packages/hozzaferes-core`

CÉL: elkészül a `@km/hozzaferes-core` csomag a mellékelt SZERZŐDÉS (`docs/HOZZAFERES-SZERZODES.md`) szerint, a `docs/MODULSZABALY.md`
kötelező szerkezetével, és a próbái adatbázis nélkül zöldek.

FORRÁS: a szerződés (minden típus, függvény, szabály és hibakód ONNAN, szó szerint); a modulszabály (mappaszerkezet, tiltások,
README öt szakasza); mintának a `packages/news-monitor-core/src/host.ts` (a konnektor stílusa) és a `package.json`/`vitest.config.ts`.

MIT CSINÁLJ — a fájlok:
- `packages/hozzaferes-core/package.json` — `@km/hozzaferes-core`, version `0.1.0`, `"exports": { ".": "./src/index.ts" }`,
  scripts `tipus` (`tsc --noEmit -p tsconfig.json`) és `proba` (`vitest run`), dependencies `@km/contracts: workspace:*`, `zod: 4.5.4`,
  devDependencies `vitest: 5.0.0`.
- `tsconfig.json` (a news-monitor-core-é: extends `../../tsconfig.base.json`, `noEmit`, `types: []`, include `src`), `vitest.config.ts`
  (include `probak/**/*.proba.ts`).
- `src/host.ts` — a szerződés 2. és 4. pontja: `Szerep`, `SZEREP_ERO`, `Muvelet`, `HozzaferesHibaKod`, `HostKontextus`, a
  `TagsagTar`, `MeghivoTar`, `Ora`, `Azonosito`, `EsemenyKimenet`, `Kornyezet` típusok, `HozzaferesEsemeny`.
- `src/szabalyok.ts` — `MUVELET_SZEREP` tábla és a `dont()` döntő a szerződés 5. pontjának sorrendjével (indokkal).
- `src/meghivo.ts` — a `Meghivo`, `MeghivoAllapot`, `meghivoAllapot()`, `MEGHIVO_ERVENYESSEG_NAP`, és a lejárat számítása
  (`lejarat(letrehozvaISO): string` — +7 nap, tiszta számítás a kapott időből).
- `src/folyamat.ts` — `tagokLista`, `meghiv`, `meghivoLista`, `meghivoVisszavon`, `meghivoElfogad`, `szerepAllit`, `tagEltavolit`,
  `kilep` — a szerződés 5. pontja szerint; mindegyik előbb `dont()`-ot hív, aztán a tárat, aztán eseményt ad.
  `meghiv`: `jegy = k.azonosito.jegy()`, a tárba `lenyomat = k.azonosito.lenyomat(jegy)`; a jegy CSAK a visszatérési értékben.
- `src/index.ts` — csak újraexportál (ez az egyetlen bejárat).
- `probak/szabalyok.proba.ts`, `probak/meghivo.proba.ts`, `probak/folyamat.proba.ts` — memóriabeli tár (egy `probak/segedek.ts`-ben:
  `memoriaKornyezet(most: string)` rögzített órával, sorszámozott azonosítókkal, `jegy()` = "jegy-1", "jegy-2"…, `lenyomat(j)` = "ln:"+j,
  és egy eseménygyűjtővel). LEGALÁBB ezek az esetek:
  a) a néző nem hívhat meg (NINCS_JOG); b) a szerkesztő nem adhat tulajdonos szerepet (NAGYOBB_SZEREP), nézőt igen;
  c) az egyetlen tulajdonos nem fokozható le, nem távolítható el, nem léphet ki (UTOLSO_TULAJDONOS) — két tulajdonosnál igen;
  d) saját magát nem állíthatja át és nem távolíthatja el (MAGAT_NEM); e) meghívó: kiadás → a jegy a válaszban van, a tárban csak a
  lenyomat; f) elfogadás: felvesz + elfogadott + két esemény; másodszor MEGHIVO_FELHASZNALVA; g) lejárt jegy (az óra 8 nappal később)
  → MEGHIVO_LEJART, és a `meghivoLista` `allapot_most`-ja "lejart"; h) visszavont → MEGHIVO_VISSZAVONVA; i) már tag → MAR_TAG;
  j) ismeretlen jegy → NINCS_ILYEN_MEGHIVO; k) `szerepAllit` sikeres útja `szerep_valtozott` eseménnyel; l) `tagEltavolit` sikeres
  útja `tag_eltavolitva` eseménnyel; m) a `dont()` tiszta: ugyanarra a bemenetre ugyanaz a válasz, tár nélkül.
- `README.md` — PONTOSAN öt szakasz, a MODULSZABÁLY 7. pontja szerint: 1. Mit csinál (3 mondat, technológiai szó nélkül); 2. Mit kér
  a befogadótól (a host.ts minden portja egy sorral); 3. Mit ad vissza (a bejárat függvényei és az események); 4. Hibakódok
  (a zárt lista, mikor melyik); 5. Beillesztés (a szerződés 7. pontja). Magyarul.

HATÁR: csak a `packages/hozzaferes-core/` mappa. Máshoz nem nyúlsz (a határőr-szabály, a befogadók és a webalkalmazás más dolga).
KÉSZ, HA: `pnpm --filter @km/hozzaferes-core proba` zöld (legalább 13 eset), `tipus` zöld; a magban nincs `Date.now`, `new Date`,
`Math.random`, `crypto`, `process.env`, react/next/drizzle import.
TILOS: a szerződéstől eltérő név vagy aláírás; `any`; a `Szerep` importálása a contracts-ból (a modul a sajátját exportálja).
Visszaadás: minden fájl teljes tartalommal, külön `=== FÁJL: packages/hozzaferes-core/... ===` blokkban.
