# Ötödik szakasz — Hírfigyelő: az első önálló szakmai modul

Claude Cowork · 2026-09-07 · az átadó 13. fejezet 5. szakasza · a küldött prototípus (`design/fiokprofil-hirfigyelo-v7.zip`:
`Hirfigyelo-prototipus.dc.html`, `hf-i18n.js`, `HIRFIGYELO-ATADO.md`) alapján · **2. változat a 2026-09-07-i felülvizsgálat
pontosításaival** · **TERV — kód csak Vilmos „mehet”-je után**

## 0. A felülvizsgálat pontosításai (2026-09-07 este) — mi változott az 1. változathoz képest

Az irány elfogadva; a terv ott erősödött, ahol később drága lenne visszafordulni:

1. **Az önállóság bizonyítandó, nem kijelenthető.** A modul dokumentált csatlakozási pontokon kapja a profilt, a jogosultságokat,
   az AI-hozzáférést, a témát és a nyelvet (→ 3a. pont); a mag nem függhet a befogadó alkalmazás tábláitól vagy oldalaitól; és **már
   ebben a szakaszban egy minimális tesztalkalmazásban** (`apps/proba-host`) kipróbáljuk a bekötést a modul belső kódjának
   módosítása nélkül (E-19b). A teljes második rendszer marad a 6. szakasz.
2. **A közös Theme öröklése és a három nyelv külön elfogadási feltétel** (→ 7. pont): a modul minden eleme — a később létrejövők
   is — csak tokenből színez, betűz, kerekít (tokenőr), a felirataihoz HU/RO/EN kötelező.
3. **Szolgáltatófüggetlen AI-csatlakozás** (→ 3b. pont): a modul a közös `@km/ai-adapters` csomagon át kér FELADATOT, nem
   modellt; szolgáltató, hitelesítés, költségkeret és hibakezelés nem kerül a modulba; a cserélhetőség az első megvalósításban
   bizonyított (tesztadapter + egy valódi). A D-10 híd jogi kerete külön ellenőrzendő (→ 5. pont, 10. döntés).
4. **A működési ígéretek pontos ellenőrzése** (→ 3c. pont): piszkozat ≠ aktív, változatlan mentés nem ad új verziót, „új” =
   megtekintési állapot, a mentés nem futás, cikk ≠ esemény, az AI nem indíthat műveletet és a kimenetét séma ellenőrzi,
   Facebook nincs vállalva és nem tűnik működő forrásnak.
5. **Mit őrzünk meg a feldolgozáshoz** (→ 3d. pont): a tárolási elv és az „újra feldolgozzuk / ugyanazon a mintán próbáljuk”
   ígéret közti ellentmondás feloldva: feldolgozási kivonat, korlátozott ideig, rögzített mintával.
6. **A prototípus a FELÜLETI mérce; működési kérdésben az elfogadott követelmények az irányadók** — a demó szimulációs
   egyszerűsítéseit nem másoljuk át.
7. **Az óraszám előzetes becslés, a költséget mért használatból számoljuk** — nem a kész szolgáltatás teljes fejlesztési vagy
   üzemeltetési költsége (→ 4. pont vége).

## 1. Mi a cél, egy mondatban

A szervezet a közös profiljából kiindulva beállítja, mit és honnan figyeljen a rendszer; a figyelés kézzel vagy naponta
lefut a beállított forrásokon; a találatok egy Áttekintés-lapon jelennek meg érthető indoklással („Miért fontos neked?”),
témacímkével és három fontossági kategóriával (nincs ál-pontos százalék); a visszajelzésekből az AI konkrét, indokolt
szabálymódosítást javasol, amit a tulajdonos kipróbálhat, elfogadhat vagy elvethet — verziózva, visszaállíthatóan; az
ismételt futás nem készít duplikátumot, és a külső tartalom nem indíthat semmit a rendszerben.

Ez az átadó 5. szakasza. Amit bizonyít: **A-10** (ismételt/párhuzamos futás nem ad ellenőrizetlen duplikátumot) és **A-14**
(külső tartalom nem indít jogosulatlan műveletet — a hírszöveg ADAT, nem utasítás); teljesíti az R-19-et. A modul az
ALAPTERV `news-monitor-core` sora és az átadó 5.3 modul-szerződése szerint készül.

## 2. Amit ez a szakasz NEM tartalmaz

