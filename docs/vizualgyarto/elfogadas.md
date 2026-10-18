# Elfogadási próbák — mikor mondhatjuk késznek a modult

**Hogyan használjuk:** minden próbát egy ember kézzel végigcsinál, két próbafiókkal (A és B), amelyeknek más a betűje, a színe, az emblémája és a fotótára. Egy próba akkor **teljesül**, ha az „Elvárt" rész szó szerint igaz. Nincs „nagyjából". A modul akkor kész, ha **minden** próba teljesül; a nyitott kérdésektől függő próbák a végén, külön jelölve.

Jelölés: **Lépés** — mit csinál a próbáló. **Elvárt** — mit kell látnia.

---

## Á. Általános és sablon

**Á-1. Minden gomb működik.** Lépés: a szerkesztő minden látható gombját, pipáját, kapcsolóját végigkattintani egy üres és egy kitöltött poszton. Elvárt: mindegyik csinál valamit, vagy szürke, és rámutatva egy mondatban megmondja, miért. Sehol nincs „hamarosan", üres ablak vagy néma kattintás.

**Á-2. A munkatárs nem tud tervezni.** Lépés: keresni betű-, szín-, méretválasztót, elem-mozgatást, új elem hozzáadását. Elvárt: nincs ilyen vezérlő.

**Á-3. A sablontár a fiók arculatát mutatja.** Lépés: belépni A-ba, majd B-be, megnézni a sablontár mintaképeit. Elvárt: A mintái A betűivel/színeivel, B mintái B-ével készültek; nem általános minta.

**Á-4. Státuszszín csak közleménynél.** Lépés: megnyitni egy kijelentés-sablont és egy szolgáltatási közlemény-sablont. Elvárt: a státuszszín (fennakadás / késés / rendben) választója csak a közleményben létezik, és ott mindig szóval együtt jelenik meg a képen, sosem csak színként.

**Á-5. Sorszám.** Lépés: két azonos típusú posztot létrehozni egymás után, az elsőt törölni, egy harmadikat létrehozni. Elvárt: a sorszámok eggyel nőnek; a törölt sorszám nem kerül újra kiosztásra.

**Á-6. Kis adatsor alakja.** Lépés: kitölteni a dátumot, egy időszakot és egy helyet; letölteni. Elvárt: a képen a sor alakja „TÍPUSKÓD SORSZÁM · NN.HH.ÉÉÉÉ · HELY", az időszak gondolatjellel, a számjegyek egyforma szélességűek, csupa nagybetűs, a kép bal alsó sarkában, az emblémával egy vonalban.

**Á-7. Egy jelzés.** Lépés: bármely sablonon bármit kitölteni, letölteni; megszámolni a jelzőszínű kiemelő elemeket (pont, vonal, kiemelt sor, ív, idézőjel). Elvárt: pontosan egy, a második nyelv színén és az emblémán kívül.

---

## K. Kétnyelvűség

**K-1. Minden mezőnek van párja.** Lépés: minden sablon minden képre kerülő szövegmezőjét megnézni. Elvárt: mindegyik kétszer szerepel, azonos címkével, első nyelv felül.

**K-2. Hiányzó nyelv tilt.** Lépés: kitölteni a címsort az első nyelven, a másodikat üresen hagyni. Elvárt: piros keret, tiltás a listában a mező nevével, a Letöltés gomb szürke.

**K-3. Azonos méret.** Lépés: hosszú címsort adni az első nyelven és rövidet a másodikon; letölteni; megmérni a két nyelv betűmagasságát a fájlon. Elvárt: azonos.

**K-4. Sorrend és szín.** Lépés: letölteni egy sötét alapú és egy világos alapú posztot. Elvárt: az első nyelv felül; sötét alapon a második nyelv a jelzőszínnel, világos alapon annak mélyebb változatával; a kiemelt (jelzőszínű) alapon a két nyelvet a vastagság különbözteti meg, nem a szín.

**K-5. Különleges betűk.** Lépés: mindkét nyelv összes ékezetes és különleges betűjét beírni egy címsorba és a képaláírásba; letölteni; 100 %-on megnézni. Elvárt: minden betű helyes (nincs üres négyzet, nincs cserélt jel, nincs más betűtípusból pótolt betű).

