# Recept-formátum — mi egy sablon a több-ügyfeles social-vizuál modulban

Készült: 2026-09-23.
Forrás: `SPEC.md` és három kész lap egy fiók arculatában (`Zavar.dc.html`, `Main.dc.html`, `AdatSavok.dc.html`).
Ez a dokumentum egyben a három gépi recept (`recept-zavar.json`, `recept-allitas.json`, `recept-adatsavok.json`) olvasási útmutatója.

Jelölés a szövegben és a JSON-okban:

- **[LAP]** — a három kész lapon megfigyelt tény.
- **[SPEC]** — a szabálykönyv mondja ki.
- **[MODUL]** — a modul tervezett viselkedése a megbízás szerint; a forrásokban nincs rá példa.
- **[NYITOTT]** — a forrásokból nem dönthető el; a 14. szakaszban gyűjtve.

---

## 1. Mi a recept — egy mondatban

A recept nem beégetett rajz, hanem egy elrendezés **tartalmi-szerkezeti leírása**: megmondja, **milyen mezők** kellenek, **milyen szerepben** szólnak, és **milyen szabályok** kötik őket (kötelezőség, sorrend, összetartozás, nyelvpár, illesztés). Mindent, ami a **megjelenéshez** tartozik — betű, szín, embléma, pixelméret, rács, elválasztó jelek, ikon, fotótár, elrendezés-variáns — a **fiók arculata** ad hozzá renderkor.

```
recept  +  fiók arculata  +  szerkesztő által megadott tartalom
   →  kép  +  képaláírás  +  jelentés
```

Ugyanaz a recept két fiókban két teljesen másképp kinéző, de egyformán szabályos posztot ad. Ez követelmény, nem mellékhatás: ha egy receptbe bekerül egy betűnév, egy színkód vagy egy konkrét pozíció, az már nem recept, hanem egy fiók stílusa.

---

## 2. Recept vagy stílus? — a szétválasztás elve

Elv: ami a **mondanivaló szerkezetéhez** tartozik (mi van a lapon, milyen sorrendben, milyen rangban, milyen feltétellel, mi tartozik össze), az recept. Ami a **megjelenéshez** (hol pontosan, mekkora pixelben, milyen betűvel, színnel, alakzattal), az stílus.

Ugyanez a három lapon, konkrétan:

| A lapon látott dolog | Recept-rész | Stílus-rész (a fiók adja) |
|---|---|---|
| Színes sáv a lap tetején rövid felirattal és nyíl-ikonnal [LAP: Zavar] | van egy **állapotjelző** mező (értéke: zavar), egy rövid **állapotcímke** nyelvpár, egy opcionális ikon; ez a lap **első** eleme | a sáv teljes szélességű, a margón kívül; a szín; a felirat nagybetűs, ritkított; az ikon rajza |
| Járatszám világos jelvényben + a járat neve két nyelven [LAP: Zavar] | **járat/azonosító** mező: kód (technikai) + név (tájékoztatás, nyelvpár), egy egységként | a kerekített jelvény, a színek; a név sablonja („Linia {kód}” / „{kód}-as járat”) a fiók lokáljából |
| Rövid színes vonal a főcím fölött [LAP: Zavar, Main; SPEC] | a főcím előtt van egy **jelzés-hely**; laponként legfeljebb egy [SPEC] | hogy vonal-e, mekkora, milyen színű — vagy egyáltalán van-e |
| Elsődleges nyelvű főcím vastagabb súllyal, a másodlagos alatta más színnel, ugyanakkora [LAP: mind a három] | **főcím** mező, szerepe *hang*, **nyelvpár**, a két nyelv egyenrangú (közös méretlépcső), a másodlagos megkülönböztetve | a betű, a két súly, a két szín, a sorköz; hogy a megkülönböztetés szín, súly vagy mindkettő |
| Időtartomány mono betűvel, mellette „ma” két nyelven [LAP: Zavar] | **idő** mező (tartomány, közelítő vég) technikai szerepben + **nap** rövid szöveg tájékoztatás szerepben; egy csoport | a mono betű, a „kb.” szó, a kötőjel, hogy egy sorban áll-e |
| Háromsoros táblázat hajszálvonalakkal, rögzített címkeoszloppal [LAP: Zavar] | **táblázat** mező: címke–érték sorok; három definiált sor (kihagyott megállók: lista; helyette: rövid szöveg; következő frissítés: idő) | hajszálvonal, oszlopszélesség, halvány címkeszín |
| Négy vízszintes sáv, hosszuk az értékkel arányos [LAP: AdatSavok] | **lista** mező arányos ábrázolással: elemenként címke-nyelvpár + szám; a sáv hossza arányos az értékkel, skála 100 % | a sáv vastagsága, színe, hogy a címke fölötte áll és az érték jobbra zárt |
| Sorozatkód + sorszám + dátum a lap alján [LAP: mind a három] | **azonosító sor**: sorozatkód + sorszám + dátum + (opcionális) járathivatkozás + (opcionális) forrás-címke; a láb eleme, az embléma előtt | a mono betű, ritkítás, halvány szín; hogy balra áll az embléma mellett |
| Az embléma jobbra lent [LAP: mind a három] | **embléma-hely**: kötelező, a lap utolsó eleme | az SVG, a méret, a sötét/világos alapra való változat |
| Egyforma margó, 8-as rács, 1080×1350 [SPEC] | a formátum (képarány) a recept tulajdonsága | margó, rácsegység, méretlépcsők pixelben |

