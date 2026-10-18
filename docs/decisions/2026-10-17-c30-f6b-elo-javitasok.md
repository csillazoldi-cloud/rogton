# 2026-10-17 — c30 F6b: live findings on F6 — the programme read in the background, the content languages, recall, the neutral page name

**Source:** Csilla + the main session on the test site with the real AI (org „Zilele teszt 2”), 10-17; item 4 Csilla 16:20.
**Requirements:** Csilla's standing rule (10-10): AI work must be visible; R-01 (never invent); rule 5 (nothing lost).
**Migration:** `0176_c30_f6b_adatok_felirat.sql` (48 label rows, existing keys only). **No NAS / nginx change.**

## 1. The programme read: a working state, never a false error

**Cause (measured in the repo):** `nas/nginx.conf` `location /` has `proxy_read_timeout 60s` (the DSM reverse proxy in front has its
own, assumed 60 s too). One real read is one big model call (~14k characters in, 6–8k tokens out, 60–120 s), so the proxy answered 504
at 60 s; the page turned that into „Most nem sikerült”, while the app finished the call and wrote the programme — „the result
appeared later”. The server's own model timeout was 120 s, which could also cut a slow read.

**Fix:** the read runs in the background. `POST /api/program/olvas` answers **202 `{olvasas}`** at once (the .docx checks — not a docx,
too big, empty — and an empty source still answer 4xx immediately); the state lives in the profile (`program_olvasas`: id, fut | kesz |
hiba, kind, start/end, the merge counts); `GET /api/program/olvas` returns it, plus the programme when done. The page shows the existing
working state („Olvassuk a programot…”) and polls every 2 s; a network hiccup never shows an error — only the server's „hiba” does, and
the page gives up after 12 minutes. One read per org at a time (a second POST follows the running one). A read still „fut” after 10
minutes counts as stuck (`ELAKADT`, e.g. a restart mid-read) and does not block a new one. Reopening the page during a read shows
the working state and waits for it (Beállítás D3 and Programod). The model now gets 300 s. The nginx timeout is not touched.

## 2. Content languages

Part A ticked the UI language when no language was chosen: the model's guess was stored only as `nyelvek_javasolt` and never used.
Now (no extra call): the languages the description NAMES („magyarul és románul”, „în limba română și germană”, „in Romanian and
English”) come first (`nyelvekSzovegbol`, in the order of mention; „Magyar Színház” is not a language), else the model's guess from the
same javaslatok call; the review ticks them (`nyelvek_forras: ai`), editable as before; with neither, the UI language (old behaviour).

## 3. Recall: 80 of 88 on the real file

The live per-day counts (Thu 6/8, Fri 22/25, Sat 24/25, Sun 24/26, whole event 4/4) point at the source's untimed blocks, not at the
timed rows (assumed — the live output is on the NAS, not read from here). From the real .docx text:
- **Thursday −2:** „Pe tot parcursul zilei / EGÉSZ NAP FOLYAMÁN” → venue header → a name line without a time („Târgul Meșteșugarilor /
  Kézművesvásár”, „Enescu Chill Zone” — same as the venue name). The v1 rule „a puszta helyszín-fejléc nem tétel” invites dropping them.
- **Friday −3:** the wine-street offer list („8 crame / 8 borászat, 1 pálinkakészítő …” — no name, a list), „Brâncoveanu Tasting Night”
  (a name + two sentences, no time), and the internal note / „10:00???????” line (prompted to flag, likely skipped as junk).
- **Saturday −1:** the RO-only block in another format („Conferință și lansare de carte … Data: 27.06.2026 · Ora: 11:00 -14:00”).
- **Sunday −2:** likely the „12:00 | … 112 Coffee” and the kids' corner rows under a summary heading that repeats them.
**Parser side (code):** an item was dropped when the model gave the name as a plain string, under an odd language key („HU”, „hu-HU”,
„magyar”), or only as `fellepo`. Now: odd keys map to the language; a plain-string name goes to the programme's first language; a
performer without a name becomes the name. Nothing is invented — every value still comes from the answer.
**Prompt v2:** names each pattern above as an item, and asks for a per-day pass over every timed and every all-day line before answering.
Tests: the patterns as stubbed answers (`probak/c30-f6b-elo-javitasok.proba.ts`).
**Proposal (not built): split by day.** The .docx text has clear day headers („JOI, 25 IUNIE / CSÜTÖRTÖK, JÚNIUS 25.”). One call per
day (pure splitter + 4–5 calls in parallel, the whole-event block with the last) cuts each answer to ~1.5–2k tokens: long single
answers are where models drop items, a slow read becomes ~20–30 s, cost stays about the same (the header is repeated, ~1k chars).
Recommend measuring on the test site first: run v2 once on the real file; if it is still short of 88, build the split.

## 4. The page name, neutral for every org type

„Szervezet adatai / Datele organizației / Organisation details / Company details” → **„Adatok / Date / Details”** wherever the page is named:
`nav.szervezet_adatai`, `nav.ugyfelprofil`, `r15.nav.szervezet` (menu, incl. the RO row „Date firmă”), `fiok.szervezet_cim` (page
title), `fiok.oldalcim` (browser title), `gephaz.szervezet_adatai` (Beállítások list), `nevek.vissza` (breadcrumb), and the sentences
that name the page: `kezdolap.profil_sor`, `kezdolap.teendo_arculat_szoveg`, `iranytu.javaslat_hiba_profil`, `onb.arak_kesobb`,
`onboarding.eb_lab`, `onboarding.kesz_arculat`, `onboarding.kesz_gomb_profil`, `onboarding3.arculat_kesobb`, `vz2.arculat_nelkul`
(only the page name). A company sees only this name change (Part B pixel compare: 0, apart from ±1 anti-aliasing on one checkbox).
**Not changed — other „cég / company” texts a festival can see** (changing them would change company screens too; each needs a
festival variant or a neutral rewording for everyone — Csilla's call): `nav.cegeim` „Cégeim”, `r15.kezdolap.elso_alcim` „A cégetek
adataiból írtuk.”, `r15.mit.javaslunk`, `iranytu.cim` / `osszhang.*` / `r15.poszt.illik_iranytu` „a cég iránytűje”, `iranytu.ures_szoveg`,
`iranytu.vizio_sugo`, `kezdolap.elso_szoveg`, `poszt.cta_megj`, `vz2.arculat_nelkul` „A céged színeit”, `vz.sablonok_bevezeto`,
`r16.arculat.*` „cégnevedből”, `r18.beall.ai_sor`, `nevek.nincs_profil`, `onboarding1.nev`, `onboarding1.nev_sugo`, `szervezet.nev_sugo`,
`hf.fu_cegednek`, `r15.mit.csak_cegrol`, `r15.mit.csak_nezed`, `onboarding.kesz_cim` „a szervezet adatai mentve” (EN/RO likewise).
