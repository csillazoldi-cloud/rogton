# F-2 · Építő — a Gépház lap két nézetben (`apps/web/app/gephaz/`)

CÉL: a R-1 v3 rajz 4. (rendszergazda nézet, 4 csempe) és 8. (tulajdonos nézet, 2 csempe) artboardja él a webalkalmazásban a `/gephaz`
úton. Az adat KÉSZ típusból jön (`GephazNezet`, `apps/web/kezdolap/tipusok.ts` — hiteles, nem módosítod); a kiszolgálói összeállítót
(`gephazNezet`, `felsoSavAdat` az `apps/web/kezdolap/index.ts`-ben) és a felső sávot (`apps/web/app/_kozos/FelsoSav.tsx`) párhuzamosan
más írja — te a szerződésükre építs: `import { gephazNezet, felsoSavAdat } from "../../kezdolap"`, és
`import { FelsoSav } from "../_kozos/FelsoSav"` → `<FelsoSav adat={sav} aktiv="gephaz" />` (a `FelsoSavAdat` típus a `tipusok.ts`-ben).

FORRÁS: a mellékelt artboard-HTML-ek (04, 08 — a rajz hiteles szövege és szerkezete, inline stílusokkal, a tokennevek ONNAN), a
`feliratok.json` (a `gephaz.*` és `nav.*` kulcsok), a szerződés (`docs/KEZDOLAP-SZERZODES.md`), a minták: `app/tema/page.tsx`
(kiszolgálói lap, átirányítások), `app/_kozos/fiok.css` (a `km-` osztálynevek stílusa), `nyelv/kliens.tsx` (`useFeliratok().t(kulcs, { n })`).

MIT CSINÁLJ — a fájlok:

1. `apps/web/app/gephaz/page.tsx` (kiszolgálói): süti → `aktualisFiok`; nincs → `redirect("/belepes")`; `aktualisSzervezet` nincs →
   `redirect("/szervezet/uj")`; szerep a `fiok.szervezetek`-ből; `const nezet = await gephazNezet(fiok, szervezet, szerep)`; ha `null`
   (se tulajdonos, se rendszergazda) → `redirect("/kezdolap")`; `const sav = felsoSavAdat(fiok, szervezet, szerep, 0)`;
   `generateMetadata = () => oldalcim("gephaz.oldalcim")`; `dynamic = "force-dynamic"`; importok: `../_kozos/fiok.css`,
   `../_kozos/felsosav.css`, `./gephaz.css`; kirajzolja a sávot és `<Gephaz nezet={nezet} />`.
2. `apps/web/app/gephaz/Gephaz.tsx` (`"use client"`): `export function Gephaz({ nezet }: { nezet: GephazNezet })`.
   - Fejléc: `h1` `gephaz.cim` + jelvény: `gephaz.jelveny` (rendszergazda) / `gephaz.jelveny_tulaj` (tulajdonos); bevezető:
     `gephaz.bevezeto` (rendszergazda) / `gephaz.tulaj_bevezeto` (`{ munkater: nezet.munkater.nev }`).
   - Csemperács (`repeat(auto-fill, minmax(var(--tile-min), 1fr))`, `gap: var(--gap-tile)`):
     a) **Theme-beállítások**: cím `nav.theme`; jelvény `gephaz.mentetlen_tervezet` (figyelem-szín) ha `tema.tervezet`, különben `gephaz.nincs_tervezet`;
        rendszergazdának `gephaz.theme_allapot` (`{ n: tema.tokenek, datum }` — a dátum `Intl.DateTimeFormat(nyelv, { dateStyle: "medium" })`, ha
        `alkalmazva` null, a mondat elmarad); tulajdonosnak `gephaz.theme_felulir` (`{ n: tema.felulirt, m: tema.tokenek }`); link `gephaz.theme_link` (→ `/tema`).
     b) **Feliratok**: cím `nav.feliratok`; ugyanaz a tervezet-jelvény `feliratok.tervezet` szerint; rendszergazdának `gephaz.feliratok_allapot`;
        tulajdonosnak `gephaz.feliratok_felulir` (`{ n: feliratok.felulirt }`); link `gephaz.feliratok_link` (→ `/feliratok`).
     c) **Költség** — CSAK ha `nezet.koltseg !== null`: cím `nav.koltseg`; `gephaz.koltseg_allapot` (`{ honap, n: munkaterek, osszeg }` — a hónap neve
        a felület nyelvén, az összeg `Intl.NumberFormat(nyelv, { style: "currency", currency: osszeg.penznem })`); link `gephaz.koltseg_link` (→ `/koltseg`).
     d) **Fiókok** — CSAK ha `nezet.fiokok !== null`: cím `nav.fiokok`; nagy szám `fiokok.fiokok` + `gephaz.fiok_cimke` (`{ n: munkaterek }`);
        `gephaz.felfuggesztett` (`{ n }`, csak ha > 0, figyelem-szín); `gephaz.utolso_belepes` (`{ nev, idopont }`, ha van; az idő
        `Intl.DateTimeFormat(nyelv, { dateStyle: "medium", timeStyle: "short" })`); link `gephaz.fiokok_link` (→ `/fiokok`).
   - Tulajdonosnak a rács alatt egy blokk: `gephaz.tulaj_nincs_cim` + `gephaz.tulaj_nincs` (a 8. artboard alsó doboza). Rendszergazdának ez NINCS.
   - Zárt/tiltott csempe NINCS: ami nem jár, meg sem jelenik.
3. `apps/web/app/gephaz/gephaz.css` — csak tokenek: színek, betűk, méretek, lekerekítés `var(--…)`; MINDEN térköz `var(--ter-N)` (0…14) vagy a
   származtatottak (`--gap`, `--pad-card`, `--pad-block`, `--gap-tile`, `--pad-tile`, `--btn-pad-y/x`). Pixel-térköz és puszta `0` TILOS
   (`var(--ter-0)`). Osztályelőtag `km-gh-`. `@media (max-width: 640px)`: egy hasáb.

HATÁR: a három fájl. Más laphoz, a `tipusok.ts`-hez, a `kezdolap/index.ts`-hez, a `FelsoSav`-hoz NEM nyúlsz.
FIGYELEM: a `t()` hiányzó kulcsra a kulcsot adja — csak a `feliratok.json` kulcsait hívd. TypeScript szigorú (`noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`. `next/link` `Link` a hivatkozásokra.
Beégetett szín/betű/méret/lekerekítés/pixel-térköz TILOS.
KÉSZ, HA: `pnpm --filter web tipus` zöld, a tokenőr zöld; a két nézet a rajz szerkezetét adja.
Visszaadás: a három fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban. Semmi más szöveg.
