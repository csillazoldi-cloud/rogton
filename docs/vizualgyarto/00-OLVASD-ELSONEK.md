# Vizuálgyártó modul — átadás a Kommunikációs munkatér projektnek

**Készült:** 2026. szeptember 23. · **Állapot:** fejlesztésre átadható leírás, kód nélkül.

Ez a csomag egy modul teljes leírása. A modul a Kommunikációs munkatér része lesz, és azt csinálja, hogy **a fiók munkatársa kitölt egy sablont, és kész közösségi médiás képet kap** — a saját cége arculatában, két nyelven, szabályosan.

---

## 1. A modul egy mondatban

Sablonokból gyártott, márkahelyes közösségi médiás képek — úgy, hogy **a sablon nem rajz, hanem recept**, és a rajzot a fiók saját arculata adja hozzá.

Ezért két réteg van, és ezeket végig külön kell tartani:

| Réteg | Mi van benne | Kié |
|---|---|---|
| **Szabályrendszer** | Mi számít szabályos posztnak: betűszerepek, minimális méretek, egy kiemelés laponként, nyelvi egyenrangúság, számok kezelése, biztonsági sávok, forrásjelölés | Minden fióknál **ugyanaz**, a modul része |
| **Márkaréteg** | Betűk, színek, logó, ikonok, fotóstílus, margók, rács, elrendezés-variánsok | Fiókonként **más**, a fiók indulásakor készül |

A kettő találkozási pontja a **recept**: megmondja, milyen mezők vannak, milyen szerepben, milyen sorrendben és milyen szabályokkal — de nem mondja meg, hogy a cím milyen betűvel, milyen színnel és pontosan hol áll.

Ebből következik a modul legfontosabb tulajdonsága: **ugyanaz a recept két fiókban két teljesen máshogy kinéző, de egyformán szabályos posztot ad.**

---

## 2. Mi van ebben a csomagban

