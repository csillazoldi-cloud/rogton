# Kérdések és eltérések — R-1 · Kezdőképernyő és navigáció

Ide az kerül, amit nem döntöttem el magamtól, és minden pont, ahol a rajz eltér a feladatlaptól.

## 1. Eltérések a feladatlaptól

### 1.1 A 4. artboard neve: „Kezdőképernyő — rendszergazda” helyett **Gépház**

A feladatlap 8. pontja szerint a 4. artboard *„Kezdőképernyő — rendszergazda (a rendszerszintű
csempékkel)”*. A 10. pont viszont azt kéri, hogy a rendszergazda csempéi **külön, elkülönített
sávban** legyenek — és a D1 döntés szerint a kezdőképernyő az ügyfélé, a négy rendszerszintű lap
pedig egy külön ajtó mögé kerül.

A kettő együtt azt adja, hogy a 4. artboard nem egy másik kezdőlap, hanem **maga az ajtó**:
a Gépház lapja, a négy rendszerszintű lap csempéivel. A rajzon a felirat mindkét nevet hordozza.
**Ha azt szeretnéd, hogy a rendszergazda kezdőlapja is meglegyen** — ugyanaz a hat ügyfélcsempe,
alatta egy elkülönített rendszersávval —, az egy nyolcadik artboard, és megrajzolom.

### 1.2 Az „AI összképe a találatokról” nem lett csempe

A feladatlap 4. pontja felsorolja: *„az AI összképe a találatokról, forráshivatkozással”*.
A D2 döntés viszont azt mondja, hogy a kezdőlap nem részletez: állapotot és számot mutat, és
továbbvisz. A kettő ütközik, és a döntést tartottam — az összkép a modul Áttekintés lapján marad.
**Ha kell a kezdőlapra, egy hetedik csempe lesz belőle**, a hírfigyelő csempe alatt.

### 1.3 A kézi indítás gombja nincs a hírfigyelő csempén

Az első körben kérted a csempére. Az 5. pont csempetartalma viszont nem tartalmazza —
csak azt, hogy a következő futás „kézi indítás”-e. Gombot ezért nem tettem rá: a kézi indítás
a modul Áttekintés lapján marad, ahol ma is van. **Egy szó, és visszateszem.**

## 2. Nyitott kérdések

### 2.1 A tulajdonos hogyan jut el a Theme- és a Feliratok-lapra?

A feladatlap 3. és 6. pontja szerint a Theme-beállítások és a Feliratok **a tulajdonosé is**.
A 7. pont (illetve a D1 döntés) szerint viszont a Gépház **csak rendszergazdának** látszik.
A rajz a Gépházat rendszergazdára szűkíti, így a tulajdonos sávjában ma nincs ajtó ezekre a
lapokra.

Három lehetőség, mindegyik egy sor a sávban:
1. a Gépház a tulajdonosnak is látszik, de benne csak a Theme és a Feliratok csempe;
2. a Theme és a Feliratok külön sor a sávban a tulajdonosnál;
3. marad úgy, ahogy van: a tulajdonos ezeket ma nem éri el a felületről.

**Ezt nem döntöttem el.**

### 2.2 A „Mentetlen tervezet” csempe a tulajdonosnál

A csempe a Theme- vagy a Feliratok-lap tervezetéről szól. Ha a 2.1 szerint a tulajdonos nem éri
el ezeket a lapokat, akkor nála a csempének sincs értelme — a rajz mégis a tulajdonos nézetében
mutatja (1. artboard), mert a 4. pont szerint ez az adat „rendszergazdának és tulajdonosnak”
látszik. A 2.1 döntése ezt is eldönti.

### 2.3 A munkaterenkénti költség a Gépházban

A Költség csempe három munkatér összegét mutatja, és egy összesített sort. A feladatlap csak
annyit mond: „munkaterenkénti költség”. Nem tudom, hány munkatér látszik a csempén, mielőtt a
lista rövidül — a rajz hármat mutat és összegez. **Ha a Gépházban mind a 12 kell, az lista lesz,
nem csempe.**

### 2.4 A „mi történt a legutóbbi belépésed óta” mondat alapja

A mondat az új találatok számát és az elakadt forrásokat mondja ki. Ehhez tudni kell, **mikor
volt a legutóbbi belépés** — ez az E-50 óta tárolva van, tehát megvan. Amit nem tudok: az „új
találat” számát a belépés óta, vagy az utolsó futás óta számoljuk-e. A rajz az utolsó futás
számát használja, mert az biztosan létezik. **Ha a belépés óta kell, az szűrés a találatokon.**

## 3. Amit nem tudtam megcsinálni

Nincs ilyen. Mind a hét artboard elkészült, a rajz egyetlen fájl, külső css, js és kép nélkül.

Két apróság, ami nem hiányzik, de érdemes tudni:
- **A betűkészlet a Google-tól jön** (`fonts.googleapis.com`). A csomagban lévő fájl ezt az
  egyetlen külső hivatkozást tartalmazza — ha a gép nincs hálózaton, a rajz a rendszer
  betűivel jelenik meg, a szerkezet változatlan. Beágyazni nem ágyaztam be, mert a betűfájlok
  a rajz méretét megtöbbszöröznék, és a valódi lapon is a Google-tól jönnek. Ez egyébként
  nyitott tétel az R-4 adatpolitika lapján is.
- **Kép nincs a rajzon.** A csempékhez nem kell, és a szabály szerint képet csak muszájból.