**K-6. Kétnyelvű címke.** Lépés: rövid témacímkét adni, majd nagyon hosszút. Elvárt: a rövid egy sorban „első · második" alakban; a hosszú magától két sorba kerül, a szerkesztőnek nem kell semmit tennie.

**K-7. Széles formátum nyelvenként.** Lépés: széles formátumot választani, kitölteni mindkét nyelvet, letölteni. Elvárt: két fájl, azonos elrendezéssel, mindegyiken csak egy nyelv, a kis adatsor végén a nyelv jele.

**K-8. Képaláírás két tömbben.** Lépés: kitölteni a képaláírást, letölteni a szövegfájlt. Elvárt: két tömb, mindegyik elején a nyelv jele, az első nyelv elöl; a nyelvjel nem törölhető a szerkesztőben.

**K-9. Eltérő számok.** Lépés: az első nyelvbe „12", a másodikba „21" számot írni ugyanabba a mezőbe. Elvárt: sárga javaslat jelenik meg az eltérésről; letölthető marad; a tudomásulvétel naplózódik névvel.

**K-10. Sorszám-különbség.** Lépés: olyan szövegpárt adni, ahol a második nyelv két sorral hosszabb. Elvárt: a rendszer a következő méretlépcsőt próbálja; ha nem tud eggyen belülre hozni, piros, és a „Mit próbált" panel ezt írja ki okként.

**K-11. Összetett szó törése.** Lépés: a fiók elválasztási listáján szereplő hosszú összetett szót olyan mezőbe írni, ahol nem fér ki egy sorba. Elvárt: a szó a listán rögzített ponton törik, **a kötőjel látszik** a képen, a szó másik része a következő sorban.

**K-12. Listán nem szereplő szó.** Lépés: a listán nem szereplő, nem kiférő hosszú szót írni. Elvárt: a rendszer nem töri meg a szót; piros, „átírás kell"; a szerkesztő nem tud sortörést erőltetni.

**K-13. Nincs fordítógomb.** Lépés: keresni fordítás vagy „töltsd ki a másikból" funkciót. Elvárt: nincs.

---

## F. Kiférés

**F-1. A jelző sorokat mutat.** Lépés: egy mezőbe írni, figyelni a sávot. Elvárt: „N sor a legfeljebb M-ből · méretlépcső" alakú szöveg; a karakterszám csak szürke tájékoztatóként, nem döntő számként.

**F-2. A fiók betűjével mér.** Lépés: ugyanazt a mondatot ugyanabba a sablonba beírni A-ban és B-ben (más betű). Elvárt: a sorszám vagy a méretlépcső eltér a két fiókban, ha a betűk szélessége eltér — azaz nem egy közös becslés jelenik meg.

**F-3. A jelző = a letöltés.** Lépés: tíz különböző hosszúságú szövegpárral tíz posztot készíteni; mindegyiknél leírni az előnézet sortöréseit; letölteni; összevetni. Elvárt: mind a tíznél ugyanazok a sortörések, ugyanazon a méretlépcsőn, ugyanott.

**F-4. A lépcsősor sorrendje látszik.** Lépés: fokozatosan hosszabbítani egy címsort; közben nyitva tartani a „Mit próbált a rendszer" panelt. Elvárt: a sorrend mindig: kisebb méretlépcső → rövid változat (ha van) → elrendezési lépés → piros. A panel minden lépést és eredményét kiírja.

**F-5. Soha a minimum alá.** Lépés: olyan szöveget adni, ami csak a legkisebb lépcső alatt férne ki. Elvárt: piros; a letöltött képen (ha egy rövidebb változattal letöltik) a legkisebb betű nem kisebb, mint a fiók házi minimuma az adott szerepre.

**F-6. Nincs keskenyítés, nyújtás, ritkítás.** Lépés: ugyanazt a szót egy rövid és egy hosszú címsorba tenni, ugyanazon a lépcsőn; letölteni; a szó szélességét megmérni a két fájlon. Elvárt: azonos.

**F-7. Rövid változat automatikus.** Lépés: hosszú címsort adni, ami nem fér, majd rövid változatot is megadni. Elvárt: a rendszer a rövidet használja, a sáv sárga és kiírja: „rövid változat használva"; a hosszú mező megmarad, nem törlődik.

