# Rajz-feladat a Claude Designnak — R-5 · Előfizetés és számlázás

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba.
Ami hiányzik vagy gyanús: kérdés Vilmoshoz, nem improvizáció.
Előzmény: `design/r1-kezdokepernyo/` (a Gépház és a Modulok lenyíló onnan jön), `r4-rendszerbeallitasok/`.

---

## 1. Miért kell ez a képernyő

A rendszer ma **megmondja, mibe kerül egy ügyfél** — a Költség lap mutatja a hívásszámot, az
AI-gépidőt és a becsült költséget munkaterenként, és van havi keret is. Ami hiányzik mögüle:
**csomag, ár, számla.** A nyitólapon ma szó szerint `[ÁRAZÁS — még nincs meghatározva]` áll.

## 2. Vilmos döntései — ezek rögzítettek (2026-09-11)

**D1 · A csomagok gerince a MODULOK, nem a korlátok.** Nem a hírfigyelőre árazunk. A magasabb
csomag **több online marketing eszközt** ad — a korlátok (tagszám, napi cikk, AI-keret) csak
kiegészítő méretezés. Ez a termék eredeti ígérete: a kommunikációs vezető **teljes** munkája,
nem egy funkció.

**D2 · Az árak most fiktívek, és adminból állíthatók.** Az árlista és a csomag-modul
hozzárendelés **adat, nem beégetett érték** — ugyanúgy, ahogy a téma tokenjei és a felület
feliratai is adatból jönnek. A valódi árakat Vilmos később a felületen írja át, kód módosítása
nélkül.

**D3 · A fizetés inaktív módban van bekötve.** A fizetési csatlakozó **létezik és működik**, de
az alapértelmezett szolgáltatója a **`teszt`**, ami nem mozgat pénzt. Ugyanaz a minta, mint az
AI-nál: a hívó **feladatot** kér (előfizetés indítása, csomagváltás, lemondás), nem szolgáltatót,
és a valódi fizetésre váltás később egyetlen beállítás. Így a gombok mögött **van** gépezet —
nem sérül a „halott vezérlő tilos" szabály —, csak nem valódi pénz mozog.
**Következmény, amit a rajznak ki kell mondania:** a felület nem tehet úgy, mintha fizetne.
Amíg a csatlakozó teszt módban van, állandó, jól látható sáv mondja meg: *próbaüzem, valódi
fizetés nem történik.*

## 3. A modulok — a csomagok gerince

**Ez a lista helykitöltő, Vilmos írja felül.** A sorrendje a kommunikációs munka menetét követi:
figyel → tervez → ír → rajzol → jóváhagy → kiküld → mér.

| Modul | Mit csinál | Állapot ma |
|---|---|---|
| **Hírfigyelő** | forrásfigyelés, ismétlésszűrés, AI-értékelés, tartalomötlet | **kész és él** |
| **Tartalomtervező** | témák és ötletek a profilból, naptárba rendezve | nincs megépítve |
| **Szövegíró** | poszt, hírlevél, cikk a profil hangnemében | nincs megépítve |
| **Vizuálgyártó** | képek az arculatból | nincs megépítve |
| **Jóváhagyás** | belső kör: javaslat → vélemény → jóváhagyás | nincs megépítve |
| **Ütemezés és közzététel** | naptár, kiküldés a csatornákra | nincs megépítve |
| **Riport** | mi ment ki, mi teljesített | nincs megépítve |

**A rajzon minden modul mellett látszik, hogy elérhető-e már vagy készül.** A csomagszerkesztőben
a rendszergazda ki tudja pipálni, melyik modul melyik csomagban van — de a „készül" állapotú
modul ettől még nem működik, és ezt a felület kimondja. **Ez nem halott vezérlő: ez egy árlista,
ami őszintén megmondja, mi van kész.**

## 4. A fiktív árlista — helykitöltő, nincs mögötte piackutatás

**Ezeket a számokat én találtam ki, hogy a rajznak legyen mit mutatnia.** Nem ajánlás:
a valódi árazás üzleti döntés, és Vilmosé.

| | **Indulás** | **Műhely** | **Szerkesztőség** | **Godlike** |
|---|---|---|---|---|
| Havi díj | 490 lej | 1 290 lej | 2 900 lej | 6 900 lej |
| Egyszeri bevezetés | 1 900 lej | 1 900 lej | 1 900 lej | **benne van** |
| **Hírfigyelő** | ✓ | ✓ | ✓ | ✓ |
| **Tartalomtervező** | — | ✓ | ✓ | ✓ |
| **Szövegíró** | — | ✓ | ✓ | ✓ |
| **Vizuálgyártó** | — | — | ✓ | ✓ |
| **Jóváhagyás** | — | — | ✓ | ✓ |
| **Ütemezés és közzététel** | — | — | — | ✓ |
| **Riport** | — | — | — | ✓ |
| Munkaterek | 1 | 1 | 1 | **5** |
| Tagok | 2 | 5 | 15 | korlátlan |
| Források | 3 | 10 | korlátlan | korlátlan |
| Napi cikk | 20 | 60 | 200 | 600 |
| Napi futás | 1× | 1× | 2× | **4×** |
| AI-keret | 5 USD / hó | 20 USD / hó | 60 USD / hó | 200 USD / hó |

