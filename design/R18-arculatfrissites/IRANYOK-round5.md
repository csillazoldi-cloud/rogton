# R-18 — Round 5: Saját ötlet + Naptár (+ Naptár in the nav)

2026-10-11 · design only · canvas version 9 (48 artboards). Round 4 is in `IRANYOK-round4.md`; everything from rounds 3–4 stays. The new artboards use the **live** look (`.elo` in the canvas CSS, copied from `apps/web/app/r18.css`): name ×0.8, name baseline on the bottom of the "a", gap ×1.5, the stronger breathing background.

## Canvas — new rows "Round 5 · A sötét" and "Round 5 · B világos" (same 11 artboards in each mode)
Saját ötlet · üres · asztali — Saját ötlet · kitöltve · asztali — Saját ötlet · üres · telefon (alsó lap) — Saját ötlet · kitöltve · telefon — Saját ötlet · írjuk (narancs) · telefon — Naptár · hét · asztali — Naptár · hét · telefon — Naptár · javasolt nap · telefon — Naptár · Kitetted? · telefon — Naptár · napválasztó · telefon — Naptár · üres · telefon.

## 1. Saját ötlet — spec
- Tapping „Saját ötletből" (Posztszöveg: the existing quiet link, menu item and empty-state main button) no longer starts generation at once. It opens **one field**:
  - phone: a **bottom sheet** over the page (scrim, grab handle, ✕ to close; swipe down or ✕ = cancel, nothing is spent);
  - desktop: an **inline panel** at the top of the Posztszöveg page (active-box edge), with a quiet „Mégse" link next to the button.