Nincs benne a második befogadó rendszer (6. szakasz — de a host-adapter szerződése már itt készül, hogy a 6. csak bekötés
legyen), nincs e-mail-összefoglaló és keresőszolgáltatás-bekötés (a prototípus is bővítésként jelöli), nincs a teljes internet
figyelése (csak a beállított források), nincs fizetés, és a prototípus **Prototípus-vezérlői** (bal alsó sarok) és a
**mintaprofil-váltó** sem kerülnek a termékbe — azok a demó eszközei; nálunk a valódi közös profil és a valódi futás van.

## 3. A prototípus a spec — mit ad, és mi az, amit nem

A `Hirfigyelo-prototipus.dc.html` három oldala (Áttekintés · Figyelés beállítása · Finomhangolás) és a részletpanel az
E-15-höz hasonló rajz helyett a **mérce**: nem rajzolunk újra, elemről elemre ezt építjük (vasszabály: a felesleg hiba, ami
hiányzik, kérdés). 169 felirat a `hf-i18n.js`-ben HU/RO/EN — a mi `hirfigyelo.*` kulcsaink lesznek a `felirat` táblában (így a
tulajdonos ezeket is átírhatja a Feliratok-lapon, D-09). Tíz bemutatott állapot (első használat · AI-előkészített beállítás ·
próbafutás · siker új találattal · siker új találat nélkül · részleges forráshiba · AI-kiesés · sikertelen mentés · javaslat
elfogadás előtt · új verzió + visszaállítás) — mind a tíz nálunk **valódi** állapot lesz, nem szimuláció.

Amit a prototípus **szimulál**, és itt meg kell építeni: begyűjtés, deduplikáció, AI-értékelés/összkép/tartalomötlet,
forrásellenőrzés, ütemezés, mentés. **Szabály:** a prototípus a felületi mérce (mi látszik, hol, milyen szöveggel); ahol a demó
a működést egyszerűsítette (pl. „mentés = futás”, „nem elrejtett = új”), az alábbi működési követelmények az irányadók.

### 3a. A modul csatlakozási pontjai (a host-adapter szerződése)

A modul semmit nem tud a befogadó alkalmazás tábláiról és oldalairól. Öt dokumentált ponton kap, egy ponton ad:

| Pont | Mit kap a hosttól | Alak |
|---|---|---|
| Profil | a szervezet jóváhagyott közös profilja (név, tevékenység, célközönség, cél, nyelvek, hangnem) — csak olvasásra | `SzervezetProfil` (`@km/contracts`), a host adja át hívásonként |
| Jogosultság | ki a hívó, mi a szerepe a szervezetben (tulajdonos / szerkesztő / néző), melyik szervezet | `HostKontextus { fiokId, szervezetId, szerep }` — a modul nem tárol jogosultságot |
| AI | egy feladat-hívó a közös `@km/ai-adapters` szerződéssel (feladattípus be → ellenőrzött válasz ki; keret, kulcs, szolgáltató a hosté) | `AiHivo` interfész |
| Téma | semmit külön — a modul felülete csak `var(--token)`-t használ, a host lapjának feje adja a tokeneket | tokenőr |
| Nyelv | a felület nyelve + a `hirfigyelo.*` feliratok a host szótárából (tartaléknyelv a közös szabály szerint: angol, D-11) | `t(kulcs)` |
| **Ad** | események: futás indult/kész/hiba, új találatok száma, mentési hiba — a host dönti, mit kezd velük (értesítés, napló) | `HirfigyeloEsemeny` |

A mag (`packages/news-monitor-core`) tiszta szabály: nincs adatbázis, React, Next, hálózat. A tárolás egy **tár-interfész** mögött van
(`HirfigyeloTar`: beállítás, verziók, források, futások, találatok, visszajelzések), amelynek a webalkalmazás adja a Postgres-
megvalósítását (ügyfélkulccsal, sorszintű védelemmel), a tesztalkalmazás pedig egy memóriabelit. Az E-19b a bizonyíték: a
`apps/proba-host` minimális alkalmazás a modult a saját fiókjával, profiljával és memóriatárával futtatja — a modul egyetlen sorának
módosítása nélkül. Határőr-szabály: a modul nem importálhat az `apps/web`-ből; az `apps/web` csak a modul publikus belépési pontjait.

### 3b. Az AI-csatlakozás

