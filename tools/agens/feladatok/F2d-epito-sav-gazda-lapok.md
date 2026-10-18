# F-2d · Építő — a felső sáv a Theme, Feliratok, Költség és Fiókok lapra (R-1 v4, a 10. artboard jegyzete, D-F29)

CÉL: a meglévő `FelsoSav` (`apps/web/app/_kozos/FelsoSav.tsx`, KÉSZ, nem módosítod) kerül a négy rendszerszintű lap tetejére; a négy lap közti
váltó (`GazdaNav`), a lapok saját nyelvválasztója és a „vissza a fiókhoz" link **elmarad** — a sáv viszi. A lapok SAJÁT eszközsora (szintválasztó,
tervezet-jelvény, Alkalmazás/Elvetés gombok, hónapválasztó) **marad** a sáv alatt. Ez a rajz döntése (a 10. artboard jegyzete): „ahol a modulnak több
lapja van, a fülsor marad; a négy rendszerszintű lap önálló, mindegyikhez a Gépházon át vezet az út — két navigációs sor fölösleges."

FORRÁS: a 10. artboard HTML-je (a jegyzet szövege), a `FelsoSav.tsx` (props: `adat: FelsoSavAdat`, `aktiv: "kezdolap" | "ugyfelprofil" | "gephaz" | "modul" | "nincs"`),
a `kezdolap/tipusok.ts`, a `kezdolap/page.tsx` (MINTA a `sav` kiszámítására), és a módosítandó fájlok.

A SÁV ADATA a kiszolgálói lapon (mind a négy `page.tsx`-ben ugyanígy):
```ts
import { felsoSavAdat, ujTalalatSzam } from "../../kezdolap";
const szerep = fiok.szervezetek.find((sz) => sz.id === szervezet.id)?.szerep ?? "nezo";
const sav = felsoSavAdat(fiok, szervezet, szerep, await ujTalalatSzam(fiok, szervezet.id));
```
(`ujTalalatSzam` párhuzamosan készül; te csak hívod.) A lap importálja a `../_kozos/felsosav.css`-t, és a `sav`-ot propként adja a komponensnek.
`aktiv`: a Theme, Feliratok, Költség (rendszergazda) és Fiókok lapon `"gephaz"`; a Költség SAJÁT (tulajdonosi) nézetén `"nincs"`.

MIT CSINÁLJ:

1. `apps/web/app/tema/page.tsx` + `Tema.tsx`: a lap számolja a `sav`-ot és átadja. A `Tema` új propja `sav: FelsoSavAdat`; a `.km-tema` gyökér ELSŐ gyereke
   `<FelsoSav adat={sav} aktiv="gephaz" />`; a `<header className="km-tema-fejlec">` marad, de belőle **kikerül**: `{rendszergazda ? <GazdaNav itt="tema" /> : null}`,
   a `<Nyelvvalaszto />`, és az `<a href="/fiok" …>{t("tema.vissza_fiok")} →</a>`. A szintválasztó, a jelvények és a gombok maradnak. A fölöslegessé vált importok kikerülnek.
2. `apps/web/app/feliratok/page.tsx` + `Feliratok.tsx`: ugyanez (`GazdaNav`, `Nyelvvalaszto`, vissza-link ki; `sav` prop; `FelsoSav` a gyökér elején).
3. `apps/web/app/koltseg/page.tsx` + `KoltsegGazda.tsx` + `KoltsegSajat.tsx`: a lap számolja a `sav`-ot, mindkét komponens kapja. A `KoltsegGazda` fejlécéből kikerül a
   `km-kolt-logo` + `km-kolt-cim` (a sáv adja a terméknevet) és a `<GazdaNav itt="koltseg" />`; a `km-kolt-jelveny` („rendszergazda") és a hónapválasztó marad. A
   `KoltsegSajat` fejlécéből (`km-koltsajat-fejlec`) ugyanígy a termékjel/név és a vissza-link (ha van) kikerül; ami a lap saját eszköze (hónap, cím), marad.
   `FelsoSav` a gyökér elején: Gazda `aktiv="gephaz"`, Sajat `aktiv="nincs"`.
4. `apps/web/app/fiokok/page.tsx` + `Fiokok.tsx`: a `redirect("/")` a nem rendszergazdának mostantól `redirect("/kezdolap")`; szervezet nélkül `redirect("/szervezet/uj")`
   (a `sav`-hoz kell a szervezet). A `Fiokok` fejlécéből kikerül a `km-fk-logo` + `km-fk-nev`, a `<GazdaNav itt="fiokok" />` és a `<Nyelvvalaszto className="km-fk-valaszto" />`;
   a `km-fk-jelveny-gazda` marad. `FelsoSav` a gyökér elején, `aktiv="gephaz"`.
5. CSS: ha egy fejléc-sor a kivett elemek nélkül üresen marad, a szabálya maradhat (nem törlünk); igazítás csak tokenekkel.

HATÁR: a felsorolt fájlok. A `FelsoSav.tsx`, `GazdaNav.tsx` (marad a fájl, csak nem hívja senki), `kezdolap/*` NEM változik.
TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`.
KÉSZ, HA: `pnpm --filter web tipus` zöld; a négy lapon a sáv áll felül, a GazdaNav nincs.
Visszaadás: TELJES fájl: a négy `page.tsx`. RÉSZLET (`=== FÁJL: <út>.RESZLET.tsx ===`): `Tema.tsx`, `Feliratok.tsx`, `KoltsegGazda.tsx`, `KoltsegSajat.tsx`, `Fiokok.tsx` —
mindegyikhez: (a) az importok változása, (b) a props-sor új alakja, (c) a fejléc-blokk ÚJ, teljes szövege (a `<header …>`-től a `</header>`-ig, vagy a megfelelő fejléc-div),
(d) a gyökérelem első gyerekeként a `FelsoSav` sora — mindegyik 2 sor változatlan környezettel, hogy beilleszthető legyen. Semmi más szöveg.
