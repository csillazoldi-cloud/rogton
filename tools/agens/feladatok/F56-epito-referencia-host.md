# F-5 + F-6 · Építő — az eseménynapló- és a fájl-modul a MÁSODIK befogadóban (`apps/referencia-host`)

CÉL: a `@km/esemeny-core` és a `@km/fajl-core` (a két mellékelt SZERZŐDÉS szerint; a csomagok KÉSZEK, a bejáratuk a csomag neve) fut a
referencia-hostban is: SQLite-tár a portokra, egy-egy próba a teljes körrel, és a kiszolgáló útvonalai. Ez a MODULSZABÁLY 10. pontja.

FORRÁS: a két szerződés; a minták: `apps/referencia-host/src/csatlakozok/sqlite-hozzaferes.ts` és `hozzaferes-kornyezet.ts` (így épült az
előző modul befogadása), `apps/referencia-host/probak/hozzaferes.proba.ts`, `apps/referencia-host/src/kiszolgalo.ts` (az útvonalak stílusa,
`hozzaferes?` opcionális környezet — ugyanígy jöjjön az `esemeny?` és a `fajl?`), `apps/referencia-host/src/indit.ts`, `package.json`.

MIT CSINÁLJ:
1. `src/csatlakozok/sqlite-esemeny.ts` — `sqliteEsemeny(utvonal)`: `EsemenyTar` (tábla `esemeny(id PK, szervezet_id NULL, fajta, sulyossag, fiok_id, ido, adat TEXT JSON)`,
   `lista` legújabb elöl, limit; `rendszerLista` a NULL szervezetűek) és `ErtesitesTar` (tábla `ertesites(szint, szervezet_id, adat TEXT JSON, PRIMARY KEY(szint, szervezet_id))`
   — a közösnél `szervezet_id = ''` üres szöveg, mert a PK nem lehet NULL), `zar()`.
   `src/csatlakozok/esemeny-kornyezet.ts` — `esemenyKornyezet(utvonal, opciok?: { csatorna?: KimenoCsatorna; felirat?: Feliratozo })`: `Kornyezet & { zar(): void }`;
   ora ISO, azonosito `randomUUID`, csatorna alapból `{ kuld: async () => ({ ok: false, hiba: "NINCS_CSATORNA" }) }`, felirat alapból a kulcsot adja vissza.
2. `src/csatlakozok/sqlite-fajl.ts` — `sqliteFajl(utvonal)`: `FajlTar` — a meta táblában (`fajl(id PK, szervezet_id, nev, tipus, meret, cel, feltoltotte, feltoltve)`),
   a bájtok BLOB oszlopban ugyanabban a sorban (a bemutatóhoz elég; a webalkalmazás lemezre ír — ez a különbség pont a hordozhatóság bizonyítéka), `zar()`.
   `src/csatlakozok/fajl-kornyezet.ts` — `fajlKornyezet(utvonal)`: `Kornyezet & { zar(): void }`; esemény alapból a konzolra `[fajl]`.
3. `src/kiszolgalo.ts` — a `kiszolgalo()` paramétere kap `esemeny?: EsemenyKornyezet` és `fajl?: FajlKornyezet` mezőt; ÚJ útvonalak a meglévő minta szerint,
   a `HostKontextus` fordítása a hírfigyelő `ktx`-éből: `GET /esemenyek` → `naplo`; `GET /ertesites` → `ertesitesLekerdez`; `PUT /ertesites` (csak `irhatoBemutato()`) →
   `ertesitesSzervezetiMent`; `POST /fajl` (csak `irhatoBemutato()`; a törzs a nyers bájtok, a név az `x-fajl-nev`, a cél az `x-fajl-cel` fejlécből) → `feltolt`;
   `GET /fajl` → `fajlLista`; `GET /fajl/<id>` → `fajlOlvas` (a `MIME[tipus]` content-type-pal). A `hibaKod()` bővül a két modul kódjaival
   (SVG_NEM_ENGEDETT/TIPUS_NEM_ENGEDETT 415, TUL_NAGY 413, URES 400, NINCS_ILYEN_FAJL 404, ISMERETLEN_FAJTA 400). Ha a környezet nincs átadva, 404.
4. `src/indit.ts` — a `kiszolgal` ágban `esemenyKornyezet(<adatmappa>/esemeny.sqlite)` és `fajlKornyezet(<adatmappa>/fajl.sqlite)` átadása.
5. `probak/esemeny.proba.ts` — `:memory:`; a) alapból semmi nem megy ki (gyűjtő csatornával); b) `ertesitesSzervezetiMent` tulajdonosként `{ futas_hiba: "kimeno" }` → utána
   egy `futas_hiba` feljegyzés kimegy (a gyűjtőben 1 üzenet, a cím a feliratozóból); c) nézőként a mentés NINCS_JOG; d) `naplo` legújabb elöl; e) fiók-szintű (NULL) esemény
   a `rendszerLista`-ban, a szervezet `naplo`-jában nem. Legalább 6 `expect`.
   `probak/fajl.proba.ts` — `:memory:`; a) PNG-fejléc feltöltés szerkesztőként → meta a tárban, a bájtok visszaolvashatók; b) SVG szöveg (a neve "logo.png") → SVG_NEM_ENGEDETT;
   c) néző → NINCS_JOG; d) másik szervezetből NINCS_ILYEN_FAJL; e) `fajlLista` cél szerint. Legalább 6 `expect`.
6. `package.json` — `"@km/esemeny-core": "workspace:*"`, `"@km/fajl-core": "workspace:*"`.

HATÁR: csak az `apps/referencia-host/` mappa. A `packages/`-hez és az `apps/web`-hez NEM nyúlsz. A hírfigyelő és a hozzáférés útvonalai változatlanok.
KÉSZ, HA: `pnpm --filter @km/referencia-host proba` és `tipus` zöld; a határőr nem sérül. TILOS: import az `apps/web`-ből; a magok belső fájljainak importja;
`any`; `.js` kiterjesztés a relatív importokban NEM kell (a többi fájl sem használ).
Visszaadás: minden fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban (a `kiszolgalo.ts` és az `indit.ts` TELJES, módosított tartalma).
