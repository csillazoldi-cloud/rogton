# R-16 · utókérés 2 — the two phone empty states (2026-10-01 evening)

**Why:** full gate 10-01 16:51 (Sonnet judge) — two R-16 phone views red (brief items 4–5, `DESIGN-KERES-R15-UTOKERES-2.md`):
- `arculat-logok / telefon` (fully empty): Tibor pressed "Nincs logóm" instead of "Logók kiválasztása"; "nem értem, hogy négyből mennyit kell".
- `arculat / telefon` (fresh org, no logo): "nekem nincs logóm, nem tudom, mit kezdjek ezzel"; "Nincs logóm" vs "Így jó, logó nélkül"; "Tiszta"; "kik azok a mi?".

**Scope:** phone only. Every desktop view is untouched. Nothing removed (list per view below). Demo company on the two changed phones: Kövesi Térkő (paving) instead of Cipó Pékség — the bakery confused the judge before.

## What changed

### 12a · phone — fresh org, no logo (`R16-arculat.dc.html`, section "12a Arculat — üres", phone screen replaced in place)
| Before | After |
|---|---|
| Title "Kezdjük a logóddal" · "A színeket és a betűket addig mi választottuk." | "Válassz logót a cégnevedből" · "Ezt a hármat a nevedből csináltuk." |
| Two mock images, Színek + Csere, Betűk "Klasszikus / Tiszta" + Csere | Three name-logos (the 12g machinery: word · badge · framed), first one pre-selected; under them one mock image with the selected logo, beside it Színek (3 swatches) + Csere and Betűk "Aa Aa" (the fonts themselves, no style names) + Csere |
| "Így jó, logó nélkül" button + "Nincs logóm" link (two no-logo paths) | One no-logo path: the page itself is the name-logo choice. Approve-without-logo stays as the quiet link "Most logó nélkül" (same action as "Így jó, logó nélkül") |
| Primary "Logó feltöltése" | Primary "Ez legyen a logóm" (= 12g "Ez legyen"). Upload: quiet link "Van saját logóm" → logos page with the picker open (12f0 question skipped) |
| "Fájlok", "Részletek" | unchanged, below the fold |

### 12f0 · phone — logos page with zero logos (NEW section "12f0 Logók — még egy sincs", inserted before 12f)
- Title "Van már logód?" · "Ha nincs, a cégnevedből csinálunk egyet."
- Two equal choice cards: "Van, feltöltöm / Egy vagy több fájl" and "Nincs, kérek egyet / A nevedből, egy perc". "Nincs" is pre-selected (no logo on file, T4).
- One primary whose label follows the choice: "Nincs" → "Kérek egyet a nevemből" (→ 12g); "Van" → "Logók kiválasztása" (file picker → the existing 12f four slots).
- "Vissza" kept. The four slots and "Melyik hova?" appear after the answer (12f, unchanged).
- When the user arrives from 12a "Van saját logóm", the question is skipped.

## Measured (rajz-próba + Sonnet judge, 10-01 ~19:55)
| View | Probe | Judge (official run) | Repeat runs |
|---|---|---|---|
| 12a phone | green, 26 words | yellow 6 · "Ez legyen a logóm" (= primary) | 6, 6, 6 |
| 12f0 phone | green, 28 words | yellow 7 · "Kérek egyet a nevemből" (= primary) | 7, 6, 6 |
| 12a desktop (UNCHANGED, out of scope) | green | **red 4** in every run (3/3 + official) | — pre-existing in the drawing; the live desktop was not among the five reds |

Gate: `zar.py --rajz` on the two changed phone views = NYITVA (exit 0). Details: `/home/claude/work/_rajz/RAJZ-MEASURED.md`.

## Label keys
New keys (HU/RO/EN) are in `design/R15/feliratok-3.json` (one source for migration 0142): `r16.arculat.nevlogo.kerdes`, `.nevlogo.alcim`, `.ez_legyen_logom`, `.van_sajat_logom`, `.most_logo_nelkul`, `.logok.van_kerdes`, `.logok.van_alcim`, `.logok.van_igen`, `.logok.van_igen_alcim`, `.logok.van_nem`, `.logok.van_nem_alcim`, `.logok.keszits_egyet`. Reused unchanged: `r16.arculat.szinek`, `.betuk`, `.csere`, `.vissza`, `.logok.valasztas`.

## Open
- Desktop 12a/12f still lead with upload. Recommendation: mirror the phone structure on desktop in the next design round (kerdesek-3 · 4).
