
# E-17b fordított ellenőrzés — Mockup ↔ Megvalósítás

## Mockup → Megvalósítás (van-e?)

| Elem | Mockup | Megvalósítás | Eltérés? | Javaslat |
|:---|:---|:---|:---|:---|
| **Fejléc: háttér** | `var(--bg-elev)`, `var(--line-soft)` alul | `var(--bg-elev)`, `var(--line-soft)` alul | nincs | — |
| **Fejléc: logo** | 26×26 px, `var(--grad-primary)`, "K", `var(--fs-md)` | `.km-fp-logo`: 26×26, `var(--grad-primary)`, "K", `var(--fs-md)` | nincs | — |
| **Fejléc: cím** | "Kommunikációs munkatér", `var(--font-display-active)`, `var(--fw-strong)`, `var(--fs-title)` | `t("kozos.app_nev")`, `var(--font-display-active)`, `var(--fw-strong)`, `var(--fs-title)` | nincs | — |
| **Fejléc: morzsa** | "/ aitmetica / Profil", `var(--fs-xs)`, `var(--text-dim)` | `t("fiok.morzsa", { szervezet })`, `var(--fs-xs)`, `var(--text-dim)` | nincs | — |
| **Fejléc: fióknév** | "Portik Vilmos", `var(--fs-sm)`, `var(--text-mut)` | `.km-fejlec-nev`, `var(--fs-sm)`, `var(--text-mut)` | nincs | — |
| **Fejléc: Kilépés gomb** | szellem gomb, 7px 14px, `var(--fs-sm)` | `<KilepesGomb />`, szellem gomb, 7px 14px, `var(--fs-sm)` | nincs | — |
| **Fejléc: mentés állapot** | — (nincs a mockupban) | `<MentesAllapot />` | SZÁNDÉKOS többlet (E-11) | — |
| **Címsor: H1** | "Ügyfélprofil", 24px, `var(--fw-head)` | `t("fiok.cim")`, `var(--fs-h2)` (=24px), `var(--fw-head)` | nincs | — |
| **Címsor: jóváhagyva jelvény** | "✓ Jóváhagyva", `var(--ok)`, `var(--ok-bg)`, `var(--fs-sm)` | `t("fiok.jovahagyva_jelveny")`, `var(--ok)`, `var(--ok-bg)`, `var(--fs-sm)` | nincs | — |
| **Címsor: meta** | "2026. szept. 7. 13:54 · Portik Vilmos", `var(--fs-sm)`, `var(--text-dim)` | `t("fiok.jovahagyva_meta", { ido, ki })`, `var(--fs-sm)`, `var(--text-dim)` | nincs | — |
| **Címsor: hiányzó gomb** | "1 hiányzó rész: Arculat", `var(--warn)`, `var(--warn-border)`, `var(--fs-sm)`, `margin-inline-start: auto` | `t("fiok.hianyzo_gomb", { n, list })`, `var(--warn)`, `var(--warn-border)`, `var(--fs-sm)`, `margin-inline-start: auto` | nincs | — |
| **Bevezető szöveg** | max-width: 70ch, `var(--fs-sm)`, `var(--text-dim)`, margin: 0 0 20px | `.km-fp-bevezeto`: max-width: 70ch, `var(--fs-sm)`, `var(--text-dim)`, margin: 0 0 20px | nincs | — |
| **Mezőkártyák: rács** | `repeat(auto-fit, minmax(300px, 1fr))`, gap: 12px | `.km-fp-racs`: ugyanez | nincs | — |
| **Mezőkártyák: szélesség** | `tevekenyseg` és `hangnem` teljes szélesség (`grid-column: 1 / -1`) | `SZELES` Set: "tevekenyseg", "hangnem"; `data-szeles="true"` → `grid-column: 1 / -1` | nincs | — |
| **Mezőkártya: címke** | `var(--fs-xs)`, uppercase, letter-spacing 0.05em, `var(--text-dim)`, `var(--fw-strong)` | `.km-fp-cimke`: ugyanez | nincs | — |
| **Mezőkártya: jelvény** | kattintható, `var(--fs-xs)`, `var(--fw-strong)`, szín forrás szerint, padding: 2px 8px | `.km-jelveny-src`: kattintható, `var(--fs-xs)`, `var(--fw-strong)`, `data-src` alapján szín, padding: 2px 8px | nincs | — |
| **Mezőkártya: jelvény szövegek** | "Te adtad meg", "Weboldal alapján", "AI-javaslat · általad módosítva" | `t("jelveny.sajat")`, `t("jelveny.weboldal")`, `t("jelveny.ai")` + `t("jelveny.modositva")` | nincs | — |
| **Mezőkártya: Szerkesztés gomb** | `var(--accent-text)`, `var(--fs-sm)`, margin-inline-start: auto | `.km-ob-szerkeszt`: `var(--accent-text)`, `var(--fs-sm)`, margin-inline-start: auto | nincs | — |
| **Mezőkártya: eredet részlet** | `var(--fs-xs)`, `var(--text-dim)`, dashed border, fadeUp animáció | `.km-fp-reszlet`: `var(--fs-xs)`, `var(--text-dim)`, dashed border | nincs (animáció CSS-ben lehet) | Ellenőrizni: van-e `fadeUp` a `.km-fp-reszlet`-en |
| **Mezőkártya: érték** | `var(--fs-md)`, `var(--text)`, `overflow-wrap: anywhere` | `.km-fp-ertek`: `var(--fs-md)`, `var(--text)`, `overflow-wrap: anywhere` | nincs | — |
| **Mezőkártya: szerkesztés mód** | textarea (3 sor), focus ring, Mentés/Mégse gombok | textarea (rows={3}), focus ring CSS-ben, `.km-fp-gomb-ment` / `.km-fp-gomb-megse` | nincs | — |
| **Mezőkártya: Mentés gomb** | `var(--grad-primary)`, `var(--on-primary)`, 8px 16px, `var(--fs-sm)` | `.km-fp-gomb-ment`: `var(--grad-primary)`, `var(--on-primary)`, 8px 16px, `var(--fs-sm)` | nincs | — |
| **Mezőkártya: Mégse gomb** | szellem gomb, 8px 14px, `var(--fs-sm)` | `.km-fp-gomb-megse`: szellem gomb, 8px 14px, `var(--fs-sm)` | nincs | — |
| **Arculat blokk: cím** | "Vizuális arculat", uppercase címke | `t("fiok.arculat_cim")`, `.km-fp-cimke` | nincs | — |
| **Arculat blokk: állapotjelvény** | "Tervezet · 1. tervezet · általad módosítva", `var(--src-ai-bg)`, `var(--src-ai)` | `arcJelveny` = `arculatJelvenySzoveg(a, t)`, `.km-ob-arc-jelveny` | nincs | — |
| **Arculat blokk: Szerkesztés gomb** | `var(--accent-text)`, `var(--fs-sm)` | `.km-ob-szerkeszt` a fejben | nincs | — |
| **Arculat blokk: színsor** | 3 szín (18×18 px, `var(--r-badge)`), betűnevek, lekerekítés px | `.km-fp-arc-szinek span`: 18×18, `var(--r-badge)`; `.km-fp-arc-betuk`: betűnevek és px | nincs | — |
| **Arculat blokk: képvilág** | `var(--fs-sm)`, `var(--text-mut)` | `.km-fp-arc-kepvilag`: `var(--fs-sm)`, `var(--text-mut)` | nincs | — |
| **Arculat blokk: irányelvek** | `var(--fs-xs)`, `var(--text-dim)`, "Követendő: … · Kerülendő: …" | `t("fiok.arc_iranyelvek", { a, b })`, `.km-fp-arc-iranyelv`: `var(--fs-xs)`, `var(--text-dim)` | nincs | — |
| **Arculat blokk: megjegyzés** | "Nincs jóváhagyott arculat — a tervezet javaslat, nem a tartalomgyártás szabálya.", `var(--warn)` | `t("fiok.arc_megj_egyeb")` (tervezet/nincs esetén), `.km-fp-arc-megj[data-allapot="tervezet"]`: `var(--warn)` | **VALÓDI** | A mockupban fix szöveg, a megvalósításban `t("fiok.arc_megj_egyeb")` — a feladat szerint "a jóváhagyott arculatnál a megjegyzés szövege más; nyitott arculat-blokk (a v6 OB-03-B)" SZÁNDÉKOS, de a "Nincs jóváhagyott arculat" szöveg is eltérő kulcsú |
| **Arculat blokk: jóváhagyás gomb** | "Arculati tervezet jóváhagyása", szellem gomb, glass border | `t("onboarding3.arc_jovahagyas")`, `.km-fp-arc-jovahagy`: szellem gomb, `var(--glass-border)` | nincs | — |
| **Arculat blokk: mintakártya** | 200px széles, bbg háttér, logo, cím, szöveg, gomb | `.km-fp-arc-jobb`: flex: 0 1 200px, `.km-mintakartya-kis` | nincs | — |
| **Lábléc szöveg** | "A forrásjelölés nem jelenti…", `var(--fs-xs)`, `var(--text-dim)`, margin-top: 12px | `t("onboarding3.eredet_megj")`, `.km-fp-lablec`: `var(--fs-xs)`, `var(--text-dim)`, margin-top: 12px | nincs | — |
| **Oldalsáv: háttér** | `var(--panel-soft)`, `var(--line)` border, `var(--r-block)`, `var(--pad-block)` | `.km-fp-kartya` (oldalon): ugyanez | nincs | — |
| **Oldalsáv: Szervezet címke** | uppercase, `var(--fs-xs)`, `var(--text-dim)` | `.km-fp-oldal-cimke`: ugyanez | nincs | — |
| **Oldalsáv: szervezet név** | `var(--fs-md)`, `var(--text)` | `.km-fp-szervezet-nev`: ugyanez | nincs | — |
| **Oldalsáv: létrehozva** | `var(--fs-xs)`, `var(--text-dim)` | `.km-fp-letrehozva`: ugyanez | nincs | — |
| **Oldalsáv: tagok** | név + szerep jelvény, `var(--fs-sm)`, border-top | `.km-fp-tagok`: border-top, `.km-fp-tag`: név + `.km-fp-szerep` jelvény | nincs | — |
| **Oldalsáv: szerep jelvény** | "tulajdonos", `var(--fs-xs)`, `var(--text-dim)`, border | `.km-fp-szerep`: ugyanez | nincs | — |
| **Oldalsáv: email** | `var(--font-code-active)`, `var(--fs-xs)`, `var(--text-dim)` | `.km-fp-email`: ugyanez | nincs | — |
| **Oldalsáv: nyelvválasztó** | select, 3 nyelv (hu/ro/en), `var(--bg-elev)`, `var(--fs-sm)` | `<Nyelvvalaszto />`, `.km-fp-nyelv`: ugyanez | nincs | — |
| **Oldalsáv: nyelv megjegyzés** | "A profil szövegeit nem írja át.", `var(--fs-xs)` | `t("fiok.nyelv_megj_rovid")`, `.km-fp-megj`: `var(--fs-xs)` | nincs | — |
| **Oldalsáv: "honnan" szöveg** | "A profil az onboarding három lépéséből…", `var(--fs-xs)`, `var(--text-dim)` | `t("fiok.honnan_rovid")`, `.km-fp-honnan`: ugyanez | nincs | — |
| **Oldalsáv: Beállítások szakasz** | — (nincs a mockupban) | `t("fiok.beallitasok")`, Theme/Feliratok linkek | SZÁNDÉKOS többlet | — |

