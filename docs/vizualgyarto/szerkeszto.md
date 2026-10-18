# Szerkesztő felület — mit lát és mit csinál a munkatárs

**Kinek szól:** a fiók munkatársainak, akik a kész sablonokat töltik ki. Nem terveznek: nem választanak betűt, színt, nem tolnak el semmit a képen. Az arculatot a fiók indulásakor tervezte meg a rendszer (lásd `fiok-inditas.md`); a szerkesztő csak alkalmazza.

## Alapelvek (minden képernyőre érvényesek)

1. **Minden gomb mögött működés van.** Ami még nem működik, az nem látszik. Ami az adott posztnál nem használható, az látszik, de szürke, és rámutatva megmondja, miért.
2. **A rendszer soha nem írja át a munkatárs szavait.** Csak a betűméretet, a sortörést és az elrendezést igazítja a szabályok szerint, és mindig megmutatja, mit tett.
3. **Egy rajzoló, három kimenet.** Az előnézet, a kiférés-jelző és a letöltött kép ugyanabból a rajzolóból jön, a fiók saját betűivel. Ami az előnézeten látszik, az kerül a fájlba, képpontra pontosan.
4. **Két súly a figyelmeztetéseknél.** *Tiltás:* amíg fennáll, nem lehet letölteni. *Javaslat:* letölthető, de a munkatárs dönt, és a döntése naplózódik (ki, mikor).
5. **Ami az arculatból jön, itt nem módosítható:** betű, szín, embléma, méretek, elrendezés, kiférési korlátok. Ezekhez a fiók arculati beállításai kellenek.
6. **Két nyelv mindenütt.** Minden képre kerülő szöveg mindkét nyelven megvan, azonos méretben, az első nyelv felül. (Egy kivétel: a széles, fekvő formátum nyelvenként külön fájlt ad, de a szerkesztőben akkor is mindkét nyelvet ki kell tölteni.)

## A munkamenet lépései

1. Sablon választása
2. Szövegmezők kitöltése két nyelven, közben a kiférés-jelző figyelése
3. Fotó (ha a sablon kér)
4. Előnézet: valós méret, telefon, hírfolyam
5. Figyelmeztetések rendezése; adatok ellenőrzöttségének jelölése
6. Képaláírás két nyelven
7. Mentés, változat
8. Letöltés

A lépések között szabadon lehet mozogni. A letöltés csak akkor nyílik meg, ha egyetlen tiltás sincs.

Minden képernyőelemnél három dolgot írunk le: **Mit lát · Kattintásra · Hiba esetén.**

---

## 1. Sablonválasztás

**Mit lát**
- A saját fiók neve és emblémája a fejlécben. Alatta a sablontár: minden sablon egy kis mintaképpel, **a fiók saját betűivel és színeivel** (nem általános mintával), és egy soros magyarázattal: mire való, hány sor szöveg fér rá, kell-e hozzá fotó.
- A sablonok családokba rendezve:
  - **Kijelentés** — egy erős mondat két nyelven. Négy hangulatban: fotós, sötét alapú, világos alapú, kiemelt (a fiók jelzőszínén — ritka, lásd 6. pont).
  - **Adatposzt** — egy szám vagy egy egyszerű ábra, egy mondatnyi megállapítással. Az ábrák fajtái kötöttek; mindegyiknek van felső határa (pl. legfeljebb 4 oszlop, 3 időszak, 5 listaelem, 3 lépés).
  - **Gyakorlati tudnivaló** — lista, lépések, nyitvatartás, táblázat, dátum, hely, pipázható pontok.
  - **Személyes** — idézet, ember, kulisszák. Mindig fotó kell hozzá.
  - **Szolgáltatási közlemény** — fennakadás, késés, helyreállt, tervezett munka, menetrend, ünnepi rend. **Csak ezekben léteznek a státuszszínek** (fennakadás, késés, rendben); máshol a színválasztó meg sem jelenik.
  - **Lapozható** (több képes) poszt — borító, belső lapok, záró lap.
  - **Rövid videó állóképei** — borító, adatkártya, gondolatkártya, záró kép. Csak állóképek: a mozgás és az időzítés nem része a modulnak.
