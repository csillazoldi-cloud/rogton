# 2026-10-12 — R18 round 7: post topics & types (offer, prices, page, topic plan; five post types)

**Context.** Csilla approved Round 7 („post topics & types”): Claude Design canvas rows „Round 7 · A sötét / B világos” (14 artboards
each), spec + labels `design/R18-arculatfrissites/IRANYOK-round7.md`. Her changes on top of the drawing: the list question depends on the
trade (hospitality → „Van étlapod?”, everyone else → „Van szolgáltatás-listád vagy árlistád?”, both Link · PDF · Fotó), a real
„Nincs, átugrom” button on that screen, and the price question only once a list exists. Weekly volume is postponed (tied to packages).
Screens + audit: `design/R18-arculatfrissites/epitett-5/` (`kor7-*.png`, `audit.html`, `audit-szkript/`).

## Decisions

1. **Storage: the existing `szervezet_profil.adatok` jsonb** (like Hivatalos nevek). New optional profile fields: `honlap`, `kinalat`
   [{nev, reszlet, ar, aktiv}] ≤ 60, `kinalat_fajlok`, `arak_posztban`, `kozossegi_oldal`, `kepernyokepek`, `poszt_szokasok`,
   `tema_terv` [{tema, tipus}] ≤ 12, `beallitas_r7`. On the post: `forras.poszt_tipus`, `forras.tipus_javasolt`, `forras.tipus_adat`
   (per language). No new table, no RLS/policy change; tested: another organisation sees an empty list and km_app under the other
   organisation's context neither reads nor updates the profile row. Uploads (menu / price list PDF or photos, screenshots) go to the
   existing file store with the existing „dokumentum” purpose. Re-approving the profile keeps all of these.
2. **The new setup steps run right after the profile approval** (`/onboarding/beallitas`), not before it as drawn: they write into the
   approved profile (decision 1), which does not exist before approval. The step counter continues the existing two steps
   („3 / 7. lépés” …). „Mentés és kilépés” goes to Kezdőlap; everything stays editable under Szervezet adatai.
3. **Step 1 reads the website** (piszkozat website → stored as `profil.honlap` at approval; else the site the background branding step
   read; else the existing web research `kutatas.ts`): home page + up to three offer sub-pages → model → tick list. The site's own
   Facebook/Instagram link pre-fills step 4 („a honlapodon találtuk”). Nothing found → one empty editable line, same primary.
4. **List step** for everyone (title by trade, keyword detection HU/RO/EN). Link → URL field + „Kiolvassuk” (not drawn; needed to type
   the link); PDF / Fotó (several pages) → upload → model reads it. „Nincs, átugrom” is a real but quiet button (the screen has no
   primary: picking an option is the answer, per drawing). Read rows are appended to the offer list after „Rendben”.
5. **Reading images and PDFs** (menu photo/PDF, screenshots) calls the OpenAI Responses API directly (`onboarding/kepolvaso.ts`, like
   `kutatas.ts`): the text adapters take no images. With the stand-in AI (or no key) it returns a sample. Measured and within the budget.
6. **Prices.** The offer block goes into every post prompt (via the profile block, like the profile and the official names); prices
   only when `arak_posztban === true` (unanswered = no). Post-check `arakNelkul`: with prices off, the list's prices are removed from
   every output (text, rewrite, type outputs), even when the source contained them. Live-tested both ways.
7. **Topic plan** („Ezekről érdemes posztolnod”): 4–8 topics from the model (profile + offer + posting habits), each with one type;
   without the model a fixed fallback mapping. Also editable on Szervezet adatai → Kínálat és árak, under the offer list, saved by the
   same „Mentem” (Csilla's request; the drawing shows only the offer card).
8. **Post types** in Posztszöveg: chip row under the title; a chip = the model writes that type (same credit as „Új változat”); tapping
   the active chip returns to the plain text post (no model call). Video = 45 s talking-head script modelled on Csilla's
   video-script-writer Mode 3 (hook 0–3 s, spoken / on-screen / shot kept apart, 95–110 words, 2 alternative hooks — tap swaps row 1),
   „Másolás” copies the table as plain text. Poll = question + 2–4 answers (editable before copying). Album = caption in the normal text
   field + numbered shot list, „Kész, másolom” as today. Picmess / Szöveges kártya = card title + line, primary → the round-6 template
   step (`/kepek?poszt=…&tipus=kartya` preselects „Tudtad?”). „· javasolt” comes from the topic plan (word match on the post's title).
   No preview column in type mode (as drawn).
9. **Permissions:** the offer, prices and topic plan are editable by editors (like Hivatalos nevek) — *Vilmos to confirm*.

## Follow-up (live, 10-12)

10. **No invented details in post types.** `poszt_tipus` v2: facts only from the trigger, profile, offer and glossary; missing specifics
    are written generically or as a question; proper names keep one form. Code guard for the checkable part (numbers and proper names not
    in the input → one retry naming them); invented activities are covered by the prompt and regression tests, not by code (too fuzzy).
11. **Page end.** The Visszajelzés button and the faded wordmark are portalled into a stable last element of the layout (`#km-lap-vege`),
    so they stay after the content after client-side navigation too. The layout audit opens pages by client-side navigation and checks it.

## Not in this round
- Kezdőlap / Naptár suggestions carrying the topic's type (spec build list 4) — not in the coordinator's list; the post page shows the
  suggested type instead. Weekly volume (postponed). Facebook connection (Vilmos: external access).

## Not verified locally
- Real website reading, real model output and real image/PDF reading (VM: no internet, stand-in AI). In the screenshots the site-read
  RESPONSE of step 1 is supplied in the browser (the page and flow are the real code). Emoji glyphs (no colour-emoji font in the VM).
