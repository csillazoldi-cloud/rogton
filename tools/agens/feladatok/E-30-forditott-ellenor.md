# Feladat — FORDÍTOTT ELLENŐR (E-30): a referencia-host felülete — keresd a HIBÁT

A második host (`apps/referencia-host`, sima Node, se Next, se React) kapott két kiszolgálón összeállított HTML-oldalt: a találatok listáját (futtatás gombbal)
és a beállítás megtekintését. Három nyelven, a KÖZÖS felirat-csomagból (`@km/news-monitor-feliratok`), a KÖZÖS tokenekből (`@km/design-system`).
A lapon nincs kliensoldali JavaScript.

Mellékletben: `lap.ts`, `talalatok.ts`, `beallitas.ts`, `stilus.ts`, és a kiszolgáló útvonalkezelése.

Nézd végig, minden megállapításodhoz FÁJL és SOR:

1. **HTML-befecskendezés**: a hírek CÍME és SZÖVEGE idegen forrásból jön (bárki írhat bele HTML-t vagy `<script>`-et). Van-e OLYAN HELY, ahol adat
   `htmlBiztos` NÉLKÜL kerül a kimenetbe? Nézd meg a címeket, összefoglalókat, forráscímeket, témaneveket, kizárásokat, hibaokokat, és az attribútumokat is
   (`href`, `lang`, `aria-label`, `class`) — az attribútumban az aposztróf és az idézőjel is veszélyes.
2. **Beégetett szöveg**: maradt-e a felületen olyan magyar (vagy bármilyen) szöveg, ami NEM a felirat-csomagból jön? Három nyelven kell működnie.
3. **Nem létező tokenek**: hivatkozik-e a CSS olyan `var(--…)` névre, ami nincs a témában? (A létező nevek: `--bg --bg-elev --text --text-mut --text-dim
   --text-faint --primary --primary-2 --on-primary --accent --accent-text --accent-link --accent-tint --accent-tint-weak --accent-border --ok --ok-bg --ok-strong
   --err --err-bg --err-border --err-strong --warn --warn-bg --warn-border --focus --focus-ring --line --line-soft --panel-soft --panel-soft-2 --header-bg
   --field-bg --field-border --btn-ghost-bg --btn-ghost-border --btn-ghost-text --btn-disabled-bg --selection --src-ai --src-ai-bg --src-web --src-web-bg
   --src-empty --src-empty-bg --src-user --src-user-bg --font-body --font-display --font-code --fs-xs --fs-sm --fs-base --fs-md --fs-h2 --fs-h1 --fs-title
   --fw-strong --fw-head --lh --gap --pad-card --pad-block --pad-field-x --pad-field-y --btn-pad-x --btn-pad-y --control-min --bw --r-card --r-block --r-btn
   --r-field --r-badge --shadow-pop --glass-bg --glass-border --blur-glass --sat-glass --dur-fast --dur-med`.)
4. **A futtatás gombja**: a `POST /inditas` sorba tesz és 303-mal visszaküld. Mi történik, ha már fut valami (a gomb letiltva, de a kérés kézzel is elküldhető)?
   Elveszhet-e adat, keletkezhet-e két párhuzamos futás? Kell-e védelem a kéretlen kérés ellen (a lap nem használ sütit a művelethez)?
5. **Nyelvválasztás**: `?nyelv=` → süti → böngésző → magyar. Beírható-e a sütibe vagy a címbe olyan érték, ami bajt okoz? A nyelvváltó hivatkozás
   (`?nyelv=ro`) megtartja-e az oldalt, és nem visz-e el más paramétereket?
6. **Elérhetőség és mobil**: van-e olyan elem, ami képernyőolvasóval értelmezhetetlen (gomb felirat nélkül, jelvény csak színnel jelölve)?
   Kis képernyőn eltörik-e valami?

Írj `docs/E-30-FORDITOTT-ELLENORZES-deepseek.md` néven TÖMÖR jelentést: **legfeljebb 12 sor**, minden sor MÁS megállapítás — ismétlés TILOS.
Alak: `SÚLYOS` / `KÖZEPES` / `APRÓ` + fájl:sor + mi a baj + mi lenne a javítás. A végén EGY mondat: mi az, ami tényleg működik.
Ne írj kódot, ne dicsérj, ne ismételd a feladatot.
