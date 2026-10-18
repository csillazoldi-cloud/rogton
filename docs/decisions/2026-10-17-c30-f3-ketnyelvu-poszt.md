# 2026-10-17 — c30 F3: the bilingual post ("both languages in one post"), the setup step and the Settings switch

**Decided by:** Csilla approved F3 on 2026-10-17 (plan c30, `docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md` §5, §10 F3). Drawings: canvas
„Aitmetica arculatfrissítés — Posztgyár · sötét/világos", c30 boards D5, D6a, D6b, D6 desktop, D9b (A sötét / B világos; read from the live
canvas version `1792224034-9eea`, handed over as "version 19"). Binding decisions passed on by the main session: D6 (the setup step only for
2+ languages; pre-selected festival → `egyben`, company → `kulon`), D1 (first text, "———", second text, hashtags once at the end; order =
`nyelvek`), D15 (no separate CTA field in bilingual mode; the machine writes the call to action), blog stays separate per language, a
person-edited second part is never overwritten, the mode switch never changes `szovegek[]`, IG budget with a shorten-retry and never a silent
cut, labels in a new migration, tokens only. **Requirements:** R-14/R-15 (UI, communication and material languages are separate settings),
R-10, R-01, A-11 (the mode is written through `mezoMent` in the tenant context). **Migration:** `0172_c30_f3_ketnyelvu_feliratok.sql`
(labels only). **RLS:** unchanged.

## What changed

- **Pure rules (`apps/web/poszt/ketnyelvu.ts`):** `ketnyelvuOsszefuz` (D1), `hashtagVeg`/`kozosHashtagek`, `ketnyelvuKeret` (per-half budget
  = floor((limit − separator − 90 hashtag allowance) / 2): IG 1050, LI 1450; blog → none), `tulHosszu`, `masodikTeendo` (what „Kész, másolom"
  does with the second half: write · refresh untouched machine text · only SIGNAL when a person edited it · nothing), `mezoTorzs`/`mezoOsszerak`
  (a half's text field without its hashtag line, edits keep the half's own hashtags), `alapCta` (D15 intent).
- **Inputs (`poszt/bemenet.ts`):** an optional `keret` → one line "Hossz-keret: legfeljebb N karakter …" in the text, rewrite and translation
  inputs. Without it (every non-`egyben` post) the input is byte-for-byte as before. Prompts unchanged.
- **Server (`poszt/index.ts`):** `ketnyelvuKontextus` — `egyben` only for the org's first two languages, not on the blog. Then: the half budget
  in the input; D15: without a person's CTA the machine gets a CTA intent (with the website when known); the second half is always translated
  from the FIRST language's cell (RO-first orgs: RO → HU); after the translation, if the joined post is over the platform limit and the first
  half is still the machine's own text, the first half is shortened ONCE (`rovidebb`) and translated again. A person's text is never rewritten;
  if it is still too long, nothing is cut (the counter shows it).
- **Mode:** `profil/index.ts nyelvModMent` + `PUT/GET /api/profil/nyelvmod` (szerkesztő writes; one-language orgs refused) — writes only
  `poszt_nyelv_mod` via `profilTar.mezoMent`. `profil/tipus-szabaly.ts elsoNyelvMod` = stored, else festival → `egyben`, company → `kulon`.
- **D5 (`app/onboarding/beallitas`):** the step „Hogyan posztoljunk két nyelven?" after the prices step and before „Hol posztolsz most?",
  only for 2+ languages; the three rows are built from the org's languages (`nyelv.hatarozo.*`, `nyelv.targy.*` labels for all 18 content
  languages); „Rendben" saves. A one-language company sees exactly the steps it saw before.
