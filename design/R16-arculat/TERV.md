# R-16 · Arculat — build plan (TERV)

2026-09-30 · internal developer doc (English) · written by the planning agent from the APPROVED drawing
(Csilla, 2026-09-30 08:12): `R16-arculat.dc.html` (12a 12b 12c 12d 12d2 12e 12f 12g), `gepezet.md` 1–13, `kerdesek.md` (all decided:
1 yes · 2 one quiet licence sentence · 3 "Nem mi vagyunk" stays in first setup · 4 every "Ez legyen" saves AND approves · 5 logos/fonts
outside approval · 6 four logo slots), `feliratok.json` (84 keys).

**Base:** `main` 29cac7f **plus the shipped A5 fix (branch `e-a5`, b9192ed)** — `packages/fajl-core/src/logo.ts` `hasznaltLogoId`,
`apps/web/vizual/helyzet.ts` `logoAdatUrl`. Note: in the cloud repo copy `e-a5` is NOT an ancestor of `main`; every chunk branch must
start from a `main` that contains it.

**Everything below marked "measured" was measured in the cloud repo copy on 2026-09-30; everything else is read from code, not measured live.**

**Precondition before K1 code (ZAR.md, rule 3):** the drawing has the rajz-próba (16/16 green, `meres/`), but the Tibor-bíráló has NOT
run on it. Run `tibor_biro.py --ki design/R16-arculat/meres --max 3` on the Mac VM (Ollama) and `zar.py --ki design/R16-arculat/meres --rajz`;
it must say NYITVA. If ZÁRVA, the red screen goes back to Design before its chunk starts (the other chunks may proceed).

---

## 0. The shape in one paragraph

Logos (four slots) and font FILES are the workspace's own files (`arculat_fajl`), used by images as soon as they are uploaded (A5 rule,
kerdesek 5). Colours and the chosen two fonts stay in the approved snapshot (`ArculatTervezet` → `ArculatPillanatkep`), but every
"Ez legyen" on the new screens saves **and** approves in one server call, so after 12c the surface never shows a draft state.
A new pure package `@km/arculat-core` holds the brand-kit rules (logo analysis + slot assignment, the six proven colour sets, the
trade→mood table, the colour ring, font list + accent check). `@km/vizual-core` gains per-background logo choice, readable text on any
colour, two fonts, custom fonts and the name-logo SVG generator. The image renderer (`apps/kepgyar`, on the Gigabyte) gets the logos
and custom fonts inside each request (it has no access to the NAS disk). The new screens live at `/fiok/arculat/*` and stay dark
(reachable only by URL) until K7 switches page 12 over.

---

## 1. Data model

### 1.1 `arculat_fajl` — two new columns + one analysis column (migration **0135**, chunk K1)

| Column | Type | Default | Meaning |
|---|---|---|---|
| `logo_valtozat` | `text NULL`, `CHECK (logo_valtozat IN ('vilagos','sotet','egyszinu','negyzetes'))` | NULL | Slot of a `cel='logo'` file. NULL on a logo row = `vilagos` (legacy rows). Always NULL for other `cel`. |
| `eredet` | `text NOT NULL`, `CHECK (eredet IN ('feltoltes','honlap','gep'))` | `'feltoltes'` | Who made the file: user upload · downloaded from the company site (K7) · machine-made name logo (K6). **This is the "machine-made flag".** |
| `elemzes` | `jsonb NULL` | NULL | Logo analysis computed in the browser at upload (`LogoElemzes`, see 1.4): `{atlatszo, vilagossag, szinszam, arany, szinek[]}`. Validated server-side with zod; max 2 KB. NULL for legacy logos and non-logos. |

Backfill in the same migration: `UPDATE arculat_fajl SET logo_valtozat = 'vilagos' WHERE cel = 'logo' AND logo_valtozat IS NULL;`
(`eredet` gets its default for every existing row by `ADD COLUMN … DEFAULT` — no rewrite of existing values, nothing is dropped).

Drizzle: `apps/web/adatbazis/sema.ts` `arculatFajl` gets `logoValtozat`, `eredet`, `elemzes`. The second host (`apps/referencia-host`,
SQLite, A-12) adds the same three columns to its `fajl` table (`ALTER TABLE … ADD COLUMN` guarded by `PRAGMA table_info`), so A-12 stays green.

`@km/fajl-core` (0.1.0 → 0.2.0, minor: all new fields optional, `host.ts` stays compatible for the second host):
- `LogoValtozat = z.enum(["vilagos","sotet","egyszinu","negyzetes"])`, `FajlEredet = z.enum(["feltoltes","honlap","gep"])`.
- `FajlMeta` + `logo_valtozat?: LogoValtozat | null`, `eredet?: FajlEredet`, `elemzes?: unknown | null` (fajl-core does not interpret it).
- `feltolt(k, ktx, { nev, cel, bajtok, logo_valtozat?, eredet?, elemzes? })`.
- `logo.ts`: new pure `hasznaltLogok(fajlok, pillanatkepLogok) → { vilagos: id|null, sotet, egyszinu, negyzetes }` — per slot the
  newest image-usable file (`kepreAlkalmasLogo`, same tie-break as `hasznaltLogoId`); NULL slot on a logo row counts as `vilagos`;
  a slot with no file falls back to the snapshot's `logok[slot]`. `hasznaltLogoId` stays (= `hasznaltLogok(...).vilagos`) so A5 code keeps working.
- K5 adds font types, K6 adds `svg` (see 1.5, 1.6).

**No row is ever deleted** (FajlTar has no delete, and none is added). Replacing a slot = uploading a newer file into that slot; older
files stay as history under "Fájlok".

### 1.2 `ArculatTervezet` / `ArculatPillanatkep` — `logok` map instead of `logo_fajl_id` (contracts, chunk K1, **no SQL on jsonb**)

The arculat lives inside jsonb: `szervezet_profil.adatok.arculat` and `onboarding_piszkozat.<…>.arculat` (`ArculatLepes`:
`tervezet` + `verziok{}` snapshots). The migration is a **read-time schema migration**, not an SQL rewrite:

```ts
// packages/contracts/src/index.ts
export const LogoValtozat = z.enum(["vilagos", "sotet", "egyszinu", "negyzetes"]);
export const ArculatLogok = z.object({
  vilagos: z.uuid().nullable().default(null), sotet: z.uuid().nullable().default(null),
  egyszinu: z.uuid().nullable().default(null), negyzetes: z.uuid().nullable().default(null),
});
const ArculatTervezetAlap = z.object({
  /* …every existing field unchanged, including */ logo_fajl_id: z.uuid().nullable().default(null), // DEPRECATED mirror of logok.vilagos — kept, never dropped
  logok: ArculatLogok.prefault({}),
  szin_forras: z.enum(["", "logo", "honlap", "szett", "sajat", "gep"]).default(""),   // where the 3 colours came from (12d "A logódból"/"A honlapodról"/set name)
  szin_szett: z.string().max(40).default(""),                                          // the proven set id when szin_forras = "szett"
  szin_jeloltek: z.array(HexSzin).max(8).default([]),                                  // colour candidates from the site (szinek.ts jeloltek), K7 fills
  forras_cim: z.string().max(500).default(""),                                          // the site the machine read ("Honnan?"), K7 fills
  nevlogo_stilus: z.enum(["nev", "kor", "negyzet"]).nullable().default(null),         // chosen name-logo style (K6), drives regeneration
});
const logokKitolt = <T extends z.infer<typeof ArculatTervezetAlap>>(t: T): T => {
  const vilagos = t.logok.vilagos ?? t.logo_fajl_id;            // old data: logo_fajl_id → logok.vilagos
  return { ...t, logok: { ...t.logok, vilagos }, logo_fajl_id: vilagos };  // and mirror back, so rolled-back code still reads it
};
export const ArculatTervezet = ArculatTervezetAlap.transform(logokKitolt);
export const ArculatPillanatkep = ArculatTervezetAlap.extend({ jovahagyva: z.iso.datetime(), verzio: z.number().int().min(1) }).transform(logokKitolt);
```

Why this shape: (1) every new field has a default, so every stored profile, draft and snapshot parses; (2) old data is never rewritten
— a snapshot that said `logo_fajl_id: X` still says it, and now also reads as `logok.vilagos: X`; (3) new data keeps `logo_fajl_id`
mirrored, and zod strips unknown keys by default, so a `git revert` to the old code still parses new rows (it just ignores `logok`).
Only `ArculatTervezet.safeParse` and `.nullable()` are used on it today (measured by grep); `.extend` is only used for the snapshot, which
is why the base object is split out. `betu_cim` / `betu_szoveg` stay `string`: new values are keys (`archivo`, `sajat:<uuid>`), old CSS
strings (`"'Archivo',sans-serif"`, `"Georgia, serif"`) are mapped at read time by `betuKulcs` (exists in vizual-core, duplicated in arculat-core).