A modul **feladatot** kér a közös csatlakozótól (`@km/ai-adapters`, ALAPTERV 5. pont — ma is ez adja az onboarding AI-hívásait):
új feladattípusok: `beallitas_javaslat` (szabad szöveg + profil → strukturált beállítás), `relevancia` (cikk-kivonat + beállítás →
kategória + indoklás + témacímke), `osszkep` (találatok → forrásokra hivatkozó összkép), `ugyanaz_az_esemeny` (két kivonat → igen/nem),
`szabaly_javaslat` (visszajelzések + szabály → javasolt változtatás + indoklás + várható hatás), `tartalomotlet` (csak kérésre).
Minden válasz zod-sémán megy át; ami nem felel meg, `AI_ROSSZ_VALASZ`, és a találat „értékelés függőben” marad. A szolgáltató,
a kulcs, a havi keret (`AI_KERET_KIMERULT`) és a hibakezelés a csatlakozóé — a modul nem tud róla, melyik modell válaszol.
**Cserélhetőség bizonyítása az első megvalósításban:** a próbák a tesztadapterrel futnak (determinisztikus válaszok), a teszten
a `.env` szerinti valódi szolgáltatóval; a váltás egy beállítás, nem kódmódosítás. Helyi modell (Dell/Qwen) bekötése ugyanígy egy
új leírólap a csatlakozóban — nem a hírfigyelő dolga.

**A D-10 híd jogi kerete:** a teszten ma a Claude-előfizetés dolgozik egy változatlan Claude Code-on át. Az Anthropic
dokumentációja külön kezeli a saját alkalmazásba épített API-hozzáférést és a Claude Code használatát, és az előfizetési belépő
saját alkalmazáson keresztüli közvetítését korlátozza — **nem tudom biztosan, hogy a hidunk ebbe belefér-e**; ezt nem
feltételezzük, hanem ellenőrizzük (→ 10. döntés). A biztos út: a hírfigyelő fejlesztése és próbája a tesztadapterrel és a D-08
szerinti API-kulccsal (Anthropic, 5 USD/hó keret) is menjen; a híd csak addig és csak ott, ahol a keret megengedi.

### 3c. Működési követelmények — pontosan mit ellenőrzünk

| Pont | Követelmény | Hogyan bizonyítjuk |
|---|---|---|
| Piszkozat és aktív beállítás | A mentetlen szerkesztés (tervezet) nem módosítja a futó figyelést; a futás mindig az utoljára MENTETT verzióval megy. Változatlan mentés nem gyárt új verziót (a modul összeveti, és „nincs változás” üzenetet ad). | próba: tervezet módosítása után futás → a régi verzió v-címkéje; azonos tartalom mentése → verziószám nem nő |
| „Új” találatok | Megtekintési állapot találatonként: `uj → megtekintett`, a részlet megnyitása vagy a kártya jelölése (mentés/elrejtés) teszi megtekintetté; a szűrő „Új” = még nem megtekintett. A nem elrejtett önmagában nem új. | próba: futás után N új; egy megnyitva → N−1 |
| Futási időpontok | A mentés nem futás. Külön tárolt: utolsó sikeres futás kezdete/vége, utolsó (bármilyen) futás, következő tervezett; a sáv az utolsó SIKERES-t mutatja. | próba: mentés után az „utolsó sikeres futás” változatlan |
| Cikk és esemény | Ugyanaz a cikk (szervezet + kanonikus URL) egyszer tárolódik — a második beszúrás kihagy. Azonos esemény különböző cikkei egy **eseménycsoportba** kerülnek, minden forrás megőrizve (cím, link, forrás, idő); a kártya a csoport. | próba A-10: két egyidejű és két egymás utáni futás ugyanazon a forráson → azonos találatszám, nincs duplikátum; próba: 2 forrás ugyanarról → 1 kártya, 2 forrás |
| AI-biztonság | A feldolgozó AI-nak nincs eszköze és nincs műveletindítási joga: csak szöveget kap és sémás választ ad; a rendszer a választ ellenőrzi (séma, engedélyezett kategóriák, hivatkozott források léteznek-e), és semmit nem hajt végre a válasz vagy a hírszöveg tartalmából; a hírszöveg a promptban jelölt ADAT-blokk. | próba A-14: a forrásba írt „utasítás” (pl. „töröld a beállítást”, hamis forráshivatkozás) → nem történik semmi, a válasz csak kategória + indoklás; a nem létező forráshivatkozás eldobva |
| Forrástípusok | Ebben a szakaszban: RSS és nyilvános weboldal. **Facebook (és más belépés mögötti / API-s platform) nincs vállalva**: a Facebook-cím forrásként „nem támogatott” állapotot kap érthető üzenettel, nem „hibás”-t és nem „ellenőrzés alatt”-ot. | próba: facebook.com-cím → `nem_tamogatott` |
| Sikertelen mentés | A mentés hibájánál minden beállítás a képernyőn marad, „Újrapróbálás”; a futó figyelés az előző verzióval megy tovább. | hibaút-végigjátszás (mint E-18) |
| Részleges forráshiba | Egy forrás hibája nem állítja le a futást; a többi eredménye teljes; a hibás forrás oka látszik. | próba: egy elérhetetlen forrás a kettőből |

