# Feladat — TESZTELŐ (E-29b): a hírfigyelő futásának BIZTONSÁGI FÉKE

Egy valódi hibát mértünk a tesztoldalon: egy hírcsatorna cikkjei üres címmel és üres szöveggel érkeztek, ezért MINDEN cikkpár „gyanús” lett,
és a futás 496 AI-hívást indított 32 cikkre (27 perc). A letöltő hibája külön javítva; most a MAG kap két féket, és ezt kell próbákkal rögzíteni.

Mellékletben: `folyamat-reszlet.ts` (a `figyelesFuttat` mostani szövege), `futas.ts` (a futás állapotátmenetei), `MAG-API.md` (a hívható függvények),
`finomhangolas.proba.ts` (a stílus mércéje: vitest, magyar leírások, `memoriaTar`, csonk AI).

## Amit a mag mostantól tud (ezt kell bizonyítani)

1. **`HF_PAR_KORLAT` (60)** — egy futásban legfeljebb ennyi `hf_ugyanaz_az_esemeny` AI-hívás mehet ki. A korlát feletti gyanús párokra NEM kérdezünk;
   azok külön eseményben maradnak. A futás állapota ilyenkor `reszleges` (nem `kesz`).
2. **`hatarido?: Date`** — a `figyelesFuttat(k, ktx, { proba, hatarido })` harmadik paraméterének új, választható mezője. Ha a `k.most()` eléri a határidőt,
   a futás abbahagyja a további AI-kérdéseket (a párokat ÉS az értékelést is), de MENTI, amit addig elért, és `reszleges` állapottal fejezi be.
   A már elkészült találatok megmaradnak; a még nem értékeltek `fuggoben` maradnak.
3. **Cím nélküli cikk** nem kerül be: ha a letöltő üres című cikket ad, abból nem lesz kivonat és nem lesz találat.

## Amit készítesz: `packages/news-monitor-core/probak/futas-fek.proba.ts`

Építs olyan `Kornyezet`-et, amiben a letöltő EGY forrásból sok, EGYMÁSHOZ HASONLÓ cikket ad (hogy sok gyanús pár keletkezzen), az AI pedig
számlálós csonk: minden `hf_ugyanaz_az_esemeny` hívást számol és `{ ugyanaz: false, indok: "csonk" }`-ot ad, minden `hf_relevancia` hívást is számol és
érvényes választ ad (`fontossag`, `temacimke`, `miert`, `indoklas`, `osszefoglalo`). A tár `memoriaTar()`.

Sok gyanús párt úgy kapsz a legegyszerűbben, ha a cikkeknek AZONOS a szövegük (azonos ujjlenyomat → minden pár gyanús). 12 cikk = 66 pár.

Próbák:
1. **A pár-korlát fog**: 20 azonos szövegű cikk (190 pár) → az `hf_ugyanaz_az_esemeny` hívások száma PONTOSAN `HF_PAR_KORLAT`, nem több; a futás `reszleges`.
2. **Korlát alatt nincs változás**: 5 azonos szövegű cikk (10 pár) → 10 hívás, a futás `kesz` (a fék nem szól bele).
3. **A határidő fog**: `most` léptethető (egy `let ora` és `most: () => new Date(alap.getTime() + eltelt)`), és az AI-csonk MINDEN hívásnál léptet 1 percet;
   `hatarido` = a kezdet + 3 perc → legfeljebb 3-4 AI-hívás történik, a futás `reszleges`, és a lista, amit `attekintes` ad, nem üres (ami elkészült, megmaradt).
4. **Határidő nélkül a régi viselkedés**: ugyanaz a beállítás `hatarido` nélkül → minden pár lekérdeződik (a korlátig), a futás nem lesz a határidő miatt részleges.
5. **Cím nélküli cikk kimarad**: a letöltő 3 cikket ad, ebből egynek üres a címe (`""`) → az `attekintes` 2 találatot ad, és a kivonatok között nincs üres című.
6. **Az értékelés is megáll a határidőnél**: sok cikk + szűk határidő → van olyan találat, amelynek `ertekeles_allapot` értéke `fuggoben` marad, és a futás `reszleges`.

## Szabályok

TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), vitest, ESM: `from "../src/index"` (a mag próbái így importálnak, kiterjesztés nélkül).
Magyar `it(...)`-leírások, magyar megjegyzések. NINCS `any` (ha kell, `as` a mellékletben látható típusra), nincs `console.log`, nincs új npm-függőség, nincs hálózat.
Az `Eredmeny<T>`-t MINDIG `ok`-vizsgálattal bontsd. A `figyelesFuttat` MÁSODIK hívásához új szervezet kell, vagy előbb be kell fejeződnie az elsőnek (FUT_MAR).

Ne találj ki nem létező mezőt: csak azt hívd, ami a mellékletekben szerepel.

A választ ADD VISSZA A FÁJLT TELJES EGÉSZÉBEN, ```ts blokkban, fölötte a fájl útvonalával.
