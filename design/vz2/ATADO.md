# ATADO — VZ-2 · Képek modul a kisvállalkozónak

A rajzon az állapotok egymás alatt állnak; a képernyőn egyszerre egy. Telefon 390 elöl, asztali 1440 mellette. Világos séma.

## VZ-2a · „Mit szeretnél ma megmutatni?” (`rajz/VZ2a-helyzetek.dc.html`)
| # | Állapot | Mi épül |
|---|---|---|
| 01 | Első belépés, arculat nélkül | cím + egy mondat; egy sor a Szervezet adataihoz; hét kártya semleges alapú mintaképpel, a cég nevével |
| 02 | Arculattal (Tibor) | ugyanez a Kövesi Térkő színeivel és a térkő szakma példáival |
| 03 | Arculattal (Piroska) + iparági csomag | a pékség színei és példái; alul „Közlekedési közlemények (3)” halk sor |
Telefon: 2 oszlopos rács. Asztali: 4 oszlop. Az egész kártya kattintható → kitöltő.

## VZ-2b · Kitöltő (`rajz/VZ2b-kitolto.dc.html`)
**Telefon:** felül „Hová kerül?” (3 gomb) + a kép + „Kép elrejtése”; alatta „Megírtuk helyetted…”; fotó; 2–3 kérdés; „Román változat is”; alul rögzítve a Letöltés.
**Asztali:** bal a kérdések (≤ 640 px), jobb a „Hová kerül?” + a kép (440 px); a Letöltés a lapcím mellett.

| # | Állapot | Helyzet · kié | Letöltés |
|---|---|---|---|
| 03 | A gép javaslatával, első megnyitás | Kész munka · Tibor | él |
| 04 | Fotó feltöltése | Kész munka · Tibor | tiltva: „Várd meg, amíg feltöltődik a fotó.” |
| 05 | Fotó a helyén — eltolás, nagyítás | Kész munka · Tibor | él |
| 06 | Román változat bekapcsolva | Akció · Tibor | él |
| 07 | Nem fér ki — egy mondat, javaslat, „Legyen ez” | Fontos hír · Piroska | tiltva: „Előbb rövidítsd…” |
| 08 | A gép lépett — egy halk sor | Fontos hír · Piroska | él |
| 09 | A kép készül — régi kép halványan | Akció · Tibor | tiltva: „Pár másodperc…” |
| 10 | A képgyártó nem válaszol — üzenet + Újra a kép fölött | Akció · Tibor | tiltva: „Amint elkészül…” |
| 11 | Méretváltás poszt → Story | Fontos hír · Piroska | él |

**Kérdések helyzetenként** (legfeljebb 3 + fotó):
- Kész munka: fotó (1, vagy előtte–utána 2) · Mit mutatsz? · Egy mondat róla
- Akció: Mire adsz kedvezményt? · Mennyi? · Meddig érvényes? · fotó nem kötelező
- Újdonság: fotó · Mit mutatsz? · Egy mondat róla
- Fontos hír: Mi a hír? · Mikor? · Egy mondat róla
- Tudtad?: Mi a tipp? · Egy mondat róla
- Esemény: Mi? · Hol? · Mikor? · fotó nem kötelező
- Egy szám: Melyik szám? · Egy mondat róla

## VZ-2c · Kész (`rajz/VZ2c-kesz.dc.html`)
12 (Tibor, poszt) és 12b (Piroska, Story): kép nagyban · Letöltés újra · Mindhárom méret · „Mit írj mellé?” javaslattal és Szöveg másolása (a lap fő gombja) · „Így tedd fel” az adott mérethez · Még egy képet · Ugyanezt más méretben.

## A hét helyzet képe (`rajz/VZ2-kepelrendezesek.dc.html`)
7 helyzet × 3 méret × 2 arculat. Soronként egy mondat az elrendezés szabályáról — ebből épül a recept.

## Viselkedés
- A Letöltés a kitöltőn letölti a kiválasztott méretet, és a Kész lapra visz.
- A kép a gépelés után ~600 ms-mal frissül; a régi kép közben 40%-on marad. A korábbi, még futó kérés eredményét el kell dobni.
- Méretváltás új kérést indít ugyanazzal a tartalommal; a szöveg nem változik.
- „Legyen ez” beírja a javaslatot a mezőbe, és frissíti a képet.
- A márka okozta szabályjelzéseket a kitöltő nem látja (kerdesek.md 8.).
- A „Kép elrejtése” telefonon csak összecsukja a kép-blokkot, a méretválasztó látszik tovább.
