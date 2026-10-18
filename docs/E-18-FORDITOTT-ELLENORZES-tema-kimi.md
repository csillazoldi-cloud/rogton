## Felesleg (van nálunk, nincs a v6-ban) — HIBA

| Elem (idézd a szöveget / az osztály nevét) | Hol a kódban | Javaslat |
|---|---|---|
| `km-tema-szint` jelvény (a v6 `thAdmin` helyén a szintet jelzi, nem az admin státuszt) | `Tema.tsx` fejléc, `szintJelveny` | ELFOGADOTT (D-09); ne jelezzük |
| `km-tema-allapot-valaszto` szintválasztó (`szint_valaszto`) | `Tema.tsx` fejléc, `rendszergazda ? ... : null` | ELFOGADOTT (D-09); ne jelezzük |
| Nem-tulajdonos figyelmeztető sor: `tema.nincs_jog_kozos` / `tema.csak_tulajdonos` | `Tema.tsx`, `!szerkesztheto ? ...` | ELFOGADOTT (D-09); ne jelezzük |
| `tema.betoltes_*` üzenetsávok (betöltés, hiba, újra) | `Tema.tsx` fejléc alatt, `betoltes === "folyik"` / `"hiba"` | ELFOGADOTT (E-14 kör); ne jelezzük |
| `km-tema-verziok` szekció ("Korábbi verziók") | `Tema.tsx`, `<section>` az export/import után | ELFOGADOTT (E-14 kör); ne jelezzük |
| `tema.export_fajl` / `tema.import_fajl` gombpár (`FajlValaszto`) | `Tema.tsx` IO szekció, `exportalFajlba` + `FajlValaszto` | ELFOGADOTT (E-14 kör); ne jelezzük |
| `tema.vissza_fiok` link ("Vissza a fiókhoz →") | `Tema.tsx` fejléc, `<a href="/fiok">` | ELFOGADOTT; ne jelezzük |
| `km-tema-verzio-ures`, `km-tema-verzio-gomb` stb. CSS | `tema.css` alul, verziók szekcióhoz | ELFOGADOTT (E-14 kör); ne jelezzük |

*(A fentiek az ismert és elfogadott eltérések listájában szerepelnek, ezért nem jelzem hibaként.)*

---

## Hiány (van a v6-ban, nincs nálunk) — KÉRDÉS