**Precedence for images:** a slot's newest image-usable `arculat_fajl` row wins (A5 rule); `tervezet.logok` / snapshot `logok` are
only (a) a fallback when the file list cannot be read and (b) the version history of which logos were in use. `arculatJovahagy` now
records the resolved `hasznaltLogok(...)` into the snapshot's `logok` (profile-core gets a `logok` argument; the host resolves it).

**Where the choices live:**
- chosen colour set = `tervezet.elsodleges/masodlagos/hatter` + `szin_forras` + `szin_szett` (→ approved snapshot on "Ez legyen");
- chosen fonts = `tervezet.betu_cim` + `betu_szoveg` as font keys (builtin key or `sajat:<arculat_fajl.id>`);
- logo slots = `arculat_fajl.logo_valtozat` (live), recorded into `logok` at each approval;
- name-logo style = `tervezet.nevlogo_stilus`; its files = `arculat_fajl` rows with `eredet='gep'`.

### 1.3 `kepArculat` — what the image side gets (final shape after K2 + K5 + K6)

`apps/web/vizual/helyzet.ts` → `kepArculat(szervezetId, nev)` returns `{ arculat: KepArculat, nincsArculat, nyelv }`:

```ts
type KepLogo = { adat: string /* data URL, png|jpg|webp, < 2 MB */; atlatszo: boolean /* from elemzes; false if unknown */ };
type KepArculat = {
  nev: string;
  fo?: string; hatter?: string; masodik?: string | null;          // approved snapshot ?? draft ?? DEFAULT SET (K3) — never undefined after K3
  betu_cim: string; betu_szoveg: string;                            // font keys (K5); "public-sans" when empty
  betu: string;                                                     // LEGACY = betu_cim (old kepgyar reads this; drop after one release)
  logok: { vilagos?: KepLogo; sotet?: KepLogo; egyszinu?: KepLogo; negyzetes?: KepLogo };  // K2: live newest file per slot
  logo: string | null;                                              // LEGACY = logok.vilagos?.adat ?? logok.egyszinu?.adat ?? null
  sajat_betuk: { kulcs: string /* "sajat:<id>" */; adat: string /* data URL */; formatum: "truetype" | "opentype" | "woff2" }[]; // K5, only the chosen ones (≤ 2)
};
```

`vizual-core` `HelyzetArculat` mirrors it (zod, all new fields optional with defaults; `logo` and `betu` still accepted), so for the
~1 minute during a deploy when the web is new and the kepgyar old (or the other way round — `nas/teljes-kirakas.sh` rebuilds the
kepgyar at the end of the same run) both directions parse: old kepgyar strips `logok` and uses `logo`; new kepgyar maps a lone
`logo` to `logok.vilagos`.

### 1.4 `LogoElemzes` (arculat-core, K1)

Computed in the browser (canvas, image downscaled to ≤ 64 × 64, alpha < 16 ignored), pure function `logoElemzes(rgba, w, h, eredetiW, eredetiH)`:
`atlatszo` (≥ 5 % of pixels alpha < 16) · `vilagossag` (mean relative luminance of opaque pixels, 0–1) · `szinszam` (colour clusters
≥ 2 % share after 4-bit quantisation, anti-alias edges ignored) · `arany` (w/h of the original) · `szinek` (≤ 5 dominant hex colours,
white/black/grey filtered with the same rule as `onboarding/szinek.ts`). Slot rule `javasoltHely(e)`: `szinszam ≤ 2` → `egyszinu`;
`0.8 ≤ arany ≤ 1.25` → `negyzetes`; `vilagossag < 0.45` (dark logo) → `vilagos` (it goes on light backgrounds); else → `sotet`.
Batch rule `besorol(elemzesek[])`: in upload order; if the slot is already taken **in this batch**, the next EMPTY-in-batch slot
that is compatible (`negyzetes` only for ratio 0.8–1.25, `egyszinu` only for ≤ 2 colours; order vilagos → sotet → egyszinu → negyzetes);
if none is compatible, the file takes its natural slot and the earlier one in the batch stays history. PDF (no pixels) → `vilagos`, no analysis.

### 1.5 Font files (K5)

- `FajlTipus` + `ttf` · `otf` · `woff2`; detection from content: `00 01 00 00` or `true` → ttf, `OTTO` → otf, `wOF2` → woff2
  (woff1, ttc, collections → `TIPUS_NEM_ENGEDETT`). `KITERJESZTES` / `MIME` (`font/ttf`, `font/otf`, `font/woff2`).
- `FajlCel` + `"betu"`. New pure `CEL_TIPUSOK: Record<FajlCel, FajlTipus[]>` and `fajlEllenoriz(..., { cel })`: a font is only accepted
  for `cel='betu'`, and `cel='betu'` only accepts fonts (today any cel accepts any image/pdf — unchanged for the others). 10 MB limit (gepezet 8).
- Storage: same disk layout `<FAJL_MAPPA>/<szervezet>/<id>.<ttf|otf|woff2>`, same `arculat_fajl` table. Serving: the existing
  `GET /api/arculat/fajl/[id]` (MIME from the map) — the 12e page loads it with the `FontFace` API to write "Saját: <név>" in its own font.
- Validation at upload (apps/web, server-only, **fontkit**): must open as a font (else `TIPUS_NEM_ENGEDETT` → label `r16.arculat.betu.hiba_tipus`);
  family name = `familyName` (fallback: file name); missing accents = `hianyzoEkezetek(font.hasGlyphForCodePoint, nyelvek)` from
  arculat-core: á é í ó ö ő ú ü ű (+ Á…Ű) always, ă â î ș ț (+ capitals, comma-below U+0218–021B) if `ro` is a workspace language.
  Not stored; recomputed on `GET /api/arculat/betuk` (cmap lookup, milliseconds).
- To the image: the chosen custom font(s) go as data URLs in `sajat_betuk` with each request; `@font-face` with a fallback stack
  `'<sajat>', 'Public Sans'` — the browser draws a missing accent with Public Sans glyph by glyph (that is the "tartalék betű").

### 1.6 Name-logo files (K6)

Four slots × (PNG + SVG), `cel='logo'`, `eredet='gep'`, `logo_valtozat` = slot. PNG is what images use (`kepreAlkalmasLogo` stays
png/jpg/webp only). SVG is the portable master (paths only, no `<text>`, no scripts): `FajlTipus` + `svg`, but `fajlEllenoriz` keeps
refusing SVG **uploads** (`SVG_NEM_ENGEDETT` unchanged) — only the machine path (`fajlTar.ment` directly) can write one, and
`GET /api/arculat/fajl/[id]` serves `image/svg+xml` with `content-security-policy: default-src 'none'; style-src 'unsafe-inline'` and
`x-content-type-options: nosniff`. Regeneration (colour or title-font "Ez legyen") writes NEW rows only when the newest file of a slot is
`eredet='gep'` — an uploaded logo is never overwritten or regenerated.

### 1.7 TOP RISK — what could lose data, and the mitigation

| # | Risk | Where | Mitigation (binding) |
|---|---|---|---|
| **R1** | **A schema change makes a stored profile fail to parse → `profilTar.betolt` returns `null` (it does today: `console.error("Hibás profil-tartalom")`) → the page shows "no profile" → if anything then saves a fresh profile (onboarding approve uses `onConflictDoUpdate`) the old row is OVERWRITTEN.** | contracts (K1, K5, K6) | Every new field has a default; no existing field is tightened; the transform only fills/mirrors. **Before the K1 deploy:** (a) timestamped dump of the three tables on the NAS (`pg_dump -t szervezet_profil -t onboarding_piszkozat -t arculat_fajl`), (b) read-only parse check: `tools/r16/profil-parse-ellenor.ts` (K1 writes it) reads a `psql -At -c "select adatok from szervezet_profil"` export (plus `onboarding_piszkozat`) and parses every row with the NEW schema; it must report 0 failures AND, per row, `old tervezet.logo_fajl_id === new tervezet.logok.vilagos` and the same for every snapshot in `verziok`. Repeat (b) before K5 and K6 (they touch the same schema). |
| **R2** | The old page-12 box (`Fiok.tsx` `arculatValtozik`) PUTs the WHOLE `arculat` from the state loaded at page open (debounced 800 ms). While K3–K6 screens are live-by-URL and the old box is still on /fiok (until K7), a stale tab can overwrite a newer approval — the version and its snapshot would vanish. | `PUT /api/profil` (exists) | K1 adds a server-side guard in `profilModositasAlkalmaz` / `profilModosit`: (1) snapshots are immutable — `verziok = { ...incoming.verziok, ...server.verziok }` (server wins for an existing key; a key is never dropped); (2) if `incoming.verzio < server.verzio` or `incoming.jovahagyott_verzio < server.jovahagyott_verzio` → `409 ELAVULT_ADAT`; the old box reloads the profile on 409 (it already routes non-200 to the error state). New endpoints never send the whole arculat; they load-modify-save server-side inside one transaction with `SELECT … FOR UPDATE` on the `szervezet_profil` row. |
| R3 | Existing `logo_fajl_id` in the draft and in approved snapshots | contracts | Never rewritten (1.2); the parse check (R1-b) asserts it survives; rollback code still sees it (mirror). |
| R4 | `arculat_fajl` migration | 0135 | Additive only: `ADD COLUMN` nullable or with a constant default (Postgres 18: no table rewrite), `CHECK`s on the new columns only, one `UPDATE` that sets NULL→`vilagos` on logo rows. Old code does `select()` of its own drizzle columns and inserts without the new columns → defaults apply. Down script (NOT run automatically) in a comment at the end of the file: `ALTER TABLE arculat_fajl DROP COLUMN elemzes, DROP COLUMN eredet, DROP COLUMN logo_valtozat;`. |
| R5 | Regenerated name logos / multi-upload | K1, K6 | Only INSERTs; no existing row is updated; no delete path exists. |
| R6 | Snapshot growth: every "Ez legyen" is a new version (kerdesek 4) | profile-core | Not capped (capping = deleting history). The parse check prints the largest `adatok` size; if a profile exceeds 256 KB, raise it in state.md — do not trim. |
| R7 | Onboarding logo download (K7) writes a file for a workspace that already has one | K7 | Only when `fajlTar.lista(szervezet, "logo")` is empty; it never touches the tervezet colours the user already approved. |

