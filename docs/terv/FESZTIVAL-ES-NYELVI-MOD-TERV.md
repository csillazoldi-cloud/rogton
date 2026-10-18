# Build plan — Festival organisers, organisation type + category, on-site photo album, post language mode

- **Requested by:** Csilla (product lead), 2026-10-17. **Plan written:** 2026-10-17 by the planning agent (read-only on the repo).
- **Status:** implementation PROPOSAL (rule 12). Nothing here is a requirement until Csilla says so. Open questions are in section 11.
- **Requirements touched:** R-01 (industry-independent, client specifics in configuration), R-10 (configurable steps and fields),
  R-14/R-15 (UI, communication and material languages are separate settings), A-02, A-04, A-11, A-13, A-14, A-16.
- **Notation:** **[V]** = verified in the code on 2026-10-17 (path cited). **[A]** = assumed, to be measured in the chunk that depends on it.
- **Base:** highest migration in the repo is `0171_r18_kor8_feliratok.sql` **[V]** (HANDOFF says round 8 is NOT pushed yet). The
  migration numbers below are provisional. Number them at build time in build order, and never reuse a number.

---

## 0. Summary

We make the workspace serve festival organisers next to companies without making the company path any longer. The organisation gets
a **type** (`ceg` | `fesztival`) and, for companies, a **category** from the existing closed list (`vizual/minta-kategoria.ts`). The AI
pre-fills both inside the call that already reads the company in setup. The user sees one pre-filled line and only gets asked when the
machine is unsure. The category replaces the hospitality regex (`profil/kinalat-szabaly.ts:8-11`), and the regex stays as the fallback
detector. Festivals get "Mikor és hol lesz?" and "Ez a programod?" in place of offer/menu/prices. The programme is read from a link, PDF
or photo with the same machinery as `listatOlvas` / `onboarding/kepolvaso.ts`. It is stored in a **new tenant-isolated table**, because
it is large, edited row by row, and queried by date. Festival topics (countdown, today/tomorrow, performer, album, thank-you, practical
info) are anchored to programme dates and surface as one-tap ideas. A **post language mode** (`egy` | `egyben` | `kulon`) is chosen at
setup for every org type. "Both languages in one post" is a **view and copy over the two existing per-language cells**, not a new kind
of storage. That way switching mode can never lose text. The image toggle follows the org's second language (`profil.nyelvek[1]`). The
**on-site photo album** is in round 1: phone-side downscaling, a separate low-footprint store with per-tenant limits, a cheap low-detail
vision pick, and share or ZIP download. The top risk is losing profile data. A safety-net chunk (F0) ships alone, first.

| Id | Name | Size | Depends on | Deployable alone? |
|---|---|---|---|---|
| F0 | Profile safety net (forward-compatible schema, merge writes, re-approval keeps everything) | S | — | Yes. No visible change |
| F1 | Org type + category: model, detection, regex → fallback | M | F0 | Yes. Companies behave the same (proved by tests) |
| F2 | Language mode: model + second-language helper (backend) | S | F0 | Yes. Default = today's behaviour |
| F3 | Bilingual post: setup step, Settings switch, generate, join, edit, copy, limits | L | F2 | Yes |
| F4 | Images follow the org's second language | S | F2 | Yes |
| F5 | Programme data + reading (table, module, prompt) | M | F0, F1 | Yes. Backend only |
| F6 | Festival setup flow + type/category line + Programod editor | L | F1, F3, F5 | Yes |
| F7 | Festival topic plan, programme in prompts, fact guard | M | F6 | Yes |
| F8 | Naptár / Kezdőlap anchoring to programme dates | M | F7 | Yes |
| F9 | Album storage backend (file purpose, limits, quota, backup) | M | F0 | Yes. Backend only, NAS change |
| F10 | Album UX: phone upload, AI pick and order, album post, share/download | L | F9, F3 | Yes |
| F11 | Festival sample photo category (`rendezveny`) | S | F1 | Yes (needs a photo from Csilla) |

Recommended build order: F0 → F1 → F2 → F3 → F4 → F5 → F9 → F6 → F7 → F8 → F10 → F11. F9 can run in parallel with F5. Each chunk is
pushed alone, and the next push waits until the previous one is live (robot trap: two pushes within ~2 minutes).

---

## 1. Data model

### 1.1 What exists today, and the three latent data-loss traps found while reading [V]
1. `profil/tar.ts betolt` runs `SzervezetProfil.safeParse(sor.adatok)` and **returns `null` on any parse failure**. Every caller treats
   `null` as "no profile": the setup page redirects to `/onboarding` (`app/onboarding/beallitas/page.tsx`), and `kinalatotOlvas`
   returns null. So one bad enum value in a new field makes a live org look un-onboarded.
2. `SzervezetProfil` is a plain `z.object` (contracts `:352-388`), which **strips unknown keys** on parse. If a deploy is rolled back,
   the next save by the old code silently deletes every new field.
3. `onboarding/jovahagyas.ts` keeps an explicit **whitelist** of previous-profile fields on re-approval (`hivatalos_nevek` + the
   round-7 list). Any new field not added to it is lost when someone re-approves.
4. Also: `profilTar.ment` rewrites the whole `adatok` jsonb. A background writer and a user save can clobber each other.

### 1.2 Org type and category (profile jsonb, all optional)
In `packages/contracts/src/index.ts`:
- `SZERVEZET_TIPUSOK = ["ceg", "fesztival"]`, plus `szervezetTipus(x: unknown): "ceg" | "fesztival"`, a normalising reader on the
  `mintaKategoria` model where unknown = `ceg`.
