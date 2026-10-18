# Rajz-feladat a Claude Designnak — R-2 · Tagok és meghívás

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba.
Ami hiányzik vagy gyanús: kérdés Vilmoshoz, nem improvizáció.
Előzmény: `design/r1-kezdokepernyo/DESIGN-FELADAT.md` (a felső sáv onnan jön).

---

## 1. Miért kell ez a képernyő

A rendszerben három szerep létezik a munkatérben — **tulajdonos · szerkesztő · néző** —, és a
kód mindenhol tiszteletben tartja őket. **Beállítani viszont nem lehet őket:** nincs se végpont,
se gomb, amivel valakit fel lehetne venni egy munkatérbe. A próbához közvetlenül az adatbázisba
kellett írni. Ma ezért minden fiók a saját munkaterének egyedüli tulajdonosa — vagyis a rendszer
a gyakorlatban egyfelhasználós, pedig sem a csapatnál, sem egy ügyfélnél nem az.

Ez a rajz azt a lapot adja meg, ahol egy munkatér tulajdonosa behívja a munkatársait.

## 2. Vilmos döntései — ezek rögzítettek (2026-09-11)

**D1 · A meghívás linkkel megy, kézzel továbbítva.** A rendszerben nincs e-mail-küldés, és
ebben a körben nem is lesz. A tulajdonos megnyom egy gombot, kap egy **egyszer használatos,
lejáró linket**, és elküldi, ahogy tudja. Ugyanaz a gépezet, mint a jelszó-visszaállításnál —
az már működik és le van mérve. Ha később lesz postafiók, a link kiküldése e-mailben egy sor
kód lesz: **a felületet nem kell újrarajzolni.**

**D2 · Csak a tulajdonos hívhat meg és adhat szerepet.** A szerkesztő és a néző nem.
Vészhelyzetben a rendszergazda kisegít a Gépházból — de az nem ezen a lapon történik.

**D3 · A lap a munkatérhez tartozik, nem a Gépházhoz.** A saját munkatársát az ügyfél
tulajdonosa veszi fel, nem az üzemeltető. A Gépház **Fiókok** lapja marad, ami ma: a
rendszerszintű nézet minden fiókról és munkatérről.

## 3. Kinek mit szabad ezen a lapon

| Szerep | Mit lát és mit tehet |
|---|---|
| **tulajdonos** | mindent: a taglistát, meghívást, szerep átállítását, eltávolítást |
| **szerkesztő** | látja a taglistát, de minden gomb nélkül |
| **néző** | **nem látja a lapot** — a felső sávban meg sem jelenik neki |
| **rendszergazda** | ha nem tagja a munkatérnek, ide nem jön; a Gépház Fiókok lapján dolgozik |

## 4. Amit a rendszer MA TUD — ebből épül a lista

- ki tartozik a munkatérhez, és milyen szerepben
- a tag neve és e-mail-címe
- a fiók **utolsó belépése** (az E-50 óta tárolva)
- a fiók **felfüggesztett** állapota (az E-50 óta)
- a munkatér neve és létrehozásának ideje
- ugyanaz az ember **több munkatérhez** is tartozhat, akár más-más szerepben

## 5. Amit ehhez a laphoz MEG KELL ÉPÍTENI — ma nincs meg

Ezt azért írom ide, hogy tudjuk: ez a rajz kötelez minket a gépezetre is.

- **meghívó jegy**: egyszer használatos, lejáró, csak lenyomatként tárolva (a
  `jelszo_visszaallitas` tábla mintájára)
- **meghívás visszavonása** (a még fel nem használt link érvénytelenítése)
- **szerep átállítása** és **tag eltávolítása** — végpont egyikre sincs
- **az utolsó tulajdonos védelme** (lásd 6. pont)

## 6. A szabályok, amiknek a rajzon látszaniuk kell