**Dry run (every chunk with a migration: 0135–0139), on the NAS, after the NAS rules' `free -m` / `uptime` probe:**
`{ echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0135_r16_logo_helyek.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U <user> -d <db>'`
(the `;` after BEGIN is required; name the container explicitly). Expected for 0135: `ALTER TABLE` ×3, `UPDATE <n>` (= number of
logo rows, measure it first with `select count(*) from arculat_fajl where cel='logo'`), label `INSERT 0 42`, `ROLLBACK`. Only then push.
Rollback of a chunk = `git revert` of its merge commit (the robot redeploys); migrations are additive and stay.

---

## 2. Build chunks (dependency order)

Legend — **Checks** for every chunk: `pnpm tipus` · `pnpm hatar` (must still show exactly the 2 pre-existing cycle errors, nothing new) ·
`pnpm tokenor` · `pnpm keretor` · `node tools/hatar/dockerfile-or.mjs` · the package probes · `pnpm --filter @km/web epit` (`next build`) ·
`pnpm allapot …` updated at START and END (the `ellenoriz` chain blocks a stale status page) · hub chunk moved.
**Live check** = after the robot deployed (wait until live before any further push: two pushes < 2 min deploy mixed images),
on https://saas.mediapartizan.ro, desktop 1440 and phone 390 (no horizontal scroll, the floating Visszajelzés button covers nothing),
Hungarian/Romanian test data, screenshot to Csilla. New pages: add to `tools/tibor-proba/tibor_proba.py` `LAPOK`, run
`tibor_proba.py` → `tibor_biro.py --csak <lap>` → `zar.py`; ship only green, nothing else may get worse (`alap.json` racsni).

Order and parallelism:

```
K1 ─┬─> K3 ─┬─> K4 ─┐
K2 ─┘       ├─> K5 ─┴─> K6 ──> K7
            (K4 ∥ K5)
```
K1 ∥ K2 (disjoint files; K2's `helyzet.ts` wiring waits for K1's `hasznaltLogok` merge). K4 ∥ K5 after K3. K6 after K5 (custom fonts
in the wordmark, `svg` after the font types in `FajlTipus`). K7 last (the switch-over). Keep one build agent across chunks where possible.
Screens stay **dark** (no link from /fiok, not in the menu) until K7, so every chunk deploys without changing what Tibor sees on page 12.

### K1 — data model + logo slots + multi-upload + auto-classification + 12f (gepezet 2–3)

**Effort:** large, one full Opus session (~5 h).
**Files:**
- `packages/contracts/src/index.ts` — 1.2 in full (ALL new tervezet fields for the whole R-16, so K3–K7 never touch the schema again), `LogoValtozat`, `ArculatLogok`.
- `packages/profile-core/src/index.ts` — `uresTervezet` new defaults; `arculatJovahagy(a, most, logok?)` records `logok`; new
  `arculatValasztJovahagy(a, resz, most, logok?)` = modify + approve (kerdesek 4); `arculatOsszefesul(szerver, bejovo)` for R2 (returns `{ ok } | { hiba: "ELAVULT_ADAT" }`).
- `packages/fajl-core` — 1.1 (`host.ts`, `folyamat.ts` pass-through, `logo.ts` `hasznaltLogok`, README, version 0.2.0).
- **new `packages/arculat-core`** (MODULSZABALY 3: `package.json` `@km/arculat-core`, exports `./src/index.ts` only, plain imports
  without `.ts` extensions so Next and tsc of `apps/web` consume it; `host.ts` (the font-glyph port `VanKarakter = (cp: number) => boolean`, used from K5),
  `logo-elemzes.ts`, `besorolas.ts`, `probak/`, `README.md` with the 5 sections, `vitest.config.ts`). Add to root `Dockerfile` COPY list,
  to `apps/web/package.json`, and three rules to `.dependency-cruiser.cjs` (`arculat-core-csak-contracts-es-zod`,
  `alkalmazas-az-arculat-core-t-csak-a-bejaratan-at`, `az-arculat-core-nem-ismeri-a-befogadokat`) — same day (MODULSZABALY 5).
- `apps/web/adatbazis/sema.ts`, `apps/web/adatbazis/migraciok/0135_r16_logo_helyek.sql` (1.1 + 14 labels, see §5).
- `apps/web/fajl/tar.ts` (map the three columns), `apps/referencia-host/src/csatlakozok/sqlite-fajl.ts` (same).
- `apps/web/app/api/arculat/fajl/route.ts` — POST reads `x-logo-valtozat` (optional; for `cel=logo` default `vilagos`) and
  `x-logo-elemzes` (optional base64url JSON ≤ 2 KB, zod `LogoElemzes` from arculat-core; invalid → ignored, not an error).
  Response unchanged shape: `201 { fajl: FajlMeta }` (now with `logo_valtozat`, `eredet`, `elemzes`).
- new `apps/web/app/api/arculat/logok/route.ts` — `GET` (tag) → `200 { logok: { vilagos: FajlMeta|null, sotet, egyszinu, negyzetes } }`.
- `apps/web/app/api/profil/route.ts` (via `profilModosit`) — R2 guard; `409 { hiba: "ELAVULT_ADAT" }`.
- `apps/web/app/api/vizual/helyzet-minta/[helyzet]/route.ts` — GET accepts `?valtozat=vilagos|szines` (12f shows the light and the coloured image).
- new screen `apps/web/app/fiok/arculat/logok/page.tsx` + `LogokFeltoltes.tsx` + `apps/web/app/fiok/arculat/arculat.css`, and the
  shared `apps/web/app/fiok/arculat/_kozos/IgyNezKi.tsx` (two images + "Másik minta"; K3 extends it to POST). 12f exactly as drawn:
  2×2 slots each on its own background (vilagos on the workspace background colour, sotet on the darkened main colour, egyszinu on
  white, negyzetes on the background colour), states empty (+) · uploading (bar) · done (✓); primary "Logók kiválasztása" (`multiple`),
  desktop "vagy húzd ide őket"; tapping a slot opens a single-file picker for that slot only; in approved state a filled slot keeps
  the existing R-6 05/A replace confirmation (`arculat_fajl.csere_*` labels). "Melyik hova?" in `Reszletek`. Upload flow in the
  browser: decode each file on a canvas → `logoElemzes` → `besorol` for the batch → upload one after another (`feltoltSorban` pattern
  from A-7) with explicit `x-logo-valtozat` + `x-logo-elemzes`. Error branch: the existing `hibaMitKulcs` sentences (T7, one sentence).
  **"Nincs logóm" is NOT rendered in K1** (12g does not exist yet — no dead control); K6 turns it on. "Vissza" → `/fiok` (K3 changes it to `/fiok/arculat`).
- `ArculatAnyagok.tsx` — its logo upload sends `x-logo-valtozat: vilagos` explicitly (behaviour unchanged).
- `tools/r16/profil-parse-ellenor.ts` (R1-b).