- Contents, in this order: title „Miről szóljon a poszt?" · one textarea (aria-label „Miről szóljon?", placeholder „pl. csapatépítő hétvége, fotóalbum a csapatról", 3 rows, grows) · „Fotók hozzá" quiet button + „nem kötelező" (up to 5 photos, thumbnails 64px with ✕ „Fotó törlése" each, „+" to add more) · one info line · **one primary button „Megírjuk"**.
- Empty field is allowed: the button stays active and behaves like today (the machine picks the topic from the company's iránytű). The info line says so: „Ha üresen hagyod, mi választunk témát." When text or photos are present, the line reads: „A fotókból is írunk, és képet is ajánlunk hozzá."
- Submit: the topic text (and photo ids) go to the existing post-generation call as the topic; the sheet/panel closes; the existing orange generating state („Írjuk a posztot…") shows on the post editor with a quiet line „Téma: <first ~60 chars> · N fotó"; then the existing post editor opens with the result. Nothing else on the editor changes.
- Credits: same cost as today's „Saját ötletből". When credits are out, the button is disabled as today.

## 2. Naptár — spec
- New top-level page `/naptar`, nav item „Naptár" between „Képek" and „Profil ▾" (desktop) and in the ☰ sheet after „Képek" (phone).
- **Layout:** title (T1) depends on what is waiting (see states) · progress line (T8) „Ezen a héten: N kitéve, M tervezett" with the orange bar · „↑ Korábbi hetek" quiet link (loads earlier weeks above, scrolls back) · „Ezen a héten" then „Jövő héten" lists, day by day (Monday → Sunday). Desktop shows the two weeks side by side; phone one under the other.
- **Day row:** mono day label („Hétfő / okt. 12."), today marked with an orange dot and „Ma · kedd". A day without posts is one quiet line, no box. A day with posts lists them: small image thumb (44px, only if the post has an image) · title (link → the existing post page) · state.
- **States of a post on a day:**
  - „Tervezett" — planned, not yet posted. A quiet „Másik nap" link opens the day picker.
  - „Kitéve ✓" — posted (green `--ok` text; no box emphasis).
  - „Javasolt nap — elfogadod?" — the machine proposed this day; dashed outline until accepted. Buttons: „Elfogadom" (primary when it is the only thing waiting, otherwise quiet) and „Másik nap" (quiet).
  - On the planned day, if not posted: „Ma van a napja. Kitetted?" — the row becomes the active box, primary „Kitettem", quiet „Még nem" (keeps it planned; asks again next time the page opens that day; the next day it shows „Tegnapra volt tervezve. Kitetted?" with the same two actions).
- **Proposing days:** when a post becomes ready (Kész, másolom / ready state), the machine proposes a day: the nearest free day from tomorrow, spreading posts out (default rhythm Tue + Thu; never two on one day if a free day exists within the next 7; skip weekends unless the company posts on weekends). It is only a proposal until Tibor accepts or picks another day.
- **„Kitettem" one-tap (proposal, not decided):** also offered right after „Kész, másolom" on the post page (existing flow) — the calendar just reflects it. Marking posted is reversible from the post page (no undo button on the calendar).
- **Day picker („Másik nap"):** bottom sheet (phone) / small popover (desktop) titled „Melyik napon tegyük ki?" with the next 14 days from today, one row each (`role="radio"`), the proposed day marked „javasolt", days that already have posts show „1 poszt". Tapping a row chooses it and closes; no extra confirm button.
- **One primary button per screen (T2):** priority 1 „Kitettem" (today's unposted post), 2 „Elfogadom" (oldest open proposal — pinned as a card above the list on phone so it is visible without scrolling), 3 „Posztot írok" (bottom bar, goes to Posztszöveg) when nothing waits. Everything else is quiet.
- **Empty state:** title „Még nincs kész poszt", line „Ha kész egy poszt, mi javaslunk neki napot.", this week's days as quiet lines, primary „Posztot írok".
- **Titles by state:** nothing waiting „A heted rendben van" / „Minden kész posztnak van napja." · proposal „Jó lesz jövő kedden?" (day name from the proposal) / „Az új posztnak ezt a napot javasoljuk." · posted? „Kitetted a mai posztot?" / „Ha kitetted, egy koppintás."

## 3. Top-bar nav
„Naptár" added on all relevant artboards (desktop nav, phone ☰ sheet, RO/EN bar, mode-switch sheet, motion sheet). Measured in a local Chromium render: at **1280** the bar fits (single-company: last element ends at 1256; with Cégeim: 1256, no overlap). At **1024** it fits only with the live medium-width rule already in `felsosav.css` (641–1100 px: name hidden, tighter gaps/padding): ends at 1008 for both single- and multi-company users. Without that rule it would overflow by 68 px (single) / 156 px (multi). Profil/Cégeim dropdowns re-anchored under their buttons.

## Labels (new `felirat` keys, HU / RO / EN — new migration)
| Key | HU | RO | EN |
|---|---|---|---|
| `nav.naptar` | Naptár | Calendar | Calendar |
| `sajat.cim` | Miről szóljon a poszt? | Despre ce să fie postarea? | What should the post be about? |
| `sajat.mezo` (aria) | Miről szóljon? | Despre ce să fie? | What should it be about? |
| `sajat.pelda` (placeholder) | pl. csapatépítő hétvége, fotóalbum a csapatról | de ex. weekend de team building, album foto cu echipa | e.g. team-building weekend, a photo album of the team |
| `sajat.fotok` | Fotók hozzá | Adaugă fotografii | Add photos |
| `sajat.nem_kotelezo` | nem kötelező | opțional | optional |
| `sajat.foto_torles` (aria) | Fotó törlése | Șterge fotografia | Remove photo |
| `sajat.ures_info` | Ha üresen hagyod, mi választunk témát. | Dacă lași gol, alegem noi tema. | Leave it empty and we'll pick the topic. |
| `sajat.foto_info` | A fotókból is írunk, és képet is ajánlunk hozzá. | Scriem și din fotografii și îți propunem o imagine. | We'll write from the photos too and suggest an image. |
| `sajat.gomb` | Megírjuk | Scriem noi | Write it for me |
| `sajat.megse` | Mégse | Renunță | Cancel |
| `sajat.tema` | Téma: {tema} · {n} fotó | Tema: {tema} · {n} fotografii | Topic: {tema} · {n} photos |
| `naptar.cim_rendben` | A heted rendben van | Săptămâna ta e în regulă | Your week is set |
| `naptar.alcim_rendben` | Minden kész posztnak van napja. | Fiecare postare gata are o zi. | Every ready post has a day. |
| `naptar.cim_javasolt` | Jó lesz {nap}? | E bine {nap}? | Does {nap} work? |
| `naptar.alcim_javasolt` | Az új posztnak ezt a napot javasoljuk. | Pentru postarea nouă propunem această zi. | We suggest this day for the new post. |
| `naptar.cim_kitetted` | Kitetted a mai posztot? | Ai publicat postarea de azi? | Did you post today's post? |
| `naptar.alcim_kitetted` | Ha kitetted, egy koppintás. | Dacă ai publicat-o, o singură atingere. | If you did, one tap. |
| `naptar.cim_ures` | Még nincs kész poszt | Încă nu e nicio postare gata | No post is ready yet |
| `naptar.alcim_ures` | Ha kész egy poszt, mi javaslunk neki napot. | Când o postare e gata, îi propunem o zi. | When a post is ready, we'll suggest a day. |
| `naptar.halad` | Ezen a héten: {k} kitéve, {t} tervezett | Săptămâna aceasta: {k} publicate, {t} planificate | This week: {k} posted, {t} planned |
| `naptar.korabbi` | Korábbi hetek | Săptămânile anterioare | Earlier weeks |
| `naptar.ez_a_het` | Ezen a héten | Săptămâna aceasta | This week |
| `naptar.jovo_het` | Jövő héten | Săptămâna viitoare | Next week |
| `naptar.ma` | Ma | Azi | Today |
| `naptar.tervezett` | Tervezett | Planificată | Planned |
| `naptar.kiteve` | Kitéve ✓ | Publicată ✓ | Posted ✓ |
| `naptar.javasolt` | Javasolt nap — elfogadod? | Zi propusă — accepți? | Suggested day — accept? |
| `naptar.javasolt_nap` | Javasolt nap: {nap} | Zi propusă: {nap} | Suggested day: {nap} |
| `naptar.elfogadom` | Elfogadom | Accept | Accept |
| `naptar.masik_nap` | Másik nap | Altă zi | Another day |
| `naptar.ma_kitetted` | Ma van a napja. Kitetted? | E ziua ei. Ai publicat-o? | It's today. Did you post it? |
| `naptar.tegnap_kitetted` | Tegnapra volt tervezve. Kitetted? | Era planificată ieri. Ai publicat-o? | It was planned for yesterday. Did you post it? |
| `naptar.kitettem` | Kitettem | Am publicat | I posted it |
| `naptar.meg_nem` | Még nem | Încă nu | Not yet |
| `naptar.valaszto_cim` | Melyik napon tegyük ki? | În ce zi o publicăm? | Which day should it go out? |
| `naptar.valaszto_javasolt` | javasolt | propusă | suggested |
| `naptar.valaszto_db` | {n} poszt | {n} postări | {n} posts |
| `naptar.uj_poszt` | Posztot írok | Scriu o postare | Write a post |
Day and month names come from the locale (Intl.DateTimeFormat, hu-RO / ro-RO / en-GB), not from labels.

## Build list (round 5)
1. Saját ötlet: sheet (phone) / inline panel (desktop) component on Posztszöveg; pass topic + photo ids to the existing generation; reuse the existing generating state and editor.
2. Naptár page + data (proposal): a `megjelenes` (planned date, proposed flag, posted_at) per post, tenant-scoped (RLS, A-11); proposal rule above; „Kitettem" also from the post page.
3. Nav: „Naptár" in FelsoSav (desktop + ☰ sheet); keep the 641–1100 px medium-width rule.
4. Labels above, new migration. New top-level page = product-level change → Vilmos's OK (and the new table touches RLS → his sign-off).

---