| Fájl | Mire való |
|---|---|
| `szabalyok.md` | A szabályrendszer emberi olvasatra: 121 szabály kilenc csoportban. Minden szabálynál: mit mond ki, miért, és tiltás-e vagy figyelmeztetés. |
| `szabalyok.json` | Ugyanaz gépi formában, hogy a program **ellenőrizni** tudja. 121 szabály, 102 márkaparaméter jelölt névvel (pl. „legkisebb címméret"), 50 ellenőrzésfajta. Minden hossz átszámítható más vászonméretre. |
| `recept-formatum.md` | Mi egy recept, milyen részei vannak, milyen mezőtípusok léteznek, és mi történik, ha a szöveg nem fér ki. |
| `recept-zavar.json`, `recept-allitas.json`, `recept-adatsavok.json` | Három kész recept, három valódi lapból visszafejtve. Ezek a minták: ilyen alakú minden további recept. |
| `szerkeszto.md` | Mit lát és mit csinál a felhasználó: sablonválasztástól a letöltésig, minden képernyőelemnél mi történik kattintásra és hiba esetén. |
| `fiok-inditas.md` | Mi történik új fiók indulásakor: mit kér be a rendszer, mit tervez meg az AI, mit hagy jóvá a felhasználó, és mikor **méri ki** a rendszer a karakterkorlátokat. Plusz: mi történik, ha valaki később arculatot módosít. |
| `elfogadas.md` | 111 elfogadási próba. Mindegyik kézzel végigpróbálható, és egyértelműen eldönthető, teljesül-e. Ez a „mikor kész" lista. |
| `arculat-referencia/` | Egy teljes, kidolgozott arculat próbaesetnek — lásd a 4. pontot. |

---

## 3. Fejlesztési sorrend — javaslat

Három kör, mindegyik végén működő, megnézhető dolog. Ez javaslat, nem megkötés.

**1. kör — a gerinc bizonyítása**
Egy fiók, három recept (zavar, állítás, adatsávok), egy arculat (a mellékelt referencia), kitöltés két nyelven, kiférés-mérés, letöltés. Ennek a körnek egyetlen dolgot kell bizonyítania: **amit a szerkesztő a képernyőn lát, az képpontra ugyanaz, mint amit letölt** (`elfogadas.md`, F-3).

**2. kör — a keret**
Több fiók, fiókonkénti arculat és képtár, fiókok teljes elkülönítése, a maradék receptek, piszkozat és változatok, képaláírás két nyelven.

**3. kör — az AI-tervező**
Új fiók indítása: iránymutatás bekérése, arculat megtervezése, jóváhagyás, **karakterkorlátok kimérése**, élesítés. Utána az arculatmódosítás kezelése.

A sorrend indoka: a 3. kör a legnagyobb falat, de értelmetlen addig, amíg az 1. kör nem bizonyította, hogy a recept + arculat = kép lánc pontosan működik.

---

## 4. A mellékelt referencia-arculat

Az `arculat-referencia/` mappában egy valódi, végigvitt arculat van: egy erdélyi városi közlekedési vállalat kétnyelvű (román–magyar) közösségi médiás rendszere.

| Mi | Hol | Mire jó a fejlesztésnek |
|---|---|---|
| 49 kész lap forrása | `lapok/*.dc.html` | Ezek a lapok HTML-ben vannak, fix méretekkel. Ebből látszik, hogyan néz ki egy szabályos poszt, és mi az, amit a receptnek le kell írnia. |
| A lapok elrendezése | `lapok/canvas.json` | Melyik lap mekkora, hogyan csoportosítottuk őket. |
| Arculatjegyzék | `arculat-jegyzek.json` | Színek (három témában), méretlépcsők, térközök, sarkok — ez a márkaréteg adatformájának egy valódi példája. |
| Rajzolási szabályzat | `SPEC.md` | Ez alapján készült mind a 49 lap: margók, méretlépcső, egy jelzés laponként, fotószabályok. |
| Képek | `kepek/*.jpg` | 14 lap kirenderelve, hogy látszódjon, mi a cél. |

**Ez az arculat próbaeset, nem alapértelmezés.** Semmi ne legyen beégetve belőle a modulba: se betűnév, se színkód, se elrendezés. A `szabalyok.json` és a receptek pont azért készültek cégnév-, betűnév- és színkódmentesen, hogy ez elkerülhető legyen.

**Amivel az 1. kör tesztelhető:** a referencia-arculatot adatként betöltve ugyanaz a három recept ugyanazt a három képet kell hogy adja, mint a mellékelt képek.

---

## 5. Amit a modul nem csinál

- **Nem rajzol logót.** A fiók hozza a logóját; a modul legfeljebb variánsokat kér (szines / fehér / egyszínű).
- **Nem csinál fotót**, és nem dönt hozzájárulásról. A fotó a fiók képtárából jön, hozzájárulás-állapottal együtt.
- **Nem ellenőriz tényadatot.** Ha nincs megjelölve, hogy ellenőrzött forrásból van, a képre automatikusan rákerül a szemléltető-adat jelölés, és nem vehető le.
- **Nem ír szöveget a felhasználó helyett** — legfeljebb rövidítést javasol, ha nem fér ki.
- **Nem posztol.** A kimenet letölthető kép és a hozzá tartozó képaláírás.

---

## 6. Nyitott döntések

A három leírás mindegyike külön „Nyitott kérdés" szakasszal zárul (összesen 21 + 22 + 25 tétel). Ezek nincsenek eldöntve, mert nem szabad kitalálni őket. A legfontosabbak, amiket a fejlesztés első napján el kell dönteni:

1. **Hány nyelvet kezelünk?** A jelenlegi leírás két nyelvre van szabva (egyenrangú nyelvpár). Egy nyelv és három nyelv is elképzelhető, de a mezők és a kiférés ettől máshogy viselkednek.
2. **Jobbról balra író nyelv kell-e valaha?** Ha igen, az a rács és a sorrend szintjén érinti a receptet, nem csak a fordítást.
3. **Ki hagyja jóvá az arculatot a fiókban?** Egy ember, vagy kell második ellenőrző a közlemény jellegű posztokhoz?
4. **Mi lesz a már kiadott posztokkal arculatmódosítás után?** A javaslat: soha ne változzanak visszamenőleg — de ezt ki kell mondani.
5. **Hol tárolódnak a fiókok képei és betűi**, és mekkora korlátokkal?

---

## 7. Amit érdemes bemásolni a munkatér projektbe

> Ebben a mappában egy modul leírása van: sablonokból gyártott, márkahelyes közösségi médiás képek, több fiókkal, fiókonként más arculattal.
> Olvasd el ebben a sorrendben: `00-OLVASD-ELSONEK.md`, `szabalyok.md`, `recept-formatum.md`, `szerkeszto.md`, `fiok-inditas.md`, `elfogadas.md`.
> A gépi formák: `szabalyok.json` (ellenőrzések), `recept-*.json` (három minta-recept).
> Az `arculat-referencia/` mappa egy kész arculat próbaesetnek — adatként használd, ne égesd be.
> Mielőtt kódolni kezdenél: a fejlesztési sorrendet és a nyitott döntéseket beszéljük meg. Az 1. kör célja egyetlen dolog bizonyítása: amit a szerkesztő lát, az képpontra ugyanaz, mint amit letölt.
