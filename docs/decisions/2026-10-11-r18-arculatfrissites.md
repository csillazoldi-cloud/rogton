# 2026-10-11 — R18 arculatfrissítés (facelift): Posztgyár, one purple, dark + light mode, new top bar

**Context.** Csilla (lead) approved the R18 drawing after four rounds (Claude Design artifact „Aitmetica arculatfrissítés — Posztgyár ·
sötét/világos”, canvas v8; notes in `design/R18-arculatfrissites/IRANYOK.md` + `IRANYOK-round4.md`, round 4 overrides). This records the
decisions the build implements. Built screens vs the drawing: `design/R18-arculatfrissites/epitett/` (26+ screenshots, dark/light,
1280/390, menus open).

## Decisions

1. **Product name „Posztgyár”** (RO „Fabrica de postări”, EN „Post factory”) — new label key `fejlec.termeknev` (migration 0163), shown
   next to the real a/t mark in CAPITALS via CSS `text-transform` (the stored value keeps normal case). Size: the drawing's cap-height
   rule (mark height / 0.734) × 0.8 — Csilla 10-11: „POSZTGYÁR should be about 20% smaller than now” → 24 px desktop, 17.4 px phone.
   `kozos.app_nev` („Kommunikációs munkatér”, used on the pre-login and onboarding headers) and `nyitolap.termeknev` are NOT changed —
   open decision.
2. **One purple only: `#4b09d8`** (and its rgba). `--primary` = `--primary-2` = `#4b09d8` in both modes; no purple text on dark
   (links, focus and the AI/web origin chips are light grey there). Orange `#eb5928` = in progress (`--keszul`, weekly progress bar with
   a moving shimmer, generating spinners/skeletons). No orange cursor. Guarded by `packages/design-system/probak/modok.proba.ts`.
3. **Dark („Éjszaka”) and light („Papír”) mode** as one product. Tokens: `packages/design-system/src/tema-sotet.json` /
   `tema-vilagos.json` (copies of the approved tema-A/B.json). `modCss()` emits `:root[data-mod="sotet"|"vilagos"]` blocks after the
   effective (org) token block; the mode keys (colours, font families, radii, glass, aurora) always come from the drawing, everything
   else (font sizes, spacing, control sizes) still from the org theme. **Consequence (to confirm with Vilmos):** colour changes made on
   the Theme page or by a colour scheme no longer show in the app chrome — the brand is fixed by design („only one purple, ours”).
   Nothing was removed: the Theme page and the stored themes still work and still apply to the non-mode keys.
   - Default follows the device (`prefers-color-scheme`); the user's click is stored in the browser only (`localStorage` `km-mod`,
     try/catch everywhere; no server change). An inline `<head>` script sets `<html data-mod>` before first paint (no flash).
   - Switch: desktop sun/moon icon left of the bell; phone: last menu row of the ☰ sheet (switch pattern). 250 ms colour cross-fade
     (`.mod-valt` on the root, registered `@property` for the aurora colours); instant under reduced motion.
4. **Navigation regroup** (product-level → Vilmos's OK still needed per the rulebook): top level Kezdőlap · Hírek · Posztszöveg ·
   Képek · „Profil ▾” (Iránytű, Szervezet adatai, Beállítások) · bell with the unread count (replaces the „Értesítések” text item, same
   target `/beallitasok`) · mode switch · „Kovács Tibor ▾” account menu. All routes unchanged. The old company button left the bar:
   switching moved into Cégeim; its Tagok and Visszajelzések rows moved into the account menu (desktop) / account group (phone).
5. **„Cégeim ▾” only for users with more than one company** (`adat.munkaterek.length > 1`). Lists the companies, current one checked
   (`menuitemradio` + `aria-checked`), choosing another uses the existing `POST /api/szervezet/valt`. Phone: a CÉGEIM group in the ☰ sheet.
6. **Fonts self-hosted** (aitmetica.ro type map): Inter Tight 600/700 (headings, tracking −0.028em h1 / −0.018em h2), Inter 400/500/600
   (body), JetBrains Mono 400/500 (top menu, menu rows, buttons, action links, tiles, labels). 14 woff2 files, latin + latin-ext
   (ő ű ă ș ț), from fontsource 5.3.0 (SIL OFL 1.1, licences next to the files) in `apps/web/public/betuk/`. No Google Fonts request for
   them at runtime. The existing Google Fonts link stays only for the brand-font previews (Sora, Archivo, Public Sans, …) of the Arculat pages.
7. **Look:** breathing aurora (3 blurred blobs, transform/opacity only, static under reduced motion) on every page; subtle glass only on
   the bars and menus (the bar's glass sits on a `::before` so fixed children are not trapped); buttons solid with a gentle lift and soft
   press; cards/tiles solid panels; the box holding the page's main button gets the thin purple→orange edge with the round-3 halved glow;
   faded aitmetica wordmark bottom-left (desktop) / centred above the feedback row (phone), measured never to overlap the button at 390.

## Not decided here / open
- Vilmos: OK on the nav regroup and on decision 3's consequence for the Theme page.
- Whether the pre-login / onboarding headers („K” + „Kommunikációs munkatér”) get the a/t mark and the new name (not on the drawing).
- An SVG master of the logo (the PNGs are the trimmed deliveries; light-mode versions are exact recolours).
