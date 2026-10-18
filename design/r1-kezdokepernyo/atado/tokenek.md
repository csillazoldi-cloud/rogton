# Tokenek — R-1 · Kezdőképernyő és navigáció

A rajzban **nincs beégetett szín, betű, betűméret, lekerekítés vagy térköz**: minden érték
`var(--token)` alakban áll. A rajz `:root` blokkja az `apps/web/app/tokenek.css` és a
`@km/design-system` `szarmaztat()` függvényének tükre — a valódi lapon a `layout.tsx` írja be
ezeket az adatbázis aktív témájából.

Két szándékos kivétel van, mindkettő alakérték (nem szín, nem betű, nem térköz):
a 8 pixeles állapotpontok és a 6 pixeles haladássáv magassága. Ugyanaz a kategória, mint a
meglévő lapokon a 34×34-es színmező — a mai kód is alakértékként kezeli.

## 1. Használt alaptokenek

| Csoport | Tokenek |
|---|---|
| Felület és szöveg | `--bg` `--bg-elev` `--text` `--text-mut` `--text-dim` `--text-faint` `--on-primary` |
| Szín | `--primary` `--primary-2` `--accent` `--accent-text` `--accent-link` `--ok` `--err` `--focus` |
| Árnyék | `--shadow-color` `--shadow-strength` |
| Betű | `--font-display` `--font-body` `--font-code` `--fw-head` `--fw-strong` |
| Betűméret | `--fs-h1` `--fs-base` `--fs-title` |
| Forma | `--r-card` `--r-block` `--r-btn` `--r-field` `--r-badge` `--bw` |
| Térköz | `--pad-card` `--pad-block` `--gap` |
| Vezérlő | `--control-min` |
| Egyéb | `--lh` `--glass-alpha` `--motion` |

## 2. Használt származtatott tokenek

`--font-display-active` `--font-body-active` `--font-code-active` `--grad-primary`
`--accent-tint-weak` `--accent-border-soft` `--focus-ring` `--glow-primary`
`--ok-strong` `--ok-bg` `--err-strong` `--err-bg` `--err-border`
`--warn` `--warn-border` `--warn-bg`
`--src-web` `--src-web-bg` `--src-ai` `--src-ai-bg` `--src-empty` `--src-empty-bg`
`--glass-bg` `--glass-border` `--glass-shadow` `--shadow-pop`
`--line` `--line-soft` `--line-dash` `--field-bg` `--field-border`
`--panel-soft` `--panel-soft-2`
`--btn-ghost-bg` `--btn-ghost-border` `--btn-ghost-text`
`--fs-h2` `--fs-md` `--fs-sm` `--fs-xs` `--control-min-s` `--dur-spin`

## 3. Új tokenek — kérés, indoklással

Négy új méret-token kell. Egyik sem szín és nem betű: mind a csemperács geometriája.

| Token | Alapérték | Tartomány | Miért kell |
|---|---|---|---|
| `--gap-tile` | `14px` | 4–24 | A csemperács térköze. A `--gap` (12px) a mezők és gombsorok térköze, ahhoz szűk; a `--pad-block` (22px) túl széles. A kettő közé kell egy önálló érték, különben a rács pixelben íródik. |
| `--pad-tile` | `18px` | 8–40 | A csempe belső tere. A `--pad-block` (22px) a nagy paneleké, a `--pad-card` (36px) az üvegkártyáé; hatcsempés rácsban mindkettő elnyeli a tartalmat. |
| `--tile-min` | `300px` | 200–520 | A rács egy csempéjének minimális szélessége. **Ez dönti el, hol tör sorba a rács** — témából állítható értéknek kell lennie, nem beégetett töréspontnak. 390 pixelen egy hasábot ad, 1440-en hármat. |
| `--fs-metric` | `30px` | 18–48 | A csempék nagy száma (új találatok, költség, fiókszám). A `--fs-h1` (34px) a lapcímeké, a `--fs-h2` (24px) a lapon belüli címeké; a mérőszám a kettő közé esik. |

A négy tokennel a Theme-beállítások lapon **53 helyett 57 token** látszik.

## 4. Ahol a rajz szándékosan nem tokent használ

Nincs ilyen hely ebben a rajzban. (Az R-6-ban van: az ügyfél logója és a mintakártya külön
tartomány, ami soha nem örökli a rendszer színeit — de az a kezdőképernyőn nem jelenik meg.)
