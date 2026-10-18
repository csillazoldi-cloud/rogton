# 7. szakasz — Pilotkész állapot · TERV (2026-09-08) — kód csak Vilmos „mehet”-je után

Státuszjelölés végig: **[R]** rögzített követelmény · **[J]** megvalósítási javaslat ·
**[N]** nyitott döntés. Javaslatból csak Vilmos szavával lesz követelmény.

---

## 0. Mit kell bizonyítani (az átadó 7. sora)

> „Célzott biztonsági, terhelési, nyelvi és visszaállítási vizsgálat; költségek.
> Kimenet: **konkrét elfogadási jegyzőkönyv, megismert maradék kockázatok, üzemeltetési felelős**.”

**Ez a szakasz nem új funkciókról szól.** A rendszer funkcionálisan kész: a hat előző szakasz
lezárult, a 16 elfogadási feltételből 13 bizonyítva. Ez a szakasz arról szól, hogy a rendszert
**oda lehessen adni egy valódi ügyfélnek** anélkül, hogy bárki bajba kerülne.

Három elfogadási feltétel maradt nyitva:

| ID | Feltétel | Mai állás |
|---|---|---|
| **A-13** | Helyi-only adatpolitika esetén nincs automatikus felhős továbbítás | **részben** — a helyi modell kiesésekor nincs csendes átváltás (kódban), de terméki beállításként nincs |
| **A-15** | Mentésből helyreállítás **ténylegesen kipróbált** | **nincs** — se mentés, se visszaállítás |
| **A-16** | Az állított vizuális/nyelvi ellenőrzések ténylegesen elvégzettek, korlátaik jelöltek | **részben** — a gépi ellenőrzések futnak, a román/angol szöveg lektorálása hiányzik |

Ezen felül a `docs/RENDSZERLEIRAS.md` 10.9 fejezete **hét nyitott biztonsági pontot** sorol fel.
Ez a szakasz azokat is lezárja.

---

## 1. Mi készül (javaslat)

| # | Lépés | Mit látsz a teszten a végén | Idő | Ágens |
|---|---|---|---|---|
| **E-34** | **Belépési védelem** (D-17 után): sebességkorlát a belépésen és a regisztráción, fiókonként és IP-nként, kísérletnaplóval (ez egyben **hozzáférésnapló** is); jelszó-visszaállítás rendszergazda által kiadott, egyszer használatos linkkel; `Strict-Transport-Security` fejléc; takarító feladat a lejárt munkamenetekre | sok rossz jelszó után várni kell; elfelejtett jelszót vissza tudsz állítani; a naplóban látszik, ki mikor próbálkozott | 4 óra | 1 DeepSeek építő, 1 tesztelő |
| **E-35** | **Mentés és visszaállítás (A-15)**: napi mentés az adatbázisról és a második rendszer fájljáról; a mentés **máshol** is legyen, ne csak a NAS-on; és a visszaállítás **egyszer végigjátszva**, üres adatbázisba, bizonyítva, hogy az alkalmazás utána megy | mentésfájlok a helyükön; egy visszaállítási jegyzőkönyv méréssel | 4 óra | 1 DeepSeek építő |
| **E-36** | **Adatpolitika (A-13)**: szervezetenkénti beállítás — „az adatom nem mehet ki felhőbe”. Ha helyi-only és a helyi modell nem elérhető, a feladat **megáll**, nem vált át. A felületen látszik, a naplóban követhető; a teljes adatút leírva (mi hagyja el a házat és mikor) | a beállítás a felületen; kikapcsolt Dellel a futás tisztán megáll, nem megy ki adat | 4 óra | 1 DeepSeek építő, 1 tesztelő |
| **E-37** | **Terhelési mérés**: hány ügyfél, hány forrás, hány cikk fér el ezen a gépen. Mérés valódi futással, memóriával, idővel, adatbázis-növekedéssel; és hol törik el | egy konkrét szám: „ennyi ügyfél és ennyi forrás fér el, efölött ez történik” | 3 óra | — |
| **E-38** | **Nyelvi lektorálás (A-16)**: a román és angol feliratok emberi átnézése; a javítások a felirat-szerkesztőn át mennek be, majd migrációba | a felület románul és angolul is rendes, nem gépies | 3 óra + a lektor ideje | 1 lektor-ágens előkészítésnek, ember a végén |
| **E-39** | **Költségmérés szervezetenként**: ma egy közös havi keret van. Ügyfelenkénti költség és keret kell, hogy tudd, mibe kerül egy ügyfél havonta | egy lap, amin látszik, melyik szervezet mennyit használt | 3 óra | 1 DeepSeek építő |
| **E-40** | **Elfogadási jegyzőkönyv + üzemeltetési átadó**: az A-01…A-16 végigmérve, bizonyítékkal; a megmaradt kockázatok néven nevezve; üzemeltetési kézikönyv (ki a felelős, mi a teendő hiba esetén, hogyan látszik a költség); a szakasz zárása | `docs/ELFOGADASI-JEGYZOKONYV.md` és `docs/UZEMELTETES.md`; az állapotlap 7. állomása 100% | 3 óra | — |

**Összesen kb. 24 óra — előzetes becslés.** Ágensköltség lépésenként mérve (`docs/AGENSEK.md`).

**A sorrend nem véletlen.** E-34 és E-35 az, ami után a rendszert egyáltalán oda lehet adni
valakinek; E-36…E-39 az, ami után **el is lehet adni**; E-40 a papír, ami nélkül nincs átadás.

---

## 2. Döntések — egyesével, akkor, amikor az adott darab épül

Ezeket nem most kérdezem meg, hanem az adott lépés előtt, egyenként, a következményekkel együtt.

| # | Döntés | Mikor | Miért nem dönthetem el én |
|---|---|---|---|
| ~~**D-17**~~ | **ELDÖNTVE (2026-09-08): marad a nyílt regisztráció, sebességkorláttal.** A jelszó-visszaállítás rendszergazda által kiadott, egyszer használatos linkkel megy — e-mail-küldés nélkül. | ~~E-34 előtt~~ | — |
| **D-18** | **Hol legyen a mentés?** Csak a NAS másik kötetén / egy másik gépen is (Dell) / házon kívül is (felhős tárhely). Meddig őrizzük? | E-35 előtt | pénz és kockázat kérdése: ha a NAS elég, az olcsó, de tűzeset ellen nem véd |
| ~~**D-19**~~ | **ELDÖNTVE (2026-09-09):** a kapcsoló CSAK az AI-hívásra vonatkozna, a hírek letöltése marad. Vilmos döntése továbbá: **most csak az adatút leírása készül el**, a kapcsoló akkor jön, ha eldőlt, hol fut élesben az AI (ma a Dell az ő gépe, az élesbe nem megy). | ~~E-36 előtt~~ | — |
| **D-20** | **Ki nézi át a román és angol szöveget**, és mikorra? Te, egy kolléga, vagy fizetett lektor? | E-38 előtt | emberi kapacitás, amit nem tudok kiosztani |
| **D-21** | **Ki az üzemeltetési felelős**, és hogyan akarod, hogy szóljon a rendszer, ha baj van (e-mail, telefonos értesítés, semmi)? | E-40 előtt | ez a te felelősséged, nem műszaki választás |

**Ezen felül két üzleti döntés**, ami nem az én dolgom, de a pilot előtt kell:

- **Ki az első pilot-ügyfél?** (A Misszió Tours és a Veltol szóba került, de egyik sem eldöntött.)
- **Ár és csomag.** Az egyszeri bevezetési díj + ismétlődő használati díj javaslat volt az átadóban,
  de nincs végleges ár.

---

### 2.1 D-17 — a döntés és amit vállalunk vele (2026-09-08)

**Vilmos döntése: marad a nyílt regisztráció, csak sebességkorláttal.** Ez a kényelmes út:
bárkinek meg lehet mutatni a rendszert link küldésével, nincs meghívókezelés, nincs jelszóosztogatás.

**Amit ezzel vállalunk, kimondva** (hogy a pilot előtt ne érjen meglepetés):

- aki rátalál a címre, **fiókot nyithat** és — saját szervezetében — AI-keretet használhat;
- a pilot-ügyfél adata **ugyanazon az oldalon** lesz, ahol idegenek is regisztrálhatnak
  (az adatelválasztás ettől független és bizonyított — A-11 —, de a *kitettség* nagyobb);
- ezért a **sebességkorlát mostantól nem kényelmi funkció, hanem a fő védelem** — E-34-ben ennek
  megfelelő gondossággal épül, és a próbái is ehhez mértek.

Ha az első valódi pilot-ügyfél előtt ez szűkítendő, a meghívós út bármikor ráépíthető: a
sebességkorlát és a kísérletnapló, ami most készül, ott is kell.

**A jelszó-visszaállítás** rendszergazda által kiadott, egyszer használatos, lejáró linkkel megy.
E-mailes önkiszolgáló visszaállításhoz külön postafiók (SMTP) kellene Vilmostól — ez később
önálló lépés lehet, nem az E-34 része.

---

## 3. Mit NEM csinálunk ebben a szakaszban

- **Nem építünk új funkciót.** Se tartalomgyártás, se ütemezés, se közzététel, se fájlfeltöltés,
  se fizetés. Ezek a pilot után jönnek, a pilot tanulságaival.
- **Nem megyünk éles üzemre.** A pilotkész azt jelenti: **egy** valódi ügyfélnek, kísérettel,
  ismert kockázatokkal odaadható. Nem azt, hogy nyilvános szolgáltatás.
- **Nem csinálunk független biztonsági auditot.** Azt egy külső szakértő végzi, nem én —
  de a szakasz végére meglesz az, amit át lehet adni neki: adatfolyam, fenyegetési lista,
  megmaradt kockázatok.
- **Nem költözünk el a NAS-ról.** Ha a terhelési mérés (E-37) azt mutatja, hogy nem fér el
  a pilot, akkor az egy külön döntés lesz, nem ennek a szakasznak a része.

---

## 4. Elfogadási feltételek (a végén bizonyítjuk)