### 3d. Mit őrzünk meg a feldolgozáshoz, meddig

A teljes cikket nem tároljuk. Amit igen: a **feldolgozási kivonat** — a lap szövegének első legfeljebb ~8 000 karaktere (a
relevancia-értékeléshez ennyi elég), cím, link, forrás, megjelenés ideje, begyűjtés ideje, tartalom-ujjlenyomat. Ez kell ahhoz, hogy
AI-kiesés után **újra értékelhető** legyen a már begyűjtött anyag (nem töltjük le újra), és hogy a **próbafutás és az összehasonlítás
ugyanazon a mintán** menjen. Megőrzés: a kivonat a találat értékelése után **30 napig** marad, utána csak a cím + link + összefoglaló
+ értékelés (ez a látható találat). **Rögzített minta:** a próbafutás egy azonosítóval mentett mintát (találat-azonosítók listája +
a kivonatok) használ; a „Kipróbálom” ugyanezt a mintaazonosítót értékeli újra a javasolt szabállyal — így az összehasonlítás
tényleg ugyanazon az anyagon megy, és a minta a szabályváltozathoz kötve marad, amíg a javaslat el nem dől (utána a 30 nap).
**Lejárat (D-12):** ha a minta kivonatai már lejártak, a rendszer NEM ígér azonos mintás összehasonlítást — a „Kipróbálom” helyett
„A minta lejárt — kérj új próbafuttatást” üzenet és gomb; a lejárt minta jelölve marad a verziónál. **Megvágott anyag:** a
karakterkorlát miatt csonkolt kivonat `csonkolt: true` jelölést kap, a prompt ezt közli („részlet, nem a teljes cikk”), és a
kártya részletpanelje is jelzi.

## 4. A lépések

