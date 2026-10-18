## Felesleg (van nálunk, nincs a v6-ban) — HIBA

| Elem (idézd a szöveget / az osztály nevét) | Hol a kódban | Javaslat |
|---|---|---|
| `km-tema-fejlec` osztályban a `fut` állapot letiltása (`disabled={fut}`) a szintválasztónál | `Tema.tsx`, fejléc jobb oldal | A v6-ban nincs `fut` globális állapot; a gombok csak saját műveletükre tiltódnak. A szintválasztó tiltása felesleges, mert a betöltés úgyis `betoltes === "folyik"` esetén lefut. |
| `data-be` attribútum a `km-tema-mod-gomb` elemeken | `Tema.tsx`, előnézet fejléc | A v6 `segBtn` inline stílussal oldja meg az aktív állapotot, nincs külön `data-be` jelölő. A CSS-ben valószínűleg nincs rá szükség, mert a `data-mobil` a szülőn van. |
| `tabIndex={-1}` a `km-pv-gomb-elsodleges` és `km-pv-gomb-szellem` gombokon | `ElonezetPanel.tsx` | A v6-ban nincs `tabIndex={-1}`; a gombok természetes tab sorrendben vannak. Ez akadálymentesítési szempontból is kérdéses. |
| `km-pv-ob-mezo` fix értékkel `value="mintamuhely.hu"` | `ElonezetPanel.tsx` | A v6-ban `value="{{ t.ob1card }}"` i18n kulcs van; a mi kódunkban fix magyar sztring. Ez a `t("onboarding1.card")` helyett hardkódolt érték. |

## Hiány (van a v6-ban, nincs nálunk) — KÉRDÉS

