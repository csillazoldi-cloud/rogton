# F-4b · Építő — a Saját fiók lap adatforrása (`apps/web/sajatfiok/index.ts`) és a kilépés végpontjának kiegészítése (`apps/web/app/api/tagok/kilep/route.ts`)

CÉL: az R-3 v2 rajz lapja a kiszolgálótól egy `SajatFiokNezet`-et kap (szerződés: `apps/web/sajatfiok/tipusok.ts` — melléklet, abból importálsz, nem írsz bele);
és a `POST /api/tagok/kilep` mostantól bármelyik saját munkatérből ki tud léptetni (nem csak az aktuálisból), és megmondja, melyik munkatér lett az aktuális.
Minta a stílusra: `apps/web/tagok/index.ts` és `apps/web/ertesites/index.ts` (mellékletek) — így épül itt egy lap adatforrása.

A FIÓK: `FiokNezet` (`import type { FiokNezet } from "@km/contracts"`): `{ id, nev, email, rendszergazda, nyelv, szervezetek: { id, nev, szerep }[] }`.

1. `apps/web/sajatfiok/index.ts` (`import "server-only"`; `export * from "./tipusok"`):
```ts
export async function sajatFiokNezet(fiok: FiokNezet, aktualisSzervezetId: string | null): Promise<SajatFiokNezet>
```
- `fiok`: a FiokNezet mezői.
- `utolso_belepes`: `sema.fiok.utolsoBelepes` (timestamptz | null) a fiók sorából — `db().select({ u: sema.fiok.utolsoBelepes }).from(sema.fiok).where(eq(sema.fiok.id, fiok.id))`; ISO vagy null.
- `belepesek`: a `sema.belepesiKiserlet` tábla (`fajta` text, `email` text|null, `cim` text, `sikeres` boolean, `ido` timestamptz): `WHERE fajta = 'belepes' AND email = <a fiók e-mailje kisbetűsen> AND ido > now() - 30 nap`
  `ORDER BY ido DESC LIMIT 3` → `{ ido: ISO, cim, sikeres }`. `db()`-vel (nincs RLS a táblán).
- `megorzes_nap`: `import { NAPLO_MEGORZES_NAP } from "../hitelesites/korlat"` (30).
- `munkaterek`: `fiok.szervezetek` sorai `{ id, nev, szerep, aktualis: id === aktualisSzervezetId, utolso_tulajdonos }` — `utolso_tulajdonos` = a fiók szerepe `tulajdonos` ÉS a munkatérben a tulajdonosok
  száma 1. A tulajdonosok számát a `sema.tagsag` táblából (`szervezetId`, `fiokId`, `szerep` — NÉZD MEG a `sema.ts`-ben a pontos oszlopneveket, melléklet a részlet) `szervezetKent(sz.id, tx => …)` alatt
  számold (`count(*)` ahol `szerep = 'tulajdonos'`). Egyetlen lekérdezés munkaterenként; hiba → `utolso_tulajdonos: false` és `console.error`.
- `ertesites_olvasatlan`: `import { olvasatlanSzam } from "../ertesites"` → `await olvasatlanSzam(fiok)`.

2. `apps/web/app/api/tagok/kilep/route.ts` — a mai fájl (melléklet) kiegészítése:
- a törzs OPCIONÁLIS: `{ szervezet_id?: uuid }` (zod: `z.object({ szervezet_id: z.uuid().optional() })`, üres/hiányzó törzs is jó → az aktuális munkatér).
- ha `szervezet_id` van és ≠ `ktx.szervezet.id`: a fiók tagja-e (`ktx.fiok.szervezetek.find(...)`) — ha nem → 403 `{ hiba: "NINCS_JOG" }`; ha igen → a `kilep()` HostKontextusa AZ a munkatér és AZ ott érvényes szerep
  (`szerepFordit(tagsag.szerep)`).
- a `kilep()` hibái, mint ma (`UTOLSO_TULAJDONOS` → 409).
- siker után: ha a kilépett munkatér az aktuális volt (`ktx.szervezet.id`) → a maradék munkaterek közül az első (`ktx.fiok.szervezetek` a kilépett nélkül) legyen az aktuális:
  `import { aktualisSzervezetValaszt } from "../../../../hitelesites"` → `await aktualisSzervezetValaszt(ktx.fiok.id, kovetkezo.id)`; ha nem maradt → semmi. A válasz: `valasz({ hozzaferes: e.ertek, kovetkezo_szervezet_id })`
  ahol `kovetkezo_szervezet_id` = a beállított munkatér azonosítója, VAGY ha nem az aktuálisból lépett ki, az aktuális marad (`ktx.szervezet.id`), VAGY null, ha nem maradt munkatér. (Szerződés: `KilepValasz`.)
- `kapu(keres, "tag")` marad (belépett, van munkatere).

HATÁR: a két fájl. A `tipusok.ts`, a `sema.ts`, a hozzaferes-core: NEM nyúlsz. TypeScript szigorú (`noUncheckedIndexedAccess` → tömb-index `| undefined`; `exactOptionalPropertyTypes`;
`verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`. Drizzle: `eq, and, gt, desc, sql` a `drizzle-orm`-ból.
KÉSZ, HA: `pnpm --filter web tipus` zöld.
Visszaadás: a két fájl teljes tartalommal, külön `=== FÁJL: <út> ===` blokkban. Semmi más szöveg.