| # | Mi készül | Mit látsz a teszten a végén | Idő | Ágens |
|---|---|---|---|---|
| E-19 | **A mag és a szerződés:** `packages/news-monitor-core` (tiszta szabályok: a beállítás sémája, témák/névváltozatok/kizárások, szabályverziók, találat-modell, dedup-kulcs, fontossági kategóriák, futás-állapotgép); a modul-szerződés doksi (átadó 5.3) és a **host-adapter szerződése** (mit kap a hosttól: profil, fiók, jogosultság; mit ad vissza); határőr-szabályok | Még semmit — de a próbák zöldek, a határőr védi a modult | 3 óra | 2 (DeepSeek építő, Kimi tesztelő) |
| E-19b | **A bekötés bizonyítéka:** `apps/proba-host` — minimális tesztalkalmazás (egy fiók, egy rögzített profil, memóriatár, tesztadapter, a közös téma és szótár), amely a modult a 3a. pontok szerint futtatja **a modul kódjának módosítása nélkül**; határőr-szabály a két irányra | A tesztalkalmazásban a modul lapjai megjelennek és a próbafutás lemegy — bizonyíték, hogy áthelyezhető | 2 óra | 1 (DeepSeek építő) |
| E-20 | **Tárolás és API:** a `HirfigyeloTar` Postgres-megvalósítása — a modul saját táblái ügyfélkulccsal és sorszintű védelemmel (beállítás + verziók, források, futások, találatok megtekintési állapottal, eseménycsoportok, kivonatok, visszajelzések, minták); `/api/hirfigyelo/…` (beállítás tervezet → mentés = új verzió, visszaállítás; források; futás indítása; találatok; visszajelzés) | API-ból beállítás menthető és verziózva visszaállítható | 3 óra | 2 |
| E-21 | **Begyűjtés:** forrásfeldolgozó adapter — RSS és weboldal-cím (az E-7 letöltő újrahasználva: csak nyilvános cím, SSRF-védelem, 1 MB, csak szöveg); forrásellenőrzés a négy állapottal (ellenőrzés alatt / használható / korlátozott / hibás), `robots.txt` tisztelete, utolsó feldolgozás + hibaok | Forrást adsz meg, a rendszer megmondja, használható-e, és miért nem | 3 óra | 2 |
| E-22 | **Háttérfutás** (D-13 szerint NEM Redis: várólista a Postgresben, futtató az alkalmazás folyamatában, a nehéz AI-munka a Dell Ollamájára `helyi-ollama` csatlakozóval): kézi és napi futás időponttal és időzónával, futásazonosító, dupla indítás tiltva, részleges forráshiba, **ismétlésbiztonság** (ugyanaz a cikk ugyanabban a szervezetben egyszer — A-10), az „AI-kiesés: az anyag megvan, az értékelés függőben” állapot | „Futtatás most” → a sáv mutatja a futást, a végén az új találatok számát vagy a részleges hibát | 4 óra | 2 |
| E-23 | **Deduplikáció és AI-értékelés:** cikk ≠ esemény (3c.), azonos eseményről szóló cikkek egy kártyán (forrásszám), a 3b. feladattípusok a közös csatlakozón át, relevancia + „Miért fontos neked?” + témacímke + Fontos/Érdekes/Háttér, az összkép forrásokra hivatkozva (bizonytalan forrásnál nem von le biztos következtetést), tartalomötlet csak kérésre; a hírszöveg ADATként megy a promptba (A-14) | Valódi találatok indoklással; a duplikátumok összevonva | 4 óra | 2 |
| E-24 | **Felület 1 — Áttekintés** a prototípus szerint: StatusStrip, AiOverview, szűrők (Új/Mentett/Elrejtett/Mind), HitCard, DetailPanel (lista-pozíció és szűrő megőrzésével), telefonon overlay; 169 felirat 3 nyelven | Az Áttekintés-lap a teszten, 3 nyelven, telefonon is | 4 óra | 2 (DeepSeek építő, Kimi fordító) |
| E-25 | **Felület 2 — Figyelés beállítása:** SetupForm (célok, szabad szöveg → strukturált beállítás AI-val, témák, névváltozatok, megkülönböztetés, területi-nyelvi fókusz, kizárások), SourceList, Scheduler, TrialRun (korlátozott minta, a beállításváltozathoz kötve), mentés = új verzió, sikertelen mentés (az előző fut tovább) | Beállítod és elindítod a figyelést; a próbafutás eredménye a Finomhangoláson | 4 óra | 2 |
| E-26 | **Felület 3 — Finomhangolás:** FeedbackCard (2 kattintás + max. 4 ok + saját indok), RuleSuggestion (jelenlegi / javasolt / mi alapján / várható hatás; Kipróbálom = ugyanazon a mintán összehasonlítás, Elfogadom, Elvetem), VersionList visszaállítással (a korábbi találatok nem íródnak át, v-címke), ProfileTouch (a profilt érintő módosítás → a profilhoz irányít, nem írja át) | Visszajelzel → javaslat → kipróbálod → elfogadod → új verzió; visszaállítható | 4 óra | 2 |
| E-27 | **Hibautak, fordított ellenőrzés, zárás:** a tíz állapot végigjátszva valódi hibákkal (forrás nem elérhető, AI-kiesés, mentési hiba, párhuzamos futás), Kimi fordított ellenőrzés a prototípus ellen mind a három oldalon, 3 nyelv + telefon, A-10/A-14 bizonyítás, a modul-szerződés véglegesítése, szakaszzáró doksi | Minden állapot a teszten; a záró doksi | 3 óra | 2 (Kimi ellenőr, Kimi tesztelő) |

**Összesen kb. 34 óra — előzetes becslés**, nem vállalás: lépésenként 2 fizetős ágenssel (DeepSeek építő, Kimi
tesztelő/fordító/ellenőr). Az ágensköltséget nem előre mondjuk, hanem lépésenként **mért használatból** írjuk a `docs/AGENSEK.md`-be
(tájékoztatásul: a 4. szakasz hat lépése 0,33 USD volt). Ez a fejlesztést kísérő ágensek ára — nem a kész szolgáltatás teljes
fejlesztési vagy üzemeltetési költsége (AI-hívások futásonként, NAS-erőforrás, pilot). Reális ütem: **négy-öt nap**; az E-22-nél NEM lett új doboz a NAS-on (D-13: Postgres-várólista + Dell Ollama), így külön NAS-terhelés nincs.
A modul a `/hirfigyelo` úton él, a fiókprofil oldalsávjából nyílik (a v7 mockup „Beállítások” szakasza mellé egy „Modulok” sor).