| # | Feltétel | Bizonyíték |
|---|---|---|
| **J-1** | Idegen nem tud bejutni a tesztoldalra; a belépés sebességkorlátozott; van jelszó-visszaállítás | élő próba kívülről: regisztrációs kísérlet, 10 rossz jelszó egymás után, majd egy sikeres visszaállítás |
| **J-2** | **A-15** — van napi mentés, és a visszaállítás **végig van játszva** üres adatbázisba, az alkalmazás utána megy | visszaállítási jegyzőkönyv: mikor, mennyi idő alatt, mi lett az eredmény; a helyreállított rendszer ellenőrizve |
| **J-3** | **A-13** — a helyi-only beállítás terméki funkció; kikapcsolt helyi modellel a feladat megáll, és **egyetlen bájt sem megy felhőbe** | élő mérés a Dell kikapcsolásával; a napló és az `ai_hivas` tábla mutatja, hogy nem volt felhős hívás |
| **J-4** | **A-16** — a román és angol felület emberi szemmel átnézve, a maradék korlátok jelölve | a lektor visszajelzése beépítve; a `docs/ATVETELI-ALLAPOT.md` mintájára külön mérési lap |
| **J-5** | Tudjuk, mennyi fér el és mibe kerül: konkrét szám ügyfélre, forrásra, havi AI-költségre | terhelési mérés jegyzőkönyve + szervezetenkénti költséglap a felületen |
| **J-6** | Van elfogadási jegyzőkönyv az A-01…A-16-ról, néven nevezett maradék kockázatokkal és üzemeltetési felelőssel | `docs/ELFOGADASI-JEGYZOKONYV.md` + `docs/UZEMELTETES.md` |

---

## 5. Ami a szakasz után is nyitva marad — előre kimondva

Hogy a végén ne érjen meglepetés:

| Marad | Miért |
|---|---|
| **Független biztonsági szakértői vizsgálat** | külső ember dolga; a szakasz csak előkészíti |
| **Terheléses növekedés a NAS-on túl** | ha több ügyfél jön, gép kell — az külön döntés és pénz |
| **A termék többi modulja** (tartalomgyártás, ütemezés, közzététel) | ezek a pilot tanulságai után épülnek, nem előtte |
| **Arab / RTL felület** | bővíthetőségi pont, nem pilotkövetelmény |
| **Automatikus közösségimédia-publikálás** | az átadó kizárja |

---

## 6. Mi történik a szakasz végén

A hetedik szakasz zárásával a projekt **eléri azt az állapotot, amire indult**: van egy több
ügyfélnek eladható, iparágfüggetlen, AI-központú kommunikációs munkakörnyezet, benne az első
szakmai modullal (hírfigyelő), bizonyított hordozhatósággal, és egy olyan papírral, amit
oda lehet adni egy ügyfélnek vagy egy biztonsági szakértőnek.

**Onnantól már nem fejlesztés a kérdés, hanem az első valódi ügyfél.**

---

## Kapcsolódó dokumentumok

| Dokumentum | Mit tartalmaz |
|---|---|
| `docs/RENDSZERLEIRAS.md` | a rendszer teljes leírása — a 10.9 fejezet a nyitott biztonsági pontok listája |
| `docs/TESZTELESI-UTMUTATO.md` | a tesztelő kézikönyve |
| `docs/ATADO-1.0.md` | a termék hiteles követelményjegyzéke (R-01…R-20, A-01…A-16) |
| `docs/HATODIK-SZAKASZ-ZARAS.md` | az előző szakasz zárása — a minta, ahogy ez is zárulni fog |
| `NAS-szabalyok.md` | az üzemeltetési szabálykönyv, amire az E-40 üzemeltetési átadója épül |

---

# E-34 — Belépési védelem · KÉSZ (2026-09-09)

## Mi készült

| Rész | Mit csinál |
|---|---|
| **Sebességkorlát** (`hitelesites/korlat.ts`) | két külön számláló: FIÓK szerint (5 rossz jelszó / 15 perc), CÍM szerint (20 rossz / 15 perc; regisztráció 20 / óra). A szigorúbb dönt. **Adatbázisban** számol, nem memóriában — az újraindítás nem törli el a számlálót. |
| **Kísérletnapló** (`belepesi_kiserlet`, migráció 0034) | minden belépési, regisztrációs és visszaállítási kísérlet: fajta, e-mail, cím, sikeres-e, mikor. Ez **egyben a hiányzó hozzáférésnapló**, 30 napos megőrzéssel. |
| **Jelszó-visszaállítás** (`jelszo_visszaallitas` + 2 útvonal + lap 3 nyelven, migráció 0035) | a rendszergazda ad ki egyszer használatos, 1 óra alatt lejáró jegyet. A jegy csak SHA-256 **lenyomatként** tárolódik. Az új jelszó a fiók **összes** munkamenetét érvényteleníti. |
| **HSTS** (`nas/nginx.conf`) | `max-age=86400` — szándékosan rövid, mert teszt környezet; a pilot előtt 1 évre emelendő. |
| **Óránkénti takarítás** (`hitelesites/takaritas.ts`) | lejárt munkamenetek, felhasznált jegyek, régi naplósorok. A meglévő háttérfuttató hívja. |
| **Mérő végpont** (`/api/belso/cim`) | megmutatja, hányadik proxy mögül látja a kérő címét. |

## Amit a fordított ellenőrzés hozott

**A gép offline volt, ezért ágens helyett magam mentem végig az állításokon.** Ez nem egyenértékű
egy független ellenőrzéssel — de három **valódi** hibát talált a saját munkámban:

1. **A kérő címe hamisítható volt.** Az nginx `$proxy_add_x_forwarded_for`-t használ, ami HOZZÁFŰZ,
   tehát a lista eleje a kérő saját írása — én pedig balról olvastam. **Javítva: jobbról számolunk**
   (`MEGBIZHATO_PROXY_DB`); rossz beállításnál a jobb szélső értéket vesszük, mert azt a saját
   proxynk írta (túl szigorú, de nem megkerülhető).
2. **A sikeres belépés TÖRÖLTE a napló sorait.** Egy hozzáférésnaplót nem törölhet az, akiről szól.
   **Javítva: nem törlünk semmit** — a számláló csak az utolsó siker ÓTA nézi a sikertelen próbákat.
3. **A regisztrációs korlát túl szigorú volt** (5/óra egy címről): a saját próbakészletünk azonnal
   fennakadt rajta, és ugyanez történne egy irodával, ahol többen egy címről néznék meg. **Javítva: 20/óra.**

Negyedikként: az „egyszer használható jegy" próbám **átment akkor is, amikor kivettem az őrt** — mert
a sorban érkező második kérést már az olvasás kiszűri. Írtam egy újat (**4b**), ami két **egyszerre**
érkező kéréssel a valódi versenyhelyzetet méri; az az őr nélkül elbukik.

## Mérés — élőben, kívülről (2026-09-09)

**A proxyszám mérése** (`https://saas.mediapartizan.ro/api/belso/cim`) — ez volt a kirakás kötelező lépése:

| Amit küldtem | Amit a kiszolgáló látott | Amire jutott |
|---|---|---|
| semmi | `86.120.238.206, 172.23.0.1` | `86.120.238.206` — **a valódi cím**, független forrással egyeztetve |
| 1 hamis elem | `1.2.3.4, 86.120.238.206, 172.23.0.1` | `86.120.238.206` |
| 3 hamis elem | `9.9.9.9, 8.8.8.8, 7.7.7.7, 86.120.238.206, 172.23.0.1` | `86.120.238.206` |
| hamis `x-real-ip` | a DSM felülírja | `86.120.238.206` |

**A `MEGBIZHATO_PROXY_DB=2` alapérték helyes ezen a rendszeren.** A hamisítás egyik változata sem
kerüli meg a korlátot.

**A korlát élőben:**

| Lépés | Eredmény |
|---|---|
| regisztráció, első belépés | 201, 200 |
| 1–5. rossz jelszó | mind `ROSSZ_BELEPES` (401) |
| 6. rossz jelszó | **429 `TUL_SOK_KISERLET`**, `retry-after: 900` |
| **a HELYES jelszó a zár alatt** | **429** — a zár tényleg zár |
| másik fiók ugyanarról a címről | **200** — a zár nem terjedt át |
| jegy kérése belépés nélkül | 401 |
| találgatott jegy | 400 `ERVENYTELEN_JEGY` |
| `Strict-Transport-Security` fejléc | `max-age=86400` ✅ |
| a visszaállító lap HU / RO / EN | „Új jelszó" / „Parolă nouă" / „New password" ✅ |
| a fő lapok (`/`, `/belepes`, `/allapot/`, `/referencia/`) | mind 200 |

**Próbák:** webalkalmazás **186 zöld** (161 régi + 18 belépési védelem + 7 címkiolvasás),
csomagok 235 zöld — **összesen 421**. Határőr 249 modul / 0 sértés, tokenőr 187 fájl / 0 sértés.

**Visszavonás-próbával ellenőrizve**, hogy a próbák tényleg fognak: a védelem kiiktatásakor
**6 próba elbukik**; a versenyhelyzet őrének kivételekor a 4b bukik el. Visszaállítás után mind zöld.

## Amit élőben NEM tudtam végigjátszani

**A jelszó-visszaállítás teljes körét** (jegy kiadása → új jelszó → régi munkamenetek megszűnése)
csak a helyi másolaton mértem, mert a jegyet **rendszergazda** adja ki, és a tesztoldalon nincs
rendszergazda-fiókom. Adatbázis-írással kiadhatnám magamnak a jogot, de a szabály szerint az
adatbázishoz csak olvasási joggal nyúlok. **Ezt Vilmosnak kell egyszer végigkattintania** a saját
rendszergazda-fiókjával (T17.9–T17.11 a tesztelési útmutatóban).

## Amit tudatosan vállalunk

- **A cím szerinti korlát a második védelmi vonal.** A fiók szerinti az, ami hamisítással eleve nem
  kerülhető meg (az e-mail a kérés törzséből jön).
- **A fiókzár a jogos tulajdonost is kizárhatja**: aki ismer egy e-mailt, 5 rossz jelszóval 15 percre
  kizárhatja onnan a gazdáját. Minden fiókzár velejárója; a zár rövid, és van visszaállító jegy.
- **A visszaállító jegy a cím sorában utazik**, tehát bekerül a böngésző előzményeibe. A lap nem tölt
  külső forrást, így máshova nem szivárog; a jegy egyszer használható és egy óra alatt lejár.

---

# E-35 — Mentés és visszaállítás (A-15) · KÉSZ, a NAS-on lemérve (2026-09-09)

**D-18 (Vilmos, 2026-09-09): a mentés a NAS MÁSIK KÖTETÉRE megy.** A projekt a `volume2`-n él,
a mentés a `volume1`-re. Ez nem véd tűz, lopás vagy a teljes gép elvesztése ellen — házon kívüli
mentés külön döntés a pilot előtt.

## Mi készült

