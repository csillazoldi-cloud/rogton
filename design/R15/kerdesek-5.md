# Questions — R-15 c5 Round 2 (09–10 Képek · 12 Szervezet adatai · 13 Beállítások · 14 Értesítések · 03 „Tegnap javítva”)

Only what the drawing could not decide. Each has a marked default (★); if it is fine, no answer is needed.

> **ANSWERED — Csilla 2026-10-10 18:08 / 18:20:** all ★ defaults, EXCEPT **Q6 changed**: the badges go, the small footnote
> „Az AI-javaslat nem tény” STAYS. Judge reds 10a telefon + 03j2 telefon (4, no complaint) accepted. Drawing fixes: real trade sample photo
> on 09/10/10b; 10b phone gets „Letöltés újra”. → BUILD (branch `c5-r15-kor2-kod`). Details: docs/decisions/2026-10-10-c5-rajz-biralat.md.
Drawing: `rajz/R15-lapok-5.dc.html` · machinery: `gepezet-5.md` · labels: `feliratok-6.json` · review page: `rajz/R15-lapok-5-attekintes.html` ·
probe: `meres/rajz5/` (26/26 green).

Csilla 10-10 17:25: the settings pages (12, 13, 14) are NOT judged by the Tibor judge; the drawing probe runs on everything and is green.
The judge runs only on 09, 10a, 10b, 03j, 03j2. Working state 10w is drawn, not judged.

## Questions

1. **(Csilla) 09 phone: the card descriptions are not shown on the phone.** 7 cards × name + description is 66 words; the phone limit is 40.
   The sample image already shows what each one is (its own text, the company name). Desktop keeps the descriptions. ★ Yes.
2. **(Csilla) 09 gets one primary: „Képet készítek a munkámról” on the „Kész munka” card** (accent edge; on the phone in the bottom bar).
   Today the page has no primary (T2 red, measured 09-26). Same key and the same target as the Kezdőlap 03c button (`/kepek/uj/kesz`).
   The other six cards stay links. ★ Yes.
3. **(Csilla) 10: „Így jó: …” example only under an EMPTY field.** When the machine has filled the field, the example is noise (T4/T5:
   with the photo, the colours and the examples the desktop goes to ~62 words — estimated, not measured). The example comes back as soon as the field is emptied. ★ Yes.
4. **(Csilla, rule 5 — removal) 10b: the „javaslat” badge next to „Mit írj mellé?” goes.** T3 bans the AI-suggestion badge; the whole
   page already says the machine wrote it. The text and „Szöveg másolása” stay. ★ Remove.
5. **(Csilla) 12 primary: „Logó és színek”** (→ `/fiok/arculat`, the R-16 pages). Reason: it is what makes the images look like him, and
   it is the only sub-page of 12. While a field is being edited (12b) the primary is „Mentés” and this button turns quiet. ★ Yes.
   (Alternative: no primary on 12 — then the probe is red on a page the judge does not score.)
6. **(Csilla + Vilmos, rule 5 — removal) 12: the source badges and the footnote leave the list.** „Te adtad meg / AI-javaslat / Weboldal alapján /
   Még nincs megadva” badges (T3 bans „AI-javaslat”, T6 bans badges on information) and the footnote „A forrásjelölés nem jelenti… Az AI-javaslat
   nem tény…”. The source stays visible as ONE sentence inside the editor („Ezt te adtad meg.” / „A weboldalatokból írtuk.” / „A megadott adatokból
   írtuk — nézd át.”). The stored source data (`*_forras`, `*_modositva`) is unchanged. Vilmos: the footnote is an AI-transparency statement.
   ★ Remove from the list; the one-sentence source in the editor is enough.
   **ANSWER (Csilla 18:08): badges go; the footnote STAYS as one short line under the list (`r15.sz.ai_nem_teny`; the other two sentences of `onboarding3.eredet_megj` were about the removed badges).** Wording deviation, for Csilla: „Az AI javaslata nem tény.” instead of „Az AI-javaslat nem tény.” — the T3 list bans the token „AI-javaslat”, and on 1440×900 the line lands just above the fold (measured: T3 red on 12a otherwise; the gate would block the build). Same meaning.
