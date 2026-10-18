# Feladat — TESZTELŐ (E-28): a referencia-host VÉGIGFUTÁS-próbája (a hordozhatóság bizonyítéka)

A hírfigyelő magja (`@km/news-monitor-core`) eddig egy hostban futott (Next + Postgres webalkalmazás). Most egy MÁSODIK host készül (`apps/referencia-host`):
sima Node, SQLite-tárolóval, saját ütemezővel, `profil.json`-ból vett profillal. A te dolgod BIZONYÍTANI, hogy UGYANAZ a mag ebben a hostban is végigviszi
a teljes folyamatot, és a találatok tényleg egy SQLite-fájlban maradnak.

Mellékletben: `MAG-API.md` (a mag hívható függvényei, az adattípusok és a referencia-host `kornyezetKeszit()`-jének szerződése), `bekotes.proba.ts`
(a `proba-host` MEGLÉVŐ próbája — a stílus mércéje: vitest, magyar leírások, `expect`).

## Amit készítesz: `apps/referencia-host/probak/referencia-host.proba.ts` (vitest)

Minden próba SAJÁT, ideiglenes SQLite-fájlon dolgozzon: `mkdtempSync(join(tmpdir(), "km-ref-"))`, az `afterEach`/`afterAll` `rmSync(..., { recursive: true, force: true })`-szel
takarítson, a hostot pedig `zar()`-ral zárja. A `kornyezetKeszit({ utvonal })`-t hívd — a benne lévő letöltő RÖGZÍTETT (beépített minta-cikkek), az AI a TESZT-csatlakozó,
tehát a próba determinisztikus, hálózat nélkül fut.

1. **Teljes folyamat egy második hostban.** `beallitasMent` (2 témával, `eredet: "kezi"`) → az `uj.verzio` 1; `forrasHozzaad("https://pelda.hu/feed", "kezi")` →
   `forrasEllenoriz` → az állapot `hasznalhato`; `figyelesFuttat(k, ktx, { proba: false })` → `futas.allapot` `kesz` (vagy `reszleges`, ha volt hibás forrás),
   `ujTalalatok.length > 0`; `attekintes` → a találatok száma egyezik, van legalább egy `kartya`.
2. **A találatok TÉNYLEG az SQLite-fájlban vannak.** A futás után `zar()`, majd a fájl ÚJRAMEGNYITÁSA egy második `kornyezetKeszit({ utvonal })`-lal (ugyanaz az
   útvonal): az `attekintes` ugyanannyi találatot ad, mint zárás előtt, és ugyanazokat az azonosítókat. Ezen felül nyisd meg a fájlt közvetlenül is
   (`new DatabaseSync(utvonal)`), és ellenőrizd, hogy a `talalat` táblában annyi sor van, ahány találat — ez a bizonyíték, hogy nem memóriában maradt.
3. **A dedup a második hostban is működik (A-10).** Ugyanaz a figyelés MÉGEGYSZER lefuttatva → `ujTalalatok.length === 0`, és az `attekintes` találatszáma
   VÁLTOZATLAN (ugyanaz a cikk nem kerül be kétszer).
4. **Beállítás nélkül nincs futás.** Friss (üres) hoston azonnal `figyelesFuttat` → `ok: false`, `hiba: "NINCS_BEALLITAS"`.
5. **Jogosultság a hostban is érvényes.** A `ktx` másolata `szerep: "nezo"`-vel → `beallitasMent` és `figyelesFuttat` `ok: false`, `hiba: "NINCS_JOG"`;
   az `attekintes` viszont sikeres (a néző nézhet).
6. **Verziózás és visszaállítás.** Második `beallitasMent` más témákkal → `uj.verzio` 2, az 1-es `allapot` `korabbi`; `verzioVisszaallit(k, ktx, 1)` → új, 3-as
   verzió `eredet: "visszaallitas"`, a tartalma az 1-esé.

## Szabályok

TypeScript 7 szigorú kapcsolókkal (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` — a tömbindexelés `T | undefined`, ezért `expect(x[0]).toBeDefined()` vagy
`if (!x[0]) throw new Error(...)` a használat előtt); a `Eredmeny<T>` MINDIG `ok`-vizsgálattal bontható (`if (!e.ok) throw new Error(e.hiba)` — vagy
`expect(e.ok).toBe(true); if (!e.ok) return;`). ESM: relatív import `.js` kiterjesztéssel (`from "../src/kornyezet.js"`). Magyar leírások az `it(...)`-ekben, magyar
megjegyzések. NINCS `any`, nincs `console.log`, nincs új npm-függőség, nincs hálózat és nincs időzítés-alapú várakozás (`setTimeout`-os „várjunk 2 mp-et” tilos).

NE találj ki nem létező függvényt vagy mezőt: csak azt hívd, ami a `MAG-API.md`-ben szerepel. Ha valami hiányzik a próbához, inkább hagyd ki azt az állítást,
és írd oda megjegyzésben, mi hiányzott.

A választ ADD VISSZA A FÁJLT TELJES EGÉSZÉBEN, ```ts blokkban, fölötte a fájl útvonalával.