| Fájl | Mit csinál |
|---|---|
| `nas/mentes.sh` | napi mentés: PostgreSQL (sima SQL, tömörítve) + a referencia-host SQLite-fájlja. **Mér, mielőtt indul** (3 GB / 20-as terhelés), a **közös kapun** át megy, és **nem töröl** — a lejárt mentések a `_torolni/` mappába kerülnek. Megőrzés: 7 napi + 4 heti. |
| `nas/visszaallit-proba.sh` | **az A-15 bizonyítéka**: a legfrissebb mentést visszatölti egy KÜLÖN, ideiglenes adatbázisba, tábláról táblára összeveti a sorszámokat az élessel, ellenőrzi az SQLite-mentés épségét, majd eldobja az ideiglenest. **Az éles adatbázishoz hozzá sem nyúl.** |
| `docs/MENTES.md` | a kézikönyv: mit mentünk és mit NEM (a titkok szándékosan kimaradnak), hova, hogyan indul magától, és **a valódi visszaállítás lépésről lépésre** — arra az esetre, ha tényleg baj van. |

**Két apróság, ami nem magától értetődő, ezért ki van mondva a kódban:**

- **A futó SQLite-fájlt nem másoljuk.** A `VACUUM INTO` egy ép, önmagában teljes pillanatképet ír —
  mérve, hogy read-only kapcsolaton is működik (Node 24 `node:sqlite`).
- **Az adatbázis-mentés a doboz saját socketén megy**, a `postgres` rendszerfelhasználó nevében:
  így jelszó nem kell hozzá, és nem is jelenik meg sehol.

## 1. mérés — a felhős másolaton (2026-09-09 délelőtt), a hibautakkal

| Eset | Eredmény |
|---|---|
| ép mentés | `A VISSZAÁLLÍTÁS MŰKÖDIK. 27 tábla, 3043 sor hiánytalanul visszajött` — a visszatöltés **1 másodperc**, a mentés **152 kB** |
| félbevágott mentés | `FIGYELEM — 20 eltérő tábla`, tábláról táblára kiírva a különbség |
| sérült tömörített fájl | `A MENTÉS SÉRÜLT — a tömörített fájl nem olvasható végig` |
| nincs mentés a mappában | `NINCS mentés — előbb futtasd a mentes.sh-t` |
| `VACUUM INTO` read-only kapcsolaton | működik; a pillanatkép `integrity_check: ok`, 500/500 sor |

## 2. mérés — A NAS-ON, ÉLESBEN (2026-09-09 13:49–13:51)

Ez az A-15 bizonyítéka: a két szkript a `transzmozaik` NAS-on futott, a valódi adatbázison.

**A mentés (`mentes.sh`):**

| Amit mért | Eredmény |
|---|---|
| indulás előtti mérés | felszabadítható memória 10 528 MB, terhelés 1 — a NAS-szabályok szerint indulhat |
| közös kapu | `elvitte a zsilipet` 13:49:15 → `elengedte` 13:49:16 (a `kozos/naplo.txt`-ben) |
| adatbázis-mentés | `db-20260909-1349.sql.gz`, **248 kB, 1 másodperc** |
| referencia-host (SQLite) | `referencia-20260909-1349.sqlite.gz`, **20 kB** |
| hova került | `/volume1/homes/Portik/mentesek/aitmetica-saas/` — a **másik köteten** (D-18) |

**A visszaállítási próba (`visszaallit-proba.sh`) — ugyanazon a gépen, az éles adatbázis érintése nélkül:**

| Lépés | Eredmény |
|---|---|
| a mentés épsége | `a tömörített fájl ép (gzip -t)` |
| visszatöltés külön, ideiglenes adatbázisba | **9 másodperc, 0 hibaüzenet** |
| összevetés tábláról táblára az élessel | **27 tábla, 4064 sor — eltérés: 0** |
| a referencia-host mentése | `ok, 11 tábla, 10 találat` |
| az ideiglenes adatbázis | eldobva; a próba teljes ideje **13 másodperc** |

> `EREDMÉNY: A VISSZAÁLLÍTÁS MŰKÖDIK. 27 tábla, 4064 sor hiánytalanul visszajött 9 mp alatt.`

A napló mindkét sort megőrzi (`mentesek/aitmetica-saas/mentes-naplo.txt`).

## Amit a próbaírás közben találtam (két valódi hiba a saját szkriptemben)

1. **A hibaszámláló két nullát adott vissza.** A `grep -c` találat nélkül „0"-t ír ki ÉS 1-gyel lép ki;
   a `|| echo 0` emiatt egy második nullát is beírt, és a számösszehasonlítás elszállt.
2. **Sérült mentésnél a szkript NÉMÁN kilépett.** A `zcat` elhalt, a `set -e` megállította a szkriptet,
   és semmi nem íródott ki — azt hinnéd, minden rendben. **Ez a legrosszabb fajta hiba egy mentőrendszerben.**
   Javítva: a fájl épségét ELŐBB ellenőrizzük, és a visszatöltés hibáit mi jelentjük, nem a shell.

**Harmadik hiba — ez csak a NAS-on futtatva derült ki:** a szkript rendszergazdaként fut, ezért a
mentések mappája és minden fájlja **a rendszergazdáé** lett Vilmos saját mappáján belül. Így a
File Stationben nem tudta volna kezelni őket — pedig a `_torolni/` ürítése épp az ő dolga.
Javítva: a szkript a mentésmappát annak a felhasználónak adja, akié a fölötte lévő mappa
(indulás előtt és a mentés végén is). Lemérve: a mappa és mind a hat fájl a gazdájáé.

## Ami hátra van az E-35-ből — egyetlen kattintás

- ~~A szkriptek lefuttatása a NAS-on~~ **megvan** (2026-09-09 13:49–13:51, a fenti mérés).
- **A napi indítás beállítása a Synology feladatütemezőjében** — ez Vilmos egyszeri kattintása,
  a pontos lépések a `docs/MENTES.md` 3. fejezetében. Amíg ez nincs meg, a mentés csak kézzel indul.

**Az A-15 lényegi része ezzel teljesült:** van mentés, és a visszaállítás **ténylegesen ki van
próbálva** a valódi gépen, méréssel. Ami hiányzik, az a napi automatizmus, nem a képesség.

**Amit tudatosan vállalunk:** a mentés ugyanazon a gépen marad, csak másik köteten (D-18).
Tűz, lopás vagy a teljes NAS elvesztése ellen nem véd — házon kívüli mentés külön döntés a pilot előtt.

---

# E-36 — Adatpolitika (A-13) · az adatút leírása kész (2026-09-09)

## Miért nem a kapcsoló készült el

A terv szerint az E-36 egy szervezetenkénti kapcsoló lett volna: „az adatom nem mehet ki felhőbe",
és ha a helyi modell nem elérhető, a futás megáll. Vilmos kérdése ezt megállította, jogosan:
**ez egy SaaS lesz, ami hostingon fut — mit jelent ott az, hogy „helyi"?**

A válasz: élesben a „helyi" nem az ügyfél gépe, hanem az, hogy az AI **a mi saját kiszolgálónkon**
fut, nem egy külső cégnél. **Ma viszont nincs ilyen gépünk**: a nehéz munkát a Dell végzi, ami Vilmos
munkaállomása, és nem költözik hostingra. Egy kapcsoló, ami olyasmit ígér, amit a rendszer nem tud
betartani, rosszabb a semminél — ez a „ne legyen gépezet nélküli kapcsoló" szabály esete.

**Vilmos döntése (2026-09-09):** most csak az adatút leírása készül el; a kapcsoló akkor jön, ha
eldőlt, hol fut élesben az AI.

## Mi készült

`docs/ADATUT.md` — mi hagyja el a rendszert, mikor és kihez. **Mérésből, nem a korábbi papírokból.**
A lényege:

| Mi megy ki | Kihez | Visz-e ügyféladatot |
|---|---|---|
| a hírforrás letöltése (+ robots.txt, + címfeloldás) | a forrás oldal kiszolgálója, a DNS | **nem** |
| a cikk szövege + a szervezet profilja + a beállítás | a beállított AI-szolgáltató | **igen — ez a lényegi pont** |
| betűkészletek a látogató böngészőjéből | **Google** (fonts.googleapis.com, fonts.gstatic.com) | a látogató IP-címét igen |

**Amit a mérés hozott, és amit eddig senki nem mondott ki:**

1. **A felület a Google betűkészlet-szolgáltatását használja** — tehát minden látogató böngészője
   kapcsolatba lép a Google-lel. Kívülről lemérve a tesztoldalon. Európai közintézménynél ez valódi
   kifogás; saját kiszolgálóról kiszolgálva megszűnik, a kinézet nem változik. **Külön kis lépés, Vilmos döntése.**
2. **A második rendszer (`/referencia/`) egyetlen külső hivatkozást sem tölt** — szintén kívülről mérve.
3. **Az `ai_hivas` napló nem tárolja a kiküldött szöveget**, csak számokat (feladat, szolgáltató,
   modell, tokenek, idő, sikerült-e) — az adatbázis szerkezetéből.
4. **Eddig a munka túlnyomó része házon belül történt**: `helyi-ollama` 769 hívás, `teszt` 49,
   `claude-elofizetes` 20, `codex-elofizetes` 1 (az adatbázisból, csak olvasva).
5. **Az előfizetéses út valódi ügyféladathoz nem való**: egy magánszemély előfizetésén haladna át.

## Visszaellenőrzés

Egy ágens (Kimi k2.6, 70 mp, **0,0375 USD**) átnézte a leírást a kód ellen. Három valódi hiányt talált
— a címfeloldás (DNS), a híd-doboz köztes lépése, a helyi AI állapotlekérdezése —, mindhárom bekerült.
Két sorhivatkozást hibásnak mondott; utánamértem, **a leírásé volt a helyes** (az ágens sorszámok
nélkül kapta a fájlokat, ezért becsült). A jelentés nem elhihető ellenőrzés nélkül — ez is mérés kérdése.

## Az A-13 állása ezzel

**Részben teljesült.** Ami megvan: az adatút pontosan leírva, mérésekkel, néven nevezve, ki mit lát.
Ami nincs: a terméki kapcsoló és a mögötte lévő gépezet. **Ez az elfogadási jegyzőkönyvben (E-40)
így, kimondva fog szerepelni** — nem „teljesítettként".

---

# E-37 — Terhelési mérés · KÉSZ (2026-09-09)

Teljes jegyzőkönyv: **`docs/E-37-TERHELES.md`**. A lényeg:

| Kérdés | Mért válasz |
|---|---|
| Mi a szűk keresztmetszet? | **az AI ideje** — nem a memória, nem a lemez, nem a webkiszolgáló |
| Hány ügyfél fér el? | **kb. 120**, ha a napi futások egy 6 órás ablakban oszlanak el (napi ~30 új cikk/ügyfél) |
| Ha mindenki ugyanarra az órára kéri? | **kb. 20** — a rendszer egyszerre egy munkát futtat, és egy AI-gép van |
| Egy új cikk feldolgozása | **5,8 másodperc** (11 valódi futás átlagából) |
| Látogatói terhelés | **60 egyidejű látogató: 300 kérés, mind hibátlan, 985 ms középső válaszidő** — nem korlát |
| Memória | alkalmazás 143 MB / 512 terhelés alatt; adatbázis 88 / 384 — bőven van tartalék |
| Lemez | egy cikk 3,3 kB → 120 ügyfélnél **kb. 4,3 GB/év** |
| Hol törik el először? | az AI-gép: sorban dolgozik, és ha áll, minden áll (2026-09-08-án élesben láttuk) |

**Amit a mérés talált és tenni kell vele:** a második rendszer (referencia-host) **munka nélkül a
memóriakorlátjának 64%-án ül** (164 MB / 256 MB). Ma bemutató célú, ezért nem gond; ha valódi
terhelést kapna, a korlátját emelni kell.

**Amit szándékosan nem mértem:** nem hajtottam a NAS-t törésig — öt projekt fut rajta, és egy ilyen
mérés 2026-09-06-án órákra használhatatlanná tette. A fajlagos költségeket mértem, és abból számoltam.

---

# E-38 — Nyelvi lektorálás (A-16) · a gépi kör kész, az emberi kör hátravan (2026-09-09)

## Hogyan ment

A felület **677 szövegkulcsát** három nyelven (2031 sor) kiszedtem a futó rendszerből, és
**két AI-lektorral** átnézettem a román és angol változatot a magyar eredeti ellen. Utána egy
**harmadik ágens felülbírálta** a javaslatokat azzal az utasítással, hogy csak a valódi hibát tartsa
meg, az ízlésbeli átírást vesse el. A maradékot **soronként magam néztem át.**

## Mennyi maradt meg — és ez a lényeg

