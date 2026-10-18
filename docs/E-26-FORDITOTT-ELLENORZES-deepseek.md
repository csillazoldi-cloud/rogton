# E-26 Fordított ellenőrzés — Finomhangolás lap (v7 prototípus vs. megépített kód)

## Ellenőrzési táblázat

| elem a prototípuson | a kódban | ítélet (RENDBEN / HIÁNYZIK / TÖBBLET / ELTÉR) | megjegyzés |
|---|---|---|---|
| Cím (`tuTitle`) | `h1.km-hf-fh-cim` | RENDBEN | |
| Bevezető (`tuIntro`) | `p.km-hf-fh-alcim` | RENDBEN | |
| Üres állapot (`tuEmpty`) + link (`pSetup →`) | `div.km-hf-fh-ures` + `a.km-hf-fh-link` | RENDBEN | |
| Próbafutás cím-sora (`tuTrialTitle`) | `div.km-hf-fh-cimsor` + `div.km-hf-fh-cimke` | RENDBEN | |
| Próbafutás megjegyzés (`tuTrialNote`) | `div.km-hf-fh-megjegyzes` | RENDBEN | |
| Tétel: jelvény (`impLabel`/`impStyle`) | `span.km-hf-fh-jelveny` | RENDBEN | |
| Tétel: meta (`metaText`) | `span.km-hf-fh-meta` | RENDBEN | |
| Tétel: cím (`title`) | `div.km-hf-fh-tetel-cim` | RENDBEN | |
| Tétel: „Fontos” gomb (`fbImportant`) | `button.km-hf-fh-chip` | RENDBEN | |
| Tétel: „Nem releváns” gomb (`fbNotRel`) | `button.km-hf-fh-chip` | RENDBEN | |
| Tétel: „Rögzítve” jelzés (`fbThanks`) | `span.km-hf-fh-koszonet` | RENDBEN | |
| Tétel: ok-választó (`fbWhy`) | `div.km-hf-fh-okok` | RENDBEN | |
| Tétel: 4 ok (`rOther`, `rTopic`, `rGeneric`, `rDup`) | 4× `button.km-hf-fh-chip` | RENDBEN | |
| Javaslat doboz: cím (`sugTitle`) | `div.km-hf-fh-javaslat-cim` | RENDBEN | |
| Javaslat doboz: „Jelenlegi” (`sugCurrent`) | `div.km-hf-fh-javaslat-cimke` + `-szoveg-mut` | RENDBEN | |
| Javaslat doboz: „Javasolt” (`sugProposed`) | `div.km-hf-fh-javaslat-cimke` + `-szoveg` | RENDBEN | |
| Javaslat doboz: alap (`sugBasis`) | `div.km-hf-fh-javaslat-sor` | RENDBEN | |
| Javaslat doboz: hatás (`sugImpact`) | `div.km-hf-fh-javaslat-sor-koz` | RENDBEN | |
| Javaslat doboz: kész állapot — 3 gomb (`sugTry`, `sugAccept`, `sugReject`) | `div.km-hf-fh-gombok` + 3 gomb | RENDBEN | |
| Javaslat doboz: kipróbálás közben — pörgő (`sugTrying`) | `div.km-hf-fh-porgo-sor` + `span.km-hf-fh-porgo` | RENDBEN | |
| Javaslat doboz: összehasonlítva — cím (`cmpTitle`) | `div.km-hf-fh-osszehasonlitas-cim` | RENDBEN | |
| Javaslat doboz: összehasonlítva — sorok 3 jelöléssel | `div.km-hf-fh-osszehasonlitas-sor` + `span.km-hf-fh-osszehasonlitas-jel` | RENDBEN | |
| Javaslat doboz: összehasonlítva — caveat (`cmpCaveat`) | `div.km-hf-fh-osszehasonlitas-megj` | RENDBEN | |
| Javaslat doboz: összehasonlítva — 2 gomb (`sugAccept`, `sugReject`) | `div.km-hf-fh-gombok` + 2 gomb | RENDBEN | |
| Elfogadva üzenet (`sugAcceptedText`) | `div.km-hf-fh-elfogadva` | RENDBEN | |
| Elvetve üzenet (`rejected`) | `div.km-hf-fh-elvetve` | RENDBEN | |
| Profil-érintés doboz (`profileTouch`) + link (`profileOpen →`) | `div.km-hf-fh-profil` + `a` | RENDBEN | |
| Verziók doboz: cím (`verTitle`) | `div.km-hf-fh-verziok-cim` | RENDBEN | |
| Verziók doboz: sor — v-szám | `span.km-hf-fh-verzio-szam` | RENDBEN | |
| Verziók doboz: sor — leírás | `span.km-hf-fh-verzio-leiras` | RENDBEN | |
| Verziók doboz: sor — aktív jelvény (`verActive`) | `span.km-hf-fh-verzio-aktiv` | RENDBEN | |
| Verziók doboz: sor — Visszaállítás gomb (`restore`) | `button.km-hf-fh-verzio-vissza` | RENDBEN | |
| Verziók doboz: záró megjegyzés (`verHitNote`) | `div.km-hf-fh-verzio-megj` | RENDBEN | |