| v6 elem (a `t.kulcs` és a jelölés) | Megjegyzés |
|---|---|
| `t.thAdmin` jelvény (adminisztrátori jelölés) | A v6 fejlécben van egy `thAdmin` jelvény; nálunk helyette `szintJelveny` van (`tema.szint_kozos`/`tema.szint_szervezet`). Ez az elfogadott D-09 eltérés része, de a jelvény *helyén* van. |
| `t.arrow` a vissza linknél (`Onboarding {{ t.arrow }}`) | A v6-ban `→` nyíl i18n kulccsal; nálunk `→` literál a `t("tema.vissza_fiok")` sztringben. Nem biztos, hogy i18n-probléma. |
| `t.thColorsNote` — a színek szekció jegyzete | Nálunk `t("tema.colors_note")` van, egyezik. ✓ |
| `t.thShapesNote` — a formák szekció jegyzete | Nálunk `t("tema.shapes_note")` van, egyezik. ✓ |
| `t.thMotionNote` — a mozgás jegyzete | Nálunk `t("tema.motion_note")` van, egyezik. ✓ |
| `t.thIoNote` — az export/import jegyzete | Nálunk `t("tema.io_note")` van, egyezik. ✓ |
| `t.thPreviewNote` — az előnézet megjegyzése | Nálunk `t("tema.preview_note")` van, egyezik. ✓ |
| `t.thContrast` kontrasztfigyelmeztetés sablon | Nálunk `t("tema.contrast", { list: ... })` van, egyezik. ✓ |
| `t.thIgnored` figyelmeztetés importnál | Nálunk `t("tema.ignored", { n: ... })` van, egyezik. ✓ |
| `t.thNoticeImportOk` import siker sablon | Nálunk `t("tema.notice_import_ok", { ign })` van, egyezik. ✓ |
| `t.thPill` — a kapszula gomb szövege | Nálunk `t("tema.pill")` van, egyezik. ✓ |
| `t.thFontArabH`, `t.thFontArabB` — arab betűk | Nálunk `t("tema.font_arab_h")`, `t("tema.font_arab_b")` van, egyezik. ✓ |
| `t.thFwHead`, `t.thFwStrong` — súlyok | Nálunk `t("tema.fw_head")`, `t("tema.fw_strong")` van, egyezik. ✓ |
| `t.thLh`, `t.thGap`, `t.thBtnPadY`, `t.thBtnPadX`, `t.thSat` — részletes csúszkák | Nálunk megvannak a megfelelő kulcsok, egyeznek. ✓ |
| `t.thBlur`, `t.thGlass`, `t.thShadowStrength` — effekt csúszkák | Nálunk megvannak, egyeznek. ✓ |
| `t.thPadCard`, `t.thControlMin` — térköz csúszkák | Nálunk megvannak, egyeznek. ✓ |
| `t.thRBtn`, `t.thRField`, `t.thRCard`, `t.thRBadge`, `t.thBw` — alak csúszkák | Nálunk megvannak, egyeznek. ✓ |
| `t.thFsH1`, `t.thFsBase` — tipográfia csúszkák | Nálunk megvannak, egyeznek. ✓ |
| `t.thFontHead`, `t.thFontBody`, `t.thFontCode` — betűválasztók | Nálunk megvannak, egyeznek. ✓ |
| `t.thMotionNormal`, `t.thMotionSlow`, `t.thMotionOff` — mozgás opciók | Nálunk megvannak, egyeznek. ✓ |
| `t.thStNormal`, `t.thStHover`, `t.thStFocus`, `t.thStDisabled`, `t.thStError` — állapotok | Nálunk megvannak, egyeznek. ✓ |
| `t.thDesktop`, `t.thMobile` — mód váltók | Nálunk megvannak, egyeznek. ✓ |
| `t.thPrimary`, `t.thSecondary` — gombok | Nálunk `t("tema.primary")`, `t("tema.secondary")` van, egyeznek. ✓ |
| `t.thFieldLabel`, `t.thCodeDemo`, `t.thErrDemo`, `t.thOkDemo` — előnézet szövegek | Nálunk megvannak, egyeznek. ✓ |
| `t.thComponents`, `t.thObSnippet` — előnézet fejezetek | Nálunk `t("tema.components")`, `t("tema.ob_snippet")` van, egyeznek. ✓ |
| `t.badgeUser`, `t.badgeAi` — jelvények | Nálunk `t("jelveny.sajat")`, `t("jelveny.ai")` van — **eltérő kulcs!** A v6 `badgeUser`/`badgeAi`, mi `jelveny.sajat`/`jelveny.ai`. Ez nem `tema.` prefix, de funkcionálisan ugyanaz. |
| `t.fieldError`, `t.fieldFocus`, `t.fieldSample` — mező értékek | Nálunk `t("tema.field_error")`, `t("tema.field_focus")`, `t("tema.field_sample")` van — **eltérő kulcs!** A v6 `fieldError` stb. prefix nélkül, mi `tema.` prefixszel. |
| `t.s1t1`, `t.s1hl`, `t.sub1`, `t.ob1card`, `t.genCta` — onboarding szövegek | Nálunk `t("onboarding1.cim_eleje")`, `t("onboarding1.cim_kiemelt")`, `t("onboarding1.alcim")`, `t("onboarding1.gomb")` van — **eltérő kulcsok!** A v6 rövid, mi hosszú, strukturált kulcsok. A `t.ob1card` hiányzik nálunk (lásd felesleg). |
| `t.themeLoading`, `t.themeLoadErr`, `t.themeRetry` — betöltési üzenetek | Nálunk `t("tema.betoltes_loading")`, `t("tema.betoltes_load_err")`, `t("tema.betoltes_retry")` van — **eltérő kulcsok!** A v6 `themeLoading` stb., mi `tema.betoltes_*`. |
| `t.thImportErrIntro` — import hiba bevezető | Nálunk `t("tema.import_err_intro")` van, egyezik. ✓ |
| `t.thNoticeDiscard`, `t.thNoticeDefaults`, `t.thNoticeDraftOk`, `t.thNoticeDraftErr`, `t.thNoticeApplied`, `t.thNoticeApplyErr`, `t.thNoticeExport`, `t.thNoticeJson` — értesítések | Nálunk megvannak a megfelelő `tema.notice_*` kulcsok, egyeznek. ✓ |
| `t.thDirty`, `t.thSynced` — piszkos állapot | Nálunk `t("tema.dirty")`, `t("tema.synced")` van, egyeznek. ✓ |
| `t.thTitle` — oldalcím | Nálunk `t("tema.title")` van, egyezik. ✓ |
| `t.thDiscard`, `t.thDefaults`, `t.thSaveDraft`, `t.thApply`, `t.thExport`, `t.thImport` — gombok | Nálunk megvannak, egyeznek. ✓ |
| `t.thColors`, `t.thType`, `t.thShapes`, `t.thSpace`, `t.thFx`, `t.thAdv`, `t.thIo`, `t.thPreview` — szekciócímek | Nálunk megvannak, egyeznek. ✓ |
| `t.uiLangLabel` — nyelvválasztó aria-label | Nálunk a `Nyelvvalaszto` komponensben lehet; nem látható közvetlenül a `Tema.tsx`-ben. **Ellenőrizni kell**, hogy van-e. |

## Eltérő viselkedés (megvan, de máshogy)

