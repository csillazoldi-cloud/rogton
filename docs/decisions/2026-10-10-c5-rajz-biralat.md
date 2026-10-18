# 2026-10-10 — c5 R-15 Round 1 drawing: Tibor-judge reds accepted / fixed (Csilla)

**Context.** Judge run from Csilla's Mac on drawing commit 383601f (`design/R15/rajz/R15-lapok-4.dc.html`), model claude-sonnet-5-5,
2026-10-10 13:54: 0 green · 13 yellow · 11 red, rajz-zár ZÁRVA. The probe (rajz_proba.py) was 24/24 green.

**Decision (Csilla, 13:56).**
- ACCEPTED as correct behaviour, no change: **01b asztali + telefon** (after a wrong password Tibor picks „Elfelejtetted a jelszavad?” /
  „Jelszó mutatása” — sensible) and **02a asztali** (picks „Nincs weboldalunk…” — right for a company without a website).
- FIXED in the drawing: every working state (02a2, 05w, 11a2, 11c2) gets one calm line „… — addig nincs teendőd.”; 11a2 gets its own
  title („Most írjuk a céljaitokat”) and no links while working; 11a and 11b titles/lines rewritten (T1).

**Where recorded.** Here and in `design/R15/kerdesek-4.md` (section "Judge 10-10"). Not in `tools/tibor-proba/elfogadott.json`:
measured in `zar.py` (line 36) that file is ignored in `--rajz` mode, and its keys are LIVE page names (e.g. `tagok/telefon`).
The accepted views are drawing states (01b error state, 02a with a judge choice) — when the pages are built, the live gate measures
`/belepes` and `/onboarding` in their default state; if the judge repeats the same reasoning there, add the live key to elfogadott.json
with this file as `naplo`.

## Rerun on a49ff0a (Csilla's Mac, 14:07): 0 green · 11 yellow · 13 red — decision 14:09

**A) Working states are states of their parent page, not pages.** 02a2, 05w, 11a2, 11c2 (both widths) are NOT sent to the Tibor judge
from now on — the judge cannot score a spinner state ("félrenyom: semmit" every run). rajz_proba.py still measures them and they must stay green.
How, without changing the tools: `tibor_biro.py --csak <parent page names>` (existing option) and their old verdicts removed from
`biralat.json` before `zar.py --rajz`. Measured in zar.py: a view with NO verdict is not a closing reason (only "no biralat.json at all" is),
so the working states then pass on the probe alone.

**Gate caveat (measured in zar.py line 36):** with `--rajz`, `elfogadott.json` is not read, so the three accepted reds (01b ×2, 02a asztali)
still print as closing lines and the drawing gate stays ZÁRVA on them alone. Smallest change that would make the gate itself say NYITVA —
PROPOSED, NOT MADE (rule 10): `zar.py --rajz --elfogadott <file>` reading a per-drawing accepted list (e.g. `design/R15/meres/rajz4/elfogadott.json`,
keys = drawing view names, each with Csilla's decision + this file as `naplo`), shown under "Elfogadott pirosak". Live `elfogadott.json` stays live-only.

**B) 11a fixed:** a quiet, greyed example of a finished compass (`r15.ir.pelda_*`, marked „Így néz majd ki — példa”) above the button;
primary stays „Kérek javaslatot”. Static labels, no machinery.

## Rerun on f8f60a1 (14:22) and BUILD decision (Csilla 14:24)

- Judge 14:22: 11a asztali sárga 5, 11a telefon piros 4 (no complaint); the only other reds are the 3 accepted ones.
- **Csilla 14:24: 11a telefon accepted as well** (judge limitation, no complaint text). Q13 ★ approved (the 11a example picked by trade via the
  c15 list). All other kerdesek-4 ★ defaults approved (13:49). **BUILD.**
- Accepted reds on the DRAWING: 01b asztali, 01b telefon, 02a asztali, 11a telefon.

## Build (branch c5-r15-kor1-kod) — for Vilmos to review (nothing here waits for him; Csilla's decision stands)

- **Q7 compass → post ideas (product direction):** built as approved by Csilla. 11c turns the running campaign and the "Amit tolni kell" items
  into up to 3 idea cards; the button is the existing `POST /api/poszt` with `forras.tipus = "terv"` (new client logic only). The help text
  `iranytu.mire_hasznalja_szoveg` got a new value. **Vilmos: please review the direction.**
- **Q1 `kozos.kapcsolat`:** not set, no address invented. The „Elfelejtetted a jelszavad?" link follows the old rule (shown only with a contact);
  so on 01b the error line has no action and the probe marks T7 red there. Measured: with a contact label set (local test value only) 01b is green.
  **Vilmos: name the support address.**
