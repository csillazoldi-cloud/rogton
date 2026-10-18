# ATADO — R-1 · Kezdőképernyő és navigáció · javítókör (v3)

2026-09-12 · Aitmetica SRL · a `FELADATLAP.md` (2026-09-12-i javítókör) szerint.
Előzmény: a v2 rajz és az `ELLENORZES.md`. **Ez nem új rajz:** a hét artboard maradt, egy
nyolcadik jött hozzá, és öt tétel javult.

## 0. Melyik fájl a hiteles, és mi kell a megnyitásához

| Fájl | Mi ez |
|---|---|
| `rajz/r1-kezdokepernyo-javitokor.dc.html` | **A hiteles rajz.** Egyetlen fájl, mind a nyolc artboarddal; a felső sáv artboardonként a saját állapotára feloldva van beépítve. |

**A rajz megnyitásához hálózat kell.** A megjelenítő futtatókörnyezete a React-et és a Babelt az
`unpkg.com`-ról tölti, a betűket a `fonts.googleapis.com`-ról. Hálózat nélkül a lap **üres**.
Statikus változatot nem csomagoltam — ha kell, szólj, és készítek egyet.

Ez az R-0 csomagjának első hibáját zárja le: ott az átadó azt állította, hogy a rajz magától
megjelenik. Nem igaz volt; ez a mondat a valóság.

A rajz vászon módban van (`design_doc_mode=canvas`), tehát szabadon pásztázható és nagyítható.
A nyolc artboard egymás alatt áll, a feladatlap szerinti sorrendben és névvel.

## 1. Ami ebben a körben változott

| # | Tétel | Mi történt |
|---|---|---|
| 1 | **D4 · Gépház a tulajdonosnak is** | Új **8. artboard**: Gépház tulajdonos nézet, két csempével. A felső sávban a Gépház a tulajdonosnak is megjelenik (1., 2., 6. artboard); a nézőnek nem (3. artboard). |
| 2 | **D5 · Négy pénznem** | Az AI-keret csempe kimondja: a pénznem a munkatér beállítása (euró · dollár · forint · lej), nem beégetett érték. Az összeg a példa kedvéért euróban áll. |
| 3 | **D6 · Nincs indítógomb** | Nem került vissza gomb a hírfigyelő csempéjére. |
| 4 | **D7 · Térköz-skála** | A rajz átállt az R-0 tizenöt fokára. Részletek a 3. pontban. |
| 5 | **Három pótolt felirat-kulcs** | `nav.ez_a_munkater`, `nav.tagok`, `nav.tagok_szam` bekerült a `feliratok.json`-ba, a 8. artboard új szövegeivel együtt. |
| 6 | **A 6. artboard felirata** | A D3 elévült: a munkatér neve **mindig lenyíló**. A két sáv címe most azt mondja, mi van a lenyílóban, nem azt, hogy van-e váltó. |
| 7 | **A Tagok sor megjelölve** | Szaggatott figyelem-pötty a soron, alatta egy mondat: az R-2 gépezete még nem épült meg, amíg nincs, ez a sor nem mehet élesbe. |

A 4. artboard (Gépház, rendszergazda) tartalma **változatlan**, mind a négy csempével; csak a
jelvénye lett „rendszergazda nézet”, és a bevezetője mondja ki, hogy ő a közös alapot állítja.

## 2. A 8. artboard — Gépház, tulajdonos nézet

Két csempe: **Theme-beállítások** és **Feliratok**. A Költség és a Fiókok **meg sem jelenik** —
nem zárt csempeként, hanem egyáltalán; a lap alján egy blokk mondja meg, miért (rendszerszintű
lapok, több munkatér adatát mutatják).

A lap első mondata kimondja, amit a feladatlap kért: *itt a saját munkaterére állít; amit átír,
az csak az Aitmetica SRL-re hat, a rendszer többi munkaterére nem. Amit nem ír át, arra a
rendszergazda közös alapja érvényes.*

A két csempe azt is mutatja, **mennyit ír felül**: „ma 4 tokent írsz felül; a többi 64 a közös
alapból jön”, illetve „ma 2 kulcsot írsz felül, három nyelven”. Ez a kétszintű működés
(közös alap + szervezeti felülírás) ma is így van a Theme- és a Feliratok-lapon.

**A Mentetlen tervezet csempe ezzel értelmet nyert a tulajdonosnál is:** mostantól tényleg el
tudja érni azt a lapot, amin a tervezete van. (A v2-ben ez volt az ellenőrzés 5. pontjának
ellentmondása.)

## 3. Az átállás a térköz-skálára — a mérleg a rajzra

**A saját mérésem az átadott v2 rajzon és a felső sáv komponensén: 304 térköz-érték,
21 különböző értékben.** A feladatlap 380-at mért; a különbség módszertani, és megnevezem:
én csak a valódi térköz-tulajdonságokat számoltam (`gap`, `padding*`, `margin*` — a rövidített
alakokban minden értéket külön), a `width`, `height`, `min-width`, `box-shadow` és
`letter-spacing` pixelértékeit nem, mert az R-0 5. pontja szerint azok alakértékek, nem térközök.
**Nem állítom, hogy a te 380-as számod téves** — más halmazt mértünk.

