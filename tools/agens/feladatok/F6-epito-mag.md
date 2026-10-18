# F-6 · Építő — a fájlfeltöltés-modul magja: `packages/fajl-core`

CÉL: elkészül a `@km/fajl-core` a mellékelt SZERZŐDÉS (`docs/FAJL-SZERZODES.md`) szerint, a `docs/MODULSZABALY.md` szerkezetével; a próbái
adatbázis és fájlrendszer nélkül zöldek.

FORRÁS: a szerződés (minden név szó szerint), a modulszabály, mintának a `packages/hozzaferes-core` fájljai (ugyanez a stílus).

MIT CSINÁLJ — a fájlok:
- `package.json` (`@km/fajl-core` 0.1.0; exports `./src/index.ts`; `tipus`, `proba`; deps `@km/contracts`, `zod 4.5.4`; dev `vitest 5.0.0`), `tsconfig.json`, `vitest.config.ts`.
- `src/host.ts` — a szerződés 2., 3., 4. pontja (`FajlTipus`, `FelismertTipus`, `FajlCel`, `FajlHibaKod`, `MAX_MERET_BAJT`, `KITERJESZTES`, `MIME`, `FajlMeta`,
  `FajlEsemeny`, `HostKontextus`, `FajlTar`, `Ora`, `Azonosito`, `EsemenyKimenet`, `Kornyezet`).
- `src/felismeres.ts` — `tipusFelismer(fej: Uint8Array)` a szerződés 5. pontjának mágikus fejlécei szerint. Az SVG-felismerés: a fej első legfeljebb 512 bájtja
  UTF-8-ként (érvénytelen bájtok eldobva), a BOM (EF BB BF) és a fehér köz levágva; `<?xml` vagy `<svg` kezdet, VAGY a szövegben kisbetűsen `<svg` → "svg".
  `fajlEllenoriz(be, korlat?)` a szerződés sorrendjében (URES → TUL_NAGY → svg → nem engedett → ok).
- `src/szabalyok.ts` — `dont(ktx, muvelet)`: feltölt: szerkesztő/tulajdonos; olvas: bárki tag.
- `src/folyamat.ts` — `feltolt()` (dont → fajlEllenoriz a `bajtok` első 512 bájtjával és `bajtok.length` mérettel → meta: `id: azonosito.uj()`,
  `feltoltve: ora.most()`, `nev` levágva 200 karakterre, `/` és `\` → `_` → `tar.ment(meta, bajtok)` → esemény `fajl_feltoltve`), `fajlMeta()`, `fajlOlvas()`,
  `fajlLista()` — a szerződés szerint (NINCS_ILYEN_FAJL, ha nincs vagy más szervezeté: a tár szervezet szerint kérdez).
- `src/index.ts` — csak újraexportál.
- `probak/segedek.ts` (memória-tár, rögzített óra, sorszámozott azonosító, eseménygyűjtő; fejléc-gyártók: `pngFej()`, `jpgFej()`, `webpFej()`, `pdfFej()`,
  `svgSzoveg()`, `gifFej()`) és `probak/*.proba.ts` — LEGALÁBB: a) a hat fejléc felismerése + ismeretlen; b) SVG BOM-mal és bevezető fehér közzel is "svg";
  c) `fajlEllenoriz`: üres → URES; 10 MB + 1 → TUL_NAGY; svg → SVG_NEM_ENGEDETT; gif → TIPUS_NEM_ENGEDETT; png → ok "png"; d) a NÉV nem számít:
  "logo.png" tartalommal svg → SVG_NEM_ENGEDETT; e) néző nem tölthet fel (NINCS_JOG), szerkesztő igen; f) `feltolt` sikeres útja: meta a tárban, esemény,
  a név megtisztítva; g) `fajlOlvas` más szervezet fájljára NINCS_ILYEN_FAJL; h) `fajlLista` cél szerint szűr; i) egyedi méretkorlát a `korlat`-tal.
- `README.md` — PONTOSAN öt szakasz, magyarul.

HATÁR: csak `packages/fajl-core/`. KÉSZ, HA: `pnpm --filter @km/fajl-core proba` és `tipus` zöld; tiltott import nincs; `Date`, `Math.random`, `crypto`,
`node:fs`, `process.env` nincs a `src/`-ben. TILOS: `any`; Buffer (csak `Uint8Array` és `TextDecoder`).
Visszaadás: minden fájl teljes tartalommal, külön `=== FÁJL: packages/fajl-core/... ===` blokkban.