| v6 | Nálunk | Súly (kicsi / közepes / nagy) |
|---|---|---|
| `discard`: `localStorage`-ból visszaállítja az alkalmazott témát, figyelembe véve a `km-theme-applied`-et is | `elvet()`: csak `adat.alkalmazott`-ra állít, nincs `localStorage` olvasás | közepes — a v6 kétszintű (alap + alkalmazott), nálunk a szerver adja az `alkalmazott`-ot, de a v6 kliens-oldali overlay-t is kezel |
| `resetDefaults`: `s.defaults`-ra állít | `alapertekek()`: `adat.alap`-ra állít | kicsi — funkcionálisan ugyanaz, a D-09 miatt két szint van |
| `saveDraft`: `localStorage.setItem('km-theme-draft', ...)` | `tervezetMent()`: `PUT /api/tema` vagy `/api/tema/kozos` | kicsi — elfogadott eltérés (szerver vs. localStorage) |
| `applyTheme`: `localStorage.setItem('km-theme-applied', ...)` majd `KT.applyToRoot(tk, s.lang)` | `alkalmaz()`: `PUT` majd `POST /alkalmaz`, végül `router.refresh()` | kicsi — elfogadott eltérés (szerver + oldalfrissítés vs. kliens-oldali applyToRoot) |
| `exportTheme`: `setState({ ioText: JSON.stringify(...) })` | `exportal()`: `setIoSzoveg(...)` | kicsi — egyezik |
| `importTheme`: `KT.validate(obj)` majd `KT.SCHEMA[k]` szűrés | `importal()`: `temaEllenoriz(obj)` majd `TOKEN_SZABALYOK` szűrés | kicsi — egyezik, más implementáció |
| `togglePill`: `px(token) > max ? '6px' : '999px'` | `alak()`: `kapszula ? "6px" : "999px"` | kicsi — egyezik |
| `--pad-card` csúszka: `setToken('--pad-card', ...)` ÉS `setToken('--pad-block', ...)` | `onChange` callbackben explicit mindkettő | kicsi — egyezik |
| `pvPrimaryBtn` padding: `'13px 26px'` fix literál | `ElonezetPanel.tsx`-ben CSS osztályok, a padding a `--btn-pad-y/x` token | kicsi — elfogadott eltérés |
| `pvPrimaryBtn` `fontFamily`: `s.lang === 'ar' ? tk['--font-body-arab'] : tk['--font-body']` | `ElonezetPanel.tsx`-ben nincs nyelv-függő betűcsalád | közepes — az arab betűk hiányoznak az előnézetből |
| `pvGhostBtn` padding: `'13px 20px'` | `ElonezetPanel.tsx`-ben nincs explicit padding, CSS osztályok | kicsi — a tokenek kezelik |
| `pvField` `boxShadow`: `st === 'focus' ? '0 0 0 3px ' + full['--focus-ring'] : 'none'` | `ElonezetPanel.tsx`-ben `data-allapot="focus"` attribútum, de nincs explicit boxShadow a kódban | közepes — a CSS-ben lehet, de a v6 inline stílusban adja |
| `pvBadgeUser`/`pvBadgeAi` háttér/szín: `full['--src-user-bg']` stb. | `ElonezetPanel.tsx`-ben `km-pv-jelveny-sajat`/`km-pv-jelveny-ai` osztályok | közepes — a `--src-user-bg`, `--src-user`, `--src-ai-bg`, `--src-ai` tokenek használata nem látható a kódban |
| `pvStepCircle`: `full['--grad-primary']` fallback `var(--grad-primary)` | `ElonezetPanel.tsx`-ben `km-pv-lepes` osztály | közepes — a gradiens és a glow tokenek használata nem látható |
| `previewVars`: `width: '100%', maxWidth: s.mobile ? '375px' : '100%'` | `ElonezetPanel.tsx` `data-mobil` attribútum | kicsi — a CSS kezeli a szélességet |
| `modeDesktop`/`modeMobile`: `segBtn` inline stílus aktív/inaktív | `km-tema-mod-gomb` `data-be` attribútum | kicsi — más jelölés, ugyanaz a funkció |
| `stateView` select: 5 opció | `allapotNezet` select: 5 opció, egyezik | kicsi — egyezik |
| `advOpen` nyitás: `▾`/`▸` nyilak | `advNyitva`: `▾`/`▸` nyilak | kicsi — egyezik |
| `dir="{{ dir }}"` a teljes oldalon és az előnézeten | `dir="ltr"` csak az `ioSzoveg` textarea-n explicit | közepes — az RTL irány nincs kezelve a `Tema.tsx`-ben, csak a `Nyelvvalaszto` komponensben lehet |
| `lang="{{ lang }}"` a teljes oldalon | nincs explicit `lang` attribútum a gyökéren | kicsi — a `html` elemen lehet Next.js szinten |
| `aria-label="state"` az állapotválasztón | `aria-label="state"` az állapotválasztón | kicsi — egyezik |
| `aria-label="Theme JSON"` a textarea-n | `aria-label="Theme JSON"` a textarea-n | kicsi — egyezik |
| `readOnly="{{ true }}"` a mezőkön | `readOnly` attribútum | kicsi — egyezik |
| `dir="ltr"` a kód-mezőn és a textarea-n | `dir="ltr"` a textarea-n, de nincs a `km-pv-ob-mezo`-n | kicsi — a kód-mezők iránya |

