# R-7e · Sokfájlos átírás (1/2) — a hírfigyelő stíluslapjain minden vezérlő a `--control-min` tokenből éljen

CÉL: a mellékelt négy CSS-fájlban minden **beviteli mező, gomb, választó, chip és fülgomb** magassága a `var(--control-min)` (fő vezérlők) vagy a `var(--control-min-s)` (másodlagos, kártyán belüli kis gombok, fülek) tokenből jöjjön — pixelben írt magasság sehol. Az audit mérte: az „Új téma" mező 25 px, több mező 33 px; a rajz (R-7e) 46 px-et kér mindenre, telefonon is.

TÉNYEK (mérve):
- `apps/web/app/hirfigyelo/attekintes.css`: `min-height: 36px` (210. sor), `min-height: 42px` (484. sor); 15 vezérlő-szabály, 2 `control-min`-hivatkozás.
- `apps/web/app/hirfigyelo/beallitas.css`: `min-height: 36px` (101.), `42px` (280., 299.), `38px` (435.); 17 vezérlő-szabály, 1 `control-min`. Itt van a témák chip-mezője („Új téma…" input) — ma nincs min-height-ja.
- `apps/web/app/hirfigyelo/finomhangolas.css`: 7 vezérlő-szabály, 1 `control-min`. `apps/web/app/hirfigyelo/_kozos/hirfigyelo.css`: 1 vezérlő-szabály, 0 `control-min` (a fülsor).
- A tokenőr (`pnpm tokenor`) tiltja a beégetett méretet a CSS-ben, a térköz-őr a pixel-térközt: minden térköz `var(--ter-N)`. A `height: 8px` / `14px` sorok NEM vezérlők (haladásjelző, pont) — azokat NE bántsd.

SZABÁLY, amit alkalmazol minden szabályra, ami `input`, `select`, `textarea`, `button`, `.km-*-gomb*`, chip (`.km-*-chip*`), fül (`.km-*-ful*`, `[role="tab"]`), sor-művelet gomb:
- fő vezérlő (mező, gomb, választó, chip): `min-height: var(--control-min);` — ha volt pixeles `min-height`/`height`, azt CSERÉLD; ha nem volt, ADD HOZZÁ. A `box-sizing: border-box` legyen ott, ahol `padding` is van.
- másodlagos (kártyán belüli kis gomb — pl. „Mentés", „Nem érdekel", „Megnyitás" a kártya alján; fülgomb; a × törlőgomb): `min-height: var(--control-min-s);`.
- A × törlőgomb a chipen: `min-width: var(--control-min-s); min-height: var(--control-min-s);` — érintésre elég nagy.
- Semmi mást nem változtatsz: színt, térközt, betűt, elrendezést nem. Nem törölsz szabályt. Új osztályt nem találsz ki. Ahol nem vagy biztos, hogy vezérlő-e, hagyd.

HATÁR: a négy fájl. Tokenből minden méret; `var(--ter-N)` a térköz; pixel csak ott marad, ahol már volt és NEM vezérlő magassága. A fájl többi része karakterre azonos marad.
KÉSZ, HA: `grep -c "min-height: [0-9]*px"` a négy fájlban 0 (a nem-vezérlő `height: 8px`-ek maradhatnak); `pnpm tokenor` zöld.
Visszaadás: a négy fájl teljes tartalommal, külön `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban. Semmi más szöveg.
