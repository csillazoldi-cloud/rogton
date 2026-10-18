# F-7b · Építő — a Kimenő értesítések lapja (`apps/web/app/gephaz/kimeno/Kimeno.tsx` + `kimeno.css`) az R-5 rajz 03., 04. és 07/B artboardja szerint

CÉL: egy kliens-komponens, ami a Gépház alá tartozó `/gephaz/kimeno` lap törzsét adja: a kimenő csatorna állapota, a 25 eseményfajta öt csoportban, tulajdonosnál
háromállású választó (örökli · kimenő · nincs) + „Közös alap" és „Ami érvényes" oszlop, rendszergazdánál a közös alap kapcsolói, mentés gomb az állapotával,
lábjegyzet a Beállítások lapra. A felső sávot és a lapkeretet MÁS rakja rá — te a `<main>` tartalmát írod. Két fájl.

FORRÁS: a rajz HTML-je (hiteles szöveg, szerkezet, tokennevek), a `feliratok.json` (`kimeno.*` kulcsok — CSAK ezeket és a lent nevezetteket hívd), az `ATADO.md`,
`adatkotes.md`, a `tipusok.ts` (a lap szerződése: `import type { KimenoNezet } from "../../../kimeno/tipusok"`), a `kliens.tsx` (`hivas(url, modszer, torzs)` → `{ ok, statusz, torzs }`),
a `Kapcsolo.tsx` (közös kapcsoló: `<Kapcsolo be valt cimke />`). Minta a lap stílusára: `Beallitasok.tsx` (melléklet) — t(), időformátum részekből, `km-` előtag.

A GÉPEZET (kész):
- a `nezet: KimenoNezet` propot a kiszolgáló adja: `{ nezet: "tulajdonos"|"rendszergazda", bekotve, kozos, szervezeti, hatasos, csoportok }` — `kozos`/`szervezeti` CSAK a felülírt fajtákat
  tartalmazza (`fajta → "kimeno" | "nincs"`), a `hatasos` mind a 25-öt; `csoportok`: `{ kod, fajtak[] }[]` a nézet szerint (a tulajdonosé 24 sor: a `belepesi_kiserletek` nincs benne).
- mentés tulajdonosnál: `hivas("/api/ertesites", "PUT", szervezeti)` — a törzs CSAK a felülírt fajták (`{ futas_hiba: "kimeno", keret_kimerult: "nincs" }`); az „örökli" állású sor KIMARAD a törzsből.
  → 200 `{ beallitas }`. Mentés rendszergazdánál: `hivas("/api/ertesites/kozos", "PUT", kozos)` — ugyanaz az alak (csak `kimeno`/`nincs`, az „örökli" itt nincs).
- a hatásos érték a felületen SZÁMOLT (a mentés előtt is lássa): tulajdonosnál `szervezeti[f] ?? kozos[f] ?? "nincs"`; rendszergazdánál `kozos[f] ?? "nincs"`.

A KOMPONENS:
```ts
export function Kimeno({ nezet }: { nezet: KimenoNezet })   // "use client"
```
- **Fejléc**: `kimeno.vissza` („← Gépház") hivatkozás `/gephaz`-ra; cím `kimeno.cim`; `kimeno.megj` alatta.
- **Csatorna-doboz**: `kimeno.bekotve` (`var(--ok)` pont) vagy `kimeno.nincs_bekotve` (`var(--text-dim)` pont, NEM hibaszín); alatta `kimeno.csatorna_megj`; rendszergazdánál plusz `kimeno.kozos_megj`.
- **Táblázat**: fejléc `kimeno.fejlec_esemeny` · `kimeno.fejlec_alap` · (tulajdonos) `kimeno.fejlec_munkater` · (tulajdonos) `kimeno.fejlec_hatasos`. Oszlopok `grid-template-columns: minmax(0, 1fr) minmax(8em, auto) …`
  — **fix px NEM** (a Theme betűmérete változhat; a rajz tokenek.md-je kéri). Csoportfej: `kimeno.csoport_<kod>` (`fiok`, `tagok`, `futas`, `beallitas`, `rendszer`). Sor: a fajta neve
  `t(\`esemeny.${fajta}_cim\`)` + alatta a belső név `var(--font-code-active)`-ban halkan (adat); **Közös alap** oszlop: `kimeno.alap_kimeno`/`kimeno.alap_nincs` (csak olvasható szöveg);
  **tulajdonos**: háromállású választó `role="radiogroup"` három `role="radio"` gombbal (`kimeno.orokli`, `kimeno.kimeno`, `kimeno.nincs`), a kiválasztott `var(--grad-primary)`/`var(--on-primary)`,
  a többi `var(--field-bg)`; billentyűvel a nyilak léptetik (a rajz kerdesek.md 7.); **Ami érvényes** oszlop: pont + `kimeno.hatasos_kimeno` (`var(--ok)`) / `kimeno.hatasos_nincs` (`var(--text-dim)`).
  **rendszergazda**: a „Közös alap" oszlop helyén `Kapcsolo` (be = kimenő), a másik két oszlop nincs.
- **Mentés**: `kimeno.mentes` gomb (`var(--grad-primary)`), mellette az állapot: mentés után `kimeno.mentve` `{ ido }` (idő `HH:mm`, részekből, `timeZone: "Europe/Bucharest"`), hiba: `kimeno.mentes_hiba`
  (`var(--err)`). A gomb csak akkor aktív, ha van változás a betöltött állapothoz képest.
- **Lábjegyzet** (csak tulajdonos): `kimeno.nem_ugyanaz` + `<a href="/beallitasok">` `nav.beallitasok` + „→".
- **Telefon** (`max-width: 640px`, 07/B): a csoportok **összecsukhatók** (a csoportfej `<button aria-expanded>`, alapból az első nyitva, a többi csukva; a fejben a csoport neve és hány sor); a soron a
  fajta neve fölött, a választó alatta teljes szélességben (`min-height: var(--control-min)` minden állás), a Közös alap és az Ami érvényes egy sorban a név alatt.
- Minden szöveg `t()`-ből (`useFeliratok()`; `t(kulcs, ertekek?)` — legfeljebb KÉT argumentum); adat: a fajta belső neve, az idő. Osztályelőtag `km-ki-`. CSS csak tokenekkel; minden térköz
  `var(--ter-N)`; pixel-térköz és puszta `0` tilos (`var(--ter-0)`); `border-radius: 50%` mellé `/* tokenőr: ok — kör */`; fix pixel-szélesség tilos az oszlopokon.

HATÁR: a két fájl. TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` → opcionális propok `| undefined`, `verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`.
KÉSZ, HA: `pnpm --filter web tipus` zöld, tokenőr zöld; a lap a 03., 04., 07/B artboard állapotát adja.
Visszaadás: a két fájl teljes tartalommal, külön `=== FÁJL: <út> ===` blokkban. Semmi más szöveg.
