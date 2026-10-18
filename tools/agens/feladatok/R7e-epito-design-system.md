# R-7e · Építő — a design-system skálája: arányos betűméret, új értékek, két új szélesség-token, semleges eredet-színek (+ migráció 0063)

CÉL: a `@km/design-system` a Design R-7e lapja (`design/r7-audit-javitas/atado/R-7e-vizualis-alap/tokenek.md`, melléklet) szerinti értékeket és származtatást adja; a tárolt közös alap egy migrációval követi. Négy fájlt adsz vissza egészben + egy új SQL-t.

TÉNYEK (mérve, nem kell ellenőrizni):
- `packages/design-system/src/index.ts` `szarmaztat(t)`: ma `--fs-md/sm/xs` = base −1/−2/−3 px, `--fs-h2` = 0,7 × `--fs-h1`, `--control-min-s` = control-min − 8, `--src-user` = `--ok` (13%), `--src-ai` = `--accent-text` / `--src-ai-bg` = `--accent` 20%. A `kever(szin, %, alap)` segéd `color-mix`-et ad; `px()` parseInt.
- `packages/design-system/src/tokenek.ts` `AlapTokenek` (zod, **strict**): `--fs-base` meret(12,20), `--fs-title` meret(14,24), `--control-min` meret(32,64), `--lh` szam(1.1,2.2), `--accent-link` szín; a `meret()` regex tizedest is enged (`^-?\d+(\.\d+)?px$`).
- `packages/design-system/src/tema-szintek.ts` `TOKEN_SZABALYOK`: minden alaptokenhez egy szabály (a zod tükre) — új tokennél ide is kell sor, különben típushiba (`Record<keyof AlapTokenek, …>`).
- `packages/design-system/src/tema-alap.json`: `--fs-base` 15px, `--fs-title` 16px, `--control-min` 44px, `--lh` 1.55, `--accent-link` #ff6a40, `--primary-2` #7f8fff.
- A 0052-es migráció (melléklet) mutatja, hogyan került be két új token: felirat-kulcsok a Theme-lap csúszkájához (`tema.<token>`), és `UPDATE "tema" SET definicio = jsonb_set(…)` a tárolt közös alapra, csak ahol a kulcs hiányzik.
- A `--primary-2` MARAD alaptoken (a származtatását az R-7c Megjelenés-nézettel együtt döntjük; most nem nyúlsz hozzá).

MIT CSINÁLJ:
1. `src/index.ts` — a származtatás:
   - `--fs-md` = `Math.round(base × 0,9375)`px · `--fs-sm` = `Math.round(base × 0,875)`px · `--fs-xs` = `Math.max(12.5, base × 0,78)` egy tizedesre kerekítve (pl. `12.5px`) · `--fs-h2` = `Math.round(base × 1,625)`px (NEM a h1-ből) · `--control-min-s` = control-min − 8 (marad).
   - `--src-ai` = `t["--primary-2"]`, `--src-ai-bg` = `kever(t["--primary-2"], 14)`; `--src-user` = `t["--text-mut"]`, `--src-user-bg` = `kever(txt, 7)`. A `--warn*` és `--accent*` származtatás VÁLTOZATLAN.
   - A megjegyzésekben hivatkozz: „R-7e (2026-09-13): arányos skála, alsó korlát 12,5px; az AI-eredet és a saját eredet nem figyelmeztetés és nem eredmény".
2. `src/tokenek.ts` — két új alaptoken az `AlapTokenek`-be, a `--tile-min` sora mellé: `"--urlap-max": meret(640, 720), "--lista-max": meret(1100, 1200)` + egy soros komment (R-7e: egységes tartalomszélesség — űrlap · lista).
3. `src/tema-szintek.ts` — a két új szabály: `{ tipus: "size", min: 640, max: 720 }`, `{ tipus: "size", min: 1100, max: 1200 }`.
4. `src/tema-alap.json` — új értékek: `--fs-base` "16px", `--fs-title` "17px", `--control-min` "46px", `--lh` "1.5", `--accent-link` "#7f8fff" (= a mai `--primary-2` értéke; a link nem figyelmeztetés); új kulcsok: `--urlap-max` "680px", `--lista-max` "1180px". A `_megjegyzes` maradjon.
5. ÚJ `apps/web/adatbazis/migraciok/0063_r7e_skala.sql` — a 0052 alakjában:
   a) feliratok: `tema.urlap_max` („Űrlap legnagyobb szélessége" / ro / en), `tema.lista_max` („Lista legnagyobb szélessége" / ro / en) — `INSERT … ON CONFLICT … DO UPDATE`;
   b) a tárolt KÖZÖS ALAP kiegészítése a két új tokennel, ahol hiányzik (mint a 0052);
   c) a tárolt közös alap ÉRTÉKEINEK frissítése **csak ott, ahol a régi alapérték áll** (a szervezeti felülírást nem bántjuk — az a saját döntés): `--fs-base` '15px'→'16px', `--fs-title` '16px'→'17px', `--control-min` '44px'→'46px', `--lh` '1.55'→'1.5', `--accent-link` '#ff6a40'→'#7f8fff'. Egy `UPDATE "tema"` per token, `WHERE "definicio" -> 'tokens' ->> '--fs-base' = '15px'` mintával, `jsonb_set`-tel. Fejléc-komment: R-7e (D-F43) — a skála új értékei; mit és miért.
   FIGYELEM: a `tema` tábla oszlopa `definicio` (jsonb), a tokenek `definicio -> 'tokens'` alatt — pontosan úgy, ahogy a 0052 melléklet írja. Nem tudod, van-e külön szint-oszlop: ezért a c) pont feltétele az ÉRTÉK egyezése, nem a szint.

HATÁR: a négy design-system fájl + az új SQL. Más fájlhoz (Tema.tsx, CSS, referencia-host) nem nyúlsz. Tiltott import a design-systemben: react, next, drizzle, pg, node:* — csak `zod`. TypeScript szigorú (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`).
KÉSZ, HA: `pnpm --filter @km/design-system tipus` (vagy `tsc --noEmit`) zöld; a `szarmaztat(alap)` 16px-es alapon `--fs-sm` „14px", `--fs-xs` „12.5px", `--fs-h2` „26px", `--control-min-s` „38px"-et ad.
Visszaadás: `packages/design-system/src/index.ts`, `src/tokenek.ts`, `src/tema-szintek.ts`, `src/tema-alap.json` (teljes), `apps/web/adatbazis/migraciok/0063_r7e_skala.sql` — külön `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban. Semmi más szöveg, gondolkodás nélkül.
