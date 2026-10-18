# Negyedik szakasz — Arculat és téma lezárása: a téma és a szövegek a tulajdonos kezében

Claude Cowork · 2026-09-07 · az átadó 13. fejezet 4. szakasza · D-09 alapján

## 1. Mi a cél, egy mondatban

A rendszer megjelenése (színek, betűk, formák, térközök, mozgás) és a feliratai egy kezelőfelületen
állíthatók — a közös alapot a rendszergazda, a saját szervezetét a tulajdonos —, élő előnézettel,
tervezet → alkalmazás sorrendben, verziózva, export/importtal; a hibás import soha nem írja felül a
működőt; a téma az ügyfél arculati kreatívját nem érinti.

Ez az átadó 4. szakasza. Amit bizonyít: **A-07, A-08 (már kész), A-09**; teljesíti az R-13, R-14
követelményt és az átadó 8.1 fejezetét.

## 2. Amit ez a szakasz NEM tartalmaz

Nincs benne hírfigyelő (5.), második befogadó rendszer (6.), fizetés, és nem itt jön az arculati
verziók bővítése (az E-9/E-10-ben már megvan). A rendszergazdai belépés a legegyszerűbb formában
készül (egy jelölés a fiókon), nem külön jogosultsági rendszer.

## 3. Amit a döntésed (D-09) jelent a gyakorlatban

- Két szint: **közös alap** (rendszergazda állítja; ez a mai `tema` tábla aktív sora) és **szervezeti
  felülírás** (a tulajdonos állítja; csak azok az értékek, amiket megváltoztatott). Ami nincs felülírva,
  a közösből jön. Ugyanez a feliratokra.
- A tulajdonos a fiókoldalról nyitja a Theme-beállításokat; a rendszergazda ugyanazt a képernyőt látja,
  csak a közös alapra.
- A **v6 `Theme-beallitasok.dc.html` a Theme-felület mércéje** — nem kell rajz. A **feliratok
  szerkesztőjéhez nincs prototípus** — ahhoz rajz és jóváhagyás kell (E-15).

## 4. A lépések

| # | Mi készül | Mit látsz a teszten a végén | Idő | Ágens |
|---|---|---|---|---|
| E-13 | A téma két szintje: közös alap + szervezeti felülírás, verziózva (tervezet / alkalmazott / korábbi verziók), a rendszergazda-jelölés a fiókon | Belső ellenőrző: két szervezet két különböző témát lát, a harmadik a közöset; a korábbi verzió visszaállítható | 2 óra | 2 |
| E-14 | **A Theme-felület a v6 szerint** (`Theme-beallitasok`): színek, tipográfia, formák, térközök, effektek, részletes beállítások, élő előnézet asztali/mobil, komponens-minták, olvashatósági figyelmeztetés, Tervezet mentése / Alkalmazás / Elvetés / Alapértékek | A fiókoldalról megnyitod, átállítod a színt, látod az előnézetben, alkalmazod — az egész felület átvált; az ügyfélkreatív (mintakártya) nem változik | 4 óra | 3 |
| E-15 | **Rajz:** a feliratok szerkesztője (Claude Design) — a szervezet a saját szövegeit írja át három nyelven, a közösből indulva | Megkapod a rajzot, jóváhagyod vagy javíttatod | 1 óra | 1 |
| E-16 | A feliratok szerkesztője kódban: közös + szervezeti felülírás, tartaléknyelv, keresés kulcsra és szövegre, visszaállítás a közösre | Átírsz egy feliratot románul, csak a te szervezetednél változik; a másik szervezet a közöset látja | 3 óra | 2 |
| E-17 | Export / import (JSON) mindkettőre, ellenőrzött sémával: a hibás fájl nem ír felül semmit, tételes hibalistát ad; export a mezőbe és fájlba | Hibás fájlt töltesz be: semmi nem változik, látod, mi a baj; jó fájlt: tervezetbe kerül, alkalmazás külön | 2 óra | 2 |
| E-17b | *(közben jött, Vilmos új mockupjával)* **A fiókprofil átrajzolása** a `Fiokprofil-optimalizalt.dc.html` szerint: kártyarács, hiányzó-gomb, oldalsáv a nyelvválasztóval — a gépezet marad | Ugyanaz a profil, tisztább lapon; a hiányzó részhez egy gombbal ugrasz | 2 óra | 2 |
| E-18 | Hibautak és fordított ellenőrzés: sikertelen mentés/alkalmazás (a korábbi marad), a v6 Theme-képernyő elemről elemre, végigjátszás 3 nyelven + telefon, A-07/A-09 bizonyítás | Képernyőképek, a lista, mi teljesült | 2 óra | 2 |

**Összesen kb. 14 óra**, 2–3 ágenssel lépésenként (DeepSeek építő, Kimi tesztelő/fordító/ellenőr).
Reális ütem: **két nap**, az első nap végén a Theme-felület már kattintható.

## 5. Kérdések, amelyek menet közben jönnek (egyesével, akkor, amikor az adott darab épül)

1. E-13 előtt: a rendszergazda **te legyél-e az egyetlen** (a fiókodon egy jelölés), vagy legyen külön
   rendszergazdai belépés is? (Javaslat: a te fiókod jelölése — egyszerű, később bővíthető.)
2. E-14-nél: a szervezeti téma **minden tagra** hasson-e, vagy csak a tulajdonos lássa, amíg alkalmazza?
   (A v6 „tervezet → alkalmazás" szerint: a tervezetet csak a szerkesztő látja, az alkalmazott mindenki.)
3. E-16-nál: melyik feliratokat írhatja át a szervezet — **mindent**, vagy csak a nem-rendszer szövegeket
   (pl. a hibaüzeneteket ne)? (Javaslat: mindent, de a hibakódhoz kötött szövegeknél figyelmeztetés.)

## 6. Hol lehet elakadni

- A téma szervezetenkénti kiszolgálása a lap fejében (ma egy közös `:root` blokk) — minden lapnak tudnia
  kell, melyik szervezet nézi; belépés előtt (regisztráció, belépés) a közös alap megy.
- A v6 Theme-képernyő nagy (51 felirat, 6 szekció, élő előnézet komponens-mintákkal) — az E-14 a
  szakasz legnehezebb darabja; ha csúszik, kettébontjuk (szekciók → előnézet).
- Az import-séma: a v6 `km-theme.js validate()` a mérce, a mi `design-system` csomagunk már ezt követi
  (km-theme/2), tehát az ellenőrzés nagyrészt megvan — a felület és a hibalista új.
