# Ellenőrzés — R-1 · 2. javítókör (v4)

Kommunikációs munkatér · Aitmetica SRL · 2026-09-12 21:50 · mérve az `atado-3/` csomagon (a zip neve „Onboarding felület prototípus5" volt — a
tartalma az R-1 v4). Minden szám alább mérés (python a `feliratok.json`-on és a `.dc.html` törzsén; a `_artboardok.mjs` a képekhez).

## 1. Összegzés

**Mind a három kért tétel elkészült, a csomag hibátlan.** Új token nincs, pixel-térköz nincs, minden új szöveg kulccsal, a négy pénznem-kulcs
szó szerint a feladatlap táblázatából.

## 2. A mérés

| Mit | Eredmény |
|---|---|
| Artboardok | **10/10** (01–08 a v3-ból, új: 09 Ügyfélprofil a sávval, 10 Hírfigyelő Áttekintés a sávval) |
| Pixelben írt térköz a rajz törzsében (`margin`, `padding`, `gap`) | **0** |
| Feliratkulcsok | 97 → **106**; hiányzó a v3-hoz képest: **0**; megváltozott: **0**; új: **9** — pontosan a kértek |
| A négy pénznem-kulcs | `penznem.EUR/USD/HUF/RON` = euró/dollár/forint/lej (ro: euro/dolar/forint/leu; en: euro/dollar/forint/leu) — **egyezik a rendszerrel** (0051) |
| Kulcs a rajzon, ami nincs a JSON-ban | csak a `rajz.*` jegyzetek (7 db) — ezek a rajzlap magyarázatai, nem a termék szövegei |
| A csomagba tett feladatlap | azonos a küldöttel (`JAVITOKOR-2-FELADAT.md`) |
| Hálózat | az átadó kimondja (unpkg) — igaz |

## 3. Tételről tételre

| # | Tétel | Állapot |
|---|---|---|
| 1 | **Pénznem-vezérlő** a 8. artboardon: harmadik „Munkatér" csempe, lenyíló zárt és nyitott állapotban, `--control-min-s` magasság; a 4. artboardon nincs, és ez ki van írva | kész, a feladatlap szerint |
| 2 | **Felső sáv a régi lapokon**: 09 (Ügyfélprofil — a mentés-állapot a lapcím mellett), 10 (Hírfigyelő — a sáv alatt a modul fülsora, a „7 új" a fülsor végén; a „vissza a fiókhoz" és a modul saját nyelvválasztója elmarad). **A rajz döntött:** a Theme/Feliratok/Költség/Fiókok lapról a négylapos rendszergazda-váltó elmarad, a Gépház ajtó viszi | kész; a döntést átveszem (D-F29) |
| 3 | **Részleges futás** sora: „Utolsó futás: {ido} · az értékelés függőben" a sikeres sor helyén (1., 3., 5., 10. artboard), semleges színnel (`--src-empty`), a forráshiba marad figyelmeztető | kész |

## 4. Amit a Design javított, kérés nélkül (ATADO 3b)

A nyitott lenyíló a folyamatba került (nem fed el semmit); a 2. artboard gombja 68 → 44 px; a 6. artboard lebegő lenyílói nem lógnak ki. Mind a
három javulás; egyik sem érinti a megépült képernyőt hátrányosan (a 2. artboard gombmagassága nálunk eleve `--control-min`).

## 5. A Design kérdései (kerdesek.md) — a válaszok

| # | Kérdés | Válasz |
|---|---|---|
| 1 | Hónap közben váltott pénznem: a hónap addigi költsége is az új árfolyammal számol át? | **Igen** — a mért egység az USD, az átszámítás megjelenítés: a csempe mindig a mai tárolt árfolyammal mutatja (D-F22). Egy hónapon belül tehát a pénznem váltása minden összeget egyszerre vált. Nem kell rajz. |
| 2 | Rendszergazda Költség csempe: eltérő pénznemű munkaterek összesítése? | Ma a rendszergazda **aktuális munkaterének** pénznemében (a `gephazNezet` így számol); a Költség lap feladatlapjára tartozik, ott dől el. |
| 3 | Részleges letöltés + függő értékelés egyszerre: gyakori? | Lehet (a teszten ma 1 forrás hibás + értékelés függőben egyszerre előfordult). Három jelzés egymás mellett marad; összevont mondat, ha zavarónak bizonyul — TEENDŐ. |
| 4 | Mentés-állapot a Theme/Feliratok eszközsorában marad? | **Igen**, marad — azok a lapok külön kört kapnak, ha egységesítünk. |

## 6. Javaslat

**Beépíthető.** Az F-2d lépés: a pénznem-vezérlő a Gépház tulajdonos nézetére, a felső sáv az Ügyfélprofil, a Hírfigyelő három lapja és a négy
rendszergazda-lap tetejére (a rendszergazda-váltó elhagyásával), a részleges futás sora a hírfigyelő csempén — 9 új felirat migrációval (0053).
