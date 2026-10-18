# Rajz-feladat a Claude Designnak — R-0 · Térköz-skála

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba.
Ami hiányzik vagy gyanús: kérdés Vilmoshoz, nem improvizáció.

**Ez a feladat megelőzi az összes többit.** Az R-1 javítóköre és az R-2…R-6 rajzai erre épülnek.
Amíg ez nincs meg, a többi rajz pixelben írná a térközt, és később kétszer kellene rajzolni.

---

## 1. Miért kell ez most

A rendszerben ma **53 token** van: elnevezett értékek, amiket a Theme-beállítások lapról lehet
állítani, és amitől minden oldal egyszerre változik. A szín, a betű, a betűméret és a lekerekítés
hibátlanul ebből dolgozik — ezt megmértük az R-1 rajzán: **0 beégetett szín, 0 betű, 0 betűméret,
0 lekerekítés.**

A **térköz** viszont nem token. Az, hogy mekkora a levegő két csempe között, vagy mennyi hely van
egy kártyán belül, ma fix pixelszámként áll a stíluslapokban — tehát a felület sűrűségét nem
lehet a Theme lapról állítani, csak kódból.

**Vilmos döntése (2026-09-11): ez megváltozik, és nem csak az új lapokon — a meglévőkön is.**
Az indok az ő szava: *„ezernyi új oldal lesz, és akkor már nem fogjuk tudni javítani."*

## 2. A mérés — ez nem becslés

Megmértem a meglévő stíluslapokat és az R-1 rajzát. Az adat a **2026-09-01-i mappamásolatból**
származik (a kód gyökere a GitHub; a másolat tíz napos, tehát a számok nagyságrendre pontosak,
utolsó egységre nem).

| Honnan | Pixelben írt térköz-érték |
|---|---|
| `_kozos/fiok.css` | 211 |
| `tema/tema.css` | 66 |
| `hirfigyelo/attekintes.css` | 62 |
| `hirfigyelo/finomhangolas.css` | 51 |
| `hirfigyelo/beallitas.css` | 46 |
| `feliratok/feliratok.css` | 37 |
| `hirfigyelo/_kozos/hirfigyelo.css` | 18 |
| **az R-1 rajza** | 380 |
| **Összesen** | **1021 darab szám, 37 különböző értékben** |

A 37 érték eloszlása nem véletlenszerű — néhány érték viszi a tömeget:

| px | hányszor | | px | hányszor |
|---|---|---|---|---|
| 8 | 198 | | 16 | 51 |
| 10 | 143 | | 9 | 50 |
| 12 | 90 | | 2 | 48 |
| 14 | 90 | | 24 | 31 |
| 4 | 61 | | 3 | 19 |
| 7 | 56 | | 18 | 18 |
| 6 | 54 | | 20, 22 | 13–13 |

A többi 20 érték együtt is kevesebb, mint 60 előfordulás.

## 3. Mit kérek — egy zárt lépcső

Nem 37 új token kell. Egy **rövid, zárt skála**, amiből minden térköz kikerül, és amin kívül
nincs más érték.

### 3.1 Kiindulási javaslat — mérésből, nem ízlésből

```
0 · 2 · 4 · 6 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 32 · 40 · 56 · 80
```

Ezt a lépcsőt a fenti eloszlásra illesztettem, és **megmértem, mibe kerülne az átállás**:

| Mi történik a meglévő értékkel | Hány helyen |
|---|---|
| pontosan a skálára esik, nem változik semmi | **790** |
| 1 pixelt mozdul — szabad szemmel nem látszik | 179 |
| 2 pixelt mozdul | 34 |
| **2 pixelnél többet mozdul — ezt meg kell nézni** | **18** |

A 18 hely mind nagy térköz: 90→80, 70→80, 64→56, 60→56, 48→40, 36→32, 28→24.

**Ez a lényeg: az átállás 96%-ban nem változtat semmit a képernyőn.** A meglévő lapokat nem
rajzoljuk újra — csak a nevükön nevezzük az értékeket.

**A skála a tiéd:** ha más lépcsőt tartasz jobbnak, írd át — de akkor add vissza ugyanezt a négy
számot a te skáládra, hogy lássuk, mibe kerül.

### 3.2 Amit a skálának tudnia kell

- **Zárt legyen.** Ha egy elrendezéshez olyan érték kell, ami nincs a lépcsőn, az a lépcső hibája,
  nem kivétel. Kivételt nem rajzolunk.
- **Legyen benne a sűrű vég.** A 2 és a 8 közötti tartomány viszi a tömeget (jelvények, sorok,
  gombok belseje) — ott nem elég három fok.
- **A nagy vég lehet ritka.** 24 fölött összesen 20 előfordulás van; oda elég néhány fok.
- **Legfeljebb 16 fok.** Ennél több már nem skála, hanem lista.

