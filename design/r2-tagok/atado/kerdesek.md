# Kérdések — R-2 · Tagok és meghívás

## 1. Meddig él a meghívó, és látszik-e ez a kiadás előtt

A rajz a kiadás **után** mutatja a lejáratot („2026-09-19-ig él”), a párbeszédben viszont nem kérdezi meg. Amit nem tudok: **fix az élettartam** (pl. hét nap), vagy állítható?

Ha fix, a párbeszédbe kell egy mondat még a kiadás előtt („A meghívó hét napig él”), hogy ne utólag derüljön ki. Ha állítható, kell egy vezérlő — de a `POST /api/tagok/meghivo` törzsében ilyen paramétert nem láttam, ezért nem rajzoltam.

## 2. A szerkesztő is látja a függő meghívókat — a link nélkül?

A `GET /api/tagok/meghivo` a szerkesztőnek is jár, és a szerkesztő is adhat ki meghívót. Kérdés: **a más által kiadott meghívót visszavonhatja-e?** A `DELETE` a szerkesztőnek is engedélyezett, de nem tudom, szűkíti-e a saját kiadásaira.

A rajz a tulajdonos nézetét mutatja, ahol ez nem merül fel. A szerkesztő nézetéhez tudni kell a választ.

## 3. Mi történik a szerkesztő nézetén a gombokkal

A feladatlap azt mondja: „szerkesztő látja a listát gombok nélkül”. A **Meghívás** gomb viszont neki is kell (hívhat nézőt és szerkesztőt). Tehát a szerkesztőnél: Meghívás **van**, Szerep és Eltávolítás **nincs**. Így rajzoltam volna, de a szerkesztő nézete nem kapott önálló artboardot — hetet kért a feladatlap, és a hét betelt. Ha kell nyolcadik, megrajzolom.

## 4. A tag eltávolítása és a munkája

Az eltávolítás szövege azt állítja, hogy „a munkája a munkatérben marad”. Ezt a gépezetből nem tudom ellenőrizni — a `DELETE /api/tagok/{fiokId}` csak a tagságot bontja, de nem tudom, van-e bárhol a tagra mutató hivatkozás (pl. „ki hagyta jóvá a profilt”), és mi lesz vele. Ha a név eltűnik a jóváhagyás mellől, a mondatot át kell írni.

## 5. Kilépés a munkatérből — hol van a helye

A `POST /api/tagok/kilep` az **aktuális** munkatérre vonatkozik. A rajzon az 05/A artboardon a zárt állapotát mutatom, de a működő gombot nem tettem a Tagok lapra: a saját tagságát a felhasználó az R-3 (saját fiók) lapon bontja, munkaterenként. Ez a feladatlap R-3 leírásával egyezik. Ha mégis kell a Tagok lapon is, szólj — de akkor ugyanaz a művelet két helyen lesz.

## 6. Amit a feladatlap kért, de a gépezet nem tud

Nincs ilyen tétel. A táblázat kilenc műveletéhez mind van végpont, és mind a rajzon van.