---

## 3. A recept részei

Minden recept (JSON) ugyanabból a részekből áll, magyar kulcsokkal:

1. `recept` — fejléc: azonosító, név, család, mire való, melyik lapból fejtettük vissza, formátumok, kimenetek, alap (sötét/világos — a fiók választása).
2. `szerepek` — a három szerep meghatározása (hang / tájékoztatás / technikai). Azonos minden receptben; a kényelem kedvéért benne van.
3. `arculati_parameterek` — a **jelölt paraméterek** listája, amelyeket a fióknak kell szállítania (`{{betu.hang}}`, `{{szin.allapot.zavar}}`, `{{lokal.par_elvalaszto}}` stb.). A recept csak hivatkozik rájuk, értéket sosem tartalmaz.
4. `blokkok` — a mezők csoportjai olvasási sorrendben (fej → azonosítás → törzs → mikor → részletek → adat → láb). A blokk azt mondja meg, **mi tartozik össze**, nem azt, hogy hol áll.
5. `mezok` — a mezők, mindegyik ugyanazzal a szerkezettel:
   - `azonosito`, `cimke` (magyar), `blokk`, `sorrend`;
   - `szerep` (hang / tajekoztatas / technikai, vagy null az arculati helynél);
   - `tipus` (a 4. szakasz típusai);
   - `kotelezo` (igaz / hamis / feltételes objektum);
   - `nyelvpar` (hamis, vagy objektum: megjelenítési javaslat, egynyelvű lapon mi marad);
   - `karakterkorlat` — **mire** vonatkozik, **hogyan** állapítjuk meg (mindig: mérés), a rendelkezésre álló szélesség képlete, legfeljebb hány sor, és a forráslapon **megfigyelt hossz** (kalibráció, nem korlát); `beegetett_szam` mindig `null`;
   - `illesztes` — a mező saját létrája: lépcsők, keskenyíthető-e, adható-e rövid változat, költöztethető-e a képaláírásba, padló, végső lépés;
   - `szabalyok` — a mezőre vonatkozó szabályok, mindegyik forrásjelöléssel;
   - `sugo` — magyar súgószöveg a szerkesztőnek;
   - `pelda` — a forráslap tartalma, cég- és intézménynevek nélkül.
6. `lapszintu_szabalyok` és `illesztesi_letra` — ami az egész lapra vonatkozik, és a sorrend, amelyben a lap „enged”, ha nem fér ki.
7. `nem_koti_meg`, `megfigyelt_stilus`, `nyitott_kerdesek` — mi nem a recept dolga; mi volt csak stílus a forráslapon (értékek nélkül); mi nem dönthető el.

---

## 4. Mezőtípusok

