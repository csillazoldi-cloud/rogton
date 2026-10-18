# 2026-10-17 — c30 F1: organisation type + category (model, AI guess, regex fallback) — no screen change

**Decided by:** Csilla approved F1 on 2026-10-17 (plan c30, `docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md` §1.2, §2 Part A, §3 rows
`javaslatok.hu.md` / `kep_peldak.hu.md` / `kinalat-szabaly.ts TARTALEK`, §10 F1). Binding decisions passed on by the main session:
type and category are AI pre-filled with `biztos`; unsure and unanswered = `ceg` (D13); the categories reuse the closed list
(`rendezveny` waits for F11); Vilmos's sign-off is no longer needed (Csilla's standing rule) — the safety practices stay.
**Requirements:** R-01 (industry-independent: the client's kind lives in configuration), R-10. **Migration:** none. **RLS:** unchanged.
**Screens:** none changed. The type/category line on the review page is D1 and ships with F6 from the approved drawing (canvas v19).

## What changed

- **contracts:** `SZERVEZET_TIPUSOK` + `szervezetTipus()` (unknown → `ceg`), `KATEGORIAK` + `kategoria()` (unknown → `semleges`) — the
  single category list, moved from `apps/web/vizual/minta-kategoria.ts` (which re-exports it under its old names, same behaviour).
  New optional profile fields `szervezet_tipus`, `kategoria`, `tipus_forras` — plain strings (F0 rule), always read through the
  normalisers. Draft (`BemutatkozasLepes`): `szervezet_tipus`, `kategoria`, `tipus_biztos`. `JavaslatokValasz`: `szervezet_tipus`,
  `kategoria`, `biztos` (optional).
- **Prompt `javaslatok` v2:** the existing review-proposal call also returns `szervezet_tipus`, `kategoria` (the closed list, with the
  same descriptions as `kep_peldak`), `biztos`. No extra call, no extra cost. The server parses the three keys SEPARATELY
  (`tipusJavaslat`): a bad value never fails the whole proposal; without a usable answer → the regex fallbacks, always `biztos: false`.
- **Client (`ElsoBeallitas.tsx`):** the guess goes into the draft's `bemutatkozas`. Nothing is rendered.
- **Copy at approval (`profilPiszkozatbol`):** only when `tipus_biztos` — type, and for a company a non-`semleges` category,
  `tipus_forras: "ai"`. Unsure → nothing stored (D13: read as `ceg`; category = the regex fallback). Re-approval with an unsure draft
  keeps an earlier stored type/category (F0: previous profile first).
- **`profil/tipus-szabaly.ts` (pure):** `kategoriaOf(profil)` = stored category, else `vendeglatas` if the round-7 hospitality regex
  matches name + summary, else `semleges`. `tipusOf`, `tipusJavaslat`, the festival regex (`fesztivál|festival|napok|zilele|days|
  rendezvény|programul|program`, plan §2).
- **Call sites switched:** `app/onboarding/beallitas/page.tsx` (list title flag), `onboarding/kinalat.ts` (both `vendeglato` uses; the
  `temak_terv` prompt line stays word for word — the category line is the `temak_terv` change, not F1), `temaTartalek` keyed by
  category (`KATEGORIA_SZETT`: hospitality → its set; every other category → the general set; both word for word from round 7).
- **Sample photo (`vizual/peldak.ts`):** a stored category wins over the AI's pick (`kepKategoria`) and is passed in as one input line.
  Only orgs WITH a stored category get that line, so every other org's fingerprint and stored examples stay as they are (no rewrite,
  no cost). The `kep_peldak` prompt itself is unchanged (still v3).

## Why it is safe for existing companies

No stored category exists before F1 and none is backfilled (plan §1.7), so `kategoriaOf` = the old regex for every existing org:
same list title ("Van étlapod?" / "Van szolgáltatás-listád vagy árlistád?"), same fallback topics, same `temak_terv` input.
The read-only count `c30-f1-egyezes.sql` (regex vs `kategoriaOf`) must give equal numbers on the NAS before and after the deploy.

## Measured (Cowork VM, disposable Postgres 18.4 + `next build` + test AI)

- `probak/c30-f1-tipus.proba.ts` 12/12. Mutations: `kategoriaOf` without the regex → 2 tests red; copying an unsure guess → 1 red.
- apps/web before (F0) 936 / 904 pass / 16 fail / 16 skipped → after 948 / 916 / 16 / 16, identical failure list. Four F0 expectations
  moved because `szervezet_tipus` became a known field (reason in place, rule 10); their "unknown future key" example is now `jovo_tipus`.
- Screens, real client flow in headless Chromium (form → machine → review → approve → setup → list step), company and hospitality
  org, 390 and 1512 px, animations off: 12 screenshots, 0 differing pixels except the header's "Mentve: HH:MM" clock (1512 review
  page). List titles unchanged. Shots: `~/saas/_c30-f1-kepek/elotte|utana/`.
- The SQL count was checked against the JS functions on 18 HU/RO/EN rows (ICU hu-HU): 0 per-row mismatches.

## Open

- A real-model run of `javaslatok` v2 (the test connector returns no type keys) — check on the test site after deploy.
- New orgs approved with a SURE AI category follow that category, also where the regex would disagree (e.g. a guesthouse the AI calls
  something other than `vendeglatas` gets the service-list title). This is the intended replacement of the regex; visible to the person
  only once D1 (F6) shows the line.
- The festival regex is broad (a restaurant "rendezvények" text → `fesztival`, unsure). Inert in F1 (unsure guesses are never stored);
  F6 asks the one question only when `biztos === false`.
