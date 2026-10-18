# Machinery — R-15 c5 Round 1 (01 Belépés · 02 Első beállítás · 05 Hír részletei · 11 Iránytű)

What each drawn element uses. Drawing: `rajz/R15-lapok-4.dc.html` (16 screens + state panels). Labels: `feliratok-5.json`
(33 keys: 31 new + 2 changed values — `iranytu.mire_hasznalja_szoveg`, `onboarding.eb_cim` — → one new migration in the code round). Every other string on the drawing is an EXISTING
label key (127, `data-felirat` on each element), with today's value — read from the migrations (latest value wins), not retyped.
Measured in code on main `ff4253e`, 2026-10-09; nothing here was run against the live site.

Legend: **same** = existing machinery, presentation only · **NEW client** = new client logic on existing endpoints ·
**NEW route** = new page, existing data.

## 1. 01 Belépés (`/belepes`) — same, presentation only
- Fields, local checks (`hiba.email_hianyzik`, `hiba.jelszo_hianyzik`), `POST /api/fiok/belepes`, `?vissza=` handling, redirect to `/kezdolap`: unchanged (`BelepesUrlap.tsx`).
- "Jelszó mutatása": the existing `Mezo jelszoMutatas` button (Kati 10-02 fix: no focus steal) — unchanged.
- Error 01b: the server code → `hibaSzoveg()` (ROSSZ_BELEPES / TUL_SOK_KISERLET / ALTALANOS) is drawn as one `baj` line above the card
  (today: `Hibadoboz` inside the card). Field borders turn `--rossz-jel` (as today via `aria-invalid`).
- "Elfelejtetted a jelszavad?" is drawn INSIDE the error line. Same condition as today (`vanKapcsolat`, DÖNTÉS 3.4 A): shown only when
  the `kozos.kapcsolat` label exists. **Measured:** no migration sets `kozos.kapcsolat` → today the link is never shown (kerdesek-4 · 1).
- Header: `FiokOldal` (logo, app name, "teszt", `Nyelvvalaszto`, "Nincs még fiókod? Regisztráció"). Phone: `Nyelvvalaszto rovid` (HU/RO/EN,
  the existing Nyitólap prop); the register link moves under the form on phone. Floating anonymous Feedback (10-06) unchanged.
- Primary on phone in the bottom bar (`r15-also-sav` pattern from 03/04/08).

## 2. 02 Első beállítás (`/onboarding`, `ElsoBeallitas.tsx`) — same machinery, presentation + one reveal
- **02a (lap = "urlap"):** Név pre-filled from `szervezetNev` (as today). Weboldal field as today. The "Mivel foglalkoztok?" textarea is behind
  the link `r15.eb.nincs_weboldal` (client toggle, in place). It opens automatically when `kevesForras === "leiras"` (A8) or when `b.leiras`
  already has text. `keszitheto` / `leirasTulRovid` / `indit()` unchanged. Subtitle `r15.eb.alcim` replaces `onboarding.eb_szoveg` on screen. Title `onboarding.eb_cim` = „Mit kell tudnunk rólatok?” (new value, Csilla 10-10).
- **Working (lap = "dolgozik"):** drawn as screen 02a2 (see 5). Items unchanged (6 items, ✓ / spinner / !).
- **02b (lap = "atnezes"):** two read-only cards from the same piszkozat fields:
  - "Rólatok": `b.osszefoglalo` (mezo.tevekenyseg), `k.celkozonseg`, `k.hangnem_minta` (shown under mezo.hangnem).
  - "A hírek, amiket figyelünk": the ticked `temakJelolve` as chips; the ticked `jeloltOldalak` as one line.
  - "Átírom" on a card = client edit mode in place: exactly today's controls for those fields (textareas, Név, tone chips + tone description +
    sample with the 1.2 s AI rewrite; topic chips + add; site toggles + own site + `eb_oldalak_n` + `eb_korlat` + `eb_oldalak_lab`).
    "Kész" (`r15.mit.kesz`) closes it. Autosave 800 ms as today (`usePiszkozat`).
  - "Részletek" (in place): goals chips (`CEL_KOCKAK`, still never pre-ticked — J-1), languages chips + "+ más nyelv", "Kit figyeljünk", `eb_lab`, and
    on phone "Később fejezem be".
  - Primary: `jovahagy()` unchanged. Info next to it: `r15.eb.elso_hirek`. "Később fejezem be" = `mentesEsVissza()` as a quiet link.
  - Error: `jovahagyHiba` / `hibasMezok` → one `baj` line under the title with `hf.ujra` (calls `jovahagy()` again). The card containing a field
    named in `hibasMezok` opens in "Átírom" mode (client).
  - Source badges (`Jelveny`) and "az AI ebből írta" are not rendered on this page any more (data unchanged). While the tone rewrite runs:
    `r15.eb.irjuk` instead of `onboarding.eb_ai_irja`.
