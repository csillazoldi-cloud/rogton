# Adatkötés — R-7b

| Felirat / érték | Honnan jön |
|---|---|
| 02 · Hírek csempe (utolsó gyűjtés, „{n} új”, 3 cím) | `GET /api/kezdolap` — hírfigyelő állapota |
| 02 · „{n} oldal működik · {m} oldalt ellenőrizni kell” | `GET /api/kezdolap` — források összesítése (működik · ellenőrzés alatt · hibás · korlátozott · nem támogatott) |
| 02 · „AI-keret: {összeg} maradt” | `GET /api/kezdolap` — AI-keret, a munkatér pénznemében |
| 02 · „Szervezet adatai mentve: {dátum}” | `GET /api/kezdolap` — profil állapota |
| 01 · első használat kártya | `GET /api/kezdolap` — profil nélküli állapot |
| 02 · fő művelet (Hírek megnyitása / Próba indítása) | ugyanaz az állapot: ha még nem volt futás → Próba indítása |
| 05 · kártyák, kategória, összefoglaló, indok, forrás nyelve | `GET /api/hirfigyelo/attekintes` |
| 05 · „{n} hír értékelése még készül” | ugyanaz a válasz (értékelés állapota) — a számláló és a lista **egy** állapotból |
| 05 · magyar cím + eredeti cím | a találat címadatai; a fordított cím **DÖNTÉS 3.5** — ha nincs gépezete, csak az eredeti látszik |
| 05/06 · Mentés · Nem érdekel · visszaállítás | `POST /api/hirfigyelo/talalatok/[id]/jelol` |
| 06 · részletes összefoglaló, ötlet | megtekintés + tartalomötlet végpont |
| 06 · „Eredeti cikk megnyitása” | a találat forrás-URL-je |
| 08 · témák, források, pontosítás mentése | beállítás tervezet/mentés/visszaállítás |
| 08 · AI-javaslat | `POST /api/hirfigyelo/beallitas/javaslat` |
| 08 · „Újrapróbálás” a forrássoron | `POST /api/hirfigyelo/forrasok/[id]/ellenoriz` |
| 08 · „Cím módosítása”, „Eltávolítás” | forrás módosítása/eltávolítása — **most épül**, az R-7 alatt kész |
| 08 · „Próba indítása”, „Napi figyelés bekapcsolása” | `POST /api/hirfigyelo/futas` (próbafutás / napi) + a futás állapota |
| 10 · jelölések, negatív ok | finomhangolás visszajelzés (fontos / nem érdekel + 4 ok) |
| 10 · javaslat-doboz, elfogad/elvet/kipróbál | `POST /api/hirfigyelo/ertekeles-ujra` és a finomhangolás döntés-végpontja |