**F-8. Réteg a képaláírásba.** Lépés: adatposzton címsor + magyarázat + megjegyzés kitöltése úgy, hogy együtt ne férjenek ki. Elvárt: először a megjegyzés, aztán a magyarázat, aztán a bevezető kerül a képaláírásba (ebben a sorrendben); a képaláírás mezőben az áthelyezett szöveg jelölve megjelenik; a sáv ezt kiírja.

**F-9. Osztott kivágás fotón.** Lépés: fotós kijelentés-sablonon hosszú címsort adni, ami a fotón nem fér ki. Elvárt: az elrendezés magától „fotó felül, szövegmező alul" alakra vált; a sáv ezt kiírja; a szöveg nem kerül a fotóra.

**F-10. Story-nál nincs osztott kivágás.** Lépés: ugyanezt story formátumon. Elvárt: a rendszer nem ajánl osztott kivágást; egyből piros, átírást kér.

**F-11. Árva szó.** Lépés: olyan címsort adni, ahol az utolsó sorban egy rövid szó marad. Elvárt: a rendszer először átrendezi a sorokat; ha marad, sárga javaslat „Elfogadom" gombbal; elfogadás után a napló tartalmazza a nevet és az időt.

**F-12. Széles formátum korlátja.** Lépés: hétszavas címsort adni széles formátumon. Elvárt: piros, a szókorlát megnevezésével.

**F-13. Videófelirat egy sor.** Lépés: rövid videó felirat-mezőjébe egy sornál hosszabb szöveget írni. Elvárt: piros „Ossza két feliratra"; a rendszer nem kicsinyít és nem tör sort.

**F-14. Telefonnézet aránya.** Lépés: a telefon-fülön megnézni egy hírfolyam-posztot és egy széles posztot. Elvárt: a kicsinyítés a két formátumnál eltérő (a széles kép kb. 1,78-szor kisebbnek látszik); minden szöveg olvasható, a rendszer feliratban jelzi, hogy minden a minimum fölött van.

**F-15. Ábra-kapacitás.** Lépés: oszlopdiagramos adatposzton sorokat hozzáadni. Elvárt: a felső határ elérésekor a „+ sor" eltűnik, helyette a rangsorolt lista / lapozható felajánlás; a felajánlásra kattintva az ábra valóban átalakul.

**F-16. Lapozható folytató lap.** Lépés: lapozható poszt listás lapján több elemet adni, mint amennyi egy lapra fér. Elvárt: előbb a képhely csökken lépésenként (a sáv kiírja), aztán folytató lap nyílik, folytatólagos számozással, címsor nélkül.

**F-17. A mérés hiányában nincs becslés.** Lépés: a fiók betűit elérhetetlenné tenni (próbakörnyezetben). Elvárt: a sáv szürke „A mérés nem elérhető"; nem jelenik meg helyette karakterszám-alapú ítélet; a Letöltés szürke.

**F-18. Válaszidő.** Lépés: egy mezőbe gépelni. Elvárt: a sáv legfeljebb két másodpercen belül a friss szövegre vonatkozik, közben „mérés…" látszik, nem az előző eredmény.

---

## P. Fotó

**P-1. Túl kicsi fotó.** Lépés: a formátumnál kisebb képet feltölteni. Elvárt: visszautasítás, a szükséges legkisebb méret kiírásával; a kép nem kerül a képtárba.

**P-2. Nem képfájl.** Lépés: szöveges fájlt feltölteni. Elvárt: visszautasítás.

**P-3. Nyilatkozatok kötelezők.** Lépés: fotót feltölteni, a „valódi, saját felvétel" pipát üresen hagyni. Elvárt: a fotó nem használható posztban, amíg a pipa és a hozzájárulás-állapot nincs kitöltve.

**P-4. Hozzájárulás nélküli fotó személyes sablonon.** Lépés: felismerhető személyt tartalmazó, hozzájárulás nélküli fotót választani személyes sablonhoz. Elvárt: nem választható; a csempe megmondja, miért; kattintásra a hozzájárulás rögzítő űrlapja nyílik.