7. **(Csilla) 13 primary: „Meghívok valakit”** next to „Csapattagok” (→ `/tagok` with the invite dialog already open — small new client logic,
   gepezet-5 · 5). It is the one real action an owner comes to Beállítások for. ★ Yes.
8. **(Csilla; Vilmos for the product-level part) 13 removals:** the „tulajdonos nézet” badge, the „Itt a saját munkateredre állítasz… közös alap…”
   intro (jargon; the rendszergazda keeps both), and the „Árazás és fizetés — még nem működik” box (a dead box; the trial line stays:
   „Próbaidőszak — most nem kell fizetni.”, T3 bans „modul” in today's `csomag.radar_megj`). ★ Remove.
9. **(Csilla) 13: the one-line descriptions under each row go** („Ki léphet be a munkatérbe, és mit tehet.” etc.). The row name is enough;
   with them the page is ~73 words (T5, estimated). ★ Yes.
10. **(Csilla) 13: „AI-keret: … maradt” becomes the R-13 credit line** („Kreditjeid: 312 / 500 ebben a hónapban” · „Mire ment el?” → Saját fiók).
    The AI-usage page (`/koltseg`, „AI-használat”) and the currency selector move under „Haladó ▾” together with „Kapcsolat más rendszerekkel”
    and „Felület szövegei”. „Megjelenés” moves into the „Szervezet” group. ★ Yes.
11. **(Csilla) 14: the switches go behind „Miről szóljon ▾”** (closed by default; 14c shows it open). With the list, the primary and five
    switches the page is ~73 words (estimated); Tibor rarely changes these. ★ Yes.
12. **(Csilla; Vilmos — removal) 14: the „E-mailben” and „Telefonos értesítés” rows („még nem működik”) go.** **BUILD CORRECTION (10-10):** „A felületen” turned out to be a LIVE switch (`beallitas.feluleten`, PUT /api/ertesites/sajat) — it is NOT removed; it is the first switch behind „Miről szóljon ▾” (drawing 14c updated). Only the two dead rows go. They are dead switches (R-15 rule:
    no dead controls). „A felületen” (always on, not changeable) becomes one quiet sentence above the switches. They come back when e-mail/phone
    exist. ★ Remove.
13. **(Vilmos) Adatkezelés tab: unchanged in this round.** It holds the privacy answers, the real AI switch (owner) and a dead
    „Az adatom ne menjen ki felhőbe — még nem működik” switch. What we promise about data is Vilmos's area. ★ Not redrawn now; Vilmos reviews
    it before Round 3 (the dead cloud switch is the first item then).
14. **(Csilla) 14: the title says the state, the count line goes.** „2 új értesítésed van” / „Nincs új értesítésed” replace „Beállítások” +
    „Értesítések, és ahogy a megadott adatokat használjuk.” and the „2 olvasatlan · 5 összesen” line. Primary: „Megnézem a legújabbat”
    (opens the newest unread, same `/beallitasok/nyit/<id>` as the row link); „Mind olvasottnak jelölöm” stays as a quiet link. ★ Yes.
15. **(Csilla) 14b empty state: primary „Vissza a Kezdőlapra”.** The probe needs exactly one primary; nothing else is to be done here.
    The empty message no longer looks like an input field (T6). ★ Yes.
16. **(Csilla) Home „Tegnap javítva” (c7): a green ✓ and the number in the top bar, just before „Értesítések”; the list opens as a drop-down.**
    Measured on the drawing: the approved 03b is at 58/60 words (desktop) and 39/40 (phone) — any line in the page body breaks T5; the bar is
    chrome. A worded bar item („Tegnap 2 javítás”) wrapped the desktop menu, so it is the ✓ + number, with the full sentence as its tooltip /
    accessible name and as the drop-down heading. Nothing else on 03 changes. ★ Yes.
    (Alternative: a line under „Legutóbb … kerestünk híreket.” — clearer, but T5 red on 03 by 4/5 words; needs an exception.)
17. **(Csilla) Who sees it and for how long.** ★ Only the logged-in person's OWN reports (`fiok_id`, not anonymous), in the current
    organisation, marked „kész” in the last 24 hours (`kesz_ido`). Nothing fixed → nothing shown. Each item: the reported text in quotes,
    the page title if stored, „Megnézem” → the page where it was reported (internal paths only).
18. **(Csilla) 12 non-owner view is not drawn separately.** It is 12a without „Átírom/Megadom” and with today's line „A munkatér adatait a
    tulajdonos szerkesztheti…” under the title; the primary („Logó és színek”) opens the read-only arculat pages as today. ★ OK.

## Removed or moved — full list (nothing else leaves a screen)

| Screen | Today | Where it goes | Q |
|---|---|---|---|
| 09 | 2-sentence intro | 1 sentence (`r15.kep.helyzet_alcim`) | — |
| 09 phone | card descriptions | not shown on phone (sample image) | 1 |
| 10 | „Így jó: …” under filled fields | only under empty fields | 3 |
| 10 | „Amint elkészül a kép, letöltheted.” | the working state's calm line (10w) | — |
| 10b | „javaslat” badge | removed | 4 |
| 10b phone | title hidden | title shown („Kész a képed.”) | — |
| 12 | title „Szervezet adatai” | „Ezt tudjuk rólatok” (menu name stays) | — |
| 12 | green „Jóváhagyva” badge | quiet line | — |
| 12 | source badges + footnote | removed from list; one sentence in the editor | 6 |
| 12 | „Szerkesztés” | „Átírom” / „Megadom” (same editor) | — |
| 12 | „A mentett adatok a következő hírgyűjtéstől érvényesek.” | in the editor, under Mentés | — |
| 12 | card per field | one calm list, two groups | — |
| 13 | „tulajdonos nézet” badge, közös-alap intro, pricing box | removed (rendszergazda keeps badge + intro) | 8 |
| 13 | row descriptions | removed | 9 |
| 13 | „Csomag: Radar (próbaidőszak)” + „…a Hírek modul…” | „Próbaidőszak — most nem kell fizetni.” | 8 |
| 13 | AI-keret row, Pénznem | credit line; AI-használat + Pénznem under Haladó | 10 |
| 13 | Haladó group (open) | „Haladó ▾” (closed) | 10 |
| 14 | title „Beállítások” + intro, count line | state title | 14 |
| 14 | switches (open) | „Miről szóljon ▾” | 11 |
| 14 | „Elfogyott a havi AI-keret” switch name | „Elfogyott a havi kredit” | — |
| 14 | E-mail / Telefon rows | removed | 12 |
| 14 | „A felületen” switch row | one sentence | 12 |
| 03 | — | ✓ + number in the bar (only for reporters) | 16 |

## My own Tibor read (the judged views; the judge decides)

- **09:** „Mit szeretnél ma megmutatni?”, four sample images with HIS company name, the first one framed with a button. He presses
  „Képet készítek a munkámról”. Risk: the sample captions are fragments („a szürke kockakőre”); on desktop the button wraps to two lines in
  the narrow card. Expect zöld/sárga.
- **10a:** „Kész munka”, his own photo already on the image, both fields filled, „Letöltés” top right (bottom on phone). Risk: the
  „Színek” swatches without explanation. Expect zöld.
- **10b:** „Kész a képed.”, the text to put next to it, „Szöveg másolása”, how to post it. Expect zöld.
- **03j / 03j2:** the approved 03b; the ✓ 2 is easy to miss — that is intended (quiet). Risk: the judge may ask what „✓ 2” is. Expect as 03b.
