# Kérdések és eltérések — R-1 · javítókör

## 1. Eltérések a feladatlaptól

### 1.1 Az 5. artboardon a Gépház nem látszik — mert a lenyíló zárva van

A feladatlap 2. pontja azt kéri, hogy *„az 5. artboard (telefon) lenyílójába ugyanígy"* kerüljön
be a Gépház. Az 5. artboardon viszont a lenyíló **zárva** van: az a kezdőképernyő telefonon,
hamburger-gombbal. A nyitott lenyíló a **7. artboard** — oda került be a Gépház sor.

Az 5. artboard feliratában ezért ez áll: *„a lenyíló zárva; nyitva a 7. artboardon látszik,
benne a Gépházzal”*. Ha azt szeretnéd, hogy az 5. artboard is nyitott lenyílóval mutassa magát,
az egy nyolcadik–kilencedik változat, és megrajzolom.

### 1.2 A saját mérésem 304 térköz, nem 380

A feladatlap 380 pixelben írt térközt mért a rajzon, 20 különböző értékben; én 304-et találtam,
21 értékben. A különbség módszertani: **én csak a valódi térköz-tulajdonságokat számoltam**
(`gap`, `padding*`, `margin*`, minden értéket külön a rövidített alakokban). A `width`,
`height`, `min-width`, `box-shadow` és `letter-spacing` pixelértékeit nem, mert az R-0 5. pontja
szerint azok alakértékek.

**Nem állítom, hogy a 380 téves** — más halmazt mértünk. Az elmozdulások mérlege (258 / 41 / 1 / 4)
az én halmazomra érvényes, és az `ATADO.md` 3. pontja ezt kimondja.

### 1.3 A 4. artboard jelvénye „csak rendszergazda” helyett „rendszergazda nézet”

A D4 után a Gépház ajtaja a tulajdonosnak is látszik, tehát a „csak rendszergazda” felirat
valótlan lett volna. A 4. artboard mostantól a **rendszergazda nézete** (négy csempe), a 8. a
**tulajdonos nézete** (két csempe). A csempék tartalma nem változott.

## 2. Nyitott kérdések

### 2.1 A szerkesztő szerep Gépháza

A D4 a **tulajdonosról** dönt. A rajzban a Gépház annak látszik, aki nem néző — vagyis a
**szerkesztőnek is**. A feladatlap 3. pontja szerint a szerkesztő „ugyanazt látja, beállíthat és
futtathat”, mint a tulajdonos, tehát ez következetes; de a Theme- és a Feliratok-felülírás
szervezeti szintű döntés, amit talán csak a tulajdonos hozhat meg.

**Kérdés:** a szerkesztő lássa a Gépházat, vagy csak a tulajdonos? A rajzban egy kapcsoló
(`tulajdonos`), tehát egy szó és átállítom.

### 2.2 A pénznem a rajzon euróban áll

A D5 szerint négy pénznem lehet, tárolt értékekkel. A rajz euróban mutatja a példát, és
kimondja, hogy a pénznem munkatér-beállítás. **Ha a rajzon inkább lejben kellene állnia** (mert
az ügyfelek romániaiak), átírom — de akkor az R-5 Költség-hivatkozásaival is egyeztetni kell,
ahol az AI-költség szándékosan dollárban marad.

### 2.3 A Tagok sor élesedése

A sort megjelöltem (szaggatott pötty és egy mondat). **Kérdés:** amíg az R-2 gépezete nincs
meg, a sor **ne látszódjon**, vagy látszódjon zárva, egy mondattal? A rajz ma a látszó-de-jelölt
változatot mutatja, mert a feladatlap 5. pontja ezt kérte a rajzra — de élesbe így nem mehet.

### 2.4 A „4 tokent írsz felül” és „2 kulcsot írsz felül” számok

A 8. artboard csempéin ez a két szám **példa**, nem mérés: azt mutatja, hogy a csempe a
felülírások számát mondja meg. A valódi számot a szervezeti felülírás táblája adja.
Ha nem akarsz számot a csempén, elhagyható — akkor viszont a tulajdonos nem látja, mennyit tér
el a közös alaptól.

## 3. Amit nem tudtam megcsinálni

### 3.1 Hálózat nélkül a rajz nem jelenik meg

A megjelenítő futtatókörnyezete a React-et és a Babelt az `unpkg.com`-ról, a betűket a
`fonts.googleapis.com`-ról tölti. **Hálózat nélkül a lap üres.** Statikus, hálózat nélkül is
megjelenő változatot nem készítettem — ha kell, szólj.

Ezt az `ATADO.md` 0. pontja kimondja. Az R-0 átadójában ez a mondat valótlan volt; most nem az.

### 3.2 A futtatókörnyezet stíluslapjában maradt pixelérték

A csomagolt fájlban négy helyen van még pixelben írt térköz — mind **a megjelenítő saját
stíluslapjában**, nem a rajzban: a hibaüzenet-réteg paddingjai (`padding:4px 8px`,
`padding:0 3px`, `padding:6px 10px`) és a segédosztályok (`.gap8`, `.mt8`, `.mb12` és társai).
Ezek a keret részei, amiben a rajz fut; a rajz saját stílusaiban pixel-térköz **nincs**.
Kivenni nem tudom: a futtatókörnyezetet nem én írom.

### 3.3 Az elmozdulások helyét csak a rajzon tudom megnevezni

Az `ATADO.md` 3.1 pontja a négy nagy elmozdulást **a rajzon belül** nevezi meg, nem a rendszer
stíluslapjaiban. A kódbeli helyeket nem mértem, ezért nem írok róluk semmit — ez az R-0
csomagjának második hibája volt, és nem ismétlem meg.