1. **Az utolsó tulajdonos nem veheti el a saját szerepét, és nem távolíthatja el magát.**
   Különben a munkatér gazdátlan marad, és csak adatbázisból lehetne visszaadni. A gomb ne
   csak figyelmeztessen: **legyen zárva**, és egy mondat mondja meg, miért. (Ugyanez a minta
   már él az E-50 Fiókok lapján az utolsó rendszergazdára.)
2. **A meghívó link élettartama: 7 nap** — javaslat; Vilmos egy szóval átírhatja. A
   jelszó-visszaállítás 1 órája itt kevés, mert a link üzenetben utazik.
3. **A meghívott kétféle ember lehet:** akinek már van fiókja, és akinek nincs. A rajznak
   mindkettőt le kell fednie (7. artboard).
4. **A kiadott link a lapon látszik**, amíg él: kinek szól, mikor jár le, és visszavonható.
5. **Eltávolított tag:** a munkatér adataihoz nem fér hozzá többé, de amit korábban csinált,
   az megmarad. A fiókja nem szűnik meg — más munkatérben lehet tagja.
6. **A meghívó linket a lap csak EGYSZER mutatja meg**, a kiadás pillanatában, másolható
   formában. Utána már csak az látszik, hogy kinek szól és meddig él.

## 7. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | **Tagok lap — normál**: 3 tag szereppel, közte egy függő meghívó | asztali 1440 |
| 2 | **Tagok lap — első használat**: egyedül vagy a munkatérben | asztali 1440 |
| 3 | **Meghívás**: a gomb, a kiadott link másolható formában, meddig él | asztali 1440 |
| 4 | **Szerep átállítása és eltávolítás**, megerősítéssel | asztali 1440 |
| 5 | **Az utolsó tulajdonos esete**: a gomb zárva, egy mondat megmondja, miért | asztali 1440 |
| 6 | **Tagok lap** | telefon 390 |
| 7 | **A meghívott oldala**: mit lát, amikor megnyitja a linket — külön, ha van már fiókja, és ha nincs | asztali 1440 |

## 8. Amit ez az R-1-hez képest pontosít

Az R-1-ben a felső sávban a munkatér neve egy munkaternél csak szöveg, váltó nélkül.
Ezzel a lappal viszont **a munkatér neve mindig lenyíló lesz**: benne a *Tagok* sor, és — ha
több munkatere van az embernek — a munkaterek listája is. Így a lenyíló egy munkaternél sem
üres, tehát nem sérül a „halott vezérlő tilos" szabály.
**Ha Vilmos ezt máshogy akarja, szóljon — az R-1 rajza ezen a ponton változik.**

## 9. Kötelező szabályok a rajzhoz

- **Csak tokenből.** Nincs beégetett szín, betű, betűméret, lekerekítés, térköz — minden érték
  elnevezett tokenből jön. Ha új méret vagy érték kell, ne írd be pixelben: adj vissza egy külön
  listát, mi az új token, mi az alapértéke és miért kell.
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven: magyar, román, angol.
  Az alapnyelv az angol.
- **Halott vezérlő tilos.** Csak olyan gomb és mező kerülhet a rajzra, aminek a 4. vagy az
  5. pont szerint van vagy lesz mögötte gépezet.
- **Sötét felület** — a világos változat a tokenekből jön, nem külön rajzból.
- **Illeszkedjen a meglévő lapokhoz**, különösen a `Fiokok.dc.html`-hez: az ottani lista,
  a részletpanel és a megerősítő sáv mintája itt is érvényes.
- **A megerősítő sáv a képernyő aljára rögzüljön**, ne a kártya aljára. Az E-50-nél ez valódi
  hiba volt: hosszú listánál a kérdés a hajtás alá esett, és a gombra kattintva látszólag nem
  történt semmi.

## 10. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **minden szöveg kulccsal, három nyelven**
- **mely tokeneket használtad**; ha új kell, külön lista indoklással
- melyik elem melyik adatból dolgozik (a 4. és 5. pont neveivel)
- telefonon mi marad el és mi tör sorba