| v6 elem (a `t.kulcs` és a jelölés) | Megjegyzés |
|---|---|
| `t.thAdmin` jelvény a fejlécben | A v6-on külön jelzi, hogy "rendszer-adminisztráció — nem az onboarding része"; nálunk ezt a `szintJelveny` váltotta fel. **ELFOGADOTT (D-09)** |
| `t.arrow` a fejléc "Onboarding →" linkjében | Nálunk `tema.vissza_fiok` + literál `→`; **ELFOGADOTT** |
| `t.thShapesNote` jegyzet a Formák szekció tetején, a cím alatt közvetlenül | A v6-on: `<div style="...margin-bottom:12px">{{ t.thShapesNote }}</div>` a `<h2>` után; nálunk a `<h2>` után van, de a v6-ban `margin:0 0 4px` a címnek és külön `margin-bottom:12px` a jegyzetnek — nálunk `km-tema-szekcio-cim` standard `margin: 0 0 12px`, és a jegyzet utána. **Megjelenésileg egyezik, sorrendileg kicsit más** |
| `t.thColorsNote` — a v6-ban `margin-top:10px`, nálunk `km-tema-jegyzet` nincs külön margin-top beállítva a színek grid után | Vizsgálandó: a CSS-ben `.km-tema-jegyzet` nincs `margin-top`-pal, a v6 inline `margin-top:10px`-et használ. **Lehet, hogy sűrűbben ül a gridhez** |
| `t.thIoNote` — a v6-ban `margin-top:6px`, nálunk `km-tema-jegyzet` nincs külön margin-top | Ugyanaz a kérdés mint fent |
| `t.thMotionNote` — a v6-ban `margin-top:8px`, nálunk `km-tema-jegyzet` nincs külön margin-top | Ugyanaz a kérdés mint fent |
| A v6 `advSliders` listájában `step` attribútum (pl. `--lh` esetén `0.05`, `--sat-glass` esetén `10`) | Nálunk a `csuszka` függvényben `lepes` paraméterként átadva; **ellenőrizendő, hogy tényleg bekerül-e az inputra** — a kód alapján igen: `<input ... step={lepes} ...>` |
| A v6 `typeSliders` `--fs-h1` és `--fs-base` esetén `step="1"` implicit | Nálunk `csuszka` alapértelmezett `lepes = 1`, **egyezik** |
| A v6 `spaceSliders` `--pad-card` esetén `min="8" max="64"` | Nálunk `min={8} max={64}`, **egyezik** |
| A v6 `fxSliders` `--blur-glass` esetén `max="60"` | Nálunk `max={60}`, **egyezik** |
| A v6 `fxSliders` `--glass-alpha` esetén `max="30"` | Nálunk `max={30}`, **egyezik** |
| A v6 `fxSliders` `--shadow-strength` esetén `max="80"` | Nálunk `max={80}`, **egyezik** |
| A v6 `advSliders` `--gap` esetén `max="24"` | Nálunk `max={24}`, **egyezik** |
| A v6 `advSliders` `--btn-pad-y` esetén `max="20"` | Nálunk `max={20}`, **egyezik** |
| A v6 `advSliders` `--btn-pad-x` esetén `max="40"` | Nálunk `max={40}`, **egyezik** |
| A v6 `advSliders` `--sat-glass` esetén `max="300"` | Nálunk `max={300}`, **egyezik** |
| A v6 `advSliders` `--lh` esetén `min="1.1" max="2.2"` | Nálunk `min={1.1} max={2.2}`, **egyezik** |
| `t.thPreviewNote` — a v6-ban ez a szöveg: `"a szerkesztés először csak ide hat"` | Nálunk `t("tema.preview_note")` — a kulcs tartalmát nem látom a `km-i18n.js`-ben, de a `useFeliratok` hook a `tema.*` prefixet használja. **Biztosított, hogy a kulcs létezik?** A v6 `km-i18n.js`-ben nincs `thPreviewNote` kulcs... várjunk, a v6 `km-i18n.js` végén `thPreviewNote` nincs explicit, de a `renderVals`-ban `t.thPreviewNote` van. **A `km-i18n.js` végén valóban nincs `thPreviewNote`**, csak a `hu` objektumban a végén `thLh` stb. van. **HIBA a v6-ban?** Vagy a `T()` függvény visszaadja a nyers kulcsot hiány esetén? A kód szerint `var base = hu, over = LANGS[lang] || hu`, és `for (var k in base) out[k] = base[k]; for (var j in over) out[j] = over[j];` — ha nincs `thPreviewNote` sehol, akkor `undefined`. A v6 `renderVals`-ban `t.thPreviewNote` használva, ami `undefined` lehet. **Nálunk `t("tema.preview_note")` — ha ez a kulcs hiányzik, a `useFeliratok` mit ad vissza?** |

---

## Eltérő viselkedés (megvan, de máshogy)