**P-5. Arc- és kézmentes terület.** Lépés: fotós sablonon egy arcdobozt átrajzolni úgy, hogy a szöveg helyére essen. Elvárt: a rendszer osztott kivágásra vagy sötét sávra vált, vagy piros; a letöltött képen egyetlen betű sem esik a dobozra.

**P-6. „Nincs arc" nyilatkozat.** Lépés: minden arcdobozt törölni. Elvárt: megerősítő kérdés; a poszt csak a „nincs arc vagy kéz a képen" pipa után menthető készként; a pipa naplózódik.

**P-7. Fókuszpont minden formátumra.** Lépés: egy fotót négy formátumban használni, a fókuszpontot a kép egyik szélére tenni. Elvárt: mind a négy kivágás bent tartja a fókuszpontot; egyik kivágás sem lóg ki a fotóról (nincs üres szél).

**P-8. Fehér adatsor fotón; jobb felül, ha kell.** Lépés: fotós posztot letölteni; majd bepipálni „Fontos tartalom van a kép alján", újra letölteni. Elvárt: az első képen a kis adatsor fehér, bal alul, embléma jobb alul; a másodikon mindkettő jobb felül.

**P-9. Ugyanaz az arc tízen belül.** Lépés: olyan fotót választani, ami a legutóbbi 10 kiadott poszt egyikén szerepelt. Elvárt: sárga javaslat; letölthető; naplózódik.

**P-10. Fotós családok zárva fotó nélkül.** Lépés: olyan fiókban, ahol a képtár üres, a sablontárat megnyitni. Elvárt: a fotós, személyes családok csempéi szürkék, okkal; kattintásra a képtár feltöltő oldala nyílik.

**P-11. Képleírás kötelező.** Lépés: fotót választani, a képleírást üresen hagyni. Elvárt: tiltás a mező nevével.

**P-12. Nincs díszítés.** Lépés: fotós posztot letölteni, 100 %-on megnézni. Elvárt: a fotón nincs színátmenet díszként, nincs jelvény vagy matrica; a szöveg csak sötétítő sávon vagy külön szövegmezőn áll.

---

## R. Forrásjelölés

**R-1. Pipa nélkül szemléltető sor.** Lépés: adatposztot kitölteni, a „Az adatok ellenőrzöttek" pipát üresen hagyni, letölteni. Elvárt: a képen a forrás helyén a fiók mindkét nyelvű „Példa — szemléltető adatok" jellegű sora; a képaláírásban ugyanez a megjegyzés.

**R-2. A szemléltető sor nem vehető le.** Lépés: keresni gombot, kapcsolót vagy mezőt, amivel a sor eltüntethető. Elvárt: nincs ilyen; a sor csak a pipa bepipálásával és forrás megadásával tűnik el.

**R-3. Pipa csak forrással.** Lépés: bepipálni üres forrás-mezőkkel. Elvárt: a pipa visszaugrik, üzenettel, mi hiányzik.

**R-4. Pipa forrással.** Lépés: bepipálni, rövid forrást és teljes hivatkozást adni, letölteni. Elvárt: a képen a rövid forrás (legfeljebb 2 sor nyelvenként), a szemléltető sor eltűnt; a képaláírásban a teljes hivatkozás.

**R-5. Közlemény szemléltető adattal tilt.** Lépés: szolgáltatási közlemény sablonon a pipát üresen hagyni. Elvárt: tiltás „Közlemény nem mehet ki szemléltető adattal", Letöltés szürke.

**R-6. Második ellenőrző.** Lépés: közleményen bepipálni, forrást adni, „Ellenőrzésre küldés", ellenőrzőt választani; másik felhasználóval belépni, megerősíteni. Elvárt: küldés után az állapot „ellenőrzésre vár" és a Letöltés szürke; megerősítés után a Letöltés aktív; a napló tartalmazza mindkét nevet és időt.

**R-7. A szerző nem erősíthet meg.** Lépés: a szerző saját posztját próbálja megerősíteni. Elvárt: nincs rá gomb, vagy szürke, okkal.

