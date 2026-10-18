# Feladat — ÉPÍTŐ (E-19): a Hírfigyelő magja — `packages/news-monitor-core`

Mellékelve: `HIRFIGYELO-SZERZODES.md` (a SPEC — pontosan ezt építsd, a 2.1–2.11 pontok fájlonként), mintának a
`profile-core/src/index.ts` (stílus, magyar nevek, tiszta függvények) és a `contracts/src/index.ts` részlete (a `Szerep`, a
`SzervezetProfil` és a zod-stílus), valamint a `profile-core/package.json` + `tsconfig.json` (ugyanígy kell a csomag).

Készítsd el a TELJES csomagot:
- `packages/news-monitor-core/package.json` (`@km/news-monitor-core`, `"exports": { ".": "./src/index.ts" }`, függőség: `@km/contracts` workspace:* és `zod` 4.5.4; scriptek: `tipus`, `proba: "vitest run"`; devDependency: `vitest 5.0.0`),
  `tsconfig.json` (mint a profile-core-é), `vitest.config.ts` (include: `probak/**/*.proba.ts`).
- `src/beallitas.ts`, `src/forras.ts`, `src/kivonat.ts`, `src/talalat.ts`, `src/dedup.ts`, `src/futas.ts`, `src/minta.ts`,
  `src/visszajelzes.ts`, `src/ai.ts`, `src/host.ts`, `src/tar.ts` (interfész + `memoriaTar()`), `src/index.ts` (export *).

Kötelező szabályok:
- TypeScript 7, `exactOptionalPropertyTypes` (ne adj `undefined`-ot opcionális mezőnek; `?? ""` és társai), `zod` 4 (`z.iso.datetime()`, `z.uuid()`, `z.url()` helyett `z.string().url()` mehet).
- Tiszta függvények: NINCS `Date.now()`, `Math.random()`, `crypto`, hálózat, adatbázis, React. Az időt `most: Date` paraméterként kapod, az azonosítót `idAdo()`-ként.
- Az FNV-1a 64 bites ujjlenyomatot `BigInt`-tel írd meg (offset 0xcbf29ce484222325n, prime 0x100000001b3n), hex 16 jegy.
- A `kovetkezoFutas` az `Intl.DateTimeFormat`-tal számol az időzónában (nincs külső csomag): a mai napon az `ora:perc` a zónában → ha már elmúlt, holnap; a visszaadott `Date` UTC-helyes legyen.
- A `kanonikusUrl` a beépített `URL`-lel; hibás címre dobjon `Error("ervenytelen_cim")`.
- Minden exportált függvényhez egy-két soros magyar megjegyzés: mit csinál, mi a szabály.
- Semmi felesleges: ne írj REST-et, adatbázist, UI-t. Ne találj ki a specben nem szereplő mezőt; ha valami hiányzik a specből, a legegyszerűbb, a spec szellemével egyező megoldást válaszd és jelöld `// SPEC-KÉRDÉS:` megjegyzéssel.

Add vissza az ÖSSZES fájlt külön blokkban (`=== FÁJL: packages/news-monitor-core/… ===`), teljes tartalommal.
