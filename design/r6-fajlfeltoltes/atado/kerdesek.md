# Kérdések — R-6 · Fájlfeltöltés az arculathoz

## 1. Sötét háttérre szánt logó — kell-e külön cél?

A gépezetben **egy** `logo` cél van. A rajz ezért nem külön fájlhelyet ad, hanem a **meglévő logót mutatja meg két háttéren**, és kiírja, hogy sötét háttérre külön fájlt nem tudunk tárolni.

Ez tisztességes, de nem oldja meg a problémát: ha a logó sötét háttéren eltűnik, a felhasználó látja a bajt, és nem tud vele mit tenni. Ha ez gyakori, a gépezetnek kell egy ötödik cél (`logo_sotet`), és akkor a rajzon is lesz helye. **Ez termékdöntés, nem rajzkérdés.**

## 2. Hány fájl lehet egy célon?

A `GET /api/arculat/fajl?cel=referencia` listát ad vissza, tehát **több** referencia lehet. A logónál viszont a tervezet **egy** `logo_fajl_id`-re hivatkozik.

A rajz ezt így értelmezi: a logónál egy fájl van „használatban", a többi korábbi példány; a referenciáknál több is állhat egymás mellett. Amit nem tudok: **van-e felső korlát** a referenciák számán, és ha igen, mi történik a korlát elérésekor. A 01. artboard egy üres mezőt mutat célonként — ha több referencia is lehet egyszerre, kell egy „még egy hozzáadása" sor, amit nem rajzoltam meg.

## 3. A kézikönyv és a dokumentum cél különbsége

A négy cél közül a `kezikonyv` és a `dokumentum` a felhasználó szemszögéből nehezen válik el. A rajz megfogalmazása: a kézikönyv a kész arculati kézikönyv, a dokumentum minden más (bemutatkozó, termékleírás).

Kérdés: **használja-e az AI másképp a kettőt?** Ha igen, a különbséget a mondatnak élesebben kell kimondania. Ha nem, érdemes lenne három célra szűkíteni — de a gépezetben négy van, és a rajz azt mutatja, ami van.

## 4. Mi van a feltöltés utáni azonnali AI-feldolgozással?

A feltöltés eseményt ír (`fajl_feltoltve`), de azt nem tudom, hogy **az AI azonnal dolgozik-e belőle**, vagy csak a tervezet legenerálásakor. A rajz nem állít semmit erről: a feltöltött fájl megjelenik a listában, és a bevezető mondat annyit mond, hogy „az AI ezekből készít arculati tervezetet".

Ha a feltöltés azonnal elindít egy feldolgozást, annak látszania kell (állapot a fájl mellett), és akkor kell egy hetedik artboard.

## 5. Amit a feladatlap kért, de a gépezet nem tud

**Eltávolítás gomb** — nincs törlő végpont, ezért a rajzon nincs. Helyette Csere van, és a lista megőrzi a korábbi példányt. A régi feladatlap 6 artboardja ezzel a változtatással készült el.

**Két méretkorlát (2/20 MB)** — elévült, egy korlát van: 10 MB. A rajz mindenhol ezt írja.