**R-8. Tényadat változása törli a megerősítést.** Lépés: megerősített közleményen a dátumot átírni. Elvárt: az állapot visszaáll „ellenőrzésre vár"-ra; a Letöltés szürke; a napló rögzíti. Ellenpróba: csak a fotó kivágását módosítani → a megerősítés megmarad.

**R-9. Javítást kérek.** Lépés: az ellenőrző „Javítást kérek"-et nyom megjegyzéssel. Elvárt: a szerző a poszton látja a megjegyzést, az állapot „javítandó", a Letöltés szürke.

**R-10. Döntéshozói sor.** Lépés: a „Döntéshozó" mezőt kitölteni, letölteni; majd kiüríteni, újra letölteni. Elvárt: az első képen a fiókban beállított szövegű „…döntése alapján" sor mindkét nyelven; a másodikon nincs ilyen sor.

**R-11. Közelítő érték.** Lépés: nagy számnál bepipálni a „közelítő érték" pipát. Elvárt: a szám előtt megjelenik a ≈ jel, kisebb méretben; kivéve a pipát eltűnik.

**R-12. Nincs ellenőrző a fiókban.** Lépés: olyan fiókban, ahol nincs ellenőrző szerepű személy, közleményt készíteni. Elvárt: az „Ellenőrzésre küldés" szürke, rámutatva: nincs kijelölt ellenőrző.

---

## L. Letöltés pontossága

**L-1. Pontos méretek.** Lépés: minden formátumból letölteni egy képet, a fájl képpont-méretét megnézni. Elvárt: pontosan a fiók arculatában rögzített méret (a forrásrendszerben: 1080 széles álló és négyzet, 1080 × 1920 story, 1920 × 1080 széles), se több, se kevesebb.

**L-2. Előnézet = fájl.** Lépés: az előnézetet 100 %-on a letöltött fájl mellé tenni; öt pontot (címsor első sora, második nyelv első sora, kis adatsor, embléma, forrás-sor) összevetni. Elvárt: azonos hely, azonos sortörés, azonos méret mind az ötnél.

**L-3. A fiók betűje a fájlban.** Lépés: egy jellegzetes betűt (pl. a második nyelv egy ékezetes betűjét) 100 %-on összevetni a fiók betűjének mintájával. Elvárt: a fiók betűje, nem helyettesítő.

**L-4. Semmi nincs levágva.** Lépés: minden formátum minden szövegmezőjét a legnagyobb megengedett hosszra tölteni, letölteni. Elvárt: minden utolsó sor teljesen látszik, semmi nem ér a szélhez, az embléma ép, semmi nem takar mást.

**L-5. Széles: két fájl; lapozható: sorban.** Lépés: széles posztot és egy hatlapos lapozhatót letölteni. Elvárt: a szélesből két fájl (nyelvenként); a lapozhatóból hat, sorban számozva, a lapok jobb alsó sarkában a „02 / 06" jellegű számozás helyesen; a belső lapokon nincs embléma, csak a borítón és az utolsón.

**L-6. Képaláírás a csomagban.** Lépés: letölteni, a szövegfájlt megnyitni. Elvárt: betűre azonos a szerkesztőben látottal, mindkét tömb.

**L-7. Fájlnevek.** Lépés: letölteni. Elvárt: a fájlnevekből kiolvasható a típuskód, a sorszám, a dátum, a formátum és (szélesnél) a nyelv. *(A végleges minta nyitott kérdés; a próba a kiolvashatóságra vonatkozik.)*

**L-8. Újraletöltés azonos.** Lépés: letölteni; a fiókban egy színt módosítani és jóváhagyni; a régi posztot újra letölteni. Elvárt: a két fájl képpontra azonos.

**L-9. Betű nélkül nincs fájl.** Lépés: a fiók betűit elérhetetlenné tenni (próbakörnyezet), letöltést indítani. Elvárt: visszautasítás üzenettel; nem készül helyettesítő betűs fájl.

**L-10. Tiltással nincs részleges csomag.** Lépés: egy tiltással letöltést próbálni. Elvárt: a gomb szürke, rajta a tiltások száma; kattintásra a lista; semmi nem töltődik le.

**L-11. Story biztonsági sávok.** Lépés: story-t letölteni. Elvárt: a felső és az alsó sávban (ahová a platform elemei kerülnek) nincs szöveg, embléma, kis adatsor.

