# 2026-10-17 — c30 F4: the image page follows the org's second language (+ F3 follow-up: no title sentence at the top of a post)

**Decided by:** Csilla approved plan c30 (`docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md` §5 „Images (F4)", §10 F4); F4 handed over by the main
session 2026-10-17 after F3 was pushed (`5335d66`). The F3 follow-up comes from the main session's live test on the real AI the same day.
**Requirements:** R-14/R-15 (content languages are the org's own), R-13/VZ-2b (Képek), T4 (pre-filled), rule 4 (no dead control), A-11
(nothing new crosses tenants: the page reads the org's own profile; the image settings stay on the org's own post).
**Migration:** `0173_c30_f4_kep_masodik_nyelv_feliratok.sql` (60 label rows, labels only; 0172 is applied on the NAS and is not touched).
**RLS:** unchanged. **Contract:** `PosztForras.kep_beallitas.masik?: {nyelv: Tartalomnyelv, ertek}` (optional, additive).

## What changed (F4)

- **Second language = `masodikNyelv(profil)`** (`app/kepek/uj/[helyzet]/page.tsx` → `Kitolto`): the toggle reads „{nyelv} változat is" /
  „Și varianta {în …}" / „{Language} version too" (`c30.kep.masik_is`), its fields' heading is the language adverb („Németül", „În
  germană"), the preview switch and „Mit töltsünk le?" name the two languages (`nyelv.nev.*`, 18 content languages), the two-image line
  uses the real codes (`c30.kep.ket_kep`: „…-ro.png és -de.png"). For a [hu, ro] org every text is letter-for-letter the old one.
- **No second language → no toggle** (rule 4). A one-language company loses the „Román változat is" row; nothing else moves.
- **Translation to any content language:** `vizual/melle.ts kepCel` — `kepFordit`/`kepForditMezok` take any `Tartalomnyelv` (was hu|ro and
  hu|en|ro); unknown → ro, as before.
- **Saving:** „Poszthoz teszem" writes `kep_beallitas.masik {nyelv, ertek}` from now on. **Reopening („Kép szerkesztése")**: the saved
  language wins — `masik.nyelv`, else an old `ro` save opens as Romanian (exactly as before F4, also in a [ro, de] org); only a new image
  follows today's second language.
- **`egyben` mode (T4):** a new image starts with the toggle ON (the machine translates as if the toggle had been pressed) and „Mit
  töltsünk le?" defaults to „Mindkettő". A reopened image keeps its saved state.

## F3 follow-up — no title sentence at the top of a post (main session, live test 10-17)

- **Finding (live, real AI, „Zilele teszt" [hu, ro] egyben):** both halves started with a title written as a sentence: „Kökény Attila
  vasárnapi koncertje." / „Concertul lui Kökény Attila duminică." Round 8 (Kati 10-14) removed exactly that.
- **Cause (by reading the code, not reproduced — no real model in the VM):** the bilingual path does NOT bypass the rule: the first half
  goes through the same `kozolhetoSzoveg` guard and the same prompt (`poszt_szoveg` v9); the second half is a faithful translation of the
  first. The guard only knew titles WITHOUT end punctuation (or markdown/caps/„Cím:"); a short title ending in a PERIOD passed — and the
  prompt's Facebook rule asks for a short first sentence (≤ 8 words). **So the one-language path is affected the same way.** Whether the
  bilingual budget line makes the model write such a line more often is not measured.
- **Fix (code only, both modes, no prompt version change):** `kozolhetoSzoveg(szoveg, cimek)` gets the trigger's titles (`forras.cim`,
  `cim`, `rovid_cim`); a first paragraph that is ONE line of ≤ 6 words, ends with a period, is followed by more text, and whose ≥ 4-letter
  words are ≥ 60 % the title's words (5-letter stems, at least two) is a title and is dropped (`mondatCim`). The translation drops an extra
  short first paragraph that the source does not have (`forditasCimNelkul`; not an exclamation/question, not on the blog). Wired into
  writing, rewriting (incl. the F3 shorten retry), the post types, and the translation. Kept: „Tegnap befejeztük az udvart." (other
  words), „Kész a Fenyő utcai udvar!" (exclamation), a 7–8-word opening sentence that says something („Kökény Attila vasárnap este fellép
  a Győzelem téren."), anything when no title is known.
- **Trade-off:** a ≤ 6-word standalone first paragraph that repeats the title's words is treated as a title even if it has a verb
  („Kökény Attila vasárnap fellép nálunk.") — by Kati's rule that is a separate title sentence. Not done: a prompt v10 (would move four
  existing prompt-version tests); propose it if the live check still shows titles.

## Measured (Cowork VM, disposable Postgres 18.4, all migrations incl. 0173, `next build`, test AI, local képgyártó from `apps/kepgyar`
## on headless Chromium with DejaVu/Open Sans fonts)

- `probak/c30-f4-kep-nyelv.proba.ts` 6/6; `probak/c30-f3-cimsor.proba.ts` 5/5. Mutations: kepCel back to hu|ro, the toggle always shown,
  the saved language ignored → 3 red; the period-title guard and the translation guard off → 3 red.
- **Browser, Sovata [ro, de] egyben (HU UI):** the page opened with „Német változat is" ON, the translation request went with `cel: "de"`,
  preview switch „Román | Német", „Mit töltsünk le?" „Román · Német · Mindkettő" with Mindkettő selected, „Két kép: kep-esemeny-poszt-ro.png
  és -de.png"; one click on „Letöltöm" saved TWO files, `…-ro.png` and `…-de.png`; the German file shows the German text. RO UI: „Și
  varianta în germană". The test AI returns a ~230-character placeholder for every translation, over the image's 120-character field
  limit (the image route answers 400), so the harness types realistic German lines into the fields, as a person would edit them.
- **Before/after (base `5335d66` vs F4, same harness, 0 differing pixels unless noted):** [hu, ro] company: Képek page toggle off
  390/1512/whole phone page, toggle on (Román fields, switch, Mindkettő line) 390/1512/whole page, an old post with `kep_beallitas.ro`
  reopened 390/1512/whole page — **0 differing pixels everywhere**. One-language company: phone first screen 0; 1512 and the whole phone
  page differ only in the removed toggle row and its separator line (crops in `~/saas/_c30-f4-kepek/vag-*`).
- **Tibor (tibor-proba's measuring script, 390×844):** one-language 27 words green, [hu, ro] off 27 / on 29 green, Sovata egyben 29 green.
- apps/web suite, packages, checks: see HANDOFF.

## Open

1. **The small fixed words on the image (EVENIMENT / UNDE / CÂND, KÉSZ MUNKA …) come from the képgyártó's own dictionary
   (`packages/vizual-core/src/helyzet.ts FELIRAT`), which has hu, ro, en only.** A German image therefore carries the org's first-language
   small words (Sovata: Romanian), with German content. Adding `de` (and other languages) is a vizual-core + képgyártó change outside the
   F4 plan — needs a yes.
2. The F3 title fix is measured on fixed model answers only; the main session should re-check on the real AI after deploy.
