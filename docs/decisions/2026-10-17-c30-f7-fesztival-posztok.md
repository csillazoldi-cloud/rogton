# 2026-10-17 — c30 F7: the festival in the topic plan and the post prompts — topics, the programme slice, the names, the fact guard

**Decided by:** Csilla approved plan c30 (`docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md` §3 rows `temak_terv`, `TARTALEK`, `poszt_tipus`
album; §3 bullets programme slice, glossary merge, fact guard; §4 topic table; §10 F7). Handed over by the main session after F6 was pushed
(`5376e9a`). The Naptár/Kezdőlap anchoring (`program/horgony.ts`, idea cards, ghost rows) is **F8**, not here.
**Requirements:** R-01 (the machine never invents — times and performers only from the programme), A-14 (input is data), A-11 (the
programme is read through the tenant context). **No migration, no new UI, no profile writes.**

## What changed

- **Topic plan (`onboarding/kinalat.ts temakatJavasol`, prompt `temak_terv` v2):**
  - company: the old hospitality-only line („A cég vendéglátással foglalkozik.") is replaced by a category line for EVERY trade
    („A cég szakmája: építőipar." …; none for `semleges`) — `szakmaSor` in `profil/kinalat-szabaly.ts`;
  - festival: „Típus: fesztivál / rendezvény.", the event's dates and town, and a compact programme summary (`programOsszegzes`: items,
    days, counts by kind, the main stage's evening concerts ≤ 8). The prompt then asks for the festival set, each topic with `fajta`
    (`visszaszamlalo · holnapi_program · mai_program · fellepo · gyakorlati · album · koszono`).
- **Contract:** `FESZTIVAL_TEMA_FAJTAK`; `TemaTerv.fajta?: string` (plain string so a stored unknown never breaks a profile;
  `temakTisztit` keeps only the closed list).
- **Fallback (`TARTALEK`):** a `fesztival` set in HU/RO/EN, each with its `fajta`; `temaTartalek(…, tipus)` uses it for a festival.
  Company sets unchanged word for word (the F1 equivalence tests still pass).
- **Post prompts (`poszt/profil-blokk.ts programSorok`, wired in `poszt/index.ts profilBemenet` for every post action):** for a festival,
  after the profile: dates, town, and the programme SLICE — the anchored item / that day (`program:<fajta>:<day>[:<id>]` in
  `forras.azonosito`, the form F8 will create), else the items the trigger names (≥ 5 letters, any language), ≤ 25 lines, never an
  inactive row (the internal note). No slice → one line forbidding concrete times/performers. The slice's name pairs go along.
- **Glossary merge (`program/blokk.ts programNevek` → `hivatalosNevek()` in `poszt/index.ts`):** the programme's two-language names and
  venues („Középkori Vár ↔ Cetatea Medievală") are appended to the org's own list at write time for `nevCsere`; the org's own list wins on
  conflict; nothing is written to `hivatalos_nevek`. Pairs need both forms ≥ 4 letters and different; no repeats.
- **Fact guard on festival posts (`poszt/tipus.ts tenyorrelKer`):** the plain post (`szovegetKeszit`) of a festival now goes through
  `kitalaltReszek` like the format posts already did: a number or name not in the input → ONE retry naming them; the second answer stays.
  `kitalaltReszek` got one loosening: an inflected input word („a Középkori **Várban**", „a Győzelem **téren**": input word + ≤ 4-letter
  ending) is no longer flagged as invented — without it nearly every Hungarian festival post would have triggered a retry.
- **Prompt `poszt_tipus` v4:** the RENDEZVÉNY rule (times, performers, venues only from the listed programme) and the album rule (with
  photo descriptions, the caption may only say what the descriptions and the linked programme item say — the photos arrive in F10).
  `poszt_szoveg` / `poszt_cikk` are NOT bumped: the block itself carries the instruction, and the guard enforces it.
- **Test AI:** `temak_terv` answers the festival set (with `fajta`) when the input says „Típus: fesztivál".

## Measured (Cowork VM, local Postgres + `next start`, test AI)

- apps/web 998/966/16/16 → **1008/976/16/16**, identical failure list; packages 666/666. New `probak/c30-f7-fesztival-poszt.proba.ts`
  10 (8 pure + 2 live). Two header expectations moved with reasons (`poszt_tipus` v4). Mutations 4/4 red.
- Live: a festival org with three programme items gets the festival topics with `fajta`; its post is written and translated, and the RO
  text carries „Cetatea Medievală" (the glossary at work); the same name in Tibor's company's RO text stays as written; the profile's
  `hivatalos_nevek` stays empty.
- Tibor's company: Part B 0 differing pixels at 390/1512 (6 screens × 2) against the base build. Festival „Ezekről érdemes posztolnod" at
  390/1512 (same screen, festival topics); Tibor measure 51 words — topic names, the screen itself is unchanged.

## Not done here / open

- **Live run with the real AI** (plan: 5 topic posts, hand-checked for invented facts, in the cost log): not run — the VM has no AI key.
  Needs a run on the test site.
- The slice for a post with no anchor and no named item is empty on purpose (one forbidding line); F8's anchors fill it.