- Minden családon belül a **formátumok**: hírfolyam (álló), négyzet, story (magas álló), széles (fekvő). Egy poszt több formátumot is tartalmazhat; mindegyiknek külön előnézete és külön kiférés-ellenőrzése van, mert más a hely.
- A tár tetején egy sáv: **„A legutóbbi 9 kiadott poszt"** háromoszlopos rácsban, ahogy a hírfolyamban látszanak. Ez ugyanaz a rács, mint a 4. pont hírfolyam-előnézete.

**Kattintásra**
- Sablonra: megnyílik a szerkesztő ezzel a sablonnal. A típuskód (közlemény, magyarázat, adat, megfigyelés, fotó, videó — a fiókban beállított rövid kódok) automatikusan a sablonból jön; a sorszámot a fiók számlálója adja az első mentéskor.
- Formátum pipára: a formátum bekerül a posztba, kap egy előnézeti fület.
- A rács egy csempéjére: a régi poszt megnyílik csak olvasásra.
- A kiemelt (jelzőszínű) sablonra: megnyílik, de azonnal egy **javaslat** jelenik meg: „Ez csak valódi indulásra vagy egy fontos eseményre való; kilenc csempéből legfeljebb egy lehet ilyen, és nem lehet két ilyen egymás mellett."

**Hiba esetén**
- Ha egy család fotót igényel, de a fiók képtárában nincs használható fotó (pl. hozzájárulás nélküli), a csempe szürke, rajta a magyarázat, és kattintásra a képtár feltöltő oldala nyílik meg — nem a szerkesztő.
- Ha a sablontár nem töltődik be: üzenet és „Újra" gomb. Semmi más nem látszik.

---

## 2. Mezők kitöltése két nyelven

