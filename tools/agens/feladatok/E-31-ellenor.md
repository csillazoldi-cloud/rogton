# Feladat — ELLENŐR (E-31): a bekötési leírás próbája — „új fejlesztőként” menj végig rajta

Két rendszerben fut ugyanaz a hírfigyelő-modul. Most készült egy BEKÖTÉSI LEÍRÁS (`docs/HIRFIGYELO-BEKOTES.md`), aminek az a célja, hogy egy HARMADIK
rendszert is be lehessen kötni belőle — olyan fejlesztő is, aki ezt a projektet nem ismeri.

Te vagy ez a fejlesztő. Kaptad a leírást és a mag bejáratának szerződését (`MAG-API.md`). NEM kaptad meg a két meglévő host kódját — szándékosan:
azt kell megmondanod, elég-e a leírás önmagában.

## Amit csinálj

Menj végig a leíráson úgy, mintha be akarnád kötni a modult egy harmadik rendszerbe (mondjuk egy meglévő PHP-s ügyfélportál mellé épített kis Node-szolgáltatásba).
Minden lépésnél kérdezd meg magadtól: **ebből meg tudnám csinálni, vagy vissza kellene kérdeznem?**

Írd össze:
1. **HIÁNYZIK** — amit meg kellene tennem, de a leírás nem mondja meg (vagy csak utal rá). Ez a legfontosabb: minden ilyen sor egy elakadás.
2. **HOMÁLYOS** — le van írva, de kétféleképpen érthető, vagy nem derül ki, mi történik hiba esetén.
3. **FÖLÖSLEGES** — ami nem segít a bekötésben (belső történet, más projekt részlete).
4. **SORREND** — ha valamit előbb kellene tudni, mint ahol szerepel.

Külön nézd meg ezeket, mert ezeken szokás elcsúszni:
- Honnan tudom, MELYIK függvényt kell hívnom, és milyen sorrendben, egy első használatnál (üres rendszer, még nincs beállítás)?
- Mit kell tennem, ha az AI nem elérhető? Mi lesz a találatokkal?
- Mi a teendő, ha a felhasználó nyelvet vált?
- Honnan tudom, hogy a tárolóm HELYES? Van-e mérce, amit lefuttathatok?
- Mi történik, ha ugyanaz a cikk két forrásból is bejön?
- Kell-e migrációt írnom, és ha igen, mi alapján?

Írj `docs/E-31-BEKOTES-ELLENORZES-deepseek.md` néven jelentést. Alak: szakaszonként (HIÁNYZIK / HOMÁLYOS / FÖLÖSLEGES / SORREND) felsorolás, minden sor
egy megállapítás, a leírás melyik pontjára vonatkozik. **Legfeljebb 20 sor összesen**, ismétlés nélkül. A végén EGY mondat: be tudnád-e kötni a modult ebből
a leírásból, vagy sem — és ha nem, mi az EGY dolog, ami leginkább hiányzik.

Ne írj kódot, ne dicsérj, ne ismételd a feladatot.
