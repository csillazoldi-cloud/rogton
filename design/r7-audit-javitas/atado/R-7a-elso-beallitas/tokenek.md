# Tokenek — R-7a

Új token **nem kell**, de a lap az R-7e skála új **értékeivel** áll (a token nevek változatlanok):

| Token | Régi | Új (R-7e) |
|---|---|---|
| `--fs-base` | 15px | 16px |
| `--fs-md` | 14px | 15px |
| `--fs-sm` | 13px | 14px |
| `--fs-xs` | 12px | 12,5px |
| `--fs-title` | 16px | 17px |
| `--fs-h2` | 24px | 26px |
| `--control-min` | 44px | 46px |
| `--lh` | 1,55 | 1,5 |
| `--src-ai` / `--src-ai-bg` | narancs (`--accent-text`) | semleges (`--primary-2`, 14%) |
| `--accent-link` | narancs | `var(--primary-2)` |

Két laptoken az egységes tartalomszélességhez (R-7e javaslat, mindkettő ott indokolva): `--urlap-max: 680px` (tartomány 640–720), `--lista-max: 1180px` (tartomány 1100–1200).

Használt tokenek: a tizenöt térközfok (`--ter-0…--ter-14`), `--r-card`, `--r-block`, `--r-btn`, `--r-field`, `--r-badge`, `--bw`, `--line`, `--line-soft`, `--line-dash`, `--field-bg`, `--field-border`, `--panel-soft`, `--panel-soft-2`, `--btn-ghost-*`, `--grad-primary`, `--on-primary`, `--err`/`--err-bg`/`--err-border`, `--warn`/`--warn-bg`/`--warn-border` (csak a C állapotban), `--focus`/`--focus-ring`, `--font-display-active`, `--font-body-active`, `--font-code-active` (csak az artboard-feliratokon, a felületen nem).

Az R-4 „még nem működik” tokenjei (`--keszul`, `--keszul-bg`, `--keszul-border`) az R-7a-n **nem szerepelnek** — nincs jelölendő elem.
