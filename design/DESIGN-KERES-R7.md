# Design-kérés — R-7 · Az audit javításai — öt lap, artboardról artboardra

2026-09-13 · Aitmetica SRL · Írta: az orchestrator (Claude, a fejlesztő oldal), Vilmos kérésére.
**Ezt a lapot egészben, változtatás nélkül add át a Claude Designnak.** Minden benne van, amit tudnia kell; a korábbi rajzcsomagjait (R-0, R-1 v4, R-2, R-3 v2, R-4, R-5, R-6, az onboarding v6/v7 és a hírfigyelő v7 prototípusa, a nyitólap) ő készítette, azokra hivatkozunk.

---

## 0. Mi ez, és miért

A tesztoldalt (https://saas.mediapartizan.ro) egy külső használhatósági audit nézte végig 2026-09-13-án (23 lap, asztali és 390 px). A fő megállapítása: **a felület a rendszer felépítését magyarázza, a felhasználó viszont csak azt akarja tudni, mit írjon be, hova kattintson, mit kap.** Apró szövegek, egymásba tett panelek, sok jelvény, sok fény. Az audit állításait a kódon megmértük: 15-ből 13 igaz.

Az auditból **kétféle munka** lett. A **szövegeket és a mért hibákat rajz nélkül javítjuk** — az nem a te dolgod. Ami a **képernyő szerkezetét** változtatja, azt csak rajz után építjük — **ez a kérés**: öt lap, egy körben, egy csomagban.

A rajz a szerződés: *ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba.* Ami gépezet nélkül áll (nincs hozzá végpont a 2. pontban), azt **nem szabad rajzolni** — a `kerdesek.md`-be való.

## 1. Szabályok — ugyanazok, mint az R-1…R-6-nál

- **Csak tokenből.** Szín, betű, méret, lekerekítés, térköz (`--ter-0 … --ter-14`) — mind a meglévő tokenkészletből (R-1 v4 `:root` + R-4 hat tokenje). Ha új token kell, a `tokenek.md`-ben indokolva, alapértékkel és tartománnyal. **Az R-7e lap kifejezetten a tokenek értékéről szól** — ott az érték a döntés.
- **Minden szöveg feliratkulcsból**, három nyelven (hu · ro · en) a `feliratok.json`-ban. A meglévő kulcsokat használd újra (a 4. pontban), új kulcsot a lap előtagjával.
- **Halott vezérlő tilos.** Gomb, mező, kapcsoló csak akkor, ha a 2. pontban van hozzá gépezet. Amit a szerepe miatt nem tehet, azt **nem mutatjuk** (nem szürkén — egyáltalán nem).
- **A „még nem működik" jelölés** (R-4: szaggatott `--keszul-border`, `--keszul-bg`, `jelzes.meg_nem_mukodik`, egy mondat) — a sorsa nyitott döntés (3.3 lent). Ahol használod, egy mondat mondja, miért és mi kell hozzá.
- **Sötét felület, a felső sáv (R-1 v4) minden belépett lapon**, a modul fülsora a sáv alatt (D-F29). A nyilvános lapokon (nyitólap, belépés, regisztráció, adatkezelés) a nyitólap fejléce.
- **Két méret**: asztali 1440, telefon 390 — egy fluid lap, a 390 a törés utáni állapot. Telefonon minden fő út **vízszintes görgetés nélkül** elérhető (az audit egyik elfogadási feltétele).
- **Egyszerű magyar.** Egy laikus minden gombnál meg tudja mondani, mi fog történni. Nincs: token, kulcs, végpont, horog, örökli, hívás, gépidő, futás, piszkozat-magyarázat. A szótár a 4. pontban.
- **Egy fő művelet lapon**. Az legyen a legerősebb (`--grad-primary`); a navigációt ne a kiemelőszín jelölje. **Narancs csak figyelmeztetésre** — AI-eredet, halasztott arculat, link nem narancs. Kártya csak valóban különálló tartalomnak; kapcsolódó mezők egy szakaszban, nem külön dobozokban.

## 2. A mai gépezet — ez van, ebből rajzolhatsz

Csak a lényeg, lapokként. Ami itt nincs, annak nincs gépezete.

| Lap | Van | Nincs (ne rajzold) |
|---|---|---|
| **Első beállítás** (`/onboarding/1,2,3,kesz`) | piszkozat mentés/betöltés (`GET/PUT /api/onboarding/piszkozat`), AI-összefoglaló weboldalból vagy szövegből (`POST …/osszefoglalo`), javaslatok a 2. lépéshez (`…/javaslatok`), hangnem-finomítás (`…/hangnem`), arculat-javaslat (`…/arculat`), jóváhagyás → hiteles profil (`…/jovahagyas`); mezőnként „későbbre hagyom"; **a mag megvédi a kézi szerkesztést** (az AI csak üres mezőt tölt); fájlfeltöltés az arculathoz (R-6, `POST /api/arculat/fajl`) | e-mail-küldés; a lépések sorrendjének átrendezése a magban (a három lépés marad: bemutatkozás · kommunikáció · ellenőrzés) |
| **Regisztráció / belépés** | `POST /api/fiok/regisztracio`, `…/belepes`; hibakódok: hiányzó mező, gyenge jelszó (≥ 10 karakter), foglalt e-mail, rossz e-mail/jelszó; **a mezők külön kapják a hibás jelzést** (aria-invalid) — mezőnkénti szöveg rajzolható; jelszó-visszaállítás **rendszergazdai jeggyel** (`/jelszo-visszaallitas?jegy=…`) | e-mailes visszaállítás; „jelszó mutatása" — ez tisztán képernyő-dolog, rajzolható |
| **Kezdőlap** (`/kezdolap`) | `GET /api/kezdolap`: hírfigyelő állapota (utolsó futás, új találatok, hibás források, részleges futás), profil állapota, arculat állapota, források összesítése (működik · ellenőrzés alatt · hibás · korlátozott · nem támogatott), AI-keret (havi keret, felhasznált, a munkatér pénznemében), tervezetek; első használat kártya profil nélkül | — |
| **Hírek** (`/hirfigyelo`, `/hirfigyelo/beallitas`, `/hirfigyelo/finomhangolas`) | áttekintés (`GET …/attekintes`: kártyák = egy esemény, kategória **fontos · érdekes · háttér**, összefoglaló, indoklás, források nyelvvel, értékelés állapota, új/mentett/elrejtett), jelölés (`…/talalatok/[id]/jelol`: mentett, nem érdekel, visszaállítás), megtekintés, tartalomötlet kérése, értékelés újra (`…/ertekeles-ujra`), Összkép; beállítás: tervezet/mentés/visszaállítás, AI-javaslat (`…/beallitas/javaslat`), források: **lista + hozzáadás + újraellenőrzés** (`POST …/forrasok/[id]/ellenoriz`), próbafutás és napi futás (`…/futas`), a futás állapota; finomhangolás: visszajelzés (fontos / nem érdekel + 4 ok), AI-javaslat a beállításra, döntés (elfogad/elvet), kipróbálás, verziók | **forrás módosítása és eltávolítása — most épül** (a fejlesztő oldal, az R-7 alatt kész lesz — rajzolhatod, a gombja „Cím módosítása", „Eltávolítás"); magyar (fordított) cím a román hírhez — DÖNTÉS 3.5 |
| **Gépház** (`/gephaz`) | tulajdonos: Csomag · Kimenő értesítések · Költség · Munkatér (pénznem); rendszergazda: + Fiókok · Theme · Feliratok; `GET /api/gephaz` | csomagváltás, ár, fizetés |
| **Beállítások** (`/beallitasok`) | Értesítések fül: a fiók listája (utolsó 50, olvasott/olvasatlan, megnyitás), hat kapcsoló (miről szóljunk), felületi csatorna; Adatpolitika fül: az adatút két sora (betűkészlet a Google-tól; AI-szolgáltató: OpenAI, felhő, USA), **AI-kapcsoló** (működik, tulajdonos), felhő-kapcsoló (**nem működik**, jelölve) | e-mail és telefon csatorna (nem működik — jelölve, DÖNTÉS 3.3) |
| **Kimenő értesítések** (`/gephaz/kimeno`) | 25 esemény 5 csoportban, három szint (közös alap · munkatér · érvényes), mentés; a csatorna bekötve/nincs bekötve | a horog címe (titok); az üzenetek naplója (T-27) |
| **Theme** (`/tema`) | 67 token hat csoportban (szín · betű · betűméret · forma · térköz · egyéb), két szint (közös alap: rendszergazda · munkatér: tulajdonos), tervezet mentése, alkalmazás, elvetés, alapértékek, verziók, élő előnézet | — |
| **Feliratok** (`/feliratok`) | ~1500 kulcs csoportokban, három nyelv, két szint, tervezet/alkalmazás/visszaállítás/verziók, export/import | élő „hol látszik" előnézet — nincs gépezete, **ne rajzold** |
| **Saját fiók** (`/sajat-fiok`) | név módosítása, jelszóváltás (a többi eszközt kilépteti), kiléptetés minden eszközről, utolsó belépések (idő + IP, 30 nap — **böngésző/eszköz adat NINCS a naplóban**), munkatereim + kilépés, a felület nyelve | e-mail módosítása (zárva, jelölve — DÖNTÉS 3.3); böngésző/eszköz neve a belépéseknél |
| **Tagok** (`/tagok`) | lista, meghívólink (7 nap, kézzel átadva), visszavonás, szerep, eltávolítás | e-mail-küldés |
| **Költség** (`/koltseg`) | havi keret, felhasznált, hívások, gépidő, szolgáltatónként — a munkatér pénznemében (javítás alatt) | — |
| **Nyitólap, adatkezelés** (`/`, `/adatkezeles`) | statikus, feliratkulcsból | árazás, kapcsolat, tájékoztató szövege — **Vilmos adata**, DÖNTÉS 3.6 |

## 3. Nyitott döntések — így kezeld

Ezek Vilmos szavára várnak. **Rajzold az audit változatát** (A), és az artboard sarkába írd: „DÖNTÉS 3.x". A másik változatot (B) **egy mondatban** a `kerdesek.md`-ben írd le — nem kell megrajzolni. Ha Vilmos B-t választ, egy kis javítókör lesz.

| # | Kérdés | A (az audit) — ezt rajzold | B |
|---|---|---|---|
| 3.1 | a menük és lapok neve | Kezdőlap · **Hírek** (a Modulok lenyíló helyett közvetlen pont, ha egy modul van) · Szervezet adatai · Beállítások (a Gépház helyett) · Megjelenés · Felület szövegei · Adatkezelés · Találatok pontosítása | a mai nevek |
| 3.2 | „Mentés és kilépés" az első beállításban | ment és a **kezdőlapra** visz, belépve marad; a gomb: „Mentés és vissza" | kijelentkeztet, a gomb kimondja |
| 3.3 | a „még nem működik" dobozok (e-mail, telefon, felhő-kapcsoló, e-mail-cím) | **nem látszanak** a tulajdonos alapnézetén; egy mondat: „Az értesítéseket itt, az alkalmazásban látod."; a rendszergazda látja őket | maradnak az R-4 jelölés-nyelvével |
| 3.4 | jelszó-visszaállítás a belépő lapról | „Elfelejtetted a jelszavad?" → egy lap: „A jelszót a rendszergazda állítja vissza. Írj neki: {kapcsolat}" — a kapcsolat-adat Vilmostól | nincs hivatkozás (a mai) |
| 3.5 | magyar cím a román hírhez | a kártyán **magyar cím** felül, az eredeti cím alatta halkan, a forrás nyelve jelölve | csak az eredeti cím, a forrás nyelve jelölve |
| 3.6 | nyitólap: árazás, kapcsolat, tájékoztató | a helyőrzők helyén **a sor elmarad**, amíg nincs adat; az adatkezelés lap: rövid összefoglaló + „a teljes tájékoztató {dátum}-tól" | — |

## 4. Feliratkulcsok és szótár

**Meglévő előtagok, amiket használj:** `nav.*` (menü), `kezdolap.*`, `hf.*` (hírfigyelő — ~300 kulcs, a v7 prototípusból), `onboarding.*`, `onboarding1.*`, `onboarding2.*`, `onboarding3.*`, `fiok.*` (ügyfélprofil), `gephaz.*`, `beallitasok.*`, `ertesites.*`, `esemeny.<fajta>_cim` (25), `kimeno.*`, `ai_kapcsolo.*`, `tema.*`, `feliratok.*`, `sajatfiok.*`, `tagok.*`, `koltseg.*`, `csomag.*`, `nyitolap.*`, `hiba.*`, `jelzes.*`, `kozos.*`. Ne duplázz: ha egy szöveg ugyanaz marad, a régi kulcs; ha a szöveg változik, **ugyanaz a kulcs, új értékkel** — a `feliratok.json`-ban jelöld `(változott)`.

**Új előtag:** `r7.*` csak a tényleg új elemekre (üres állapotok, új gombok, a „További helyi hírek" cím, a Megjelenés egyszerű nézete).

**Szótár** (a rajzon ezek a szavak, ha a 3.1 A):

| Ne | Igen |
|---|---|
| Kezdőképernyő | Kezdőlap |
| Modulok → Hírfigyelő | Hírek |
| Ügyfélprofil / Fiók | Szervezet adatai |
| Gépház | Beállítások |
| Theme-beállítások | Megjelenés |
| Feliratok | Felület szövegei |
| Adatpolitika | Adatkezelés |
| Onboarding | Első beállítás |
| Finomhangolás | Találatok pontosítása |
| Tartalomnyelvek | Milyen nyelven írjunk? |
| Kommunikációs cél | Mit szeretnél elérni? |
| Kommunikációs megközelítés | Ötlet, hogyan írj róla |
| Próbafuttatás | Próba indítása |
| Lefutott a figyelés | Elkészültek a friss hírek |
| Beragadt egy futás | A hírgyűjtés a szokásosnál tovább tart |
| Örökli | Alapbeállítás |
| Meghívó kiadása | Meghívólink létrehozása |
| Nem releváns | Nem érdekel |
| Kilépés (fiókból) | Kijelentkezés |
| webes horog | kapcsolat más rendszerrel |

## 5. Az öt lap — ezt kérem, ebben a sorrendben

Minden lap külön `.dc.html`, benne az artboardok a megadott sorrendben és névvel. Ahol „390" áll, telefonos változat.

### R-7a · Első beállítás (regisztráció, belépés, onboarding 1–3, kész)

Cél: **egy új felhasználó az első próbahírek előtt nem találkozik arculati vagy technikai döntéssel.** A három lépés marad, a tartalmuk rövidül.

| # | Artboard | Mi változik |
|---|---|---|
| 01 | Regisztráció 1440 | három mező marad; **mezőnkénti hibaüzenet** a mező alatt (`hiba.nev_hianyzik` „Add meg a neved.", `hiba.email_hianyzik`, `hiba.jelszo_rovid` „Adj meg legalább 10 karakteres jelszót."), a fókusz az első hibásra; a jelszó súgója **állandó** („Legalább 10 karakter. Több szót is használhatsz."); „jelszó mutatása"; egy mondat a cél: „Hozd létre a fiókod. Utána megadod, milyen hírek érdekelnek."; **adatkezelési hivatkozás** az űrlap alatt. Két állapot: üres · üres beküldés hibákkal |
| 02 | Belépés 1440 | cím „Belépés" (a „munkatér" nélkül); mezőnkénti hiba („Add meg az e-mail-címed.", „Add meg a jelszavad."), rossz párosnál egy mondat („Az e-mail-cím vagy a jelszó nem megfelelő. Próbáld újra."); **„Elfelejtetted a jelszavad?"** hivatkozás — DÖNTÉS 3.4 (A: a rendszergazdához irányító lap, 02/B artboard) |
| 03 | 1. lépés · Bemutatkozás 1440 | **csak**: a szervezet neve · weboldal VAGY rövid leírás („Mivel foglalkoztok?" + súgó: „Például: pékségünk van Marosvásárhelyen, helyi családoknak sütünk.") · „Javaslat készítése" gomb (a mai „Összefoglaló készítése"). **Elmarad innen**: dokumentum, logó, kézikönyv, referenciák, arculati forrás — ezek a Szervezet adatai lapra kerülnek (R-7c). Az előnézet: üres állapotban **egy mondat** („Itt jelenik meg a javaslat."), nem „Még nincs megadva" jelvényekkel; kész javaslatnál a mai. Fejléc: kompakt, „1/3 · Bemutatkozás", mellette halk mentési állapot; a jobb felső gomb DÖNTÉS 3.2 |
| 04 | 1. lépés · 390 | egy oszlop; az előnézet **összecsukva** („Javaslat megnézése" sor), a fő gomb az első képernyőn látszik |
| 05 | 2. lépés · Kommunikáció 1440 | a négy kérdés **egyszerű sorokban**, nem külön kártyákban: „Kiknek szólnak a tartalmaid?" · „Mit szeretnél elérni?" (választható példák: Tájékoztatni · Érdeklődőket szerezni · + saját) · „Milyen nyelven írjunk?" (a magyar/román/angol elöl, a teljes lista lenyílóban) · „Milyen stílusban írjunk?" (Közvetlen · Tárgyilagos · + saját). **Egy** mondat a halasztásról fent: „Amit most nem tudsz, később is kitöltheted." — a mezőnkénti „később" jelölés marad, de kicsi. **Három állapot**: A „Készítjük a javaslatokat…" (a mezők alatt haladásjelző, a mezők szerkeszthetők) · B a javaslatok megjöttek (AI-eredet **semleges** jelvénnyel, nem narancs) · C az AI nem válaszolt (egy mondat + „Újrapróbálás", kézi kitöltés megy) |
| 06 | 3. lépés · Ellenőrzés 1440 | cím: „Nézd át az adatokat." **Egy** szerkeszthető összefoglaló — a jobb oldali profil-előnézet **elmarad**. Az eredet **semleges** jelölés soronként („te adtad meg" / „javaslat"), részlet kattintásra; egy mondat felül: „Nézd át a javaslatot, és javítsd, ha szükséges." A tartalomnyelv **ugyanaz a választó**, mint a 2. lépésben. **Az arculat-blokk (színek, betűk, mintakártya, feltöltők) elmarad** — egy halk sor: „Az arculatot később, a Szervezet adatai lapon állíthatod be." Fő gomb: „Mentés és tovább" |
| 07 | Kész 1440 | „Kész — a szervezet adatai mentve." Fő gomb: **„Hírforrások megadása"** → `/hirfigyelo/beallitas`. Másodlagos: „Szervezet adatai megnézése". Az arculatról **egy** halk mondat, figyelmeztető doboz nélkül |
| 08 | 2. és 3. lépés · 390 | a fenti kettő telefonon, a fő gomb alul rögzítve |

### R-7b · Kezdőlap és Hírek

Cél: **a hírek a fő helyen; kevés jó találat; minden hibaállapotból van kiút a lapon.**

| # | Artboard | Mi változik |
|---|---|---|
| 01 | Kezdőlap · profil nélkül 1440 | egy kártya: „Mondd el röviden, mivel foglalkoztok, hogy a nektek fontos híreket gyűjtsük össze." Gomb: **„Első beállítás"**. Súgó: „Később bármit módosíthatsz." Semmi más csempe, semmi nulla |
| 02 | Kezdőlap · beállítva 1440 | felül a lapcím és **egy** fő művelet (Hírek megnyitása / Próba indítása, az állapot szerint); alatta a **Hírek csempe nagyban** (utolsó gyűjtés ideje, „{n} új", a 3 legfontosabb cím); alatta **egy keskeny üzemállapot-sor**: „{n} oldal működik · {m} oldalt ellenőrizni kell" (bontás kattintásra) · „AI-keret: {összeg} maradt {pénznem}-ben" · profil mentve {dátum}. **Az arculat-csempe elmarad.** A hívások száma és a gépidő **nem** itt |
| 03 | Kezdőlap · 390 | egy oszlop, az üzemállapot-sor összecsukható |
| 04 | Hírek · üres 1440 | „Még nem gyűjtünk híreket." „Add meg az első hírportált és a témákat, amelyek érdekelnek." Gomb: **„Hírfigyelés beállítása"**. Az AI-javaslatról **csak akkor** egy mondat, ha valóban elkészült |
| 05 | Hírek · lista 1440 | kártya: cím 1–2 sor (DÖNTÉS 3.5: magyar cím + eredeti halkan) · kiadó · idő · forrás nyelve · összefoglaló 2–3 sor · indok **egy** mondat („Ezért lehet fontos neked: …") · gombok: Mentés · **Nem érdekel** · Megnyitás. A beállítás verziója **nem** a kártyán. **Két rész**: a fő lista a *fontos* és *érdekes* kategóriának; alatta összecsukva **„További helyi hírek ({n})"** a *háttér* kategóriának. Az AI-állapot sáv **számmal**: „{n} hír értékelése még készül — a többit már olvashatod." (nem az egész lista fölött hibaként). A számláló és a lista egy állapotból |
| 06 | Hírek · részletpanel 1440 | a panel **a felső sáv fölött**, saját fejléccel (cím + Bezárás mindig látszik); „Részletes összefoglaló" = a cikk tartalma; a kapcsolódás indoka külön, rövid mező; nyelvjelzés két külön adat: „forrás: román · összefoglaló: magyar"; a tartalomötlet **semleges** dobozban („Ötlet, hogyan írj róla" · „Ezt a javaslatot a hír alapján készítettük. Használat előtt nézd át." · normál álló betű, rövid bekezdések) — nincs narancs keret, nincs dőlt; gomb: **„Eredeti cikk megnyitása"** |
| 07 | Hírek · 390 | a fülek **elférnek** (rövid nevek vagy választó), a panel teljes képernyő saját fejléccel |
| 08 | Figyelés beállítása 1440 | **egy oszlop**, a részek egymás alatt, rövid kérdésekkel: **1. „Miről szeretnél híreket?"** (témák chipekkel + **„Hozzáadás" gomb** a mező mellett, a × neve „Téma eltávolítása") · **2. „Mely oldalakat figyeljük?"** (forráslista + hozzáadás; **forrássor műveletei**: állapot szóban („Ezt az oldalt most nem tudtuk feldolgozni.") + Újrapróbálás · Cím módosítása · Eltávolítás) · **3. „Pontosítás"** összecsukva (névváltozatok, kizárt témák, területi fókusz, megkülönböztetés semleges példával: „Ha egy név több dolgot jelent, add meg, melyik érdekel.") · a saját név kérdése **választógomb**: „Csak a szervezetet" / „A nevemet is" (+ névmező, ha az utóbbi). Gombok, a valódi sorrendben: **„Beállítás mentése"** → utána **„Próba indítása"** → a próba után **„Napi figyelés bekapcsolása"**; a próba gomb a mentés előtt egy mondattal mondja, miért nem aktív. AI-javaslat állapotai: készül · kész · nem sikerült + **Újrapróbálás**. A lista betöltési hibája **helyben** újrapróbálható. Nem mentett változásra figyelmeztetés kilépésnél |
| 09 | Figyelés beállítása · 390 | a fő gomb alul rögzítve |
| 10 | Találatok pontosítása 1440 | bevezető: „Jelöld, mely hírek érdekelnek." „A jelöléseid alapján pontosabb beállítást javaslunk." Üres állapot: ha van forrás → **„Próba indítása" helyben**; ha nincs → „Előbb adj meg egy hírforrást." + gomb. A kártya a 05 rövid alakja (magyar cím DÖNTÉS 3.5). Negatív ok: „Miért nem érdekel? Nem kötelező." — kihagyható. Haladásjelző: „{n} jelölés · a javaslat {m} után készül" + **„Ugrás a javaslathoz"**. A javaslat-doboz állapotai: készül · kész (elfogad · kipróbál · elvet) · nem sikerült + **Újrapróbálás** |

### R-7c · Beállítások-szint (Gépház, Értesítések, Adatkezelés, Kimenő, Megjelenés, Felület szövegei, Saját fiók, Tagok, Szervezet adatai)

Cél: **a laikus lássa, mi az övé és mit állíthat; a haladó dolgok egy „Haladó" rész mögött.**

| # | Artboard | Mi változik |
|---|---|---|
| 01 | Beállítások (a Gépház) · tulajdonos 1440 | **sorlista csoportokban**, nem különböző magasságú csempék: **Szervezet** (Szervezet adatai → · Csomag: „Próbaidőszak — a Hírek modul, ár és fizetés nélkül" · Pénznem választó) · **Csapattagok** (→ Tagok) · **Megjelenés** (→ Megjelenés) · **Használat** (AI-keret: „{összeg} maradt" →) · **Haladó** (Kapcsolat más rendszerekkel → Kimenő · Felület szövegei →). Minden sor: név · egy mondat a következményről („A felület színei és betűi.") · „→". **Az „Ami itt nincs" blokk elmarad.** A számok („0 tokent írsz felül") **nem** |
| 02 | Beállítások · rendszergazda 1440 | + **Rendszer** csoport (Fiókok · a közös alap Megjelenése · a közös Felület szövegei · árfolyam) |
| 03 | Értesítések 1440 | **a lista külön a kapcsolóktól**: fent a lista (idő · egy mondat emberi nyelven · teendő-gomb, ha van) — az üres állapot **egy sor**, nem doboz; a kapcsolók külön „Értesítési beállítások" részben lent vagy fülön; a hat kapcsoló mondatai a szótár szerint („Ha egy oldalt nem tudunk elérni", „Elkészültek a friss hírek", „A hírgyűjtés a szokásosnál tovább tart"). DÖNTÉS 3.3: az e-mail/telefon dobozok A szerint elmaradnak, egy mondat: „Az értesítéseket itt, az alkalmazásban látod." |
| 04 | Adatkezelés (Adatpolitika) 1440 | cím „Adatkezelés", alcím „Így használjuk a megadott adatokat."; **három kérdés**: „Mit küldünk tovább?" · „Kinek?" · „Mire használja?" — semleges panel, nem vörös; az AI-kapcsoló mellett a következmény: „A híreket továbbra is összegyűjtjük, de automatikus értékelés nem készül."; a betűkészlet sora: „A betűtípus betöltésekor a szolgáltató láthatja az IP-címedet."; a felhő-kapcsoló DÖNTÉS 3.3 |
| 05 | Kapcsolat más rendszerekkel (Kimenő) 1440 | **üres állapot elöl**: „Még nincs összekapcsolt rendszer." „A bekötéshez kérd a rendszergazda segítségét." — a lista alatta **összecsukva**; bekötve: a csoportok csukva, csak a fontosak nyitva; a soron **egy** vezérlő: Alapbeállítás · Bekapcsolva · Kikapcsolva + az érvényes rövid jele; a belső nevek (`futas_beragadt`) **nem** látszanak |
| 06 | Megjelenés · egyszerű nézet 1440 | **tulajdonosnak alapból ez**: logó (a feltöltött) · fő szín (választó) · világos/sötét · betűméret (kicsi/közepes/nagy — a `--fs-base` három értéke) · élő előnézet mellette. **Egy** fő gomb: „Változtatások mentése" (tervezet + alkalmazás egyben); „Haladó beállítások" hivatkozás a mai hat füles lapra (az marad, a rendszergazdáé is) |
| 07 | Felület szövegei 1440 | a kiválasztott nyelv nyitva, a másik két nyelv fülön; a technikai kulcs **halkan, másodlagos**; csoportnevek emberi néven; a gomb: „Szövegek mentése a szervezetnél" |
| 08 | Saját fiók 1440 | **1–2 oszlop**, három rész: Adataim · Biztonság · Szervezeteim; belépések: „Ma, 14:18" + IP részletként (böngésző-adat **nincs** — ne rajzold); az e-mail sora: „Az e-mail-címet jelenleg a rendszergazda tudja módosítani." (DÖNTÉS 3.3 szerint jelöléssel vagy anélkül); a munkatér-magyarázatok elmaradnak |
| 09 | Csapattagok (Tagok) 1440 | a Beállítások → Csapattagok sorból nyílik; szerepleírások: néző „Megnézheti az adatokat és a híreket." · szerkesztő „Módosíthatja a beállításokat és elindíthatja a hírgyűjtést. Meghívhat nézőt és szerkesztőt." · tulajdonos „A tagokat és minden beállítást kezelhet."; a párbeszéd gombja „Meghívólink létrehozása", a mező „Név vagy megjegyzés — nem kötelező" |
| 10 | Szervezet adatai (Ügyfélprofil) 1440 | cím „Szervezet adatai"; **Alapadatok** · **Tartalmak stílusa** · **Arculat** (ide költözik az onboarding 3. lépéséből a színek/betűk/mintakártya + az R-6 anyagok blokk — **változatlan tartalommal**, a mintakártya semleges szöveggel) — a halasztott arculat **nem hiány**, hanem „Arculat beállítása" másodlagos gomb; a piszkozat-magyarázat helyett: „A mentett adatok a következő hírgyűjtéstől érvényesek." |
| 11 | Beállítások és Megjelenés · 390 | a sorlista és az egyszerű nézet telefonon |

### R-7d · Nyitólap és adatkezelés

| # | Artboard | Mi változik |
|---|---|---|
| 01 | Nyitólap 1440 | nyitóblokk: **„Egy helyen a nektek fontos hírek."** · „Add meg, mely témák és hírportálok érdekelnek. Összegyűjtjük a fontos cikkeket, és röviden elmondjuk, miért érdemes elolvasnod őket." · **Fiók létrehozása** · Már van fiókom. Jobbra a fogalomkártya helyett **egy példa-találatkártya** (jelölve: „Példa"): cím · kiadó · dátum · 2 soros összefoglaló · „Ezért lehet fontos neked" · „Cikk megnyitása". **Egyszerű háttér** (a fotó és a két fényfolt elmarad), **egy** kiemelőszín. A „Mit tud ma" három kártyája marad, a fejlesztési megjegyzések („csak ami már működik", „nem kitalált százalék", „a közzététel nem a rendszer feladata") **elmaradnak** — a határok egy rövid kérdés–válasz részbe. Árazás, kapcsolat: DÖNTÉS 3.6 |
| 02 | Nyitólap 390 | egy oszlop, a példa-kártya a gombok alatt |
| 03 | Adatkezelés 1440 | a nyitólap **közös fejlécével** és láblécével (nem zsákutca); rövid összefoglaló három kérdésben (mint R-7c 04) + a teljes tájékoztató helye és dátuma (DÖNTÉS 3.6); kapcsolattartó sora |

### R-7e · Közös vizuális alap — a tokenek értéke

Ez a lap **nem képernyő**, hanem a skála: egy artboard mintákkal (szöveg, mező, gomb, kártya, jelvény), és a `tokenek.md`-ben az értékek. Ma mérve: `--fs-base` 15 px, `--fs-sm` = base − 2 (13 px), `--fs-xs` = base − 3 (12 px), `--control-min` 44 px (de nem minden mező ebből él — a fejlesztő oldal listázza, melyik nem).

| Mit kérek | Irány (az audit) |
|---|---|
| betűskála | alapszöveg 16 px, segédszöveg 14 px, a legkisebb ≥ 12,5 px; **arányos** származtatás (`--fs-sm` ≈ 0,875 × base), nem kivonásos; sorköz ~1,5 |
| beviteli mezők | egységes 44–48 px magasság mindenhol (`--control-min`), kényelmes érintési terület telefonon |
| hierarchia | egy fő művelet a legerősebb; a navigáció egyszerű háttérrel vagy aláhúzással, nem a kiemelőszínnel |
| színek jelentése | figyelmeztető szín (narancs) **csak** figyelmeztetésre; AI-eredet, halasztott arculat, link: semleges/saját token; a mai `--src-ai` értéke ezért változik |
| dobozok | kártya csak különálló tartalomnak; mezők egy szakaszban; panelen belüli panel nincs |
| tartalomszélesség | egységes maximum (pl. űrlap 640–720 px, lista 1100–1200 px) és egységes lapcím-pozíció |
| fények | a munkafelületen nincs fotó, üveg, gradiens-háttér, glow — nyugodt egyszínű felület; dekoráció csak a nyitólapon, ott is visszafogva |

## 6. Amit NEM szabad rajzolni

- ár, fizetés, csomagváltás, számla; e-mail-küldés; posztvázlat-írás a tartalomötletből („Posztvázlat készítése" gomb — új funkció, nincs); böngésző/eszköz neve a belépéseknél; „hol látszik" előnézet a Felület szövegeinél; kimenő üzenetek naplója; a horog címe.
- új lépés az első beállításba, vagy a három lépés összevonása — a mag három lépést tud.
- semmi, aminek a 2. pontban nincs gépezete. Ha hiányzik és fontos: `kerdesek.md`.

## 7. Amit visszakérek — pontosan ez a csomag

Egy zip: **`R7-audit-javitas.zip`**, a `SynologyDrive/SaaS/be/` mappába. Benne:

```
R7-audit-javitas/
├── OLVASD-ELOSZOR.md            mi van a csomagban, melyik lap melyik fájl, a döntés-jelölések listája
├── R-7a-elso-beallitas/
│   ├── rajz/R7a-elso-beallitas.dc.html    (+ support.js, ha kell) — a 8 artboard a fenti sorrendben és névvel
│   ├── ATADO.md                 artboardonként: mi épül, mi marad a régi rajzból, állapotok, telefonos eltérések
│   ├── feliratok.json           { "hu": {kulcs: szöveg}, "ro": {...}, "en": {...} } — a lap MINDEN szövege; a változott régi kulcs mellé "(változott)" az ATADO-ban
│   ├── adatkotes.md             melyik felirat/érték melyik adatból jön (a 2. pont végpontjaira hivatkozva)
│   ├── kerdesek.md              a DÖNTÉS 3.x B-változatai egy mondatban + a te kérdéseid, számozva
│   └── tokenek.md               használt tokenek; új token csak indokkal, alapértékkel, tartománnyal
├── R-7b-kezdolap-hirek/          ugyanez a szerkezet, 10 artboard
├── R-7c-beallitasok/             ugyanez, 11 artboard
├── R-7d-nyitolap/                ugyanez, 3 artboard
└── R-7e-vizualis-alap/
    ├── rajz/R7e-skala.dc.html   1 artboard: a minták
    └── tokenek.md               a skála: minden érintett token régi → új értéke, és miért
```

**Formai szabályok:** minden szöveg kulcsból (nincs „szabad" felirat a rajzon); `.dc.html` a Claude Design saját formátuma (tudjuk, hogy hálózat kell a megnyitásához); asztali 1440, telefon 390; az artboardok neve `NN · Lap · Nézet` a fenti táblák szerint; a „DÖNTÉS 3.x" jelölés az artboard sarkában.

**Határidő: órák, nem napok.** Ha nem fér egy körbe, **az R-7a és az R-7b jöjjön előbb** — ezek az első használat útja —, a többi utána, ugyanebbe a mappaszerkezetbe. Ami nem kész, arról egy sor az OLVASD-ELOSZOR-ben.

**Amit mi csinálunk a csomaggal:** minden lapot ellenőrzünk a mai gépezet ellen (`design/r7-*/ELLENORZES.md`), a kérdéseidre a kódból vagy Vilmostól válaszolunk, aztán lapról lapra építünk és rakunk ki a tesztre — képekkel. Ami a rajzon van és nem építjük meg: kérdés hozzád; ami a képernyőn lesz és nincs a rajzon: a mi hibánk.

## 8. Kérdések, amikre a `kerdesek.md`-ben várom a választ

1. Egy modulnál a **„Hírek" közvetlen menüpont** (3.1 A) — ha később több modul lesz, hogyan nő vissza lenyílóvá? Egy mondat a rajz jegyzetében elég.
2. A **„További helyi hírek"** a lista alján összecsukva, vagy külön fül? A fő lista rövidsége a cél.
3. A **Megjelenés egyszerű nézetén** a „fő szín" egy tokenre hat (`--primary`) vagy a gradiens párjára is? A gépezet bármelyiket tudja; a rajz döntsön.
4. Az R-7e **arányos betűskála** a Theme-lap Betűméret füljét is átrendezi (ma három csúszka) — kell-e ott változás, vagy elég a származtatás cseréje?