**L-12. Embléma helye és mérete.** Lépés: A és B fiókból egy-egy posztot letölteni. Elvárt: mindkettőn a saját embléma, jobb alul, azonos margóval a széltől, sötét alapon a sötét alapra való változat, világoson a világosra való.

**L-13. Nincs emoji, zászló, címke a képen.** Lépés: emojit, zászlót és kettőskereszt-címkét írni a címsorba. Elvárt: tiltás; a képaláírásban ugyanez megengedett.

---

## T. Több fiók elkülönítése

**T-1. Betűk fiókonként.** Lépés: A-ban egy mondatot beírni, majd B-ben ugyanazt. Elvárt: A-ban A betűjével, B-ben B-ével jelenik meg; A szerkesztőjében B betűje sehol nem töltődik be (próbakörnyezetben a betöltött betűk listája ellenőrizhető).

**T-2. Fotótár fiókonként.** Lépés: A-ban feltölteni egy fotót; B-ben a képtárat megnyitni és keresni. Elvárt: B-ben a fotó nem látszik, keresésre sem.

**T-3. Sorszámok fiókonként.** Lépés: A-ban és B-ben azonos típuskódú posztot létrehozni. Elvárt: a számlálók függetlenek (mindkettő a saját következő számát adja).

**T-4. Névlista és elválasztás fiókonként.** Lépés: A-ban új nevet felvenni és egy elválasztást jóváhagyni. Elvárt: B-ben egyik sem jelenik meg.

**T-5. Idegen poszt nem nyitható.** Lépés: A egyik posztjának címét (webcímét) B felhasználójával megnyitni. Elvárt: „nincs ilyen" vagy „nincs jogosultság"; semmi nem látszik a tartalomból, a poszt címe sem.

**T-6. Arculatváltás nem hat át.** Lépés: A arculatát módosítani és jóváhagyni. Elvárt: B piszkozatai és sablonjai változatlanok; B naplójában nincs bejegyzés.

**T-7. A tervező nem másol.** Lépés: új C fiókot indítani minimális bemenettel (csak nyelvek és egy stílusleírás). Elvárt: a tervező javaslata nem tartalmazza A vagy B betűjét, színeit, emblémáját vagy fotóit; a javaslat indoklása csak C bemeneteire és a szabályrendszerre hivatkozik.

**T-8. Naplók fiókonként.** Lépés: A fiókgazdájaként a fiók naplóját kikérni. Elvárt: csak A adatai; B egyetlen felhasználója, posztja, fotója sem szerepel.

**T-9. Közös szabály azonos.** Lépés: A-ban és B-ben ugyanazon szerep minimum-méretét ellenőrizni (a legkisebb lépcső). Elvárt: azonos (a szabályrendszer közös), miközben a betű és a kimért kapacitás eltér.

**T-10. Ellenőrző csak a saját fiókból.** Lépés: A-ban közleményt ellenőrzésre küldeni. Elvárt: az ellenőrzők listájában csak A ellenőrző szerepű munkatársai.

---

## I. Fiók indítása és arculatmódosítás

**I-1. A bekérés teljes.** Lépés: új fiókot indítani, minden mezőt üresen hagyni. Elvárt: a rendszer mezőnként megmondja, mi hiányzik és mi nem fog működni nélküle; két nyelv és használható embléma nélkül a fiók nem élesíthető.

**I-2. Nem megfelelő kontraszt nem hagyható jóvá.** Lépés: olyan színpárt megadni, ami nem olvasható (pl. világos alapon világos szöveg). Elvárt: a jóváhagyó gomb szürke; a kontraszt-jelentés megnevezi a párt; a tervező alternatívát javasol.

**I-3. Az „Ennyi fér ki" táblázat létezik és fiókfüggő.** Lépés: A és B indításánál a 4. jóváhagyási lépcsőt megnézni. Elvárt: mindkettőnél van táblázat (sablon × formátum × mező × nyelv); a számok eltérnek, ha a betűk szélessége eltér; a táblázat nem szerkeszthető.