**Self-test:**
- probes: `packages/arculat-core/probak/logo-elemzes.proba.ts` (synthetic RGBA: transparent dark mono → egyszinu+atlatszo; white-on-transparent → sotet; square colourful → negyzetes; JPEG-like opaque → atlatszo false; anti-aliased 2-colour edge still `szinszam ≤ 2`),
  `besorolas.proba.ts` (two dark wide logos in one batch → vilagos + next compatible; square + wide; 5 files → 4 slots + 1 natural);
  `packages/fajl-core/probak/logo.proba.ts` extended (per-slot newest, NULL slot = vilagos, PDF skipped, snapshot fallback; the 9 A5 cases still green);
  `apps/web/probak/r16-arculat-sema.proba.ts` (fixtures: a real-shaped 09-2x profile with `logo_fajl_id` in the draft and in 2 snapshots → `logok.vilagos` equal, mirror kept;
  a new-shape object parsed by the OLD schema (copy of today's zod in the probe) → parses; a profile with `allapot: kesobb` and no tervezet → parses);
  `apps/web/probak/r16-profil-elavult.proba.ts` (R2: stale verzio → 409; snapshot key never dropped; DB probe style of `profil.proba.ts`);
  extend `apps/web/probak/arculat-fajl-hibak.proba.ts` (headers accepted; bad elemzes ignored; `x-logo-valtozat=foo` → `400 ERVENYTELEN_ADAT`);
  `apps/referencia-host/probak/fajl.proba.ts` still green.
- `tools/r16/profil-parse-ellenor.ts` run on the exported NAS rows → 0 failures (paste the summary line into HANDOFF).
- Dry run 0135 on the NAS (BEGIN…ROLLBACK), timestamped dump first.
- Live: `/fiok/arculat/logok` (typed URL) as Kövesi-like test workspace: select 3 files at once (dark wide PNG, white PNG on transparent, square) → they land
  in Világos / Sötét / Négyzetes with ✓; tap "Egy színnel" → single picker → only that slot changes; `/kepek` image still shows the logo
  (A5 unchanged); approved workspace → tapping a filled slot shows the replace confirmation; 390 px: 2×2 fits, primary reachable, no overlap;
  `tibor_proba` + `zar.py` for the new page (`LAPOK` entry `("arculat-logok", "/fiok/arculat/logok")`) green.

### K2 — image side: logo per background + readable text on any colour + POST preview (gepezet 4, 5, 9-endpoint)

**Effort:** medium (~3 h). Can start in parallel with K1 (vizual-core + kepgyar); the `helyzet.ts` wiring after K1 is merged.
**Files:**
- `packages/vizual-core/src/helyzet.ts`:
  - `HelyzetArculat` + `logok` map (`{adat, atlatszo}` per slot, all optional), `logo` still accepted (→ `logok.vilagos` when `logok` empty).
  - `logoValaszt(logok, hatterek: string[]) → { adat, szures: "" | "feher" | "fekete", lemez: string | null } | null` (pure, exported):
    each logo placement knows its background (kesz/akcio/tudtad/esemeny/szam → `pal.veg`; hir → `pal.panelVeg`; uj → the dark photo overlay, always dark).
    Light background (min luminance > 0.35, the threshold `paletta` already uses): `vilagos` → `egyszinu` (tinted `fekete` via
    `filter: brightness(0)` if `atlatszo` and the mono logo is light) → `sotet` on a small dark plate → name.
    Dark/colourful background: `sotet` → `egyszinu` tinted `feher` (`brightness(0) invert(1)`, only if `atlatszo`) → `vilagos` tinted `feher` (only if `atlatszo`)
    → `vilagos` on a small light plate (the workspace background colour, radius from the image scale) → name in the readable colour (today's behaviour).
    `negyzetes` is not used on the seven images (it is for profile pictures / small places; chosen: see §4).
  - Readable text (gepezet 5): `olvashato(szin, hatterek, min)` — darkens (or lightens on dark grounds) keeping the hue until the WCAG ratio
    reaches `min` (4.5 small text, 3 large); used wherever `fo`/`kiem` is text or a thin line on the ground (akcio `sor`, tudtad heading
    and bar, esemeny labels, szam number, kicker box text already uses `legjobb`). `vizsgal` no longer trusts `vilagos` blindly.
- `.dependency-cruiser.cjs` — the three MODULSZABALY rules for `vizual-core` (it has none of its own today, §3).
- `apps/kepgyar/src/szerver.ts` — body limit 32 MB → **64 MB** (4 logos ≤ 2 MB + 2 photos ≤ 12 M chars + 2 custom fonts ≤ 10 MB each, all base64);
  pass-through only. Build the kepgyar image on the Gigabyte once (a Dockerfile that was never built is not verified).
- `apps/web/vizual/helyzet.ts` — `kepArculat` builds `logok` from `hasznaltLogok` (K1) + `elemzes.atlatszo`, keeps `logo`/`betu` legacy fields (1.3).
- `POST /api/vizual/helyzet-minta/[helyzet]` (same file as GET; kapu `tag`) — body (zod `MintaKeres` in `apps/web/vizual/minta.ts`):
  `{ valtozat?: "vilagos"|"szines", szinek?: { fo, masodik, hatter } (HexSzin), betuk?: { cim, szoveg } (K5), nevlogo?: { stilus } (K6) }`
  → `200 image/png` (`cache-control: no-store`); the body overrides the workspace's effective arculat for this one image; logos are
  always the workspace's own (never bytes from the client; file ids are never taken from the body). `400 ERVENYTELEN_ADAT`, `503 KEPGYAR_NEM_VALASZOL`.
  Texts: the workspace's `peldakFrissen` examples, like GET. **Import rule:** the new code imports `../profil/tar` / `../fajl/tar`,
  never `../profil` (index) — see §3 (the pre-existing cycles).
**Self-test:**
- probes `packages/vizual-core/probak/helyzet-logo.proba.ts` (pure `helyzetHtml`: light ground → vilagos `<img>`; szines ground with only
  vilagos transparent → `brightness(0) invert(1)`; with only vilagos opaque → plate; sotet present → sotet; uj always dark; no logo → name; legacy `logo` only → vilagos),
  `helyzet-olvashato.proba.ts` (the six sets of §2-K4 + 300 seeded pseudo-random colour triples, every variant `valtozatok` returns, every text element ≥ its minimum ratio — measured on the palette, not the DOM),
  existing 14 vizual-core probes green, `pnpm --filter @km/kepgyar tipus`.
- Live: approved test workspace with vilagos (dark) + sotet (white) logos → Képek: "Kész munka" light variant shows the dark logo, the
  "színes" variant the white one; a workspace with a single dark transparent PNG → the coloured image shows it tinted white;
  `curl -X POST …/api/vizual/helyzet-minta/kesz -d '{"valtozat":"szines","szinek":{"fo":"#2f5d50","masodik":"#c9a86a","hatter":"#f1ede4"}}'` with a session cookie → PNG;
  time 10 consecutive POSTs with changing colours and record p50/p95 in HANDOFF (target ~1 s, gepezet 9 — unmeasured today).

### K3 — the new Arculat section 12a / 12b / 12c + preview + one-tap approve + "Fájlok" (gepezet 9, 11, 12)

**Effort:** large (~5 h). After K1 + K2.
**Files:**
- new server module `apps/web/arculat/`: `allapot.ts` (the view model: `nezet: "ures"|"talalt"|"kesz"`, effective tervezet, resolved
  logos, font keys + mood words, Fájlok counts, `forras_cim`), `ment.ts` (`arculatMent(szervezetId, fn)` — one transaction,
  `SELECT … FOR UPDATE` on `szervezet_profil`, `SzervezetProfil.safeParse` before write, **no `peldakatFrissit`** (an arculat change
  does not need new example texts — and it avoids an AI call per tap)), `alap.ts` (the default set, below).
- `packages/arculat-core/src/szettek.ts` — the six proven sets and the trade→mood table (data defined in K4 below; they ship here
  because 12a needs the default fill; K4 adds the suggestion logic). Add `packages/arculat-core/src/szettek.ts` to the tokenőr `KIVETEL`
  (colour DATA, not UI) with the same comment style as `szinek.ts`.
- `apps/web/vizual/helyzet.ts` — `kepArculat` uses `alap.ts` when there is no tervezet at all ("a kép sosem szürke" — also on Képek); `nincsArculat` stays true then.
- `apps/web/app/fiok/arculat/page.tsx` + `ArculatSzakasz.tsx`; `IgyNezKi.tsx` gains the POST mode (used by K4–K6) with request
  coalescing (one request in flight per image; the newest pending choice fires when it returns; `AbortController` on unmount).
- `apps/web/public/kepbetuk/` — copies of the five families' 400 + 700 latin + latin-ext woff2 from `tools/vizual/referencia/betuk-munkater`
  (the web image does not contain `tools/`), `kepbetuk.css` `@font-face` lines each marked `/* tokenőr: ok — ügyfélkreatív betűi */`;
  probe asserts the copies are byte-identical to the originals.
- `ArculatAnyagok.tsx` — new prop `celok` (default all four); the "Fájlok" panel renders it with `["kezikonyv","referencia","dokumentum"]`
  (the logo field lives in 12f now; no file is removed from storage — see §4 choice 9).
- API: `POST /api/arculat/jovahagy` (szerkeszto) `{}` → approves the effective tervezet (creates it from the default set when none) →
  `200 { arculat: ArculatLepes }`; `PUT /api/arculat/reszletek` (szerkeszto) `{ kepvilag?, kovetendo?, kerulendo?, lekerekites? }` → save + approve → `200 { arculat }`;
  `POST /api/arculat/visszavon` → `arculatVisszavon` (the 12c "Visszavonás" behind Részletek) → `200 { arculat }`. All: `409 ELAVULT_ADAT` never (server-side load), `403 NINCS_JOG` for nezo.
- `apps/web/adatbazis/migraciok/0136_r16_arculat_szakasz_feliratok.sql` — 35 labels (§5).
**Behaviour (exactly the drawing):**
- 12a (not approved, no logo, no site source): "Kezdjük a logóddal" / "A színeket és a betűket addig mi választottuk."; three rows
  Logó ("Még nincs") · Színek (three swatches with fő/második/háttér words) · Betűk ("Cím: <szó> · Szöveg: <szó>", each in its own font), each
  row a quiet "Csere" (Színek → `/fiok/arculat/szinek`, Betűk → `/fiok/arculat/betuk`, Logó → `/fiok/arculat/logok`); primary
  "Logó feltöltése" (→ 12f); quiet "Így jó, logó nélkül" (→ `POST /api/arculat/jovahagy`); "Nincs logóm" hidden until K6.
- 12b (not approved AND (a logo exists OR `szin_forras = "honlap"`)): "Jól ismer a gép?" + alcím "Ezt találtuk a honlapodon." only when
  `forras_cim` is set; "Honnan?" (Részletek: the site address) only then; "Több logó" → 12f; primary "Igen, ez mi vagyunk" (approve).
- 12c (approved): "Így készülnek a képeid", kész line "Jóváhagyva. Minden új kép ezzel készül." (phone: `kesz.jovahagyva_rovid`), Logók row
  with the filled slots, primary "Kép készítése" → `/kepek` (T9); Részletek: approver + date, Visszavonás.
- "Fájlok" row: `fajlok_db` ("Kézikönyv, {minta} minta, {dok} dokumentum:") or `fajlok_sor` when empty; opens the three existing fields
  unchanged but quieter. The draft box's kepvilag / kovetendo / kerulendo / lekerekites go behind "Részletek" (existing labels
  `onboarding3.*` / `fiok.*` reused — they exist; no new keys).
- "Így néz ki egy képed:" two images (vilagos + szines, helyzet `kesz`), "Másik minta" = next helyzet kesz → akcio → uj → hir → tudtad → esemeny → szam.
- Viewer role (nezo): rows without Csere, no approve; primary "Kép készítése" (T2 needs exactly one).
- `allapot = "kesobb"` workspaces are shown as not approved (12a/12b); "Későbbre hagyom" is gone from this page.
**Self-test:**
- probes `apps/web/probak/r16-arculat-allapot.proba.ts` (view model: ures/talalt/kesz selection incl. kesobb, nezo, default set from trade),
  `r16-arculat-ment.proba.ts` (DB: two concurrent `arculatMent` calls serialise; approve from nothing creates version 1; Részletek edit on
  approved → version+1 approved; profile never null after a save), `kepbetuk-masolat.proba.ts` (byte-identical).
- Live (page still dark: typed URL `/fiok/arculat`): fresh registration (Cipó Pékség, "pékség, kovászos kenyér") → 12a, images in the
  Meleg set, never grey; "Így jó, logó nélkül" → 12c without reload; Képek shows the same colours; a Kövesi-like workspace with a
  logo → 12b; "Másik minta" cycles; phone 390: images above the rows, primary by the thumb, no overlap; `LAPOK` entry
  `("arculat", "/fiok/arculat")`, Tibor-próba + bíráló + `zar.py` green (fresh accounts land on 12a).

### K4 — colour suggestions 12d + "Más színt" 12d2 (gepezet 6, 6b)

**Effort:** medium (~3 h). After K3; parallel with K5.
**The six proven sets** (the 09-28 request's list is not in the repo or the project docs — defined here; names = the six label keys;
hex = fő · második · háttér; fonts = the default fill for 12a). **Measured 2026-09-30** with `vizual-core` `valtozatok()`: all six keep
the `szines` variant on `kesz` (what 12d shows), and every set has fő/háttér contrast ≥ 4.9.

| id | Label | fő | második | háttér | Mood | Default fonts (cím · szöveg) |
|---|---|---|---|---|---|---|
| `termeszetes` | Természetes | `#2f5d50` | `#c9a86a` | `#f1ede4` | earthy green, sand, cream — calm, outdoors | archivo · public-sans |
| `meleg` | Meleg | `#a4471f` | `#e3a857` | `#fbf3e8` | terracotta, honey — food, home, hospitality | gelasio · public-sans |
| `friss` | Friss | `#17745e` | `#f2c94c` | `#f4fbf8` | teal and lemon — clean, health, new | space-grotesk · public-sans |
| `megbizhato` | Megbízható | `#1f3a5f` | `#7fb2e5` | `#f3f6fa` | navy and sky — finance, law, services | ibm-plex-sans · public-sans |
| `elegans` | Elegáns | `#2b2b2e` | `#b89b5e` | `#f6f4ef` | charcoal and muted gold — beauty, premium | gelasio · public-sans |
| `jatekos` | Játékos | `#c2410c` | `#3aa6b9` | `#fff8ec` | orange and turquoise — kids, sport, events | space-grotesk · public-sans |

Trade → mood (`hangulatok(nev + " " + osszefoglalo)`, case- and accent-insensitive keyword stems HU/RO/EN; first match wins; the first mood is the 12a default set):

| Stems (examples) | Moods (in order) |
|---|---|
| térkő, burkol, építő, épít, ács, asztalos, kert, tető, construc, pavaj, grădin, garden, build | termeszetes · megbizhato · elegans |
| pék, cukrász, étterem, kávé, vendég, panzió, szállás, brutăr, cofet, restaur, bakery, cafe | meleg · termeszetes · jatekos |
| szépség, kozmetik, fodrász, virág, esküvő, divat, ékszer, frumuse, cosmet, beauty, salon | elegans · meleg · friss |
| orvos, fogorvos, egészség, patika, gyógy, klinik, medic, farmac, dental, health | friss · megbizhato · termeszetes |
| könyvel, jog, ügyvéd, bank, biztosít, pénzügy, tanácsad, informatik, szoftver, contab, avocat, software | megbizhato · elegans · friss |
| iskola, óvoda, gyerek, játék, sport, fitnesz, rendezvény, școal, copii, sport, event | jatekos · friss · meleg |
| szállít, fuvar, autó, szerviz, logiszt, közlekedés, transport, auto, service | megbizhato · friss · termeszetes |
| (no match) | termeszetes · megbizhato · meleg (gepezet 6) |

**The 12-colour ring** (fixed list, gepezet 6b) = the six fő + the six második above, in hue order.
**Suggestion order (12d, 4 cards):** 1) the CURRENT colours, ✓, labelled by `szin_forras` ("A logódból" / "A honlapodról" / the set
name; `sajat`/empty → "A logódból" if a logo exists else the set name of the closest set); 2) the logo-derived set if a logo with
`elemzes.szinek` exists and differs from the current (fő = most saturated dark-enough logo colour, második = second, háttér = the
lightest tint of fő that keeps ≥ 4.5 with the text colour); 3–4) the trade moods not already shown (near-duplicates by ΔE < 10 skipped).
**Files:** `packages/arculat-core/src/szin-javaslat.ts` (+ probe); `apps/web/app/fiok/arculat/szinek/page.tsx` + `Szinek.tsx` (12d: four
images, `szines` variant, phone 2×2; tap selects, primary "Ez legyen"; quiet "Más színt", "Mégse"); `apps/web/app/fiok/arculat/szinek/mas/page.tsx`
+ `MasSzin.tsx` (12d2: tabs Fő · Második · Háttér via `?ful=`; "A logódból:" ≤ 5 swatches (current circled), "Más szín:" the ring;
tap → both preview images re-render; "Ez legyen" / "Mégse"; no code, slider or colour field).
API: `GET /api/arculat/szin-javaslatok` (tag) → `200 { szettek: [{ id, cimke /* label key */, fo, masodik, hatter, jelenlegi }], logo_szinek: Hex[], gyuru: Hex[12] }`;
`POST /api/arculat/szinek` (szerkeszto) `{ fo, masodik, hatter, forras: "logo"|"honlap"|"szett"|"sajat", szett? }` → `arculatValasztJovahagy` → `200 { arculat }`.
Migration `0137_r16_szinek_feliratok.sql` — 21 labels.
**Self-test:** probes `szin-javaslat.proba.ts` (Kövesi text → Természetes · Megbízható · Elegáns; bakery → Meleg first; unknown → gepezet default;
current always first with ✓; logo set built and deduplicated; ring has 12 distinct colours); API probe (validation, approve → version+1).
Live: from 12a "Csere" at Színek → 12d with four coloured images (current ✓ first); pick "Megbízható" → "Ez legyen" → back on 12c,
Képek uses navy; 12d2 tab Második → tap a ring colour → both images change; phone 2×2 grid, no horizontal scroll; LAPOK
`("arculat-szinek", "/fiok/arculat/szinek")`, `("arculat-mas-szin", "/fiok/arculat/szinek/mas?ful=masodik")`; Tibor gate green.