| Típus (kulcs) | Mit tárol | Szerep tipikusan | A mérés alapja | Példa a lapokról |
|---|---|---|---|---|
| `rovid_szoveg` | egy sor, egy kifejezés; nincs benne bekezdés | bármelyik | a teljes szöveg szélessége egy sorban | rovatcímke („Oraș · Város”); állapotcímke; „astăzi · ma” |
| `hosszu_szoveg` | egy-két mondat, több sor | hang (főcím) vagy tájékoztatás (magyarázat) | sorok száma × rendelkezésre álló szélesség, méretlépcsőnként | a főcímek; a magyarázó/attribúciós sor a Main-lapon |
| `szam` | numerikus érték + egység + formázás | technikai | számjegyek száma; tabuláris számjegyek kötelezők [SPEC] | „52 %” |
| `datum` | naptári nap; a megjelenítés formátuma a fiók lokáljából | technikai | fix hosszúságú | „23.09.2026” |
| `ido` | időpont vagy időtartomány, 24 órás [SPEC]; a tartomány vége lehet közelítő | technikai | fix hosszúságú; tartománynál két időpont + jel + közelítő szó | „09:40 – cca. 14:00”; „12:00” |
| `jarat_azonosito` | egy vonal/járat azonosítója: **kód** (technikai) + **név** (tájékoztatás, nyelvpár) | vegyes | kód: karakterszám; név: egy sor szélessége | „23” + „Linia 23 · 23-as járat” |
| `foto` | a fiók fotótárából választott kép + alt-szöveg | nem szöveg | helyfoglalás, nem karakter | a három lapon **nincs**; a SPEC szabályai ismertek (4.1) |
| `lista` | azonos rangú elemek sorozata; az elem típusa a receptben megadva | tájékoztatás (+ technikai értékek) | elemszám × elemhossz; arányos ábrázolásnál elemszám × elemmagasság | kihagyott megállók; az adatsávok |
| `tablazat` | címke–érték sorok; a címke rövid szöveg (nyelvpár), az érték saját típusú | tájékoztatás | címkeoszlop szélessége × sorok; értékoszlop = a maradék | a Zavar-lap részlettáblája |
| `allapotjelzo` | zárt értékkészlet: `zavar` / `keses` / `helyreallt` [SPEC]; a fiók színt, szövegszínt, opcionálisan ikont rendel hozzá | technikai (a színt hordozza) | nincs karakter; a hozzá tartozó címke `rovid_szoveg` | a Zavar-lap felső sávja |
| `arculati_hely` | nem tartalmi mező: helyet foglal az arculat egy elemének (embléma, jelzés); a szerkesztő nem tölti ki | — | — | az embléma; a jelzővonal |

**Beágyazott technikai token.** Tájékoztató szövegen belül állhat idő vagy szám (Zavar: „Következő frissítés 12:00-kor” [LAP]). A mező szerepe *tájékoztatás*, a benne lévő érték *technikai* betűt kap. A receptben ezt egy `ido` (vagy `szam`) típusú érték + a fiók lokáljából jövő sablonmondat írja le, nem szabad szöveg.

**Összetett rövid szöveg.** Az azonosító sor `rovid_szoveg`, de részekből épül (sorozatkód, sorszám, dátum, hivatkozás); a részeket a fiók elválasztója fűzi össze. A JSON-ban `altipus: "osszetett"` és `reszek` írja le.

### 4.1 Fotó — a SPEC-ből ismert szabályok (a három lap egyikén sincs fotó)

- Laponként legfeljebb egy fotó [SPEC]. Csak a fiók fotótárából; nincs más kép, nincs `data:` URI, nincs színátmenet-mosás, nincs ikonbetű, nincs emoji [SPEC].
- Kitöltő vágás (`object-fit: cover`) és kötelező alt-szöveg [SPEC].
- Szöveg sosem kerül arcra vagy kézre: a szöveg a fotó alatti tömör blokkon vagy sötét sávon áll [SPEC]. A receptben ez úgy jelenik meg, hogy a fotó és a szöveges mezők **külön blokkban** vannak, átfedés nélkül.
- A három recept fotós variánsa [NYITOTT] — egyik forráslapon sincs.

---

## 5. Szerepek — hang / tájékoztatás / technikai

A három szerep a SPEC három szerepének felel meg, és **sosem keverednek egy mezőn belül** [SPEC] (kivétel: a beágyazott technikai token, lásd fent).

