# F-5b · Építő — a Beállítások lap (`apps/web/app/beallitasok/Beallitasok.tsx` + `beallitasok.css`) és a közös kapcsoló (`apps/web/app/_kozos/Kapcsolo.tsx` + `kapcsolo.css`) az R-4 rajz szerint

CÉL: a rajz 01–06. artboardja (a 07. NEM épül): egy lap két füllel (Értesítések · Adatpolitika), a felső sáv ALATT (a sávot más rakja rá — te csak a lap
törzsét írod, a `<main>` tartalmát). Négy fájl, semmi más.

FORRÁS: a rajz HTML-je (hét artboard; a hiteles szöveg, szerkezet és tokennevek onnan — a `data-key` nélküli szövegek is kulcsból jönnek, a
`feliratok.json` szerint), a `feliratok.json` (80 kulcs — CSAK ezeket és a lent nevezett kiegészítőket hívd), az `ATADO.md`, a `tipusok.ts` (a lap
szerződése — ebből importálj: `import type { BeallitasokNezet, SajatBeallitas, ErtesitesSor, SajatFajta } from "../../ertesites/tipusok"` és
`import { ERTESITES_FAJTAK, RENDSZERGAZDA_FAJTA } from "../../ertesites/tipusok"`), a `kliens.tsx` (`hivas(url, modszer, torzs)` → `{ ok, statusz, torzs }`).
Minták a rendszerből: a fülsor a Fiókok lapon (`role="tablist"`, `role="tab"`, `aria-selected`) — osztályelőtag itt `km-be-`.

A GÉPEZET (készül párhuzamosan — a szerződés a `tipusok.ts`):
- a lap kiszolgálói komponense adja a `nezet: BeallitasokNezet`-et (lista + a fiók beállítása + rendszergazda-e + adatpolitika adatai) és a nyitó fület;
- `POST /api/ertesites/olvasott` `{ mind: true }` → 200 `{ lista: ErtesitesLista }` — a „Mind olvasottnak jelölöm";
- `PUT /api/ertesites/sajat` a TELJES `SajatBeallitas` → 200 `{ beallitas: SajatBeallitas }` — minden kapcsoló-váltás ezt hívja (optimista: előbb a state, hiba esetén vissza);
- egy sor megnyitása: `<a href={`/beallitasok/nyit/${sor.id}`}>` — a kiszolgáló jelöli olvasottnak, átvált a munkatérre, és a célra visz. A sor egésze a link.

A KOMPONENSEK:
```ts
export function Beallitasok({ nezet, ful }: { nezet: BeallitasokNezet; ful: "ertesitesek" | "adatpolitika" })   // "use client"
export function Kapcsolo({ be, valt, letiltva, cimke }: { be: boolean; valt?: ((be: boolean) => void) | undefined; letiltva?: boolean | undefined; cimke: string })
```
- `Kapcsolo`: `<button type="button" role="switch" aria-checked={be} aria-label={cimke} disabled={letiltva}>` egy csúszkával; mérete `var(--kapcsolo-w)` × `var(--kapcsolo-h)`,
  a gomb `var(--on-primary)`, bekapcsolva `var(--grad-primary)`/`var(--primary)`, kikapcsolva `var(--field-bg)` + `var(--field-border)`; **letiltva**: halványabb, kerete
  `var(--keszul-border)`, kurzor `not-allowed`. Fókusz: `var(--focus-ring)`. Átmenet `var(--dur-fast)`.
- **Fejléc**: `beallitasok.cim` + `beallitasok.bevezeto` egy sorban (a rajz: a cím mellett a mondat halkabban); alatta a fülsor (`beallitasok.ful_ertesitesek`,
  `beallitasok.ful_adatpolitika`). A fül váltása kliensoldali state + `history.replaceState` a `?ful=adatpolitika` címre (a nyitó fület a prop adja).