| Lépcső | Darab |
|---|---|
| a két lektor „javaslata" | 365 |
| ebből **üres javaslat** (szó szerint a mostani szöveget „javasolta") | **201** |
| valódi változtatási javaslat | 164 |
| a felülbíráló ágens megtartotta | 50 |
| **én ebből kivettem** (hibát vitt volna be) | **2** |
| **végül bement** | **48** (41 román, 7 angol) |

**A 365 javaslatból 48 volt valóban jó — 13%.** Ezt érdemes megjegyezni: egy lektor-ágens
kimenetét nem szabad ránézés nélkül beengedni.

**A két, amit én vettem ki** — mindkettő hibát vitt volna a felületre:

1. `regisztracio.cim_eleje` angolul: „Create an" → „Create a". A cím két darabból áll
   („Create an" + „account."), tehát a javítás után **„Create a account."** lett volna.
2. `hf.ovSummaryTitle` angolul: „The big picture" → „Overview". Az „Overview" **már foglalt**:
   így hívják a hírfigyelő egyik lapját (`hf.pOverview`). Két különböző dolog kapott volna
   ugyanolyan nevet.

## Mi javult

Nagyrészt román nyelvhelyesség és szóhasználat: hiányzó névelő és többes szám
(`{n} secțiune lipsă` → `secțiuni`), a felesleges „aplicația completă" helyett „întreaga aplicație",
a felkiáltó „Reîncarcă" helyett „Reîncercare", a magyar tükörfordítások helyett természetes
szerkezetek (`Dau un site web` → `Introduc un site web`), és a szakszavak egységesítése
(`Identitate` → `Identitate vizuală` mindenütt, ahol az arculatról van szó).

## Kirakva és kívülről ellenőrizve

Migráció **0036**; az alkalmazás újraindult (a feliratok a kiszolgálón gyorsítótárazódnak,
enélkül a régi szöveg maradt volna). Kívülről mérve: a román belépőlap címe
`Autentificare — Spațiu de lucru de comunicare`. A magyar szövegek nem változtak.

## Ami hátravan: az EMBERI kör (D-20)

Ez a lépés **nem helyettesíti az anyanyelvi olvasót**. Az A-16 azt kéri, hogy az állított
ellenőrzések tényleg megtörténjenek, és a korlátaik jelölve legyenek — a korlát itt ez:
**a román és angol szöveget eddig csak gépek nézték át.** Egy anyanyelvi román olvasónak
végig kell mennie a felületen; a javításokat a Feliratok szerkesztőjén be tudja vinni, onnan
migrációba kerülnek. **Ki legyen ez, és mikorra — Vilmos döntése (D-20).**

**Ágensköltség:** 5 lektor-futás + 2 felülbírálás, összesen kb. **0,10 USD** (`docs/agens-naplo.jsonl`).

---

# E-39 — AI-költség és keret szervezetenként · KÉSZ és kint (2026-09-09)

## Mi változott a tervhez képest

A terv „költségmérést" kért. A **terhelési mérés (E-37) miatt a lap nem csak dollárt mutat**:
a munka java a házon belüli gépen fut, ami **nulla dollár** — a pénz így nem mérné meg a valódi
terhelést. Ezért a lap három számot mutat egymás mellett: **hívásszám, AI-gépidő, becsült költség.**
Vilmos ezt a rajzzal együtt jóváhagyta.

## Mi készült

| Rész | Mit csinál |
|---|---|
| `szervezet.ai_keret_usd` (migráció 0037) | szervezetenkénti havi keret; üresen hagyva az alapérték (`AI_HAVI_KERET_USD`) érvényes rá |
| `keretEllenoriz(szervezetId)` | **két fék**: a szervezeté (terméki korlát) és a rendszeré (`AI_RENDSZER_KERET_USD`, alapból az ügyfélkeret tízszerese — kerítés a nyílt regisztráció mellé, D-17) |
| `ai_koltseg_osszes()`, `ai_keret_allit()` | SECURITY DEFINER függvények: a sorszintű védelem miatt a km_app csak a saját szervezetét látja. **Csak összesítést adnak vissza** — cikk, prompt, AI-válasz nem megy át rajtuk. A rendszergazda-jogot az API ellenőrzi. |
| `/api/koltseg`, `/api/koltseg/osszes`, `/api/koltseg/keret` | saját nézet (minden tag), gazda-nézet és keretállítás (csak rendszergazda) |
| `/koltseg` két nézettel | a rendszergazda minden szervezetet lát és a kereteket állítja; mindenki más a sajátját |

**Ami NEM volt a rajzon, mégis bekerült:** a fiókoldal oldalsávjában egy link a lapra — enélkül
nem lehetne odajutni. Ez a kódban meg van jelölve; ha nem kell, egy sor törlése.

## Bizonyíték: a keret nem díszlet

**10 új gépi próba** (`probak/koltseg.proba.ts`), köztük a lényegi:

| Próba | Eredmény |
|---|---|
| a rendszergazda nullára állítja a szervezet keretét | 200 |
| ugyanaz a szervezet AI-t hív | **429 `AI_KERET_KIMERULT`** |
| a keret visszaállítása után ugyanaz a hívás | **200** |
| a hívás megjelenik a saját nézetben | hívásszám nő, a feladat neve látszik |

Továbbá: a gazda-nézet közönséges tagnak **403**, a keretállítás **403** — és utána az adatbázisban
tényleg nem változott semmi (a próba ezt is megnézi).

## Mérve a kirakott rendszeren (kívülről, 2026-09-09)

| Amit néztem | Eredmény |
|---|---|
| `/api/koltseg` belépés nélkül | 401 |
| regisztráció → szervezet → saját nézet | 201 / 201 / 200, keret 5,00 $, hívás 0 |
| gazda-nézet közönséges tagnak | 403 |
| keretállítás közönséges tagnak | 403 |
| valódi AI-hívás (összefoglaló, előfizetéses Claude) | 200, 8,3 mp — utána a lapon: 1 hívás, 7 071 ms gépidő |
| a `/koltseg` lap HTML-je | 200 |

**Amit a képernyőkép talált** (ezért kell kép, nem elég a próba): a saját nézetben
`15% {n}% elhasznalva` jelent meg — a helyettesítőt nem a ház saját `t()` függvénye cserélte.
Javítva, újra kirakva, élőben ellenőrizve: `0% elhasználva`.

Képek: `Claude outputs/e39-kepernyok/`.

## Két saját hiba, amit menet közben találtam

1. **`apps/web/app/tokenek.css` visszajött a halálból.** E-16-ban törölve lett (nem használt, a
   tokenőrt elbuktatta), de a 6. szakasz kirakása visszahozta a tárhelyre. A tokenőr **35 sértést**
   jelzett rajta. Törölve, a tokenőr újra tiszta (197 fájl, 0 sértés).
2. **Az E-38 lektorálás három szövege csak az adatbázisba került be**, a modul adatfájljába
   (`packages/news-monitor-feliratok/feliratok/*.json`) nem. A szinkron-próba mutatta ki. Javítva.

**Ágensköltség:** 2 építő ágens (DeepSeek), 0,0086 USD. A képernyőket ők írták; az összeillesztés
(feliratkezelés a ház szabálya szerint, közös típusok, tokenőr-tiszta CSS, a talált hibák) kézi munka volt.

---

# E-40 — Elfogadási jegyzőkönyv és üzemeltetési átadó · A 7. SZAKASZ LEZÁRVA (2026-09-09)

## Mi készült

| Dokumentum | Mit tartalmaz |
|---|---|
| `docs/ELFOGADASI-JEGYZOKONYV.md` | az A-01…A-16 végigmérve, bizonyítékkal; **14 teljesült, 2 részben** (A-13, A-16); 11 néven nevezett maradék kockázat; 5 nyitott üzleti/műszaki döntés |
| `docs/UZEMELTETES.md` | mi hol fut, napi/heti teendők, mit tegyünk ha baj van, mit nem csinálunk soha, hol látszik minden |

## A szakasz elfogadási feltételei (J-1…J-6)

| # | Feltétel | Állás |
|---|---|---|
| **J-1** | belépési védelem, sebességkorlát, jelszó-visszaállítás | **teljesült** (E-34, kívülről mérve) — a visszaállítás teljes körét Vilmosnak kell egyszer végigkattintania |
| **J-2** | A-15: van napi mentés, a visszaállítás végigjátszva | **teljesült** (E-35, a NAS-on mérve) — a napi automatikus indítás Vilmos egy kattintása |
| **J-3** | A-13: a helyi-only beállítás terméki funkció | **RÉSZBEN** — az adatút leírva és mérve; a kapcsoló tudatosan nem épült meg (nincs éles saját AI-gép) |
| **J-4** | A-16: a RO/EN felület emberi szemmel átnézve | **RÉSZBEN** — a gépi kör kész (48 javítás kint), az emberi kör hátravan (D-20) |
| **J-5** | tudjuk, mennyi fér el és mibe kerül | **teljesült** (E-37 + E-39) |
| **J-6** | elfogadási jegyzőkönyv néven nevezett kockázatokkal és üzemeltetési felelőssel | **teljesült** a jegyzőkönyv és a kézikönyv; **az üzemeltetési felelős személye Vilmos döntése (D-21)** |

**Négy teljesült, kettő részben — mindkét „részben" tudatos döntés eredménye, nem elmaradt munka,
és a jegyzőkönyvben így is szerepel.**

## Ami a 7. szakasz után nyitva marad

1. **Vilmos két kattintása:** a napi mentés beállítása a NAS feladatütemezőjében, és a
   jelszó-visszaállítás egyszeri végigkattintása a rendszergazda-fiókkal.
2. **Két döntés:** ki nézi át anyanyelvi szemmel a román szöveget (D-20), és ki az üzemeltetési
   felelős + hogyan szóljon a rendszer (D-21).
3. **Négy kockázat, ami pénzt vagy döntést kíván:** hol fut élesben az AI (K-2), az előfizetéses
   út leváltása (K-3), a Google-betűkészlet kiváltása (K-4), házon kívüli mentés (K-6).
4. **Független biztonsági vizsgálat** — az átadható anyag készen áll.

## Ezzel a projekt elérte azt az állapotot, amire indult

Van egy több ügyfélnek eladható, iparágfüggetlen, AI-központú kommunikációs munkakörnyezet, benne
az első szakmai modullal (hírfigyelő), **bizonyított hordozhatósággal** (ugyanaz a mag két külön
rendszerben, másolt kód nélkül), és egy olyan papírral, amit oda lehet adni egy ügyfélnek vagy egy
biztonsági szakértőnek.

**Onnantól már nem fejlesztés a kérdés, hanem az első valódi ügyfél.**

---

# E-41 — Nyilvános nyitólap · KÉSZ és kint (2026-09-09, a szakasz zárása UTÁN)

Nem a 7. szakasz terve része: Vilmos vette észre, hogy a főoldalon még mindig az E-1 egysoros
üres kezdőképernyője van („Kommunikációs munkatér · 0.1.0 · teszt"). Pilot előtt ez az első, amit
egy meghívott lát. Vilmos döntése: rendes nyitólap készüljön, és **a tervet a Claude Design csinálja**
— a promptot ő kérte tőlem, a rajzot ő hozta vissza.

## A terv

`design/nyitolap/Nyitolap.dc.html` + `NYITOLAP-ATADO.md` (a teljes v8 csomag:
`design/aitmetica-felulet-prototipus-v8.zip`). Két artboard: asztali 1440, telefon 390.

## Amit a terv hozott magával: négy új méret-token

A rajz olyan méreteket használ, amikre nem volt token (hero 52 px, telefonon 32, szekciócím 26,
zárócím 30). **Vilmos döntése: legyen rá négy új token**, ne pixelben álljon a lapban.
Bekerült a közös témába (`--fs-hero`, `--fs-hero-sm`, `--fs-szekcio`, `--fs-zaro`), a típusos
sémába, a token-szabályokba, és **a Theme-felület Tipográfia szekciójában mind a négy állítható.**
Így a nyitólap ugyanúgy témázható, mint a belső felület.

## Mi készült

| Rész | Mit csinál |
|---|---|
| `apps/web/app/Nyitolap.tsx` + `nyitolap.css` | a lap a rajz szerint; **token-only CSS** (a tokenőr 201 fájlon 0 sértés) |
| `apps/web/app/page.tsx` | a főoldal — ez váltja fel az E-1 egysoros lapját |
| `apps/web/app/adatkezeles/page.tsx` | a rajzon szereplő „Adatkezelési tájékoztató" hivatkozás célja. A tájékoztató szövege jogi feladat, még nincs meg — **a lap ezt kimondja, nem tesz úgy, mintha meglenne** |
| migráció 0038 | 57 szövegkulcs három nyelven (a lap teljes szövege + a négy új csúszka neve) |

## Mérve a kirakott rendszeren (kívülről, 2026-09-09)

| Amit néztem | Eredmény |
|---|---|
| a főoldal magyarul / románul | 200; a szöveg a feliratokból jön, a nyelvváltás átüt |
| a lap CSS-e | kiszolgálva, a `km-ny` stílusokkal |
| `/adatkezeles` | 200 |
| a négy új token a kiszolgált `:root`-ban | `--fs-hero:52px; --fs-hero-sm:32px; --fs-szekcio:26px; --fs-zaro:30px` |
| a nyelvválasztó két változata | asztali: `Magyar / Română / English`; telefon: `HU / RO / EN` |

## Amit a képernyőkép talált (a próbák nem)

A telefonos fejlécben a rajz **HU/RO/EN rövidítést** kér, nálam a teljes nyelvnév jelent meg.
A közös nyelvválasztó kapott egy `rovid` kapcsolót; a lap asztalon a teljeset, telefonon a rövidet
mutatja. Javítva, újra kirakva, élőben ellenőrizve.

## Ami a lapon tudatosan helykitöltő

`[KAPCSOLAT — e-mail, székhely]`, `[ÁRAZÁS — még nincs meghatározva]`, és az adatkezelési
tájékoztató szövege. **Ezek Vilmostól várnak adatot** — addig szögletes zárójelben állnak,
nem kitalált adattal.

**Az A-16 korlátja itt is él:** a nyitólap román és angol szövegét is csak gép írta.

---

# E-42 — A forrás hozzáadása ne igényeljen technikai tudást

**Ezt Vilmos találta meg**, az első valódi használatnál: beírta, hogy `zi-de-zi.ro`, és
„nem támogatott" lett belőle. A mondata a feladat leírása is egyben:

> „ezt a szolgáltatást 8 osztályt végzett emberek fogják használni… olyant elvárni, hogy https-t
> vagy rss-t vagy egyéb ilyen technológiai szakzsargon bullshitet tudjanak, felér egy
> öngyilkossággal. Azért csináljuk ezt a rendszert mi, mert ők nem tudják… Ergo helyettük kell
> megoldjuk a problémát."

## Mi volt a hiba

`forrasCimOsztalyoz` csupasz `new URL(cim)`-mel indult. Protokoll nélkül ez kivételt dob, a kivétel
ága `ervenytelen` → `nem_tamogatott`. A felület mind a három „nem támogatott" okot **ugyanazzal**
a mondattal mutatta (a Facebook-üzenettel), így a képernyőn az jelent meg, hogy a zi-de-zi.ro
belépés mögötti oldal — ami nem igaz.

## Egy hiba, amit én követtem el, és amit Vilmos javított ki

A zi-de-zi.ro-t **a felhőből** mértem, 403-at kaptam, és ebből azt állítottam, hogy az oldal nem
figyelhető. Vilmos: *„a zi-de-zi másik projektben naponta olvasva van. naponta többször."*
Újramérve **a NAS-ról** — onnan fut a letöltő — `/` 200 (323 kB), `/feed/` 200
`application/rss+xml` (84 kB). **A mérés helye része a mérésnek.** Egy próbából nem lesz általános
állítás. (Ez a szabály eddig is papíron volt; most már ára is volt.)

## Mi készült

| Rész | Mit csinál |
|---|---|
| `cimKiegeszit()` a magban | szóközök le, hiányzó `https://` pótolva, záró pont/idézőjel le, gazdanév ellenőrizve. `forrasCimOsztalyoz` a **kiegészített** címmel tér vissza, `forrasHozzaad` azt menti |
| átirányítás követése a letöltőben | eddig `redirect: "follow"` volt — vakon. Most kézi hurok, **minden ugrás után** `nyilvanosCim` ellenőrzés (egy nyilvános cím belső hálózati címre irányíthatott volna át). A `weboldalSzoveg` ugyanezt a hurkot használja, nincs két másolat |
| hírfolyam-felfedezés | előbb amit a lap maga hirdet (`<link rel="alternate">`), utána a megszokott utak: `/feed/`, `/rss/`, `/rss.xml`, `/feed.xml`, `/atom.xml`, `/index.xml`, `?feed=rss2`. Legfeljebb 6 jelölt. A megtalált cím `felfedezettCim`-ben jön vissza, a mag elteszi — a **következő futás már azt kéri le** |
| ha nincs hírfolyam | a lapot magát figyeljük. Ez nem hiba, csak kevesebb cikk |
| emberi hibaüzenetek | a gépi kód (`FORRAS_TILTOTT_CIM`, `robots_tiltja`…) helyett mondat, a **valódi** okkal. Új kód: `FORRAS_TILTVA` (401/403/429 — az oldal él, de nem enged be); eddig ez „nem elérhető"-nek látszott |
| a beviteli mező felirata | `RSS vagy weboldal címe…` → **`Írd be az oldal címét — például zi-de-zi.ro`** |
| hozzáadás után | a felület magától ellenőrzi a forrást (nem kell külön gombot nyomni) |
| amiből nem lesz cím | **nem mentődik el.** Forrástörlés nincs a rendszerben, így a szemét örökre ott maradna |
| migráció 0039 | 10 új felirat három nyelven + két átírt szöveg |

## Mérve a NAS-ról, a kirakott forrással (2026-09-09)

Nem szimuláció: a kirakott `packages/letolto` valódi kódja futott a NAS-on, valódi oldalakra.
A bal oszlopban az van, **amit egy felhasználó begépel** — protokoll nélkül.

| Beírva | Eredmény | Amit eltesz | Cikk | Idő |
|---|---|---|---|---|
| `zi-de-zi.ro` | rss | `https://www.zi-de-zi.ro/feed/` | 12 | 849 ms |
| `szekelyhon.ro` | rss | `https://szekelyhon.ro/rss/szekelyhon_hirek.xml` | 15 | 1015 ms |
| `maszol.ro` | rss | `https://maszol.ro/rss/` | 20 | 600 ms |
| `kronikaonline.ro` | rss | `https://kronika.ro/rss/kronika_hirek.xml` | 15 | 1454 ms |
| `vasarhelyi-hirlap.ro` | rss | `https://szekelyhon.ro/rss/szekelyhon_hirek.xml` | 15 | 1065 ms |
| `e-nepujsag.ro` | weboldal | — (nincs hírfolyama) | 1 | 3191 ms |
| `telex.hu` | rss | `https://telex.hu/rss/` | 50 | 555 ms |
| `444.hu` | rss | `https://444.hu/feed/` | 30 | 463 ms |

Nyolcból hét oldal **magától** hírfolyamot kapott, csupasz tartománynévből. A nyolcadiknak nincs
hírfolyama, azt a lapjáról figyeljük.

**Amit ez a táblázat elárul, és tudni kell róla:** a `vasarhelyi-hirlap.ro` a szekelyhon.ro-ra
irányít át, ezért a listában a szekelyhon címe fog látszani. Ez az oldal döntése, nem a miénk —
de a felhasználónak meglepő lehet. **Nyitott kérdés Vilmosnak:** mutassuk-e mellette, hogy mit
írt be eredetileg?

## Őrök és próbák

Határőr 0 sértés (263 modul), tokenőr 0 sértés (201 fájl), típusellenőrzés és építés zöld.
Letöltő 25 próba (6 új), mag 182 (13 új). A `apps/web` próbái adatbázist kérnek, itt nem futnak —
azok a NAS-on érvényesek.

## Ami nyitva maradt

- **Forrástörlés nincs.** Egy tévesen hozzáadott (de értelmezhető) cím — pl. egy Facebook-oldal —
  ott marad a listában. Most, hogy a szemét már be sem kerül, ez kisebb baj, de **hiányzik**:
  tár-művelet, API-út, gomb, felirat három nyelven. **Vilmos döntése, mikor.**
- A tíz új felirat román és angol szövegét gép írta (A-16, D-20).

---

# E-43 — A nyitólap tartalma ne nyúljon el nagy monitoron

**Ezt Vilmos találta meg** a saját képernyőjén, és a Claude Design küldött rá javítási csomagot
(`NYITOLAP-SZELESSEG-ES-KEPEK.md`).

## Mi volt a hiba

A lapon **egyetlen tartalomkorlát sem volt** — a hero alcím `52ch`-jén kívül semmi. Mérve: az élő
lap kiszolgált CSS-ében nulla `max-width`. Nagy monitoron a sorok végignyúltak, a kártyák elnyúltak,
a hero szövege elszakadt a jobb oldali kártyától.

## Mi készült

| Rész | Mit csinál |
|---|---|
| `.km-ny-kozep` | a közös tartalomkonténer: legfeljebb 1328 px (= az 1440-es rajz mínusz 2×56), középen, `padding-inline: clamp(20px, 4vw, 56px)` |
| a sávok | a fejléc, a lábléc és a szekciók **teljes szélességűek** maradnak (a háttér és a vonal végigfut), a tartalmuk a konténerbe kerül |
| töréspontok | kettő: **900 px** (hero egy oszlopra, a cím a kisebb tokenre vált) és **620 px** (mobil paddingek, teljes szélességű gombok). Eddig egy volt, 720-nál. Egy komponens-szintű kivétel maradt 720-nál: a fejléc két gombja ott tűnik el |
| rácsok | `repeat(auto-fit, minmax(280px, 1fr))` és `minmax(320px, 1fr)` — töréspont nélkül váltanak; a rácselemeken `min-width: 0` |
| sorhossz | szekció-alcím 60ch, adatblokk bevezetője 46ch, a záró mondat 46ch középre zárva |

## Amit a javítási csomag kért, de nem így készült

A csomag első változata `font-size: clamp(var(--fs-hero-sm), 3.6vw, var(--fs-hero))`-t kért.
**A tokenőr szabálya a `font-size:` után KÖZVETLENÜL tokent követel** — a `clamp(...)` akkor is
sértés, ha csak tokenek vannak benne. Jeleztem; a csomag újabb változata már maga is töréspontos
váltást ír, és kimondja, hogy a folyamatos átmenet „döntés a tokenőrről, nem a lapról".

## Mérve az élő lapon (a kirakott oldalt letöltve, hét szélességen)

| Ablak | Tartalom | Oldalpadding | Hero cím | Kártyák | Túllógás |
|---|---|---|---|---|---|
| 2560 | 1328 | 56 | 52 px | 3 hasáb | 0 |
| 1920 | 1328 | 56 | 52 px | 3 hasáb | 0 |
| 1440 | 1328 | 56 | 52 px | 3 hasáb | 0 |
| 1024 | 1024 | 41 | 52 px | 3 hasáb | 0 |
| 768 | 768 | 31 | 32 px | 2 hasáb | 0 |
| 620 | 620 | 25 | 32 px | 1 hasáb | 0 |
| 390 | 390 | 20 | 32 px | 1 hasáb | 0 |

A hero cím leghosszabb sora 25 karakter — a 75-ös határ közelébe sem ér.

## Amit a képernyőkép talált, a mérés nem

A teljes szélességű gomb **kilógott a lapból** telefonon: 390 px-es ablakban a jobb széle 423-nál
volt. Nem látszott görgetésként, mert a lap levágta (`overflow: hidden`). Oka: a `width: 100%`
mellé a belső margó hozzáadódott (`content-box`). Ugyanez a gombok magasságát is elrontotta:
70 px voltak a rajz szerinti 49 helyett. Egy sor (`box-sizing: border-box`) javította mindkettőt.

**A hiba a mai változtatás előtt is megvolt**, csak 720 px alatt.

## Rajz-eltérés, javítva

A fejléc két gombja és a nyelvválasztó a rajzon **40 px magas, `--fs-sm` betűvel**; nálunk 49, illetve
45 px volt, `--fs-base` betűvel. Ez az E-41-ből maradt bent. Vilmos jóváhagyásával a rajz szerint javítva.

---

# E-44 — A fotók a lapon, állítható fátyollal

A design javítási csomagjának 6. fejezete szerint. **A rajz az érvényes**: a fotók nem külön sávok
a szekciók között, hanem **két szekció háttere** (a korábbi, sávos leírást a csomag maga nyilvánította
érvénytelennek).

## Vilmos döntése: legyen rá beállítás

A fátyol a háttérszínből készül, öt sűrűségben. A tokenőr a felületi fájlokban tiltja a színkeverést,
ezért három út volt: tokenné tenni, soronkénti kivétel, vagy a szabály lazítása. **Vilmos a tokent
választotta** (mint az E-41-nél a betűméreteknél).

Három új csúszka a Theme-lap Effektek szekciójában — mindegyik emberi nyelven:

| Csúszka | Token | Alapérték | Mit csinál |
|---|---|---|---|
| Fotó a lap tetején | `--foto-hero` | 55% | mennyire látszik a hero mögötti fotó |
| Fotó a záró blokkban | `--foto-zaro` | 32% | ugyanez a záró blokknál |
| Sötét fátyol a fotókon | `--fatyol` | 70% | **egy** csúszka, ami mind az öt fátyol-fokozatot mozgatja |

A fátyol öt fokozatát (78/60/55/40/82 a rajz szerint) a designrendszer `szarmaztat()`-ja számolja
ebből az egy értékből — **a lapban nincs színkeverés**, csak kész tokenek.

## Képek

| Hely | Kép | Formátum |
|---|---|---|
| Hero (asztali) | `sajto` | AVIF + WebP + JPEG tartalék, 1440 és 1774 px |
| Hero (telefon, ≤620) | `sajto-kozeli` | ugyanígy, 640 és 1280 px |
| Záró blokk | `raszter` | ugyanígy, 1600 és 2560 px |

A hero képe `fetchPriority="high"` (az első képernyőn látszik), a záróé `loading="lazy"`.
A képek dekoratívak: `alt=""` az `<img>`-en, `aria-hidden` a rétegen. A legnagyobb kiszolgált
fájl 73 kB. Az AVIF megy ki: mérve, a böngésző azt tölti (`sajto.avif`, 1440 px).

## Amit a képernyőkép talált, a mérés nem — MÁSODSZOR

Az első kirakás után a **fátyol a hero szövegére is ráfeküdt**: a cím és a magyarázó mondat alig
látszott. A háttérréteg pozicionált (`absolute`, `z-index: 0`), a tartalom viszont nem volt az,
ezért a réteg a szöveg FÖLÉ festődött. A design átadója ezt kimondja („minden tartalom
`position: relative; z-index: 1`"), én a külső szekcióra tettem rá, a belső konténerre nem.

**A mérésem sem találta meg**, mert a hátteret mértem — a szöveg elrejtve. Azóta a mérés a szöveget
is nézi: a szövegdoboz legvilágosabb képpontja legyen a betűszín közelében. Ez a bibliai eset
arra, hogy a modell mérése nem mérés: az eredményt kell mérni, nem azt, amit gondolunk róla.

## Mérve az élő lapon (a kirakott oldal tényleges képén)

| Hely | Háttér kontraszt | A betű legvilágosabb pontja |
|---|---|---|
| hero cím, 1440 | 12,45 : 1 | pontosan `--text` |
| hero magyarázó, 1440 | 6,39 : 1 | pontosan `--text-mut` |
| záró cím, 1440 | 14,99 : 1 | pontosan `--text` |
| záró mondat, 1440 | 7,57 : 1 | pontosan `--text-mut` |
| hero cím, 390 | 13,45 : 1 | pontosan `--text` |
| hero magyarázó, 390 | 5,78 : 1 | pontosan `--text-mut` |
| záró cím, 390 | 14,71 : 1 | pontosan `--text` |
| záró mondat, 390 | 7,05 : 1 | pontosan `--text-mut` |

Egyetlen képpont sem megy 4,5:1 alá.

## Mellékesen: egy E-41-ben elkövetett hiba javítása

Az E-41 négy új méret-tokenje **nem került bele az adatbázisban tárolt közös alapba**. Mérve most:
a tárolt definíció **46** tokent tartalmazott, a készlet **53**-at, és a `--fs-hero` hiányzott belőle.
Ezért a tárolt közös alap azóta nem ment át az ellenőrzésen, és a rendszer minden alkalommal a
csomag tartaléktémájára esett vissza — a közös alapon végzett testreszabás némán elveszett volna.

Kettő történt:

1. **A betöltés önjavító lett** (`apps/web/tema/tar.ts`): ami hiányzik a tárolt témából, azt a
   csomag alapjából pótoljuk, a tárolt értékek megmaradnak. Új token bevezetése többé nem dob el semmit.
2. **A 0040 migráció** kiegészítette a tárolt közös alapot a hiányzó hét tokennel úgy, hogy a már
   tárolt érték nyer (`||`). Mérve utána: 53 token, `--fs-hero: 52px`, `--foto-hero: 55`, `--fatyol: 70`.

## Ami nyitva maradt

- **A harmadik kép** (kéz a jegyzetlapon) nincs meg, ezért a „Hogyan indul" szekció háttér nélkül van.
  A csomag `KEPEK-BRIEF.md`-je tartalmazza a leírását.
- A `NYITOLAP-ATADO.md` 3b pontja **még mindig a régi, sávos leírást tartalmazza**, amit a
  szélesség-dokumentum érvénytelenít. Két dokumentum mond mást ugyanarról a csomagban.
- A három új felirat román és angol szövegét gép írta (A-16, D-20).

---

# E-45 … E-47 — A biztonsági felülvizsgálat első két lépése

2026-09-10-én külső, független műszaki felülvizsgálat érkezett a rendszerre. Tizenkét állításából
**tizet a kód megerősít, egyet félig, egy pontatlan** — mindet egyenként ellenőriztem, nem a
jelentés szavára. A felülvizsgálat nem javasol technológiaváltást: a szerkezet jó, a jogosultsági
és üzemeltetési határok gyengék.

## E-45 (1. lépés) — a nyitott ajtók bezárása

| Amit próbáltam kívülről | Előtte | Most |
|---|---|---|
| Névtelenül munkát indítani a bemutatón (`POST /referencia/futtat`) | **működött** | 403 |
| Ugyanez a lap gombjával (`POST /referencia/inditas`) | **működött** | 403 |
| Az indítás gomb a bemutató lapján | ott volt | **nincs** |
| `/api/belso/cim` | bárki látta | 403 |
| `/api/belso/elvalasztas` | **bárki látta, tagnevekkel és e-mail-címekkel** | 403 |

- **A bemutató alapból csak olvasható.** Két fal: az alkalmazás maga utasítja el, és az nginx is
  csak GET/HEAD-et enged a `/referencia/` útvonalon. Írás csak a doboz környezeti változójával
  (`KM_REF_IRAS=1`) kapcsolható be, kívülről soha. A napi ütemezett futás belülről indul, azt ez
  nem érinti — a bemutató friss marad.
- **Az admin-jog nem jár puszta e-mail-egyezésből.** A `RENDSZERGAZDA_EMAIL` jelölése mostantól
  csak akkor kerül fel, ha a rendszerben **még egyetlen rendszergazda sincs**. Mérve: egy van (Vilmos),
  tehát a változó hatástalan.

## E-47 (2. lépés) — a NAS-t védő három hiba

Ez a három nem adatot vitt volna el, hanem **a gépet ülte volna meg** — a saját NAS-szabályaink
szerint ez a legdrágább fajta hiba.

### B-03 — belső hálózati cím IPv6-alakban átcsúszott

A régi ellenőrzés szöveges mintával nézte a címet, és **csak a `::ffff:127.0.0.1` alakot** fogta meg.

**Mérve a régi kódon: 13 belső címből 8 átcsúszott** — köztük a `::ffff:7f00:1` (ugyanaz a
127.0.0.1, hexában), a `::`, a NAT64 (`64:ff9b::7f00:1`), a 6to4 (`2002:7f00:1::`) és a multicast.

Mostantól a címet nyolc darab 16 bites részre bontjuk, és **tartomány szerint** döntünk. Amit nem
értünk, azt nem engedjük. Mérve az élő rendszeren, a kirakás után: mind a négy próbacím tiltva.

### B-02 — a letöltés törzsére nem volt sem idő-, sem méretkorlát

Az időzítő a **fejléc** megérkezésekor törlődött, a törzs utána olvasódott: egy lassan csepegtető
vagy soha véget nem érő forrás korlátlanul lekötötte volna a munkafolyamatot. A robots.txt ezen
felül egészben beolvasódott, és csak utána rövidült 64 kB-ra — az sem volt valódi méretkorlát.

Most az időkorlát a **teljes** lekérésre szól, és a törzs bájtkerettel, folyamatosan olvasódik.

### B-05 — az AI-folyamat kényszerleállítása soha nem futott le

A SIGKILL feltétele a **válasz** elkészültét nézte, nem a **folyamat** kilépését — és a választ
ugyanaz a sor zárta le, ami a SIGTERM-et küldte. A feltétel tehát **szerkezetileg elérhetetlen**
volt: egy SIGTERM-et figyelmen kívül hagyó folyamat örökre életben maradt volna a NAS-on.

Javítva: külön válik a válasz elkészülte és a folyamat kilépése; a gyerek saját folyamatcsoportba
kerül (a leállítás az egész fát elviszi); a párhuzamossági helyet a **még élő** folyamatok is
foglalják; és a 180 másodpercre normalizált időkorlát is továbbmegy a szolgáltatói hívásokba
(eddig az eredeti, korlátlan érték ment).

**Reprodukciós próba** (`nas/ai-hid/proba.mjs`): SIGTERM-et figyelmen kívül hagyó folyamat — a hívó
808 ms alatt időtúllépést kap, a folyamat a SIGKILL után tényleg megszűnik, árva folyamat nem marad.

## Amit a próbák mellett meg kellett tanulni

Az egyik új próbám **elbukott**, de nem a javítás miatt: az álhálózatom nem úgy viselkedett, mint a
valódi — megszakításkor nem állította hibára az adatfolyamot. **A saját utánzatunkat mértük volna,
nem a javítást.** Ez ugyanaz a hiba, ami az E-44-ben a fátyolnál előjött, más ruhában.

## Ami a jelentésből hátravan

3. lépés: egységes szerep-ellenőrzés minden módosító végponton (B-01). 4. lépés: AI-keret valódi
foglalással (K-03), sorbaállítás adatbázisból (K-05), jelszó-visszaállítás egy tranzakcióban (K-06),
betűtípus-ellenőrzés (B-04). Nyitott döntés: a DNS-csere elleni védelem (a kapcsolat a MÁR
ellenőrzött IP-re menjen) — ehhez a szándékosan függőségmentes letöltőcsomagba kellene függőség,
vagy hálózati kilépési korlátozás a NAS-on. **Ez Vilmos döntése.**

# E-48 — Hálózati kerítés a SaaS dobozai köré (2026-09-10)

A biztonsági felülvizsgálat egyik pontja: a projekt konténerei elérték a NAS belső hálózatát és a
többi projekt dobozait. A `nas/kerites.sh` iptables-szabályokat tesz be (DOCKER-USER: a saját
172.23.0.0/16 hálózaton belül szabad az út, kifelé a 10/8, 172.16/12, 192.168/16, 100.64/10 és
169.254/16 felé nem; INPUT: a meglévő kapcsolatok mennek, új kapcsolat a projekt hálózatáról nem).
Mérve előtte és utána. A `--le` kapcsoló leszedi.

**A korlát kimondva:** a szabályok a memóriában élnek. Nincs ütemezés, ami visszatenné őket:
a NAS újraindulása után a kerítés addig NINCS, amíg a következő kirakás le nem fut. Vilmos
döntése volt, hogy ez így maradjon („hagyjuk így").

# E-49 — Egy rossz forrássor levitte az egész hírfigyelő-áttekintést (2026-09-10)

Egy E-42 előtt elmentett forrás (`zi-de-zi.ro`, protokoll nélkül) nem felelt meg a séma
teljes-cím elvárásának, a beolvasás kivételt dobott, és **az áttekintő lap egyáltalán nem
töltődött be**. Egyetlen rossz sor vitte le a képernyőt.

Két helyen javítva: a beolvasás tűrőképessége (`apps/web/hirfigyelo/tar.ts` — a nem értelmezhető
sor kimarad és naplóba kerül, a többi megjelenik) és a sorok maguk (migráció **0041**: a protokoll
nélküli, valódi tartománynévnek látszó címek elé `https://` kerül, és újra ellenőrzésre várnak).

# E-50 — Fiókok lap (rendszergazda) · KÉSZ (2026-09-10)

A rajz: `design/e50/Fiokok.dc.html` + `admin-i18n.js` + `FIOKOK-ATADO.md` (Claude Design).
Két fül egy lapon (Fiókok · Munkaterek), részletpanel, négy megerősített művelet.

## Amit előbb meg kellett mérni

A rajz átadója egyetlen kérdést hagyott nyitva: **mi alapján válik el a próbafiók?** A NAS élő
adatbázisában mérve (2026-09-10): **67 fiók**, ebből három valódi ember (yahoo.com ×2, gmail.com ×1),
a többi **64** hat tartományban — proba.hu 26 · proba.example 22 · aitmetica.local 12 ·
teszt-a.example 2 · teszt-b.example 1 · pelda.hu 1. A gépi próba fix mintát ír
(`proba-<véletlen>@proba.example`, `apps/web/probak/segedek.ts`), de ez a 64-ből csak 22-t fed le.
A Designnak korábban „56 próbafiókot" adtam meg — **rossz szám volt**, a valóság 64.

**Vilmos döntése:** az „eredet" mező. A fiók a létrehozásakor rögzíti, hogy ember vagy gépi teszt
hozta létre; a szűrő ezt olvassa, nem a címet.

**A szabály nem tippel:** a `.example`, `.local`, `.test` és `.invalid` végződést szabvány tartja
fenn (RFC 2606, 6761), ilyen tartomány nem kézbesíthető — valódi ember nem nyithat rajta fiókot.
A `proba.hu` és a `pelda.hu` valódi tartomány LEHETNE, ezért ezek **egyszeri, tételes besorolást**
kaptak a migrációban; a jövőt már az oszlop viszi, nem a szabály.

**A jogosultság marad kétállapotú** (rendszergazda igen/nem). A rajz harmadik, szaggatott
artboardja (négyértékű szerep: Nincs / Teljes / Felület / Költség) **vázlat marad** — egy ember
használja a lapokat, és a hozzá tartozó négy kérdés mindegyike külön döntés lenne.

## Ami nem volt meg, és meg kellett építeni

| Amit a rajz mutat | Mi hiányzott |
|---|---|
| „felfüggesztve" állapot | **Nem volt ilyen oszlop.** Új: `fiok.felfuggesztve` |
| „utolsó belépés" oszlop | **Nem volt miből venni.** A `munkamenet` nem belépési napló: kilépéskor és lejáratkor törlődik a sor. Mérve: a 67 fiókból **26-nak egyetlen munkamenet-sora sincs** — náluk az oszlop örökre üres maradt volna. Új: `fiok.utolso_belepes`, a `belep()` írja |
| „próbafiók" szűrő | **Nem volt ilyen mező.** Új: `fiok.eredet` |
| munkaterek szereppel, tulajdonos, hírfigyelő, források | **Sorszintű védelem alatt.** A km_app szerep csak a saját szervezetét látja → két SECURITY DEFINER függvény, mint a 0037-ben |
| Theme · Feliratok · Költség · Fiókok navigáció | **Nem létezett.** A négy lap nem tudott egymásról, URL-t kellett beírni |

## A felfüggesztés nem díszlet

Négy helyen kellett hozzányúlni, különben a gomb mögött nem lett volna gépezet:

1. `belep()` elutasít — **a jelszó ellenőrzése UTÁN**, hogy aki nem tudja a jelszót, ne
   tudhassa meg belőle, létezik-e a cím;
2. `aktualisFiok()` elutasít, és takarítja a maradék munkamenet-sorokat — a már kiadott süti
   enélkül a lejáratáig működne;
3. a felfüggesztés maga törli a fiók munkamenet-sorait;
4. a jelszó-visszaállítás nem kiskapu: jelszót állít, de belépni továbbra sem lehet.

## Két önkizárás zárva — mindkettő az API-ban, nem a felületen

- **Az utolsó rendszergazda nem veheti el a saját jelölését.** Utána a lapokat senki nem érné el,
  és csak adatbázisból lehetne visszaadni. A rajz erre figyelmeztetést kért; a figyelmeztetés
  megvan, de a **zár** is.
- **A saját fiók nem függeszthető fel.** Ez a rajzban nem szerepelt, és nálam sem szerepelt volna,
  ha csak mértem volna: **a képernyőn látszott**, hogy a gomb ott van a saját soromon is.
  A felfüggesztés visszavonásához be kellene lépni — ami épp nem megy.

## Amit a nézés mutatott meg, a mérés nem

A megerősítő sáv a rajzon a kártya alján ül. Élesben a lista jóval hosszabb a képernyőnél, tehát a
kérdés a hajtás alá esett volna: a gombra kattintva **látszólag nem történik semmi**. Rögzítve a
képernyő aljára (ugyanaz a sáv, ugyanaz a fátyol). Telefonon ugyanez a részletpanellel: a lista
alatt nyílik, ezért megnyitáskor odagördül.

Ez a harmadik eset (E-44, E-47 után), amikor a szám rendben volt, és a kép mutatta meg a hibát.

## Eltérések a rajztól — mind a tokenrendszer miatt

Az átadó azt írja, hogy „a `font-size:` után mindenhol közvetlenül token áll". Valójában 8 helyen
szám állt (26/22/19/17 px) és egy helyen `color-mix`. A kódban ezek a **meglévő** tokenekre mennek
(lapcím `--fs-h2`, mint a Költség lapon), a megerősítő sáv fátyla pedig új származtatott token
(`--fatyol-sav`), amit ugyanaz a `--fatyol` csúszka mozgat, mint a nyitólapét. A rajzot mindez nem
érinti: a `design/` mappát a tokenőr nem nézi.

## Gépezet

- Migráció **0042**: három oszlop + egyszeri besorolás, `gazda_fiokok()` és `gazda_munkaterek()`
  (SECURITY DEFINER, csak összesítés), **309 feliratsor** (103 kulcs × 3 nyelv).
- `apps/web/probak/fiokok.proba.ts` — jogosultsági mátrix (belépés nélkül 401, nem
  rendszergazdaként 403, mind a négy műveleten), a felfüggesztés három bizonyítéka (régi süti
  401 · új belépés `FIOK_FELFUGGESZTVE` · nincs munkamenet-sor), visszavonás, mindkét önkizárás.
- `apps/web/probak/fiokok-feliratok.proba.ts` — a felület `t("…")` hívásaiból kiszedi a kulcsokat,
  és megnézi, megvan-e mind a három nyelven. Egy elgépelt kulcs eddig csak a képernyőn látszott volna.
- Teljes próbakör: **206 próba, 21 fájl, mind zöld**; tokenőr, határőr, típusellenőrzés rendben.

## Ami szándékosan kimaradt

Fiók végleges törlése, jelszó átállítása más nevében, belépés más fiókjába, e-mail küldése,
számlázás, grafikon, munkatér-tagság szerkesztése, több fiók egyszerre, lapozás. A lap alján ki is
van írva, hogy ezeket nem tudja, és miért.

---

# E-51 (B-01) — Egységes jogellenőrzés minden módosító végponton · KÉSZ (2026-09-11)

A biztonsági felülvizsgálat 3. lépése. Nem új funkció: annak a bezárása, hogy **a felület volt a
zár, nem a kiszolgáló**.

## Mit mértem, mielőtt bármit javítottam

Előbb megírtam a jogosultsági mátrix-próbát, és **a javítás ELŐTT** futtattam le: 43 módosító
végpont × 6 szerep, élő HTTP-hívással. Nem azt nézi, mit ígér a kód, hanem mit enged a kiszolgáló.

A mérés szerint a `nezo` szerep az API-t közvetlenül hívva meg tudta tenni ezeket:

| Amit egy néző megtehetett | Hol |
|---|---|
| a figyelési beállítás átírása, tervezet mentése és elvetése | `hirfigyelo/beallitas*` |
| forrás hozzáadása és ellenőrzése | `hirfigyelo/forrasok*` |
| szabályjavaslat eldöntése | `hirfigyelo/javaslat/[id]/dont` |
| találat megjelölése, visszajelzés | `hirfigyelo/talalatok/[id]/jelol`, `hirfigyelo/visszajelzes` |
| AI-tartalomötlet kérése (**pénzbe kerül**) | `hirfigyelo/talalatok/[id]/tartalomotlet` |
| az onboarding kitöltése ÉS jóváhagyása | `onboarding/*` |
| a szervezet jóváhagyott profiljának átírása | `profil` PUT |

A `szerkeszto` szerep pedig jóváhagyhatta a szervezet hivatalos arculatát és átírhatta a profilját —
pedig az a tulajdonos dolga.

A 15 hírfigyelő-végpontból **háromban már volt** szerep-ellenőrzés (futtatás, újraértékelés,
javaslat kipróbálása). Ezeket nem javítani kellett, hanem egységesíteni.

## A hat szint

Egy kapu (`apps/web/app/api/_kapu.ts`), hat kimondott szinttel. **Nem rangsor:** a rendszergazda
külön jog, nem „a tulajdonos fölött" áll.

| Szint | Kinek | Mi tartozik ide |
|---|---|---|
| `nyilvanos` | bárkinek | belépés, regisztráció, kilépés, jelszó-visszaállítás, nyelvváltás |
| `belepett` | belépett fióknak | szervezet létrehozása |
| `tag` | a munkatér bármely tagjának | olvasás, „megnéztem" jelölés |
| `szerkeszto` | szerkesztőnek és tulajdonosnak | minden, ami a munkatér munkáját változtatja |
| `tulajdonos` | csak a tulajdonosnak | a munkatér arculata, témája, feliratai, profilja |
| `rendszergazda` | a rendszergazda-jelöléssel | a KÖZÖS alap, a keretek, a Fiókok lap |

Egységes válaszok: **401** nincs belépés · **403** kevés a szerep · **409 NINCS_SZERVEZET** belépett,
de még egyetlen munkatérnek sem tagja. Ez utóbbi korábban `NINCS_JOG` volt — ugyanaz a státusz, de
a kód most megmondja, hogy nem a jog hiányzik, hanem a munkatér. Négy szöveg is került hozzá
(migráció **0043**): eddig ezekre nem volt felirat, tehát az általános „Valami hiba történt" jelent meg.

## Az őr — ez a lényeg, nem a mai javítás

A próba második fele **végigolvassa az útvonalfájlokat**, és elbukik, ha van olyan módosító kezelő,
ami nem szerepel a mátrixban, vagy nem hívja a közös kaput. Aki holnap új végpontot ír, annak ki
kell mondania a szintjét — különben a próba nem enged.

A mai javítás egyszeri; **ez a gépezet az, ami miatt a hiba nem jön vissza.**

## Amihez a felülethez is hozzá kellett nyúlni

A hírfigyelő képernyői már tudtak a szerepről (`szerkesztheto = szerep !== "nezo"`), tehát ott a
kiszolgálói zár nem vett el semmit, amit egy néző látott. Két helyen viszont nem tudtak:

- **Fiókoldal** — a néző látja a munkatér adatait, de a szerkesztő gombok eltűnnek, és egy mondat
  megmondja, miért. Gomb, ami mögött nincs gépezet, nem maradhat a képernyőn.
- **Onboarding** — a nézőt nem engedjük be (a beállítás nem az ő dolga), és a **jóváhagyás gombja
  csak a tulajdonosé**: a szerkesztő kitölti, a tulajdonos zárja le.

## Amit a saját munkámban kellett kijavítani

1. **A próbám saját magát lőtte lábon.** A mátrix minden szereppel meghívta a `kilepes` végpontot is
   — ezzel mindenkit kiléptetett, és onnantól az egész mátrix hamis 401-eket mért. A kilépésnek most
   saját próbája van, eldobható munkamenettel; a mátrix kihagyja. **101 „eltérésből" 45 maradt**,
   amikor ezt megjavítottam — a többi a saját hibám volt.
2. **Redirekt-hurkot csináltam.** A nézőt elküldtem az onboardingról a fiókoldalra — a fiókoldal
   viszont jóváhagyott profil nélkül az onboardingra küld. A néző a kettő között pattogott volna.
   Javítva: a néző a fiókoldalon egy mondatot kap, nem hurkot.
3. **A teljes próbakörben a mátrix elbukott, külön futtatva nem.** Egy másik próbafájl takarítása
   törli a `proba-%@proba.example` fiókokat, és a mátrix elég sokáig fut ahhoz, hogy közben elvigye
   a sajátjait. Saját névtér (`jog-…`) és saját takarítás.
4. **A `nyelv` végpont szintje rossz volt a táblázatomban.** „Belépett"-nek jelöltem, holott
   szándékosan nyilvános: a belépőlapon is kell tudni nyelvet váltani. A mérés mutatta meg.

## Mérés

- **43 módosító végpont × 6 szerep**, mind a saját joga szerint. Teljes próbakör: **209 próba,
  22 fájl, mind zöld.** Tokenőr, határőr, típusellenőrzés rendben.
- A felület nézőként és tulajdonosként is megnézve: a nézőnél **0 szerkesztő gomb**, a
  tulajdonosnál **7**.