- **hang** — „a mondat, ami beszél”: főcím, szlogen, idézet [SPEC]. Laponként **egy** főcímpár [SPEC]. Az arculat külön súlyt és színt adhat az elsődleges és a másodlagos nyelvnek [LAP — az érték stílus].
- **tájékoztatás** — magyarázó szöveg, listák, táblázatcellák, célállomások, megállónevek [SPEC]. Van **keskeny változata** hosszú nevekhez; a fiók adja meg, mennyire keskenyíthető [SPEC].
- **technikai** — minden szám, idő, dátum, járatszám, kód, forrássor, kiskapitális címke [SPEC]. Tabuláris számjegy kötelező [SPEC]. A lapokon ezt a szerepet kapta: a felső rovatcímke, az állapotcímke, a járatkód, az időtartomány, a százalékértékek, az azonosító sor, a forrássor [LAP].

A szerep azért van a receptben, mert ez az, amit az arculat lefordít: a fiók három betűt (és hozzájuk súlyokat, színeket) ad a három szerepnek. A recept sosem mondja meg, melyik betű.

---

## 6. Kötelező, opcionális, feltételes

- **kötelező** — nélküle a lap nem készül el; a renderelő figyelmeztetéssel áll meg.
- **opcionális** — elhagyható; a helye a folyamban összecsukódik (nem marad üres doboz), mert minden elem folyamban áll, semmi nem abszolút pozíciójú [SPEC].
- **feltételes** — egy másik mező vagy szabály teszi kötelezővé. A forrásokból három ilyen van:
  - **forrássor**: kötelező, ha a lapon nem ellenőrzött forrású szám szerepel [SPEC]; értéke vagy valós forrás, vagy a fiók „illusztratív adat” nyilatkozata. Az adatsávos recepten ezért mindig kötelező (ott mindig van szám).
  - **magyarázó/attribúciós sor**: kötelező, ha az állítás más szerv döntéséről szól [SPEC].
  - **állapotjelző**: csak szolgáltatási (zavar-típusú) recepten létezhet; máshol tilos [SPEC].

---

## 7. Sorrend és blokkok — nem pozíció

A recept az **olvasási sorrendet** és az **összetartozást** rögzíti, a pozíciót nem. Blokkok a három receptben: `fej` (rovat vagy állapot), `azonositas` (járat), `torzs` (jelzés + főcím), `mikor` (idő + nap), `reszletek` (táblázat), `adat` (sávok + mérték-magyarázat), `lab` (forrás + azonosító sor + embléma). A blokkon belüli sorrend is kötött.

A fiók elrendezés-variánsa dönti el, hogy egy blokk elemei egy sorban vagy egymás alatt, balra vagy jobbra, sávban vagy szabadon állnak, és hogy a blokkok között a hely hogyan oszlik el (a Main-lapon a főcím függőlegesen középre kerül a rugalmas közökkel, a Zavar-lapon felülről töltődik — mindkettő stílus [LAP]). Példa: a `lab` blokkban az azonosító sor és az embléma összetartozik — ezen a fiókon egy sorban, bal–jobb [LAP]; egy másik fiókon állhat egymás alatt. Ami kötött: az embléma a lap **utolsó** eleme, az azonosító sor **megelőzi**.

Modulszintű szabály [SPEC „Craft”]: folyam-elrendezés (flex/grid, gap), semmi átfedés, semmi levágás, rögzített lapméret, valódi elemek ott, ahol az a dolog (táblázat, cím, gomb, link).

---

## 8. Nyelvpárok

