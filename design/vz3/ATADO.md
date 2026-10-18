# ATADO — VZ-3

## VZ-3a · a választó a kitöltőn (`rajz/VZ3-szinek.dc.html`)
- Helye: a kép-blokkban, a „Hová kerül?” alatt, a kép fölött. Telefonon és asztalon is.
- 2–5 gomb egy sorban (`role=radiogroup`, címke: „Színek”). Mindegyikben a **kép kicsiben, a munkatárs saját szövegével**, alatta egy rövid szó.
- A kiválasztott gomb: 2 px kiemelő keret + `--valaszto-aktiv-bg`, és félkövér felirat — mint a méretválasztó.
- Telefonon a gombok kitöltik a sort (legfeljebb 80 px széles, 58 px széles mintakép). Asztalon 92 px széles gomb, 76 px széles mintakép.
- Váltáskor új kép készül: a régi kép 40%-on marad, rajta „Frissítjük a képet…” (a VZ-2b 9. állapota). A választó már az újat mutatja.
- Arculat nélkül a sor **nem látszik**.
- Méretváltáskor a választott változat marad. Ha az új méretben az a változat kiesik (ritka), a Világos lesz a kiválasztott.
- A mintaképek a gépelés után frissülnek, a nagy képpel együtt. Egy mintakép ugyanaz a kép kisebb méretben.

| # | Állapot | Helyzet · cég |
|---|---|---|
| 01 | 5 változat, Világos | Kész munka · Kövesi |
| 02 | Színes kiválasztva, a kép készül | Kész munka · aitmetica |
| 03 | Csak 2 maradt | Akció · Kövesi |
| 04 | Arculat nélkül, nincs választó | Kész munka · semleges |
| 05 | Sötét | Fontos hír · aitmetica |
| 06 | Átmenet | Fontos hír · Kövesi |

## VZ-3b · a kártyák (VZ-2a)
A hét kártya a **legutóbb választott** változatban látszik, ha az adott képen megmaradt; különben Világosban. Ok: a kártya azt mutassa, amit a kitöltőn kapsz. Ha más színű lenne, Tibor azt hinné, rosszat nyomott.

## Ami nem változik
A VZ-2 kitöltő, a Kész lap, a hét kép elrendezése. A Kész lapon nincs választó.

## Átmenet (kiegészítés, Vilmos kérése, 2026-09-24)
- Ötödik változat, a sor végén. A háttér (és a Fontos hír háttere) két arculati szín átmenete, 160°-ban.
- A gép előbb a fő → második színt próbálja; ha a szöveg az átmenet bármelyik végén nem olvasható, a fő → sötétített fő színt. Idegen szín itt sem kerül a képre.
- A képgyártónak átmenetes hátteret kell tudnia rajzolni (a mai kép egyszínű) — ez **épül**.