- `KATEGORIAK`: **moved** from `apps/web/vizual/minta-kategoria.ts` into contracts as the single source. `minta-kategoria.ts`
  re-exports it, and its function names and behaviour stay unchanged. Still the same list as `apps/kepgyar/src/minta-foto.ts`
  (`epites, vendeglatas, bolt, szepseg, iroda, muhely, kozlekedes, kert` + `semleges`). Round 1 adds `rendezveny`, used for
  festivals' sample photo only (F11).
- New `SzervezetProfil` fields: `szervezet_tipus?: string`, `kategoria?: string`, `tipus_forras?: MezoForras` (`ai` / `sajat`).
  They are stored as **plain strings and read through the normalisers**, never as `z.enum`, so a bad value can't trigger trap 1.
- `rendezveny?: { nev?, mettol: "YYYY-MM-DD", meddig: "YYYY-MM-DD", hely?: {hu?, ro?, en?}, belepo?: string }` (festival only, small).
- Pure function `kategoriaOf(profil)`: stored `kategoria` → else `vendeglatas` if the existing `vendeglato()` regex matches
  `nev + osszefoglalo` → else `semleges`. **This replaces every `vendeglato(...)` call site**: `app/onboarding/beallitas/page.tsx:34`,
  `onboarding/kinalat.ts:56,170`, and the `TARTALEK` choice in `kinalat-szabaly.ts:96-145`. A hospitality org today is a hospitality
  org tomorrow, with no write needed.
- `szervezet.iparagi_csomagok` (0126) is left alone. It is a feature-package switch (`kozlekedes` = transport notice), not a category.

### 1.3 Post language mode (profile jsonb)
- `poszt_nyelv_mod?: string`, read by `nyelvMod(profil)`. Missing → `kulon` if `nyelvek.length ≥ 2`, else `egy`. That is exactly what
  existing orgs have today.
- `masodikNyelv(profil): Tartalomnyelv | null = profil.nyelvek[1] ?? null`. The order of `nyelvek` is the order of the joined post.
- No change to `PosztSzoveg`/`szovegek[]`. A bilingual post = the `hu` cell + the second-language cell of the same surface, joined at
  view and copy time (section 5).

### 1.4 Programme items — recommendation: a NEW TABLE, not profile jsonb
Why: the Zilele Târgumureșene 2026 programme (a real file, `~/saas/Program_ZILELE_TARGUMURESENE_2026_bilingv_RO-HU_update_22_06_2026_cu enescu.docx`,
measured: 271 paragraphs, 154 timed lines ≈ 77 bilingual timed items, plus all-day and whole-event items) is ~40–60 KB of bilingual
jsonb. In the profile, it would be (a) loaded and re-written on every profile save (trap 4 with a big blast radius), (b) loaded by every
post prompt via `profilSorok`, (c) unqueryable by date for the Naptár, and (d) not editable row by row by two people at once. A table
gives row-level edits, soft delete, and date indexes, and keeps the profile small.

Migration **0172_fesztival_program.sql** (additive only, `IF NOT EXISTS`, same RLS pattern as `0152_vz1_kozlemeny.sql`):
```
program_tetel(
  id uuid PK default gen_random_uuid(),
  szervezet_id uuid NOT NULL → szervezet(id) ON DELETE CASCADE,
  nap date NULL,              -- NULL = for the whole event ("Pe tot parcursul evenimentului")
  kezdes time NULL,           -- NULL = all day ("Egész nap folyamán")
  vege time NULL,             -- "18:00–20:30"
  nev jsonb NOT NULL,         -- {"hu": "...", "ro": "..."}; at least one non-empty (CHECK)
  leiras jsonb NOT NULL DEFAULT '{}', helyszin jsonb NOT NULL DEFAULT '{}',
  fellepo text NOT NULL DEFAULT '',
  fajta text NOT NULL DEFAULT 'egyeb' CHECK (fajta IN ('koncert','eloadas','gyerek','jatek','workshop','kiallitas','gasztro','vasar','unnepseg','egyeb')),
  kep_fajl_id uuid NULL → arculat_fajl(id) ON DELETE SET NULL,
  jegy text NOT NULL DEFAULT '',
  bizonytalan boolean NOT NULL DEFAULT false,  -- the machine could not read it surely ("10:00???????")
  aktiv boolean NOT NULL DEFAULT true,          -- unticked = never post about it
  forras text NOT NULL DEFAULT 'gep' CHECK (forras IN ('gep','sajat')),
  modositva boolean NOT NULL DEFAULT false,     -- a person edited it: a re-read never overwrites
  torolve timestamptz NULL, letrehozva/frissitve timestamptz NOT NULL DEFAULT now())
INDEX (szervezet_id, nap, kezdes)
GRANT SELECT, INSERT, UPDATE ON program_tetel TO km_app;  -- no DELETE (soft delete only)
ENABLE ROW LEVEL SECURITY; POLICY program_tetel_sajat_szervezet (same USING/WITH CHECK as kozlemeny_sorszam)
```
App cap: 400 items per org. Mirror the table in `adatbazis/sema.ts` with `pgPolicy(...).enableRLS()` like `arculatFajl`.

### 1.5 Photo album storage
- New file purpose `album` in `@km/fajl-core` (`host.ts FajlCel`, `CEL_TIPUSOK.album = ["jpg","webp"]`, `ALBUM_MAX_MERET_BAJT = 2.5 MB`).
  Bump the module version and update `docs/FAJL-SZERZODES.md`. Meta rows go into the existing `arculat_fajl` table (`cel` is
  `text NOT NULL` with no CHECK in `0049_arculat_fajl.sql` **[V]**). The bytes do NOT go under `FAJL_MAPPA`. They go in a separate
  folder `ALBUM_MAPPA=/adatok/album` (new compose volume `./adatok/album`), because `nas/mentes.sh` step 4b tars all of `FAJL_MAPPA`
  **every day** and keeps 7 daily + 4 Sunday copies **[V]**: every album photo would be stored about 11 times.
