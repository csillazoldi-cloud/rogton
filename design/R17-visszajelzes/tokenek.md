# Tokens — R-17

**No new tokens.** The drawing uses the R-16 token block unchanged (copied from `R16-arculat.dc.html`, which carries the R-15 block).

- **Landing-page screens (D)** need six R-7d values that the R-16 block does not have. They are copied from `R7d-nyitolap.dc.html`
  and scoped to `[data-r17-nyitolap]` only: `--fs-h1:42px`, `--font-display-active` / `--font-body-active` / `--font-code-active`,
  `--line-dash`, `--panel-soft`, `--btn-ghost-bg` / `--btn-ghost-border` / `--btn-ghost-text`, `--header-bg`, `--field-border`.
  They are the landing page's existing values (live: `nyitolap.css` + the common theme), not new design decisions.
- **Literal colours** appear only inside content mock-ups, as in the approved drawings: the logo SVGs (Kövesi Térkő palette), the profile-picture
  mock (A2), the blog-article preview card (C2, same white-card values as the approved 08b Facebook card) and the swatch inside the colour-code
  field (A6 — it *is* the colour value). UI chrome uses tokens only.
- Selected chip (B2 „Hol fogod használni?”): `--primary-2` border + `color-mix(in srgb, var(--primary) 18%, transparent)` background — same recipe as
  `--valaszto-aktiv-bg` in `design/semak/semak.css` (10%); the code should use `--valaszto-aktiv-bg` and only raise it if it reads too faint.
- Selected logo slot (A2): `outline: 2px solid var(--text); outline-offset: 3px` — the same selection mark as the approved 12g name-logo cards.
- Admin highlight (B4): the tinted row background exists only in the drawing to point at the new row; it is not built.
