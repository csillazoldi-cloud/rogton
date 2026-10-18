# Kérdések — R-1 · 2. javítókör (v4)

## 1. A pénznem-váltás és a már kiszámolt költség

A rajz azt mondja, hogy választás után az AI-keret csempe az új pénznemben mutatja az összegeket, **tárolt árfolyammal**. Amit nem tudok eldönteni: a **hónap közepén** történő váltás a hónap addigi költségét is átszámolja-e a mai tárolt árfolyammal, vagy a hívások a keletkezésük napi árfolyamával maradnak.

A kettő eltér, és látszani fog: ha a mai árfolyammal számol újra, a „18,40 €” másra vált, mint amit a felhasználó tegnap látott. Ha a keletkezéskori árfolyam marad, az összeg stabil, de a keret és a költség két különböző árfolyamon állhat.

Amíg nincs döntés, a rajz nem állít semmit erről — a `gephaz.penznem_megj` csak annyit mond, hogy tárolt árfolyammal számolódik.

## 2. A pénznem és a Költség lap

A 4. artboard (rendszergazda Költség csempe) három munkatér összegét mutatja egymás alatt, euróban, és alatta „12 munkatér összesen 41,25 €”. Ha a munkaterek pénzneme **eltér**, akkor az összesítés melyik pénznemben áll?

A rajzon ma minden összeg euróban van, tehát a kérdés nem látszik. Két út: a rendszergazda nézetének van saját megjelenítési pénzneme (és minden munkatér oda számolódik át), vagy soronként a munkatér saját pénzneme áll, összesítés nélkül. **Ez rendszergazda-oldali döntés, a Költség lap feladatlapjára tartozik** — ide csak azért írom, mert a pénznem-vezérlő ezt a kérdést hozza magával.

## 3. A részleges futás és a „még nem futott”

A rajz mostantól elválasztja a két esetet: „Utolsó sikeres futás” vagy „Utolsó futás · az értékelés függőben”. Van egy harmadik eset, amit nem tudok, előfordul-e: **a letöltés is részben sikerült** (néhány forrás elakadt) **és az értékelés is függőben maradt.**

Ma a csempe erre három jelzést mutatna egymás mellett (részleges futás + forráshiba + értékelés függőben). Ez igaz, de sűrű. Ha ez az eset gyakori, érdemes egy összevont mondatot rá — de ahhoz tudni kell, hogy gyakori-e.

## 4. A mentés-állapot a többi lapon

A 9. artboard a lapcím mellé teszi a mentés-állapotot. Az Ügyfélprofilnál ez jó, mert ott egy hosszú űrlap van. **A Theme és a Feliratok lapnak viszont saját eszközsora van** (Alkalmazás, Elvetés, tervezet-jelvény), és ott a mentés-állapot már ma is abban a sorban áll.

Nem írtam át: az a sor a lapé, működik, és a v3 kör nem kérte. De ha egységes helyet akarunk, akkor a Theme és a Feliratok eszközsorát is a lapcím mellé kell hozni — az viszont azoknak a lapoknak az átrajzolása, nem ez a kör.

## 5. Ami a feladatlapból nem jött ki a mai gépezettel

Nincs ilyen tétel ebben a körben. A három kért dolog mindegyikéhez van gépezet: a pénznem-végpont megvan és zöld, a felső sáv megépült, a részleges futás állapota pedig a tesztoldalon már elő is fordult.