- Migration **0176_album_index.sql**: `CREATE INDEX IF NOT EXISTS arculat_fajl_szervezet_cel ON arculat_fajl (szervezet_id, cel)`
  for the quota sum. Two files per photo: `nagy` (≤ 2048 px long edge) and `kicsi` (≤ 512 px, for the grid and the vision call). The
  `kicsi` row points at its `nagy` row through `elemzes: {par: <id>, kicsi: true, keszult: <capture time>}` (reuses the existing jsonb
  column; no new column).
- The album's choice and order live on the post: `TipusAdat.album.fotok?: [{fajl_id, leiras}] ≤ 20` (optional, next to today's
  `kepek` shot descriptions, which stay for posts without photos). An optional `program_id?` on the post `forras` links an album to a
  programme item.

### 1.6 Migrations (provisional numbers)
| # | Purpose | Chunk |
|---|---|---|
| 0172 | `program_tetel` table + RLS + grants | F5 |
| 0173 | labels: language mode, bilingual post, second-language image labels | F3/F4 |
| 0174 | labels: org type, category names (HU/RO/EN), festival setup, Programod | F6 |
| 0175 | labels: festival topics, anchored ideas, Naptár ghost rows | F7/F8 |
| 0176 | index `arculat_fajl (szervezet_id, cel)` | F9 |
| 0177 | labels: album upload, pick, share, limits | F10 |

### 1.7 Backfill for existing orgs — "zero writes to existing rows"
No migration rewrites `szervezet_profil.adatok`. Existing orgs get their values **at read time**: type = `ceg`, category =
`kategoriaOf()` (the regex fallback today, so identical behaviour), mode = `kulon`/`egy`. A value is written only when a person confirms
it (setup, or Szervezet adatai / Beállítások), through the merge write from F0. Before and after F1, a read-only count on the NAS DB
(the number of orgs for which `vendeglato()` is true vs `kategoriaOf() = 'vendeglatas'`) must be equal. Run it from the Gigabyte with
the `nas` alias, `aitmetica-saas-db` named explicitly.

---

## 2. Setup flow per type

**Part A (`/onboarding`, `ElsoBeallitas.tsx`) — the same for both types.** Name, website, "Mivel foglalkoztok?" → the machine works →
review ("atnezes"). Only change: the existing AI call that writes the review proposals (`onboarding/javaslatok.ts`, prompt
`javaslatok.hu.md`) returns three more keys: `szervezet_tipus`, `kategoria`, `biztos` (true/false). No extra call and no extra cost,
the same trick as c15. The values go to `onboarding_piszkozat.adatok.bemutatkozas` and are copied at approval
(`profilPiszkozatbol` in profile-core). Regex fallbacks when the AI is off: the hospitality regex → `vendeglatas`, and a festival regex
(`fesztivál|festival|napok|zilele|days|rendezvény|programul|program`, HU/RO/EN) → `fesztival`.

- Review page, inside the existing "Rólatok" card (`ElsoBeallitas.tsx:676-716`): **one quiet pre-filled line** at the top, with no box,
  badge or button (T6): "Cég · Építőipar" or "Fesztivál / rendezvény". It is changed under the card's existing "Átírom" with two choice
  rows plus the category chips (for Cég). **Only when `biztos === false`** does the card open with one plain question: "Cég vagytok,
  vagy fesztivált szerveztek?" with two answers, nothing else (Q1). Companies get **zero extra taps and zero extra screens**.

**Part B (`/onboarding/beallitas`, `Beallitas.tsx`; steps fixed at line 78 [V]).**

| Cég (today, unchanged) | Fesztivál |
|---|---|
| kinalat "Ezt kínáljátok?" | **rendezveny** "Mikor és hol lesz?" (dates + town pre-filled from the site/description; an optional quiet line "Belépő: …") |
| lista "Van étlapod?" / "…szolgáltatás-listád?" (title by `kategoriaOf` = vendeglatas, not the regex) | **program** "Ez a programod?" (read list grouped by day; Link · PDF · Fotó · "Nincs még, később") |
| arak (only if there is a list) | — (prices → the optional `belepo` line and per-item `jegy`) |
| **nyelvmod** "Hogyan posztoljunk két nyelven?" — only if `nyelvek.length ≥ 2` (Q2) | **nyelvmod** — same rule; pre-selected "Egy posztban mindkét nyelv" |
| oldal "Hol posztolsz most?" | oldal |
| temak "Ezekről érdemes posztolnod" | temak (festival topic set, section 4) |

- The step list becomes `lepesekFor(tipus, vanLista, nyelvekSzama)`, a pure function with a unit test. A one-language company sees
  exactly today's five steps (asserted by a test). The counter keeps "3 / N. lépés".
- "Ez a programod?" shows days as collapsed rows ("Csütörtök, jún. 25. · 9 program"). The first day is open, and each row shows
  time · name · venue. Tapping a row opens the edit sheet: name (second-language name pre-filled underneath), day, start–end, venue,
  kind chips, performer, short description, photo. An uncertain item gets one quiet line: "Ezt nem tudtuk biztosan kiolvasni" (T7: not
  red). One primary button: "Rendben". Re-reading never overwrites a row with `modositva` or `forras = sajat`. New rows are appended,
  and vanished ones are only flagged.