## 4. Nevek

Ma a térköz-tokenek angolosan hívják magukat (`--gap`, `--pad-card`, `--pad-block`).
A skála fokainak **önálló, sorszámozott nevet** kérek, például `--ter-0` … `--ter-13` —
mert a fok maga nem tudja, mire használják. **A nevezéktan a te javaslatod**, de három feltétel:

1. a fok neve a **méretét** jelölje, ne a használatát
2. a mai nevek **ne szűnjenek meg**, hanem a skálára mutassanak
   (például `--gap: var(--ter-5)`) — így egy sor kód sem törik el
3. a név legyen rövid, mert 1021 helyen fog szerepelni

## 5. Amit NEM kell tokenizálni

- **alakértékek**: a 8 pixeles állapotpont, a 6 pixeles haladássáv, a 34×34-es színmező.
  Ezek nem térközök, hanem magának az elemnek a mérete
- **keretvastagság** — arra már van `--bw`
- **lekerekítés** — arra már van `--r-*`
- **betűméret** — arra már van `--fs-*`
- **százalékok és `fr` értékek** a rácsban

## 6. Ami ettől a Theme-beállítások lapon változik

A lap ma 53 tokent mutat. Ezzel együtt **kb. 70 lesz.** Ennyi már csoportosítás nélkül nem
áttekinthető, tehát a lap maga is kap egy kis munkát:

- a térköz-skála **külön csoportban**, egymás alatt, a lépcső sorrendjében
- a fokok mellett **látszódjon a méretük** — ne csak a szám, hanem a köz maga, vonallal
- és látszódjon, hogy **melyik fokot hány helyen használjuk** — így nem hal el észrevétlenül egy fok

## 7. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | **A skála maga**: minden fok egymás alatt, névvel, pixelértékkel és a köz látható rajzával | asztali 1440 |
| 2 | **A skála munka közben**: egy csempe, egy űrlapsor és egy gombsor, a fokok megjelölve rajtuk | asztali 1440 |
| 3 | **Előtte–utána**: a legsűrűbb meglévő lap egy részlete a mai értékekkel és a skálára állítva, egymás mellett | asztali 1440 |
| 4 | **A Theme-beállítások lap térköz-csoportja**, a 6. pont szerint | asztali 1440 |
| 5 | A skála telefonon — mi változik, ha bármi | telefon 390 |

## 8. Kötelező szabályok a rajzhoz

- **Csak tokenből.** A skálán kívül semmilyen pixelérték nem maradhat a rajzon — se szín, se betű,
  se betűméret, se lekerekítés, se térköz. Ez a rajz épp erről szól.
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven: magyar, román, angol.
  Az alapnyelv az angol.
- **Sötét felület** — a világos változat a tokenekből jön.
- **Halott vezérlő tilos.**
- **A megerősítő sáv a képernyő aljára rögzüljön**, ne a kártya aljára (E-50 tanulsága).

## 9. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **a skála táblázata**: fok · név · pixelérték · mire való
- **az átállási kulcs**: minden mai érték (1-től 90-ig, mind a 37) → melyik fokra megy.
  Ez az, amiből a kód átírása gépies munka lesz, nem ítélkezés
- **külön lista arról, hol változik a kép 2 pixelnél többet** — a 18 hely, névvel
- **mely mai tokenek hogyan mutatnak a skálára** (`--gap`, `--pad-card`, `--pad-block`,
  `--pad-field-y`, `--pad-field-x`, `--btn-pad-y`, `--btn-pad-x`)
- minden szöveg kulccsal, három nyelven

## 10. A csomag — ez a rész is szabály

Az R-1 átadójából három dolog hiányzott; ne ismétlődjön:

1. **Egy rajzfájl legyen, és az legyen megnevezve.** Ha a szerkeszthető vászon-forrás és a
   statikus változat is kell, mindkettő mehet, de az `ATADO.md` mondja meg, **melyik a hiteles**,
   és melyik az, amelyik **hálózat nélkül is megjelenik**.
2. **Minden látható szöveg szerepeljen a `feliratok.json`-ban**, három nyelven. Az R-1-nél három
   kulcs kimaradt.
3. **A csomagba a feladatlap aznapi, végleges változata kerüljön.** Az R-1-nél az első változat
   ment el, és emiatt a Design három olyan dolgot jelölt eltérésként, ami valójában előírás volt.

A zip szerkezete változatlan:
`rajz/` · `ATADO.md` · `feliratok.json` · `tokenek.md` · `adatkotes.md` · `kerdesek.md` ·
`FELADATLAP.md`, a zip neve `r0-terkoz-skala-atado.zip`, a helye
`SaaS\design\r0-terkoz-skala\atado\`.