A korlátok nem a levegőből jönnek: a napi cikkszám és az AI-keret **ma is létező fékek** a
rendszerben (`HF_NAPI_CIKK`, a szervezetenkénti keret). A tagszám, a forrásszám, a munkaterek
száma és a napi futások száma új korlát lenne.

**Pénznem:** lej, mert az ügyfelek romániaiak. Az AI-költség a Költség lapon **dollárban** marad,
mert a szolgáltató úgy számláz — a kettőt nem keverjük össze, és a rajz se keverje.
A pénznem is állítható legyen adminból.

### 4.1 Mi teszi a Godlike-ot mássá

A modulokon túl négy dolog, mind a rendszer **valódi szűkössége** mentén:

1. **Több munkatér egy előfizetésen** (5 db). Egy ügynökség több márkát kezel.
2. **Napi többszöri figyelés** (4×). Ma a napi futás egyszeri, és ez a beállításban rögzített.
3. **Elsőbbség az AI-sorban.** A rendszer **egyszerre egy munkát futtat** az egész házban — ez
   mérve van. Aki elsőbbséget kap, előbb kerül sorra, ha többen várnak.
4. **A bevezetési díj benne van.**

### 4.2 Amit egyik csomag sem ígérhet — és a rajz se sugallja

**„Korlátlan cikk" nincs.** A terhelési mérés szerint egy cikk feldolgozása **5,8 másodperc
AI-idő**, és a rendszer egyszerre egy munkát futtat. A 600 cikkes napi korlát önmagában **közel
egy óra AI-időt** jelent egyetlen ügyfélre — ebből a csomagból tehát **kevés fér el**. A Godlike
drága és ritka csomag, nem tömegtermék.

A „korlátlan forrás" viszont igaz állítás, mert a valódi féket a napi cikkszám adja.

## 5. Két nézet, mint a Költség lapnál

### 5.1 Gépház → Csomagok és árak (csak rendszergazda)

- a **négy csomag** egymás mellett, **minden mezője szerkeszthető**: név, havi díj, egyszeri díj,
  a korlátok, **és hogy mely modulok tartoznak bele**
- **a modul-katalógus**: a modulok listája, mindegyiknél az állapota (elérhető / készül)
- új csomag létrehozása
- csomag **elrejtése** — nem törlés. A meglévő ügyfelek maradhatnak rajta, újat nem lehet rá kötni
- **melyik munkatér melyik csomagon van**, és mikortól
- **a fizetési csatlakozó állapota**: teszt vagy élő — kimondva, nem ikonnal

### 5.2 Munkatér → Előfizetés (a tulajdonosé; a szerkesztő és a néző nem látja)

- melyik csomagon vagyok, **mely modulokat kapom**, mikor újul meg
- **mely modulokat NEM kapom**, és melyik csomagban lennének benne (lásd 7.6)
- a havi használatom a korlátok ellen: hány tag, hány forrás, napi cikk, AI-keret — mennyi fogyott
  el belőle. Ez a Költség lap adataiból jön, nem új mérésből
- csomagváltás
- **számlázási adatok**: cégnév, adószám, cím, számlázási e-mail
- **számlák listája** — ma nincs egy sem; a rajzon ez az üres állapot, kimondva, miért
- a próbaüzem-sáv (D3)

## 6. Amit MEG KELL ÉPÍTENI — ma nincs meg

- **modul-katalógus**: a modulok mint adat, állapottal (elérhető / készül)
- **csomag-tábla** (név, árak, korlátok, **modulok**, rejtett-e), és a munkatér hozzárendelése
- **a modul-hozzáférés érvényesítése**: amit a csomag nem tartalmaz, ahhoz a munkatér nem fér hozzá —
  se a felületen, se a végpontokon
- számlázási adatok tárolása munkaterenként
- **fizetési csatlakozó**, `teszt` alapértelmezéssel, az AI-csatlakozó mintájára
- a korlátok érvényesítése: tagszám (R-2), forrásszám, napi cikk, AI-keret
- a „fizetésre vár" állapot és a hatása (7.2)
- **a Godlike három új képessége** (4.1): több munkatér egy előfizetésen · napi többszöri figyelés ·
  **elsőbbség az AI-sorban**. Az utolsó a legnagyobb falat: a mai sor egyszerre egy munkát enged,
  és nem ismer elsőbbséget — ez új gépezet a várólistában.

