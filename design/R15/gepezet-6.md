# Machinery — R-15 c5 Round 3 (03 tiles · 13/14 icons)

Drawing `rajz/R15-lapok-6.dc.html`. One new label key (`r15.kezdolap.csempek`, the tiles' accessible group name — not „modul…”, T3), from
`feliratok-8.json` → one migration in the build. Everything else is existing keys / existing data. Measured on main `4923dbe`.

## 03 Kezdőlap tiles — same data, NEW presentation only
- Four links: Hírek → `/hirfigyelo`, Posztszöveg → `/poszt`, Képek → `/kepek`, Iránytű → `/iranytu`; labels `r15.nav.*` (existing). A small
  shared `R15Csempek` component in `app/_kozos/` (client-safe, no data fetch). Rendered as `<div role="navigation" aria-label=…>` — NOT `<nav>`:
  the Tibor-próba skips `<nav>` (the top bar), and the tiles are page content that must count in T5.
- Hírek tile time: the existing `adat.utolso_kereses_nap` with `IdoSzo` (today's „Legutóbb …” line, `R15Kezdolap.tsx:208`) — the line itself
  is not rendered any more on desktop; on the phone it was never shown.
- Phone fold (kerdesek-6 · 2): `telLathato` (`R15Kezdolap.tsx:52`) becomes 0 on the phone, so every „Még vár” row is behind the existing
  „Még n apróság” link (`setNyitva`, unchanged). Desktop unchanged.
- Shown on 03a/03b/03c/03c2/03j alike (the tiles do not depend on the state). Exactly one `data-r15="fo-gomb"` stays (the do-now button).

## 13 / 14 icons — presentation only
- `R15Ikon` (inline SVG, `stroke="currentColor"`, 24-unit viewBox, colour `--text-mut` on a `--panel-soft-2` rounded square): szervezet ·
  megjelenes · csapat · kredit · halado · penz · meres (AI-használat) · kapcsolat (Kapcsolat más rendszerekkel) · szoveg (Felület szövegei) ·
  harang (A felületen) · hirek · figyelem · chip · ora (the 14 switches). No icon font, no new dependency (the repo has none to reuse).
- 13: before each row of the owner view (`TulajGephaz`), before „Haladó ▾” and before the rows behind it. The sysadmin view is unchanged.
- 14: before each switch behind „Miről szóljon ▾”. The notification list rows keep only the unread dot.