- **Security-relevant surface (no auth / permission / RLS / secret change):**
  - New page `/hirfigyelo/hir/[id]`: the same session checks as `/hirfigyelo` (logged in, organisation, approved profile); the id must be a UUID;
    data via `r15Hir` = the existing `attekintes` of the CURRENT organisation only (tenant-scoped, A-11) → another organisation's id gives 404
    (live test `c5-elo.proba.ts`). Viewer (`nezo`) sees no post button; the post call itself is the existing `POST /api/r15/hirek/[id]/poszt`
    (`kapu(..., "szerkeszto")`, 404 for a foreign id — tested).
  - `/iranytu` now reads the compass state on the server with the existing `iranytuAllapot` / `iranytuVerziok` (same functions as `GET /api/iranytu`,
    organisation-scoped) and the stored trade category via `peldakFrissen` (organisation-scoped read, no AI call). Approve stays owner-only
    (server-enforced as before).
  - `POST /api/poszt` with `tipus "terv"`: existing endpoint, `kapu(..., "szerkeszto")`, work rows are organisation-scoped; same item id in another
    organisation creates THAT organisation's own work (tested).
  - Login: logic unchanged (same endpoint, local checks, `?vissza=` only own paths).
- **Tool change (rule 10, reason in place):** `tools/tibor-proba/tibor_proba.py` registration step opens „Nincs weboldalunk" before typing the
  description (the field moved behind that link — kerdesek-4 · 10). Without it the gate's test account cannot be created. Measured pages and limits unchanged.

## Round 1 live + two decisions (Csilla, 2026-10-10)

- Round 1 is LIVE: `6c1eea5` through the c4 gate, checked by Csilla 10-10 17:13.
- **Iránytű → post ideas (kerdesek-4 · 7) is Csilla's decision; no Vilmos sign-off needed** (it is product direction inside the
  development lead's remit, not security). The "for Vilmos to review" note above is informational only.
- **Q1 support e-mail (`kozos.kapcsolat`) is parked until before the first real client** — hub chunk c15, together with c3 (the password
  gate). Until then 01b keeps the error line without the „Elfelejtetted a jelszavad?” link, and its T7 probe red is known and accepted.

## Round 2 drawing rule (Csilla, 2026-10-10 17:25)

- The settings pages 12 Szervezet adatai, 13 Beállítások and 14 Értesítések are NOT judged by the Tibor judge. The drawing probe
  (`rajz_proba.py`) still runs on them and must be green. The judge runs only on 09–10 Képek and the Kezdőlap „Tegnap javítva” views.
  Working states are drawn as before and not judged. Round 2 drawing: `design/R15/rajz/R15-lapok-5.dc.html`, questions `design/R15/kerdesek-5.md`.

## Round 2 judge + answers + BUILD (Csilla, 2026-10-10 18:08–18:20)