**I-4. A kimérés az élesítés előtt fut.** Lépés: a lépcsőket sorban végigjárni. Elvárt: a kimért korlátok jóváhagyása a betű/szín/elrendezés jóváhagyása **után** és az élesítés **előtt** van; a sablonok a munkatársaknak csak az élesítés után jelennek meg.

**I-5. A második nyelv aránya mért.** Lépés: a táblázatban a második nyelv kapacitását megnézni. Elvárt: a rendszer megjeleníti a mért hosszabbodási arányt, és nem egy fix százalék szerepel minden fióknál.

**I-6. Elválasztási lista csak nyelvi ellenőrzés után.** Lépés: a tervező javasolt elválasztásait a nyelvi ellenőr jóváhagyása nélkül élesíteni próbálni. Elvárt: a lista nem él; a szerkesztőben a listás szó is átírást kér, amíg nincs jóváhagyva.

**I-7. 13 kérdéses próba ítéletekkel.** Lépés: a 3. jóváhagyási lépcsőt megnézni. Elvárt: mind a 13 kérdéshez ítélet (megfelel / feltétellel / még nem) és indoklás; „még nem" esetén a rendszer megnevezi, mely családok maradnak zárva és mi kell a nyitásukhoz.

**I-8. Betűváltás újraméréssel.** Lépés: élő fiókban, néhány piszkozattal, a betűt módosítani. Elvárt: jóváhagyás előtt a rendszer kiírja, hány piszkozatot érint és hány nem fér ki az új korlátokkal; jóváhagyás után az érintett piszkozatok piros jelölést kapnak; a régi arculat addig él, amíg nincs jóváhagyás.

**I-9. Színváltás nem ad kiférési hibát.** Lépés: csak színt módosítani és jóváhagyni. Elvárt: a piszkozatok az új színnel rajzolódnak; egyetlen új kiférési figyelmeztetés sem keletkezik; nem fut kimérés.

**I-10. Kiadott poszt érintetlen.** Lépés: betűváltás után egy korábban letöltött posztot megnyitni és újra letölteni. Elvárt: az adatlap a régi arculat-változat számát mutatja; az újraletöltött fájl képpontra azonos a régivel.

**I-11. Arculat-változat száma minden poszton.** Lépés: egy posztot az 1. arculattal, egy másikat a 2.-kal készíteni. Elvárt: mindkét poszt adatlapján a megfelelő szám.

**I-12. Megerősítés arculatváltás után.** Lépés: megerősített közlemény mellett színt váltani, majd betűt váltani úgy, hogy egy réteg a képaláírásba kerül. Elvárt: színváltás után a megerősítés megmarad; a rétegmozgás után a rendszer jelzi a szerzőnek az újranézést (a próba a jelzés meglétére vonatkozik; hogy a megerősítés is törlődjön-e, nyitott kérdés).

---

## M. Mentés, változatok, figyelmeztetések, előnézet

**M-1. Automatikus mentés.** Lépés: gépelni, a böngészőt bezárni, újra megnyitni a posztot. Elvárt: a beírt szöveg megvan; nincs külön „Mentés" gomb a piszkozathoz.

**M-2. Sikertelen mentés látszik.** Lépés: a kapcsolatot megszakítani, gépelni. Elvárt: piros sáv „Nem sikerült menteni — a rendszer újrapróbálja"; a szerkesztés folytatható; a Letöltés szürke, amíg a sáv látszik; kapcsolat után minden beírt szöveg mentődik.

**M-3. Nevesített változat és visszaállítás.** Lépés: „Változat mentése" névvel; módosítani; a régi változatot visszaállítani. Elvárt: a visszaállítás előtt az aktuális állapotból új változat készül; a régi tartalom visszakerül; egyetlen változat sem törlődött.

**M-4. Napló tartalma.** Lépés: egy posztot végigvinni: átírás, rövid változat használata, árva szó elfogadása, javaslat tudomásulvétele, ellenőrzés, letöltés. Elvárt: a napló mindegyik eseményt tartalmazza névvel és idővel, az átírásnál előtte/utána szöveggel.

**M-5. Egyidejű szerkesztés.** Lépés: két felhasználó ugyanazt a posztot nyitja. Elvárt: a második csak olvasásra kapja, a szerkesztő nevével.

