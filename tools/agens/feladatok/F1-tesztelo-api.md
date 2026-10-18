# F-1 · Tesztelő — élő próbák a térköz-skálára a Theme API-n (`apps/web/probak/tema-terkoz.proba.ts`)

CÉL: egy új próbafájl bizonyítja az élő rendszer ellen, hogy a térköz-skála a Theme API-ban él, és a szabályai érvényesülnek.

FORRÁS: a mellékelt `segedek.ts` (a próbák közös segédei: `keres`, `veletlenEmail`, `takaritas`, `lezar`) és a `tema.proba.ts`
eleje (így hozunk létre fiókot és szervezetet, így hívjuk az API-t; a válasz `{ tema }` burokban jön). Ugyanezt a mintát kövesd:
regisztráció `POST /api/fiok/regisztracio` {nev,email,jelszo} → 201; belépés `POST /api/fiok/belepes` → 200, a sütik a
`belepes.sutik.join("; ")`; szervezet `POST /api/szervezet` {nev} → 201 (aki létrehozza, tulajdonos).

AMIT A RENDSZER TUD (ez a szerződés, ezt méred):
- `GET /api/tema` (sütivel) → 200, `tema.alap` egy teljes tokenkészlet, amelyben `--ter-0` … `--ter-14` mind szerepel
  (`--ter-0` = "0px", `--ter-4` = "8px", `--ter-14` = "80px"), és NEM szerepel `--pad-card`, `--gap`, `--btn-pad-x`.
  `tema.hatasos` ugyanígy.
- `PUT /api/tema` törzse `{ "$schema": "km-theme/2", "tokens": { …teljes készlet… } }` → 200 tervezet. A tervezet a
  `tema.tervezet.felulirasok`-ban csak az alaptól eltérő tokeneket tartalmazza.
- Ha a küldött készletben egy fok KISEBB egy előtte állónál (pl. `--ter-3: "20px"`, `--ter-4: "8px"`) → 400, a válasz törzsében
  `hiba: "ERVENYTELEN_ADAT"` és egy `tema_hibak` tömb, amelyben van `{ token: "--ter-4", kod: "notMonotonic" }` elem — és utána a
  `GET /api/tema` tervezete NEM változott (semmi nem íródott).
- `--ter-0: "4px"` → 400 (a `tema_hibak` közt a `--ter-0` token).
- `--ter-5: "30px"` (a tartományon kívül: max 24) → 400, `kod: "outOfRange"`.
- Egyenlő szomszédok (`--ter-3: "8px"`, `--ter-4: "8px"`) → 200.
- A régi `--pad-card` kulcs a küldött készletben NEM hiba: a válasz 200, a kulcs egyszerűen nem kerül a felülírások közé.
- `POST /api/tema/alkalmaz` → 200 után a `GET /api/tema` `hatasos["--ter-4"]` a beállított értéket adja (pl. "9px"), és a
  `GET /fiok` (sütivel) HTML-je tartalmazza a `--ter-4:9px` szöveget (a :root CSS-változó a lap fejében).
- Vendég (süti nélkül) `PUT /api/tema` → 401.

MIT CSINÁLJ: írd meg a fájlt `describe("terkoz-skala a Theme API-n (F-1)")` blokkal, `beforeAll` (fiók+szervezet), `afterAll`
(`takaritas()`, `lezar()`), 8–10 `it` esettel a fenti pontokra, a `keres` segéddel. A teljes készletet a `GET /api/tema` `alap`
mezőjéből vedd, és csak a vizsgált tokeneket írd át — ne találj ki készletet. Szigorú TypeScript (`noUncheckedIndexedAccess`
van): a válasz törzsét típusozd (`as { tema: { alap: Record<string,string>; hatasos: Record<string,string>; tervezet: { felulirasok: Record<string,string> } | null } }`).
A HTML-lekéréshez a `keres` segéd JSON-t vár — ahhoz használj közvetlen `fetch(PROBA_CIM + "/fiok", { headers: { cookie: sutik } })`-et
(`PROBA_CIM` a segedek.ts-ből importálható), és `await v.text()`-et.

HATÁR: csak ez az egy új fájl. Meglévő fájlhoz nem nyúlsz, segédet nem találsz ki (ami a `segedek.ts`-ben nincs, azt itt írd meg helyben).
KÉSZ, HA: `pnpm --filter web proba -- tema-terkoz` zöld a futó rendszer ellen (PROBA_CIM, DATABASE_URL beállítva).
TILOS: közvetlen SQL a témára (az API-n át mérünk); `any`; `console.log`.
Visszaadás: `=== FÁJL: apps/web/probak/tema-terkoz.proba.ts ===` blokkban, teljes tartalommal.