| v6 | Nálunk | Súly (kicsi / közepes / nagy) |
|---|---|---|
| `discard`: visszaállítja az `alkalmazott` + `localStorage`-ból olvasott értékeket; nálunk `adat.alkalmazott`-ra áll | A v6 `discard` megpróbálja a `localStorage.getItem('km-theme-applied')`-t is; nálunk csak a kiszolgálóról jött `alkalmazott` van. **ELFOGADOTT** (kiszolgálós tárolás) | kicsi |
| `saveDraft`: v6 `localStorage.setItem('km-theme-draft', ...)`; nálunk `PUT /api/tema` | **ELFOGADOTT** (kiszolgálós tárolás) | kicsi |
| `applyTheme`: v6 `localStorage.setItem('km-theme-applied', ...)` + `KT.applyToRoot(tk, s.lang)`; nálunk `PUT /api/tema` + `POST /api/tema/alkalmaz` + `router.refresh()` | **ELFOGADOTT** (kiszolgálós tárolás + szerveroldali alkalmazás) | kicsi |
| `loadTheme`: v6 `fetch('tema-alap.json')` + `localStorage` olvasás; nálunk `fetch('/api/tema')` a szerverről | **ELFOGADOTT** | kicsi |
| `--pad-card` csúszka: v6 `this.setToken('--pad-card', ...)` + `this.setToken('--pad-block', ...)`; nálunk `tokenBeallit` kétszer | **Egyezik**, de nálunk két külön `setTokenek` hívás, ami két render ciklust okozhat. A v6 egy `setState`-ben csinálja mindkettőt. | kicsi |
| `exportTheme`: v6 csak a mezőbe ír; nálvan `exportal` (mezőbe) + `exportalFajlba` (fájlba letöltés) | **ELFOGADOTT** (E-14 kör) | kicsi |
| `importTheme`: v6 `setState({ ioText: ... })` nem változtatja; nálunk `importal` függvény + `importalFajlbol` | **ELFOGADOTT** (E-14 kör, fájl import) | kicsi |
| A v6 `shapeSliders` utolsó eleme (`--bw`) nincs `pillable`, de van `pillBtn: {}` és `togglePill: () => {}` | Nálunk `csuszka("--bw", ...)` hívás, ami nem ad `kapszulazhato` lehetőséget. **Egyezik** a viselkedés (nincs kapszula gomb). | — |
| A v6 `pvPrimaryBtn` padding `13px 26px` literál; nálunk `var(--btn-pad-y) var(--btn-pad-x)` | **ELFOGADOTT** | kicsi |
| A v6 `pvGhostBtn` padding `13px 20px` (literál); nálunk `var(--btn-pad-y) 20px` | A CSS-ben `padding: var(--btn-pad-y) 20px` — a v6 `13px 20px` helyett `var(--btn-pad-y) 20px`. **Kérdés: a v6 `pvGhostBtn`-je miért nem használ `--btn-pad-x`-et?** Nálunk sem használjuk, csak a függőlegeset tokenizáljuk. **Egyezik a v6-tal** (a v6 is literál `20px`). | kicsi |
| A v6 `pvField` `boxShadow` csak `focus` állapotban; nálunk CSS-ben `.km-pv-mezo[data-allapot="focus"]` | **Egyezik** | — |
| A v6 `pvStepCircle` `width:28px; height:28px`; nálunk CSS-ben `width: 28px; height: 28px` | **Egyezik** | — |
| A v6 `code` minta fix `#4f5fd6`; nálunk `p.teljes["--primary"]` | **ELFOGADOTT** | kicsi |
| A v6 `fontSelects` `mkSel` függvénnyel dinamikusan; nálunk `valaszto` komponens-függvénnyel | **Egyező szerkezet** | — |
| A v6 `advSelects` `--fw-head` és `--fw-strong` esetén `fwOpts(['500','600','700','800'])` stb.; nálunk `TOKEN_SZABALYOK["--fw-head"].ertekek.map(...)` | **Egyező szerkezet**, de a forrás más. Nálunk a séma határozza meg. | kicsi |
| A v6 `colorFields` 12 mező; nálunk `SZIN_MEZOK` tömb 12 elemmel | **Egyezik** | — |
| A v6 `colorLabels['--bg']` speciális: `t.thColors + ' — bg'`; nálunk `szinCimke` függvény ugyanezt csinálja | **Egyezik** | — |
| A v6 `dir="{{ dir }}"` a gyökéren; nálunk `nyelv` alapján implicit a `html`/`body` szinten? | A v6 explicit `dir` attribútumot ad; nálunk a Next.js/i18n kezeli. **ELFOGADOTT** (közös vezérlő) | kicsi |
| A v6 `select` nyelvválasztó `aria-label="{{ t.uiLangLabel }}"`; nálunk `Nyelvvalaszto` komponens | **ELFOGADOTT** (közös vezérlő) | kicsi |