- **Értesítések fül** (01/02/05):
  - „Mi történt" kártya: `ertesites.lista_cim` + `ertesites.lista_szam` `{n, m}`; jobbra a `ertesites.mind_olvasott` gomb — **CSAK ha `lista.osszes > 0` ÉS `lista.olvasatlan > 0`**
    (üres listán nem jelenik meg — nem letiltva, egyáltalán nem). A sorok: olvasatlanon tömör pont (`var(--olvasatlan)`) + teli `var(--text)`; olvasotton nincs pont, a szöveg
    `var(--text-dim)` (nem opacitással!). A sor szövege `t(\`ertesites.esemeny_${sor.fajta}\`, sor.ertekek)`; alatta `ertesites.sor_hol` `{ munkater, cel }` — `munkater` = `sor.munkater?.nev ?? t("ertesites.sor_rendszer")`,
    `cel` = `t(\`ertesites.cel_${sor.cel}\`)`; jobbra az idő `var(--font-code-active)`-ban, formátum a rajz szerint `MM-dd HH:mm` — `Intl.DateTimeFormat(nyelv, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Bucharest" })`
    (a `timeZone` KÖTELEZŐ, a kiszolgáló UTC-ben fut — nélküle hidratálási hiba). Üres lista: `ertesites.ures_cim` + `ertesites.ures_szoveg` középre, a kártyában.
  - Két blokk egymás mellett (telefonon egymás alatt): **„Miről szóljon"** (`ertesites.esemenyek_cim`, `_megj`) — az `ERTESITES_FAJTAK` öt sora: `ertesites.kapcs_<fajta>` cím +
    `ertesites.kapcs_<fajta>_megj` + `Kapcsolo` (`nezet.beallitas.esemenyek[fajta]`); **a rendszergazdai doboz** (`ertesites.rendszergazda_cim` + `ertesites.rendszergazda_jelveny` jelvény,
    a `RENDSZERGAZDA_FAJTA` sora) **CSAK `nezet.rendszergazda` esetén** — különben a doboz nincs ott (nem szürkén). **„Hogyan szóljon"** (`ertesites.csatorna_cim`, `_megj`): három
    csatorna-kártya — `csatorna_feluleten` (+ `_megj`, `Kapcsolo` a `beallitas.feluleten`-re, a kártya kiemelt `var(--accent-tint-weak)` alappal, ha be); `csatorna_email` és
    `csatorna_telefon`: a **„még nem működik" jelölés** — szaggatott keret `var(--keszul-border)`, alap `var(--keszul-bg)`, a cím mellett `jelzes.meg_nem_mukodik` jelvény
    (`var(--keszul)` szöveg és keret), alatta a miért (`csatorna_email_miert` / `csatorna_telefon_miert`), a `Kapcsolo` `be={false} letiltva`. A jelölés SOHA nem áll mondat nélkül.
  - A kapcsoló-figyelmeztető jegyzet a rajzon (`rajz.*`) NEM kerül a felületre.
- **Adatpolitika fül** (03/04/06): cím `adatpolitika.cim` + `adatpolitika.bevezeto`; **három adatút-sor** (szám · `ut<n>_mi` · `ut<n>_megj` · `ut<n>_kihez` · jelvény): az 1. jelvénye
  `adatpolitika.nem_visz` (`var(--ok)`), a **2. sor kiemelt** — `var(--err)` keret, nagyobb betű (`var(--fs-md)`), `adatpolitika.visz` jelvény `var(--err)`-rel; a 3. `adatpolitika.visz_latogato`
  (`var(--accent-text)`). Alatta két doboz: **a szolgáltató doboza** (`szolgaltato_cim`; a név `nezet.adatpolitika.szolgaltato.nev` ADAT, mellette `felho_jelveny` vagy
  `hazon_belul_jelveny` a `hol` szerint; `orszag_cimke` → `t(nezet.adatpolitika.szolgaltato.orszag_kulcs)`; `meres_cimke` → `nezet.adatpolitika.meres_datum`; `szolgaltato_mit_jelent`;
  **nincs benne semmi kattintható**) és **a felhő-kapcsoló doboza** — **CSAK ha `nezet.adatpolitika.felho_kapcsolo_latszik`** (különben a doboz nincs ott, és a lap alján `adatpolitika.nezo_megj`
  áll): „még nem működik" jelölés (mint a csatornáknál), `kapcsolo_cim`, `kapcsolo_miert`, `kapcsolo_mit_fog_cim` + a három mondat (`_1`, `_2`, `_3`), a `Kapcsolo` `be={false} letiltva`.
  Lábrész: `adatpolitika.naplo_mondat`; `adatpolitika.tajekoztato_link` mint `<a href="/adatkezeles">` + mellette `adatpolitika.tajekoztato_jelzes` jelvény (a „készül" jelölés nyelvén).
- **Telefon** (`max-width: 640px`, 05/06): egy oszlop; a lista sorában az idő a szöveg alá kerül; a kapcsolók a sor jobb szélén maradnak.
- Minden szöveg `t()`-ből (`useFeliratok()` → `{ t, nyelv }`; `t(kulcs, ertekek?)` — KÉT argumentum legfeljebb); adat: a szolgáltató neve, a dátum, a számok. Osztályelőtag `km-be-` (a kapcsolóé `km-kapcsolo`).
  CSS csak tokenekkel; minden térköz `var(--ter-N)`; pixel-térköz és puszta `0` tilos (`var(--ter-0)`); lekerekítés `var(--r-*)`; szín csak `var(--…)`.

HATÁR: a négy fájl. A `page.tsx`, a sáv, a `tipusok.ts`, a végpontok: NEM nyúlsz. TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — az opcionális
propok típusa `| undefined`; `verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`. Beégetett szín/betű/méret/lekerekítés TILOS.
KÉSZ, HA: `pnpm --filter web tipus` zöld, tokenőr zöld; a lap a hat artboard állapotát adja.
Visszaadás: a négy fájl teljes tartalommal, külön `=== FÁJL: <út> ===` blokkban. Semmi más szöveg.
