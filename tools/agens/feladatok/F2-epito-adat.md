# F-2 · Építő — a kezdőképernyő és a Gépház adatforrása (`apps/web/kezdolap`), pénznem, munkatér-váltás

CÉL: a mellékelt SZERZŐDÉS (`docs/KEZDOLAP-SZERZODES.md`) 3., 4., 5., 6. pontja él a webalkalmazásban: egy `kezdolapNezet()` és egy
`gephazNezet()` a MEGLÉVŐ gépezetből összerakva (semmi új mérés, semmi új tábla a három tárolási tételen kívül), hat végpont, a
munkatér-váltás tárolt választása. Képernyőt NEM írsz — azt párhuzamosan más építi a `tipusok.ts`-re.

FORRÁS: a szerződés; `apps/web/kezdolap/tipusok.ts` (KÉSZ, hiteles — NEM módosítod); a mellékelt meglévő modulok
(`koltseg/index.ts`, `fiokok/index.ts`, `tema/index.ts`, `szovegek/index.ts`, `hirfigyelo/index.ts`, `profil/index.ts`,
`szervezet/reszletek.ts`, `hitelesites/index.ts`, `adatbazis/sema.ts` részletek), a végpont-minta (`app/api/beallitas/ai/route.ts`),
a kapu (`app/api/_kapu.ts`), a migráció-minta (`0048_esemeny_ertesites_ai.sql`).

MIT CSINÁLJ — a fájlok:

1. `apps/web/adatbazis/migraciok/0050_kezdolap_penznem.sql` — a szerződés 5. pontja SZÓ SZERINT: `szervezet.penznem`,
   `fiok.aktualis_szervezet_id`, az `arfolyam` tábla a négy kezdősorral (`ON CONFLICT DO NOTHING`), `GRANT SELECT, UPDATE ON "arfolyam" TO "km_app"`.
   Feliratokat NEM írsz (külön migráció készül). `IF NOT EXISTS` mindenhol.
2. `apps/web/adatbazis/sema.ts` — RÉSZLET: a `szervezet` táblába `penznem: text("penznem").notNull().default("EUR")`; a `fiok` táblába
   `aktualisSzervezetId: uuid("aktualis_szervezet_id")` (a hivatkozást a migráció adja; a sémában elég az oszlop); új `arfolyam` tábla
   (`penznem` text pk, `egyUsd` numeric("egy_usd", { precision: 12, scale: 6 }), `frissitve` timestamptz default now). Sorszintű
   védelem az `arfolyam`-on NINCS (közös, nem szervezeti adat).
3. `apps/web/kezdolap/index.ts` (`import "server-only"`):
   - `export async function arfolyamok(): Promise<Record<Penznem, number>>` — az `arfolyam` táblából `db()`-vel; ha egy sor hiányzik,
     USD 1, a többi a szerződés kezdőértéke.
   - `export function atszamit(usd: number, penznem: Penznem, arf: Record<Penznem, number>): Osszeg` — `ertek = Math.round(usd * arf[penznem] * 100) / 100`.
   - `export async function penznemAllit(szervezetId: string, penznem: Penznem): Promise<void>` — `szervezetKent` alatt `update szervezet`.
   - `export async function arfolyamAllit(penznem: Penznem, egyUsd: number): Promise<Record<Penznem, number>>`.
   - `export async function kezdolapNezet(fiok: FiokNezet, szervezet: { id: string; nev: string }, szerep: Szerep): Promise<KezdolapNezet>` —
     a szerződés 4. pontja szerint, MINDEN csempe külön `try/catch`-ben (`console.error("[kezdolap] <csempe>:", hiba)`), a hibás csempe a
     szerződés szerinti üres értéket kapja (`hirfigyelo: null`, `profil: null`, `forrasok` nullák, `koltseg` nullák a munkatér pénznemében,
     `tervezet: { tema: false, feliratok: false }`). A hírfigyelőhöz: `kornyezet(szervezet.id, fiok.nyelv ?? "hu")` + `hostKontextus(fiok, szervezet.id)` a
     `hirfigyelo/index.ts`-ből, majd `attekintes(k, ktx)` a `@km/news-monitor-core`-ból (`ok: false` és `hiba === "NINCS_BEALLITAS"` → `null`);
     a legutóbbi futáshoz és a forrásokhoz a `k.tar.futasok(szervezet.id)` / `k.tar.forrasok(szervezet.id)`; az időzónához
     `k.tar.verziok(szervezet.id)` + `aktivVerzio(...)` (`@km/news-monitor-core`), `?.beallitas.idozites.idozona ?? "Europe/Bucharest"`.
     A hónap: `honapVagyMost(null)` a `koltseg`-ből. A `Date` értékeket ISO stringgé alakítod.
   - `export async function gephazNezet(fiok: FiokNezet, szervezet: { id: string; nev: string }, szerep: Szerep): Promise<GephazNezet | null>` —
     `null`, ha nem tulajdonos és nem rendszergazda (a végpont ebből 403-at ad). Rendszergazdának a rendszergazda nézet a 4. pont szerint
     (a `fiokok.nezet(fiok.id, honap)` és a `gazdaNezet(honap)` hívással); tulajdonosnak a tulajdonos nézet, `koltseg: null`, `fiokok: null`.
   - `export function felsoSavAdat(fiok: FiokNezet, szervezet: { id: string; nev: string }, szerep: Szerep, ujTalalat: number): FelsoSavAdat` —
     `munkaterek` = `fiok.szervezetek` (id, nev, szerep as Szerep), `gephaz = szerep === "tulajdonos" || fiok.rendszergazda`,
     `gephaz_csempek = fiok.rendszergazda ? 4 : 2`.
   - Az `Osszeg`-ek a munkatér pénznemében (`szervezet.penznem` egy `select`-tel, `szervezetKent` alatt).
