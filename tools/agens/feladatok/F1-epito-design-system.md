# F-1 · Építő — a térköz-skála a designrendszerben (`packages/design-system`)

CÉL: a designrendszer tizenöt új térköz-tokent ismer (`--ter-0` … `--ter-14`), a hét régi térköz-token
(`--gap`, `--pad-card`, `--pad-block`, `--pad-field-y`, `--pad-field-x`, `--btn-pad-y`, `--btn-pad-x`) SZÁRMAZTATOTT
token lesz, ami a skálára mutat, és az ellenőrző elutasítja a nem monoton lépcsőt. Mindezt próbák bizonyítják.

FORRÁS: a mellékelt fájlok (tokenek.ts, tema-szintek.ts, index.ts, tema-alap.json) — ezeket módosítod. A skála:

| Token | Alapérték | Megengedett tartomány a szerkesztőben |
|---|---|---|
| --ter-0 | 0px | NEM állítható: az érték mindig "0px" |
| --ter-1 | 2px | 0 … 8px (a következő fok kétszerese) |
| --ter-2 | 4px | 0 … 12px |
| --ter-3 | 6px | 0 … 16px |
| --ter-4 | 8px | 0 … 20px |
| --ter-5 | 10px | 0 … 24px |
| --ter-6 | 12px | 0 … 28px |
| --ter-7 | 14px | 0 … 32px |
| --ter-8 | 16px | 0 … 40px |
| --ter-9 | 20px | 0 … 48px |
| --ter-10 | 24px | 0 … 64px |
| --ter-11 | 32px | 0 … 80px |
| --ter-12 | 40px | 0 … 112px |
| --ter-13 | 56px | 0 … 160px |
| --ter-14 | 80px | 0 … 160px |

A hét régi token ezután a `szarmaztat()`-ban születik, ÍGY (szó szerint var()-hivatkozás, nem kiszámolt érték):
`--gap: var(--ter-6)` · `--pad-card: var(--ter-11)` · `--pad-block: var(--ter-9)` · `--pad-field-y: var(--ter-6)` ·
`--pad-field-x: var(--ter-7)` · `--btn-pad-y: var(--ter-6)` · `--btn-pad-x: var(--ter-10)`, és három új származtatott:
`--gap-tile: var(--ter-7)` · `--pad-tile: var(--ter-8)` · `--pad-row-y: var(--ter-7)`.

MIT CSINÁLJ — pontosan:
1. `src/tokenek.ts`: az `AlapTokenek` sémából VEDD KI a hét régi tokent; VEDD FEL a tizenötöt (`--ter-0`: `z.literal("0px")`;
   a többi a meglévő `meret(min, max)` segéddel, min 0, max a táblázat szerint). A séma marad `.strict()`.
2. `src/tema-alap.json`: a hét régi kulcs ki, a tizenöt új be (a fenti alapértékekkel). A `_megjegyzes` maradhat.
3. `src/tema-szintek.ts`:
   - `TOKEN_SZABALYOK`: a hét régi ki; a tizenöt be `{ tipus: "size", min: 0, max: … }` szabállyal; a `--ter-0`-nál
     `{ tipus: "size", min: 0, max: 0 }`.
   - A `TemaHiba.kod` enumja kap egy új kódot: `"notMonotonic"`.
   - Új, exportált függvény: `terkozMonoton(tokenek: Partial<Record<string,string>>): TemaHiba[]` — végigmegy a
     `--ter-1` … `--ter-14` sorrenden; ahol egy MEGADOTT fok pixelértéke KISEBB, mint egy előtte álló megadott fok
     értéke, `{ token: "--ter-<i>", kod: "notMonotonic", parameterek: { value, prev: "--ter-<j>", prevValue } }` hibát ad.
     (Egyenlőség megengedett. Ami nincs megadva, azt kihagyja — részleges készletnél is működik.)
   - `temaEllenoriz()` a tokenek ellenőrzése UTÁN meghívja ezt, és a hibákat hozzáfűzi; `ok` csak akkor igaz, ha ez is üres.
4. `src/index.ts` `szarmaztat()`: a tíz származtatott sor a fenti értékekkel. Minden más marad.
5. `probak/terkoz.proba.ts` (ÚJ mappa, vitest): legalább ezek az esetek —
   a) `TOKEN_KULCSOK` tartalmazza mind a 15 `--ter-*` kulcsot és NEM tartalmazza a hét régit;
   b) a `tema-alap.json` átmegy a `TemaDefinicio.parse`-on;
   c) `temaEllenoriz({$schema:"km-theme/2", tokens:{"--ter-3":"20px","--ter-4":"8px"}})` → `ok:false`, egy `notMonotonic` hiba a `--ter-4`-en;
   d) egyenlő szomszédok (`--ter-3: 8px, --ter-4: 8px`) → ok;
   e) `--ter-0: "4px"` → hiba (outOfRange vagy badSize — bármelyik, de hiba);
   f) `teljesTokenek(alap)["--gap"] === "var(--ter-6)"` és `["--pad-card"] === "var(--ter-11)"`;
   g) `cssValtozok(alap)` tartalmazza a `--ter-4:8px` és a `--gap:var(--ter-6)` szöveget;
   h) `temaEllenoriz` a régi `--pad-card` kulcsot a `figyelmenKivul` listába teszi, nem hibázik rajta.
6. `vitest.config.ts` (a news-monitor-core mintájára: include `probak/**/*.proba.ts`) és `package.json`: `"proba": "vitest run"`
   script + `"devDependencies": { "vitest": "5.0.0" }`. A `tsconfig.json`-t ne módosítsd.

HATÁR: csak a `packages/design-system/` mappa fájljai. Máshoz NEM nyúlsz (az alkalmazás és a migráció más ágens dolga).
KÉSZ, HA: `pnpm --filter @km/design-system proba` zöld; `pnpm tipus` zöld; a hét régi token sehol nincs az `AlapTokenek`-ben.
TILOS: React, Next, adatbázis, `Date.now()`, `process.env` a csomagban; beégetett szín; a meglévő függvények aláírásának változtatása.
Visszaadás: minden módosított/új fájl TELJES tartalommal, külön `=== FÁJL: packages/design-system/... ===` blokkban.