- Egy **nyelvpár** mező két értéket tárol: `elsodleges` és `masodlagos`. Hogy melyik nyelv melyik és milyen sorrendben, a fiók lokálja mondja meg (`{{lokal.nyelvek}}`) [SPEC: ezen a fiókon román először, magyar másodszor].
- **Egyenrangúak**: a pár két tagja ugyanazon a méretlépcsőn áll [SPEC „same size”; LAP]. A másodlagos nyelv **megkülönböztetve** jelenik meg; az eszköz (szín, súly) a fiók dolga [LAP: ezen a fiókon szín + súly a főcímnél, csak szín a sávcímkéknél, semmi a mérték-magyarázatnál].
- **Két megjelenítési mód** látszik a lapokon [LAP]: *egysoros* elválasztójellel (rövid párok: rovatcímke, járatnév, nap, sávcímkék, mérték-magyarázat, forrássor) és *kétsoros* (főcím, táblázatcellák, magyarázó sor a Main-lapon). A recept a mezőnél **javaslatot** ad (`megjelenites_javaslat`), a végső mód a fiók elrendezés-variánsáé. Hogy a recept vagy a fiók dönt, [NYITOTT].
- Az elválasztójel a fiók lokáljából jön (`{{lokal.par_elvalaszto}}`); a receptben nem szerepel.
- **Egynyelvű lap**: fekvő (1920×1080) formátumon laponként **egy** nyelv [SPEC] — ekkor a nyelvpár másodlagos értéke elmarad. Hogy melyik nyelv marad, [NYITOTT].
- **Nem nyelvpár**: szám, idő, dátum, kód, sorszám, sorozatkód — nyelvfüggetlen technikai értékek. Amit a fiók helyettük lefordít: a sablonmondatok („Linia {kód}” / „{kód}-as járat”; „Következő … {idő}” két nyelven) és a rögzített szövegek (forrás-nyilatkozat, forrás-címke, táblázat-címkék).
- A másodlagos nyelvű szöveg **nyelvi jelölést** kap a kimenetben (`lang`) — a három lap közül csak egy teszi meg [LAP: AdatSavok igen, Zavar és Main nem]; a receptben követelményként szerepel.
- Részleges fordítás: a Zavar-lap kihagyott-megállók sorában a két elsődleges nyelvű megállónévből csak egynek van másodlagos nyelvű párja [LAP]. Hogy ez szabály (csak azt fordítjuk, aminek van neve a másik nyelven) vagy hiány, [NYITOTT].

---

## 9. Karakterkorlát — mire vonatkozik, és miért méréssel

A receptben **nincs beégetett karakterszám**. A korlát azt jelenti: „ennyi fér ki **ezen a fiókon**, **ezen a méretlépcsőn**, **ebben a szélességben**, **ennyi sorban**”. Ez négy dologtól függ, és ebből három a fiók arculatából jön (betű, méretlépcső pixelben, rács). A számot ezért csak a renderelő tudja, **méréssel**: a fiók betűjével szedett szöveg tényleges szélessége és sortörése.

A recept minden mezőnél megmondja:

- **mire** vonatkozik a korlát:
  - `nyelvenkent_kulon` — a pár mindkét tagját külön mérjük, de közös lépcsőn; a hosszabb dönt;
  - `teljes_mezo` — az egysoros pár (vagy az összetett sor) együtt, elválasztóval;
  - `elemenkent` — lista: minden elem külön;
  - `cellankent` — táblázat: minden cella külön, a saját oszlopszélességén;
- a **rendelkezésre álló szélesség** képletét: `tartalomszelesseg` (lapszélesség − 2 × margó), vagy `tartalomszelesseg − ertekoszlop − koz` (sávcímke), vagy `cimkeoszlop` / `tartalomszelesseg − cimkeoszlop − koz` (táblázat), vagy `sav_szelesseg − ikon − koz` (állapotcímke), vagy `tartalomszelesseg − emblema − koz` (azonosító sor);
- a **legfeljebb hány sor** (`max_sor`);
- a **megfigyelt hossz** a forráslapon — **kalibrációs adat, nem korlát**.

Bizonyíték a forrásokból, hogy a korlát a mérésé: a SPEC a főcímet három lépcsőben adja (rövid / normál / hosszú szöveghez) [SPEC], a Main-lap főcíme viszont a normál és a rövid lépcső **közötti** méreten áll [LAP] — a méretet tehát már a kész lapokon is a szöveg hosszához igazították, nem táblázatból vették. A tájékoztató szövegnek keskenyítő lépcsője is van [SPEC]. A kis szövegnek padlója van („soha 30 alá” — az érték stílus, a padló léte recept) [SPEC].

---

## 10. Ha nem fér ki — az illesztési létra

Mezőnként, ebben a sorrendben. A lap-szintű sorrend (melyik mező enged előbb) a JSON `illesztesi_letra` részében.

