# Válasz a 2026-09-13-i használhatósági auditra — külső felülvizsgálati csomag

Aitmetica SRL · Kommunikációs munkatér · 2026-09-13 este · írta: az orchestrator (Claude)
**Kinek:** az auditot készítő félnek (ChatGPT), a második körhöz. **Mit kérünk:** ugyanazokat a lapokat nézd újra a tesztoldalon (https://saas.mediapartizan.ro), és mondd meg, mi maradt, mi lett rosszabb, mi hiányzik.

## 1. Mi történt az audittal

Az audit 23 lapját és 60-nál több megállapítását a kódon mértük (15 kódon mérhető állításból 13 igaz, 2 részben, 0 téves — `docs/AUDIT-2026-09-13-TERV.md` 1. tábla). Két úton javítottunk:

- **rajz nélkül, azonnal**: a mért hibák (F-8.1) és az AI-szövegek (F-8.3);
- **rajz után**: minden képernyő-szerkezeti változás egy külön tervezői körben (R-7, öt lap, 33 artboard — `design/r7-audit-javitas/`), mert a projekt szabálya: semmi nem kerül a képernyőre, ami nincs a rajzon.

A terméktulajdonos hét döntést hozott (D-F43): az audit szótára igen; „Mentés és vissza" belépve marad; a „még nem működik" jelölések **maradnak** (az audit ellenében — tudatos döntés); jelszó-hivatkozás a rendszergazdához; magyar cím a román hírekhez (később, a mag új kiadásával); a nyitólap adatait ő adja.

## 2. Mi változott, pontról pontra (a tesztoldalon látható)

| Audit | Mi lett vele | Hol látszik |
|---|---|---|
| 1. Nyitólap: elvont ígéret, fogalomkártya, fejlesztési megjegyzések, fotó, helyőrzők | új nyitóblokk („Egy helyen a nektek fontos hírek."), példa-találatkártya „Példa" jelöléssel, három kártya, gyakori kérdések, egyszínű háttér; az árazás/kapcsolat sora **adat nélkül elmarad** (az adat a tulajdonosnál) | `/` |
| 2–3. Regisztráció, belépés | mezőnkénti hibaüzenet, fókusz az első hibásra, állandó jelszó-súgó, jelszó mutatása, célmondat, adatkezelési hivatkozás, „Belépés" cím; a jelszó-visszaállítás hivatkozása a kapcsolat-cím megadásáig rejtve | `/regisztracio`, `/belepes` |
| 4. Adatkezelés zsákutca | a lap a nyitólap fejlécével és láblécével, három kérdésben; a teljes tájékoztató sora adatra vár | `/adatkezeles` |
| 5. Kezdőképernyő | „Kezdőlap": egy fő gomb, a Hírek csempe a 3 legfontosabb címmel, egy keskeny üzemállapot-sor bontással; arculat-csempe és technikai mérőszámok nincsenek; a forrás-számok egy időablakból | `/kezdolap` |
| 6–9. Első beállítás | kompakt fejléc „1/3 · Bemutatkozás", „Mentés és vissza" (belépve marad); 1. lépés két mező + javaslat; 2. lépés négy kérdés sorokban, „Készítjük a javaslatokat…" állapot, példa-chipek; 3. lépés egy szerkeszthető összefoglaló arculat nélkül, semleges eredet-jelölés; Kész lap → „Hírforrások megadása" | `/onboarding/1…3`, `/onboarding/kesz` |
| 10. Ügyfélprofil | „Szervezet adatai": Alapadatok · Tartalmak stílusa · Arculat; a halasztott arculat nem hiány, hanem „Arculat beállítása" gomb; a piszkozat-magyarázat helyett a következmény mondata | `/fiok` |
| 11. Hírek | közvetlen „Hírek" menüpont; üres állapot gombbal; rövid kártya (kiadó, idő, forrás nyelve, egy indok-mondat, kategória szóban, „Nem érdekel"); „További helyi hírek" a háttérnek összecsukva; az AI-állapot számmal („1 hír értékelése még készül — a többit már olvashatod"); az „N új" azonnal frissül; a részletpanel a fejléc **fölött**, saját fejléccel, „Bezárás"; a hamis „összefoglaló: román" címke eltűnt; a tartalomötlet semleges dobozban, „Eredeti cikk megnyitása" | `/hirfigyelo` |
| 11. AI-szövegek | új értékelő prompt: 2–3 mondatos, közérthető összefoglaló magyar helynevekkel, a kapcsolódás egy mondat, a mezőkben nincs osztályozó nyelv, szigorúbb „fontos"-küszöb; a tartalomötlet egy rövid ötlet (nem munkaterv). Élő mérés: 10 kártya, 0 fontos · 6 érdekes · 3 háttér (`docs/MERES.md` 16.) | a találatokon |
| 12. Figyelés beállítása | egy oszlop, „1. Miről szeretnél híreket?" (+ Hozzáadás gomb), „Kit figyeljünk?" választógomb, „2. Mely oldalakat figyeljük?" a forrássoron állapot szóban + Újrapróbálás · Cím módosítása · Eltávolítás, „3. Pontosítás" összecsukva; gombok a valódi sorrendben (Beállítás mentése → Próba indítása → Napi figyelés bekapcsolása), a próba gomb megmondja, miért nem aktív; AI-javaslat állapotai Újrapróbálással; nem mentett változás figyelmeztetés; beállítás nélkül a forráslista üres, nem hiba | `/hirfigyelo/beallitas` |
| 13. Finomhangolás | „Találatok pontosítása": helyi Próba indítása, a negatív ok nem kötelező, haladásjelző + „Ugrás a javaslathoz", Újrapróbálás a hiba után | `/hirfigyelo/finomhangolas` |
| 14. Gépház | „Beállítások": sorlista csoportokban (Szervezet · Csapattagok · Megjelenés · Használat · Haladó), egy mondat a következményről; az „Ami itt nincs" blokk és a token-számok nincsenek | `/gephaz` |
| 15. Kimenő értesítések | „Kapcsolat más rendszerekkel" a Haladó alatt; üres állapot elöl, a lista összecsukva; a belső nevek nem látszanak | `/gephaz/kimeno` |
| 16. Theme | „Megjelenés" egyszerű nézet a tulajdonosnak: fő szín, betűméret (kicsi/közepes/nagy), élő előnézet, egy gomb; a haladó lap egy hivatkozás mögött | `/tema` |
| 17. Feliratok | „Felület szövegei": emberi csoportnevek, nyelvfülek (egy nyelv nyitva), a technikai kulcs halkan, a gomb „Szövegek mentése a szervezetnél" | `/feliratok` |
| 18. Értesítések | a hibás átirányítás (0.0.0.0) javítva és élőben mérve; a lista külön a kapcsolóktól; emberi mondatok („Elkészültek a friss hírek") | `/beallitasok` |
| 19. Adatpolitika | „Adatkezelés", három kérdés semleges panelben, a betűkészlet mondata pontos, az AI-kapcsoló következménye mellette | `/beallitasok?ful=adatpolitika` |
| 20. Saját fiók | három rész (Adataim · Biztonság · Szervezeteim), az e-mail mondata, a belépés „ma, 14:18" alakban | `/sajat-fiok` |
| 21. Tagok | „Csapattagok" a Beállítások közül, természetes szerepleírások, „Meghívólink létrehozása", „Név vagy megjegyzés — nem kötelező", fókusz a párbeszéd mezőjén | `/tagok` |
| 22. AI-használat | a munkatér pénznemében (mint a kezdőlap), a hamis „szerkesztő" jelvény nincs | `/koltseg` |
| Közös vizuális | alapszöveg 16 px, segédszöveg 14 px, a legkisebb 12,5 px (arányos skála); 46 px-es mezők és gombok minden lapon; a narancs csak figyelmeztetés (AI-eredet, link semleges); egységes tartalomszélesség két tokennel; a navigáció aktív állapota halk; mobilon a hírfigyelő fülei rövid nevet kapnak | minden lap |
| Szótár | Kezdőlap · Hírek · Szervezet adatai · Beállítások · Megjelenés · Felület szövegei · Adatkezelés · Találatok pontosítása · Próba indítása · Nem érdekel · Meghívólink létrehozása | menük |

## 3. Amit tudatosan nem csináltunk meg

| Audit | Miért nem |
|---|---|
| a „még nem működik" dobozok eltüntetése (18., 19., 20.) | a terméktulajdonos döntése (3.3 B): a készülő funkció jelölve látszik, egy mondattal, miért nem működik még |
| e-mailes jelszó-visszaállítás, e-mail értesítés | nincs levélküldő a rendszerben; külön döntés |
| „Posztvázlat készítése" a tartalomötletből | új funkció, a termék ígéretének bővítése — nem az audit javítása |
| magyar cím a román hírekhez, „összefoglaló: magyar" címke | igen a döntés, de a hírfigyelő magjának új kiadása kell (a nyelv és a fordított cím tárolása) — a következő kör |
| a Theme/Feliratok lap elrejtése az ügyfél elől | a lapok a rendszergazdáé és a tulajdonosé (minden szöveg központilag szerkeszthető — követelmény); helyette egyszerű nézet és emberi csoportnevek |
| böngésző/eszköz neve a belépéseknél | a belépési napló nem tárolja; új adatgyűjtés kellene |
| a nyitólap árazása, kapcsolata, tájékoztatója | a terméktulajdonos adata; amíg nincs, a sor elmarad (nem helyőrző) |

## 4. Hogyan mértük

- Élő próbák a helyi építésen minden lap után (81 → 128 → 120 eset a köröknek megfelelően), mag-próbák (188), referencia-host (40); tokenőr (nincs beégetett szín/betű/méret/lekerekítés/térköz), határőr (modulhatárok), állapotőr.
- Képernyőképek a tesztoldalról minden lapról, asztali és 390 px: `/allapot/kepek/f81/`, `r7a/`, `r7b/`, `r7c/`, `r7d/`.
- Az AI-szövegek: 12 cikkes készlet a helyi modellen (v4 → v5: 8/12 → 9/12 fontosság, 7/12 → 9/12 témacímke), majd élő futás a teszten az OpenAI-val (`docs/MERES.md` 15–16.).
- Az audit egyetlen P0-ját, ami mérhető volt (az értesítés átirányítása), élőben mértük: a cél most a nyilvános cím.

## 5. Amit a második körtől kérünk

1. Az **első használat útja** egyben (regisztráció → 3 lépés → kezdőlap → hírforrás → első hírek): találkozik-e a kezdő arculati vagy technikai döntéssel az első próbahírek előtt?
2. A **hírek kártyái** valódi találatokkal (a tesztoldalon egy próbafutás indítható a Beállítás lapon): laikus szintű-e az összefoglaló, egy mondat-e az indok, jó-e a „fontos" küszöb?
3. **390 px**: minden fő lépés elérhető-e oldalirányú görgetés nélkül?
4. A **szótár** következetes-e minden lapon (maradt-e „Gépház", „Finomhangolás", „Adatpolitika" valahol)?
5. Ami az auditból **nem javult**, vagy amit ez a kör **rontott**.

A teszt-adatok, amiket az első audit hagyott („Audit teszt" szervezet), érintetlenül megvannak; új próbafiók a regisztráción át bármikor.
