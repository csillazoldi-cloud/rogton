# R-18 — Round 4: aitmetica.ro type, POSZTGYÁR, Cégeim

2026-10-11 · design only · canvas version 8 (26 artboards). Everything from round 3 stays.

## Font usage map (as on aitmetica.ro)
| Element | Font | Size / weight / tracking |
|---|---|---|
| Top menu items (desktop nav, phone page label), dropdown + ☰ sheet rows | JetBrains Mono | 13px · 500 · 0 |
| Buttons: primary | JetBrains Mono | 14px · 500 |
| Buttons: quiet, ghost (Kovács Tibor ▾), Visszajelzés pill | JetBrains Mono | 13px · 500 |
| Links as actions (Kép hozzá, Még 3 javaslat, Keress most új híreket…), quick tiles | JetBrains Mono | 13px · 500 (phone tiles 11.5px) |
| Small labels / eyebrows (menu group titles, spec labels, count badges, "Készül a kép") | JetBrains Mono | 11.5–12.5px · 500 |
| Page question (h1: `kerdes` 28px, phone 24px) | Inter Tight 700 | letter-spacing −0.028em (site h1 88px/−2.46px) |
| Card titles, template titles (h2 level) | Inter Tight 700 | letter-spacing −0.018em (site h2 44px/−0.79px) |
| Body text, info lines, sentences | Inter 400/500 | — |
Token values in tema-A/B.json are unchanged (`--font-display` Inter Tight, `--font-body` Inter, `--font-code` JetBrains Mono already match); the build adds `--fs-ui: 13px`, `--fw-ui: 500`, `--ls-h1: -0.028em`, `--ls-h2: -0.018em` as derived tokens and moves the listed components onto `--font-code`.

## Fonts in the hosted canvas
The canvas now embeds the woff2 files itself (Inter 400/500/600, Inter Tight 600/700, JetBrains Mono 400/500; latin + latin-ext, 14 files uploaded as canvas assets) via `@font-face` in each artboard, under the family names `KM Inter`, `KM Inter Tight`, `KM JetBrains Mono`, first in every stack. Google Fonts stays as a backup only. Rendering no longer depends on fonts.googleapis.com.

## Product name sizing rule
Name shown in capitals with CSS `text-transform: uppercase`; the label key value stays „Posztgyár". Cap height = height of the a/t mark: `font-size = mark height / 0.734` (Inter Tight 700 cap height measured at 0.734 em). Desktop mark 22px → name 30px; phone mark 16px → name 21.8px. Measured: cap top/bottom align with the mark box within 0.1px.
RO „FABRICA DE POSTĂRI" at 390: does not fit next to the page label. Rule: on phone, when name + page label do not fit, the page label is hidden (the current page stays marked in the ☰ sheet); name, bell and ☰ keep their size. HU and EN fit with the page label.

## Company switching: Cégeim
- The „Kő és Kert Kft. ▾" company button is **removed** from the top bar (desktop) and the org line under the page label (phone).
- „Kovács Tibor ▾" (personal account menu) stays unchanged.
- New top-level nav item **„Cégeim ▾"** right after „Profil", **only for users with more than one company**. Its menu lists the user's companies; the current one has a check mark (`role="menuitemradio"`, `aria-checked="true"`); choosing another switches company. Single-company users never see it.
- Phone: a „CÉGEIM" group in the ☰ sheet, after the PROFIL group, same rows and check mark; the mode switch stays last.
- Canvas: all default artboards = single-company user. New: „Több cég: Cégeim menü nyitva · asztali" and „Több cég: Cégeim a ☰ menüben · telefon", in both modes.
- New label key `nav.cegeim`: HU „Cégeim" · RO „Companiile mele" · EN „My companies" (new migration). Product-level nav change → needs Vilmos's OK.

## Build changes added in round 4
1. Mono UI type map above; heading tracking tokens.
2. Name: uppercase, size from mark height.
3. Remove the org switcher from the bar; add the conditional Cégeim menu (desktop dropdown + ☰ group), keyboard + `aria-expanded`.
4. Phone bar: page label hides when it does not fit next to the name.
