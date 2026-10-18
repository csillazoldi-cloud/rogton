# R-2 · Tagok és meghívás — átadó

2026-09-12 · Aitmetica SRL · a sorrend első tétele (R-2 → R-3 → R-6 → R-4)

## 0. A hiteles rajzfájl és a hálózat

A hiteles rajz: **`rajz/R2-tagok.dc.html`**. Egyetlen fájl, benne **hét artboard** (01–07).

**A megnyitásához hálózat kell** (a betűk a Google Fontsról), és a **`support.js` a rajz mellett kell** legyen — a csomag `rajz/` mappájában ott van. Ha a fájlt máshová emelitek, a `support.js`-t vigyétek vele.

A tokenkészlet az R-1 v4 rajz `:root`-ja, szó szerint átvéve: a tizenöt `--ter-0…14` fok, `--tile-min`, `--fs-metric`, `--gap-tile`, `--pad-tile`, `--control-min-s`. **Új token nincs.** Pixelérték csak alakértékként (a 26×26-os termékjel, a 8 pixeles állapotpont, a 300px-es lenyíló-szélesség) — térközként nem.

## 1. A hét artboard

| # | Mi | Méret |
|---|---|---|
| 01 | Tagok — normál, tulajdonos nézete: három tag, egy függő meghívó, „Mi történt” sor; a sáv munkatér-lenyílója nyitva, benne a Tagok sor aktív | asztali 1440 |
| 02 | Első használat — egyedül a munkatérben | asztali 1440 |
| 03 | Meghívás — **A:** a párbeszéd (szerep + opcionális címzett) · **B:** a kiadott link, egyszer · **C:** szerkesztő nem hívhat tulajdonost | asztali 1440 |
| 04 | Szerep átállítása — a megerősítő sáv a képernyő aljára rögzül; jegyzet az eltávolítás szövegéről | asztali 1440 |
| 05 | Zárt utak — **A:** az utolsó tulajdonos · **B:** „magát nem” · **C:** már visszavont meghívó | asztali 1440 |
| 06 | Tagok — telefon: lista kártyaként, a megerősítő sáv az aljára rögzül | telefon 390 |
| 07 | A beváltó lap — **A:** belépett fiókkal · **B:** belépés nélkül · **C:** a négy hibaút | asztali 1440 |

## 2. Amit a rajz eldöntött

**A megerősítés nem párbeszéd, hanem alsó sáv.** A szerep-átállítás és az eltávolítás a listán helyben kezdődik (a szerep lenyílója a soron azonnal átáll), és a képernyő aljára rögzülő sáv kéri a megerősítést. Így a felhasználó **közben is látja a listát**, és azt is, melyik soron áll. A sáv megnevezi a következményt, nem csak azt kérdezi, hogy „biztos?”.

**A kiadott link egyszer látszik, és ezt a rajz kimondja.** A gépezet a jegyet csak lenyomatként tárolja, tehát a link újra nem mutatható. A „B” panel ezért figyelmeztető blokkot kap, és a záró gomb szövege is ezt mondja: *„Kimásoltam, bezárom”* — nem „Kész”.

**A címzett-mező megnevezi, hogy nem küldünk üzenetet.** Az e-mail-mező melletti mondat kétszer is kimondja: emlékeztető, és a linket a felhasználó továbbítja. Ez a D1 döntés felületi következménye — e-mail-küldés nincs.

**A „magát nem” eset nem hibaüzenet, hanem inaktív vezérlő.** A saját soron a Szerep és az Eltávolítás nem kattintható gomb, hanem halvány szöveg, alatta egy mondat. A `MAGAT_NEM` hibakódot így a felület soha nem váltja ki — a végpont marad a védelem, de a felület nem engedi odáig.

**Az utolsó tulajdonos gombja zárt, nem hibára futó.** A „Kilépek a munkatérből” tiltott állapotban áll, alatta a `UTOLSO_TULAJDONOS` mondata **és** egy második mondat arról, mit tegyen: adjon előbb tulajdonosi szerepet valaki másnak.

**A beváltó lapon nincs felső sáv.** Ez az egyetlen lap az R-2-ben, ami kilóg a sáv szabálya alól: a látogató még nem biztosan tagja a munkatérnek, és belépés nélkül a sáv menüpontjai sem értelmezhetők. Csak a termékjel és a terméknév áll felül. A 07-es artboard jegyzete ezt kimondja.

**A „már tag” eset nem hibaszínű.** A négy hibaút közül három hibaszínű kártya, a `MAR_TAG` viszont semleges: ez tájékoztatás, nem hiba. Mindegyik kártya megmondja a következő lépést is, nem csak azt, hogy mi nem sikerült.

**A Tagok sor a rajzon megjelölve marad** (D-F24): a 01-es artboard lenyílójában ott a mondat, hogy a sor addig nem mehet élesbe, amíg a lap nincs kint.

## 3. Halott vezérlő

Minden kattintható elem mögött van gépezet. A megfelelés:

| A rajzon | Végpont |
|---|---|
| taglista | `GET /api/tagok` |
| Meghívás → Meghívó kiadása | `POST /api/tagok/meghivo` |
| Függő meghívók listája | `GET /api/tagok/meghivo` |
| Visszavonás | `DELETE /api/tagok/meghivo/{id}` |
| Elfogadás (beváltó lap) | `POST /api/meghivo/elfogad` |
| Szerep átállítása | `PUT /api/tagok/{fiokId}` |
| Eltávolítás | `DELETE /api/tagok/{fiokId}` |
| Kilépek a munkatérből | `POST /api/tagok/kilep` |
| „Mi történt” sor | `GET /api/esemenyek` |

**Ami nincs a rajzon, mert nincs mögötte gépezet:** meghívó újraküldése (nincs e-mail), meghívó lejáratának módosítása, a link újbóli megjelenítése, több tag egyszerre kijelölése, olvasott-jelölés az események mellett.

## 4. Feliratkulcsok

Új kulcsok: **`tagok.*`** (21) és **`meghivo.*`** (31), mind a három nyelven, a `feliratok-r2.json`-ban.

A `meglevo_kulcsok` blokkban azok a kulcsok, amiket a rajz **használ, de nem ő vezet be**: a `hozzaferes.hiba_*` kilenc hibamondata, a `nav.szerep_*` hármas, a `nav.tagok` pár és két `esemeny.*` szöveg. A hibamondatok szövegét a mai rendszerbeli megfogalmazás szerint írtam le — **ha a rendszerben más áll, a rendszeré a hiteles**, a rajz csak a helyét jelöli.

## 5. A teendő, ami a rajzon túl van

Az R-2 elkészültével a felső sáv **Tagok sora élesíthető** (D-F24), és a `nav.tagok_szam` kulcs mögé jön az adat: `GET /api/tagok` + `GET /api/tagok/meghivo` darabszáma.