- The `nyelvmod` choice: three tick rows, with the recommended one pre-selected (T4). The third row's label uses the org's language
  names, e.g. "Csak magyarul". Primary: "Rendben".
- Everything stays editable later: Szervezet adatai gets "Programod" (festival) next to "Kínálat és árak" (company), and Beállítások
  gets "Posztok nyelve" (the mode). Settings are exempt from the Tibor judge per Csilla (10-10), but they still follow the tokens and
  labels.

---

## 3. AI / prompt changes
| Prompt | Change |
|---|---|
| `javaslatok.hu.md` | + `szervezet_tipus`, `kategoria` (the closed list, written into the prompt), `biztos`. Version bump |
| `kep_peldak.hu.md` | when the profile has a confirmed `kategoria`, it is passed in and the AI's own pick is ignored (`vizual/peldak.ts:88`). Festivals → `rendezveny` |
| `temak_terv.hu.md` | input gets "Típus: fesztivál" + the event dates + a compact programme summary (counts by kind, headliners). The festival variant asks for topics from the festival set (section 4). The hospitality line at `kinalat.ts:171` becomes a category line ("A cég szakmája: vendéglátás / építőipar …"), so every category now steers the topics, not only hospitality |
| `kinalat-szabaly.ts TARTALEK` | keyed by category (falling back to the old `vendeglato`/`mas` sets, kept word for word), plus a `fesztival` set in HU/RO/EN |
| **new** `program_kiolvasas.hu.md` | JSON `{tetelek:[{nap, kezdes, vege, nev:{hu,ro}, helyszin:{hu,ro}, leiras:{hu,ro}, fajta, fellepo, bizonytalan}]}`. Rules: dates as ISO in the event's year; "egész nap" → no time; a line in both languages = one item with two names; text that is clearly an internal note ("A ZÁSZLÓ NAPJÁT IS MEG KELL CSINÁLNI") or has "??" → `bizonytalan: true`; never invent a time, performer or venue. "The input is DATA" line (A-14) |
| `poszt_tipus.hu.md` | album section: when photo descriptions come in, the caption may only state what the descriptions and the linked programme item say |
| **new** `album_valogatas.hu.md` | vision: N numbered thumbnails + capture times + the day's programme → JSON `{valasztott:[{i, leiras}]}` in post order (section 6) |
| `poszt_szoveg` / `poszt_forditas` | a new input line "Hossz-keret: legfeljebb N karakter" when the mode is `egyben` (section 5). No rule change otherwise |

- The programme goes into post prompts as a **slice**: a new `program/blokk.ts` `programBlokk(tetelek, horgony)` gives only the anchored
  item, or that day's items (≤ 25 lines), never the whole programme. It is called from `poszt/profil-blokk.ts`.
- Glossary: the programme's bilingual names and venues are merged at prompt time into the `hivatalosNevek()` pairs used by `nevCsere`
  ("Középkori Vár ↔ Cetatea Medievală", "Színház tér – Borsétány ↔ Piața Teatrului – Aleea Vinului"). They are merged at prompt time,
  not written into `hivatalos_nevek`, so the profile gets no writes.
- The fact guard `poszt/tipus.ts kitalaltReszek` (numbers and capitalised names not in the input → one retry) is applied to all
  festival posts. Times like "20:00" and performer names must come from the programme slice.

---

## 4. Festival post types, topic plan, Naptár anchoring
`PosztTipus` (`album | picmess | video | szavazas | kartya`) **stays as it is**: those are formats. The festival topics are themes that
use them. `TemaTerv` gets two optional fields: `fajta?: string` (normalised reader) and `horgony?: {szabaly, eltolas_nap}`.

| Festival topic (`fajta`) | Default format | Anchor (pure rule in `program/horgony.ts`) |
|---|---|---|
| `visszaszamlalo` countdown | kartya / picmess | event start −14, −7, −3, −1 |
| `holnapi_program` tomorrow's programme | picmess | each festival day −1 |
| `mai_program` today's programme | picmess | each festival day, morning |
| `fellepo` performer / act intro | picmess or video | headliners (main-stage evening `koncert` with `fellepo`), −3…−1, ≤ 1 a day |
| `gyakorlati` practical info (venue, parking, tickets) | kartya | start −5 and −1 |
| `album` on-site photo album | album | each festival day +1 |
| `koszono` thank-you recap | album or text | end +1 |

- `program/horgony.ts` (pure, no DB): `horgonyJavaslatok(rendezveny, tetelek, tema_terv, ma) → [{nap, fajta, program_id?, cim}]`,
  Europe/Bucharest days via `poszt/naptar.ts napKulcs/napHozzaad` **[V]**. At most 2 a day before the event and 3 a day during it.
  Idempotent key `program:<fajta>:<nap>[:<program_id>]` in `forras.azonosito`, so the same idea always opens the same post (the A-8
  pattern).
- **Where they appear (T9, one click to a post):** (a) the Kezdőlap idea cards. The existing max-3 list (`iranytu/otletek.ts`
  `OTLET_MAX = 3` **[V]**) is filled first with anchored ideas due within 3 days, then the iránytű ideas. (b) the Naptár gets quiet
  "ghost" rows on their date ("Holnapi program · javaslat") with one button "Megírjuk", which creates the `poszt_munka`
  (`forras.tipus: "terv"`) with `javasolt_nap` already set. Ideas are **not** stored as posts until tapped, so the post lists never
  fill up with machine junk.
- The image situation `esemeny` (`vizual/helyzet.ts:185`, cím/hol/mikor **[V]**) is pre-filled from the anchored item, so a performer
  post's image is one tap too.