## 5. Döntések — egyesével, akkor, amikor az adott darab épül

Mindegyiknél ott a javaslatom; egy „mehet” = a javaslat.

1. ~~E-19 előtt — az első forrástípusok~~ **ELDŐLT (2026-09-07, a felülvizsgálatban):** RSS-csatorna és nyilvános weboldal-cím;
   kereső NEM most; Facebook és más belépés mögötti platform nincs vállalva, és nem tűnhet működő forrásnak.
2. **E-19 — a host-jogosultsági szerződés:** ki mit tehet a modulban. *Javaslat: tulajdonos és szerkesztő állítja be és
   futtatja; a néző csak az Áttekintést látja; a modul a hosttól kapja a szerepet, maga nem tárol jogosultságot.*
3. **E-20 — a szabályverziók helye:** a modul saját táblájában (ügyfélkulccsal), a közös profilt nem írja. *Javaslat: így; a
   profilt érintő javaslatnál a ProfileTouch a profilhoz irányít (a prototípus szerint).*
4. **E-21 — a forrásellenőrzés mélysége és a jogi keret:** csak nyilvános oldalak, `robots.txt` tiszteletben, belépés mögötti
   tartalom nincs; tárolás: cím + rövid kivonat + link + forrás + idő, a teljes cikk NEM. *Javaslat: így — ez a sajtófigyelők
   szokásos, védhető kerete.*
5. **E-22 — időzóna és a napi futás alapértéke:** a prototípus „Európa/Budapest”-et ír; Marosvásárhely Europe/Bucharest.
   *Javaslat: a szervezet választja (alap: Europe/Bucharest), a felirat a választottat mutatja; alapból napi 1×, reggel 7:00.*
6. **E-23 — a relevancia módszere és a kategóriák küszöbei:** az AI a profil (tevékenység, célközönség, cél, témák) alapján
   kategóriát ad (Fontos / Érdekes / Háttér) rövid indoklással — nincs pontszám, nincs küszöb-számítás; a felhasználó
   visszajelzése nem szabály, hanem a javaslat alapja. *Javaslat: így (a prototípus elve); költségőr: cikkenként egy rövid
   hívás, naponta legfeljebb N cikk szervezetenként — N-t a pilot dönti, alap 60.*
7. **E-23 — a deduplikáció:** két lépcső: (a) determinisztikus — kanonikus URL + normalizált cím + időablak; (b) csak a gyanús
   párokra AI „ugyanaz az esemény?”. *Javaslat: így; az összevont kártyán a forrásszám és minden forrás linkje látszik.*
8. **E-24 — RO/EN szótár:** a `hf-i18n.js` román és angol szövegei már megvannak; Kimi lektor átnézi, Vilmos szúrópróbát tesz a
   románon. *Javaslat: így, külön ágens-kör nélkül (a fordító-feladat lektorálásra).*
9. **E-26 — e-mail-összefoglaló:** a prototípus szerint jövőbeli bővítés. *Javaslat: nem az 5. szakasz; a felület mutatja a
   „tervezett bővítés” sort, ahogy a prototípus.*
10. ~~E-19 előtt — az AI a teszten~~ **ELDŐLT (D-12):** fejlesztés tesztadapterrel; a valódi AI ellenőrzése API-kulccsal; a modul
    lezárásához sikeres valódi AI-próba kell (nyitott ellenőrzési pont, H-10); a híd nem automatikus helyettesítő; a keretet a
    rendszer ellenőrzi és a kimerülését érthetően jelzi (H-11).
11. ~~E-24 előtt — a tartaléknyelv~~ **ELDŐLT (D-11):** az angol az alap- és tartaléknyelv az egész rendszerben — központilag
    átállítva (K-1, kirakva), a hírfigyelő nem hoz létre külön szabályt; a `hirfigyelo.*` feliratok eredetije az angol, magyar
    és román teljes fordítással.

## 6. Hol lehet elakadni

- **Új doboz a NAS-on (Redis + a futtató):** a NAS-szabályok szerint mérés előtte, egy összerakás egyszerre, naplózás; ha a
  memória szűk (ma ~11 GB felszabadítható), a futtatót az app-dobozba tesszük, és Redis helyett Postgres-alapú sor (BullMQ
  nélkül) — ez az ALAPTERV-től eltérés lenne, ADR-t kapna.
