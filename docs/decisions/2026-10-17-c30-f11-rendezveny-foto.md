# 2026-10-17 — c30 F11: the festival's sample photo (category `rendezveny`)

**Decided by:** Csilla approved plan c30 (`docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md` §1.2: "Round 1 adds `rendezveny`, used for
festivals' sample photo only", §10 F11). She supplied the photo (`~/saas/_c30-minta/rendezveny-minta.jpg`, 2576×1472) and confirmed the
licence on 10-17. Built as the second commit after F9, in the same push. **Requirements:** c15 (the sample photo fits the organisation),
R-15 (the Képek page; the drawing is unchanged, only the photo inside the sample differs). No migration, no label, no prompt change.

## What changed

- **The photo:** `apps/kepgyar/minta/kesz-minta-rendezveny.jpg`, made with the same pipeline as the c14/c15 photos: sRGB (the source's
  ICC profile was already sRGB), 1600×914 (long edge 1600, Lanczos), JPEG quality 82, progressive, no EXIF or ICC, 161 kB.
- **"Both lists":**
  - `apps/web/vizual/minta-kategoria.ts` `MINTA_FOTO_KATEGORIAK` = `KATEGORIAK` (from contracts) + `RENDEZVENY_KATEGORIA` (`"rendezveny"`). The image maker's
    `MINTA_KATEGORIAK` gets the same 9, plus `MINTA_FOTOK.rendezveny`. The sync tests now compare the image maker with the photo list.
  - `rendezveny` is deliberately **not** in `KATEGORIAK`, the company categories, because adding it there would:
    - put a "rendezveny" chip in the company category chooser (`ElsoBeallitas`, a Tibor screen not on any drawing);
    - let the AI pick it for a company (kep_peldak / javaslatok). Changing those prompts would also bump the kep_peldak version and
      re-write every org's examples (AI cost);
    - require compass example labels for a ninth category.

    The plan says the category is "used for festivals' sample photo only", so it lives only in the photo list.
- **Which org gets it:**
  - `vizual/minta-kategoria.ts` has a new pure `fotoKategoria(szervezet_tipus, kategoria)`: festival → `rendezveny`, anything else → its
    category unchanged.
  - `peldakFrissen` returns `fotoKategoria` next to `kategoria`. The org type is NOT part of the examples' fingerprint, so no stored
    example is rewritten and there is no AI call.
  - The two `helyzet-minta` calls (GET card, POST "Így néz ki") send `fotoKategoria`.
  - Read at request time: existing festival orgs get the photo immediately. The image maker's cache key already contains the category,
    so the old cached sample is not reused.
  - Where it shows: the "Kész munka" and "Újdonság" samples (Képek cards, Arculat "Így néz ki", Kezdőlap/Hírek offer image).

## Measured (Cowork VM, local Postgres + `next start` + local képgyártó, test AI)

- **Tests:**
  - New `probak/c30-f11-rendezveny-foto.proba.ts`, 3 tests: the pure rule; the file (JPEG, 1600×914 read with `kepMeret`, no EXIF/ICC,
    data-URL < 600 kB); live: an approved festival → `fotoKategoria` `rendezveny` with `kategoria` unchanged, a company → its own.
  - Two sync tests moved, each with the reason written in place: `c15-minta-kategoria` and `c30-f1-tipus` (the image maker's list =
    the photo list).
  - kepgyar `fust-minta` 43/43 (+2 for `rendezveny`).
  - apps/web 1045/1013/16/16 → **1048/1016/16/16**, identical failure list. Packages 680/680.
- **Screens (before = `c49119c`, after = F11), `~/saas/_c30-f11-kepek`:**
  - Festival Képek and Arculat at 390/1512: the "Kész munka" and "Újdonság" samples show the stage-and-crowd photo instead of the
    laptop/office photo the festival had before.
  - Tibor's company: `/kepek` 0 px; `/fiok/arculat` 0 px at 390 and 6 px of ±1 anti-aliasing on one rounded corner at 1512.
  - Tibor on the festival Képek page at 390: green (23 words).

## Open

- The festival's sample TEXTS are still the company wording ("Elkészült a legújabb munkánk", "Új a kínálatunkban") whenever the AI
  hasn't written examples (test AI here). With the real AI, `kep_peldak` writes from the festival's profile. Not in F11's scope; worth
  a look on the live screen.