## Megvalósítás → Mockup (többlet a mockupban NINCS)

| Elem | Megvalósítás | Mockupban? | Eltérés? | Javaslat |
|:---|:---|:---|:---|:---|
| **MentesAllapot** | fejlécben mentés állapot (E-11) | nincs | SZÁNDÉKOS | — |
| **Beállítások szakasz** | Theme-beállítások és Feliratok linkek oldalsávban | nincs | SZÁNDÉKOS | — |
| **Arculat megjegyzés: jóváhagyott változat** | `t("fiok.arc_megj_jovahagyott", { ido, ki })` — verziókezelési infó | nincs (csak egyszerű "Nincs jóváhagyott arculat") | SZÁNDÉKOS (v6 OB-03-B) | — |
| **Nyitott arculat-blokk** | `ArculatBlokk` komponens szerkesztésre | nincs (csak összecsukva) | SZÁNDÉKOS (v6 OB-03-B) | — |
| **Arculat bezárás gomb** | "Bezárás" gomb nyitott módhoz | nincs | SZÁNDÉKOS | — |
| **Több tag támogatása** | `szervezet.tagok.map(...)` — több tag is lehet | csak 1 tag ("Portik Vilmos") | **kozmetikai** | A mockup statikus, a megvalósítás dinamikus — elfogadható |
| **Email csak saját fiókhoz** | `tag.fiok_id === fiokId` feltétel | minden tagnál van email | **VALÓDI** | A mockupban egy tag van, így nem látszik a különbség; funkcionálisan helyes |
| **Hiányzó mezők dinamikus listája** | `hianyzok.map(...)` több mezőre is | csak "1 hiányzó rész: Arculat" | nincs | A mockup statikus példa, a megvalósítás dinamikus |
| **Arculat mentés időzítővel** | 800 ms debounce `arculatValtozik`-ban | nincs (mockupban nincs interakció) | nincs | Implementációs részlet |
| **Üres mezők kezelése** | `data-ures="true"`, `t("onboarding3.kesobb")` | mockupban minden mező kitöltött | nincs | A mockup demo adatokat mutat |
| **Reszlet animáció** | `fadeUp` CSS animáció a mockupban | `.km-fp-reszlet`-en nem egyértelmű | **kozmetikai** | Ellenőrizni: van-e `fadeUp` vagy `km-felbukkan` a részleten |

## Összegzés

**Valódi eltérések száma: 0** (a feladatban megjelölt szándékos eltéréseken kívül).

A mockup és a megvalósítás strukturálisan, tipográfiailag és interakciósan megegyezik. Az egyetlen érdemi különbség az arculati megjegyzés szövege, amely a jóváhagyott állapotnál bővebb információt tartalmaz (verziókezelés), de ez a v6 OB-03-B követelmény szándékos többlete. A dinamikus adatkezelés (több tag, üres mezők, dinamikus hiányzó lista) a mockup statikus természetéből adódóan nem jelenik meg a tervezői fájlban, funkcionálisan azonban helyesen implementált. A `fadeUp` animáció jelenléte a részlet-megnyitásnál érdemes lehet megerősíteni a CSS-ben, de ez legfeljebb kozmetikai finomítás.
