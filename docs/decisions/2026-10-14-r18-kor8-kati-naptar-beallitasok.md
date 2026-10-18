# 2026-10-14 — R-18 8. kör: Kati javításai + Round 8 rajz (Naptár, Beállítások)

Status: built and verified in the VM (tests, screenshots, full layout audit); one push on the coordinator's go.
Refs: Kati's feedback 10-13/14 (hub card kommunikacios-munkater); Round 8 drawing (Claude Design canvas FHNvYfuQ8QhXQn4qKgw6Hf,
rows "Round 8 · A sötét" / "B világos", shots in `design/R18-arculatfrissites/round8/`); Csilla's locked answers 10-14 and calls 10-15.
Built screens: `design/R18-arculatfrissites/epitett-6/`.

## Decisions

1. **Visszajelzés button (Kati: "stuck to the bottom of the Posztszöveg page" on desktop).** Fixed bottom-right on every page outside
   the phone bottom-bar frame, as drawn in Round 8 (a transparent fixed `.km-vj-hely`; only the button is clickable). The page bottom
   reserves room for it, so the end of every page, including a primary button there, scrolls clear. The phone bottom-bar frame keeps its own
   strip. The faded logo stays at the page end (`#km-lap-vege`). The Round 7 "button at the page end" rule is retired. The audit check
   `nem-a-lap-vegen` now ignores elements with a floating ancestor. A new check `vj-fo-gombot-takar` enforces T10 (the button never covers a
   primary button, at the top or at the end of the page).
2. **No title line.** Prompt `poszt_szoveg` v9 and `poszt_atiras` v4, plus a code guard `kozolhetoSzoveg`. A short first line without end
   punctuation that is followed directly by a long sentence is stripped, and so is an ALL-CAPS first line. An emoji at the end of a line
   does not count as punctuation.
3. **CTA is intent.** The code no longer pastes the CTA literally (`ctaBeszur` is kept but unused). The AI writes the closing in the post's
   voice (`ctaSorok` intent line). "Beleírom" now runs `poszt_atiras` with the new operation `felhivas`. Prompt versions: szoveg v9,
   atiras v4, tipus v3, cikk v2.
4. **Selected post-type chip.** It has a solid primary background and a ✓.
5. **Kép szerkesztése / Kép letöltése.** The editor settings travel with the image to the post (`forras.kep_beallitas`, sent in the
   header `x-kep-beallitas`). `/kepek/uj/<helyzet>?poszt=…&szerk=1` reopens the editor pre-filled. "Kép letöltése" sits next to
   "Kész, másolom". No new table or column.
6. **"Minden méret": skipped this round (Csilla 10-15).** There are no stored renders, so every size would have to be re-rendered.
7. **Szervezet adatai.** The website and the Facebook/Instagram page are now editable (PUT `/api/profil/kinalat`).
   **Phone "logo button disappears on scroll":** the root cause was an invalid nested `:has()` in `r15-lapok.css`. The browser dropped the
   rule, so the body got 140 px of bottom padding, the whole document scrolled and the frame slid away. Fixed for every phone-frame page.
8. **Megjelenés on phone.** The scheme tiles are compact. Fő szín, Betűméret and Élő előnézet sit behind "Részletek ▾", and the save
   button appears with them. Nothing was removed.
9. **Saját ötletből.** One tap from Kezdőlap (`/poszt?sajat=1`) and from the phone post page. It is a quiet link (T2).
10. **c18 logo-replace confirmation.** The card is solid (it was translucent), opens as a bottom sheet on phone, and shows old → new logo
    in one row.