- Judge on `a98ba12` (Csilla's Mac 18:17, Sonnet): probe 26/26 green; the 10 judged views 0 zöld · 8 sárga · 2 piros. The two reds —
  **10a telefon** (4, no complaint) and **03j2 telefon** (4, no complaint) — are **ACCEPTED** by Csilla (18:20). Decision: **BUILD**.
- Answers (18:08): **Q6 CHANGED** — the source badges on 12 still go, but the small footnote STAYS (under the list). Built as „Az AI javaslata nem tény.” (`r15.sz.ai_nem_teny`): the exact „AI-javaslat” token is on the T3 list and the line sits above the 900 px fold, so the probe (and the gate) would be red — same meaning, flagged to Csilla.
  Every other kerdesek-5 question: ★ default, including the Vilmos-marked ones (Csilla's call; Q13 = Adatkezelés tab unchanged).
- Two drawing fixes, carried into the build (drawing updated so drawing = built):
  (a) 09 / 10 / 10b show the real c14/c15 trade sample photo instead of the striped placeholder — exactly as the live Kezdőlap sample does.
  In code the sample photo now also goes on the „Újdonság” (`uj`) sample, not only „Kész munka” (`apps/kepgyar/src/minta-foto.ts`; the
  smoke-test expectation moved, reason in place). (b) 10b phone gets the quiet „Letöltés újra” too (phone stays ≤ 40 words: 38 measured).

## Round 2 build (branch c5-r15-kor2-kod) — notes for Csilla and Vilmos (FYI; nothing waits)

- **Deviations from the drawing (small, measured):** (1) 12b phone — „Mentés” sits in the bottom bar, not inline: inline, the floating
  Feedback button covered the editor (T10). (2) 14 — „A felületen” is a LIVE switch (`beallitas.feluleten`) — kept as the first switch behind
  „Miről szóljon ▾” (kerdesek-5 · 12 corrected; drawing 14c updated). (3) 10 — as many colour variants as the image maker returns (5 locally).
  (4) The „Újdonság” sample now also gets the trade photo (kepgyar `mintaFotoval`), so 09 has no striped placeholder.
- **Security-relevant surface (no auth / permission / RLS / secret change):** `visszajelzes.sajatJavitott` reads only the caller's own,
  non-anonymous rows of the CURRENT organisation (`fiok_id` AND `szervezet_id` in SQL — the table has no RLS by design), fixed in the last 24 h;
  `lap` goes out only as an internal path. Live cross-organisation test `c5-kor2-elo.proba.ts` (own / other org / same person in another org /
  anonymous / old / not fixed). `/tagok?meghivo=1` only opens the dialog the user can already open (same role check). `/gephaz` reads the
  existing organisation-scoped `sajatKredit`.
- **Test expectation moved (rule 10, reason in place):** `kezdolap.proba.ts` 15 — the currency selector is behind „Haladó ▾” now
  (kerdesek-5 · 10); `apps/kepgyar/probak/minta-foto-fust.ts` — the `uj` sample gets the photo.

## Round 3 (Csilla, 2026-10-10 20:4x)

- **Kezdőlap (Kati #12):** keep today's view, but a row of module tiles FIRST (Hírek · Posztszöveg · Képek · Iránytű), the „what to do now”
  block under it, unchanged; one primary stays. The Tibor judge runs on this page. Drawing: `design/R15/rajz/R15-lapok-6.dc.html` (03bT/03cT/03c2T/03jT).
- **Settings icons (Kati #3):** one small line icon per row on 13 (and the 14 switches); probe only, not judged.
- **DECLINED for now — Kati 10-02 „the post preview should pull the real Facebook page”:** it needs a Facebook login per client, which is
  Vilmos's security area. Moved to later, when Facebook publishing is built.
- **Triage of four old items against main 4923dbe (measured locally):**
  (a) Erika 09-24 Notificări „only Hungarian, now Romanian or mixed” — FIXED: /beallitasok is entirely in the chosen UI language (HU and RO
  both measured at 390/1440; the event lines are rendered from labels at view time). (b) Kamilla 09-16 Hírek „could not run the trial” —
  NOT VERIFIABLE HERE: the trial is now „Keress most új híreket” (`R15Hirek.tsx:131`), disabled for viewers, while a run is going, or when
  the credit is used up; the news runner does not run locally — check on the NAS with her account. (c) Szente 09-16 „default language = the
  project's language” — FIXED: posts are written in the organisation's first content language (`r15/index.ts:22–26`, used by every post
  path), not the UI language. (d) Szente 09-16 „can't upload a larger file, a PDF” — PARTLY: PDF is accepted up to 10 MB (measured: 3 MB →
  201, 11 MB → 413 TUL_NAGY; `packages/fajl-core/src/host.ts:66`, nginx 12 MB); a bigger file is still refused by design.

## Round 3 judge + BUILD (Csilla, 2026-10-10 21:02–21:03)

- Judge on f37b459: 0 green · 8 yellow · 0 red, gate NYITVA. All ★ answers approved, with ONE wording change: „Még 3 apróság” → **„Még 3
  javaslat”** (`r15.kezdolap.meg_apro`; HU „Még {n} javaslat”, RO „Încă {n} sugestii”, EN „{n} more suggestions”, migration 0160; drawings
  R15-lapok-1/2/5/6 and R13-lapok updated, the probe re-run on R15-lapok-6: 14/14 green, word counts unchanged).
- Built on branch `c5-r15-kor3-kod`: tiles first on the Kezdőlap (`app/_kozos/R15Csempek.tsx`, the „Legutóbb …” time moves into the Hírek
  tile on desktop; on the phone every „Még vár” row folds behind the link), icons on 13/14 (`app/_kozos/R15Ikon.tsx`). Drawing vs built:
  `design/R15/rajz/R15-lapok-6-epites.html`.
- **Open for Csilla (not improvised):** 03 phone with one waiting post measures 43 words (limit 40) on the local test data — the test AI's
  first sentence is 12 words (the card's maximum); the tiles add 4. With a headline of ≤ 8 words it stays ≤ 40. The sysadmin-only switch
  „belépési kísérletek” is not on the drawing, so it has no icon.
- Same branch: the file limit 10 MB → 100 MB — see `2026-10-10-fajl-100mb.md`.
