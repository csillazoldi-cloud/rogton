# Ellenőrzés — R-1 · Kezdőképernyő és navigáció (Design átadó, v2)

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Mérve a `Design rendszer tokenei.zip` tartalmán. Minden alábbi szám **mérés**, nem olvasat:
a rajzfájlon futtatott keresés, illetve a rajz böngészőben megjelenített képe.

---

## 1. Összegzés

**A rajz átmegy.** A hét artboard megvan, a szerkezet és a szövegek rendben, a szín-, betű-,
betűméret- és lekerekítés-tokenizálás **hibátlan**. Négy javítandó pont van, egyik sem újrarajzolás.

## 2. Amit megmértem

| Mit | Eredmény |
|---|---|
| Artboardok száma és mérete | **7/7**, a feladatlap szerinti sorrendben és méretben (5× 1440, 2× 390) |
| Beégetett HEX szín | **0** |
| Beégetett `rgb()` / `rgba()` | **0** |
| Beégetett betűméret (`font-size: …px`) | **0** |
| Beégetett betűcsalád | **0** (mind `var(--font-…-active)`) |
| Beégetett lekerekítés (`border-radius: …px`) | **0** |
| Beégetett **térköz** (`gap`, `padding`, `margin` px-ben) | **274 előfordulás, 51 különböző érték** |
| Felirat-kulcs a rajzon | 88 egyedi, 210 előfordulás |
| `feliratok.json` kulcsai | 86, **mind a három nyelven hiánytalan** (en · hu · ro) |
| Kulcs a rajzon, ami hiányzik a JSON-ból | **3** (lásd 3.2) |
| Külső hivatkozás a statikus rajzfájlban | 1: Google Fonts (a betűkészlet) |
| Megjelenítés | böngészőben rendben, mind a hét artboard olvasható; telefonon egy hasáb |

## 3. A négy javítandó pont

### 3.1 A csomagban **két** rajzfájl van, és az ATADO a rosszat nevezi meg

| Fájl | Mi ez | Megnyitható-e magában |
|---|---|---|
| `r1-kezdokepernyo.dc.html` (152 KB) | a szerkeszthető vászon-forrás | **Nem.** A React, a ReactDOM és a Babel az `unpkg.com`-ról jön; háló nélkül üres lapot ad |
| `r1-kezdokepernyo-es-navigacio.dc.html` (86 KB) | statikus rajz | **Igen**, JavaScript nélkül is megjelenik |

Az ATADO.md az elsőt nevezi „egyetlen, önmagában megnyitható fájlnak" — ez nem áll.
**Kérés:** mondja meg, melyik a hiteles példány, és az ATADO nevezze azt meg.
A statikus változatot érdemes megtartani, mert az néz ki hálózat nélkül is.

### 3.2 Három látható szövegnek nincs felirat-kulcsa a `feliratok.json`-ban

`nav.ez_a_munkater` („Ez a munkatér") · `nav.tagok` („Tagok") · `nav.tagok_szam`
(„3 tag · 1 függő meghívó"). A rajzon ott a `data-fkulcs`, a fordítás viszont sehol — így
angolul és románul ma nem lenne meg. A többi 86 kulcs hiánytalan.

### 3.3 A térköz nincs tokenizálva, a `tokenek.md` mégis azt állítja, hogy igen

A `tokenek.md` első mondata: *„nincs beégetett szín, betű, betűméret, lekerekítés vagy térköz"*.
A szín, a betű, a betűméret és a lekerekítés valóban hibátlan — a **térköz** viszont 274 helyen
pixelben áll (`gap: 8px`, `padding: 8px 14px`, `gap: 10px` és további 48 érték).

Ez lehet, hogy rendben van — a meglévő lapok is így készültek —, de a rajz állítása és a rajz
tartalma nem fedi egymást, és ezt tudni kell, mielőtt kódba megy.

### 3.4 A munkatér neve minden artboardon lenyíló — a saját felirata szerint nem az

A 6. artboard „A · EGY MUNKATÉR" sávjának felirata: *„a név sima szöveg, váltó nélkül"*.
A megrajzolt elem viszont ott is **gomb, lefelé mutató nyíllal**. Mérve: a `nav.munkater_nev`
kulcsú elem mind a hét asztali sávban `<button>`, „Aitmetica SRL ▾" tartalommal.

Ez nem egyszerű hiba: **az R-2 pontosan ezt kérte** — a lenyíló mindig legyen ott, mert bekerül
a *Tagok* sor, és így egy munkatérnél sem üres. A rajz tehát az R-2 szerint helyes, csak a
felirat maradt a régi D3 szövegén. **Döntés kell: az R-1 D3 pontja az R-2 javára elévül-e.**

## 4. Amit a Design eltérésként jelölt, de valójában nem az

A csomagban lévő `FELADATLAP.md` a **feladatlap első változata**, a D1–D3 döntésekkel a végére
függesztve. A végleges változat (128 sor, a döntésekkel a 3. pontban) nem jutott el hozzá.
Ezért a `kerdesek.md` három „eltérése" a végleges feladatlaphoz mérve **nem eltérés**:

| A Design szerint eltérés | A végleges feladatlap szerint |
|---|---|
| A 4. artboard neve Gépház lett | A 8. pont **így írja elő**: „Gépház" |
| Az „AI összképe" nem lett csempe | Az 5. pont **nem tartalmazza** — helyesen maradt ki |
| A kézi indítás gombja lekerült a csempéről | Az 5. pont **nem tartalmazza** — helyesen maradt ki |

**Tanulság a következő körre:** a csomagba a végleges feladatlap kerüljön.

## 5. Egy valódi ellentmondás a feladatlapban — az enyém

A Design 2.1 kérdése jogos, és az én hibám: a végleges feladatlap **4. pontja** szerint a
Theme-beállítások és a Feliratok „a tulajdonosé is", a **7. pont** szerint viszont a Gépház
csak rendszergazdának látszik. A kettő együtt nem áll meg — a tulajdonosnak ma nincs ajtaja
ezekre a lapokra. Ezt Vilmosnak kell eldöntenie.

## 6. Két apróság, ami nem hiba, csak tisztázandó

- **Pénznem:** a rajzon az AI-keret **euróban** áll (18,40 € · 40,00 €-s keret). Az R-5-ben
  abból indultunk ki, hogy az AI-költség dollárban marad, mert a szolgáltató úgy számláz.
  Egy szót kérek: euró, dollár, vagy lej.
- **A „mi történt a legutóbbi belépésed óta" mondat** a rajzon az **utolsó futás** számából
  dolgozik, nem a belépés óta eltelt időből. A Design ezt kimondta. Ha tényleg a belépés óta
  kell, az szűrés a találatokon — egy sor gépezet.

## 7. Amit ez a rajz gépezetben megrendel

- a kezdőlap adatai (hat csempe összesítései egy lekérdezésben)
- a „mi történt a legutóbbi belépésed óta" mondat adata
- a Gépház lap, a négy rendszerszintű lap rövid állapotával
- **a Tagok sor** — ez az R-2 gépezete; amíg nincs meg, ez a sor nem kerülhet élesbe
- négy új token: `--gap-tile` · `--pad-tile` · `--tile-min` · `--fs-metric` (53 helyett 57)