## Többlet a kódban

1. **Néző szerep figyelmeztetése** (`szerep === "nezo"` → `km-hf-uzenet data-fajta="figyelem"`) — a feladat kifejezetten megengedi.
2. **Minta lejáratának üzenete** (`adat.mintaLejart` → `km-hf-uzenet data-fajta="figyelem"`) — a feladat kifejezetten megengedi (D-12 döntés).
3. **Betöltés / hiba-üzenet** (`km-hf-uzenet` + `km-hf-uzenet-gomb`) — a feladat kifejezetten megengedi.
4. **Javaslat készülése / hibája üzenetek** (`sugKeszul`, `sugHiba`) — a feladat kifejezetten megengedi (hibautak).
5. **Összehasonlítás hibája üzenet** (`cmpHiba`) — a feladat kifejezetten megengedi (hibautak).
6. **Verziók sorában az eredet + idő leírás** (`verEredet_${v.eredet}` + `idoRovid`) — a feladat kifejezetten megengedi (a prototípus mintaszövege helyett).
7. **„Vissza a fiókhoz” link a fejlécben** — a `HirfigyeloKeret` része, a feladat kifejezetten megengedi.
8. **A gombok `disabled` állapota néző szerepben és lejárt mintánál** — a prototípus nem ismeri, de a feladat által megengedett szerep-kezelés logikus következménye; nem új felületi elem.

## Javítandó

