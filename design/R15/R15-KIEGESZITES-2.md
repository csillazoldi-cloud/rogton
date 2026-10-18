# R-15 · 2. kiegészítés a Designnak — Tibor a RAJZOT nézi, kódolás előtt

2026-09-26 · Vilmos döntése: a lapot nem a kirakásnál, hanem a rajzon vizsgáljuk Tibor szemével. Ami a rajzon piros,
az nem megy kódolásra — visszajön hozzád azzal, amit Tibor nem értett.

**Hogyan nézi:** egy program minden képernyőt kivesz a vászonból, a telefonosat 390×844-es, az asztalit 1440×900-as
ablakban nézi (ennyit lát Tibor görgetés nélkül), megméri a szabálylap számait, és egy második gép Tiborként elmondja,
mit lát először, mi a dolga, hova nyomna. Ha nem a fő gombot nyomná, az piros.

**Ehhez kérjük a rajzon:**

1. Minden képernyő külső eleme: `data-r15-kepernyo="telefon"` vagy `data-r15-kepernyo="asztali"`.
2. A képernyő a `section[data-screen-label="04 Hírek"]` (a lap száma és neve) belsejében legyen.
3. **Teljes képernyő**, a felső sávval együtt — nem kivágott részlet.
4. A fő gomb `data-r15="fo-gomb"`; a teendő, tájékoztatás, haladás, kész, baj a `tokenek.md` 3. pontja szerint.
5. Az első képernyőn (390×844 / 1440×900) legyen ott a kérdés-cím és a fő gomb.

Egy lapot akkor építünk, ha a rajzán a mérés zöld, és Tibor nem piros.