- **Forrásoldalak változatossága:** sok oldal nem ad RSS-t és a szövege nehezen olvasható; a „korlátozott” állapot pont erre
  van (csak a címek). Nem ígérünk teljes internetet (a `honestyNote` felirat a prototípusban).
- **AI-költség és -kiesés:** a D-10 híd (Claude-előfizetés) a teszten; a napi cikkszám-korlát és az „értékelés függőben”
  állapot védi; a begyűjtött anyag akkor is megvan, ha az AI nem válaszol.
- **Ismétlésbiztonság párhuzamos futásnál:** egy szervezetnek egyszerre egy futás (zár az adatbázisban), a találat kulcsa
  (szervezet + kanonikus URL) egyedi — a második beszúrás csendben kihagy, nem duplikál (A-10 próbával bizonyítva).
- **A prototípus 73 KB egyetlen fájl:** az elemről elemre ellenőrzést (E-27) három részre bontjuk (oldalanként), mint az E-18-nál.

## 7. Elfogadási feltételek — mit bizonyítunk a végén

| # | Feltétel | Bizonyíték |
|---|---|---|
| H-1 | **A-10** ismétlésbiztonság: két egyidejű „Futtatás most” és kétszer egymás után ugyanazon a forráson → ugyanannyi találat, duplikátum nélkül; egy szervezetnek egyszerre egy futás | gépi próba |
| H-2 | **A-14** külső tartalom: a forrásba írt utasítás, hamis hivatkozás nem indít semmit; az AI-nak nincs művelete; a válasz sémán megy át | gépi próba |
| H-3 | **Önállóság:** a modul az `apps/proba-host` tesztalkalmazásban a saját kódjának módosítása nélkül fut (3a.); a határőr tiltja az `apps/web` importját a modulból | E-19b + `pnpm hatar` |
| H-4 | **Szolgáltatófüggetlen AI:** a próbák tesztadapterrel, a teszt valódi szolgáltatóval, a váltás beállítás; szolgáltató/kulcs/keret nincs a modulban | próbák + `.env` váltás + kódátnézés |
| H-5 | **Theme-öröklés:** a modul minden eleme (a később létrejövők is) csak tokenből — tokenőr 0 találat; a Theme-lapon átállított szín/betű/lekerekítés a hírfigyelő lapjain is látszik | tokenőr + végigjátszás |
| H-6 | **Három nyelv:** a `hirfigyelo.*` feliratok HU/RO/EN teljesek (nincs tartalékra szoruló kulcs), a Feliratok-lapon szerkeszthetők | próba: a három szótár kulcshalmaza azonos |
| H-7 | A 3c. tábla nyolc működési követelménye | a tábla „hogyan bizonyítjuk” oszlopa |
| H-8 | A tíz állapot élőben, 3 nyelv + telefon, fordított ellenőrzés a prototípus (felületi mérce) ellen oldalanként | végigjátszás + Kimi ellenőr |
| H-10 | **Valódi AI-próba** (D-12): a hírfigyelő értékelése és javaslata legalább egyszer valódi szolgáltatóval (API-kulcs) sikeresen lefut a teszten — enélkül a modul NEM zárható le; a híd nem helyettesíti | mért futás, `docs/AGENSEK.md`-től külön: `ai_hivas` sorok |
| H-11 | **Keret** (D-12): az 5 USD/hó keretet a rendszer ellenőrzi minden hírfigyelő-hívás előtt; kimerülésnél nem hív, a találat „értékelés függőben — a havi AI-keret elfogyott” állapotot kap, a sáv érthetően mutatja | próba: keret 0-ra állítva → futás lemegy, értékelés nélkül, üzenettel |
| H-12 | **Minta lejárata és csonkolás** (D-12): lejárt mintán nincs „Kipróbálom”, új próbafuttatást kér; csonkolt kivonat jelölt a promptban és a felületen | próba |
| H-9 | A modul-szerződés (átadó 5.3) dokumentálva: cél, nem vállalt, be/ki séma, belépési pontok, saját és kapott adatok, jogosultság-igény, külső függőségek és költséget okozó műveletek, bekötési példa (= `apps/proba-host`), próba, verziózás és migráció | `docs/HIRFIGYELO-SZERZODES.md` |
