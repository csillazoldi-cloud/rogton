# c30 F12 — a festival never sees „cég / company / firmă” (2026-10-17)

**Requirement:** Csilla 10-17 19:26 (via the coordinator): a festival org never sees company wording. Every „cég/company” text a
festival can see gets a festival variant (HU/RO/EN); the AI prompts say „a fesztivál” for festival orgs; the image samples get
festival wording; company screens stay byte-identical. Builds on F6b (`2026-10-17-c30-f6b-elo-javitasok.md`, which listed the
untouched texts) and the c30 org type (`profil.szervezet_tipus`, `tipusOf`).

## Mechanism (and why it is the cleanest)

A festival variant is an ordinary label row whose key carries the suffix **`@fesztival`**: `nav.cegeim@fesztival` HU/RO/EN next to
`nav.cegeim`. `lapFeliratai` (the one place that builds a page's dictionary, `apps/web/szovegek/index.ts`) loads the org's profile
and runs `tipusValtozat` (`apps/web/szovegek/fesztival.ts`) as the last step:

- every `…@fesztival` key is stripped from the dictionary, for every org → a company's dictionary is byte-for-byte what it was;
- for a festival org each variant replaces its base key — unless the org has its own override for that key (an org's own wording
  always wins, as before).

Why this and not the alternatives:
- **No component changes.** The 44 texts live on ~25 screens; a variant in the dictionary reaches every `t("…")` call, the page
  titles (`oldalcim`) and the client components alike, with zero edits in them. Passing the org type into each component (or a
  `t(key, {tipus})` API) would touch every screen and could drift.
- **Same tools as every other label:** one table, HU/RO/EN rows, a new migration, the existing admin override path. Adding a variant
  later is one migration row; nothing else.
- **Why `@` and not `.`:** the first draft used `.fesztival` and the dry run caught it — `c30.tipus.fesztival` („Fesztivál”, the
  org-type answer on the first-setup screen) is a real key ending in `.fesztival` and would have been stripped for everyone. Label
  keys only use `[a-z0-9_.]`, so `@` can never collide. A test guards it (no key before 0180 ends in `@fesztival`;
  `c30.tipus.fesztival` is present in both company and festival dictionaries).

## „Szervezeteim”, not „Fesztiváljaim”

`nav.cegeim` („Cégeim”) is the menu that lists ALL of the user's workspaces. One person can have a company and a festival side by
side; „Fesztiváljaim” would be wrong for the company in that list, while „Szervezeteim / Organizațiile mele / My organisations” is
true for any mix. It is shown only when the current org is a festival; companies keep „Cégeim”.

## What changed — 44 keys (migration `0180_c30_f12_fesztival_feliratok.sql`, 132 rows)

- F6b's list: `nav.cegeim`, `r15.kezdolap.elso_alcim`, `r15.mit.javaslunk`, `iranytu.cim`, `osszhang.cim/ellentmond/iranytu_link/nincs_iranytu`,
  `r15.poszt.illik_iranytu`, `iranytu.ures_szoveg`, `iranytu.vizio_sugo`, `kezdolap.elso_szoveg`, `poszt.cta_megj`, `vz2.arculat_nelkul`,
  `vz.sablonok_bevezeto`, `r16.arculat.logok.van_alcim`, `r16.arculat.nevlogo.kerdes`, `r18.beall.ai_sor`, `nevek.nincs_profil`,
  `onboarding1.nev`, `onboarding1.nev_sugo`, `hf.fu_cegednek`, `r15.mit.csak_cegrol`, `r15.mit.csak_nezed`.
- Found by grep + the DOM crawl: `beallitasok.mire_hasznalja_valasz`, `hf.profileTouch`, `hf.rOther`, `hf.freePh`, `koltseg.f_iranytu_javaslat`,
  `koltseg.f_poszt_osszhang`, `r15.elo.li_meta` („Szervezeti oldal · most”), `r15.kozos.kep_minta_alt`.
- Image samples: `vz2.h_kesz` „Ilyen volt” + leírás, `vz2.h_akcio` „Jegy, kedvezmény” + leírás, `vz2.h_uj/hir/tudtad/esemeny_leiras`,
  `r15.kozos.kepet_keszitek_munka` „Képet készítek a fesztiválról”.
- Iránytű examples: a festival now gets the `semleges` example keys, whose `pelda_kampany/tolni/cel_semleges@fesztival` variants are
  festival examples (`app/iranytu/page.tsx`: `fotoKategoria === "rendezveny"` → `semleges`).
- The 4 `hf.*` variants are also in `packages/news-monitor-feliratok/feliratok/hf.{hu,ro,en}.json` (single source; `feliratok-szinkron` requires DB = JSON).

**Deliberately no variant:** login/registration (no org yet); the „Cég vagytok, vagy fesztivált szerveztek?” question and its answers
(they must name both); `szervezet.nev_sugo` (the new org's type is not known yet when its name is asked); `r15.ir.pelda_tolni_<category>`
(trade examples — a festival gets the `semleges` set instead, see above).

## AI prompts

- `apps/web/ai/fesztival-szo.ts`: `prompt(file, …, "fesztival")` rewrites cég → fesztivál (word-boundary aware, all case/suffix forms the
  prompts use: cég, Cég, CÉG, cégről/cégnek/cégnél/céget, „cég szakmáj…” → „fesztivál témáj…”; `cégnév` untouched) in the 9 prompts that
  speak about the org: poszt_szoveg, poszt_cikk, poszt_tipus, poszt_atiras, poszt_forditas, poszt_nyelvre_szabas, poszt_osszhang, kep_peldak,
  iranytu_javaslat. The prompt files themselves are unchanged, so a company prompt is byte-identical.
- The machine's own input lines („amivel a cég foglalkozik…”, „A cég iránytűje:” …) are swapped by `fesztivalBemenet` — exact phrases only,
  never the user's own text. `profilSorok` writes „=== A FESZTIVÁL PROFILJA ===” for a festival.
- Callers pass the type: `poszt/index.ts` (aiKer), `iranytu/javaslat.ts`, `vizual/melle.ts`, `vizual/peldak.ts`.

## Image samples

- Badge (`packages/vizual-core` `FELIRAT_FESZTIVAL`, used when `HelyzetArculat.fesztival`): „KÉSZ MUNKA” → **ILYEN VOLT / CUM A FOST / HOW IT WAS**,
  „AKCIÓ” → **JEGY / BILETE / TICKETS**. `fesztival: false` renders byte-identical to the field being absent (test).
- Sample texts: `MINTA_FESZTIVAL` (all 7 situations, HU/RO/EN; e.g. „Ilyen volt a tegnapi este / Köszönjük, hogy velünk voltatok!”,
  „−20% a napijegyekre”, „10 000+ látogató tavaly.”), used by the Képek page and `helyzet-minta` when the org has no AI examples yet,
  and as the fallback in `peldak.ts`.
- Cost note: the festival profile fingerprint changes (new header), so an existing festival's AI image examples are regenerated once
  (one `kep_peldak` call). Companies: fingerprint unchanged, no call.

## Measured (VM, Chromium, test DB, test AI; 2026-10-17)

- **DOM crawl, festival org, HU/RO/EN × 34 pages** (all main pages, the 5 post types, the menu opened):
  `/(?<!\p{L})(c[ée]g|compan|firm[ăaei])/iu` over text, aria-labels, titles and alt texts → **0 hits** (before F12: 12).
  Positive control, company org: the same crawl finds „A cég iránytűje”, „cégnevedből” as expected. JSONs: `~/saas/_c30-f12-kepek/vegso/dom-*.json`.
- **Company pixel compare vs base `4739290`**, 11 screens × 390/1512: 21 of 22 at 0 px; `/fiok/arculat` 390 shows 18–36 px in rows
  154–229, which also differs between two runs of the base itself (render noise, not F12).
- **Tibor at 390, festival:** hírek 19, poszt 36, képek 23, kép-kész 32, iránytű 38, fiók 40, arculat 30, logók 30, névlogó 24 — green.
  Kezdőlap 42 words (T5 red) — the same 42 before F12, pre-existing.
- 0180 dry run: INSERT 132, rerun 132 (idempotent), ROLLBACK.

## Open

- `r15/kep.ts` `cegAdat`: the Instagram-style preview name falls back to `ceg` when the org name has no Latin letter or digit at all
  (accents are folded first, so HU/RO names never hit it). Not changed.
- Kezdőlap T5 (42 words) for both types — pre-existing.
- Not measured: the real AI model's festival output, the live screen.