**M-6. Tiltás és javaslat különbözik.** Lépés: egy tiltást és egy javaslatot előidézni. Elvárt: a tiltás piros, nincs rajta „tudomásul veszem"; a javaslat sárga, van, és tudomásulvétel után szürke marad, a napló rögzíti.

**M-7. Figyelmeztetés a mezőre ugrik.** Lépés: egy figyelmeztetés sorára kattintani. Elvárt: az űrlap a mezőre ugrik, az előnézeten a hely kiemelődik.

**M-8. Ritmus-javaslatok a hírfolyam-nézetben.** Lépés: a legutóbbi 9 csempe között három egymást követő azonos alapú poszt után egy negyedik ugyanolyat készíteni; majd egy kiemelt (jelzőszínű) posztot közvetlenül egy másik kiemelt mellé. Elvárt: mindkét esetben sárga javaslat a hírfolyam-fülön; letölthető; naplózódik.

**M-9. Ismétlődő elrendezés és hely.** Lépés: ugyanazzal a sablonnal, ugyanazzal a hellyel készíteni posztot 10 poszton belül másodszor. Elvárt: sárga javaslat.

**M-10. Kiadás előtti kérdéssor.** Lépés: nem közlemény-posztot letölteni. Elvárt: hat igen/nem kérdés jelenik meg; válasz nélkül nem lehet tovább; a válaszok a naplóba kerülnek; „igen" válasz nem tiltja a letöltést.

**M-11. Előnézet hiba esetén.** Lépés: a rajzolót hibára kényszeríteni (próbakörnyezet). Elvárt: az utolsó jó kép marad, piros felirattal; nem üres; a Letöltés szürke.

**M-12. Előnézet-elemről a mezőre.** Lépés: az előnézeten a címsorra kattintani. Elvárt: az űrlap a címsor mezőjére ugrik.

**M-13. Lapozható alapválasztó korlátja.** Lépés: lapozhatóban három egymást követő sötét lap után a negyedik lap alapját választani. Elvárt: a „sötét" lehetőség szürke, rámutatva az okkal; a világos és a fotós választható.

**M-14. Ábra-kapacitás nem léphető túl.** Lépés: oszlopdiagramon a felső határ elérése után sort hozzáadni próbálni. Elvárt: nincs „+ sor"; a felajánlott lista/lapozható átalakítás működik.

---

## Nyitott kérdésektől függő próbák

Ezeket csak a kérdés eldöntése után lehet véglegesíteni; addig a fenti alakban futtathatók, ahogy jelölve.

- **L-7** (fájlnevek végleges mintája).
- **I-12** (megerősítés törlése rétegmozgásnál).
- **Á-5** (sorszám kiosztásának ideje: első mentés vagy letöltés — a próba az „eggyel nő, nem kerül újra kiosztásra" részre vonatkozik, ami mindkét esetben igaz kell legyen).
- A képaláírás karakter-felsőhatára platformonként (nincs próba, amíg nincs határ).
- A letöltött fájl formátuma és minősége (L-1 a képpont-méretre vonatkozik; a formátum és a tömörítés próbája a döntés után írható meg).
- Vállalkozás-típusú fióknál a kiadás előtti kérdéssor kötelezősége (M-10 közszolgálati fiókra vonatkozik).

---

## Összesítés

- Á: 7 · K: 13 · F: 18 · P: 12 · R: 12 · L: 13 · T: 10 · I: 12 · M: 14 — **összesen 111 próba**, ebből 6 nyitott kérdéstől függ részben.
- **A három legfontosabb:**
  1. **F-3 — A jelző = a letöltés.** Ha a kiférés-jelző és a letöltött fájl eltér, az egész „valódi kiférés" ígéret hamis, és a munkatárs nem bízhat a felületben.
  2. **R-1 + R-5 — Forrásjelölés.** Nem ellenőrzött adat sosem mehet ki jelölés nélkül, és közlemény sosem mehet ki szemléltető adattal. Ez az, ami a fiók gazdáját megvédi a téves közléstől.
  3. **T-1 + T-2 + T-5 — Fiókok elkülönítése.** Egyik cég betűje, fotója vagy posztja sem szivároghat át a másikhoz. Ha ez sérül, a többfiókos rendszer nem adható ki.