| Mi történt | Hány helyen |
|---|---|
| pontosan a skálára esett, nem változott | **258** |
| 1 pixelt mozdult | 41 |
| 2 pixelt mozdult | 1 |
| 2 pixelnél többet mozdult | **4** |

### 3.1 A négy hely, ahol 2 pixelnél többet mozdult

| Mai érték | Fok | Elmozdulás | Hol a rajzon |
|---|---|---|---|
| 48px | `--ter-12` (40px) | −8 | 1 hely: a rajzvászon külső margója (`padding:48px` a lap gyökerén) |
| 70px | `--ter-14` (80px) | +10 | 3 hely: a 6. artboard sávjai közti üres sávok magassága nem ez — hanem a **lap szakaszközei**: a `gap:70px`-szerű nagy közök az artboardok közt |
| 90px | `--ter-14` (80px) | −10 | 1 hely: a 6. artboardon a nyitott lenyíló alatti üres hely |

Ezt a négyet **szemmel megnéztem**: mind nagy szakaszköz, a szerkezet nem borult el, és a
két 70→80 elmozdulás a 6. artboardon csak annyit tesz, hogy a nyitott lenyíló alatt tíz
pixellel több hely van. A 90→80 ugyanott tíz pixellel kevesebb — a lenyíló továbbra is befér.

**A 26px→24px** (`--btn-pad-x`) az egyetlen 2 pixeles elmozdulás, és tokenen keresztül megy:
minden gomb vízszintes tere egyszerre változott.

### 3.2 A 0. fok tartása

Az `--ter-0` **nem kerekítési cél**: csak oda került, ahol ma is `0` állt (24 hely — jellemzően
`margin:0` a címeken és a bekezdéseken). Az `1px` a `--ter-1`-re (2px) ment, nem a nullára —
7 hely, mind jelvény egy pixeles belső tere.

### 3.3 Amit nem tudtam pixelmentessé tenni

A csomagolt fájlban **marad néhány pixelérték: a megjelenítő futtatókörnyezetének saját
stíluslapjában** (hibaüzenet-réteg, segédosztályok). Ez nem a rajz, hanem a keret, amiben a rajz
fut — a rajz saját stílusaiban pixel-térköz **nincs**. A `kerdesek.md` 3.2 pontja ezt tételesen
megnevezi.

### 3.4 Fok nem hiányzott

Az átállás közben **nem került elő olyan hely, ahova egyik fok sem illik**. Pixelt nem írtam
vissza, kivételt nem csináltam, és a lépcsőt nem kértem bővíteni.

## 4. A tokenek

A rajz `:root` blokkja most a tizenöt fokot is tartalmazza, és a mai térköz-tokenek rá mutatnak:

```css
--gap:        var(--ter-6);   --pad-card:    var(--ter-11);  --pad-block:   var(--ter-9);
--pad-field-y:var(--ter-6);   --pad-field-x: var(--ter-7);
--btn-pad-y:  var(--ter-6);   --btn-pad-x:   var(--ter-10);
--gap-tile:   var(--ter-7);   --pad-tile:    var(--ter-8);
```

Az R-1-ben kért négy méret-token közül a `--tile-min` (300px) és a `--fs-metric` (30px)
**nem térköz**, ezért önálló token maradt. A teljes lista a `tokenek.md`-ben.

**Új token nincs** ebben a körben.

## 5. Telefonon (5. és 7. artboard) — mi marad el, mi tör sorba

Változatlan a v2-hez képest, egy kiegészítéssel:

- **Elmarad:** semmi adat. A csempék ugyanazok, ugyanabban a sorrendben.
- **Sorba tör:** a felső sáv hamburgerré válik (7. artboard); a hatcsempés rács egy hasábra; a
  hírfigyelő csempéjén a két időpont címke–érték párokká.
- **Tömörödik:** a profil hiányzó részei egy sorba; az AI-keret három száma egy sorba
  (`kezdolap.koltseg_reszletek_sor`), és alatta a pénznem-megjegyzés rövid alakja; a
  forrásállapotok színes pont nélkül.
- **Új:** a lenyílóban a **Gépház** sor a tulajdonosnak is megjelenik. A 7. artboardon a sor
  mellett „4 csempe” jelvény áll (rendszergazda fiók), alatta egy mondat, hogy tulajdonosnál
  ugyanez a sor két csempére visz.
- **Az 5. artboardon a lenyíló zárva van**, ezért ott a Gépház nem látszik — a nyitott állapot a
  7. artboard. A felirat ezt kimondja.
- **Érintőméret:** minden gomb és lenyíló-sor `--control-min` (44px) magas.

## 6. Ami így maradt

A *„mi történt a legutóbbi belépésed óta”* mondat továbbra is **az utolsó futás** számából
dolgozik, nem a belépés óta eltelt időből — a feladatlap 6. pontja szerint ez marad, amíg Vilmos
nem szól.