- **D6 (`app/poszt/R15Poszt.tsx`):** in `egyben`, on FB/IG/LI, for a text post, on the first language: one field with the first part, "———",
  the second part (its own cell), the hashtags once; the page writes the second part by itself after the first exists; the stale line
  „A magyar rész változott." + „Frissítem a románt" only when a person edited the second part; „Kész, másolom" refreshes an untouched stale
  or missing second part first (visible „Írjuk…"), copies the joined text (ClipboardItem with a promise, so the copy survives the wait),
  finalises both cells; the CTA field is hidden (D15); the counter „N karakter · egy posztban" (desktop) / „N / limit karakter · egy
  posztban" in the field (phone); under the desktop preview „A Facebook az első sorokat mutatja: ezek magyarul vannak.". „Más nyelven" on the
  first two languages returns to the joined post; a third language opens today's single-language view. „Mit írtál át?" is hidden in this mode.
- **D9b (`app/beallitasok`):** „Posztok nyelve" row (2+ languages, not for viewers) → the same three rows, one tap saves, „A meglévő posztjaid
  szövege nem változik.", „Nyelvek: magyar, román · Szervezet adatai ›".

## Measured (Cowork VM, disposable Postgres 18.4, all migrations, `next build`, test AI, headless Chromium with DejaVu/Open Sans fonts)

- `probak/c30-f3-ketnyelvu.proba.ts` 10/10. Mutations: a person-edited second part treated as refreshable → red; the shorten retry ignoring
  "machine text only" → red. apps/web 954/922/16/16 → 964/932/16/16, identical failure list; packages 666/666.
- One-language company before/after (setup kínálat step, Posztszöveg, Beállítások; 390 + 1512): **0 differing pixels**; the setup steps are
  the same four.
- Festival [hu, ro]: D5 pre-selects „Egy posztban mindkét nyelv", saves `egyben`; D6 two fields + one separator, no CTA field, counter
  „421 karakter · egy posztban" / „421 / 2200 …"; D6b line shown; the copy puts the joined text on the clipboard (one "———", "#minta" once)
  and both FB cells are `vegleges`; D9b rows and lines as drawn.
- **Tibor (tibor-proba's own measuring script, 390×844):** D5 green (32 words, 1 primary button). D6a/D6b **red on T5**: 45 words (news post)
  / 52 (own-idea post) above the fold, limit 40. The extra words come from existing page elements that are NOT on the D6a drawing (post
  selector + „Saját ötletből", the type chips, „Szöveg / Így fog kinézni", the „Téma:" line for own ideas). Today's single-language page
  measures 49 in the same harness. Not removed: rule 5 (no feature removal without a yes) — an open question.

## Follow-up — Csilla decided 2026-10-17 12:4x (answers to the four open questions of the first F3 build)

1. **Post first, in BOTH modes (one- and two-language):** directly under the title and subtitle come the platform tabs, then the post field
   — as on the D6 drawing. Nothing was removed; MOVED below the post: the „Szöveg / Így fog kinézni" tabs (phone), the „Ezen a héten" progress
   line (desktop), the „Téma:" line (own ideas) and the post-type chips, in that order, quiet. The post selector line („… · 1/1 ▾" +
   „Saját ötletből") stays above the title. The primary button stays „Kész, másolom". On the phone the post now fills the first screen: each
   half of the joined post is at least 7 lines tall, the one-language field 400 px (so the rewrite buttons and „Mire hívod az olvasót?" start
   under the thumb, below the fold). Choosing „Így fog kinézni" on the phone still hides the field and shows the preview right under the tabs.
   **Because of this the one-language page is no longer pixel-identical to before — accepted by Csilla.**
2. **Overflow sentence:** if the joined IG/LI (or FB) post is still over the platform limit after the one shorten-retry, one quiet sentence
   under the counter: „Hosszabb, mint amit az {platform} enged — rövidítsd a {első nyelv} részt." (labels `c30.ket.tul_hosszu_fb/ig/li`,
   HU/RO/EN, added to 0172 — 0172 is not applied anywhere yet; 174 rows now). Plain text, no alarm colour (T7). Shown only when nothing is
   being written.
3. **Accepted as built:** the „Posztok nyelve" row under „Szervezet adatai"; album/video/poll/card keep the per-language view in `egyben`.

### Measured after the follow-up (same VM harness, `next build`, 390×844, tibor-proba's own measuring script)

| View | T5 words above the fold (≤ 40) | Tibor |
|---|---|---|
| One-language company, news post | 34 | green |
| One-language company, own-idea post | 34 | green |
| Festival [hu, ro] D6a, news post | 37 | green |
| Festival [hu, ro] D6a, own-idea post | 37 | green |
| Festival D6b (second part edited, first changed) | 35 | green |

What still counts on the phone: the selector line, title + subtitle, the four platform tabs, the counter (two-language), the first two rows
of rewrite buttons (they sit under the fixed bottom bar but the meter counts them), „Kész, másolom". Overflow sentence checked on desktop and
phone with a person-written long HU part on Instagram (2318 / 2200). apps/web 964/932/16/16 (failure list identical to the first F3 run and
to the base), packages 666/666, tipus/tokenor/keretor/terkoz/dockerfile-or/allapotor green. `pnpm hatar` shows only the 2 known `nincs-kor`
cycles (`profil/index.ts ↔ vizual/peldak.ts`, `vizual/helyzet.ts`), measured identical on `c05d720` (before c30).
After-shots: `~/saas/_c30-f3-kepek/utana3/` (390 first screen, 390 whole page `-teljes`, 1512; both modes; D6b; overflow; phone preview tab).
