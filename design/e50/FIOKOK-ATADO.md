# Fiókok — átadó

Rendszergazda-lap a Kommunikációs munkatérhez. `Fiokok.dc.html` + `admin-i18n.js`. Két artboard egy fájlban: asztali 1440, telefon 390 (canvas mód, mint a Nyitólapnál).

## Hol van a lapon

A lap a belső felület fejlécét használja (K-jel, terméknév, „rendszergazda" jelölés, Theme / Feliratok / Költség / **Fiókok** navigáció, nyelvválasztó). A tokenkészlet változatlan: `tema-alap.json` + `km-theme.js`, ugyanaz a betöltési sorrend, mint a Theme és a hírfigyelő lapon.

**Új tokent nem vezettem be.** Minden szín, méret, lekerekítés és térköz a meglévő készletből jön; a `font-size:` után mindenhol közvetlenül token áll.

## Két lista, egy lap

Fülváltás **Fiókok** és **Munkaterek** között — nem külön lap, mert ugyanaz a keresés, rendezés és részletpanel szolgálja ki mindkettőt.

Fiók-oszlopok: e-mail + név · létrejött · utolsó belépés · élő belépések · nyelv · munkaterek szereppel · állapot (aktív / felfüggesztve, plusz rendszergazda-jelvény).
Munkatér-oszlopok: név + van-e jóváhagyott profil · létrejött · tulajdonos · hírfigyelő-beállítás · források · AI-hívás (hó) · költség (hó) · havi keret.

Ez pontosan a felsorolt adatkészlet. Semmi más nem került rá: nincs grafikon, nincs trend, nincs „aktivitás" mérőszám, mert ilyen adat nincs a rendszerben.

Egyetlen szám nem sorból jön: a **67 fiók / 56 próbafiók** összesítés a fejlécsorban — ezt te adtad meg. A táblázat sorai fiktív mintaadatok, felismerhetően: minden e-mail `[MINTA]` vagy `[MINTA-TESZT]` tartományba mutat.

## A próbafiók elkülönítése — amit a rajz kimond

A szűrő három állapotú (Mind / Valódi / Próbafiók), de a lap **kiírja, hogy a jelölés bizonytalan**, és megmondja, mi alapján dolgozik:

> A fiókon ma nincs olyan mező, ami ezt megmondaná. A szűrő addig az e-mail mintájából dolgozik: **[SZABÁLY — a gépi teszt által használt címminta]**. A találgatás helyett a fiók kapjon egy „eredet" értéket a létrehozáskor (ember / gépi teszt).

A sorban ezért nem „próbafiók", hanem **„próba?"** áll, figyelmeztető színnel. Ez szándékos: nem állítunk biztosat olyan adatról, ami nincs. A szögletes zárójeles rész akkor cserélhető konkrét szabályra, ha megmondod a teszt-futtató címmintáját — vagy eltűnik, ha bekerül az „eredet" mező.

## Veszélyes műveletek

Négy művelet van, mind megerősítést kér, és a megerősítés **megmondja, mi történik utána**:

| Művelet | Amit a megerősítés kimond |
|---|---|
| Felfüggesztés | Nem tud belépni, az élő belépései megszűnnek, az adatai és munkaterei megmaradnak, bármikor visszavonható |
| Visszavonás | Újra be tud lépni, de új belépést kell kezdeményeznie — a régiek nem élednek fel |
| Rendszergazda-jelölés adása | Látni fogja a négy rendszergazda-lapot, és más fiókokon is végezhet műveletet; a saját munkatereihez való hozzáférése nem változik |
| Jelölés elvétele | Nem látja a rendszergazda-lapokat; a saját hozzáférése nem változik |

**Külön eset:** ha a saját fiókodról veszed el a jelölést, piros figyelmeztetés jön — azonnal elveszted a hozzáférést, és csak adatbázisból lehet visszaadni. Ma egyetlen rendszergazda van, ez tehát valós kizárási kockázat.

A megerősítés gombja a felfüggesztésnél hibaszínű keretes, a jelölésnél elsődleges — a szín mellett a szöveg is jelöli a súlyt.

## Havi AI-keret

A munkatér részletpaneljén szerkeszthető, ahogy kérted: „ma is működik a Költség lapon — itt csak elérhető helyen legyen". Üresen hagyva az alapérték érvényes, és a mező alatt ott van, hogy ugyanez az érték a Költség lapon is látszik. **Nem duplikált funkció, ugyanaz az érték.**

## Nyelvek

Minden látható szöveg az `admin-i18n.js`-ből jön, stabil kulccsal, három nyelven; alapnyelv angol, tartaléknyelv szintén angol (a rendszer többi lapjával egyezően). Dátum, szám és pénznem `Intl`-lel, a választott nyelv szerint.

A hosszabb román és angol szöveg kezelése: az oszlopok `fr` arányúak, nem fix szélességűek; minden szöveges cella `overflow-wrap: anywhere`; a figyelmeztető és magyarázó blokkok `max-width`-e `ch`-ban van, tehát a fordítással együtt mozog. A telefonos artboardon nincs táblázat: kártyák, amelyekben a mezőnév és az érték egymás alatt fér el.

## Telefon 390

Ugyanaz a tartalom egy oszlopban: szűrők egymás alatt, teljes szélességű vezérlőkkel (44 px minimum magasság), lista kártyaként, a részletpanel és a megerősítés a lista alatt nyílik, nem lebegő rétegként. A cím 22 px, a legkisebb szöveg 12 px, és az csak nem interaktív másodlagos információ.

## Amit szándékosan kihagytam

- **Fiók végleges törlése, jelszó-átállítás, belépés más fiókjába, e-mail küldés, számlázás** — a kérés szerint; a lap alján ki is van írva, hogy ezeket nem tudja, és miért.
- **Grafikon, statisztika, trend** — nincs mögötte adat.
- **Munkatér-tagság szerkesztése** (szerep adása/elvétele) — a lap mutatja, ki milyen szerepben van, de nem írja. Nem szerepelt a kért műveletek közt, és a jogosultság-kezelésnek saját szabályai vannak.
- **Több fiók egyszerre kijelölése** — 67 fióknál még nem indokolt; ha a próbafiókok takarítása napi feladattá válik, ez az első bővítés (és akkor is az „eredet" mező kell hozzá előbb).
- **Lapozás** — a jelenlegi nagyságrendnél görgetés elég; a szűrő + rendezés viszi a munkát.

## Harmadik artboard — szerep-változat (nem a mai állapot)

A fájlban van egy 760 px széles, szaggatott kerettel jelölt vázlat arról, hogyan néz ki a lap, ha a fiókon a kétállapotú jelölés helyére **szerep** kerül. Szaggatott keret és felirat jelzi, hogy ez javaslat, nem a mai rendszer.

A javasolt négy állapot — **nem halmozódnak, mindig egy van érvényben**:

| Szerep | Mit lát | Mit tehet más fiókkal |
|---|---|---|
| Nincs | semmit a rendszergazda-lapokból | semmit |
| Teljes | Theme · Feliratok · Költség · Fiókok | felfüggesztés, szerep adása és elvétele |
| Felület | Theme · Feliratok | semmit |
| Költség | Költség (és a havi keret átállítása) | semmit |

A rádiós lista mellett a megerősítés **kigenerálja**, mit lát és mit tehet a választott szerep — nem statikus szöveg, hanem a szerepből számolt mondat. Ez az, ami a mai kétállapotú jelöléssel nem lehetséges: ott a megerősítés mindig ugyanazt mondja, mert nincs mit variálni.

A listaoszlop is változik: az „aktív / felfüggesztve" mellé szerep-jelvény kerül, nem pedig egy jelenlét-jelölés.

**Két észrevétel a vázlat mellé:**

1. **Három osztás is előrelátás.** Ma egy ember használja a lapokat. Ha nem lesz külön felület-szerkesztő és külön költség-figyelő, a kétállapotú jelölés a jobb megoldás: kevesebbet ígér, és nincs mit karbantartani.
2. **Négy kérdést előbb el kell dönteni** (a vázlaton is ott van): ki adhat szerepet (csak a Teljes, vagy bárki, akár magának is) · elvehető-e az utolsó Teljes szerep — ma erre csak figyelmeztetés van · a szerep a fiókhoz tartozik-e vagy munkaterenként külön · mi történik a folyamatban lévő munkával, ha valaki elveszíti a szerepét.

## Nyitott kérdés

Egyetlen döntést nem tudtam meghozni helyetted: **a próbafiók-szabály**. Vagy megadod a teszt-futtató címmintáját (akkor a szögletes zárójel konkrét szabályra cserélhető), vagy bekerül a fiókra egy „eredet" mező a létrehozáskor — ez utóbbi a tartós megoldás, és utána a szűrő biztosat állíthat.