## Egyezik

### Fejléc
- Cím: `t.thTitle` / `t("tema.title")`
- Piszkos jelvény: `dirtyLabel` / `km-tema-piszkos` `data-piszkos`
- Gombok: Discard, Defaults, Save Draft, Apply (sorrend, stílusok, disabled állapotok a betöltésnél)
- Nyelvválasztó (elfogadott: nincs arab, közös komponens)
- Vissza link: "Onboarding →" helyett "Vissza a fiókhoz →" (elfogadott)

### Üzenetek
- Betöltés: `themeLoading` / `tema.betoltes_loading`
- Betöltési hiba + újrapróbál gomb: `themeLoadErr` + `themeRetry` / `tema.betoltes_load_err` + `tema.betoltes_retry`
- Értesítés: `hasNotice` / `uzenet` (ok/hiba színek, aria-live)
- Import hibák: `hasImportErrors` / `importHibak` (token + szöveg lista)
- Kontraszt figyelmeztetés: `hasContrastWarn` / `figyelmeztetesek`

### Bal oszlop 7 szekció
1. **Színek**: 12 mező (`--bg`, `--bg-elev`, `--text`, `--text-mut`, `--primary`, `--primary-2`, `--on-primary`, `--accent`, `--accent-text`, `--ok`, `--err`, `--focus`), jegyzet
2. **Tipográfia**: 3 választó (`--font-display`, `--font-body`, `--font-code`), 2 csúszka (`--fs-h1`, `--fs-base`)
3. **Formák**: 4 lekerekítés (`--r-btn`, `--r-field`, `--r-card`, `--r-badge`) + kapszula gombok (`--r-btn`, `--r-field`, `--r-badge`), keretvastagság (`--bw`)
4. **Térközök**: 2 csúszka (`--pad-card`, `--control-min`), a `--pad-card` állítja a `--pad-block`-ot is
5. **Effektek**: 3 csúszka (`--blur-glass`, `--glass-alpha`, `--shadow-strength`), mozgás választó (`--motion`)
6. **Részletes**: árnyékszín (`--shadow-color`), 4 választó (`--font-display-arab`, `--font-body-arab`, `--fw-head`, `--fw-strong`), 5 csúszka (`--lh`, `--gap`, `--btn-pad-y`, `--btn-pad-x`, `--sat-glass`), nyitható/zárható
7. **Export/import**: 2 gomb, textarea, jegyzet

### Jobb oszlop (előnézet)
- Fejléc: cím (`t.thPreview` / `t("tema.preview")`), megjegyzés (`t.thPreviewNote` / `t("tema.preview_note")`), Desktop/Mobil váltó, állapotválasztó
- Előnézet elemei sorrendben:
  1. Komponensek fejezet + elsődleges gomb, szellem gomb, saját jelvény, AI jelvény, lépés kör
  2. Mező címke + mező (readOnly, állapottól függő érték)
  3. Kód demo sor (`--primary` értékkel)
  4. Hiba doboz (csak error állapotban)
  5. Siker doboz
  6. Onboarding snippet: fejezet, kártya címmel (kiemelt rész), alcím, mező, gomb

### Gombok viselkedése
- `discard`: visszaállítás az alkalmazottra
- `resetDefaults`: visszaállítás az alapértékekre
- `saveDraft`: mentés tervezetként
- `applyTheme`: alkalmazás (v6: `applyToRoot`, mi: szerver + `router.refresh()`)
- `exportTheme`: JSON export a textarea-ba
- `importTheme`: JSON import a textarea-ból, validálás, alap + érvényes tokenek
- `togglePill`: 6px ↔ 999px váltás a kapszulázható mezőknél
- `--pad-card` csúszka: párhuzamosan állítja `--pad-block`-ot is (`v * 0.6`)

### D-09 kétszintűség (elfogadott eltérés)
- Szint jelvény a fejlécben (`szintJelveny`)
- Szintválasztó a rendszergazdának
- Nem-tulajdonos figyelmeztető sor (`!szerkesztheto`)
- Tiltott vezérlők (`disabled={!szerkesztheto}`)
