# F-3 · Építő — a hozzáférés-modul bekötése a webalkalmazásba (`apps/web`)

CÉL: a `@km/hozzaferes-core` (a mellékelt SZERZŐDÉS szerint; a csomagot párhuzamosan más írja — te a szerződésre építs, a bejárata
`import { … } from "@km/hozzaferes-core"`) a webalkalmazásban él: új `meghivo` tábla migrációval, a portok Postgres-megvalósítása,
és hét API-végpont a közös kapun át. Képernyő NINCS (a rajz még hiányzik) — csak gépezet.

FORRÁS: a szerződés; a minták: `apps/web/app/api/tema/route.ts` + `_kozos.ts` (végpont-stílus, `kapu`, `hiba`, `valasz`),
`apps/web/adatbazis/sema.ts` (a `tagsag`, `fiok`, `jelszo_visszaallitas` táblák — a meghívó a `jelszo_visszaallitas` mintájára tárol
lenyomatot), `apps/web/adatbazis/migraciok/0043_jogosultsag.sql` (migráció-stílus), `apps/web/tema/tar.ts` (tár-stílus,
`szervezetKent`), `apps/web/app/api/_kapu.ts` (a hat szint).

MIT CSINÁLJ:
1. `apps/web/adatbazis/sema.ts` — ÚJ tábla `meghivo`: id uuid pk default random; szervezet_id uuid → szervezet (cascade); szerep
   (a meglévő `szerep` enum); email text null; lenyomat text not null unique; letrehozta uuid → fiok; letrehozva timestamptz default now;
   lejar timestamptz not null; allapot text not null default 'kiadott' (kiadott|elfogadott|visszavont); elfogadta uuid null;
   elfogadva timestamptz null; visszavonva timestamptz null. Index a szervezet_id-re. Sorszintű védelem a `tagsag` mintájára
   (`szervezet_id = ${aktualisSzervezet}`) — DE a lenyomat szerinti keresés munkatér nélkül fut (elfogadásnál még nincs szervezet):
   erre egy `SECURITY DEFINER` függvény kell a migrációban: `meghivo_lenyomat_szerint(text) RETURNS SETOF meghivo`, a `km_app` futtathatja.
2. `apps/web/adatbazis/migraciok/0045_meghivo.sql` — a tábla, az index, a védelmi szabály, a függvény, ÉS a hibakódok feliratai három
   nyelven (`hozzaferes.hiba_nincs_jog`, `…_nagyobb_szerep`, `…_utolso_tulajdonos`, `…_magat_nem`, `…_mar_tag`, `…_nincs_ilyen_tag`,
   `…_nincs_ilyen_meghivo`, `…_meghivo_lejart`, `…_meghivo_felhasznalva`, `…_meghivo_visszavonva`) rövid, emberi mondatokkal
   (hu eredeti; ro, en fordítás), `ON CONFLICT DO UPDATE`.
3. `apps/web/hozzaferes/tar.ts` — a `TagsagTar` és `MeghivoTar` Postgres-megvalósítása (`szervezetKent` alatt, drizzle); a
   `lenyomatSzerint` a SECURITY DEFINER függvényt hívja (`sql\`select * from meghivo_lenyomat_szerint(${lenyomat})\``, a `db()`-vel).
   `apps/web/hozzaferes/index.ts` — a `Kornyezet` összeállítása: `ora: { most: () => new Date().toISOString() }`,
   `azonosito: { uj: randomUUID, jegy: () => randomBytes(32).toString("base64url"), lenyomat: (j) => createHash("sha256").update(j).digest("hex") }`,
   `esemeny`: `console.log("[hozzaferes]", JSON.stringify(e))` (a napló-modul később), és egy `hozzaferesKornyezet()` függvény.
   A `HostKontextus` a kapu eredményéből: `{ fiok_id: fiok.id, szervezet_id: szervezet.id, szerep }`.
4. Végpontok (`apps/web/app/api/...`, mindegyik a `kapu()`-val, `export const dynamic = "force-dynamic"`, a hibakód → HTTP a szerződés
   6. pontja szerint, a hibaválasz `{ hiba: <kód> }`, a siker `{ hozzaferes: <érték> }`):
   - `GET  tagok/route.ts` — szint `tag` → `tagokLista`.
   - `POST tagok/meghivo/route.ts` — szint `szerkeszto`; törzs `{ szerep, email? }` (zod); → `meghiv`; a válasz `{ hozzaferes: { meghivo, jegy, link } }`,
     ahol `link` = `/meghivo/<jegy>` (a lap később épül). A jegy EGYSZER jön vissza.
   - `GET  tagok/meghivo/route.ts` — szint `szerkeszto` → `meghivoLista`.
   - `DELETE tagok/meghivo/[id]/route.ts` — szint `szerkeszto` → `meghivoVisszavon`.
   - `POST meghivo/elfogad/route.ts` — szint `belepett`; törzs `{ jegy }` → `meghivoElfogad(k, { fiok_id }, jegy)`.
   - `PUT  tagok/[fiokId]/route.ts` — szint `tulajdonos`; törzs `{ szerep }` → `szerepAllit`.
   - `DELETE tagok/[fiokId]/route.ts` — szint `tulajdonos` → `tagEltavolit`.
   - `POST tagok/kilep/route.ts` — szint `tag` → `kilep`.
   Ha a `kapu()` szerepe és a modul `Szerep`-e ugyanazok a szavak: a fordítás egy típus-átvitel (`ktx.szerep as Szerep`), írd ki megjegyzésben, hogy ez a befogadó fordítása.
5. `apps/web/probak/jogosultsag.proba.ts` — a `VEGPONTOK` mátrixba a hét módosító végpont sora a szintjével és egy sémán átmenő törzzsel
   (pl. `{ szerep: "nezo" }`; `{ jegy: "nincsilyen" }`); az `[id]`/`[fiokId]` helyére `00000000-0000-4000-8000-000000000000`.
   Csak a listát bővíted, mást nem változtatsz a fájlban.
6. `apps/web/package.json` — dependency `"@km/hozzaferes-core": "workspace:*"`.

HATÁR: az itt felsorolt fájlok. A `packages/` mappához, a `_kapu.ts`-hez, a meglévő végpontokhoz NEM nyúlsz.
KÉSZ, HA: `pnpm --filter web tipus` zöld; a migráció lefut; a jogosultsági mátrix minden új végpontot ismer.
TILOS: közvetlen SQL a `meghivo` táblára a `szervezetKent` nélkül (kivéve a SECURITY DEFINER függvényhívás); a jegy tárolása;
a jegy naplózása; halott felület.
Visszaadás: minden fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban. A `sema.ts`-ből és a `jogosultsag.proba.ts`-ből NE a teljes
fájlt add vissza, hanem `=== FÁJL: apps/web/adatbazis/sema.meghivo.RESZLET.ts ===` blokkban a beszúrandó táblát (import-igényekkel), és
`=== FÁJL: apps/web/probak/jogosultsag.VEGPONTOK.RESZLET.ts ===` blokkban a beszúrandó sorokat.
