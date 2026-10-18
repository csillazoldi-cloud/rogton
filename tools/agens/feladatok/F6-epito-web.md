# F-6 · Építő — a fájlfeltöltés bekötése a webalkalmazásba (`apps/web`), képernyő nélkül

CÉL: a `@km/fajl-core` (a mellékelt SZERZŐDÉS szerint; a csomagot párhuzamosan más írja — a bejárata `@km/fajl-core`) él a webalkalmazásban:
az `arculat_fajl` tábla (meta) + a fájlok egy mappában (`FAJL_MAPPA`), a portok megvalósítása, három végpont. Az `ArculatTervezet` kap egy
`logo_fajl_id` mezőt. Képernyő NINCS (a rajz hiányzik).

FORRÁS: a szerződés; minták: `apps/web/hozzaferes/tar.ts` + `index.ts` (tár/környezet), `apps/web/app/api/tagok/route.ts` (végpont, `kapu`),
`sema.ts` RÉSZLET (a `meghivo` tábla mintája), `0045_meghivo.sql` (migráció, RLS), `packages/contracts/src/index.ts` RÉSZLET (`ArculatTervezet`).

MIT CSINÁLJ:
1. `sema.ts` RÉSZLET (`=== FÁJL: apps/web/adatbazis/sema.arculat_fajl.RESZLET.ts ===`): `arculat_fajl` (id uuid pk; szervezet_id → szervezet cascade; nev text;
   tipus text; meret integer; cel text; feltoltotte uuid → fiok set null; feltoltve timestamptz) RLS a szervezetre, index a szervezetre.
2. `migraciok/0049_arculat_fajl.sql` — a tábla, RLS, GRANT; a feliratok 3 nyelven a szerződés 6. pontja szerint (`fajl.hiba_*`) + `fajl.feltoltve_ok`
   („A fájl feltöltve: {nev}.”).
3. `apps/web/fajl/tar.ts` — `FajlTar`: a meta Postgresben (`szervezetKent`), a bájtok a lemezen: `FAJL_MAPPA` (env; alap `./adatok/fajlok`) alatt
   `<szervezet_id>/<id>.<KITERJESZTES[tipus]>` — `mkdir -p`, atomi írás (ideiglenes név, majd `rename`), olvasás `readFile`; ha a fájl hiányzik a lemezről,
   `olvas` → null. `apps/web/fajl/index.ts` — `fajlKornyezet()`: ora, azonosito (`randomUUID`), esemény: `console.log("[fajl]", …)` (később a napló).
4. Végpontok (`kapu`, `dynamic`, siker `{ fajl: … }`, hiba `{ hiba }`, a HTTP a szerződés 6. pontja szerint):
   - `POST apps/web/app/api/arculat/fajl/route.ts` — szint `szerkeszto`; a törzs a NYERS fájl (`await keres.arrayBuffer()` → `new Uint8Array`), a név a
     `x-fajl-nev` fejlécből (URL-dekódolva, alap "fajl"), a cél a `x-fajl-cel` fejlécből (`FajlCel`, alap "dokumentum"); a `content-length` > MAX → 413 azonnal;
     → `feltolt()`; siker 201 `{ fajl: meta }`.
   - `GET apps/web/app/api/arculat/fajl/route.ts` — szint `tag`; `?cel=` → `fajlLista()`.
   - `GET apps/web/app/api/arculat/fajl/[id]/route.ts` — szint `tag`; `ctx: { params: Promise<{ id: string }> }` (Next 16!) → `fajlOlvas()`; a válasz a bájtok
     `content-type: MIME[tipus]`, `content-disposition: inline; filename="<nev>"`, `cache-control: private, max-age=0`.
5. `packages/contracts/src/index.RESZLET.ts` — az `ArculatTervezet` új mezője: `logo_fajl_id: z.uuid().nullable().default(null)` (a hely megjelölésével);
   a `HibaKod` bővül: `SVG_NEM_ENGEDETT`, `TIPUS_NEM_ENGEDETT`, `TUL_NAGY`, `URES`, `NINCS_ILYEN_FAJL`.
6. `apps/web/probak/jogosultsag.VEGPONTOK.RESZLET.ts` — a POST sora (`fajl`, szint `szerkeszto`, törzs: nincs — a mátrix üres törzzsel hívja, az URES/400 nem
   jog-elutasítás, tehát jó).
7. `apps/web/package.json` — dependency `@km/fajl-core`.

HATÁR: az itt felsorolt fájlok. A `packages/fajl-core`-hoz nem nyúlsz. KÉSZ, HA: `pnpm --filter web tipus` zöld. TILOS: a fájlnév alapján dönteni a típusról;
a lemezre a szervezet mappáján kívül írni (az `id` és a `szervezet_id` uuid, a nevet nem használjuk útvonalként); `any`.
Visszaadás: az új fájlok teljes tartalommal; a meglévők RESZLET-blokkokban.
