# Adatkötés — R-1 · Kezdőképernyő és navigáció · javítókör (v3)

Melyik elem melyik adatból dolgozik, a feladatlap **4. pontjának** (amit a rendszer ma tud)
neveivel. Az **5. pont** (amit ma nem tud) tételei nem kerültek a rajzra — a lista végén
tételesen ott van, melyik hova nem került.

## 1. A kezdőképernyő csempéi

### 1.1 Hírfigyelő csempe

| Elem a rajzon | Adat a 4. pont szerint |
|---|---|
| „Utolsó sikeres futás: 2026-09-11 06:00” | utolsó sikeres futás időpontja (vagy „még nem futott”) |
| „Következő tervezett futás: ma 18:00 · Europe/Bucharest” | következő tervezett futás, **a munkatér időzónájában** — vagy „kézi indítás” |
| a nagy szám: „7 új találat” | új találatok száma |
| „figyelés fut a háttérben” pörgővel | fut-e éppen a háttérben |
| „2 forrás elakadt” | részleges forráshiba: hány forrás nem dolgozható fel |
| „3 találat értékelése függőben” | „AI-értékelés függőben” állapot (ha a helyi AI nem válaszolt) |
| „Áttekintés →” | hivatkozás a modul létező lapjára |

### 1.2 Ügyfélprofil csempe

| Elem | Adat |
|---|---|
| „jóváhagyva” jelvény | jóváhagyva-e |
| „2026-09-04 · Portik Vilmos” | mikor, ki hagyta jóvá |
| „2 rész hiányzik” + a részek jelvényei | hány rész hiányzik belőle, és melyek |

### 1.3 Arculat csempe

| Elem | Adat |
|---|---|
| „jóváhagyott” jelvény | az arculat állapota: nincs megadva · tervezet · későbbre hagyva · jóváhagyott |

A négy állapot mind a négy feliratkulcsa megvan (`kezdolap.arculat_nincs`,
`…_tervezet`, `…_kesobb`, `…_jovahagyott`); a rajz a jóváhagyott állapotot mutatja.

### 1.4 Források csempe

| Elem | Adat |
|---|---|
| „22 forrás” | a források összes száma |
| használható 14 · korlátozott 3 · hibás 2 · nem támogatott 1 · ellenőrzés alatt 2 | források száma **állapot szerint** |

A korlátozott és a hibás sor kiemelt kerettel — ez a kettő igényel beavatkozást.

### 1.5 AI-keret csempe

| Elem | Adat |
|---|---|
| „18,40 €” + „becsült” | a hónap becsült költsége |
| „1 284 hívás · 3 ó 12 min AI-gépidő” | a hónap hívásszáma és AI-gépideje |
| a sáv és „21,60 € maradt a 40,00 €-s keretből” | a munkatér kerete, és mennyi fogyott belőle |
| (nem látszik a rajzon, de megvan a kulcsa) | ha a keret elfogyott: az értékelés függőben marad — `kezdolap.keret_elfogyott` |

### 1.6 Mentetlen tervezet csempe

| Elem | Adat |
|---|---|
| a csempe puszta léte | van-e mentetlen tervezet a Theme- vagy a Feliratok-lapon |
| „A Theme-beállítások lapon van egy nem alkalmazott tervezet.” | melyik lapon |

Ez a csempe **feltételes**: ha nincs tervezet, nincs csempe. A rajzban ezt a
`mentetlenTervezet` prop kapcsolja.

### 1.7 A lap fejléce

| Elem | Adat |
|---|---|
| „A legutóbbi belépésed óta hét új találat jött, és két forrás elakadt.” | az új találatok száma és a részleges forráshiba egy mondatban — nem új mérés |

## 2. A felső sáv

| Elem | Adat |
|---|---|
| a munkatér neve | a munkatér neve |
| a munkatér-váltó listája, szerepekkel | a tagság adatmodellje: egy ember több munkatérhez tartozhat, más-más szerepben |
| a fiók neve | a saját fiók neve |
| „rendszergazda” jelvény | a fiók rendszergazda-jelölése |
| „néző” jelvény | a tag szerepe a munkatérben |
| nyelvválasztó (magyar · román · angol) | a felület nyelve, a fiókon tárolva |
| Kilépés | a létező kilépés-végpont |
| „Modulok” lenyíló, egy sorral (Hírfigyelő) és „7 új” jelzéssel | a ma létező egyetlen modul és az új találatok száma |
| a lenyíló két szaggatott üres sávja | **nem vezérlő**: `aria-hidden` helyfoglalás, hogy látszódjon, öt modul is elfér |

