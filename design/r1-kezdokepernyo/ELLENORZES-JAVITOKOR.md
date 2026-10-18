# Ellenőrzés — R-1 · javítókör (v3)

Kommunikációs munkatér · Aitmetica SRL · 2026-09-12
Mérve a csomag tartalmán. Minden szám alább **mérés**.

---

## 1. Összegzés

**Mind az öt tétel elkészült, és a csomag most hibátlan.** Először fordul elő, hogy az
ellenőrzés nem talál hibát — se valótlan állítást, se hiányzó feliratot, se beégetett értéket.

## 2. A mérés

| Mit | Eredmény |
|---|---|
| Artboardok | **8/8**, köztük az új *Gépház — tulajdonos nézet* |
| **Pixelben írt térköz a rajzban** | **0** (a v2-ben 380 volt) |
| `var(--ter-*)` használat | **468 helyen** |
| Beégetett HEX / `rgb()` | 0 / 0 |
| Beégetett betűméret / lekerekítés | 0 / 0 |
| Felirat-kulcsok | 98, **mind a három nyelven hiánytalan** |
| Kulcs a rajzon, ami hiányzik a JSON-ból | **0** (a v2-ben 3 volt) |
| A csomagba tett feladatlap | **azonos** az általam küldöttel |
| A hálózat kérdése | az átadó **kimondja**, hogy hálózat kell — ez most igaz |

## 3. Tételről tételre

| # | Tétel | Állapot |
|---|---|---|
| 1 | **D4 · Gépház a tulajdonosnak is** | kész. A 8. artboard két csempével; a 4. artboard változatlanul négy csempe, de „rendszergazda nézet" jelvénnyel. A 8. artboard kimondja, hogy a tulajdonos a saját munkaterére állít, és külön dobozban azt is, **mi nincs ott és miért** |
| 2 | **Térköz-skála** | kész, ez a kör legnagyobb tétele: 380 pixelértékből 0 maradt |
| 3 | **Három felirat-kulcs** | pótolva, a 8. artboard szövegeivel együtt |
| 4 | **A 6. artboard felirata** | javítva: a két sáv címe most azt mondja, **mi van** a lenyílóban, nem azt, hogy van-e váltó |
| 5 | **Csomagolás** | javítva. Egy megnevezett rajzfájl, és az átadó kimondja: hálózat nélkül a lap üres |

Ezen felül a **négy pénznem** bekerült (a csempe kimondja, hogy a pénznem munkatér-beállítás),
az **indítógomb nem került vissza**, és a **Tagok sor meg van jelölve** azzal, hogy az R-2
gépezete még nincs meg.

## 4. Egy eltérés a számokban — nem hiba

A feladatlapban 380 pixelben írt térközt mértem a v2 rajzon, a Design 304-et. **Más halmazt
mértünk:** ő csak a valódi térköz-tulajdonságokat, én a megjelenített fájlt, amelyben a felső
sáv artboardonként ismétlődik. Egyik szám sem téves, és az eredményen nem változtat: a
mai rajzban **nulla** pixel-térköz van, bármelyik halmazzal mérve.

A Design ezt maga jelezte, és a saját mérlegét a saját halmazára adta meg. Ez a helyes eljárás.

## 5. Ami döntést kér

Négy nyitott kérdés maradt, mind apró:

| # | Mi | Javaslatom |
|---|---|---|
| 1 | **A szerkesztő lássa-e a Gépházat?** A rajzon ma látja (mindenki, aki nem néző). A D4 viszont csak a tulajdonosról döntött | **csak a tulajdonos** — a Theme- és felirat-felülírás szervezeti döntés, nem napi munka |
| 2 | **A Tagok sor** amíg az R-2 gépezete nincs meg: ne látszódjon, vagy látszódjon zárva | **ne látszódjon** élesben; a rajzon maradjon, megjelölve |
| 3 | **A pénznem a rajzon** euróban áll. Lejre írjuk? | maradjon euró a rajzon; a valódi érték amúgy is munkatér-beállítás |
| 4 | **A „4 tokent írsz felül" szám** a 8. artboard csempéin | maradjon — ez mondja meg a tulajdonosnak, mennyit tér el a közös alaptól |

És egy apróság: a Design felajánlotta, hogy az 5. artboardot nyitott lenyílóval is megrajzolja.
**Nem kell** — a nyitott állapot a 7. artboardon látszik, és a felirat odautal.

## 6. A javaslatom

**Ez a rajz jóváhagyható.** A négy kérdés közül egyik sem igényel újrarajzolást: az 1-es és a
2-es egy kapcsoló a rajzban, a 3-as és a 4-es pedig maradhat úgy, ahogy van.

Ha az 1-esre és a 2-esre igent mondasz, azok egyetlen rövid üzenetben mehetnek a Designhoz —
vagy akár a következő rajz (R-2) feladatlapjába is beépíthetők, mert a Tagok sor amúgy is oda
tartozik.