---

## Egyezik

### Fejléc
- Cím: `t.thTitle` / `tema.title`
- Piszkos/szinkron jelvény: `thDirty`/`thSynced` ↔ `tema.dirty`/`tema.synced`
- Gombok: discard, defaults, save draft, apply — sorrend és stílus
- Sticky pozicionálás, `z-index: 10`, háttér, alsó border

### Üzenetek
- Betöltés (`themeLoading` / `tema.betoltes_loading`)
- Betöltési hiba + újrapróbálás gomb
- Értesítés (ok/hiba stílus)
- Import hibák listája tokenenként
- Kontraszt figyelmeztetés

### Bal oszlop — 7 szekció

**1. Színek**
- 12 színmező (`--bg`, `--bg-elev`, `--text`, `--text-mut`, `--primary`, `--primary-2`, `--on-primary`, `--accent`, `--accent-text`, `--ok`, `--err`, `--focus`)
- `type="color"` input + token név (`<code>`)
- `thColorsNote` / `tema.colors_note` jegyzet

**2. Tipográfia**
- 3 választó: `--font-display`, `--font-body`, `--font-code`
- 2 csúszka: `--fs-h1` (20-56), `--fs-base` (12-20)

**3. Formák**
- 4 lekerekítés csúszka: `--r-btn`, `--r-field`, `--r-card`, `--r-badge` (0-30, kapszulázható ahol van)
- `--bw` csúszka (0-4)
- Kapszula gomb ahol van

**4. Térközök**
- `--pad-card` (8-64) + `--pad-block` automatikus származtatás
- `--control-min` (32-64)

**5. Effektek**
- 3 csúszka: `--blur-glass` (0-60), `--glass-alpha` (0-30%), `--shadow-strength` (0-80%)
- `--motion` választó: normal/slow/off
- `thMotionNote` / `tema.motion_note`

**6. Részletes**
- Nyitható szekció (`advOpen` / `advNyitva`)
- Árnyékszín (`--shadow-color`)
- 4 választó: `--font-display-arab`, `--font-body-arab`, `--fw-head`, `--fw-strong`
- 5 csúszka: `--lh` (1.1-2.2, 0.05), `--gap` (4-24), `--btn-pad-y` (8-20), `--btn-pad-x` (12-40), `--sat-glass` (50-300, 10)

**7. Export/import**
- Export/Import gombok
- JSON textarea
- `thIoNote` / `tema.io_note`

### Jobb oszlop — Előnézet

**Fej:**
- Cím: `thPreview` / `tema.preview`
- Megjegyzés: `thPreviewNote` / `tema.preview_note`
- Desktop/Mobil váltó
- Állapotválasztó: normal/hover/focus/disabled/error

**Előnézet elemei sorrendben:**
1. Komponensek fejezet + elsődleges/másodlagos gomb, jelvények (saját/AI), lépés-kör
2. Beviteli mező címkével
3. Kód-szöveg minta (`--primary` aktuális értékkel)
4. Hiba doboz (csak error állapotban)
5. Siker doboz
6. Onboarding-részlet: cím kiemelt gradienssel, alcím, mező, gomb

### CSS tokenek
- Minden `var(--...)` hivatkozás megegyezik a v6 `--root` definíciójával
- Responsive töréspont (`max-width: 900px`)
- Sticky előnézet (`top: 76px`)

### Gombok viselkedése
- `discard`: visszaállítás
- `resetDefaults`: alapértékek betöltése
- `saveDraft`: tervezet mentése
- `applyTheme`: alkalmazás
- `exportTheme`/`importTheme`: JSON IO
- `togglePill`: kapszula váltás
- `--pad-card` csúszka: `--pad-block`-ot is állítja (0.6-szoros, min 8)