1. **Lépcsőzetes kisebbítés** [SPEC + LAP]. A mező a saját méretlépcsőin lép lefelé (főcím: rövid → normál → hosszú; a lépcsők közötti köztes méret is megengedett, mérés alapján [LAP]). Tájékoztató szövegnél a keskeny változat is lépcső [SPEC]. A padló a fiók minimuma [SPEC]; a főcím padlója a legalsó főcím-lépcső. **Nyelvpárnál a pár együtt lép**, a hosszabb tag dönt.
2. **Rövid változat** [MODUL]. Ha a szerkesztő a mezőhöz megadott rövid változatot (`rovid_valtozat`), a renderelő azt veszi elő, és a lépcső visszaáll az elsőre. Csak azoknál a mezőknél, ahol a recept `rovid_valtozat_megadhato: true`.
3. **Kiköltöztetés a képaláírásba** [MODUL]. A `kikoltoztetheto_kepalairasba: true` jelölésű mezők lekerülnek a képről, és a poszt szövegébe (képaláírás) mennek, a recept által megadott sorrendben, a mező magyar címkéjével. **Nem költöztethető**: főcím, állapot, állapotcímke, járat, időtartomány, azonosító sor, embléma, forrássor (a SPEC szerint a számot a forrássor a **képen** kíséri), attribúciós sor (a SPEC a képre kéri), és az adatsávok (az adat a kép).
4. **Figyelmeztetés** [MODUL]. Ha a lap így sem áll össze, nem készül el csendben: a jelentésben megjelenik a mező neve, a mért túllépés és az utolsó próbált lépcső. Nincs vágás, nincs átfedés, nincs elforgatás, nincs abszolút pozíció [SPEC „Craft”].

A képaláírás egyébként is kimenet: ami a képre tilos (hashtag, emoji [SPEC]), az oda kerülhet. A képaláírás alapszerkezete [NYITOTT].

---

## 11. Amit a recept NEM köt meg — a fiók arculatából jön

A recept ezekre csak `{{…}}` paraméterrel hivatkozik. A teljes lista receptenként a JSON `arculati_parameterek` részében; összefoglalva:

| Csoport | Paraméterek (jelölt nevek) | Mit ad meg a fiók |
|---|---|---|
| Betű | `{{betu.hang}}`, `{{betu.hang.suly.elsodleges}}`, `{{betu.hang.suly.masodlagos}}`, `{{betu.tajekoztatas}}`, `{{betu.tajekoztatas.keskeny}}`, `{{betu.technikai}}` | a három szerep betűje, súlyai, a keskenyítés mértéke; a technikai betű tabuláris számjegyekkel |
| Szín | `{{szin.hatter}}`, `{{szin.hang.elsodleges}}`, `{{szin.hang.masodlagos}}`, `{{szin.tajekoztatas}}`, `{{szin.tompa}}`, `{{szin.hajszalvonal}}`, `{{szin.jelzes}}`, `{{szin.adatsav}}`, `{{szin.kiemelt_hatter}}`, `{{szin.kiemelt_szoveg}}`, `{{szin.allapot.zavar}}`, `{{szin.allapot.zavar.szoveg}}`, `{{szin.allapot.keses}}`, `{{szin.allapot.keses.szoveg}}`, `{{szin.allapot.helyreallt}}`, `{{szin.allapot.helyreallt.szoveg}}` | az alap (sötét vagy világos), a szövegszínek szerepenként és nyelvenként, a jelzés, a sáv, a jelvény, a három állapotszín a párjával |
| Méretlépcsők | `{{meret.lepcso.focim.rovid}}`, `{{meret.lepcso.focim.normal}}`, `{{meret.lepcso.focim.hosszu}}`, `{{meret.lepcso.torzs}}`, `{{meret.lepcso.lista}}`, `{{meret.lepcso.adatcimke}}`, `{{meret.lepcso.allapotcimke}}`, `{{meret.lepcso.kis}}`, `{{meret.minimum}}` | a lépcsők pixelben (betűméret / sorköz), és a padló |
| Rács | `{{racs.margo}}`, `{{racs.egyseg}}`, `{{racs.cimkeoszlop}}`, `{{racs.biztonsagi_sav.fent}}`, `{{racs.biztonsagi_sav.lent}}`, `{{racs.fekvo_szorzo}}` | margó, rácsegység, a táblázat címkeoszlopa, az álló és fekvő formátum sávjai és szorzója |
| Embléma, jelzés, ikon | `{{emblema.svg.sotet_alapra}}`, `{{emblema.svg.vilagos_alapra}}`, `{{emblema.meret}}`, `{{jelzes.van}}`, `{{jelzes.alak}}`, `{{ikonkeszlet.<kulcs>}}` | az embléma és változatai; van-e jelzés és mi az; az ikonkészlet (inline vonalas SVG [SPEC]) |
| Lokál | `{{lokal.nyelvek}}`, `{{lokal.par_elvalaszto}}`, `{{lokal.lista_elvalaszto}}`, `{{lokal.datumformatum}}`, `{{lokal.idoformatum}}`, `{{lokal.tartomany_jel}}`, `{{lokal.kozelito_szo}}`, `{{lokal.szazalek_jel}}`, `{{lokal.jarat_nev_sablon.*}}`, `{{lokal.jarat_hivatkozas_sablon}}`, `{{lokal.frissites_sablon.*}}`, `{{lokal.reszlet_cimke.*}}` | nyelvek és sorrendjük, elválasztók, dátum/idő formátum, közelítő szó, sablonmondatok két nyelven, a táblázat rögzített címkéi |
| Rögzített szövegek | `{{szoveg.forras_nyilatkozat}}`, `{{szoveg.forras_cimke}}`, `{{szoveg.sorozatkod.kozlemeny}}`, `{{szoveg.sorozatkod.allitas}}`, `{{szoveg.sorozatkod.adat}}` | az „illusztratív adat” nyilatkozat, a „forrás” címke, a sorozatkódok |
| Szerkesztési hangnem | `{{szerkesztes.hangnem}}` | megszólítás (udvarias), mondatkezdő nagybetű, intézményi tiltások [SPEC — a fiók szerkesztési szabályai] |
| Fotótár | `{{fototar}}` | a fiók engedélyezett fotói alt-szöveggel [SPEC] |
| Elrendezés-variáns | `{{elrendezes.valtozat}}` | a blokkok tényleges elhelyezése: egy sor / két sor, bal / jobb, sáv / szabad, a köztes hely elosztása |