---

## 5. Bilingual mode (all org types)
**Generation: recommend "write the first language, then translate", not one call writing both.** In `egyben`, `szovegetKeszit` writes
the first-language cell with a length budget, and then `forditastKeszit` (`poszt/index.ts:473-534` **[V]**, the HŰ translation, with
glossary and CTA handling) writes the second-language cell. Why: it reuses the tested translation path, the official names and the
`elavult_forditas` flag (`poszt/index.ts:191` **[V]**). Each half stays separately editable. The extra call costs the same as today's
"Más nyelven". One combined call would save that call but lose the stale tracking and make "edit just the RO part" ambiguous.

**Joined view and copy.** Pure function `ketnyelvuOsszefuz(a, b, felulet)` in `poszt/bemenet.ts`: each part's trailing hashtags are
stripped, the parts are joined as `A ⏎⏎ ——— ⏎⏎ B`, and the merged, de-duplicated hashtags are added once at the end. No flags as
separators (politically loaded in Transylvania). The order follows `nyelvek`: HU-first orgs get HU then RO, RO-first orgs (e.g. a
city hall) get RO then HU, as Csilla's default for HU orgs requires. "Kész, másolom" copies the joined text and finalises both cells.

**Limits** (`KARAKTERHATAR = {fb: 63206, ig: 2200, li: 3000, blog: 2500}` **[V]**). Budget per half =
`floor((limit − separator − hashtags) / 2)`, giving ~1050 for IG and ~1450 for LI. FB has no practical cap, but `LATHATO_HATAR.fb = 477`
means the first lines are the first language only, which is fine. The counter shows the joined total. On overflow, the machine is asked
once to shorten (never a silent cut), then one sentence: "Hosszabb, mint amit az Instagram enged". **Blog stays separate per language**:
a website has language versions, so blog is excluded from joining.

**Editing.** Edit the first part → the second gets `elavult_forditas = true` (existing). If the second part is still untouched machine
text (`allapot = javaslat`), "Kész, másolom" first refreshes it, with the visible "Írjuk…" state (Csilla 10-10: AI work must be
visible), then copies. If a person edited it, nothing is overwritten: one quiet line "A magyar rész változott." plus "Frissítem a
románt". Edit the second part → nothing else changes.

**Switching mode on an org with posts.** The mode only decides (a) whether a new post gets its second-language cell automatically and
(b) how the post page shows and copies it. Cells are never deleted or merged. Switching `egyben → kulon → egy → egyben` leaves
`szovegek[]` byte-identical (asserted by a test on fixtures that include edited cells). The "Más nyelven" menu (`R15Poszt.tsx:39`, hard-coded
`["hu","ro","en"]` **[V]**) becomes the union of `hu, ro, en` and the profile languages, so nothing is removed and other languages are added.

