# F-3 · Építő — a hozzáférés-modul a MÁSODIK befogadóban (`apps/referencia-host`)

CÉL: a `@km/hozzaferes-core` (a mellékelt SZERZŐDÉS szerint; a csomagot párhuzamosan más írja — a bejárata `@km/hozzaferes-core`)
fut a referencia-hostban is: SQLite-tár a portokra, egy próba, ami végigjátssza a meghívás → elfogadás → szerep → eltávolítás
körét a hoston, és a kiszolgáló három JSON-útvonala. Ez a MODULSZABÁLY 10. pontjának bizonyítéka: „a modul fut a második
befogadóban is, és a két befogadó illesztő-fájljai közt nincs azonos fájl”.

FORRÁS: a szerződés; a minták: `apps/referencia-host/src/csatlakozok/sqlite-tar.ts` (SQLite-tár stílus: `node:sqlite`, `DatabaseSync`,
JSON-oszlop), `apps/referencia-host/src/kiszolgalo.ts` (a `node:http` kiszolgáló, `valaszJson`, `hibaKod`, útvonal-előtag),
`apps/referencia-host/src/kornyezet.ts`, `apps/referencia-host/package.json`.

MIT CSINÁLJ:
1. `apps/referencia-host/src/csatlakozok/sqlite-hozzaferes.ts` — `sqliteHozzaferes(utvonal: string): { tagsag: TagsagTar; meghivo: MeghivoTar; db: DatabaseSync; zar(): void }`
   két táblával: `tag(szervezet_id, fiok_id, szerep, csatlakozott, PRIMARY KEY(szervezet_id, fiok_id))` és
   `meghivo(id PRIMARY KEY, szervezet_id, lenyomat UNIQUE, adat TEXT /* a Meghivo JSON-ja */)`. A `lista` a szervezet meghívóit
   `letrehozva` szerint adja. `":memory:"` a próbákhoz.
2. `apps/referencia-host/src/csatlakozok/hozzaferes-kornyezet.ts` — `hozzaferesKornyezet(utvonal, esemeny?)`: a `Kornyezet`
   összeállítása: `ora.most = () => new Date().toISOString()`, `azonosito.uj = randomUUID`, `jegy = randomBytes(32).toString("base64url")`,
   `lenyomat = sha256 hex` (`node:crypto` — itt szabad, ez a befogadó), `esemeny` alapból a konzolra (`[hozzaferes]` előtaggal).
3. `apps/referencia-host/src/kiszolgalo.ts` — HÁROM új JSON-útvonal a meglévő minta szerint, a `HostKontextus`-t a kiszolgáló
   meglévő `ktx`-éből fordítva (`{ fiok_id: ktx.fiok_id, szervezet_id: ktx.szervezet_id, szerep: ktx.szerep }` — ugyanazok a szavak, de a
   modul saját típusa; írd ki megjegyzésben, hogy ez a befogadó fordítása):
   `GET /tagok` → `tagokLista`; `POST /tagok/meghivo` `{ szerep, email? }` → `meghiv` (a jegy a válaszban, egyszer);
   `POST /meghivo/elfogad` `{ jegy, fiok_id }` → `meghivoElfogad`. Írási útvonalak csak `irhatoBemutato()` mellett (mint a többi
   írás). A hibakód → HTTP a szerződés 6. pontja szerint (bővítsd a `hibaKod()`-ot az új kódokkal: 403/404/409/410/400).
   A `kiszolgalo()` paramétere kap egy opcionális `hozzaferes?: Kornyezet` mezőt; ha nincs, a három útvonal 404.
4. `apps/referencia-host/src/indit.ts` — a `kiszolgal` ágban a `hozzaferesKornyezet(<adatmappa>/hozzaferes.sqlite)` átadása.
5. `apps/referencia-host/probak/hozzaferes.proba.ts` — a modul a hoston: `:memory:` tár; A tulajdonos meghív egy szerkesztőt →
   a jegy beváltása B fiókkal → B tag `szerkeszto` szereppel → B nem hívhat meg tulajdonost (NAGYOBB_SZEREP) → A átállítja B-t nézőre →
   A nem léphet ki (UTOLSO_TULAJDONOS) → A eltávolítja B-t → a jegy másodszor MEGHIVO_FELHASZNALVA. Legalább 7 `expect`.
6. `apps/referencia-host/package.json` — `"@km/hozzaferes-core": "workspace:*"`.

HATÁR: csak az `apps/referencia-host/` mappa. A `packages/`-hez és az `apps/web`-hez NEM nyúlsz. A hírfigyelő útvonalai változatlanok.
KÉSZ, HA: `pnpm --filter @km/referencia-host proba` és `tipus` zöld; a határőr szabálya („a-masodik-host-nem-nyul-a-webalkalmazasba”) nem sérül.
TILOS: import az `apps/web`-ből; a mag belső fájljainak importja (csak a csomag neve); a jegy tárolása vagy naplózása; `any`.
Visszaadás: minden fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban (a `kiszolgalo.ts` és az `indit.ts` TELJES, módosított tartalma).