- Phone header (Kati 10-02 overflow bug — root cause was content-box `width:100%` on `.km-eb-kartya` / `.km-eb-mezo`, fixed with border-box; do not regress): logo · step label (`--fs-xs`, ellipsis) · HU/RO/EN · "Mentés és vissza".
  `MentesAllapot` only on desktop; on phone it appears only in its error state (with the existing retry button).

## 3. 05 Hír részletei — NEW route, existing data and endpoints
- **Route (kerdesek-4 · 5):** `/hirfigyelo/hir/[id]` (id = `fo_talalat_id`). Today the detail is `HirFelugro` over the old overview at
  `/hirfigyelo/osszes?talalat=…`; that URL keeps working. The R-15 Hírek card title and "··· › Részletek" (`R15Hirek.tsx` `reszletek()`) point to
  the new route. Data: the same `Kartya` object the overview loads (assumed obtainable from the existing talalatok read the overview uses;
  if no single-item read exists, the page loads the list and picks the item — no new API). Not measured live.
- Card: first line `forrasNev(forras_cim)` · `idoRovid(megjelenes)` (+ the existing translation note); news title `cim_forditott || cim`;
  summary `osszefoglalo` (desktop; phone: inside Részletek); "Miért jó nektek?" = `cegednek || miert` (the field today shown as "A cégednek").
- **Primary (T9):** `POST /api/r15/hirek/{fo_talalat_id}/poszt` (`hirbolPoszt`, the 04 action) → `/poszt?munka=…`. Label `hf.poszt_keszits`;
  when a post already exists for the item → `r15.hirek.atnezem_posztot` (the same call opens the existing work). Busy: `hf.poszt_keszul`; error `hf.poszt_hiba`.
- "···" menu: `POST /api/hirfigyelo/talalatok/{id}/jelol` (mentett / elrejtett / nincs) + "Eredeti cikk ↗" (`forrasok[0].url`) — the 04 menu.
- Részletek: `vevoidnek`, `indoklas || miert`, all `forrasok`, `hf.csonkolt`, the importance word, and the existing
  "Kérek tartalomötletet" (`POST …/tartalomotlet`) with its result + `hf.otlet_figyelmeztetes`.
- States: `ertekeles_allapot === "fuggoben"` → `r15.hir.olvassuk` instead of "Miért jó nektek?" (primary stays); `keret_kimerult` /
  credit out → `r13.kredit.elfogyott` (R-13 pattern, primary greyed); `szerep === "nezo"` → `r15.hir.nezo`, no primary.
- Not shown any more: `hf.verMadeWith` (v{n}), `hf.ovSummaryBadge`, the category badge (word kept in Részletek), "✕ Bezárás" (page has "← Hírek").

## 4. 11 Iránytű (`/iranytu`, `Iranytu.tsx`) — same API; 11c is NEW client
State from the existing `GET /api/iranytu` (`allapot.tervezet`, `allapot.jovahagyott`, `van_tervezet`):
- **11a** (no draft, no approved): above the button a greyed example (`r15.ir.pelda_jel` + `pelda_kampany` / `pelda_tolni` / `pelda_cel`,
  static labels, `data-r15="info"` lines with a left rule — no box; Csilla 10-10 B). Primary = existing `javaslatKer("mind")` → `POST /api/iranytu/javaslat`; busy text `r15.ir.irjuk`
  (replaces `iranytu.javaslat_fut`). "Inkább magam töltöm ki" = existing `sajatKezdes` (the editor, empty). Errors: existing codes, one `baj`
  line + `hf.ujra`; `AI_KERET_KIMERULT` → `r13.kredit.elfogyott` (replaces `iranytu.javaslat_hiba_keret`, T3).
- **11b** (`van_tervezet`): read-only summary of the draft (celok[].nev, tolni[].nev, the current/next `idoszakok` item, tiltott_szavak +
  kerulendo_temak). Primary owner = existing `jovahagy()` → `POST /api/iranytu/jovahagyas`, label `r15.ir.jovahagyom`. Non-owner: info
  `iranytu.csak_tulajdonos`, primary = "Átírom". "Átírom" = existing `mod = "szerkeszt"` (the whole current editor incl. BlokkValaszto,
  per-block suggestions, autosave `PUT /api/iranytu`). Részletek: vízió, értékrend, célok miért/mikorra, `tervezetElvetese()`, versions + `visszaallitas()`.
