# A gép szabálya — színváltozatok

A kód: `rajz/vz3-kep.js` (`paletta`, `vizsgal`, `dontes`). A kép a három arculati színből épül: **fő szín**, **második szín**, **háttér** (+ a szöveg sötét színe).

## 1. Az öt változat
| Változat | Háttér | Szöveg | Kiemelő szín | A Fontos hír háttere |
|---|---|---|---|---|
| Világos | háttér | sötét | fő szín | fő szín |
| Színes | fő szín | fehér vagy sötét, amelyik olvashatóbb | második szín | fő szín |
| Sötét | fő szín × 0,55 (sötétítve) | fehér | második szín | a sötétített fő szín |
| Másik szín | háttér | sötét | második szín | második szín |
| **Átmenet** | átmenet (160°) **a fő színből a második színbe** — ha azon a szöveg bárhol 4,5 alá esne: **a fő színből a sötétített fő színbe** | fehér vagy sötét, amelyik az átmenet **mindkét végén** olvasható | fő → második esetén a fő szín, különben a második szín | ugyanaz az átmenet |

A kiemelő dobozon (címke, százalékdoboz, „ÚJ”) a szöveg fehér vagy sötét, amelyik olvashatóbb. Fotós képeken a fotó marad.

## 2. Mit hordoz a kiemelő szín képenként
| Helyzet | Elemek |
|---|---|
| Kész munka | címke doboz |
| Akció | címke doboz · százalékdoboz · „meddig” sor (kis betű) |
| Újdonság | „ÚJ” doboz (a fotó takarja a hátteret) |
| Fontos hír | a hír háttere · címke doboz |
| Tudtad? | „Tudtad?” felirat (nagy) · vonal |
| Esemény | címke doboz · HOL / MIKOR felirat (kis betű) |
| Egy szám | a nagy szám |

## 3. Mikor marad ki egy változat
Olvashatósági arány (WCAG-képlet), a képen ténylegesen szereplő elemekre. **Átmenetes háttérnél a mérés az átmenet mindkét végpontján történik, és a rosszabbik számít.**
- szöveg a háttéren **≥ 4,5**
- szöveg kiemelő dobozon vagy a hír hátterén **≥ 4,5**
- kiemelő színű **kis** szöveg a háttéren **≥ 4,5**
- kiemelő színű **nagy** szöveg vagy vonal a háttéren **≥ 3**
- ha két megmaradt változat **ugyanúgy néz ki** (azonos háttér + szöveg + kiemelés; fotós képen csak a kiemelés számít), csak az első marad
- nincs második szín → csak a Világos

A sorrend mindig Világos · Színes · Sötét · Másik szín · Átmenet. A Világos mindig megmarad (a jóváhagyott arculat ezt már ellenőrizte).

## 4. Az eredmény a két céggel
| Helyzet | Kövesi Térkő | aitmetica |
|---|---|---|
| Kész munka | 5 | 5 |
| Akció | 2 (Világos, Sötét) | 2 |
| Újdonság | 2 (Világos, Színes) — a többi ugyanúgy néz ki | 2 |
| Fontos hír | 5 | 5 |
| Tudtad? | 4 (a Másik szín kimarad) | 4 |
| Esemény | 2 | 2 |
| Egy szám | 4 | 4 |

Az Átmenet mindkét cégnél **fő → sötétített fő** lett: a zöld → homok / zöld → arany átmeneten sem a fehér (a világos végen ~2,6), sem a sötét szöveg (a zöld végen) nem éri el a 4,5-öt.

Mért arányok: homok a krémen 1,93 · arany a krémen 2,00 · homok a zöldön 3,32 · arany a zöldön 3,34 · homok / arany a sötétített zöldön ~6,0 · fehér a zöldön 7,5 · sötét szöveg a homokon/aranyon ~7,0.

## 5. A legutóbbi választás
A munkatér a legutóbb választott változatot jegyzi meg. A következő képnél ez az alap, **ha az adott képen megmaradt**; ha nem, akkor a Világos.
