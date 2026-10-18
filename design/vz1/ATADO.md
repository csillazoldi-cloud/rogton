# ATADO — VZ-1 · Vizuálgyártó, 1. kör

Rajz: `rajz/VZ1a-sablonvalasztas.dc.html`, `rajz/VZ1b-szerkeszto.dc.html` (+ `support.js`).
A rajzon az állapotok egymás alatt állnak — **a képernyőn egyszerre egy látszik**, a gépelés és a gép válasza szerint.

## VZ-1a · Sablonválasztás

| # | Állapot | Mi épül |
|---|---|---|
| 01 | Mintaképek készen | lapcím „Új kép” + egy mondat; három sablonkártya egy sorban: mintakép (4:5, a gép képe a munkatér arculatában) · név · egy sor magyarázat. Az egész kártya kattintható → szerkesztő |
| 02 | Mintaképek készülnek | a mintakép helyén váz + „A mintakép készül…”; a kártya **már választható** |
| 03 | A képgyártó nem válaszol | egy sor felül „Újra” gombbal; a mintakép helyén „Nincs mintakép”; a sablon választható |

Telefon: a három sablon egymás alatt, sorokként (kis mintakép balra, név + magyarázat jobbra).

## VZ-1b · Szerkesztő

**Felépítés (asztali):** felső sáv (R-12) · „← Sablonok” + lapcím (a sablon neve) · jobbra a **Letöltés** (a lap egyetlen fő művelete). Alatta két oszlop: bal az űrlap, jobb 440 px a kép (4:5).

**Mezőnként:** címke + „kötelező / nem kötelező” · HU mező · RO mező (azonos címke alatt) · alatta a **kiférés-sáv**:
- zöld: „HU 2 sor · RO 2 sor, a legfeljebb 3-ból · nagy betűméret”
- sárga: ugyanez + jobbra „Mit tett a gép ▾” — kattintásra a mező alatt nyílik a lépések számozott listája
- piros: „Nem fér ki · RO: 2 sorral lóg túl a lap alján…” + „Rövidítsd a szöveget, vagy adj meg rövid változatot.”
- üres mezőnél sáv helyett a sablon súgója
- „Rövid változat megadása” hivatkozás sárga/piros sávnál, ha a sablon engedi

A sáv színét **a rosszabbik nyelv** adja.

**Jobb oszlop:** állapotsor a kép fölött · a kép · Jelzések blokk (ha van) · „A poszt szövegébe” blokk (ha a gép sort költöztetett).

**Letöltés tiltva:** szürke gomb, alatta/rámutatva egy mondat, miért. Telefonon a mondat a rögzített gomb fölött áll.

| # | Állapot | Kép | Letöltés | Mi látszik még |
|---|---|---|---|---|
| 01 | Üres sablon | szaggatott keret: „Írd be a címet, és elkészítjük a képet.” | tiltva — kötelező mezők | súgók a mezők alatt |
| 02 | Minden kifér | kész | él | minden sáv zöld |
| 03 | A gép lépett | kész | él | „Mit tegyél” sárga, panel nyitva (3 lépés); „A poszt szövegébe” blokk HU/RO + Másolás |
| 04 | Nem fér ki | kész, de „nem tölthető le” | tiltva — a mező neve | „Mit tegyél” piros |
| 05 | Szabálytiltás | kész | tiltva — a szabály neve | Jelzések: 1 tiltás + 1 figyelmeztetés, mindkettő „Ugrás a mezőhöz” |
| 06 | A kép készül | a régi kép 40%-on + felirat „Ez még az előző kép…”; állapotsorban haladásjelző | tiltva — „letölteni azt lehet, amit látsz” | — |
| 07 | A képgyártó nem válaszol | piros keret: üzenet + „Újra” | tiltva — nincs kép | a beírt szöveg megmarad |

**Telefon:** egy oszlop. Felül az állapotsor és a kép kicsiben (96×120) „A kép teljes méretben” hivatkozással; alatta a mezők a sávval; a Jelzések egy összefoglaló dobozban; a Letöltés alul rögzítve.

## Viselkedés, amit a rajz nem tud mutatni
- A kép **a gépelés befejezése után** frissül (javaslat: 600 ms szünet után indul a kérés). Közben a régi kép halványan marad (06).
- Új kérésnél a korábbi, még futó kérés eredményét el kell dobni — különben egy régi kép felülírhatja az újat.
- A „Mit tett a gép” panel nyitott/zárt állapota mezőnként megmarad, amíg a lapon vagy.
- „Ugrás a mezőhöz”: görgetés a mezőhöz + fókusz a hibás nyelvű mezőre.
- A Letöltés két dolgot ad: a PNG-t és — ha van — a poszt szövegébe került sorokat szövegként.