**Images (F4).** `Kitolto.tsx` gets `masik = masodikNyelv(profil)` from the page. "Román változat is" → a new label "{nyelv} változat
is". The toggle is hidden when there is no second language (no dead control). The preview switch and "Mit töltsünk le?" use the
language names. `vizual/melle.ts:69` `kepFordit` accepts only `hu|ro` and `:108` `kepForditMezok` accepts `hu|en|ro` **[V]**: both
take any `Tartalomnyelv`. `PosztForras.kep_beallitas.ro` stays (read as the second language when `masik_nyelv` is missing), and a new
optional `masik: {nyelv, ertek}` is written from now on. In `egyben` mode the toggle starts ON and the download defaults to "Mindkettő"
(T4). A single image carrying both languages is out of scope for round 1 (the transport notice's `lokal.nyelvek` tuple in
`vizual-core/marka.ts:131` shows it's possible later).

---

## 6. Photo album
**Phone upload UX.** In the album panel (Posztszöveg type chip "Fotóalbum"), "Fotók hozzáadása" opens the native picker
(`<input type=file multiple accept="image/*">`, without `capture`, so the gallery is offered). Each photo is decoded in the browser with
`createImageBitmap(file, {imageOrientation: "from-image"})` and re-encoded on a canvas to JPEG q≈0.82, as `nagy` ≤ 2048 px and `kicsi`
≤ 512 px. That takes a 4–8 MB phone photo down to ~0.3–0.9 MB **[A, measure]**. Re-encoding also **strips EXIF, including GPS**. The
capture time is read from EXIF (or `File.lastModified`) before stripping and is sent along as metadata. Uploads run one at a time, with
per-photo progress ("12 / 30 feltöltve") and 3 retries with backoff. Each photo is saved the moment it arrives (never all-or-nothing),
and coming back to the page shows what is already in. HEIC: iOS Safari hands JPEG to `accept="image/*"` and can decode HEIC itself
**[A, test on a real iPhone]**. If the browser can't decode a photo, one sentence is shown and the others continue.

**Server.** No image decoding in the 512 MB app container (`docker-compose.yml` mem_limit **[V]**; there is no `sharp` in any package
**[V]**). The endpoint checks type (magic bytes, `felismeres.ts`), size ≤ 2.5 MB, and JPEG dimensions from the SOF header ≤ 2048
(a small addition to `fajl-core`). nginx's 12 MB default body (`nas/nginx.conf:24` **[V]**) is enough.

**Limits (pilot defaults, Vilmos and Csilla can change them):** ≤ 40 uploads per album, ≤ 20 chosen into the post, ≤ 500 MB of album
storage per tenant (one sentence when full: "Megtelt a fotótár — a régi albumok fotóit töröld a Fájlok közül"), and at most 60 uploads
per 10 minutes per tenant. `nezo` (viewer) cannot upload. Retention: Q3.

**AI pick and order.** One vision call per album over the `kicsi` versions (`detail: low`) through `mellekletOlvas`
(`onboarding/kepolvaso.ts`). That call caps attachments at 6 today (`.slice(0, 6)` **[V]**), so a parameter raises it to 40 for this
task only. Prompt `album_valogatas`: drop blurred shots and near-duplicates; pick 8–10 (≤ 20); order wide shot → crowd → stage/act →
details → people → closing; never a close-up of an identifiable child as the cover; descriptions say only what is visible (no names
unless the linked programme item gives them). Cost: ~40 low-detail images ≈ ≤ 12k input tokens ≈ $0.003 at the `kutatas.ts` price
**[A, measure and put in the cost log]**. When the AI is unavailable (or in test mode): order by capture time and pick evenly spaced
shots. The step never blocks (the `kinalat.ts` pattern). Then the caption: the existing `poszt_tipus` album section, with the photo
descriptions and the linked programme item as facts. In `egyben` mode the caption is bilingual (section 5).

**Output and download.** The post shows the chosen photos as a reorderable strip (drag on desktop; "…" → "Előrébb / Hátrébb / Kiveszem"
on the phone, the Naptár pattern), with one primary button. On the phone, **"Megosztom"** copies the caption and opens the Web Share
sheet with the files in order (`navigator.share({files})`). Facebook and Instagram take them straight from there **[A, test on
Android and iOS]**. Without Web Share, the photos download one by one. On desktop, a ZIP is built server-side with the store method (no
compression, no new dependency, ~80 lines), with files named `01-…jpg`. All URLs are authenticated and tenant-checked. Album photos
never get public links.

---

## 7. Screens that need drawings (for the design agent)
| # | Screen | Must show | Tibor risks |
|---|---|---|---|
| D1 | Review "Rólatok" card with the type/category line + the unsure-case question | the quiet line; "Átírom" open state (2 type rows + category chips); the 2-answer question variant | adding a box or badge (T6); the question must not show when the machine is sure |
| D2 | "Mikor és hol lesz?" | dates + town pre-filled, optional belépő line, one primary | ≤ 40 words; date picker must fit 390 px |
| D3 | "Ez a programod?" + empty variant (Link · PDF · Fotó · Nincs még) | days collapsed with counts, first day open, uncertain line, one primary | ~80 items is a wall: days must collapse; no alarm colour for uncertain items |
| D4 | Programme item edit sheet | name + second-language name, day, start–end, venue, kind chips, performer, description, photo | too many fields: only name/time/venue above the fold, the rest behind "Részletek" |
| D5 | "Hogyan posztoljunk két nyelven?" | three tick rows, recommended pre-selected, one primary | jargon ("mód"); the third row named by language |
| D6 | Posztszöveg in `egyben` | joined preview (part A, separator, part B, hashtags once), one counter, the stale line + "Frissítem a románt", "Kész, másolom" | two editors look like two posts; the counter must not turn red (T7) |
| D7 | Kezdőlap anchored idea card + Naptár ghost row | "Holnapi program · jún. 26." card; ghost row with "Megírjuk" | ghost rows must read as information (T6), not as posts |
| D8 | Album: upload + progress, picked strip, reorder sheet, share | "Fotók hozzáadása", "12 / 30 feltöltve", the picked strip, "Megosztom" primary | the floating Visszajelzés button over the strip (T10); progress must feel good (T8) |
| D9 | Szervezet adatai → Programod; Beállítások → Posztok nyelve | list editor + re-read; the mode switch | settings: tokens/labels only, Tibor judge exempt |

Every drawing goes through `tools/tibor-proba` + `zar.py` (R-15 pages only green), and Tibor checks the drawing before any code.

---

## 8. Risks, ranked
1. **Profile read failure looks like "no profile" → redirect to onboarding → re-approval overwrites (DATA LOSS).** Mitigation (F0):
   new fields are plain strings behind normalisers; `betolt` logs and **keeps** unparseable new fields (it parses
   the known core and passes the rest through), and a test feeds a profile with a garbage `szervezet_tipus` and must get the profile back.
2. **Rollback strips new keys (DATA LOSS).** F0 makes `SzervezetProfil` `.loose()` (zod 4.5.4 **[V]**) and ships alone **before** any
   new field is written, so that version is already the rollback floor. Input schemas (`ProfilModositas`) stay strict, so clients still
   can't inject keys.
3. **Re-approval drops fields not on the whitelist (DATA LOSS).** F0 turns `jovahagyas.ts` into "previous profile first, then the
   draft's own fields over it", with a test listing every optional field.
4. **Concurrent full-jsonb overwrite.** F0 adds `profilTar.mezoMent(id, patch)` = `UPDATE … SET adatok = adatok || $1::jsonb` (inside
   `szervezetKent`). All new writes use it, and no background job writes to existing profiles.
5. **Mode switch loses or hides text.** The mode is view and generation only. The byte-identical round-trip test is in section 5.
6. **Re-translation overwrites a person's edit.** Only untouched machine text auto-refreshes. Tested with an edited RO cell.
7. **Programme re-read overwrites edits.** Rows with `modositva`/`sajat` are never updated by the machine. Soft delete only, no DELETE grant.
8. **NAS disk and backups balloon with photos.** Separate `ALBUM_MAPPA`, excluded from the daily tar; limits and quota. First a
   read-only probe (`df -h /volume2`, `du -sh …/adatok/*`) **[A: free space unknown]**. Changing `mentes.sh` and compose follows the NAS
   rules: explain, backup, go-ahead.
9. **NAS memory (16 GB, 27 containers).** No server-side decoding, sequential uploads, small files. `free -m`/`uptime` before deploy.
10. **Photos of people and children go to OpenAI (A-13, GDPR).** Low-detail thumbnails only, no EXIF, Adatkezelés text updated;
    Vilmos's sign-off; the local gemma on the Dell as the alternative **[A: vision ability of the installed gemma]**.
11. **Company setup grows / overcrowding.** One line, zero new steps for one-language companies (test on `lepesekFor`), and Tibor tools on D1/D5.
12. **Invented festival facts (times, performers).** Programme slice + glossary + `kitalaltReszek` + regression tests on Zilele data.
13. **Category replacement changes hospitality behaviour.** `kategoriaOf` falls back to the same regex; the equivalence count from 1.7.
14. **Joined posts over the IG limit.** Budget + shorten retry + counter, never a silent cut.
15. **Dates and time zones.** Date-only programme days, Europe/Bucharest via `naptar.ts`; all-day/whole-event NULLs tested.

---

## 9. Vilmos sign-off points (one batched sheet; Csilla decides how to route it)
1. New table `program_tetel`: RLS policy, `km_app` grants (SELECT/INSERT/UPDATE, no DELETE), the A-11 test.
2. New file purpose `album`: upload exposure, types (jpg/webp only), 2.5 MB cap, dimension check, per-tenant quota, rate limit, viewer
   ban, separate folder and new compose volume.
3. Sending festival photos (people, children) to OpenAI for selection; the Adatkezelés wording; the local alternative.
4. `nas/mentes.sh` change (album folder excluded from daily tar or weekly only) and `nas/docker-compose.yml` volume. These are NAS changes.
5. ZIP download endpoint and Web Share: authenticated, tenant-checked, no public URLs.
6. `SzervezetProfil.loose()` (stored unknown keys survive; input schemas stay strict).
7. DOCX programme upload, if Q4 = yes: zip handling with size caps, only `word/document.xml`, text-only extraction, no entity expansion.
8. Who may edit the type, the programme and the language mode: editors as well as owners (same open point as round 7 decision 9).

---

## 10. Build chunks in detail
**Every chunk's base checks:** `pnpm tipus && pnpm hatar && pnpm tokenor && pnpm keretor && pnpm terkoz`,
`pnpm --filter @km/web proba` (the same 16 known failures, nothing new) + the packages' tests, migrations from scratch 0000–latest, each new
migration `{ echo "BEGIN;"; cat 01xx.sql; echo "ROLLBACK;"; }` on the test DB, `pnpm allapot …` at start and end, the layout audit
(`design/R18-arculatfrissites/…/audit-szkript`, currently 1890 views / 0 findings) staying at 0, and screenshots at 390 and 1512 px.
Moved expectations carry their reason (rule 10).

**Test data (one fixture set, real and messy):** `apps/web/probak/adat/zilele-2026.json`, ~30 items hand-cut from the real DOCX
covering: all-day ("Pe tot parcursul zilei / Egész nap folyamán"), ranges ("18:00–20:30 | Edo"), whole-event items, an unnamed act
("Trupă maghiară / Magyar zenekar"), the uncertain item ("Centru | Főtér 10:00??????? Sărbătorirea Zilei Drapelului Naţional") and the
internal note ("A ZÁSZLÓ NAPJÁT IS MEG KELL CSINÁLNI"), a RO-only item in another format ("Conferință și lansare de carte – Cartea de
oaspeți a Sanatoriului Czakó · Data: 27.06.2026 · Ora: 11:00-14:00"), the source typo "tag ozat", ampersands and diacritics ("Aura Șova &
Band", "Kilyén Ilka și Rițiu Krisztina – folclor", "Cristi Țăran", "Gențiana & Band", "Puka Károly és zenekara", "Kökény Attila"),
long bilingual venues ("Piața Teatrului – Aleea Vinului / Színház Tér – Borsétány"), and the closing item ("23:00 – Tűzijáték és a
Marosvásárhelyi Napok 2026 hivatalos zárása"). Plus three orgs: **Tibor's paving company** (hu only, epites), **Zilele Târgumureșene**
(festival, nyelvek [hu, ro]), and a **RO-first org with a German second language** ("Pensiunea Ștefănescu, Sovata", [ro, de]) to prove
nothing is hard-coded to RO.

| Chunk | Build | Self-test (beyond the base checks) |
|---|---|---|
| **F0** | `.loose()`; `mezoMent`; tolerant `betolt`; re-approval keeps all previous fields | unit: a profile with unknown keys survives load → save; a profile with a garbage new value still loads; re-approval keeps `kinalat`, `hivatalos_nevek` and a made-up future key; `mezoMent` under `szervezetKent` of another org updates 0 rows (A-11). E2E: approve → re-approve on the test DB, then diff the jsonb (only `jovahagyva`/draft fields change) |
| **F1** | contracts lists + normalisers; `kategoriaOf`; `javaslatok` v+1; piszkozat → profile copy; call sites switched; `kep_peldak` uses the confirmed category | unit: every existing `vendeglato` fixture gives the same list title and `TARTALEK` as before; a Zilele description → `fesztival`; "Kovács Térkő Kft. — térkövezés" → `epites`. E2E: the live read-only equivalence count (1.7). Screenshot: a company's setup, pixel-compared with today |
| **F2** | `nyelvMod`, `masodikNyelv`; "Más nyelven" = the union | unit: defaults for 1, 2 and 3 languages; the menu lists hu, ro, en plus de for the Sovata org. Screenshot of the menu |
| **F3** | D5 step, D9 switch, auto second cell in `egyben`, `ketnyelvuOsszefuz`, budget, stale line, copy | unit: join (hashtags once, order by `nyelvek`, RO-first org), IG budget with the longest Zilele performer post ≤ 2200, the round-trip mode test is byte-identical, an edited RO is never overwritten. E2E (stand-in AI + one live run): Zilele performer post "Kökény Attila · Győzelem tér – Nagyszínpad · 20:00" → HU + RO joined → copy. Screenshots: D6 at 390/1512, the stale state. `tibor-proba` on the live page |
| **F4** | `Kitolto` second language; `melle.ts` any language; `kep_beallitas.masik` | E2E: Sovata org → "Német változat is" → a German image + "Mindkettő" download gives two files; an old post with `kep_beallitas.ro` reopens exactly the same. Screenshots of both |
| **F5** | 0172; `apps/web/program/` (tar, szabaly, index, blokk); `/api/program/{olvas,lista,tetel}`; `program_kiolvasas` | unit: the parser cleans the Zilele fixture (uncertain → `bizonytalan`, the internal note never `aktiv`, the time range parsed, the RO-only item gets a RO name only); re-read keeps an edited row. DB: A-11 (another org sees 0 rows; km_app under another org can't update), no DELETE privilege. Live: the DOCX saved as PDF + a phone photo of the printed poster → item count within ±10 % of 77 timed items, 0 invented times (hand-checked list in HANDOFF) |
| **F9** | `album` purpose, folder, limits, quota, 0176, endpoint, ZIP, `mentes.sh` + compose | NAS probe first (read-only). Unit: 2.6 MB rejected, PNG rejected, a 4000 px JPEG rejected, quota stop at the limit, viewer 403, another org's file 404. Backup dry run on the Gigabyte shows the album folder excluded. Measured on the NAS after deploy: `free -m` unchanged ±100 MB |
| **F6** | D1–D4, D9 Programod; `lepesekFor`; type/category line | unit: `lepesekFor` (one-language company = today's 5 steps). E2E: a new org "Zilele Târgumureșene 2026" with the zilele site text → line "Fesztivál / rendezvény" → Mikor és hol (jún. 25–28., Marosvásárhely) → Programod (4 days, 9 on Thursday) → edit "Alina Manole & Band" → nyelvmod pre-selected → temak. Tibor's paving company runs the whole setup and sees no new screen. Screenshots of every step at 390; `tibor-proba` on each |
| **F7** | prompts, topic set, `programBlokk`, glossary merge, the guard on festival posts | unit: the prompt slice for 26 June contains only that day; the glossary pair "Középkori Vár ↔ Cetatea Medievală" is applied in the RO output; a model answer with "21:45" not in the programme triggers the retry. Live run: 5 topic posts, hand-checked for invented facts, logged in the cost log |
| **F8** | `horgony.ts`; Kezdőlap cards; D7 ghost rows; idempotent creation | unit: anchors for 25–28 June (countdown 11, 18, 22, 24 June; tomorrow posts 24–27; thank-you 29), caps per day, DST-safe; tapping twice opens the same post. Screenshots: Kezdőlap on 24 June (clock injected) and the Naptár week of 22 June |
| **F10** | D8; client downscaler; the vision pick; the album strip; Web Share; ZIP | unit: the downscaler on fixture photos (≤ 2048, EXIF GPS gone, the orientation right); the fallback order by capture time. E2E on real phones (iPhone Safari + Android Chrome) over throttled 3G: 30 photos upload, refresh in the middle keeps the uploaded ones, pick 10, "Megosztom" opens the share sheet. Cost per album measured. Screenshots at 390 |
| **F11** | `rendezveny` in both category lists + the photo from Csilla | kepgyar `fust-minta` with the new category; a festival org's sample shows it |

Every chunk ends with: deployed through the robot, checked on the live screen, a screenshot to Csilla, a HANDOFF entry, and the state.md NEXT updated.

---

## 11. Open questions for Csilla (max 4)

**Q1 — Where does the "Cég or Fesztivál" question sit?**
- **(a) Recommended:** a pre-filled line on the existing review page ("Cég · Építőipar" / "Fesztivál / rendezvény"), changeable under
  "Átírom". An explicit two-button question appears only when the machine is unsure. Companies get no extra tap.
- (b) A separate first screen before the website question, always asked. The AI can't pre-select there, because it hasn't read anything yet.
- (c) A separate screen after the machine reads, always asked, pre-selected (+1 tap for everyone).

**Q2 — Who sees the "Hogyan posztoljunk két nyelven?" setup screen?**
- **(a) Recommended:** every org with 2+ content languages (one screen, pre-selected: festival → one post with both, company → separate
  posts). One-language companies see nothing new.
- (b) Festivals only; companies keep today's separate posts and can switch in Beállítások.
- (c) Everyone, including one-language orgs.

**Q3 — How long do we keep on-site album photos (the working copies; the originals stay on the phone)?**
- **(a) Recommended:** 90 days after the post is marked "Kitettem" (or 90 days unused), then moved to `_torolni/` for your click. They
  are left out of the daily backup and kept in the weekly one.
- (b) Kept until the tenant's 500 MB limit; the user deletes them. Daily backup as today (~11 copies on the NAS).
- (c) 30 days, never backed up.

**Q4 — Should the programme reader accept Word (.docx) files in round 1? (The real Zilele programme is a .docx.)**
- **(a) Recommended:** yes, text-only extraction of the document body with strict size limits. Needs Vilmos's sign-off (point 9.7).
- (b) No. PDF, photo and link only; we tell users to save it as PDF.
- (c) Later, after the pilot.