4. `apps/web/hitelesites/index.ts` — RÉSZLET: az `aktualisFiok()`-ban a `szervezetek` listát úgy rendezed, hogy a `fiok.aktualis_szervezet_id`
   szerinti szervezet legyen ELÖL (ha benne van a listában; ha nem, marad a mai sorrend). Ehhez a `fiokSor`-ból az `aktualisSzervezetId`
   oszlopot is olvasod. Új függvény: `export async function aktualisSzervezetValaszt(fiokId: string, szervezetId: string): Promise<boolean>` —
   ellenőrzi a `tagsag`-ot (`fiokKent` alatt), ha tag: `update fiok set aktualis_szervezet_id`, `true`; különben `false`.
   Add vissza a módosított függvények TELJES szövegét (nem a fájlt).
5. Végpontok (mindegyik `kapu()`, `export const dynamic = "force-dynamic"`, hibaválasz `{ hiba }`, siker a szerződés 3. pontja szerint):
   - `apps/web/app/api/kezdolap/route.ts` — `GET`, szint `tag`.
   - `apps/web/app/api/gephaz/route.ts` — `GET`, szint `belepett`; szervezet nélkül 409 `NINCS_SZERVEZET`; `gephazNezet()` `null` → 403 `NINCS_JOG`.
   - `apps/web/app/api/beallitas/penznem/route.ts` — `PUT`, szint `tulajdonos`; zod: `z.object({ penznem: z.enum(PENZNEMEK) })`; hibás → 400 `ERVENYTELEN_ADAT`.
   - `apps/web/app/api/beallitas/arfolyam/route.ts` — `GET` (belepett), `PUT` (rendszergazda; zod `{ penznem: z.enum(PENZNEMEK), egy_usd: z.number().positive().max(1000000) }`).
   - `apps/web/app/api/szervezet/valt/route.ts` — `POST`, szint `belepett`; zod `{ szervezet_id: z.uuid() }`; `aktualisSzervezetValaszt` `false` → 403 `NINCS_JOG`;
     siker: `{ szervezet: { id, nev } }` (a név a `fiok.szervezetek`-ből).
6. `apps/web/probak/jogosultsag.proba.ts` — RÉSZLET: a `VEGPONTOK` mátrixba a három módosító végpont sora:
   `beallitas/penznem` PUT `tulajdonos` törzs `{ penznem: "EUR" }`; `beallitas/arfolyam` PUT `rendszergazda` törzs `{ penznem: "EUR", egy_usd: 0.92 }`;
   `szervezet/valt` POST `belepett` törzs `{ szervezet_id: "00000000-0000-4000-8000-000000000000" }`. Csak a sorokat adod.

HATÁR: az itt felsorolt fájlok. A `tipusok.ts`-hez, a `_kapu.ts`-hez, a `packages/` mappához, a meglévő végpontokhoz NEM nyúlsz.
FIGYELEM (korábbi ágens-hibák, D-F17): a `db().execute()` / `tx.execute()` eredménye `{ rows }` objektum, NEM tömb; a Next 16-ban a route
`params` ígéret (`await ctx.params`); a `tagsag` táblán `letrehozva` az oszlop, `csatlakozott` NINCS; a sorszintű védelem beállítása
`app.szervezet_id` (a `szervezetKent` állítja). TypeScript szigorú: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax` (típus-import `import type`). Relatív importban NINCS `.js` végződés.
KÉSZ, HA: `pnpm --filter web tipus` zöld; a migráció lefut; a mátrix a három végpontot ismeri.
TILOS: élő árfolyam-lekérés; új mérés a csempékhez (minden a létező gépezetből); a hírfigyelő csempére indítógomb-gépezet.
Visszaadás: minden fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban; a részletek `=== FÁJL: apps/web/adatbazis/sema.RESZLET.ts ===`,
`=== FÁJL: apps/web/hitelesites/index.RESZLET.ts ===`, `=== FÁJL: apps/web/probak/jogosultsag.VEGPONTOK.RESZLET.ts ===` néven.
