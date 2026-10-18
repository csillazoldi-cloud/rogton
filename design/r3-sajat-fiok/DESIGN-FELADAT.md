# Rajz-feladat a Claude Designnak — R-3 · Saját fiók beállításai

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba.
Ami hiányzik vagy gyanús: kérdés Vilmoshoz, nem improvizáció.
Előzmény: `design/r1-kezdokepernyo/` (felső sáv) és `design/r2-tagok/` (tagok, szerepek).

---

## 1. Miért kell ez a képernyő

A mai rendszerben **egy felhasználó nem tudja megváltoztatni a saját jelszavát.** Egyetlen út
van rá: a rendszergazda kiad egy egyszer használatos, egy óra alatt lejáró visszaállító jegyet.
Amíg egy ember használta a rendszert, ez elment. Amint az R-2-vel többen lesznek egy
munkatérben, minden jelszó-ügy az üzemeltetőhöz fut be.

A mai „fiók" lap a **szervezet** ügyfélprofilja. A felhasználó **saját magáról** semmit nem
állíthat, a nyelvválasztón kívül — az pedig ma az ügyfélprofil oldalsávjában lakik, rossz helyen.

## 2. Vilmos döntései — ezek rögzítettek (2026-09-11)

**D1 · Az e-mail-cím a felületen NEM módosítható.** A név igen. Oka: az e-mail az azonosító,
amivel belépsz, és mivel nincs e-mail-küldés, nincs mód megerősíteni, hogy az új cím létezik és
tényleg az övé — egy elgépelés kizárná a fiókjából. Ha valakinek változik a címe, a rendszergazda
írja át. **A rajzon a mező látszik, de zárva, és egy mondat megmondja, miért és kihez forduljon.**
Ha később lesz postafiók, a mező megnyílik — a rajz nem változik.

**D2 · Egy tag magától is kiléphet egy munkatérből** — kivéve, ha ő az utolsó tulajdonos.
A kilépés nyomot hagy: ki, mikor, melyik munkatérből.

## 3. Mi kerül a lapra

| Blokk | Tartalom |
|---|---|
| **Te** | a neved (szerkeszthető) · az e-mail-címed (zárva, magyarázó mondattal) |
| **Jelszó** | jelenlegi jelszó · új jelszó · új jelszó mégegyszer. A szabály: legalább 10 karakter |
| **A felület nyelve** | magyar · román · angol. **Ide költözik** az ügyfélprofil oldalsávjából |
| **Belépéseid** | az utolsó belépésed ideje · „Kiléptetés minden eszközről" gomb |
| **A munkatereid** | melyik munkatérben milyen szerepben vagy · munkaterenként „Kilépek ebből a munkatérből" |

## 4. Amit a rendszer MA TUD

- a fiók neve, e-mail-címe, rendszergazda-jelölése
- a fiók **utolsó belépése** (az E-50 óta tárolva)
- a fiók **felfüggesztett** állapota
- a felület nyelve (a fiókon tárolva, a háttérfutás is ezt használja)
- melyik munkatérhez tartozik és milyen szerepben
- a jelszó-szabály: legalább 10 karakter; a jelszó argon2-vel tárolva
- **a munkamenetek az adatbázisban élnek**, és a jelszó megváltoztatása már ma is
  érvényteleníti a fiók **összes** munkamenetét — a „kiléptetés minden eszközről" fele tehát megvan

## 5. Amit ehhez a laphoz MEG KELL ÉPÍTENI — ma nincs meg

- **saját jelszóváltás** (a jelenlegi jelszó megadásával) — ma csak rendszergazdai jeggyel megy
- **a saját név módosítása**
- **kiléptetés minden eszközről** külön gombként (a gépezet fele megvan, a gomb és a végpont nem)
- **kilépés egy munkatérből** a tag saját kezdeményezésére, nyommal

## 6. A szabályok, amiknek a rajzon látszaniuk kell

1. **A jelszóváltáshoz kell a jelenlegi jelszó.** Enélkül egy nyitva hagyott gép előtt bárki
   átveheti a fiókot.
2. **Sikeres jelszóváltás után minden eszközről kiléptet** — beleértve azt, amin épp dolgozik.
   Ezt a rajz mondja ki előre, ne meglepetés legyen.
3. **Az utolsó tulajdonos nem léphet ki a munkatérből.** A gomb legyen **zárva**, és egy mondat
   mondja meg, miért: előbb adjon valaki másnak tulajdonosi szerepet. (Ugyanaz a minta, mint az
   R-2-ben és az E-50 Fiókok lapján.)
4. **Az e-mail mező zárva van**, de látszik — és a mellette lévő mondat megmondja, kihez forduljon.
5. **Fiók törlése nincs.** A házszabály szerint nem törlünk; erre a lapra nem kerül ilyen gomb.
6. **A nyelvváltás nem ír át semmit** a profilban — ezt a mondatot az ügyfélprofilról hozzuk át.

## 7. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | **A lap alaphelyzetben** — minden blokk, két munkatérrel | asztali 1440 |
| 2 | **Jelszóváltás közben**: kitöltött mezők, és a figyelmeztetés, hogy minden eszközről kilép | asztali 1440 |
| 3 | **Jelszóváltás hibái**: rossz jelenlegi jelszó · túl rövid új jelszó · a két új nem egyezik | asztali 1440 |
| 4 | **Kilépés egy munkatérből**, megerősítéssel — és mellette **az utolsó tulajdonos esete**, zárt gombbal | asztali 1440 |
| 5 | **A lap** | telefon 390 |

## 8. Kötelező szabályok a rajzhoz

- **Csak tokenből.** Nincs beégetett szín, betű, betűméret, lekerekítés, térköz. Ha új érték kell,
  ne pixelben írd be: adj vissza külön listát, mi az új token, mi az alapértéke és miért kell.
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven: magyar, román, angol.
  Az alapnyelv az angol.
- **Halott vezérlő tilos.** Csak olyan gomb és mező kerülhet a rajzra, aminek a 4. vagy az
  5. pont szerint van vagy lesz mögötte gépezet.
- **Sötét felület** — a világos változat a tokenekből jön.
- **Illeszkedjen a meglévő lapokhoz**, különösen a `Fiokprofil-optimalizalt.dc.html` kártyás
  szerkezetéhez: ez a lap annak a párja, csak a felhasználóról szól, nem a szervezetről.
- **A megerősítő sáv a képernyő aljára rögzüljön**, ne a kártya aljára (E-50 tanulsága).

## 9. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **minden szöveg kulccsal, három nyelven** — a hibaüzenetek is
- **mely tokeneket használtad**; ha új kell, külön lista indoklással
- melyik mező melyik adatból dolgozik (a 4. és 5. pont neveivel)
- telefonon mi marad el és mi tör sorba
