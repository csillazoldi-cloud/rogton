# F-2d · Építő — a felső sáv az Ügyfélprofil lapra és a Hírfigyelő három lapjára (R-1 v4, 9. és 10. artboard)

CÉL: a meglévő `FelsoSav` komponens (`apps/web/app/_kozos/FelsoSav.tsx`, KÉSZ, nem módosítod) kerül az Ügyfélprofil (`/fiok`) és a Hírfigyelő
(`/hirfigyelo`, `/hirfigyelo/beallitas`, `/hirfigyelo/finomhangolas`) lapok tetejére, a régi fejlécük helyett — a mellékelt 09. és 10. artboard szerint.

FORRÁS: a két artboard HTML-je (a rajz hiteles szövege és szerkezete), az `ATADO.md` 1.2 pontja, a `FelsoSav.tsx` (a props: `adat: FelsoSavAdat`,
`aktiv: "kezdolap" | "ugyfelprofil" | "gephaz" | "modul" | "nincs"`), a `kezdolap/tipusok.ts` (a `FelsoSavAdat` típus), a `kezdolap/page.tsx` (MINTA: hogyan
számolja a kiszolgálói lap a `sav`-ot), és a módosítandó fájlok.

A SÁV ADATA a kiszolgálói lapon (minden érintett `page.tsx`-ben ugyanígy):
```ts
import { felsoSavAdat, ujTalalatSzam } from "../../kezdolap";   // (a mélységnek megfelelő relatív út)
const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
const sav = felsoSavAdat(fiok, szervezet, szerep, await ujTalalatSzam(fiok, szervezet.id));
```
(`ujTalalatSzam(fiok, szervezetId): Promise<number>` — az új találatok száma, párhuzamosan más írja; te csak hívod.) A lap importálja a
`../_kozos/felsosav.css`-t is (a mélységnek megfelelően), és a `sav`-ot propként adja a kliens-komponensnek.

MIT CSINÁLJ:

1. **Ügyfélprofil — 09. artboard.**
   - `apps/web/app/fiok/page.tsx`: a `sav` kiszámítása (fent), `import "../_kozos/felsosav.css"`, és `<Fiok … sav={sav} />`.
   - `apps/web/app/fiok/Fiok.tsx`: új prop `sav: FelsoSavAdat` (`import type { FelsoSavAdat } from "../../kezdolap/tipusok"`; `import { FelsoSav } from "../_kozos/FelsoSav"`).
     A mai `<header className="km-fejlec km-fp-fejlec">…</header>` blokk (termékjel, név, morzsa, mentés-állapot, fiók neve, Kilépés) **kikerül**; helyette a
     `.km-fp-lap` elem ELSŐ gyereke `<FelsoSav adat={sav} aktiv="ugyfelprofil" />`. A `MentesAllapot` a **lapcím mellé** kerül: a `.km-fp-cimsor`-ban a `h1` UTÁN,
     a `km-fp-jovahagyva` jelvény ELŐTT (a rajz: „Ügyfélprofil ● Mentve · ma 09:12 [jóváhagyva]"). A `KilepesGomb` importja kikerül (a sáv viszi). Más nem változik.
   - `apps/web/app/_kozos/fiok.css`: ha a `.km-fp-fejlec…` szabályok más lapot nem érintenek, maradhatnak (nem törlünk); új szabály csak, ha a mentés-állapot
     a címsorban igazítást kér (`.km-fp-cimsor .km-mentes…` — nézd meg a `MentesAllapot` osztályait a `_kozos/kliens.tsx`-ben).

2. **Hírfigyelő — 10. artboard.**
   - `apps/web/app/hirfigyelo/_kozos/HirfigyeloKeret.tsx`: új prop `sav: FelsoSavAdat`. A mai `<header className="km-hf-fejlec">` helyett:
     `<FelsoSav adat={sav} aktiv="modul" />`, alatta egy **fülsor** (`<div className="km-hf-fulsor">`): balra a modulnév (`hf.modTitle`) + `hf.modTag` jelvény,
     mellette a három fül (a mai `km-hf-fulek` nav változatlan logikával), jobbra a `nav.uj_talalat_jelzes` jelvény (`{ n: sav.uj_talalat }`, csak ha > 0).
     A `Nyelvvalaszto` és a „vissza a fiókhoz" link **kikerül** (a sáv viszi). A `km-hf-profil-sor` és a `main` marad.
   - `apps/web/app/hirfigyelo/_kozos/hirfigyelo.css`: a `.km-hf-fejlec*` szabályok helyett/mellett `.km-hf-fulsor` (flex, `gap: var(--ter-5)`, `padding: var(--ter-5) var(--ter-10)`,
     alsó vonal `var(--bw) solid var(--line-soft)`, háttér `var(--bg-elev)`), a `7 új` jelvény jobbra (`margin-inline-start: auto`). Csak tokenek; pixel-térköz és puszta `0` tilos.
     `@media (max-width: 640px)`: a fülsor vízszintesen görgethető (`overflow-x: auto`, `white-space: nowrap`), az aktív fül balra, a jelvény a sor végén.
   - A három kliens-komponens (`Attekintes.tsx`, `beallitas/Beallitas.tsx`, `finomhangolas/Finomhangolas.tsx`): új prop `sav: FelsoSavAdat`, és MINDEN
     `<HirfigyeloKeret …>` hívás megkapja: `sav={sav}` (fájlonként három hely). Mást nem változtatsz bennük.
   - A három `page.tsx` (`hirfigyelo/page.tsx`, `beallitas/page.tsx`, `finomhangolas/page.tsx`): a `sav` kiszámítása, a `felsosav.css` importja, `sav={sav}` a komponensnek.

HATÁR: a fent felsorolt fájlok. A `FelsoSav.tsx`, `felsosav.css`, `kezdolap/*`, a `_kozos/kliens.tsx` NEM változik.
TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`.
Minden szöveg feliratkulcsból (`t(...)`), csak meglévő kulccsal: `hf.modTitle`, `hf.modTag`, `nav.uj_talalat_jelzes`, `hf.pOverview/pSetup/pTune`, `hf.profileNote`.
KÉSZ, HA: `pnpm --filter web tipus` zöld, tokenőr zöld; a négy lapon a sáv áll felül, a régi fejléc nincs.
Visszaadás: TELJES fájl: a négy `page.tsx`, `HirfigyeloKeret.tsx`, `hirfigyelo.css`. RÉSZLET (`=== FÁJL: <út>.RESZLET.tsx ===`): `Fiok.tsx` (az importok változása,
a props-sor, a kivett header helye, a címsor új sora — mindegyik 2–3 sor környezettel), és a három hírfigyelő-komponens (a props-sor és a három Keret-hívás).
Semmi más szöveg.
