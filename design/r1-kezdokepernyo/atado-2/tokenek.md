# Tokenek — R-1 · javítókör

**Ebben a körben új token nincs.** A rajz átállt az R-0 térköz-skálájára, és a mai
térköz-tokenek a skálára mutatnak.

## 1. A térköz-skála — az R-0 tizenöt foka

`--ter-0` 0px · `--ter-1` 2px · `--ter-2` 4px · `--ter-3` 6px · `--ter-4` 8px ·
`--ter-5` 10px · `--ter-6` 12px · `--ter-7` 14px · `--ter-8` 16px · `--ter-9` 20px ·
`--ter-10` 24px · `--ter-11` 32px · `--ter-12` 40px · `--ter-13` 56px · `--ter-14` 80px

A rajz **minden térköze** ebből jön: `gap`, `padding`, `margin`, és a lenyílók pozíciós
eltolása (`top: calc(100% + var(--ter-2))`, `inset-inline-start: var(--ter-10)`).

## 2. A mai térköz-tokenek a skálára mutatnak

| Token | v2 érték | Most | Elmozdulás |
|---|---|---|---|
| `--gap` | 12px | `var(--ter-6)` | nem változik |
| `--pad-card` | 36px | `var(--ter-11)` | −4px |
| `--pad-block` | 22px | `var(--ter-9)` | −2px |
| `--pad-field-y` | 13px | `var(--ter-6)` | −1px |
| `--pad-field-x` | 15px | `var(--ter-7)` | −1px |
| `--btn-pad-y` | 13px | `var(--ter-6)` | −1px |
| `--btn-pad-x` | 26px | `var(--ter-10)` | −2px |
| `--gap-tile` | 14px | `var(--ter-7)` | nem változik |
| `--pad-tile` | 18px | `var(--ter-8)` | −2px |

## 3. Ami nem térköz, ezért önálló token maradt

| Token | Érték | Miért nem térköz |
|---|---|---|
| `--tile-min` | 300px | egy rácshasáb minimális szélessége — ez dönti el, hol tör sorba a rács |
| `--fs-metric` | 30px | betűméret |
| `--control-min` | 44px | vezérlőmagasság (érintőméret) |
| `--control-min-s` | 36px | kisebb vezérlőmagasság |

## 4. Használt tokenek

**Alap:** `--bg` `--bg-elev` `--text` `--text-mut` `--text-dim` `--text-faint` `--on-primary`
`--primary` `--primary-2` `--accent` `--accent-text` `--accent-link` `--ok` `--err` `--focus`
`--shadow-color` `--shadow-strength` `--font-display` `--font-body` `--font-code` `--fw-head`
`--fw-strong` `--fs-h1` `--fs-base` `--fs-title` `--r-card` `--r-block` `--r-btn` `--r-field`
`--r-badge` `--bw` `--control-min` `--blur-glass` `--glass-alpha` `--motion` `--lh`
`--sat-glass` · **és a tizenöt `--ter-*` fok**

**Származtatott:** `--font-display-active` `--font-body-active` `--font-code-active`
`--grad-primary` `--grad-headline` `--accent-tint-weak` `--accent-tint`
`--accent-border-soft` `--focus-ring` `--glow-primary` `--ok-strong` `--ok-bg` `--err-strong`
`--err-bg` `--err-border` `--warn` `--warn-border` `--warn-bg` `--src-user` `--src-user-bg`
`--src-web` `--src-web-bg` `--src-ai` `--src-ai-bg` `--src-empty` `--src-empty-bg`
`--glass-bg` `--glass-border` `--glass-shadow` `--shadow-pop` `--line` `--line-soft`
`--line-dash` `--field-bg` `--field-border` `--panel-soft` `--panel-soft-2`
`--btn-ghost-bg` `--btn-ghost-border` `--btn-ghost-text` `--btn-ghost-hover`
`--fs-h2` `--fs-md` `--fs-sm` `--fs-xs` `--dur-fast` `--dur-spin` `--header-bg`
`--gap` `--pad-card` `--pad-block` `--pad-field-y` `--pad-field-x` `--btn-pad-y`
`--btn-pad-x` `--gap-tile` `--pad-tile` `--tile-min` `--fs-metric` `--control-min-s`

## 5. Alakértékek — szándékosan nem token

A 8 pixeles állapotpontok, a 6 pixeles haladássáv, a 26×26-os termékjel a sávban, a
szaggatott modul-helyfoglalók magassága (`--control-min-s`), és a Tagok soron a 8 pixeles
figyelem-pötty. Ezek az elem saját méretei, nem térközök — ugyanaz a kategória, mint a
meglévő lapokon a 34×34-es színmező.