**Amit ezen a fiókon stílusként azonosítottunk** (értékek nélkül; receptenként a JSON `megfigyelt_stilus` része):

- Az állapotsáv a margón kívül, teljes szélességben, a lap legtetején; a felirat nagybetűs és ritkított.
- A járatkód világos, kerekített jelvényben, sötét szöveggel; a név mellette, halványabb színnel.
- A jelzés egy rövid, vastag vízszintes vonal a főcím fölött.
- A főcím két nyelve: azonos méret, eltérő súly és szín; az elsődleges a lap alapjának világos párja, a másodlagos a fiók kiemelő színe.
- A technikai szövegek mono betűvel; a kis címkék nagybetűsek és ritkítottak.
- A táblázat sorait hajszálvonal választja el; a címkeoszlop rögzített szélességű, halvány színnel.
- Az adatsávok egyszínűek, egyforma vastagok, a címke sorában jobbra zárt értékkel.
- A láb: azonosító sor balra, embléma jobbra, egy sorban; az adatlapon hajszálvonal fölötte.
- A rugalmas közök elosztása (a Main-lapon a főcím függőlegesen középre kerül; a Zavar-lapon a tartalom felülről töltődik és a láb a lap aljához tapad).

---

## 12. Hogyan lesz a receptből kész kép

1. **Recept betöltése**, séma-ellenőrzés (minden mezőnek van azonosítója, típusa, szerepe, kötelezősége).
2. **Fiók arculatának betöltése**; ellenőrzés, hogy a recept `arculati_parameterek` listájának minden tétele ki van töltve. Hiányzó paraméter → figyelmeztetés a fióknak, nem a szerkesztőnek.
3. **Tartalom felvétele** a szerkesztőtől a mezők súgójával; kötelezőség, típus, nyelvpár és feltételes szabályok ellenőrzése (pl. adatlapon a forrássor nem maradhat üres).
4. **Formátum választása**: 1080×1350 [LAP]; 1080×1920 és 1920×1080 a SPEC szerint (biztonsági sávok, szorzó, egy nyelv) [SPEC, példa nélkül].
5. **Mérés és illesztés**: minden mező a saját lépcsőjén, a saját létráján; lapszinten az `illesztesi_letra` sorrendjében, amíg minden a folyamban, átfedés és levágás nélkül elfér.
6. **Renderelés** a fiók elrendezés-variánsával: a másodlagos nyelv nyelvi jelöléssel; tabuláris számjegyek a technikai szerepben; valódi elemek (táblázat, cím) ott, ahol az a dolog; embléma a laphoz illő változatban.
7. **Kimenet**: kép + képaláírás (a kiköltöztetett mezők és a képről tiltott elemek) + jelentés (használt lépcsők, figyelmeztetések, hiányzó paraméterek).