### K5 — fonts 12e: two fonts on images, the image maker's list, custom upload (gepezet 7, 8)

**Effort:** medium-large (~4 h). After K3; parallel with K4.
**Files:**
- `packages/fajl-core` — 1.5 (types, `CEL_TIPUSOK`, cel-aware `fajlEllenoriz`, `MIME`, README); `ArculatAnyagok.tsx` `Record<FajlCel, CelAllapot>`
  initialisers get `betu` (**compile break otherwise**: the record type requires every enum member); `GET /api/arculat/fajl` without `cel`
  filters out `betu` like it does `kep` (fonts are not "Fájlok").
- `packages/arculat-core/src/betuk.ts` — `BEEPITETT` (archivo → `betu.eros`, public-sans → `betu.tiszta`, space-grotesk → `betu.modern`,
  ibm-plex-sans → `betu.hivatalos`, gelasio → `betu.klasszikus`), `betuKulcs(css)` (legacy strings; Georgia → gelasio; Cairo/Tajawal → public-sans),
  `hianyzoEkezetek(van, nyelvek)`.
- `apps/web/arculat/betu.ts` (server-only, **fontkit 2.0.4**, added to `apps/web` deps): open → family name → missing accents.
- `apps/web/app/api/arculat/fajl/route.ts` — for `cel=betu` the fontkit check runs BEFORE `feltolt`, so a non-font never reaches the disk:
  `415 TIPUS_NEM_ENGEDETT`. Response `201 { fajl, betu: { nev, hianyzo: string[] } }`.
