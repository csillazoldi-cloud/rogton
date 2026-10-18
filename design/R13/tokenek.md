# Tokens — R-13

The drawing uses the R-15 token block unchanged (copied from `R15-lapok-2.dc.html`), plus the items below.
No hard-coded colour, font size, weight or radius in the page body (checked by script). The only literal colours are inside
the 03c sample picture (`minta_kep`, copied verbatim from R15-lapok-2): that is content, not UI.

## Used from `design/semak/semak.css` (existing, not new)
| Token | Value | Where |
|---|---|---|
| `--kapcsolo-w` / `--kapcsolo-h` | 38px / 22px | the „Gyors előválogatás” switch |
| `--valaszto-aktiv-bg` | `color-mix(--primary 10%)` | the selected fokozat row |
| `--btn-disabled-bg` | `color-mix(--text 8%)` | AI buttons disabled when credit is used up (13d4) |
| `--fs-metric` | 34px | the big „maradt” number on Saját fiók |

## New (4) — values the R-15 drawings hard-coded, now named
| Token | Value | Why |
|---|---|---|
| `--r-kerek` | 999px | pill/circle: Visszajelzés button, count badges, avatar, switch track (R-15 wrote 23px/20px/14px/9px) |
| `--kartya-cim-fs` | 22px | teendő card title and the ✓ glyph on desktop (R-15: 22px) |
| `--kartya-cim-fs-tel` | 20px | the same on phone (R-15: 20px) |
| `--ikon-fs` | 20px | ☰ and ··· glyph buttons (R-15: 20px) |

They only name existing R-15 values, so the code can map them 1:1 (or onto an existing semak token if one is preferred).

## Added in code round 2 (Csilla 2026-10-06, decision 4)
| Token | Value | Why |
|---|---|---|
| `--szakasz-halvany` | 0.55 (opacity) | Saját fiók out-of-credits: the news-settings section stays visible but steps back; full strength on hover/focus |