1. **A javaslat doboz megjelenése „keszul” állapotban**: a kódban `sugVisible` igaz, ha `javaslatAllapot === "keszul"`, és ilyenkor a doboz címe (`✦ sugTitle`) látszik, de a prototípusban a `sugVisible` csak akkor igaz, ha van kész javaslat (`sugAvailable`), és a pörgő (`sugTrying`) csak a „Kipróbálás” gomb után jelenik meg. A kódban a „készül” állapotban a doboz címe + pörgő jelenik meg, ami a prototípus szerint nem létező állapot — **ELTÉR** (a feladat megengedi a „javaslat készülése” üzenetet, de a doboz címe ilyenkor nem szerepelhetne; a pörgő szöveg `sugKeszul` külön üzenetként jelenik meg, nem a `sugTrying` szöveggel — ez a megengedett hibautak közé tartozik, de a doboz kerete és címe többlet).
2. **A javaslat doboz „kesz” állapotában a 3 gomb**: a kódban a gombok csak akkor jelennek meg, ha `javaslatAllapot === "kesz"` ÉS `lathatoJavaslat` létezik. A prototípusban a `sugReady` (`sug === 'none' || sug === 'ready'`) állapotban jelennek meg, ami a javaslat létezését feltételezi. Ez a kódban rendben van, de ha a `javaslatAllapot` „kesz” és a `lathatoJavaslat` null (pl. a betöltés után a javaslat már nem függő), akkor a doboz üres marad — ez a prototípus szerint nem fordulhat elő, mert ott a `sugAvailable` és a `sugReady` együtt garantálja a tartalmat. **NEM HIBA**, mert a kód logikája a szerver állapotától függ, és a feladat a hibautakat megengedi.
3. **A verziók sorrendje**: a prototípusban a `versionRows` a `s.versions` sorrendjét követi (növekvő), a kódban `[...adat.verziok].sort((a, b) => b.verzio - a.verzio)` csökkenő. A prototípus nem ír elő sorrendet, de a „Visszaállítás” gombok és az aktív jelvény elhelyezkedése a sorrendtől függ — a csökkenő sorrend a legújabb verziót teszi felülre, ami a prototípusban nem látható. **ELTÉR** (a feladat nem tiltja, de a prototípus vizuális sorrendjétől eltér).
4. **A „Visszaállítás” gomb elrejtése néző szerepben**: a kódban `szerep !== "nezo"` feltételhez kötött, a prototípusban nincs ilyen — de a feladat megengedi a néző szerep figyelmeztetését, és a gomb letiltása/elrejtése logikus következmény. **NEM HIBA**.
5. **A `sugBasisText` formátuma**: a prototípusban `fbCount + ' × ' + t.fbNotRel + ' / ' + t.fbImportant + ' — [MINTA]'`, a kódban `t("hf.sugBasisSor", { nem, fontos })` — a szöveg pontos tartalma a fordítási fájltól függ, de a prototípus „[MINTA]” szövege nem jelenik meg. **ELTÉR** (a feladat megengedi a verziók sorában az eredet + idő leírást, de a javaslat alap-szövegében a „[MINTA]” jelölés hiánya a prototípustól való eltérés — ellenőrizendő, hogy a fordítás tartalmazza-e).
6. **A javaslat doboz „összehasonlítva” állapotában a sorok jelölései**: a prototípusban a `cmpRows` logikája szerint az `a6x` és `b3` kizárva (`✕ nem releváns`), az `a5` lejjebb, az `a4`/`b1` feljebb, a többi változatlan. A kódban a `osszehasonlitas` a szerverről jön (`valtozas: "elorebb" | "hatrebb" | "valtozatlan"`), és a `deltaLabel` ehhez igazodik. A prototípus logikája (pl. `a6x`, `b3`) a kódban nincs hardkódolva — ez a szerver válaszától függ, ami a feladat szerint helyes (a prototípus mintaszövege helyett a valós adat). **NEM HIBA**.
7. **A „profil-érintés” doboz megjelenési feltétele**: a prototípusban `profileTouchOn: sugAvailable || s.sug === 'accepted'`, a kódban `lathatoJavaslat?.profil_erintett` — a kód a szerver által adott mezőt használja, ami pontosabb, de a prototípus szerint a doboz akkor is megjelenik, ha a javaslat elérhető (függetlenül attól, hogy érinti-e a profilt). **ELTÉR** — a kód szűkebb feltételt használ, ami a prototípushoz képest hiányt okozhat (ha a javaslat elérhető, de `profil_erintett` false, a doboz nem jelenik meg, pedig a prototípus szerint meg kellene).
8. **Az „elvetve” üzenet állapota**: a prototípusban `sugRejectedOn: s.sugRejected`, és ez a doboz a javaslat dobozon KÍVÜL jelenik meg. A kódban az `elvetve` állapot (`javaslatAllapot === "elvetve"`) hasonló, de a `lathatoJavaslat` ilyenkor már null (a szerver a döntés után frissíti), így a javaslat doboz eltűnik, és csak az elvetve üzenet marad. A prototípusban a `sugRejected` igazra állítása után a `sugAvailable` false lesz, így a javaslat doboz eltűnik, de az elvetve üzenet megjelenik — ez megegyezik. **RENDBEN**.
9. **A javaslat doboz „kiprobal” állapota**: a prototípusban a `sugTrying` állapot a javaslat dobozon BELÜL jelenik meg (a 3 gomb helyett), a kódban a `javaslatAllapot === "kiprobal"` esetén a pörgő a dobozon belül jelenik meg, de a `lathatoJavaslat` tartalma (cím, racs, alap, hatás) is látszik — a prototípusban a `sugTrying` állapotban a doboz tartalma (a 3 gomb kivételével) látszik, mert a `sugReady` false, de a `sugCurrentText` stb. mindig látszik. **RENDBEN**.
10. **A „Visszaállítás” gomb működése után a javaslat állapota**: a prototípusban a `restore` a `sug: 'none'`-ra állítja, így a javaslat újra generálódhat. A kódban a `visszaallit` csak újratölti az adatot, a `javaslatAllapot`-ot nem állítja vissza — ha a felhasználó visszaállít egy régebbi verziót, a `lathatoJavaslat` újra számolódik (a `szabaly_verzio` változik), de a `javaslatAllapot` „elfogadva” vagy „elvetve” maradhat, ami miatt a javaslat doboz nem jelenik meg újra, pedig a prototípus szerint a `sug: 'none'` miatt újra meg kellene. **HIÁNYZIK** — a visszaállítás után a javaslat állapotát alaphelyzetbe kellene állítani.

## Összegzés

A megépített kód a prototípus szinte minden elemét tartalmazza, a feladat által megengedett többletek (betöltés/hiba, néző figyelmeztetés, minta lejárata, javaslat készülése/hibája, verziók leírása, „Vissza a fiókhoz”) helyesen vannak beépítve. A főbb eltérések: (1) a javaslat doboz „készül” állapotában a doboz kerete és címe megjelenik, ami a prototípusban nincs; (2) a verziók sorrendje fordított; (3) a profil-érintés doboz feltétele szűkebb; (4) a visszaállítás után a javaslat állapota nem frissül alaphelyzetbe.
