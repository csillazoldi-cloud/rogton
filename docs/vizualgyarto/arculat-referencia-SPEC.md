# Artboard spec — Transport Local social canvas

Every new artboard is a `.dc.html` file written to `project/<Name>.dc.html` in this folder.
**Copy the skeleton from `project/Main.dc.html` exactly** (head, helmet font link, the logic class, the
data-props line). Change only the `<title>`, the body markup, and `$preview` width/height.
Never invent a new font link, never add a second `<x-dc>`, never publish anything.

## The three roles (never mix them)
- `{{voice}}` — the sentence that speaks: headline, slogan, quote. Weight `{{voiceBold}}` for Romanian, `{{voiceSoft}}` for Hungarian.
- `{{info}}` — explanatory text, lists, table cells, destinations, stop names. `{{infoNarrow}}` with `font-stretch: {{narrow}}%` where a long name must be squeezed.
- `{{tech}}` — every number, time, date, route number, code, source line, small caps label. Always `font-variant-numeric: tabular-nums`.

## Colours (fixed)
navy `#122e60` · deep navy `#0b1a36` · green `#a2c73b` · deep green `#44640d` · paper `#f4efe6` ·
ink `#1b2437` · mist on dark `#c9d3e3` · muted on dark `#8fa2c4` · muted on paper `#5a6880` · hairline on dark `#23365c` · hairline on paper `#d6cfc2` ·
status: disruption `#b8300a` (white text), delay `#f5b301` (navy text), ok `#006b54` (white text).
- Green text ONLY on navy / deep navy. On paper the second language is deep green `#44640d`.
- Status colours appear ONLY on service posts (disruption, delay, restored).

## Grid and sizes on a 1080-wide board
- Margin 72 px on all sides. Gaps are multiples of 8.
- Top label: `{{tech}}` 30 px, uppercase, letter-spacing .08em, muted.
- Signal: one green rule 120 × 10 px above the headline — one signal per board, never two.
- Headline 86/94 (long copy 72/80, short copy 104/112). Second language directly under it, same size.
- Body / explanation 46/58. List or table text 42/54. Data label 42. Metadata, source, small label 30 (never below 30).
- Big figure: `{{tech}}` 700, 180–210 px.
- Bottom row: metadata left (`{{tech}}` 30, muted), emblem right 76 px — copy the emblem `<svg>` verbatim from `project/Main.dc.html` (dark ground: outer `#ffffff`, inner `#a2c73b`; paper ground: outer `#122e60`, inner `#a2c73b`).
- On 1080 × 1920 boards keep everything inside 250 px from the top and 340 px from the bottom.
- On a 1920 × 1080 board multiply every size by 1.78 and use ONE language per board.

## Copy rules
- Romanian first, Hungarian second, same size. Real diacritics as HTML entities (`&#537;` ș, `&#539;` ț, `&#337;` ő, `&#369;` ű, `&#259;` ă, `&#226;` â, `&#238;` î).
- Polite address (dumneavoastră / Ön). Sentence case. 24-hour times. No emoji, no flags, no hashtags on the image.
- Never accuse another institution. When ADI Transport Târgu Mureș or the Primăria decides, add the attribution line in `{{info}}` 38 px.
- Any figure without a verified source carries a source line: `EXEMPLU &#183; P&#201;LDA &#8212; date ilustrative / illusztrat&#237;v adatok`.
- Line "Linia 23 · 23-as járat" style for routes. Stop names bilingual: `Pia&#539;a Trandafirilor` / `R&#243;zs&#225;k tere`.

## Photos (the only three; use `<img>` with `object-fit: cover` and an `alt`)
- boarding: `/_blob/b65a2fddb8fb272755f0d93daa9ff6ad`
- two buses in the city: `/_blob/ec01d945d723753fdfa41b0f35d7cb9d`
- waiting at the stop: `/_blob/34cd80fa88aceb4dff2e7a0cf48fb036`
Text never sits on a face or a hand: put it on a solid block under the photo, or on a dark band.
No other image, no data: URI, no gradient wash, no icon font, no emoji. An icon, if needed, is an inline stroke `<svg>`.

## Craft
- Flex or grid with `gap`, never absolute positioning. Fixed root size equal to the board size and the same `$preview`.
- Real elements: `<button>`, `<a href>`, `<table>` where that is what the thing is.
- Nothing overlaps, nothing is clipped, every block sits in the flow.
- Each board is one clean composition: at most one photo, one signal, one headline pair.
