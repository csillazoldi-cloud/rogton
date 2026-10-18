# Feladat — ÉPÍTŐ (R10-S2): a Megjelenés lap sémaválasztó sora (a D rajz szerint)

Vilmos döntése (2026-09-18): a Megjelenés lap egyszerű nézetének TETEJÉRE három csempe kerül — Éjkék · Világos · Sötét —, kis előnézettel; az aktívon „Ezt használjátok" jelvény, a többin „Erre váltok" gomb. Egy kattintás → a munkatér átvált. A mai finomhangoló mezők (fő szín, betűméret) alatta, változatlanul.

React 19, Next 16 (App Router), TypeScript 7 strict. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`. Magyar azonosítók. **Tokenőr:** a CSS-ben NINCS pixel-szín és nincs `color-mix`; minden érték `var(--…)` token vagy a `--ter-N` térköz-skála. Az előnézet színei ADATBÓL jönnek (a séma tokenjei inline `style`-ként), ezt a sor végén jelöld: `// tokenőr: ok — a séma saját értékei, adat`. Fordított ellenőrzés a rajzhoz: ami a rajzon nincs, az a képernyőn sem lehet.

## MÉRT tények (2026-09-18)
- A lap: `apps/web/app/tema/TemaEgyszeru.tsx` (kliens-komponens; `kezdo: SzervezetTemaAllapot`, `szervezetNev`, `tulajdonos`; `hivas()` a `../_kozos/kliens`-ből; `useFeliratok()` → `t("kulcs")`; `router.refresh()` a mentés után), stílus `tema-egyszeru.css`, a lap `page.tsx` (mellékelve).
- Az R10-S1 ügynök (párhuzamosan) elkészíti: `SEMAK`, `semaKeres`, `SemaKod` a `@km/design-system`-ből; `PUT /api/tema/sema { kod }` (tulajdonos) és `PUT /api/tema/kozos/sema { kod }` (rendszergazda) — mindkettő a friss állapotot adja vissza (`sema_kod` mezővel); a `SzervezetTemaAllapot.sema_kod: string | null`. Feliratkulcsok: `tema.sema.cim`, `tema.sema.magyarazat`, `tema.sema.aktiv`, `tema.sema.valt`, `tema.sema.valtas_folyamatban`, `tema.sema.valtva` (`{nev}`), `tema.sema.hiba`. Ezekre építs, ne írd meg újra.
- A rajz: `design/r10/D-semavalaszto.dc.html` (mellékelve) — 1180-as keretben: cím „Séma", egy magyarázó mondat, három csempe rácsban (3 oszlop, 20 px köz), csempénként: 168 px magas előnézet (fejléc-sáv + két kis kártya a séma színeivel), név (18 px félkövér), egysoros leírás, gomb vagy jelvény. Az aktív csempe kerete a fő szín, 2 px.

## Mit kell megírni

### 1. TELJES: `apps/web/app/tema/SemaValaszto.tsx` (új kliens-komponens)
- Props: `aktivKod: string | null`, `nyelv: "hu" | "ro" | "en"`, `kozos: boolean` (rendszergazda a közös alapot állítja: a `kozos/sema` végpont), `onValtva: () => void`.
- A `SEMAK` listából épül. Ha `aktivKod` null → az „ejkek" számít aktívnak (a mostani alap).
- Előnézet: a rajz kis kártyája, a séma `tokenek` értékeiből (`--bg`, `--bg-elev`, `--text`, `--text-mut`, `--primary`, a keret `--text` 8%-a: ezt NE számold, csak a `--bg-elev`-et és egy 1px keretet a `--text-mut`-ból 0.25 opacitással). Az Éjkéknél a rajz szerinti fénykorong (a `--primary` 25%-os, elmosott kör) csak akkor, ha a séma `--aurora-opacity` nem „0".
- Gomb: `<button type="button">` „Erre váltok" → `hivas("/api/tema/sema" vagy "/api/tema/kozos/sema", "PUT", { kod })` (a `hivas(ut, modszer, torzs)` aláírás a mellékelt kliens.tsx szerint); közben a gomb felirata „Átváltás…" és letiltva; siker → `onValtva()` (a szülő `router.refresh()`-t hív) + a lapon egy sor „Átváltva: {nev}"; hiba → „Nem sikerült átváltani. Próbáld újra."
- Aktív csempén jelvény (nem gomb) pipa ikonnal (inline stroke SVG, nem emoji), felirat `tema.sema.aktiv`.
- Minden felirat `t("tema.sema.…")`; a séma neve és leírása a `sema.nev[nyelv]` / `sema.leiras[nyelv]`.
- Elérhetőség: valódi gombok, `aria-pressed` az aktívon nem kell (jelvény), a csempe nem kattintható, csak a gomb.

### 2. TELJES: `apps/web/app/tema/sema-valaszto.css`
Osztályok `km-sema-` előtaggal: `km-sema-cim`, `km-sema-magyarazat`, `km-sema-racs` (grid, 3 oszlop, `gap: var(--ter-9)`), `km-sema-csempe` (háttér `var(--bg-elev)`, keret `var(--bw) solid var(--border)`, lekerekítés `var(--r-card)`, belső `var(--ter-8)`), `km-sema-csempe--aktiv` (keret `2px solid var(--primary)` — a 2px a rajzé, tokenőr-megjegyzéssel), `km-sema-elonezet` (magasság: `calc(var(--ter-14) * 2 + var(--ter-4))` = 168 px; lekerekítés `var(--r-block)`; `overflow: hidden`), `km-sema-nev` (`var(--fs-title)`, `var(--fw-head)`), `km-sema-leiras` (`var(--text-mut)`), `km-sema-gomb` (a meglévő gombstílus osztályát használd, ha van — a `tema-egyszeru.css`-ben nézd meg; ha nincs, `km-gomb-masodlagos` néven a `--control-min` magassággal), `km-sema-jelveny` (háttér `var(--accent-tint)`, szín `var(--primary)`, lekerekítés `var(--r-btn)`). Telefonon (≤ 700 px) a rács egy oszlop.

### 3. RÉSZLET: `_RESZLET-TemaEgyszeru.md` → `apps/web/app/tema/TemaEgyszeru.tsx`
- Import: `SemaValaszto`, és a CSS.
- A visszaadott JSX legtetején (a mai első blokk ELÉ): `<SemaValaszto aktivKod={kezdo.sema_kod ?? null} nyelv={nyelv} kozos={false} onValtva={() => router.refresh()} />` — a `nyelv` a `useFeliratok()`-ból jön, ha adja; ha nem, a `kezdo`-ből vagy a props-ból (nézd meg a mellékletet, és a legkisebb változtatással add át).
- Ha a komponens csak tulajdonosnak jelenik meg ma (`tulajdonos` prop), a sémaválasztó is csak neki.

### 4. RÉSZLET: `_RESZLET-page.md` → `apps/web/app/tema/page.tsx`
Csak ha kell: a `sema_kod` már a `SzervezetTemaAllapot` része (S1), tehát a `kezdo` viszi. Ha a rendszergazdai (közös) lap külön komponens (`Tema.tsx`), oda NEM kerül most sémaválasztó — ezt a rajz nem tartalmazza.

Más fájlhoz ne nyúlj.