- `GET /api/arculat/betuk` (tag) → `200 { beepitett: [{ kulcs, szo }], sajat: [{ id, kulcs: "sajat:<id>", nev, hianyzo }], cim, szoveg }`;
  `POST /api/arculat/betuk` (szerkeszto) `{ cim?: kulcs, szoveg?: kulcs }` (a `sajat:` key must be one of the workspace's `betu` files) → save + approve → `200 { arculat }`.
- `packages/vizual-core/src/helyzet.ts` — `betu_cim` + `betu_szoveg` (+ legacy `betu`), `sajat_betuk`; title-like fields (`cim`, `szam`, the name fallback)
  use the title font, everything else the text font; `betuCss` emits both families (builtin files via `betuCim`, custom via data URL) with
  `'Public Sans'` always loaded as the fallback. `apps/web/vizual/helyzet.ts` puts the chosen custom fonts' bytes into `sajat_betuk`.
- `POST helyzet-minta` gains `betuk`.
- 12e `apps/web/app/fiok/arculat/betuk/page.tsx` + `Betuk.tsx`: tabs Cím · Szöveg (`?ful=`), five rows each written in its own font with
  its mood word (desktop: quiet font name beside it), ✓ on the current; "Saját betűm van" → file picker (`.ttf,.otf,.woff2`) with the quiet
  licence sentence `betu.licenc` under it (kerdesek 2) and `betu.sajat_tipus`; after upload a sixth row "Saját: <név>" in that font; if
  accents are missing one quiet line `betu.hianyzo_betuk` ({betuk}, {tartalek} = "Public Sans") — not red (T7); preview re-renders on tap; "Ez legyen" / "Mégse".
- Migration `0138_r16_betuk_feliratok.sql` — 9 labels.
**Self-test:** probes `fajl-core/probak/felismeres.proba.ts` extended (ttf/otf/woff2 magic; woff1/ttc refused; font for `cel=logo` refused; image for `cel=betu` refused);
`arculat-core/probak/betuk.proba.ts` (legacy mapping; missing-accent lists for HU only / HU+RO with a fake `van`);
`apps/web/probak/r16-betu-feltoltes.proba.ts` with the repo's own woff2 files as fixtures — **measured with fontkit: the latin file lacks
Ő Ș ț ă, the latin-ext file lacks the basic Latin letters** — so the latin file is the "ő ű missing" case, and the "nothing missing" case
needs a full (unsplit) OFL font as a probe fixture (e.g. Public Sans TTF from its upstream release, committed under `probak/betuk/`);
`helyzet` probe: two families present in the HTML, title uses the title font.
Live: 12e shows the five rows in their own fonts; choose Klasszikus for Cím → Képek title in Gelasio, text in Public Sans;
upload a TTF without ő → "Saját: <név>" row + the quiet missing-accent line; image shows ő from Public Sans; upload a PNG as font → one
error sentence; phone 390 check; LAPOK `("arculat-betuk", "/fiok/arculat/betuk")`; Tibor gate green.

### K6 — name-logo maker 12g (gepezet 13)

**Effort:** large (~5 h). After K5.
**Library (measured 2026-09-30):** **fontkit 2.0.4, MIT** (deps MIT, `@swc/helpers` Apache-2.0). opentype.js 2.0.0 (MIT) was
rejected: it throws on WOFF2 ("WOFF2 require an external decompressor library") and the image maker's fonts are WOFF2 only.
fontkit opened `archivo-latin-700-normal.woff2`, laid out "Cipó Pékség" and returned SVG path data. Neither library is in the local
pnpm store (`/root/.local/share/pnpm/store/v10`, measured) — adding it needs ONE networked `pnpm add` that updates `pnpm-lock.yaml`;
the Gigabyte robot's `pnpm install --frozen-lockfile` then fetches it like every other dependency.
**Subset gotcha (measured):** each builtin family is split into `latin` and `latin-ext` files; `Ő Ș ț ă Ț` exist only in latin-ext and the
basic letters only in latin. The glyph port picks, per character, the first file that has the glyph (custom font → its own file, then Public Sans).
**Files:**
- `packages/vizual-core/src/nevlogo.ts` (pure): `nevlogoSvg({ nev, stilus: "nev"|"kor"|"negyzet", szinek, valtozat: slot }, port) → { svg, szelesseg, magassag }`;
  `packages/vizual-core/src/host.ts` + port `BetuUtvonal { utvonal(szoveg: string, meret: number): { d: string; szelesseg: number; felso: number; also: number } }`.
  **c10 (2026-09-30, UTOKERES-12G) supersedes the style list below:** `nev` = word only · `kor` = initial in a fő circle with a második ring, name
  smaller BELOW (portrait; breaks into two lines from 16 chars) · `negyzet` = name inside a második band with a thin fő frame (landscape). Enum values
  unchanged (R1); `negyzetes` slot unchanged for all three; egyszinu uses mask knock-outs.
  Layout: one line up to the width budget; longer names (40+ chars) break at the space nearest the middle into two lines, then shrink —
  never cut. Styles: name only · small circle (második colour) + name · square with the initial + name. Variants (gepezet 13):
  `vilagos` = name in fő (via `olvashato` against white), `sotet` = name in háttér/white on dark, `egyszinu` = black (images tint it white when needed; `atlatszo` = true),
  `negyzetes` = the initial in a fő square (letter in `raIrt(fo)`), no name. No drawn pictures, no AI images.
- `apps/kepgyar/src/betu-utvonal.ts` (fontkit over `tools/vizual/referencia/betuk-munkater` + custom data URLs) and `POST /nevlogo`
  `{ nev, stilus, szinek, betu, sajat_betu? }` → `200 { valtozatok: { vilagos: { svg, png }, sotet, egyszinu, negyzetes } }` (PNG from
  Chromium with `omitBackground: true`, 1200 px wide; negyzetes 1024×1024). Add fontkit to `apps/kepgyar/package.json`; build the image on the Gigabyte.
- `packages/fajl-core` — `svg` in `FajlTipus` for machine writes only (1.6); `GET /api/arculat/fajl/[id]` SVG headers.
- `apps/web/arculat/nevlogo.ts` — generate + store 8 files (`eredet='gep'`) + `nevlogo_stilus` + approve; `regeneral(szervezetId)` hook
  called by `POST /api/arculat/szinek` and `POST /api/arculat/betuk` (cím font) when the newest file of any slot is `eredet='gep'`.
- API: `GET /api/arculat/nevlogo/[stilus]` (tag) → `200 image/png` (the vilagos variant alone, for the phone list); `POST /api/arculat/nevlogo`
  (szerkeszto) `{ stilus }` → `200 { logok }`; `POST helyzet-minta` gains `nevlogo: { stilus }` (the candidate's PNGs rendered server-side, not stored).
- 12g `apps/web/app/fiok/arculat/nevlogo/page.tsx` + `Nevlogo.tsx`: desktop three logos each on its own ready image; phone the three
  logos stacked and the chosen one's two images below; tap + "Ez legyen" → four slots filled, back to 12c; quiet "A négy helyre mi tesszük.";
  quiet link "Inkább feltöltöm" → 12f.
- Turn on "Nincs logóm" in 12a (K3 page) and 12f (K1 page) → `/fiok/arculat/nevlogo`.
- Migration `0139_r16_nevlogo_feliratok.sql` — 5 labels.
**Self-test:** probes `vizual-core/probak/nevlogo.proba.ts` with a fake port (fixed advance widths): "Ördögh Ősz Árpád Kft.", "Știință și Țară SRL",
a 44-char name → two lines, nothing outside the viewBox; three styles × four variants valid SVG (parse with a tiny XML check, no `<text>`,
no `<script>`); kepgyar smoke (on the Gigabyte): the three names render with every accent from the latin-ext file (compare glyph ids
≠ `.notdef`); `apps/web/probak/r16-nevlogo.proba.ts` (8 rows written, `eredet='gep'`; regeneration writes new rows only when the newest is `gep`; an uploaded logo is never touched).
Live: Cipó Pékség test workspace without logo → 12a "Nincs logóm" → 12g shows three name logos with Gelasio/Meleg colours on ready images →
"Ez legyen" → 12c Logók row shows four slots; switch colours to Friss in 12d → the name logo is regenerated in the new colours; an uploaded logo
afterwards replaces the vilagos slot and is NOT regenerated; phone 390; LAPOK `("arculat-nevlogo", "/fiok/arculat/nevlogo")`; Tibor gate green.

### K7 — the found logo saved as a file (gepezet 10) + switch-over + cleanup of the absorbed box (gepezet 11)

**Effort:** medium (~3 h). Last.
**Files:**
- `packages/letolto/src/index.ts` — new `nyersBajtok(cim, { maxBajt: 2_000_000, engedettTipus: /image\/(png|jpeg|webp|svg\+xml)/ })`
  with the same SSRF protection as `nyersSzoveg` (public address check per redirect, time limit) — today the letöltő only returns text.
- `apps/kepgyar` `POST /svg-png { adat: data URL, szelesseg? }` → PNG (Chromium renders the SVG as an `<img>`: no script, no network) — many sites use SVG logos and `fajl-core` refuses SVG.
- `apps/web/onboarding/arculat.ts` — after `sajatSzinek`: set `forras_cim`, `szin_forras = "honlap"`, `szin_jeloltek`; download `logo` →
  (svg → kepgyar PNG) → `fajlTar.ment` with `cel='logo'`, `logo_valtozat='vilagos'`, `eredet='honlap'`, only if the workspace has no logo file (R7).
  Any failure is silent to the user (the first setup must never stop because of it) and logged.
- **Switch-over:** `apps/web/app/fiok/Fiok.tsx` — the `<details>` "Vizuális arculat" (draft card + `ArculatBlokk` + `ArculatAnyagok`) is
  replaced by one entry row to `/fiok/arculat` (the section title `r16.arculat.szakasz` + existing `fiok.arculat_megnyitas`); `arculatValtozik`
  and the 800 ms whole-arculat PUT are removed from Fiok (the R2 guard stays on the endpoint). `ArculatBlokk.tsx` stays in the tree
  unreferenced with a "RETIRED (R-16 K7)" header, like the old `Kezdolap.tsx`/`Poszt.tsx` (deleting is Csilla's click). All "Vissza"/"Mégse" return to `/fiok/arculat`.
- `tools/tibor-proba/tibor_proba.py` `LAPOK` final list; `alap.json` refreshed with `--frissit` only after green.
**Self-test:** `apps/web/probak/letolto.proba.ts` extended (binary, redirect to a private IP refused, > 2 MB refused, text/html refused);
`r16-honlap-logo.proba.ts` (no logo file → saved as vilagos/honlap; existing logo → untouched; download error → onboarding proceeds).
Live: new registration for a company with a public site and a PNG logo → 12b shows its logo, "Honnan?" shows the site; one with an SVG logo → PNG stored;
`/fiok` shows the entry row, no draft box; the full Tibor run (all LAPOK), `zar.py` green, nothing worse than `alap.json`; screenshots to Csilla.

### K8 — labels (`r16.arculat.*`, 84 keys × hu/ro/en) — shipped inside the chunks

Every key comes from `design/R16-arculat/feliratok.json` verbatim (hu, ro, en), as a NEW migration per chunk (an applied migration is never
edited), `INSERT … ON CONFLICT (kulcs, nyelv) DO UPDATE` like 0133. Split (checked by script: 14 + 35 + 21 + 9 + 5 = 84, no key missing, none extra):

| Migration | Chunk | Keys (prefix `r16.arculat.`) |
|---|---|---|
| **0135** `_r16_logo_helyek.sql` (+ the `arculat_fajl` columns) | K1 | `logok.kerdes` `logok.alcim` `logok.vilagos` `logok.sotet` `logok.egyszinu` `logok.negyzetes` `logok.feltoltes` `logok.valasztas` `logok.huzd` `logok.melyik_hova` `logok.melyik_hova_szoveg` `vissza` `igy_nez_ki` `masik_minta` (14) |
| **0136** `_r16_arculat_szakasz_feliratok.sql` | K3 | `szakasz` `ures.kerdes` `ures.alcim` `talalt.kerdes` `talalt.alcim` `talalt.honnan` `igen` `kesz.kerdes` `kesz.jovahagyva` `kesz.jovahagyva_rovid` `kep_keszitese` `logo` `logok` `szinek` `betuk` `csere` `logo_meg_nincs` `logo_feltoltes` `jo_logo_nelkul` `tobb_logo` `fajlok_sor` `fajlok_db` `fajlok` `szin.fo` `szin.masodik` `szin.hatter` `betu.cim` `betu.szoveg` `betu.eros` `betu.tiszta` `betu.modern` `betu.hivatalos` `betu.klasszikus` `ez_legyen` `megse` (35 — `ez_legyen`/`megse` here because K4, K5 and K6 all use them and may ship in any order) |
| **0137** `_r16_szinek_feliratok.sql` | K4 | `szin.ful_fo` `szin.ful_masodik` `szin.ful_hatter` `szin.kerdes_fo` `szin.kerdes_masodik` `szin.kerdes_hatter` `szin.logobol` `szin.mas` `szin.erintsd` `szettek.kerdes` `szettek.alcim` `szettek.alcim_rovid` `szettek.mas` `szettek.logobol` `szettek.honlaprol` `szettek.termeszetes` `szettek.meleg` `szettek.friss` `szettek.megbizhato` `szettek.elegans` `szettek.jatekos` (21) |
| **0138** `_r16_betuk_feliratok.sql` | K5 | `betu.kerdes` `betu.ful_cim` `betu.ful_szoveg` `betu.sajat` `betu.sajat_tipus` `betu.sajat_nev` `betu.hiba_tipus` `betu.hianyzo_betuk` `betu.licenc` (9) |
| **0139** `_r16_nevlogo_feliratok.sql` | K6 | `nincs_logom` `keszit.kerdes` `keszit.alcim` `keszit.negy_hely` `keszit.inkabb_feltoltom` (5) |

Existing keys reused, no new ones: `arculat_fajl.*` (upload errors, replace confirmation), `onboarding3.*` / `fiok.*` (Részletek fields,
approver line, Visszavonás, the /fiok entry row). The `melyik_hova_szoveg` text is the label file's ("…a legközelebbit tesszük"), not the
drawing's sample-specific one ("a zöld képekre"). A label probe per chunk: every `t("r16.arculat.…")` used in the chunk's code exists
in its migration in all three languages (grep-based, like the existing felirat probes).

---

## 3. Module boundaries

| Package / place | Owns | Must not |
|---|---|---|
| `@km/contracts` | `ArculatTervezet` (+ `logok`, new fields, the read-time transform), `LogoValtozat` | contain rules beyond parsing/defaults |
| `@km/profile-core` | the arculat state machine: modify, approve, modify+approve, merge guard (R2), `logok` recording | know files, images, fonts |
| `@km/fajl-core` | file types, content detection, cel↔type rules, slot resolution `hasznaltLogok`, its own `LogoValtozat`/`FajlEredet` vocabulary | interpret `elemzes`; import arculat-core or vizual-core |
| **`@km/arculat-core` (new)** | logo analysis + batch slot assignment, the six sets, trade→mood, ring, colour suggestions, builtin font list + mood words, legacy font-key mapping, accent check via the `VanKarakter` port | import fontkit, canvas, fajl-core, vizual-core (modules do not know each other — the host passes plain data) |
| `@km/vizual-core` | image HTML: logo choice per background, readable text, two fonts, custom `@font-face`, name-logo SVG layout via the `BetuUtvonal` port | import fontkit (the port is implemented by the kepgyar) |
| `@km/letolto` | protected downloads, now also bytes | — |
| `apps/kepgyar` | Chromium rendering, fontkit glyph port, `/nevlogo`, `/svg-png` | reach the database or the NAS disk (everything arrives in the request) |
| `apps/web/arculat/` (new host module) | view model, atomic save+approve, default set, fontkit font check, name-logo storage | import `apps/web/profil/index.ts` or `apps/web/vizual/*` (see below) |

**`pnpm hatar` today: exactly 2 errors (measured on `main`), both `nincs-kor`:** `vizual/helyzet.ts → profil/index.ts → vizual/peldak.ts → vizual/helyzet.ts`
and `profil/index.ts ↔ vizual/peldak.ts`. They come from `profil/index.ts` importing `peldakatFrissit`. Rules to not make it worse:
new code imports `apps/web/profil/tar` (which imports nothing from vizual) — never `apps/web/profil` (index); `apps/web/arculat/*` may be
imported by `vizual/helyzet.ts` (for the default set) but must not import `vizual/*` itself; route handlers are leaves and may import both.
The acceptance line for every chunk is "2 violations, the same two". (Fixing them — moving `peldakatFrissit` behind an event — is not in R-16.)
Other traps: (1) `vizual-core` imports with `.ts` extensions (`allowImportingTsExtensions`), so `apps/web` must NOT import it (its tsc and
Next config are not set up for that) — that is why the web-side rules live in `arculat-core`, which uses plain imports; (2) `vizual-core`
has no named dependency-cruiser rules today (only the generic `core-csomag-nem-hasznal-react-next-adatbazist`) — K2 adds the three
MODULSZABALY rules for it too, so fontkit can never slip into it; (3) the root `Dockerfile` COPY list must name `packages/arculat-core`
(`dockerfile-or.mjs` fails otherwise); the kepgyar Dockerfile is not checked by it — build it on the Gigabyte after K2, K6, K7.

---

## 4. Open choices I made (no questions back)

1. **Own route `/fiok/arculat` (+ `/logok`, `/szinek`, `/szinek/mas`, `/betuk`, `/nevlogo`)** instead of rendering 12a–c inside /fiok: the drawing's screens are full pages with the section as the page question (T1), and an own URL is measurable by the Tibor gate. /fiok gets one entry row (K7) — the only element not on the drawing, and it only links.
2. **Screens dark until K7:** every chunk ships without changing what Tibor sees; dead-end links exist only on pages nobody can reach yet.
3. **Logos resolved from `arculat_fajl` per slot, newest wins** (A5 rule extended); `tervezet.logok` is a record written at approval, `logo_fajl_id` kept as a mirror for rollback safety.
4. **Read-time schema migration, no jsonb SQL rewrite:** stored JSON is never modified, which is the only zero-loss option for snapshots.
5. **Logo analysis in the browser (canvas) + pure arculat-core**, stored in `arculat_fajl.elemzes`: no native dependency on the NAS, no kepgyar dependency at upload time, and the transparency flag is needed later for tinting.
6. **Batch collisions go to the next compatible empty slot** (negyzetes only for ≈ square, egyszinu only for ≤ 2 colours) — the literal "next empty" would put a wide colour logo into "Négyzetes".
7. **`negyzetes` is not used on the seven images:** they place the logo in a 12-unit high strip where a square mark reads worse than the wide one; it is kept for profile pictures and later B3 sets.
8. **Dark-ground fallback = tint (only for transparent logos) → light plate → name**, so a workspace with one logo never "loses" it on the coloured image.
9. **12f is the only place for logos; "Fájlok" keeps manual, references, documents** (the old logo field's history is visible in 12f per slot via its replace confirmation; nothing is removed from storage).
10. **Every "Ez legyen" and every Részletek edit = one server call that saves and approves** (kerdesek 4), in one transaction with a row lock, without regenerating the example texts.
11. **Stale-write guard on the old PUT** (R2) instead of trusting the old box to behave until K7.
12. **Exactly six proven sets** (the labels name six); values defined here and measured against `valtozatok()`; the 09-28 list was not found in the repo or project docs.
13. **Trade → mood by keyword stems on name + summary, no AI call:** deterministic, free, testable; the profile has no trade field.
14. **The default set is used by the section AND by `kepArculat` when there is no tervezet**, so Képek is never grey either (gepezet 12a, Vilmos 09-28).
15. **12b** when not approved and a logo exists or the colours came from the site; its alcím and "Honnan?" only with a known site address (no claim we cannot back).
16. **Viewer role:** read-only rows, primary "Kép készítése" (T2 needs one primary).
17. **Font choice list = the five image fonts with the drawing's mood words;** legacy Georgia → Gelasio, Cairo/Tajawal → Public Sans (V-2: no RTL).
18. **fontkit, not opentype.js** (WOFF2); used in the web (font check) and the kepgyar (glyph outlines).
19. **Custom fonts travel to the kepgyar as data URLs in each request;** the 10 MB cap from gepezet 8 stays; kepgyar body limit raised to 64 MB. A hash-keyed cache in the kepgyar is a later optimisation, not R-16.
20. **Name-logo SVG stored (machine-only `svg` type, CSP on serving); images use the PNG.** Uploaded SVG stays refused.
21. **Regeneration only when the newest file of a slot is machine-made;** it adds rows, never replaces.
22. **Site SVG logos are rasterised in the kepgyar** (Chromium `<img>`: no script, no network) before storing.
23. **Preview requests are coalesced in the browser** (one in flight per image) — the kepgyar renders one image at a time.
24. **Snapshot history is not capped** (capping = deleting); size is watched by the parse check.
25. **`ArculatBlokk.tsx` is retired in place, unreferenced** (repo precedent), not deleted.

---

## 5. Things in the code that make a gepezet item unrealistic as written

- **gepezet 13 "opentype.js":** cannot read WOFF2 (measured: throws), and the image maker's fonts are WOFF2 split into latin / latin-ext subsets
  (measured: `Ő Ș ț ă` only in latin-ext). → fontkit + per-glyph file choice. Not in the offline pnpm store → one networked `pnpm add`.
- **gepezet 9 "~1 s":** the kepgyar renders ONE image at a time (`sorban`). 12d needs 4 images and 12g 3 at once, so those screens take
  several seconds to fill; ~1 s is only plausible for a single re-render (12d2, 12e tap). Unmeasured — K2 measures it.
- **gepezet 10:** `@km/letolto` returns text only (no binary download), and many sites serve an SVG logo which `fajl-core` refuses → new
  `nyersBajtok` + rasterising in the kepgyar.
- **gepezet 6 "szakma → hangulat":** there is no trade field anywhere in the profile → keyword heuristic on the summary.
- **gepezet 4 "egyszinu fehérre színezve (átlátszó PNG-nél)":** nothing today records whether a logo is transparent → the analysis must be stored (`elemzes`); legacy logos are treated as opaque (plate instead of tint).
- **gepezet 5:** mostly exists (`legjobb`, `paletta` pick white/dark text); the real gap is the main colour used as TEXT on a light ground in the
  `vilagos` variant, which `vizsgal` never checks ("a jóváhagyott arculat ezt már ellenőrizte") — no longer true once Tibor taps any ring colour.
- **gepezet 8:** "@font-face … a képgyártó munkatér-mappájából" is not possible — the kepgyar runs on the Gigabyte with no access to the NAS
  disk → data URL per request. Also `ArculatAnyagok.tsx` types `Record<FajlCel, …>`: adding `betu` breaks the build unless it is updated in the same change.
- **gepezet 2 "a pillanatképekben is" migration:** snapshots sit in jsonb inside `szervezet_profil.adatok`; and a parse failure there silently
  nulls the whole profile (`profilTar.betolt`) — hence the read-time migration and the R1 check instead of an SQL rewrite.
- **Not in gepezet, found:** the old page-12 box writes the whole arculat from stale state (R2); the drawing has not yet been through the
  Tibor-bíráló (precondition); `e-a5` is not an ancestor of `main` in the cloud copy.
