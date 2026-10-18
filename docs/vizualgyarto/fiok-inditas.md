# Fiók indítása — mi történik, amikor egy új cég csatlakozik

**Röviden:** egy új fiók indulásakor a rendszer bekéri, amit a cég tud adni magáról; a beépített szabályrendszer alapján a gépi tervező megtervezi a fiók arculatát; a fiók gazdája lépésenként jóváhagyja; a rendszer **kiméri**, mennyi szöveg fér el a fiók saját betűivel; és csak ezután kapják meg a munkatársak a kész sablonokat. Minden fiók teljesen külön áll a többitől.

A gépi tervező **nem talál ki új szabályt.** A szabályrendszer (a szerepek, a minimumok, az „egy jelzés" elv, a kétnyelvűség, a forrásjelölés) minden fiókra ugyanaz; a tervező ezeket tölti ki a fiók saját anyagával.

---

## 1. Amit a rendszer bekér

A fiók gazdája (a cég kapcsolattartója) egy vezetett kérdéssort tölt ki. Ami hiányzik, azt a rendszer megmondja, és megmondja azt is, mi nem fog működni nélküle.

| # | Mit kér | Miért kell | Mi történik, ha nincs |
|---|---|---|---|
| 1 | **Alapadatok:** a szervezet neve, kapcsolattartó, a munkatársak szerepkörrel (szerkesztő / ellenőrző / fiókgazda) | A poszt naplói, a második ellenőrző kijelölése | Ellenőrző nélkül a szolgáltatási közlemény nem adható ki — a rendszer ezt a szerkesztőben jelzi |
| 2 | **Nyelvek:** első és második nyelv, ebben a sorrendben; a megszólítás módja (magázás) mindkét nyelven | Minden képre kerülő szöveg két nyelven jelenik meg, az első felül | Két nyelv nélkül a fiók nem indítható (a rendszer kétnyelvű) |
| 3 | **Iránymutatás:** arculati kézikönyv, ha van (fájlként); ha nincs, 3–5 mondatos leírás: hangnem, kinek szól, mit nem szabad | A tervező ebből érti meg a hangot | Leírás nélkül a tervező a szabályrendszer alapértelmezett, visszafogott hangját javasolja, és ezt jelzi |
| 4 | **Közönség:** kiknek szól (pl. idősebb közönség is) | A telefonos olvashatósági minimumok idősebb közönségnél megemelt szinten állnak | Válasz nélkül az emelt minimumok érvényesek (biztonságosabb) |
| 5 | **A szervezet jellege:** közszolgáltató / intézmény / vállalkozás | A „nem kampány" szabályok (nem vádol, nem jelszavaz, nem tűz ki célt) közszolgálati fiókra kötelezők | Lásd Nyitott kérdések: vállalkozásra mennyire alkalmazandó |
| 6 | **Logó:** vektoros fájl; külön az embléma (a jel önmagában) és a teljes logó (jel + név), ha léteznek; színváltozatok | A posztokon csak az embléma jelenik meg, kicsiben, jobb alul; a teljes logó csak videó záróképen | Csak pixeles logóval: a rendszer nagy, tiszta változatot kér; ha az sincs, az embléma helye üres marad és a fiók nem élesíthető |
| 7 | **Színek vagy stílusleírás:** pontos színek, ha vannak; ha nincsenek, szavakkal („nyugodt, hivatalos, kékes") | A tervező színszerepeket rendel; a kontrasztot méri | Színek nélkül a tervező javasol; a gazda dönt |
| 8 | **Fotók:** valódi felvételek; fotónként: van-e rajta felismerhető személy, van-e írásos hozzájárulás, mikor készült, mi látszik rajta | Fotós, személyes és megosztás-jellegű posztok csak valódi fotóval készülnek; szöveg sosem kerül arcra/kézre | Fotó nélkül a fotós családok zárva maradnak, a rendszer **hiányzó felvételek listáját** adja (milyen képek kellenének) |
| 9 | **Visszatérő nevek listája** mindkét nyelven (helyek, járatok, termékek, részlegek — ami rendszeresen a képre kerül) | Egységes írásmód; a szerkesztőben ajánlásként jelenik meg | Nélküle a munkatársak szabadon írják; a rendszer jelzi, hogy a lista üres |
| 10 | **Döntéshozó intézmények** neve és a „…döntése alapján" sor pontos szövege mindkét nyelven | Ha nem a fiók szervezete dönt, ez a sor kerül a képre | Nélküle a szerkesztőben a „Döntéshozó" mező nem jelenik meg |
| 11 | **A szemléltető-adat sor** pontos szövege mindkét nyelven (a rendszer javaslatot ad) | Ez kerül a képre, ha az adat nincs ellenőrizve | Nélküle a javasolt szöveg érvényes |
| 12 | **Ünnepek, hagyományok**, amiket a fiók megnevez (mindkét nyelven, dátummal) | Ünnepi posztokhoz | Nem kötelező |
| 13 | **Nyelvi ellenőr** személye (aki a második nyelv elválasztási listáját és a névlistát jóváhagyja) | A hosszú összetett szavak törése csak ember által ellenőrzött listáról történhet | Nélküle az elválasztási lista üres: minden nem kiférő hosszú szó átírást kér |
| 14 | **Számláló gazdája:** ki felel a poszt-sorszámokért | A sorszám-nyilvántartás egyértelmű felelőse | Nélküle a fiókgazda a felelős (alapértelmezés) |

**Hiba esetén a bekérésnél:** hibás vagy hiányos fájl (pl. nem nyitható logó) → azonnali üzenet, mi a gond, mit fogad el a rendszer. A félbehagyott kérdéssor mentődik, később folytatható.

---

## 2. Amit a gépi tervező ebből megtervez

A tervező a szabályrendszer minden pontját a fiók anyagával tölti ki. Amit nem enged a szabály, azt a tervező sem javasolhatja.

1. **Betűszerepek.** Három szerep, mindegyikhez egy betű és vastagság:
   - a **beszélő** (címsor, jelmondat, idézet) — az első nyelv vastagabb, a második valamivel könnyebb vastagsággal, azonos méretben;
   - az **ismertető** (magyarázat, lista, táblázat, nevek);
   - a **technikai** (minden szám, idő, dátum, kód, forrás-sor, kis címke): keskeny, csupa nagybetűs, egyforma szélességű számjegyekkel. **Sehol nincs írógép-szerű (egyenlő szélességű) betű**, mert attól a poszt programkódnak vagy műszerfalnak látszik.
   - Legfeljebb egy-két betűcsalád. Ha a cég kézikönyve olyan betűt ír elő, ami valamelyik szerepre alkalmatlan (pl. nincs keskeny vagy nincs elég vastagság), a tervező ezt jelzi és a legközelebbi megfelelőt javasolja.
2. **Méretek.** A méretrendszer nem tervezési kérdés, hanem adott: címsor négy méretlépcsőn, bevezető, felirat, címke, kis adatsor, nagy szám, ábrafelirat — mindegyiknek van telefonos olvashatósági minimuma (idősebb közönségnél megemelve), a széles formátumon mindegyik arányosan nagyobb. A tervező ezek fölött választ, alattuk soha.
3. **Színszerepek** (nem „színek", hanem szerepek):
   - nyugodt világos alap (magyarázó, gyakorlati, személyes posztok);
   - komoly sötét alap (fotók sötétítő sávja, komoly témák);
   - fő sötét szín (szöveg világos alapon);
   - **egy jelzőszín** — ez a fiók „jele"; a második nyelv színe is ez sötét alapon;
   - a második nyelv színe **világos alapon**: a jelzőszín mélyebb változata, mert a jelzőszín világos alapon rendszerint nem elég olvasható;
   - szövegszín és halvány szín világos alapon; halvány szín és vékony vonal sötét alapon;
   - **státuszszínek** (fennakadás, késés, rendben) — csak ha a fiók szolgáltatási közleményeket ad ki; mindig szóval együtt, sosem csak színnel.
   - Minden szöveg–alap párra a tervező **kontrasztot mér**; ami nem éri el a küszöböt, azt nem használja, és a jóváhagyó képernyőn kiírja, mit miért nem.
4. **Embléma.** Három változat: sötét alapra, világos alapra, jelzőszínre. Fix méret és hely (jobb alul, fix margó; ha a kép alján fontos tartalom van, jobb felül). A teljes logó csak videó záróképen, sosem jelmondattal együtt, sosem hírfolyam-képen.
5. **Egy jelzés kompozíciónként.** A jelzés formái (pont a témacímke mellett, rövid vonal a címsor fölött, egy kiemelt sor/oszlop/szám, ív a kiemelt módban, nyitó idézőjel) a fiók jelzőszínével és formavilágával; de az elv fix: **pontosan egy** jelzés egy képen. Az embléma nem jelzés.
6. **Elrendezés-családok és formátumok.** Kijelentés (fotós / sötét / világos / kiemelt), adatposzt (hat ábrafajta, mindegyik kapacitással), gyakorlati, személyes, szolgáltatási közlemény, lapozható, story, széles, videó-állóképek. Story-nál a felső és alsó biztonsági sáv; fotós posztnál az osztott kivágás; útmutató = világos alap + legalább egy valódi fotó. A margók és a rácstávolságok a szabályból jönnek.
7. **Kis adatsor nyelvtana.** Típuskódok (a fiók nyelvén rövid kódok: pl. közlemény, magyarázat, adat, megfigyelés, fotó, videó), futó sorszám típusonként, dátum, opcionális hely/járat, széles formátumon a nyelv jele. Témacímkék kétnyelvű listája.
8. **Szövegszabályok** a fiók nyelvein: magázás, mondatkezdő nagybetű (csupa nagybetű csak a technikai rétegben), 24 órás idő, a képen nincs emoji/zászló/kettőskereszt-címke, nincs felkiáltójel, nem vádol, nem talál ki idézetet, a döntéshozói sor és a szemléltető-adat sor szövege, a képaláírás szerkezete (két tömb, nyelvjellel).
9. **Mintaposztok.** Egy vegyes minta-hírfolyam (15–20 poszt minden családból és formátumból), a fiók valódi fotóival — ahol nincs fotó, ott feliratozott helykitöltővel és pontos fotó-leírással —, háromoszlopos rácsra téve. Ez a jóváhagyás alapja.

---

## 3. A kimérés — melyik lépésben, mit

**Mikor:** miután a betűk, a méretek, a margók, a formátumok és az elrendezések rögzültek és jóvá vannak hagyva (4. szakasz, 2. és 3. jóváhagyás után) — és **mielőtt** a sablonok a munkatársakhoz kerülnek. Újra lefut minden olyan arculat-módosítás után, ami betűt, méretet, margót, formátumot vagy elrendezést érint.

**Miért nem elég egy általános szám:** ugyanaz a mondat más betűvel más hosszú. A forrásrendszerben a második nyelv 5–15 %-kal hosszabban fut az elsőnél, és a szabály ott is az, hogy **a második nyelv szövegét mérni kell, nem becsülni.** Egy másik fiók számai itt nem használhatók.

**Mit mér ki a rendszer** — minden sablon × formátum × szövegmező × nyelv kombinációra, a fiók saját betűfájljaival, ugyanazzal a rajzolóval, amit a szerkesztő és a letöltés használ:
1. hány sor és soronként mennyi szöveg fér a mezőbe **minden méretlépcsőn**;
2. a második nyelv **tényleges hosszabbodási aránya** az elsőhöz képest, egy próbaszövegkészleten (nem feltételezve);
3. a kétnyelvű címkék egysoros kapacitása (mikor esik két sorba);
4. a széles formátum szó- és sorkorlátja;
5. a rövid videó feliratának egysoros kapacitása;
6. a kis adatsor legnagyobb hossza az embléma mellett;
7. az ábra-kapacitások az adott betűvel (oszlopok, sávok, listaelemek, lépések) és az ábrafeliratok hossza, ami fölött a rövid feliratra kell váltani;
8. az árva-szó küszöbök;
9. a második nyelv **elválasztási listája**: a rendszer javaslatot tesz a hosszú összetett szavak törési pontjaira; ez a lista csak a nyelvi ellenőr jóváhagyása után él.

**Eredmény:** egy **„Ennyi fér ki"** táblázat, amit a fiókgazda tájékoztatásként lát (nem szerkeszthető), és a fiók kiférési szabályai, sorszámozott változattal. A szerkesztő kiférés-jelzője a szürke „kb. N karakter" tájékoztató számot innen veszi; **a tényleges kiférést viszont mindig újra kiméri** az adott szövegre.

**Hiba esetén:** ha valamelyik kötelező mező egy formátumon a legkisebb lépcsőn is túl szűk (pl. egy szó sem fér ki), a rendszer nem élesíti a fiókot, hanem visszaküld a betű/méret lépéshez, a mező és a formátum megnevezésével.

---

## 4. Amit a felhasználónak jóvá kell hagynia

Lépcsők, sorrendben. Minden lépcsőn: **Jóváhagyom / Módosítást kérek** (megjegyzéssel). Módosításkérésnél a tervező új javaslatot ad ugyanarra a lépcsőre. A korábbi lépcsőkhöz vissza lehet lépni; ilyenkor az utána lévők újra jóváhagyandók.

1. **Visszaolvasás.** Mit értett meg a tervező: hangnem, közönség, nyelvek és sorrendjük, a szervezet jellege, mi tilos. Egy oldal, egyszerű mondatokban.
2. **Betűk, színek, embléma.** A javaslat mellett a kontraszt-jelentés (minden párra: megfelel / nem használható), és egy telefonméretű minta minden betűszerepre. Egy nem megfelelő szín–alap pár nem hagyható jóvá: a gomb szürke, az ok kiírva.
3. **Elrendezések a minta-hírfolyamon.** A vegyes minta rácson és telefonon. Mellette a **13 kérdéses minőségpróba** (felismerhető-e a márka vegyes hírfolyamban; különböznek-e a témák hangulatban; valódinak hat-e a fotó; olvasható-e telefonon; bírja-e a rövid és a hosszabb szöveget; nem tűnik-e kampánynak; nem tűnik-e alkalmazásnak; nincs-e gépi kép; felismerhető-e a logó anélkül, hogy uralkodna; tud-e holnap posztot csinálni belőle egy munkatárs; használható-e a videórendszer; ábra műszerfal nélkül; 10–20 poszt együtt nem ismétlődik-e) — a rendszer minden kérdésre ítéletet ír: megfelel / feltétellel / még nem, indoklással. „Még nem" ítélet mellett a fiók élesíthető, de az érintett családok zárva maradnak, és a rendszer megmondja, mi kell a nyitásukhoz (tipikusan: fotók).
4. **Kimért korlátok.** Az „Ennyi fér ki" táblázat tudomásulvétele. Ha a gazda szűknek találja, a megoldás nem a szám átírása, hanem visszalépés a 2. lépcsőre (más betű vagy méretlépcső).
5. **Nyelvi ellenőrzés.** A nyelvi ellenőr jóváhagyja az elválasztási listát és a névlistát. Ez a lépcső a fiókgazdától független személyhez van kötve, ha meg van adva.
6. **Szervezeti beállítások.** Típuskódok, számláló gazdája, ellenőrző szerepű személyek, döntéshozói sor, szemléltető-adat sor szövege.
7. **Élesítés.** A sablonok elérhetők a munkatársaknak; a rendszer rögzíti: **arculat 1. változat**, dátummal, a jóváhagyó nevével. Minden ezután készülő poszt ezt a számot viseli.

---

## 5. Ha később módosul az arculat

Az arculat módosítása a fiókgazda joga, ugyanazon a lépcsősoron megy át, mint az indítás — csak a változó lépcsők nyílnak újra. Amíg a módosítás nincs jóváhagyva, a munkatársak a régi arculattal dolgoznak tovább.

**A módosítás fajtái és hatásuk**

| Mi változik | Kimérés újra? | Piszkozatok | Kiadott (letöltött) posztok |
|---|---|---|---|
| Csak szín | nem | újrarajzolva az új színnel; kiférési figyelmeztetés ebből nem keletkezhet | változatlanok |
| Embléma | nem | az új emblémával rajzolva | változatlanok |
| Betű, méret, margó, formátum, elrendezés | **igen, élesítés előtt** | újra ellenőrizve az új korlátokkal; ami nem fér ki, piros jelölést kap; a szerző javítja | változatlanok |
| Szövegszabály (pl. a szemléltető-adat sor szövege) | nem | az új szöveggel rajzolva | változatlanok |
| Nyelv cseréje vagy hozzáadása | igen, és a nyelvi lépcső is | lásd Nyitott kérdések | változatlanok |

**Szabályok**
- **A kiadott poszt sosem változik.** A letöltött fájlt a rendszer eltárolta; újbóli letöltés ugyanazt a fájlt adja, akkor is, ha az arculat azóta más. A poszt adatlapján látszik, melyik arculat-változattal készült.
- **Semmi nem változik csendben.** Jóváhagyás előtt a rendszer kiírja: hány piszkozatot érint a módosítás, és ebből hány nem fér ki az új korlátokkal. A jóváhagyó ezt látja, mielőtt igent mond.
- **Egy fióknak egyszerre egy élő arculata van.** Piszkozat nem „ragadhat" a régi arculaton: élesítés után minden piszkozat az újjal rajzolódik. (Hogy kell-e türelmi idő, nyitott kérdés.)
- **Az ellenőrzés nem vész el ok nélkül.** Az „ellenőrzésre vár" vagy megerősített posztok megerősítése megmarad, ha csak a kinézet változott; ha a módosítás miatt egy réteg a képaláírásba került, a szerzőnek újra át kell néznie, és ezt a rendszer jelzi.
- **Ami nem változik:** a fotótár és a hozzájárulások, a névlista, az elválasztási lista (az a nyelvhez tartozik, nem a betűhöz), a sorszámok, a hírfolyam-előzmény (a legutóbbi 9 csempe), a naplók.
- **Arculat-változatok listája** a fiók beállításaiban: sorszám, dátum, jóváhagyó, mi változott. Régi arculat-változat megtekinthető, de nem állítható vissza egy gombbal (vissza-módosítás = új változat, ugyanazon a lépcsősoron).

**Hiba esetén:** ha a módosítás kimérése hibát talál (egy kötelező mező egy formátumon nem használható), a módosítás nem élesíthető; a rendszer megnevezi a mezőt és a formátumot.

---

## 6. A fiókok elkülönítése

**Fiókonként külön** (egyik fiók semmit nem lát a másikból): betűfájlok (csak a saját fiókban töltődnek be), színszerepek, embléma, elrendezés-beállítások, kimért kiférési szabályok, elválasztási lista, névlista, típuskódok és számlálók, fotótár és hozzájárulások, felhasználók és szerepek, piszkozatok, változatok, naplók, hírfolyam-előzmény, arculat-változatok.

**Minden fióknál közös** (a rendszer része): a szabályrendszer maga — a betűszerepek elve, az olvashatósági minimumok, a kiférési lépcsősor logikája, az „egy jelzés" elv, a kétnyelvűség, a forrásjelölés, az ellenőrző listák.

**Soha:** egyik fiók fotója, betűje, szövege, neve nem jelenhet meg a másik fiókban — a tervező javaslataiban sem. A gépi tervező egy új fiók arculatát **kizárólag annak a fióknak a bemeneteiből** és a szabályrendszerből készíti.

---

## Nyitott kérdések (a forrásokból nem dönthető el)

1. **Vállalkozás-típusú fiók:** a „nem kampány" szabályok (nem tűz ki célt, nem hív fel, nem jelszavaz) közszolgálati hírfolyamra készültek. Vállalkozásnál teljes egészében, részben vagy egyáltalán nem érvényesek?
2. **Pixeles logó:** átrajzolhatja-e a tervező vektorosra, vagy csak a cég adhat?
3. **Hány alternatív javaslatot** adjon a tervező egy lépcsőn (betű, szín), és hányszor kérhető módosítás?
4. **Idősebb közönség küszöbe:** mitől számít a közönség „idősebbnek"? A forrásban a megemelt minimum egy adott fiók döntése volt.
5. **A minimumok forrásértékei** (telefonos küszöb, emelés mértéke, széles formátum szorzója) a forrásrendszerből átvehetők; kérdés, hogy fiókonként állítható-e az emelés, vagy csak igen/nem.
6. **Nyelv cseréje élő fiókban:** engedélyezett-e, és mi legyen a régi nyelvű piszkozatokkal?
7. **Türelmi idő arculatváltásnál:** kell-e pár nap, amíg a régi arculattal még letölthető egy elkezdett piszkozat?
8. **Elválasztás más második nyelvekre:** a forrásrendszer összetett-szó törési logikája egy adott nyelvre készült. Más nyelvpárra a lista-elv marad, de a törési javaslatokat ki adja?
9. **Közös szabálymódosítás:** ha a rendszer szintű szabályrendszer változik (pl. új minimum), visszahat-e a meglévő fiókokra automatikusan, vagy csak a következő arculat-módosításkor?
10. **Hiányzó felvételek listája:** mennyire részletes (a forrás konkrét felvételi listát említ egy fiókra); ezt a tervező vagy egy ember állítja össze?
11. **13 kérdéses minőségpróba:** a forrásban ember ítéli meg; itt a tervező ad ítéletet, de kérdés, mely kérdéseknél kell emberi döntés is (pl. „valódinak hat-e a fotó").
12. **Sorszám-nyilvántartás** gazdája a forrásban nincs megnevezve; itt alapértelmezés a fiókgazda.
