# Questions — R-15 c5 Round 3 (03 Kezdőlap with tiles · 13/14 icons)

Csilla 10-10 20:4x: Kati #12 („tiles first, what to do now under”) and #3 (icons in settings). Drawing `rajz/R15-lapok-6.dc.html`,
machinery `gepezet-6.md`, labels `feliratok-8.json` (1 new key; `feliratok-7.json` was already used by migration 0159), review page
`rajz/R15-lapok-6-attekintes.html`, probe `meres/rajz6/` (14/14 green). The Tibor judge runs on the four Kezdőlap views only (03bT, 03cT, 03c2T, 03jT);
13/14 are probe-only (Csilla's rule).

**Word budget, measured honestly:** the tiles are drawn as `div role="navigation"`, not `<nav>` — the probe skips `<nav>` (that is the top bar),
so a `<nav>` would have hidden the 4 tile words. Counted: 03bT 59/60 desktop · 38/40 phone; 03cT 43 · 39; 03c2T 43 · 34; 03jT 59 · 38.

## Questions

1. **(Csilla) Which tiles, in which order.** ★ Hírek · Posztszöveg · Képek · Iránytű — the four work pages every member can open (the pages
   themselves keep their own permissions). Szervezet adatai / Beállítások stay in the menu only. No counts on the tiles (the top bar already
   shows the real Hírek / Posztszöveg numbers).
2. **(Csilla) Phone word budget — what folds.** 03b on the phone was already 39/40; four tile names make it 43. ★ On the phone the rows of the
   „Még vár” list fold into the existing „Még n apróság” link (it already opens the list in place): 03b/03j „Poszt a Tisza-parti főtérről ·
   Megnézem” → „Még 3 apróság”; 03c2 „Friss hírek minden reggel · Mi ez? · Bekapcsolom” → „Még 2 apróság”. Nothing is removed — one tap
   shows them, as today. (Alternative: icon-only tiles on the phone — 0 words, but Tibor has to guess what the icons mean.)
3. **(Csilla) Desktop: the „Legutóbb 4 napja kerestünk híreket.” line becomes the Hírek tile's quiet time („4 napja”).** ★ Yes — same data,
   −3 words; without it 03b desktop would be 62/60.
4. **(Csilla) Phone tiles: one row of four (icon above a short name)** ★ — a 2×2 grid would push the „what to do now” block ~70 px down;
   the primary stays in the bottom bar (thumb reach) either way.
5. **(Csilla) Settings icons: before every row on 13, and before the switches on 14** ★ — not on the 14 notification list rows (there the
   unread dot is the marker; an icon per row would be a second marker). Inline SVG, stroke = the text colour token, no icon font, no package.

## Moved (nothing removed)

| Screen | Today | Where it goes | Q |
|---|---|---|---|
| 03 desktop | „Legutóbb … kerestünk híreket.” line | the Hírek tile's quiet time | 3 |
| 03b / 03j phone | „Poszt a Tisza-parti főtérről · Megnézem” row | behind „Még 3 apróság” (opens in place) | 2 |
| 03c2 phone | „Friss hírek minden reggel · Mi ez? · Bekapcsolom” row | behind „Még 2 apróság” (opens in place) | 2 |

## My own Tibor read (the judge decides)

- **03bT / 03jT:** four quiet tiles, then „Ma 2 poszt vár rád” and the finished post — the one coloured button is still „Megnézem a posztot”.
  Risk: on desktop the eye may land on the tiles first and Tibor might click „Posztszöveg” instead — it leads to the same posts, so not a
  wrong turn. On the phone the tiles take ~80 px; the post card stays above the fold. Expect sárga/zöld.
- **03cT / 03c2T:** tiles + „Mára kész vagy” / „Mutasd meg a legutóbbi munkádat”; the primary is the image button. Expect as before.