## 7. A szabályok, amiknek a rajzon látszaniuk kell

**7.1 · A próbaüzem kimondva.** Amíg a csatlakozó teszt módban van, minden előfizetéssel
kapcsolatos képernyőn ott a sáv: *valódi fizetés nem történik.* Ez nem apró betű.

**7.2 · Mi történik, ha nincs fizetés** — javaslat, Vilmos átírhatja: a munkatér **„fizetésre vár"**
állapotba kerül. A **figyelés leáll**, az **adat megmarad**, a felület **kimondja, mi történt és
mi a teendő**. Nem törlünk, nem zárunk ki senkit a saját adatából.

**7.3 · A korlátok túllépése ne csendben történjen.** Ha valaki a csomagja határára ér, a felület
megmondja, **melyik korlát** és **mi a következménye**.

**7.4 · Az árváltoztatás a meglévő ügyfélre nem hat visszamenőleg.** A rajz mondja meg, mikortól
él: a következő megújulástól.

**7.5 · Az AI-keret kétféle szám.** A csomagban a **havi keret** áll, a Költség lapon a **tényleges
fogyás**. Ugyanaz az érték két nézetben — a rajz ne gyártson harmadikat.

**7.6 · A nem járó modul látszik, de zárva.** Nem tüntetjük el: az ügyfélnek tudnia kell, mi
létezik. A zárt modul megmondja, **melyik csomagban van benne**, és ha még nem készült el, azt is,
hogy **készül**. Ez nem halott vezérlő — ez egy ajtó, ami megmondja, mi van mögötte.

**7.7 · A „készül" állapotú modult nem lehet eladni késznek.** Ha egy csomag olyan modult
tartalmaz, ami még nincs megépítve, az az előfizetés lapján is **készül**-ként látszik. Az árlista
nem ígérhet többet, mint ami van.

## 8. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | **Gépház → Csomagok és árak**: a négy csomag egymás mellett a modul-mátrixszal, egy közülük szerkesztés alatt. A Godlike legyen megkülönböztetve, de ne harsány — ez belső adminfelület, nem értékesítési oldal | asztali 1440 |
| 2 | **Gépház → Modul-katalógus**: a hét modul, állapottal; alatta melyik munkatér melyik csomagon van, és a fizetési csatlakozó állapota (teszt) | asztali 1440 |
| 3 | **Munkatér → Előfizetés**: a jelenlegi csomag, a járó és a **zárt** modulok, a használat a korlátok ellen, számlázási adatok, üres számlalista, próbaüzem-sáv | asztali 1440 |
| 4 | **Csomagváltás** megerősítéssel: **mely modulok jönnek és mely modulok vesznek el**, mikortól | asztali 1440 |
| 5 | **„Fizetésre vár" állapot**: mi áll le, mi marad, mi a teendő | asztali 1440 |
| 6 | Munkatér → Előfizetés | telefon 390 |

## 9. Kötelező szabályok a rajzhoz

- **Csak tokenből.** Nincs beégetett szín, betű, betűméret, lekerekítés, térköz. Ha új érték kell,
  ne pixelben írd be: adj vissza külön listát, mi az új token, mi az alapértéke és miért kell.
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven: magyar, román, angol.
  Az alapnyelv az angol.
- **Az árak, a csomagnevek és a modulnevek NEM feliratok, hanem adat.** A rajzon konkrét értékek
  álljanak, de az átadó mondja ki, hogy ezek adatból jönnek, nem szövegből.
- **Halott vezérlő tilos.** Csak olyan gomb kerülhet a rajzra, aminek a 6. pont szerint lesz
  mögötte gépezet — a teszt módú fizetés is gépezet.
- **Sötét felület** — a világos változat a tokenekből jön.
- **Illeszkedjen a Költség laphoz** — ez annak a testvére: ott a fogyás látszik, itt a keret és az ár.
- **A megerősítő sáv a képernyő aljára rögzüljön**, ne a kártya aljára (E-50 tanulsága).

## 10. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **minden szöveg kulccsal, három nyelven** — a próbaüzem-sáv, a „fizetésre vár" és a zárt modul
  szövege is
- **mely tokeneket használtad**; ha új kell, külön lista indoklással
- melyik szám melyik adatból jön (az 5. és 6. pont neveivel), és melyik szerkeszthető adminból
- hogyan viselkedik a modul-mátrix, ha egyszer tíz modul lesz, nem hét
- telefonon mi marad el és mi tör sorba
