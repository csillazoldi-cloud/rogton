# 2026-10-11 — R18 last round: old-name sweep, „Saját ötlet” input, „Naptár”, layout audit

**Context.** Csilla (lead) approved the Round 5 drawings (Claude Design „Aitmetica arculatfrissítés — Posztgyár · sötét/világos”, artboards
„Saját ötlet …” and „Naptár …”, A = dark, B = light) and asked for the last R18 round in one push: remove every trace of the old product name,
give „Saját ötletből” a real input, add a post calendar, and audit every page for alignment / overflow („1 posts done”, Kezdőlap tiles).
Screens + audit: `design/R18-arculatfrissites/epitett-3/` (audit.html, audit.json, audit-szkript/).

## Decisions

1. **Old name gone (migration 0165).** The last 15 label rows with „Kommunikációs munkatér / Spațiu de (lucru de) comunicare / Communication
   workspace” (`kozos.app_nev`, `nyitolap.termeknev`, `koltseg.munkater`, `kezdolap.sor`, `r17.level.bevezeto`) + the sign-in heading
   (`belepes.cim_kiemelt` „munkatérbe.” / „workspace.” and `belepes.cim_eleje` EN) now name the product (Posztgyár / Fabrica de postări / Post
   factory). „Munkatér” as a CONCEPT (the customer's workspace: „Kilépek a munkatérből”, „Munkatér: {munkater}”) stays — it is not the product
   name. Internal identifiers (repo, containers, hub slug `kommunikacios-munkater`, DB) and the legal name Aitmetica SRL stay. Tab/app icons from
   `logo/at-jel-szines.png` (dark tile + paper tile, 32/192/512, maskable, apple-touch, favicon.ico), `app/manifest.ts` name „Posztgyár”.
2. **Saját ötlet = one field.** „Saját ötletből” opens „Miről szóljon a poszt?” (desktop: panel at the top of Posztszöveg; phone: bottom
   sheet) with „Megírjuk”. The text becomes `forras.szoveg` (and `forras.cim`; the work's title is its first six words). Empty is still
   allowed (the machine picks a topic, as before). The post prompt (`poszt_szoveg` v7) treats the idea as the SUBJECT, the company profile as
   background only, and forbids inventing names, numbers, places, dates, events or results beyond the idea. The input builder moved
   unchanged into the pure `poszt/bemenet.ts` (`szovegBemenet`, `kivaltoSorok`) so a test guards that the idea reaches the prompt.
3. **No photo picker.** The drawing's „Fotók hozzá” row („A fotókból is írunk, és képet is ajánlunk hozzá”) is NOT built: the text model
   cannot see photos and a post holds one image — a half-working control would break rule 4 (no dead controls). Needs its own decision
   (vision model + multi-photo post) before it is drawn back in.
4. **Naptár on the existing table (migration 0166).** Three nullable columns on `poszt_munka`: `tervezett_nap date`, `javasolt_nap date`,
   `kiteve timestamptz`. No new table, no RLS change — the row's existing policy (`poszt_munka_sajat_szervezet`) covers them; tested
   (`probak/r18-kor3.proba.ts`: other org gets 404 and km_app under the other org's context reads/updates 0 rows). API inside the poszt module:
   `GET /api/poszt/naptar` (member), `POST /api/poszt/<id>/naptar` {elfogad | nap | kitettem} (editor).
   - A post is in the calendar once it is „Kész” (a cell finalised by „Kész, másolom”) — the same rule as the Posztszöveg „Kész” list.
   - The machine proposes a day for every ready post without one (tomorrow … today+13): free day, not next to another post, Tue/Thu best,
     Mon/Wed/Fri next, weekend last (`poszt/naptar.ts javasolNapot`). The proposal is stored (does not jump); an expired, unaccepted one is
     re-proposed. Tibor accepts („Elfogadom”) or picks another day from today + 13 („Másik nap”, one tap); „Kitettem” marks it posted.
   - One question per screen: „Kitetted a mai posztot?” (a planned day reached, not posted; „Még nem” opens the day picker) → „Jó lesz
     (jövő) csütörtökön?” (first proposal, primary „Elfogadom”) → „A heted rendben van” → „Még nincs kész poszt”. Progress line „Ezen a héten:
     n kitéve, m tervezett” (proposals do not count).
   - „Kitettem” is not on the post page (not on the drawing).
5. **Plural forms.** The label template now understands an ICU subset (`{n, plural, one {# post} other {# posts}}`, `few` for Romanian:
   0 and 2–19 → „postări”, 20+ → „de postări”) in one place (`nyelv/sablon.ts`, used by client, server and the event log). EN/RO values of the
   counters that hit 1 on Tibor's pages were rewritten (migration 0167). Hungarian needs no plural form. Not changed: the `hf.*` labels (they
   live in the `@km/news-monitor-feliratok` data file; separate change).
6. **Layout audit — and its fixes.** A Playwright script visits 54 route variants × HU/RO/EN × 390/768/1024/1280/1440 × dark/light (1620
   views) and flags horizontal scroll, text overflow in buttons/tiles/chips/nav, two-line button labels, overlapping content and misaligned
   flex rows. Before: 606 findings (286 horizontal scroll, 212 two-line buttons, 88 overflow, 20 overlap, 0 misaligned). After: 0.
   Fixes (`app/r18.css` §9, plus `felsosav.css`):
   - **Top bar uses the phone layout (mark + page label + bell + ☰) up to 900 px** (was 640): at 768 the six menu items (with Naptár), mode
     switch, bell and account did not fit — every logged-in page scrolled sideways. Content layouts keep their 640 px breakpoint.
   - Kezdőlap tiles: name on one line with „…”, the „11 days ago” time only when the tile is wide enough (container query); phone names may
     wrap to two lines. (Csilla's EN screenshot bug.)
   - Posztszöveg 641–1100 px: two columns, the preview under the text (the middle column was squeezed to 96 px at 768).
   - Smaller ones: Posztszöveg tabs and the „Make an image for this post” button do not wrap; Képek 3 columns 901–1199 px and a slimmer
     primary button in the highlighted card; Közlemény cards 2 per row 641–900 px; date field width; pre-login phone header (RO name wraps,
     right side stays on one line); Feliratok/Theme admin pages (ellipsis + title, select width); badges and the sign-out-everywhere button.

## Open / to check live
- Real model output for an own idea (local runs use the test AI): try „csapatépítő hétvége Szovátán, fotóalbum a csapatról” on the test site —
  the text must be about that, not paving.
- NAS dry runs of 0165 (INSERT 0 19), 0166 (ALTER TABLE), 0167 (INSERT 0 180).
- Vilmos: the Naptár is a new top-level nav item and the 900 px top-bar breakpoint is a product-level layout change (rule: agree first).
- Photos for „Saját ötlet” (decision 3).