---

## 13. A három recept egy-egy mondatban

- `recept-zavar.json` — **Zavar (forgalmi közlemény)**: állapot + állapotcímke (+ ikon) → járat (kód + név) → jelzés-hely + főcímpár → időtartomány + nap → részlettáblázat (kihagyott megállók, helyette, következő frissítés) → forrássor + azonosító sor + embléma. Az egyetlen recept, amin állapotjelző lehet [SPEC].
- `recept-allitas.json` — **Állítás**: rovatcímke → jelzés-hely + főcímpár → (feltételes) magyarázó/attribúciós sor → azonosító sor + embléma. A rendszer váz-lapja (`Main.dc.html`).
- `recept-adatsavok.json` — **Adatsávok**: rovatcímke → főcímpár → arányos sávok listája (címkepár + szám) → mérték-magyarázat → forrás-címke + forrássor + azonosító sor + embléma. Jelzés nincs rajta [LAP].

---

## 14. Nyitott kérdések

Amit a forrásokból nem lehet eldönteni. Receptenként a JSON-okban is szerepelnek.

1. **Jelzés az adatlapon.** A SPEC laponként egy jelzést ír elő a főcím fölé; az AdatSavok-lapon nincs. Opcionális a jelzés, vagy a sávok helyettesítik, vagy hiány?
2. **Lépcsős vagy folytonos főcímméret.** A SPEC három lépcsőt ad, a Main-lap köztes méreten áll. A mérés adhat-e bármilyen köztes méretet, vagy csak a három lépcsőt?
3. **A magyarázó sor lépcsője.** A SPEC a törzsszöveget és az attribúciót két különböző méreten adja; a Main-lap egy harmadikon. Egy vagy két mező (magyarázat / attribúció)?
4. **A forrássor helye.** A Zavar-lapon külön sor az azonosító sor fölött; az AdatSavok-lapon az azonosító sor második sora, „forrás” címkével. Egy mező kétféle stílusban (így vettük fel), vagy két mező?
5. **Részleges fordítás** a megállólistában (lásd 8. szakasz).
6. **Sávok skálája.** Százaléknál a skála 100 [LAP]. Abszolút értéknél a legnagyobb elem, vagy az összeg, vagy megadott maximum?
7. **Sávok sorrendje.** A lapon csökkenő; a szerkesztő felülírhatja-e?
8. **Sávok száma.** A lapon négy; a minimum és a maximum mérésből jön (magasság), de a felső határ (vagy „egyéb” összevonás) nincs a forrásban.
9. **Nyelvpár megjelenítési módja.** Egysoros vagy kétsoros — a recept vagy a fiók dönt?
10. **Egyenrangú méret.** Recept-szintű szabály-e, hogy a két nyelv azonos méretű, vagy a fiók dönthet másképp?
11. **Egynyelvű (fekvő) lap.** Melyik nyelv marad?
12. **Fotós variánsok.** A SPEC ismeri a fotót, a három lap egyike sem használja.
13. **Járathivatkozás az azonosító sorban.** Automatikusan a járat mezőből jön, vagy külön mező?
14. **Sorszám.** Ki adja, sorozatonként külön számláló-e (a közlemény- és az adat-sorozat kódja eltér a lapokon).
15. **Következő frissítés sablonmondata.** Rögzített a fiók lokáljában (így vettük fel), vagy szerkeszthető?
16. **Nap mező kötelezősége.** A lapon van; elhagyható-e, ha a dátum az azonosító sorban úgyis ott van?
17. **Táblázat minimum sorszáma és a kiköltöztetés sorrendje.**
18. **Nyitott végű időtartomány** („mától visszavonásig”) — a lapon nincs példa.
19. **Az állapotjelző ikonkulcsai** — a lapon egy ikon (terelés) van; a készlet többi kulcsa nincs a forrásban.
20. **Képaláírás alapszerkezete** — csak annyi ismert, hogy a képről tiltott elemek (hashtag, emoji) oda mehetnek.
21. **A SPEC „nagy szám” eleme** (technikai, nagy méret) egyik lapon sem szerepel — külön recept lenne, nincs forráslapja.
22. **Nyelvi jelölés** (`lang`) a másodlagos nyelven — csak egy lapon van; követelménynek vettük.
