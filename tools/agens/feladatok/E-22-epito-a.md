# Feladat — ÉPÍTŐ A (E-22): a Hírfigyelő háttérfutása — várólista az adatbázisban + futtató a webalkalmazásban (ÚJ DOBOZ NÉLKÜL)

Döntés (Vilmos, 2026-09-08): NEM Redis/BullMQ — a várólista egy Postgres-tábla, a futtató az alkalmazás saját folyamatában él
(Next `instrumentation.ts`), egyszerre EGY munka fut az egész rendszerben (a NAS-t nem terheljük, az AI-hívások sorban mennek).
Mellékelve: a szerződés (2.12), a mag `folyamat.ts` (a `figyelesFuttat`, `ertekelesUjra`, `attekintes`), `futas.ts` (`kovetkezoFutas`),
a webalkalmazás `hirfigyelo/index.ts` (`kornyezet`, `hostKontextus`), `hirfigyelo/tar.ts` (a tár — minta a drizzle-használatra),
`kapcsolat.ts` (`db`, `szervezetKent`), a `sema.ts` hf-részlete és a `ai_koltseg_honap` (host-szintű tábla, védelem nélkül — minta),
az API `futas/route.ts` + `_kozos.ts`, a `0027` migráció (minta), `next.config.ts`, `package.json` (web).

Készítsd el:
1. **Tábla** `hf_sor` a `sema.ts`-hez (add vissza `=== FÁJL: apps/web/adatbazis/sema-hf-sor.ts ===` néven CSAK az új táblát, én illesztem be):
   `id uuid PK default gen_random_uuid()`, `szervezet_id uuid NOT NULL → szervezet(id) cascade`, `fajta text` (`futas` | `ertekeles_ujra` | `napi`),
   `adat jsonb NOT NULL default '{}'` (pl. `{ "proba": true }`), `allapot text` (`var` | `fut` | `kesz` | `hiba`), `kiserlet integer default 0`,
   `letrehozva`, `kezdve` (null), `vege` (null), `hiba_ok text` (null), `eredmeny jsonb` (null — a kész futás azonosítója: `{ "futas_id": … }`).
   Ez HOST-szintű tábla (mint az `ai_koltseg_honap`): NINCS sorszintű védelem, a futtató minden szervezet sorát látja; index `(allapot, letrehozva)`.
   **Migráció** `apps/web/adatbazis/migraciok/0028_hirfigyelo_sor.sql` (kézzel, a 0027 mintája; GRANT a `km_app`-nak).
2. **`apps/web/hirfigyelo/sor.ts`** — a várólista műveletei (a `db()`-vel, NEM `szervezetKent`, mert host-szintű):
   - `sorbaTesz(szervezetId, fajta, adat) → { ok: true; sor: SorTetel } | { ok: false; hiba: "FUT_MAR" }` — ha a szervezetnek van `var`/`fut` tétele → `FUT_MAR`
     (dupla indítás tiltva a sorban is); különben beszúr.
   - `sorTetel(id)`, `szervezetSora(szervezetId)` (a legutóbbi 20).
   - `kovetkezoKivesz() → SorTetel | null` — EGY tétel: `UPDATE hf_sor SET allapot='fut', kezdve=now(), kiserlet=kiserlet+1 WHERE id = (SELECT id FROM hf_sor WHERE allapot='var' ORDER BY letrehozva LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`
     (drizzle `sql` nyers lekérdezéssel); csak akkor, ha NINCS `fut` állapotú tétel sehol (egyszerre egy — `SELECT count(*) … WHERE allapot='fut'`).
   - `lezar(id, eredmeny)` / `hibara(id, ok)`; `beragadtakElenged(most)` — a 15 percnél régebb óta `fut` tételek → `hiba` („idotullepes”; a hozzá tartozó
     `hf_futas` `fut` sorát is `hiba`-ra, `veg=now()`), hogy egy elszállt folyamat ne fogja meg a sort örökre.