11. **B-roll echo.** A guard (`szabalyVisszhang` / `visszhangNelkul`) plus a rule in `poszt_tipus` v3.
12. **Naptár (Round 8).** One week in 7 columns, with week paging and "Ma". Below 1024 px it switches to the phone view: a 7-day strip with
    dots, the selected day's posts, and "+ Új poszt". The 1024 px cut was found by the layout audit: the week grid's buttons wrapped at
    768 px.
    - **Moving a post:** drag with the mouse (starts after 8 px), or long-press (450 ms) onto the strip. "Másik nap" stays in the "…" menu
      in the phone view (locked answer 1).
    - **"…" menu:** "Levétel a naptárból" and "Poszt törlése" act at once, with a 10 s "Visszavonás" (locked answer 2).
    - **Soft delete only:** `forras.torolve` hides the post from every post list. `forras.naptar_le` keeps the previous days for undo.
      There is no hard delete, no new table or column, and RLS is unchanged.
    - Weekends are not dimmed (locked answer 3).
    - A day's "+" opens `/poszt?nap=…`, and "Kész, másolom" then puts the post on that day.
    - The `nap` action range is now today −31 … +90.
    - On the phone the question's day opens first.
13. **Beállítások (Round 8).** A re-layout only. On desktop there is a left list beside the chosen part; on phone `/beallitasok` is the
    list and each part has "‹ Beállítások". Every row links to the existing page or tab. Megjelenés and Iránytű are listed, and the Profil
    menu shortcuts stay (locked answer 4). The light-mode profile circle is dark green, as drawn (Csilla 10-15).
14. **Tibor-zár.** The accepted T2 reds are added to `tools/tibor-proba/elfogadott.json`: `ertesitesek/telefon` (the Beállítások list),
    `adatkezeles/*` and `naptar-huzas/telefon`. Reason: "list/transient state, no single primary action — accepted by Csilla 2026-10-14"
    (locked answer 5). The probe now also measures Adatkezelés and Naptár.

15. **Posztszöveg phone fixes (coordinator 10-15, from kor8-poszt-sotet-390).**
    - The rewrite button row (Rövidebben … Új változat) used to be a horizontal scroller that showed "Közvetlenebbül" cut off at the card
      edge. It now wraps as whole buttons onto several rows.
    - The faded aitmetica logo on phone bottom-bar pages was `position: fixed` (y≈728 in every scroll position). It is now in normal flow
      at the end of the scrolling `<main>` (`main.km-lap-keret::after`), below all content. The body-end copy is hidden on those pages.
      This applies to every page with the sticky bottom bar.
    - "Kép letöltése" has moved from the card into the sticky bottom bar. It sits as the quiet secondary button beside the primary
      "Kész, másolom" (T2) and fits on one line at 390.
    - The new audit rule `kilog` also found the invitation page (`/meghivo/…`, phone): its full-width buttons stuck out 13–27 px because
      `box-sizing` was missing. Fixed.
16. **New audit rules.**
    - `kilog`: a button, link or tab rect lies outside its nearest clipping container. Data-table scrollers are exempt.
    - `halvany-takar`: the faded logo intersects any content element (no size threshold), or is fixed/sticky instead of in the flow.
    - The earlier miss had two causes. `scrollWidth` only counted the scroller itself. The decoration rule skipped elements under
      1600 px², and the logo is 96×14.

## Accepted deviations from the drawing (Csilla 10-15)
- The Naptár week grid is centred in the page (x 144–1136 at 1280 px); the drawing has it at x 120–1112.
- Értesítések: each whole row opens the notification. The separate "Megnyitás" link is gone.

## Verification (VM, 2026-10-14/15)
- apps/web: 892 passed / 16 failed / 16 skipped. The 16 failures are the unchanged known list. There are 14 new tests in
  `r18-kor8.proba.ts`, and the moved expectations carry their reasons next to them.
- Packages: all green.
- Layout audit: 1890 views (hu/ro/en × 390/768/1024/1280/1440 × dark/light), **0 findings**, re-run with the new rules after the
  10-15 fixes. Before the fixes, the 390 px run with the new rules found 40 `kilog` findings (Posztszöveg button row, invitation page).
- The live Tibor-proba/bíró was not run from the VM (there is no live site and no Ollama there).