- **11c** (approved, no draft) — **NEW client logic (kerdesek-4 · 7, 8):**
  - Idea list, max 3, computed in the client from `jovahagyott`: (1) `idoszakok` where today ∈ [mettol, meddig] (title = nev, line = mit,
    info = `r15.ir.kampany` · dates), (2) `tolni` in order (info = `iranytu.tolni`), (3) `celok` if fewer than 3 so far.
  - Button = `POST /api/poszt` with `{ forras: { tipus: "terv", azonosito: <item id>, cim: <nev>, url: "", szoveg: <nev + mit> },
    cim: <nev>, felulet: "fb", nyelv: <content language> }` → `/poszt?munka=…` (the 08 page writes the text, as for "Saját ötletből").
    `"terv"` is in the `PosztMunka` contract enum (measured); the writer prompt only prints the type (measured in `poszt/index.ts`).
    End-to-end NOT run.
  - Phone primary label `r15.ir.az_elsorol` = the first idea; desktop: primary on the first card, quiet buttons on the others.
  - Info `r15.ir.jovahagyva` from `jovahagyva` + `jovahagyta_nev`. "Az egész iránytű" = the current read view in place.
    "Módosítás" = existing (new draft → page becomes 11b).
  - No campaign and no tolni and no goals → read view, primary "Módosítás".
  - `iranytu.mire_hasznalja_szoveg` gets a new value (it said "content is not generated from this").
- Not shown any more on screen: `jelzes.javaslat` / `jelzes.te_adtad` row badges; the word "Verziók" (the list stays in Részletek, titled by
  date + approver).

## 5. Working states (Csilla 10-10, kerdesek-4 · 9) — one pattern for every generating button
- **Live pattern reused (measured in code):** `R15Poszt.tsx` shows `<span class="r15p-porgo">` (spinner, `_kozos/r15-lapok.css`) + `r15.poszt.irjuk`
  while the post is written; R-15 buttons already pass `disabled` + `aria-busy` (`FoGomb … disabled={folyik} aria-busy={folyik}`, e.g. Betuk.tsx,
  ArculatSzakasz.tsx, R15NapiHirek.tsx). Onboarding has its own `km-eb-porgo` for the item list.
- **Rule:** the pressed button keeps its place, becomes `disabled` + `aria-busy`, gets the spinner + an „…-juk…” text (no second tap possible);
  nothing else on the screen changes, except sibling action buttons of the same kind are disabled (11c2). Next to the busy button ONE calm line (judge 10-10):
  02a2 `r15.eb.fel_perc` (the existing half-minute claim), 05w + 11c2 `r15.kozos.par_masodperc` (the button phase is short: the call answers at once),
  11a2 `r15.ir.varj` (no time promised — not measured). 11a2 also swaps the title to `r15.ir.irjuk_kerdes` and hides „Inkább magam töltöm ki” + „Részletek”.
- 02a2: `onboarding.eb_gomb` → spinner + `r15.eb.keszitjuk` for the whole `lap === "dolgozik"` phase (today the button disappears). Title/line unchanged; calm line `r15.eb.fel_perc`.
- 05w: `hf.poszt_keszits` → spinner + `r15.poszt.irjuk` until `/poszt?munka=` loads (replaces `hf.poszt_keszul`, which said „Nyitom a posztot…”).
- 11a2: `iranytu.javaslatot_kerek` → spinner + `r15.ir.irjuk` while `javaslatFut`; „Inkább magam töltöm ki” hidden meanwhile. Same pattern for the per-block „új javaslat” in the editor.
- 11c2: the pressed idea button (phone: `r15.ir.az_elsorol`) → spinner + `r15.poszt.irjuk`; the other idea buttons disabled.
- Phone onboarding top bar (Csilla 10-10, T2): `Nyelvvalaszto rovid` and „Mentés és vissza” render as quiet text controls (no border, `--halk-link`), same actions.

## 6. Labels (feliratok-5.json → one new migration)
31 new keys (`r15.eb.*`, `r15.hir.*`, `r15.ir.*`, `r15.kozos.par_masodperc`) + 2 changed values (`iranytu.mire_hasznalja_szoveg`, `onboarding.eb_cim`). HU/RO/EN, placeholders match
(`{mikor}`, `{ki}`). None contains a T3 word in any language. Reused keys (127) are listed in the HANDOFF entry; their values are unchanged.