3. **`apps/web/hirfigyelo/futtato.ts`** — a futtató: `export function futtatoIndit(): () => void` — 5 másodpercenként (`setInterval`) egy `tick`:
   (a) `beragadtakElenged`; (b) **napi ütemezés** percenként egyszer: minden szervezet, amelynek van aktív beállítása `idozites.mod === "napi"`:
   `kovetkezoFutas(idozites, utolsoNapiFutasKezdete ?? (most − 24 óra))` — ha ≤ most ÉS ma (a zónában) még nem futott `napi` fajtájú → `sorbaTesz(…, "napi")`
   (a mag `esedekes()`-ével, lásd 5.); (c) `kovetkezoKivesz()` → ha van: `kornyezet(szervezetId)`, rendszer-kontextus (`{ fiok_id: RENDSZER_FIOK, szervezet_id, szerep: "tulajdonos" }` — a
   futtató a rendszer nevében fut, `RENDSZER_FIOK = "00000000-0000-4000-8000-000000000000"`), a fajta szerint `figyelesFuttat(k, ktx, { proba })` /
   `ertekelesUjra` → `lezar(id, { futas_id })` vagy `hibara`. Egy tick egy tételt visz; kivétel esetén naplóz (`console.error`), a sor nem áll le.
   Egypéldányosság: `globalThis.__kmHfFuttato` őr (a Next több csomagban is betöltheti — a globalThis-en egyszer indul); `HF_FUTTATO=0` esetén nem indul.
4. **`apps/web/instrumentation.ts`** — `export async function register()`: csak `process.env.NEXT_RUNTIME === "nodejs"` és nem build alatt
   (`process.env.NEXT_PHASE !== "phase-production-build"`) → dinamikus `await import("./hirfigyelo/futtato")` → `futtatoIndit()`. Ha a `next.config.ts`-ben
   kell hozzá beállítás (Next 16-ban az `instrumentation.ts` alapból támogatott), add vissza a módosított `next.config.ts`-t is.
5. **A mag kiegészítése** (`packages/news-monitor-core/src/futas.ts`, add vissza a teljes fájlt): `esedekes(idozites: Idozites, utolsoKezdet: Date | null, most: Date): boolean` —
   `napi` esetén igaz, ha a mai (a zónában) `ora:perc` már elmúlt ÉS az utolsó napi futás nem ma (a zónában) volt; `kezi` → mindig hamis. Tiszta függvény, `Intl`-lel.
6. **API-változás:** `futas/route.ts` POST → `sorbaTesz(szervezetId, "futas", { proba })` → **202** `{ hirfigyelo: { sor } }` (a `FUT_MAR` 409 marad);
   új `futas/sor/[id]/route.ts` GET → `{ hirfigyelo: { sor } }` (csak a saját szervezet tétele, különben 404); `ertekeles-ujra/route.ts` POST → sorba (`"ertekeles_ujra"`), 202;
   `attekintes/route.ts` a válaszba teszi a `sorban: SorTetel | null`-t (a szervezet `var`/`fut` tétele — a sáv „Figyelés fut a háttérben…” ebből tudja).
   A jog-ellenőrzés marad az útvonalon (`hostKontextus` + a mag `jogosult`-ja: a sorba tevés előtt `jogosult(ktx.szerep, "futtat")`, különben 403).
7. **`docs/HIRFIGYELO-SZERZODES.md`** 2.13 kiegészítése 5–8 sorban (add vissza csak a kiegészítő bekezdést `=== FÁJL: szerzodes-kieg.md ===` néven).

Szabályok: TypeScript 7 + exactOptionalPropertyTypes + noUncheckedIndexedAccess; magyar nevek és megjegyzések; a mag csak a bejáraton át; nincs új npm-függőség.
Add vissza az ÖSSZES fájlt külön blokkban, teljes tartalommal.