## 3. A Gépház — két nézet

### 3.1 Rendszergazda nézet (4. artboard) — a közös alap

| Csempe | Adat |
|---|---|
| Theme-beállítások | van-e mentetlen tervezet a Theme-lapon; a tokenek száma; mikor lépett érvénybe az alkalmazott téma |
| Feliratok | van-e mentetlen tervezet a Feliratok-lapon; a három nyelv és az angol tartaléknyelv |
| Költség | **munkaterenkénti költség** és az összeg |
| Fiókok | fiókok és munkaterek száma · felfüggesztett fiókok · utolsó belépések |

### 3.2 Tulajdonos nézet (8. artboard) — a szervezeti felülírás

| Csempe | Adat | Ma megvan? |
|---|---|---|
| Theme-beállítások | van-e mentetlen tervezet **a munkatér szintjén**; hány tokent ír felül a munkatér, és hány jön a közös alapból | a kétszintű működés (közös alap + szervezeti felülírás) ma is így van; a felülírások **száma** származtatható belőle |
| Feliratok | van-e tervezet; hány felirat-kulcsot ír felül a munkatér, három nyelven | ugyanaz |

A Költség és a Fiókok csempe **nem jelenik meg**, mert rendszerszintű: több munkatér adatát
mutatja. A saját munkatér AI-keretének állása a kezdőképernyő AI-keret csempéjén látszik —
ugyanabból az adatból, amit a 4. pont „AI-költség” tétele nevez meg.

A „4 tokent írsz felül” és „2 kulcsot írsz felül” számok a rajzon **példák**: a csempe a
felülírások számát mondja meg, a valódi számot a szervezeti felülírás táblája adja
(lásd a kerdesek.md 2.4 pontját).

### 3.3 A pénznem (D5)

Az AI-keret csempe összegei mellett a rajz kimondja: a pénznem **a munkatér beállítása** —
euró · dollár · forint · lej. Nem árfolyamból számolunk: minden összegnek négy tárolt értéke
van, és az ügyfél a sajátját látja. A csempén álló euró csak a példa.

### 3.4 A Tagok sor a lenyílóban

A felső sáv munkatér-lenyílójában álló **Tagok** sor (`nav.tagok`, `nav.tagok_szam`) az R-2
adatából dolgozna: ki tartozik a munkatérhez, milyen szerepben, és hány függő meghívó van.
**Ez a gépezet ma nincs megépítve** — a rajz ezért megjelöli a sort, és kimondja, hogy amíg
nincs, a sor nem mehet élesbe.

## 4. Amit az 5. pont miatt NEM tettem a rajzra

| Amit a rendszer ma nem tud | Hol nem jelenik meg |
|---|---|
| értesítés, riasztás, „olvasatlan” jelzés | nincs csengő, nincs olvasatlan-pötty; a „7 új” szám nem olvasottság, hanem az új találatok száma |
| számlázás, előfizetés, csomag, ár | nincs ilyen csempe és nincs ilyen sor a sávban |
| fájlfeltöltés (logó, arculati kézikönyv) | az Arculat csempe csak állapotot mutat, feltöltést nem |
| tag meghívása, szerep átállítása | a munkatér-váltó csak vált; a tagok szerepe olvasható, nem állítható |
| több modul | a Modulok lenyílóban egy valódi sor van; a többi hely szaggatott, nem kattintható |
| e-mail bármilyen formában | nincs |
| keresés a lapok között | nincs keresőmező a sávban |
| naptár, ütemezett tartalom, közzététel | nincs |

Egy tétel a 4. pontból szándékosan kimaradt: **„az AI összképe a találatokról,
forráshivatkozással”**. A D2 döntés szerint a kezdőlap nem részletez, csak állapotot és számot
mutat, és továbbvisz — az összkép ezért a modul Áttekintés lapján marad. Lásd `kerdesek.md`.

## 5. Amit a rajz megépítésre nem kötelez

Semmit. Minden csempe és minden vezérlő a 4. pont szerint ma is létező adatból és végpontból
dolgozik. Az egyetlen új elem a **Gépház** mint gyűjtőlap — de az is csak a négy létező lapra
vezető ajtó, saját adat nélkül.
