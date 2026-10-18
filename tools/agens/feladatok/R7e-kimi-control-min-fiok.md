# R-7e · Sokfájlos átírás (2/2) — a többi lap stíluslapjain minden vezérlő a `--control-min` tokenből éljen

CÉL: a mellékelt EGY CSS-fájlban (fiok.css — a másik négy már kész) minden **beviteli mező, gomb, választó és chip** magassága a `var(--control-min)` (fő) vagy `var(--control-min-s)` (másodlagos, kis gomb) tokenből jöjjön — pixelben írt vezérlő-magasság sehol. A rajz (R-7e) 46 px-et kér, telefonon is.

TÉNYEK (mérve):
- `apps/web/app/feliratok/feliratok.css`: 1 vezérlő-szabály, 0 `control-min`; a `.km-feliratok-mezo` textarea `min-height: 66px` — az egy TÖBBSOROS mező, marad (textarea-nál a 66px a rajz szerinti három sor; ezt NE cseréld).
- `apps/web/app/koltseg/koltseg-gazda.css`: 5 vezérlő-szabály, 0 `control-min` (a keret-mezők és a mentés gomb).
- `apps/web/app/meghivo/[jegy]/bevalto.css`: 2 vezérlő-szabály, 0 `control-min`.
- `apps/web/app/_kozos/arculat-anyagok.css`: 4 vezérlő-szabály, 2 `control-min`.
- `apps/web/app/_kozos/fiok.css`: 44 vezérlő-szabály, 6 `control-min` — ez a legnagyobb; itt vannak az ügyfélprofil és az onboarding közös mezői.
- A tokenőr tiltja a beégetett méretet, a térköz-őr a pixel-térközt: minden térköz `var(--ter-N)`.

SZABÁLY (ugyanaz, mint az 1/2 feladatban): `input`, `select`, `button`, egysoros mező, chip, választó → `min-height: var(--control-min);` (pixeles magasságot cserélsz, hiányzót hozzáadsz; `box-sizing: border-box` ahol padding van). Kártyán belüli kis gomb, × törlőgomb, jelvény-gomb → `var(--control-min-s)` (a ×-nek `min-width` is). `textarea` többsoros mezőnél a meglévő min-height marad. Nem-vezérlő `height` (pont, csík, kép) marad. Semmi mást nem változtatsz; szabályt nem törölsz; új osztályt nem találsz ki; ahol bizonytalan, hagyd.

HATÁR: az öt fájl. A fájl többi része karakterre azonos marad.
KÉSZ, HA: pixeles vezérlő-magasság nincs; `pnpm tokenor` zöld.
Visszaadás: az öt fájl teljes tartalommal, külön `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban. Semmi más szöveg.