**Mit lát**
- Bal oldalt az űrlap, jobb oldalt az élő előnézet. **Minden szövegmező kétszer szerepel:** első nyelv, alatta második nyelv, ugyanazzal a címkével.
- Csak azok a mezők látszanak, amik a választott sablonon rajta vannak. Tipikus mezők:
  - **Témacímke** (pl. „Város · Város" jellegű, egy sorban mindkét nyelven). Ha nem fér ki egy sorba, a rendszer magától két sorba teszi.
  - **Címsor** — a mondat, ami „beszél".
  - **Rövid címsor** (nem kötelező). Ha meg van adva, a rendszer automatikusan ezt használja, amikor a hosszú nem fér ki, és ezt jelzi is.
  - **Bevezető / magyarázat**, és ennek rövid változata (nem kötelező).
  - **Kiegészítő megjegyzés** (pl. „az adat közelítő"), és rövid változata.
  - **Lista elemei / lépések / táblázat sorai** — a sablon mutatja a felső határt. A „+ elem" gomb eltűnik, ha elértük, és a helyén egy mondat áll: „Ennél több nem fér el. Lapozhatónál a folytatás új lapra kerül; másutt a képaláírásba."
  - **Nagy szám** + mértékegység + „közelítő érték" pipa (bepipálva a szám elé a ≈ jel kerül).
  - **Forrás röviden** (a képre; legfeljebb 2 sor nyelvenként) + **teljes hivatkozás** (a képaláírásba).
  - **Döntéshozó** (nem kötelező): ha nem a fiók szervezete döntött, ide kerül a döntő intézmény neve, és a képre a fiókban beállított szövegű, „…döntése alapján" jellegű sor.
  - **Kis adatsor** (a kép alján): típuskód (automatikus), sorszám (automatikus), dátum (alapból a mai nap; időszak is megadható, ekkor gondolatjellel jelenik meg), járat/hely (nem kötelező). Széles formátumon a nyelv jele automatikusan a végére kerül.
  - **Képleírás** (ha van fotó; lásd 4. pont).

**Kattintásra**
- Mezőbe kattintva az előnézeten kiemelődik (keretet kap) az a hely, ahová a szöveg kerül.
- „Rövid változat megadása": megnyílik a rövid mező a hosszú alatt.
- „+ elem": új sor, amíg a felső határ engedi.
- Sor törlése (×): a sor eltűnik; néhány másodpercig „Visszavonás" jelenik meg.

**Beírás közben — automatikus szabályok**
- A második nyelv mezője **nem tölthető ki automatikusan** az elsőből. Nincs fordítógomb (lásd Nyitott kérdések).
- A két nyelv mindig azonos betűméretben jelenik meg; az első nyelv felül. A sablon szabja meg, melyik nyelv milyen színnel és vastagsággal jelenik meg (a fiók arculata szerint) — ez nem állítható.
- Összetett szavak a második nyelvben csak ott törhetnek, ahol a fiók elválasztási listája engedi, **és a kötőjel megjelenik**. Ha egy hosszú összetett szó nincs a listán és nem fér ki, a rendszer nem töri meg a szót: átírást kér (piros, lásd 3. pont).
- Minden ékezetes és különleges betű beírható; a rendszer semmit nem cserél ki.
- Számokban, dátumokban, sorszámokban egyforma szélességű számjegyek jelennek meg (automatikus).

**Hiba esetén**
- Üres nyelv-mező → piros keret, és a figyelmeztetések közé bekerül tiltásként: „Hiányzik a második nyelv: Címsor."
- A két nyelvben más számjegyek szerepelnek (pl. 12 és 21) → javaslat: „A két nyelvben eltérő szám szerepel."
- Túl hosszú szöveg → lásd 3. pont.

---

## 3. Kiférés-jelző — a valódi kiférést mutatja, nem becsült karakterszámot

**Mit lát**
- Minden mező mindkét nyelve alatt egy keskeny sáv, ilyen szöveggel: **„2 sor a legfeljebb 3-ból · nagy méret"**. Nem „48/60 karakter". A rendszer a fiók **valódi betűjével**, a **valódi méretlépcsőn**, a **valódi helyen** (a választott formátum szövegdobozában, fotón az arc- és kézmentes területet levonva) töri sorokra a szöveget, ugyanazzal a rajzolóval, ami a letöltést készíti. Az összetett szavak törése is benne van.
- A sáv színe:
  - **Zöld:** kifér a legnagyobb méreten, a rendszer semmit nem tett.
  - **Sárga:** kifér, de a rendszer lépett, és megmondja, mit. A lépések sorrendje kötött (ez a „kiférési lépcsősor"):
    1. kisebb méretlépcső (négy lépcső van; a legkisebb alá soha);
    2. a rövid változat használata (ha meg van adva);
    3. elrendezési lépés: fotós posztnál **osztott kivágás** (fotó felül, szövegmező alul sötét alapon); adat-, gyakorlati és személyes posztnál **egy réteg átkerül a képaláírásba**, ebben a sorrendben: megjegyzés → magyarázat → bevezető; lapozhatónál előbb a képhely csökken lépésenként, aztán **folytató lap** nyílik (a számozás folytatódik, címsor nélkül);
    4. ha ábráról van szó és a kapacitás fölött van: rangsorolt lista vagy lapozható változat felajánlása.
  - **Piros:** a lépcsősor végén sem fér ki → **átírás kell.** Tiltás.
- A jelző azt is figyeli, hogy a két nyelv sorszáma legfeljebb eggyel térhet el; ha többel, a rendszer a következő lépcsőt próbálja, és ha az sem segít, piros.
- **Árva szó** (egyetlen rövid szó az utolsó sorban): a rendszer először keskenyebb mérettel próbálja kiegyensúlyozni, aztán a következő lépcsőt; ha marad, javaslat jelenik meg „Elfogadom" gombbal. Az elfogadás naplózódik.
- Széles (fekvő) formátumon nyelvenként legfeljebb 6 szó és 3 sor; fölötte piros.
- Rövid videó felirata: **pontosan egy sor.** Ha nem fér ki, piros: „Ossza két feliratra."
- A sáv alatt szürke tájékoztató szám: „ebbe a mezőbe általában kb. N karakter fér nyelvenként". Ez csak segítség a fogalmazáshoz; a fiók indulásakor mérték ki, a fiók betűivel. **Sosem ez dönt, hanem a tényleges tördelés.**
- A rendszer **soha nem keskenyíti, nem nyújtja, nem ritkítja a betűt** azért, hogy kiférjen, és sosem tör el szót ott, ahol a szabály nem engedi.

**Kattintásra**
- A sávra: megnyílik a **„Mit próbált a rendszer"** panel — a lépcsők sorban, mindegyik mellett az eredmény (kifért / nem fért ki), és egy gyorsgomb: „Rövid változat megadása".
- Az „Elfogadom" gombra (árva szónál): a javaslat szürkévé válik, a naplóba bekerül a név és az idő.

**Hiba esetén**
- Ha a fiók betűi nem töltődtek be, a sáv szürke: „A mérés nem elérhető." A letöltés tiltva. A rendszer **nem mutat helyette becsült karakterszámot.**
- Ha a mérés több mint két másodpercig tart, a sáv „mérés…" feliratot mutat, és nem az előző eredményt.

---

## 4. Fotó — feltöltés vagy választás, kivágás, fókuszpont

**Mit lát**
- A fotós sablonokon egy fotóhely két gombbal: **„Választás a képtárból"** és **„Feltöltés"**.
- **Képtár** (csak a saját fiók fotói): minden képnél látszik a hozzájárulás állapota (van írásos hozzájárulás / nincs / nem szerepel rajta felismerhető személy), a felvétel éve, egy rövid leírás, az arc- és kézmentes területek jelölése, és hogy „utoljára használva: N poszttal ezelőtt". Szűrhető hozzájárulás szerint.
- **Feltöltés:** csak fotófájl fogadható el. A feltöltőnek két pipát kell adnia: „valódi, saját felvétel" és a hozzájárulás állapota (személy esetén a hozzájárulás rögzítése névvel, dátummal, a dokumentum csatolásával). A rendszer nem tudja ellenőrizni a fotó valódiságát: a nyilatkozatot rögzíti. Nem fogad el rajzot, gépi képet, díszített képet — ezt a feltöltő nyilatkozza, a rendszer pedig naplózza.
- **Kivágás:** a választott formátumhoz tartozó keret; a fotó húzható, nagyítható. A keret nem lóghat ki a fotóról (nem lehet üres szél).
- **Fókuszpont:** egy pont a fotón, amit minden formátum kivágása bent tart. A rendszer ebből vezeti le a többi formátum kivágását, és mindet egymás mellett mutatja; bármelyik kézzel finomítható.
- **Arc- és kézmentes területek:** a rendszer javaslatot tesz (felismerés), a munkatárs megerősíti vagy átrajzolja a dobozokat. **Szöveg soha nem kerül ezekre a területekre.** Ha a sablon a fotóra tenne szöveget és ütközne, a rendszer automatikusan **osztott kivágásra** vagy **sötét sávra** vált, és jelzi. Ha így sem fér ki: piros.
- Ha a fotón nincs arc és nincs kéz, ezt egy pipával kell megerősíteni („nincs arc vagy kéz a képen"); enélkül a fotós sablon nem menthető készként.
- **Képleírás:** egy rövid mondat mindkét nyelven, mi látszik a képen. Kötelező.
- Fotón a kis adatsor mindig fehér (automatikus). Ha a kép alján fontos tartalom van, a **„Fontos tartalom van a kép alján"** pipa a kis adatsort és az emblémát a jobb felső sarokba teszi.
- A fotón nincs díszítés: se színátmenet díszként, se matrica, se jelvény. Ha a szöveg a fotóra kerül, csak a fiók arculatában rögzített sötétítő sávra kerülhet, az olvashatóság miatt.

**Kattintásra**
- Képtár-csempére: a fotó bekerül a fotóhelyre, a kivágó megnyílik.
- Hozzájárulás nélküli fotóra személyes vagy portrés sablonnál: nem választható; a csempe megmondja, miért, és kattintásra a hozzájárulás rögzítő űrlapja nyílik meg.
- „Feltöltés"-re: fájlválasztó; feltöltés után egyből a nyilatkozat-pipák és a hozzájárulás űrlapja, aztán a kivágó.
- Fókuszpontra kattintva / húzva: a többi formátum kivágása azonnal frissül.
- „Arcdoboz átrajzolása": a doboz sarkai húzhatók; „Új doboz" gomb; a doboz törlésekor a rendszer megkérdezi: „Biztosan nincs itt arc vagy kéz?"

**Hiba esetén**
- A fotó túl kicsi a formátumhoz → visszautasítás, a szükséges legkisebb méret kiírásával.
- Nem képfájl → visszautasítás.
- Megszakadt feltöltés → üzenet, „Újra" gomb; félkész fotó nem kerül a képtárba.
- Ugyanaz a fotó vagy ugyanaz az ember a legutóbbi 10 poszt valamelyikén már szerepelt → **javaslat:** „Ugyanaz az arc tíz poszton belül csak egyszer."
- Ha a képtár nem érhető el → üzenet; a fotóhely üres marad, a poszt piszkozat marad.

---

## 5. Előnézet — valós méret és telefonnézet

**Mit lát**
- Három fül a jobb oldali előnézet fölött:
  1. **Valós méret** — 100 %-ban, görgetve ha nagyobb az ablaknál; mellette „Ablakhoz igazít" kapcsoló.
  2. **Telefonon** — egy kb. 390 képpont széles telefonkeret, benne a kép úgy kicsinyítve, ahogy a közösségi alkalmazás mutatja (a hírfolyam-szélességű kép kb. 2,77-szeresére, a széles kép kb. 4,92-szeresére kicsinyül). Alatta egy mondat: „Minden szöveg a telefonos minimum fölött van" — ezt a sablon garantálja, a fiók indulásakor beállított minimumok szerint (idősebb közönségnél megemelt minimumok).
  3. **A hírfolyamban** — a poszt a legutóbbi 9 kiadott csempe között, háromoszlopos rácsban, a rács kivágásában. Itt jelennek meg a **ritmus-javaslatok** (lásd 6. pont).
- Ha több formátum van a posztban, formátumonként külön előnézeti fül (hírfolyam, négyzet, story, széles). Story-nál a felső és alsó sáv, ahová a platform saját elemei kerülnek, be van szürkítve; a sablon oda semmi fontosat nem tesz. Széles formátumon két kép egymás mellett: nyelvenként egy.
- Lapozhatónál a lapok szalagja az előnézet alatt; a lapszámozás („02 / 06") automatikus.
- Az előnézet minden változtatásra frissül.

**Kattintásra**
- Az előnézeten egy elemre: a bal oldali űrlap a hozzá tartozó mezőre ugrik.
- Lapozható szalagon egy lapra: az a lap lesz szerkeszthető.
- „Ablakhoz igazít": kicsinyít/nagyít; a kép nem torzul.

**Hiba esetén**
- Ha az előnézet rajzolása nem sikerül, **az utolsó jó kép marad**, piros felirattal: „Az előnézet nem frissült." Sosem üres. A letöltés addig tiltva.

---

## 6. Figyelmeztetések — mi tiltás, mi javaslat

**Mit lát**
- Az előnézet alatt egy lista két részben: **Tiltások** (piros) és **Javaslatok** (sárga). Minden sor: mi a gond, hol (a mező neve), mit tegyen.
- A fejlécben a **Letöltés** gomb mellett a tiltások száma.

**Tiltások** (amíg egy is fennáll, nincs letöltés)
1. Hiányzik valamelyik nyelv egy képre kerülő mezőben.
2. Egy szöveg a kiférési lépcsősor végén sem fér ki.
3. Szöveg arcra vagy kézre kerülne, és az osztott kivágás / sötét sáv sem oldja meg.
4. Fotós sablon fotó nélkül; személyes sablon hozzájárulás nélküli fotóval; fotó arc/kéz-nyilatkozat nélkül.
5. Szolgáltatási közlemény ellenőrizetlen adattal, vagy második ellenőrző megerősítése nélkül (lásd 7. pont).
6. Emoji, zászló vagy kettőskereszt-címke a képre kerülő szövegben.
7. A kis adatsor nem fér el az embléma mellett (túl hosszú hely/járat megnevezés).
8. Széles formátum 6 szónál hosszabb címsorral; rövid videó felirata egynél több sorban.
9. A fotó túl kicsi a formátumhoz.
10. Hiányzó képaláírás valamelyik nyelven.

**Amit a rendszer eleve nem enged, ezért figyelmeztetés sem kell hozzá**
- Két jelzés egy képen (a sablon egyet tartalmaz).
- Lapozhatóban háromnál több egymást követő azonos alapú lap, vagy útmutató lapozhatóban több sötét lap, mint világos: a lap alapját választó gombok közül az a lehetőség szürke, amelyik ezt sértené, rámutatva az okkal.
- Ábra a kapacitás felett: a „+ sor" gomb eltűnik, helyette „rangsorolt lista" / „lapozható" felajánlás.
- Státuszszín nem közlemény-sablonon: nincs ilyen gomb.
- Betűméret a minimum alatt: nincs ilyen lépcső.

**Javaslatok** (letölthető, de a döntés naplózódik)
1. **Ritmus a hírfolyamban:** háromnál több egymást követő poszt ugyanazon az alapon (világos / sötét / fotós); kiemelt (jelzőszínű) csempe kilencből több mint egy, vagy egymás mellett/alatt; ugyanaz az arc tíz poszton belül; ugyanaz az elrendezés ugyanazzal a hellyel vagy ugyanazzal a fő számmal tíz poszton belül.
2. Felkiáltójel, csupa nagybetűs mondat a képre kerülő szövegben.
3. Eltérő számok a két nyelvben.
4. Elfogadott árva szó.
5. Kiemelt (jelzőszínű) sablon használata.
6. **Kiadás előtti kérdéssor** (a letöltés előtt jelenik meg, nem közlemény-sablonoknál): hat igen/nem kérdés, amit gép nem tud eldönteni — Hibáztat-e valakit a poszt? Jelmondatot tesz-e sima színre? Ígér-e nem ellenőrzött változást? Célt vagy felhívást tűz-e ki? Ad-e valaki szájába szavakat? Úgy néz-e ki, mint egy alkalmazás képernyője vagy műszerfal? A válaszok rögzülnek; a letöltést nem akadályozzák.

**Kattintásra**
- Bármelyik sorra: az űrlap a hibás mezőre ugrik, az előnézeten a hely kiemelődik.
- Javaslatnál „Tudomásul veszem": a sor szürke lesz, a napló megkapja a nevet és az időt. Tiltásnál nincs ilyen gomb.

**Hiba esetén**
- Ha az ellenőrzés nem fut le: piros sor „Az ellenőrzés nem futott le — Újra", és a letöltés tiltva.

---

## 7. A „nem ellenőrzött adat" jelölés

**Mit lát**
- Minden olyan sablonon, amin szám, dátum, időpont, ár, összehasonlítás vagy ábra van, az űrlap alján egy pipa: **„Az adatok ellenőrzöttek, a forrás megvan."** Mellette a forrás-mezők (rövid a képre, teljes a képaláírásba).

**Ha bepipálatlan marad**
- A képre automatikusan rákerül a fiók arculatában rögzített, mindkét nyelvű **„Példa — szemléltető adatok"** jellegű sor, a kis betűs, technikai réteg helyén, a forrás sorának helyére. **Ezt a sort a munkatárs nem tudja levenni** — nincs rá gomb. A képaláírásba ugyanez a megjegyzés kerül.
- Nem közlemény-sablonoknál az így jelölt poszt letölthető (a jelölés őszinte: példaként megy ki).
- **Szolgáltatási közleménynél** a letöltés **tiltva**: „Közlemény nem mehet ki szemléltető adattal."

**Ha bepipálja**
- Csak akkor marad bepipálva, ha a forrás-mezők ki vannak töltve; különben a pipa visszaugrik, és megmondja, mi hiányzik.
- A képen a szemléltető sor helyett a rövid forrás jelenik meg (legfeljebb 2 sor nyelvenként); a teljes hivatkozás a képaláírásba kerül.
- **Szolgáltatási közleménynél ezen felül kell egy második ember.** Megjelenik az **„Ellenőrzésre küldés"** gomb; kattintásra a fiók ellenőrző szerepű munkatársai listájából kell egyet választani. A poszt állapota „ellenőrzésre vár", a letöltés tiltva. Az ellenőrző a saját listájában látja, megnyitja, és **„Megerősítem"** vagy **„Javítást kérek"** (megjegyzéssel). Megerősítés után nyílik a letöltés. A szerző a saját posztját nem erősítheti meg.
- Ha megerősítés után bármelyik tényadat-mező (szám, dátum, forrás, döntéshozó) megváltozik, a megerősítés törlődik, és újra kell kérni. Színt vagy elrendezést érintő változás nem törli.

**Naplózás:** ki pipálta be, ki erősítette meg, mikor; a „javítást kérek" megjegyzés.

**Hiba esetén**
- Ha nincs a fiókban ellenőrző szerepű személy, az „Ellenőrzésre küldés" gomb szürke, rámutatva: „Nincs kijelölt ellenőrző — kérje a fiók kezelőjétől."

---

## 8. Mentés, piszkozat, változat

**Mit lát**
- A fejlécben az állapot: **„Mentve 12:03"** vagy „Mentés…". Nincs külön „Mentés" gomb a piszkozathoz: minden változás automatikusan mentődik.
- Poszt-állapotok: **Piszkozat → Ellenőrzésre vár → Kész (letölthető) → Letöltve** (dátummal, névvel).
- **„Változat mentése"** gomb: a jelenlegi állapotról név és időpont szerinti pillanatkép készül. A változatok listája oldalt: mindegyik megnyitható, összevethető az aktuálissal (két előnézet egymás mellett).
- **Napló** (a poszt oldalán): minden átírás (melyik mező, előtte/utána), a kiférési lépcsősor döntései (kisebb méret, rövid változat, réteg a képaláírásba), elfogadott árva szók, tudomásul vett javaslatok, ellenőrzés és megerősítés, letöltések. Minden sorhoz név és idő.
- Minden poszton látszik, **melyik arculat-változattal** készült (pl. „arculat 1. változat").

**Kattintásra**
- „Változat mentése": névkérő mező, mentés; a lista frissül.
- Régi változatra: megnyílik csak olvasásra; **„Visszaállítás"** gomb: az aktuális állapotból előbb automatikusan új változat készül, aztán a régi kerül vissza. Régi változat sosem törlődik.
- „Piszkozat törlése": megerősítő kérdés; a poszt a fiók lomtárába kerül. A sorszáma nem kerül újra kiosztásra.

**Hiba esetén**
- Ha a mentés nem sikerül (pl. nincs kapcsolat): piros sáv „Nem sikerült menteni — a rendszer újrapróbálja", a szerkesztés folytatható, semmi nem vész el csendben; amíg a sáv látszik, a letöltés tiltva.
- Ha két munkatárs egyszerre nyitja meg ugyanazt a posztot, a második csak olvasásra kapja, névvel: „X szerkeszti éppen."

---

## 9. Letöltés — méretek, formátumok

**Mit lát**
- A fejléc jobb szélén a **„Letöltés"** gomb. Ha van tiltás, a gomb látszik, de szürke, rajta a tiltások száma; kattintásra a tiltások listája nyílik.
- Ha nincs tiltás, kattintásra egy ablak, amiben látszik, mi kerül a csomagba:
  - **Képek formátumonként.** A méretek a fiók arculatában rögzítettek; a forrásrendszerben: 1080 képpont széles álló és négyzet formátumok, 1080 × 1920 story, 1920 × 1080 széles. Széles formátumból **két fájl**: nyelvenként egy, azonos elrendezéssel, a kis adatsor végén a nyelv jelével. Lapozhatóból lapszám szerint sorban számozott fájlok. Rövid videó állóképeiből a borító, a kártyák és a záró kép.
  - **A képaláírás szövegfájlban** (mindkét nyelv tömbje).
  - Kívánságra a poszt naplója.
- Fájlnevek a kis adatsorból: típuskód, sorszám, dátum, formátum, nyelv (javaslat; lásd Nyitott kérdések).

**Ami a letöltött fájlra igaz kell legyen**
- Képpontra ugyanaz, mint az előnézet: ugyanazok a sortörések, ugyanazok a helyek.
- A fiók saját betűivel rajzolva, sosem helyettesítő betűvel.
- Minden ékezet és különleges betű helyes.
- Semmi nincs levágva, semmi nem takar mást; az embléma ép; story-nál a felső/alsó sávban nincs fontos tartalom.
- A letöltött fájlt a rendszer eltárolja, és később **ugyanazt** adja vissza (arculatváltás után is).

**Kattintásra**
- „Letöltés indítása": a csomag elkészül és letöltődik; a poszt állapota „Letöltve", névvel és idővel; a napló bejegyzést kap.
- Egy formátum pipájának kivétele: az a formátum nem kerül a csomagba (de a posztban megmarad).

**Hiba esetén**
- Ha a rajzolás nem sikerül: üzenet, „Újra"; **részleges csomag nem készül.**
- Ha a fiók betűi nem érhetők el: a letöltés visszautasítva, „A fiók betűi nem tölthetők be" — helyettesítő betűvel semmi nem készül.
- Ha a böngésző blokkolja a letöltést: rövid útmutató, a csomag újra lekérhető a poszt oldaláról.

---

## 10. A képaláírás szövege két nyelven

**Mit lát**
- Két nagy mező: **első nyelv tömbje**, alatta **második nyelv tömbje**. Mindkettő elején a nyelv jele automatikusan ott van, nem törölhető. Az első nyelv áll elöl.
- A rendszer **előre beírja**, ami a képről ide került, és ezt jelöli is: a kiférési lépcsősorban áthelyezett réteg (megjegyzés, magyarázat, bevezető); a teljes forráshivatkozás; a „szemléltető adatok" megjegyzés, ha a pipa nincs bepipálva; a döntéshozó megnevezése. Ezek szerkeszthetők, de ha törli őket, javaslat figyelmeztet: „A képen ez a réteg már nem szerepel; a képaláírásból is kivette."
- A munkatárs ide írja: a magyarázatot, a hivatkozást (webcím), a felhívást sima mondatként, a kampányhét vagy sorozat nevét, ünnepnél az ünnep nevét mindkét hagyomány szerint. Kettőskereszt-címke itt megengedett (a képen nem).
- **Másolás** gomb mindkét tömbhöz és az egészhez.
- A mezők alatt karakterszám. (Hogy melyik platformnak mi a felső határa, nyitott kérdés — amíg nincs beállítva, csak a számot mutatja, határ nélkül.)

**Kattintásra**
- „Másolás": a vágólapra kerül; rövid visszajelzés „Másolva".
- Előre beírt rész törlésekor: javaslat jelenik meg (lásd fent).

**Hiba esetén**
- Ha valamelyik nyelv tömbje üres: tiltás.
- Ha a vágólap nem elérhető: a szöveg kijelölve marad, üzenet: „Másolja ki kézzel."

---

## 11. Amit a felület szándékosan NEM tartalmaz

- Betű-, szín- és méretválasztó; elemek szabad mozgatása; új elem hozzáadása a sablonhoz.
- Fordítógomb, „írja meg helyettem" gomb.
- Közvetlen közzététel vagy ütemezés a közösségi platformra (nincs ilyen kapcsolat a forrásokban).
- Színátmenet, jelvény, matrica, ikonkészlet, gomb-kinézetű felhívás a képen.
- Rövid videó mozgás- és időzítés-szerkesztése.

---

## Nyitott kérdések (a forrásokból nem dönthető el)

1. **Sorszám kiosztása:** az első mentéskor vagy a letöltéskor kapja a poszt? Ki vezeti a számlálót, ha kézi átvezetés is kell (a forrás jelzi, hogy a nyilvántartás gazdája nincs megnevezve)?
2. **Fájlformátum és minőség a letöltésnél:** JPG vagy PNG, milyen tömörítéssel, milyen színprofillal. A forrásokban a végleges kimenet formátuma nincs rögzítve.
3. **A hírfolyam-formátum pontos magassága** (a forrás „1080 széles" álló táblát és 3:4 rácsot említ, pontos magasságot nem).
4. **Fordítás:** kell-e gépi fordítás javaslatként a második nyelvre? A forrás szerint a második nyelvet a saját olvasóinak kell írni, nem fordítani — ezért itt nincs gomb.
5. **Ki lehet „második ellenőrző"**: szerepkör a fiókon belül, vagy bárki a szerzőn kívül?
6. **Változatok megőrzési ideje** és a lomtár ürítése.
7. **Egyidejű szerkesztés:** zárolás (ahogy fent leírtuk) vagy közös szerkesztés?
8. **Képaláírás felső határa** platformonként.
9. **Rövid videó:** a forrás szerint csak állóképek vannak; kell-e egyáltalán a modulba, vagy külön eszköz dolga?
10. **Ékezet-hiány észlelése:** kell-e figyelmeztetés, ha egy szövegben gyanúsan nincs ékezet? (Gépi észlelés bizonytalan.)
11. **Fájlnevek** végleges mintája.
12. **Kiemelt (jelzőszínű) sablon:** a forrás egy döntés-jelet tett arra, hogy a kampányszerű kiemelt sablon kivezetendő-e; itt még elérhető, javaslattal.
13. **Egy ismert hiba** a forrásrendszerben: a kötőjelet már tartalmazó összetett szó két kötőjellel törhet. A modulban ezt javítani kell, vagy az ilyen szót címsorban kerülni; a forrás „nyitott javításként" jelöli.
