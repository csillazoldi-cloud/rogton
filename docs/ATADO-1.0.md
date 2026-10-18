# Claude Cowork — teljes projektleírás és megvalósítási terv

**Projekt:** AI-asszisztált kommunikációs SaaS és újrahasználható moduljai  
**Megrendelő / terméktulajdonos:** Vilmos Portik, Aitmetica SRL  
**Megvalósítás vezetője:** Claude Cowork  
**Külső szakmai tanácsadó és felülvizsgáló:** ChatGPT, a felhasználó által átadott tervek, döntések és eredmények alapján  
**Dokumentum:** 1.0 · 2026-09-06 · belső átadó

## 0. Hogyan használd ezt az átadót?

Ez a dokumentum az eddigi beszélgetés konszolidált átadója. Önállóan olvasható; nem szükséges hozzá a teljes beszélgetést újrakérni. A régi asszisztensi ötletek nem automatikusan elfogadott követelmények.

**A státuszokat tartsd külön:**
- **Rögzített követelmény:** a felhasználó kifejezett célja, pontosítása vagy elfogadott iránya.
- **Megvalósítási javaslat:** ebben az átadóban ajánlott műszaki megoldás; Claude vizsgálja meg, indokolja a megtartását vagy módosítását.
- **Nyitott döntés:** még nincs eldöntve; ne építs rá csendes feltételezésként.
- **Prototípus / szimuláció:** tervezési bizonyíték, nem éles funkció.

A legújabb felhasználói pontosítás elsőbbséget élvez. Ez az átadó a korábbi `kommunikacios-ai-termek-alapok.md` 0.1 változatánál frissebb és részletesebb, de nem alakítja a nyitott műszaki döntéseket jóváhagyottá.

**Most nem a teljes SaaS egy menetben történő megépítése a feladat.** Először a közös alapokat és onboardingot kell működőképessé tenni, majd az első önálló hírfigyelő modullal bizonyítani a hordozhatóságot.

## 1. Üzleti és emberi kontextus

### 1.1 Miért készül a termék?

Az Aitmetica SRL korábban Mediapartizan SRL néven működő, körülbelül 12 éves marosvásárhelyi kommunikációs vállalkozás. Magyarul és románul dolgozik. Az induló leírás 8–10 fős céget és öt tulajdonos-partnert említett; a későbbi pontosítás szerint három aktív résztvevőre és Vilmosra koncentrálódó felelősségre kell számítani. A tényleges fejlesztési kapacitás nincs tételesen felmérve.

A csapat szereti a kommunikációs szakmát. Az elhagyandó modell az alacsony marzsú, emberi teljesítési órákkal arányosan növekvő ügynökségi munka. A termék az ügyfél marketingesének képességeit növeli; a jelenlegi külsős kivitelezést idővel ki is válthatja.

A felhasználó havi körülbelül 30 000 lej veszteséget és érdemi pénzügyi mozgástér hiányát jelezte. Ez a beruházási és működtetési döntések korlátja. Nem indokolja a termékvízió felülírását, de kizárja a céltalan, hosszú keretrendszer-fejlesztést és az indokolatlan infrastruktúra-bonyolítást. Nincs jóváhagyott fejlesztési költségkeret, határidő vagy bevételi előrejelzés.

### 1.2 Két összekapcsolódó üzleti irány

1. Saját kommunikációs SaaS: tervezés, ötletelés, előállítás, adaptálás, jóváhagyás, ütemezés és automatizálás, közös vállalati kontextussal.
2. Vállalati AI-bevezetési szolgáltatások: korai, hiteles piaci jelenlét Romániában, adott esetben helyi AI-infrastruktúrával.

A szolgáltatás és a termék közös képességalapja a megbeszélt irány. Az egyszeri bevezetési díj és ismétlődő használati/támogatási díj javasolt üzleti modell, de nincs végleges ár vagy csomag. Nem igazolt állítás, hogy nincs versenytárs vagy a cég első a piacon.

### 1.3 Márka és ügyfélkapcsolatok

- Aitmetica SRL a jogi név, nem eldöntött piaci márkanév.
- A Mediapartizan kifutó név; új nyilvános identitást nem építünk rá.
- A prototípus semleges munkacíme: „Kommunikációs munkatér”.
- A Misszió Tours fizető fejlesztési ügyfél és a felhasználó szerint korrekt partner, személyes barátsági alappal. Nem puszta pilotötlet, de nem is bizonyított hidegpiaci értékesítési minta.
- Ügyfélajánlásnál a nyilvános méret és funkcionális illeszkedés nem elég: fizetési fegyelem és együttműködési tapasztalat is számít. Korábbi célpontlisták nem jóváhagyott értékesítési listák.

## 2. Termékvízió és nem megengedett visszaszűkítések

**A termék egy több ügyfél számára személyre szabható, AI-központú kommunikációs munkakörnyezet.** A kommunikációs vezető vagy a saját kommunikációját kezelő személy teljes munkájából indul. Az AI a vállalat tevékenységére, céljaira, víziójára, értékeire, stratégiájára és stílusára támaszkodik.

Nem egyszerű posztgenerátor, nem ügynökségi belső gyártásgyorsító, és nem egyetlen iparágra szabott alkalmazás. Napelemes vállalkozás, utazási iroda, CNC-műhely vagy sportoló-influenszer ugyanazokat a közös modulokat használhatja, eltérő profillal.

A Veltol példacég: van marketingese, ő tervezi a kommunikációt, ad információt és hagy jóvá. A jelenlegi ügynökségi munka a tartalom formába öntése és elkészítése, néha ötletadás. Ez nem a SaaS funkcionális határa. Nem döntött, hogy Veltol lesz első fizető SaaS-ügyfél.

**Nem érvényes követelmény:** a korábbi ajánlatkövetőre szűkített terv; az első kiadásból végleg kizárt ütemezés; a korábbi asszisztensi árak, pontszámok és ügyfélszám-kapuk; a korábbi brandnévjelöltek. A teljes SaaS célterülete megmarad, az építési sorrend külön kérdés.

## 3. Rögzített követelményjegyzék

| ID | Követelmény |
|---|---|
| R-01 | Több ügyfélnek értékesíthető, iparágfüggetlen rendszer; ügyfélsajátosságok konfigurációban. |
| R-02 | A marketinges teljes munkáját támogatja, akár külsős kivitelezés kiváltásával. |
| R-03 | Az AI a működés központi eleme, a beállításban is segít. |
| R-04 | Cserélhető felhős AI-szolgáltatók és helyi LLM kapcsolódásának támogatása szükséges. |
| R-05 | A közös ügyfélprofil a befogadó fő alkalmazás központi adatbázisában él és ott szerkeszthető. |
| R-06 | Az onboarding ennek első tervezetét és jóváhagyását készíti elő; nincs párhuzamos hiteles profil. |
| R-07 | Önállóan használható, más alkalmazásba minimális bekötéssel átvihető, verziózott modulok. |
| R-08 | Stabil webes alap, megfelelő cybersecurity, gyors és igényes felület. |
| R-09 | Minden felhasználói szöveg központilag szerkeszthető és lokalizálható. |
| R-10 | Lépések és mezők konfigurálható, bővíthető szerkezete; új működés továbbra is fejlesztést igényelhet. |
| R-11 | A SaaS megjelenése közös Theme-felületen állítható; nincs komponensbe égetett szín, fontcsalád vagy lekerekítés. |
| R-12 | A későbbi komponensek és képernyők is a közös témát öröklik. |
| R-13 | Az ügyfél vizuális brandprofilja külön tartomány; nem a SaaS témája. |
| R-14 | Első kötelező felületi nyelvek: magyar, román, angol. Arab/RTL bővíthetőség; most nem átadási kapu. |
| R-15 | A felület nyelve, a kommunikáció nyelvei és az egyes anyagok nyelve külön beállítás. |
| R-16 | Kézi javítás védelme; AI-javaslat nem írhat felül csendben emberi adatot. |
| R-17 | Forrás, következtetés, hiány, jóváhagyás és módosító követhető. |
| R-18 | Megszakítható, folytatható onboarding; siker csak sikeres mentés után. |
| R-19 | Az első szakmai modul a hír-/sajtófigyelő; a közös onboarding ezt megelőzi. |
| R-20 | A fejlődő dokumentáció, moduljegyzék és döntési napló a megvalósítás része. |

## 4. A legfontosabb korábbi tanulság: a worklog bukása

A korábbi PHP-worklog/workspace projekt előzetes modulhatárok nélkül nőtt sok fájlos, összefonódó rendszerré. Később funkciók kivétele és más alkalmazásba építése lényegében újraírást igényelt.

Ezt nem pusztán technológiacserével kell elkerülni. A felhasználó követelménye: amit működő közös képességként egyszer megírunk, azt azonos technológiai környezetben más fejlesztéshez újra lehessen használni.

Reális cél: az üzleti logika ne igényeljen újraírást; a befogadó rendszerhez csatlakozó és esetenként új felület szükséges lehet. Külső API-változások, új igények, biztonsági frissítések miatt karbantartás lesz. Ne ígérj „soha többé hozzányúlni sem kell” működést.

A hordozhatóságot két valódi integrációval bizonyítjuk, nem a jövő összes lehetséges rendszerét kiszolgáló keretrendszerrel.

## 5. Javasolt architektúra — Claude által ellenőrizendő és konkretizálandó

### 5.1 Technológiai irány

Korábbi ajánlás: TypeScript, React/Next.js, PostgreSQL; hosszú AI- és médiamunkák külön háttérfeldolgozással. Ez tervezési irány, nem jóváhagyott verziólista vagy kész architektúra.

Claude a kiválasztáskor ellenőrizze az aktuális támogatott verziókat, licenceket, biztonsági frissítéseket és a rendelkezésre álló környezetet hivatalos dokumentációból. Ne másoljon automatikusan egy régi projektverziót. A SaaS teljesítményét és biztonságát nem garantálja a keretrendszer neve.

Induló javaslat: egy repozitórium, egy logikailag összefüggő alkalmazás, külön csomagok és háttérfeldolgozó. Ne indítsunk indokolatlanul mikroservice-hálózatot. Ne legyen Vercel-, egyetlen modell- vagy egyedi CMS-függő az üzleti mag.

### 5.2 Csomaghatárok

Az alábbi szerkezet példa, nem kötelező könyvtárnévlista:

| Egység | Felelősség | Amitől ne függjön |
|---|---|---|
| `contracts` | Közös sémák, azonosítók, hibakódok, modulkapcsolatok | React, Next.js, ORM |
| `profile-core` | Profil, arculati verziók, jóváhagyási szabályok | Képernyők, hírfigyelő |
| `onboarding-core` | Piszkozat és lépésfolyamat, AI-javaslat kezelése | Befogadó alkalmazás konkrét adatbázisa |
| `onboarding-ui` | React-képernyők, a core és UI-rendszer használata | Saját API-kulcsok, közvetlen DB-hozzáférés |
| `design-system` | Komponensek, theme séma, állapotok, nyelvi megjelenítés | Ügyfél konkrét arculata |
| `ai-adapters` | Szolgáltatók képességei, hívások, hibák, használati adatok | Veltol/Misszió-specifikus logika |
| `news-monitor-core` | Gyűjtési és feldolgozási folyamat, relevancia, találatok | SaaS route-ok, közvetlen ügyféltáblák |
| `host-adapters` | Tárolás, azonosítás, ütemezés, események bekötése | Más modul privát belső megvalósítása |
| `apps/web` | Fiók, központi profil, modulok befogadása | — |
| `apps/worker` | Tartós háttérfeladatok futtatása | Böngésző nyitva tartása |
| `apps/reference-host` | Kis második befogadó a hordozhatóság ellenőrzésére | Teljes SaaS behúzása |

Nem kell minden felsorolt csomagot az első napon létrehozni. A határokat előre dokumentálni kell, a csomagokat valós feladat mentén kialakítani.

### 5.3 Kötelező modul-szerződés

Minden modulhoz legyen:
- cél és nem vállalt feladatok;
- bemenet/kimenet sémával;
- publikus belépési pontok, hibák és események;
- saját adatok és a hosttól kapott adatok elhatárolása;
- jogosultság- és ügyfélkontextus igény;
- külső függőségek és költséget okozó műveletek;
- bekötési példa, tesztelési mód, verziózási és migrációs leírás.

Tilos más modul privát fájljait importálni vagy tábláit szerződés nélkül írni. Függőségi szabályokat automatizált ellenőrzés védjen. A megosztott csomagokból verziót használjunk, ne projektmásolatokat.

## 6. Közös profil és onboarding — első megvalósítás

### 6.1 A három lépés

1. **Bemutatkozás:** név, weboldal VAGY néhány mondatos leírás; opcionális dokumentumok. Az AI javítható tevékenység-összefoglalót készít.
2. **Kommunikációs alapok:** célközönség, kommunikációs cél, tartalomnyelvek, alap-hangnem és rövid minta. Az AI előkészít, a felhasználó javít vagy későbbre hagy.
3. **Ellenőrzés:** összefoglaló, eredetjelölés, helybeni szerkesztés, profiljóváhagyás; opcionális arculati rész külön státusszal.

Most tárolt alapmezők: név, tevékenység, célközönség, kommunikációs cél, nyelvek, hangnem. Vízió, értékek, részletes stratégia és további profilrészek bővítési pontok, nem kötelező onboardingkérdések.

A név + elfogadott tevékenységleírás minimális befejezési feltételként javasolt; a pontos szabályt dokumentálni kell. A többi mező láthatóan hiányos maradhat. A későbbi modul azt kérdezze vissza, ami a feladatához ténylegesen kell.

### 6.2 Adatgazda és átadás

Az onboarding nem a profil végleges szerkesztője. A központi alkalmazás tárolja a hiteles profilt, saját fiók-/profilfelületén teszi később szerkeszthetővé, és innen szolgálja ki a modulokat.

A fióklétrehozás, azonosítás, onboardingpiszkozat és véglegesítés sorrendje még nyitott. Claude tervezze meg úgy, hogy a későbbi folytatás biztonságos legyen; ne legyen csak egy böngészőmemóriában élő, „elmentettnek” nevezett folyamat. A sikeroldali `profile.open` a hosthoz vezet, nem az onboarding harmadik lépésének újranyitása.

### 6.3 Szerkeszthető onboarding-definíció

Minden látható cím, leírás, mezőcímke, gomb, hiba, példa és hozzáférhetőségi szöveg stabil azonosítójú központi tartalomból jöjjön. Lépés- és mezőkonfiguráció bővíthető legyen meglévő mezőtípusokkal. Új funkció új kódot igényelhet.

Az adminisztrátori szövegszerkesztés, az AI-promptok és a biztonsági szabályok külön réteg. A felirat átírása nem változtathat jogosultságot. A központi szerkesztőfelület termékigény; a prototípusban való megjelenése nem bizonyítja a backend meglétét.

### 6.4 Kötelező állapotviselkedés

- Az automatikus mentés piszkozatot ment, nem jóváhagyást.
- Mentés/kilépés és jóváhagyás megvárja a tárolási eredményt.
- Hibánál nincs hamis sikeroldal; az adatok megmaradnak.
- AI-kieséskor kézi összefoglalóval folytatható.
- Újragenerálás külön javaslatot hoz, a kézi javítás nem tűnik el.
- Forrás eredete és utolsó módosító külön megmarad; a forrás nem „ellenőrzött igazság”.
- A nyelvváltás nem ír át profiladatot és nem indít új onboardingot.
- A forrásfeldolgozási hiba és AI-szolgáltatói hiba külön hibakód.

## 7. Ügyfél-brandprofil

### 7.1 Cél és minimum

A márka vizuális kommunikációját rögzítő, központi, verziózott adat. Nem önállóan karbantartott „skillfájl”. JSON-export és AI-nak átadható utasítás ebből származtatható.

Opcionális források: logó, arculati kézikönyv, kreatív minták, weboldal. Az AI javaslatot készít, nem feltételezi, hogy a weboldal teljes márkaszabályzat.

Adatok: logóvariánsok kezelt fájlhivatkozással; elsődleges/másodlagos/háttérszín; konkrét cím- és törzsbetű; képvilág; alapvető elrendezési/formaszabály; követendő és kerülendő példák; eredet és módosítások.

A „kontrasztos serif” irányjavaslat, nem renderelhető betűazonosító. A font elérhetőségét, használati jogosultságát és szükséges írásrendszerét tisztázni kell. Hiányos arculattal is befejezhető az onboarding.

### 7.2 Elkülönítés és állapotok

A SaaS témája a kezelőfelületre hat. Az ügyfélkreatív belseje saját brandprofilból épül. SaaS-témaváltás nem módosíthatja az ügyfél logóját, betűit vagy kreatívjának formáit.

Állapotok: nincs megadva / tervezet / későbbre hagyva / jóváhagyott. Egymást kizáró állapotok. A jóváhagyás egy konkrét, változatlan verzióhoz tartozzon, jóváhagyóval és időponttal.

Módosításkor új tervezet keletkezik; a korábbi jóváhagyott teljes adatpillanatkép megmarad. Nem elég a régi verziószám tárolása. Az új változat nem válik automatikusan tartalomgyártási szabállyá. A generált anyaghoz később kapcsolódjon, mely profil-/brandverzióval készült.

## 8. Theme és többnyelvűség

### 8.1 Theme

Központi témakonfiguráció és külön admin Theme-felület szükséges. Minden megjelenési döntés közös, elnevezett tokenből származzon: színek, fontok, vastagságok, méretek, sorköz, térköz, keret, lekerekítés, árnyék, gradiens, átlátszóság, blur, állapotok és mozgás.

A konkrét értékek a konfigurációban megengedettek; a komponensekben rejtett vagy másolt értékek nem. A származtatott token szabálya lehet közös, de a változtatni kívánt bemenete legyen szerkeszthető. Ne tokenizáljunk céltalanul minden strukturális nullát; a felhasználó által igényelt vizuális szabadság legyen valós.

Induló formajavaslat: gomb/mező 6 px, kártya/panel 10 px, címke 4 px. Mind módosítható 0-ig, kapszula opcionális. Nincs kötelező kapszulagomb.

Theme munkafolyamat: tervezet → élő előnézet → mentés → külön alkalmazás. Hibás import nem ír felül tervezetet vagy alkalmazott témát. A téma verziózott, import/export sémája ellenőrzött. Az első kirajzolási tartalék ugyanabból a forrásból generálódjon, ne második kézi konfiguráció legyen.

A kezelőfelület adjon olvashatósági visszajelzést. Az importban támogatott színformátumot a színválasztó és a kontrasztellenőrzés is kezelje; különben szűkíteni kell a támogatást. A csökkentett mozgás a CSS és JS animációkra is érvényes.

### 8.2 Nyelvek

Kötelező induló készlet: **HU, RO, EN**. Arab példa volt a bővíthetőségre; a már meglévő RTL támogatást nem szükséges kidobni, de nem jelenlegi átadási kapu.

- Központi nyelvi állományok, stabil kulcsok és dokumentált tartaléknyelv.
- Minden hiba, AI-magyarázat, Theme-mező, állapot, hozzáférhetőségi címke lokalizált.
- Validátor strukturált hibát ad, a felület fordítja; nincs backendbe írt magyar végfelhasználói üzenet.
- UI-nyelv ≠ kommunikációs nyelvek ≠ konkrét tartalom nyelve.
- Böngészőnyelv lehet javaslat, de a választás mindig felülírható és megőrzött.
- RTL-hez logikai térközök, irányfüggetlen komponensek, helyes URL/kód LTR-részek és szükség esetén írásrendszerhez illő fontok.

## 9. AI-réteg

Rögzített cél: OpenAI, Claude, más szolgáltató vagy helyi LLM használhatósága. Nem ígéret, hogy minden modell minden feladatot azonos minőségben tud.

Tervezési javaslat:
- Feladattípusok szerinti szerződés: összefoglalás, profiljavaslat, hangnem-finomsítás, arculati elemzés, relevanciaértékelés, ötletkészítés.
- Modellképességek nyilvántartása: szöveg, képértelmezés, strukturált kimenet, nyelvek, limit, költség, futtatási hely.
- Verziózott promptok és kimeneti sémák; kimenet ellenőrzése tárolás/végrehajtás előtt.
- Időkorlát, leállítás, újrapróbálás, használati és költségkorlát; hibák követhetők.
- A vállalati tudás a saját rendszerben él, nem egy szolgáltató beszélgetéselőzménye a hiteles nyilvántartás.
- Saját ügyfél-API-kulcs, szolgáltató által adott keret és helyi modell kapcsolatának üzleti részlete nyitott.
- Onboardinghoz szolgáltatói alap-AI javasolt; a felhasználót ne fogadja kötelező API-kulcs-bekérés. Ennek költség-/visszaélés-védelmét meg kell tervezni.

A ChatGPT-/Claude-chatelőfizetés nem automatikusan külső SaaS-ból használható API-keret. Az éppen támogatott hivatalos kapcsolódási módokat Cowork ellenőrizze. Ne ígérjen előfizetés-átvitelt vagy hozzáférési korlátot megkerülő integrációt.

A helyi modell használata önmagában nem teszi a teljes SaaS-t helyivé. A dokumentumok, mentések, logok és további AI-lépések adatútját is meg kell határozni. Helyi modell kiesése nem válthat át csendben felhős adatküldésre.

## 10. Első önálló szakmai modul: hír-/sajtófigyelő

### 10.1 Feladat

Az ügyfél által kijelölt RSS-ekből és hozzáférhető weboldalakból gyűjt, kiszűri az ismétléseket, a jóváhagyott profil alapján értékel, forrással ellátott összefoglalót és igény esetén tartalomötletet készít.

Induló konfigurációja üres. Az onboardingból kapott profil alapján az AI témákat, forrásokat és kizárásokat javasolhat. Csak a modul saját szükséges kérdéseit teszi fel; nem ismétli a közös onboardingot.

Bemenet: forráslista, figyelési cél/témák/kizárások, tartalomnyelvek, kimeneti igény, gyakoriság, profilverzió, AI-hozzáférés és jogosult ügyfélkontextus.

Kimenet: azonosított források, találatok, időbélyegek, relevancia és indoklás, összefoglalók/ötletek, feldolgozási állapot és hibák. Az AI által alkotott ötlet különüljön el a forrás állításától.

### 10.2 Első terjedelem

- Kézi indítás és napi időzített futás.
- RSS és előre meghatározott, hozzáférhető weboldaltípusok; nem „minden weboldal támogatása”.
- Deduplikálás, tartós feldolgozási állapot, követhető háttérfutás.
- Próbafutás és „releváns/nem releváns” visszajelzés.
- AI által javasolt szabálymódosítás csak megfelelő felhasználói jóváhagyással.
- Nincs automatikus social publikálás ebben a modulban.

### 10.3 Hordozhatósági bizonyítás

Ugyanaz a verziózott mag működjön az első webalkalmazásban és egy minimális második hostban. A Misszió backendjébe történő valódi integráció későbbi konkrét cél, de az ügyfél működő rendszerét nem módosítjuk hozzáférés, kódfelmérés és megfelelő felhatalmazás nélkül.

A második host adja a profil-, tárolási-, AI- és ütemezési csatlakozót. A modul nem tartalmazhat Veltol- vagy Misszió-specifikus elágazást.

## 11. Biztonsági és működtetési terv — javasolt kötelező műszaki ellenőrzések

Ezek nem éles rendszerre vonatkozó tanúsítási állítások. Cowork készítsen konkrét adatfolyam- és fenyegetési tervet, majd ellenőrizhető megvalósítást.

| Terület | Tervezendő védelem |
|---|---|
| Ügyfélelkülönítés | Szerveroldali hozzáférés-ellenőrzés minden adatműveletnél; tárolásban, jobokban, cache-ben és logokban is helyes ügyfélkontextus. |
| AI-végrehajtás | A modell javaslata nem jogosultság. Program ellenőrzi a műveletet; forrásszöveg nem emelhet jogot. |
| URL-feldolgozás | Ne érhesse el a belső hálózatot, helyi/metadata végpontokat; átirányítások és feloldott címek ellenőrzése, méret-/idő-/letöltési korlát. |
| Feltöltött fájlok | Típus- és méretellenőrzés, izolált feldolgozás; aktív tartalom, SVG és HTML biztonságos kezelése. |
| Titkok | API-kulcsok szerveroldali, megfelelően védett tárolása; nincs böngészőcsomagban vagy naplóban. |
| Helyi AI | Hitelesített biztonságos kapcsolat; nyers helyi LLM-végpontot ne tegyünk szabadon elérhetővé. |
| Külső tartalom | Prompt injection és scriptbevitel elleni határok; forrás mint adat, nem rendszerutasítás. |
| Háttérmunkák | Ütköző futások kezelése, ismételt indítás ne hozzon ismétlődő rekordot vagy kétszeres műveletet. |
| Mentés | Ügyféladatok és fájlok mentése, kipróbált visszaállítás, verziómigrációk visszaállítási terve. |
| Üzemeltetés | Hibajelzés, függőségfrissítés, hozzáférésnapló, költségfigyelés és felelős. |

A prototípus localStorage-ja nem éles titoktároló vagy többügyfeles adatbázis. Témaalkalmazásra és központi szövegek/promptok szerkesztésére külön jogosultság szükséges.

A külső szakmai AI-felülvizsgálat nem helyettesít független biztonsági szakértői vizsgálatot az éles, többügyfeles indulás előtt. Nem szükséges minden prototípusmódosítást biztonsági audittá változtatni; a valódi kockázatokat célzottan ellenőrizzük.

## 12. Jelenlegi források és prototípusállapot

### 12.1 Rendelkezésre álló anyagok

| Forrás | Szerepe |
|---|---|
| `Onboarding felület prototípus_v5.zip` | Utolsó átvizsgált designcsomag. HTML-prototípusok, JS-segédek, téma-/brand JSON, átadók. |
| `Onboarding felület prototípus(2).zip` | v4 előzmény. |
| `Onboarding felület prototípus(1).zip` | v3 előzmény. |
| `Onboarding felület prototípus.zip` | v1/v2 előzmény. |
| `claude-design-onboarding-handoff.md` | Első designbrief; későbbi követelményekkel együtt értelmezendő. |
| `kommunikacios-ai-termek-alapok.md` | Korábbi konszolidáció 0.1; ez az átadó frissíti a kontextusát. |
| `e48116fd-3406-4410-8c84-4581e6c1b855.md` | Misszió Tours részletes állapotleírás, 2026-09-03. |
| `6a922d8e-bf20-43d5-a928-a30916e67e87.pdf` | Saját AI-rendszerek leltára. |

Ezen fájlok nem feltétlenül érhetők el automatikusan Coworkban. A felhasználó adja át az aktuális csomagot és szükség szerint a régi forrásokat. Ne állítsd, hogy láttad a repókat, ha csak leírás van.

**v6:** technikai javítási prompt már elkészült, de v6 csomagot e dokumentum készítésekor még nem kaptunk és nem vizsgáltunk. Ha megérkezik, azt külön ellenőrizni kell, nem automatikusan késznek tekinteni.

### 12.2 Mit igazolt a v5 felülvizsgálata?

Statikus kódolvasás és néhány izolált logikai futtatás történt. Teljes böngészős megjelenítési és mobil/RTL használhatósági vizsgálat nem történt: a rendelkezésre álló környezetben nem volt indítható böngésző. Ezt a korlátot ne tüntesd el az átadásban.

Megjelent: HU/RO/AR szótár és RTL; külön brandfont és forma; egymást kizáró arculati állapot; típusosabb témaimport. Az angol későbbi pontosításként kötelező lett.

### 12.3 A v6 javítási csomag feladatai

1. Teljes HU/RO/EN nyelvkészlet; validációs hibák strukturált hibakódból fordítva.
2. Valódi színvalidáció: a v5 elfogadta az `rgb(nemszin` és `oklch(hibas` értékeket.
3. A támogatott színformátumok működjenek az importban, szerkesztőben, előnézetben és kontrasztellenőrzésben is.
4. Tényleges brandpillanatképek megőrzése: a v5 csak a régi verziószámot tartotta meg.
5. A fennmaradó fix színkeverési, sorköz-, térköz- és gombpadding-értékek szerkeszthetővé tétele.
6. Megbízható helyi webszerveres indítás dokumentálása; a `fetch('tema-alap.json')` miatt nem elég biztos működést ígérni dupla kattintásra.
7. Témabetöltési hiba látható, újrapróbálható; hibás/hiányos konfigurációval nincs mentés/alkalmazás.
8. Korábbi javítások megőrzése: külön újragenerálási javaslat, mentéshez kötött siker, kézi folytatás, külön forrás-/AI-hiba, központi profilhoz átadás.

A designcsomag HTML + `support.js` alapú prototípus. A saját futtatókönyvtárát nem kell termékfüggőségként továbbvinni. A React/TypeScript megvalósítás a tisztázott szerződések alapján készüljön, ne az egybefűzött prototípuskód automatikus átírásával.

### 12.4 Meglévő rendszerek mint lehetséges építőelemek

A leltár szerint saját social platform, kétnyelvű médiatár, szervezési/dokumentumrendszer, előkönyvelés, feliratozó és webes AI-funkciók már léteznek. Ezek újrahasználhatósága nincs kódszinten felmérve.

A Misszió fizetett referencia, de a szeptember 3-i leírás szerint ellenőrzési példány volt nyitott e-mail-, adat- és üzemeltetési kérdésekkel. A PDF általános „éles” megfogalmazását nem szabad a teljes nyilvános indulás bizonyítékának venni. A worklog félbehagyott; nem automatikusan újrahasználható alap.

## 13. Megvalósítási menetrend és kapuk

Naptári becslést Cowork csak a kód, hozzáférések és kapacitás felmérése után adjon. Minden szakasz működő, ellenőrizhető eredménnyel záruljon.

| Szakasz | Cowork feladata | Kimenet és továbblépési feltétel |
|---|---|---|
| 0. Átvétel | Olvasd el ezt az átadót és az aktuális designcsomagot; rögzítsd, mi elérhető. | Rövid eltérés-/hiánylista, prototípus indítható vagy a blokkoló ok pontos. |
| 1. Alapterv | Technológiai választás, modulhatárok, adatgazdák, fiók/profil/piszkozat, fenyegetési vázlat. | Rövid architektúra és döntési napló; külső szakmai felülvizsgálatra átadható. |
| 2. Közös alap | Repó, csomagszerkezet, függőségi ellenőrzés, profile szerződés, theme és i18n. | Minimális referencia-host; UI nélküli profiltesztek; közös téma és nyelvek működnek. |
| 3. Onboarding | Három lépés, egy valódi AI-csatlakozó és tesztadapter, mentés/folytatás, központi profiloldal minimuma. | Végigjárható, ténylegesen mentett HU/RO/EN folyamat; hibautak tesztelve. |
| 4. Brand és Theme lezárás | Opcionális arculat, jóváhagyás/verziók, szerkesztés; Theme admin, validált import/export. | Brand és SaaS-téma független; korábbi verzió visszanyerhető; hibás import nem ír felül. |
| 5. Hírfigyelő mag | Konfiguráció, forráskezelés, háttérfutás, deduplikáció, AI-értékelés és találatok. | Kézi és napi futás, ismétlésbiztonság, források és hibák követhetők. |
| 6. Hordozhatóság | Ugyanazokat a csomagokat második hostba bekötni. | Üzleti logika másolása nélkül működik; bekötési leírás és verziófrissítési próba. |
| 7. Pilotkész állapot | Célzott biztonsági, terhelési, nyelvi és visszaállítási vizsgálat; költségek. | Konkrét elfogadási jegyzőkönyv, megismert maradék kockázatok, üzemeltetési felelős. |

A 3–4. szakasz részfeladatai párhuzamosíthatók, ha a szerződések stabilak; ez nem előírás külön ügynökök futtatására. Az első működő AI-csatlakozó nem jelenti, hogy minden szolgáltató támogatása kész. Legalább egy másik adapterrel vagy helyi modellel később igazolni kell a cserélhetőséget, azonos képességű feladaton.

## 14. Elfogadási feltételek

| ID | Bizonyítandó |
|---|---|
| A-01 | Üres profilból URL nélkül is végigvihető az onboarding. |
| A-02 | AI-javaslat és kézi javítás elkülönül; újragenerálás nem veszít adatot. |
| A-03 | AI-kiesés és forráshiba külön látszik; kézi folytatás működik. |
| A-04 | Mentési hiba nem mutat sikert; visszatéréskor ténylegesen visszatöltődik a piszkozat. |
| A-05 | Jóváhagyott profil a host központi profilfelületén szerkeszthető. |
| A-06 | HU/RO/EN UI és hibák; nyelvváltás megőrzi a munkát. |
| A-07 | Theme-váltás minden UI-komponensre hat; brandkreatívra nem. |
| A-08 | Brandmódosítás új tervezet; korábbi teljes jóváhagyott pillanatkép változatlan. |
| A-09 | Hibás theme import/betöltés nem rontja el a működő konfigurációt. |
| A-10 | Ismételt vagy párhuzamos hírfigyelő-futás nem készít ellenőrizetlen duplikátumokat. |
| A-11 | Két külön ügyfél adatai, jobjai és eredményei nem keverednek. |
| A-12 | Azonos csomag két hostban működik, ügyfélspecifikus kód és másolás nélkül. |
| A-13 | Helyi-only adatpolitika esetén nincs automatikus felhős továbbítás. |
| A-14 | URL/fájl külső tartalma nem indíthat jogosulatlan műveletet. |
| A-15 | Mentésből helyreállítás ténylegesen kipróbált a pilotkész kapunál. |
| A-16 | Az állított vizuális/nyelvi ellenőrzések ténylegesen elvégzettek, korlátaik jelöltek. |

Ne írj mechanikus tesztet minden szöveghez vagy színhez. Teszteld a valódi kockázatot: adatvesztés, téves jóváhagyás, izoláció, import, idempotencia, függőségi szabályok. A böngészős teszt ellenőrizze a fő felhasználói utat, a mobileszközös elrendezést és a billentyűzetes használatot.

Teljesítmény: a felület maradjon reagálóképes AI-futás közben; a várakozás, leállítás és hiba legyen látható. Mérhető célértékeket a konkrét környezetre állíts fel, ne használj igazolatlan „ultragyors” állítást.

## 15. Szerepek és szakmai felülvizsgálat

### Vilmos / terméktulajdonos

A termékcél, prioritás, költség és üzleti vállalások döntéshozója. Nem neki kell minden technikai részletet kitalálnia vagy ismételten elmagyaráznia a kontextust. Rövid, közérthető, legfeljebb három következő lépést tartalmazó egyeztetést preferál.

### Claude Cowork / megvalósító

Felelős a terv konkretizálásáért, kódfelmérésért, csomagok és csatlakozók kialakításáért, kódolásért, ellenőrzésért és naprakész dokumentációért a ténylegesen rendelkezésre álló eszközökkel. Rutin, visszafordítható feladatokkal haladjon önállóan. Ha nem tud futtatni, fájlt elérni vagy integrálni, pontosan jelezze, ne szimuláljon elvégzett munkát.

### Claude Design / tervezési forrás

A képernyő- és interakciós prototípusok készítője. A prototype nem dönt automatikusan adatbázisról, termékarchitektúráról, biztonságról vagy éles készültségről.

### ChatGPT / külső szakmai felülvizsgáló

Vilmos ide hozza Claude terveit, döntéseit vagy átadott eredményeit. ChatGPT véleményezi a modulhatárokat, követelményilleszkedést, fenntarthatóságot, biztonsági kockázatokat és az ellenőrzési bizonyítékokat. Nincs automatikus hozzáférése Cowork aktuális munkájához, és a beszélgetés nem jelent folyamatos háttérmonitorozást.

A felülvizsgáló tanácsot ad; nem állítja le automatikusan minden apró változtatás után a fejlesztést. Jelentős architektúraeltérésnél vagy adatkezelési kockázatnál Vilmos dönt az irányról.

**Ajánlott felülvizsgálati pontok:**
1. A modul-/adat-/AI-architektúra első terve, nagy implementáció előtt.
2. A működő onboarding + központi profil és Theme/brand határok.
3. A hírfigyelő két hostos bizonyítása, majd a pilotkész állapot.

**Cowork átadási sablonja a felülvizsgálathoz:**
- Vizsgálandó döntés vagy változás; érintett R-/A-azonosítók.
- Választott megoldás és rövid indok; érdemi elvetett alternatíva, ha volt.
- Érintett modulok, publikus szerződések, adatváltozások.
- Pontos fájlok vagy commit/csomag, indítási útmutató.
- Ténylegesen futtatott ellenőrzések és eredmények.
- Nyitott kérdések, ismert hibák, költség/adatkezelési következmény.

## 16. Dokumentáció és változáskezelés

Claude a projekt repójában tartson karban rövid, egymásra hivatkozó dokumentumokat. Javasolt szerkezet:

- `README.md`: indítás és fő belépési pontok.
- `docs/PROJECT.md`: aktuális termékterjedelem, státusz és követelményjegyzék.
- `docs/ARCHITECTURE.md`: modulok, adatgazdák, függőségek.
- `docs/decisions/`: jelentős döntések, indokok és felülírások.
- `docs/MODULES.md`: meglévő, újrahasználható képességek jegyzéke.
- `docs/STATUS.md`: elkészült, szimulált, folyamatban, blokkolt.
- `docs/VERIFICATION.md`: ellenőrzések, ismert hiányok, futtatási környezet.

Az itt ajánlott fájlnevek nem igényelnek külön felhasználói döntést. Ne készíts sok üres dokumentumot; valós tartalommal induljanak.

Minden új feladat előtt nézd meg, van-e már azonos képesség. Minden fontos változtatás után frissítsd a releváns dokumentumot. Ne váljon a designátadó teljesítési állítása automatikusan teszteredménnyé.

Jelentős adatmodell-/modulhatár-változást előbb tervezz meg. Különítsd el az ügyféladatok migrációját a vizuális változtatástól. Ne legyen helyi-only változás egyetlen példányban: a megvalósított kód megfelelő verziókezelésbe kerüljön.

## 17. Nyitott döntések, amelyeket Coworknak fel kell dolgoznia

1. Repó, hozzáférhető forráskód és fejlesztési környezet; a meglévő projektekből mi vehető át?
2. Konkrét támogatott TypeScript/React/Next.js/adatkezelési stack és telepítési mód.
3. Fiók, szervezet/márka, felhasználó, szerepkör és profil kapcsolata; onboardingpiszkozat tulajdonosa.
4. Első AI-szolgáltató, költségkeret, adatpolitika és későbbi BYOK/helyi kapcsolat.
5. Tárolási adapter, fájlkezelés, háttérfeladat-sor és időzítő.
6. Theme- és copy-adminisztráció jogosultsága, szerkesztési/alkalmazási köre.
7. Profil-/brandverziók használata futó és korábban elkészült feladatokban.
8. Hírfigyelő első támogatott forrástípusai és a második host.
9. Üzemeltetési felelős, monitoring, backup, visszaállítás és külső biztonsági vizsgálat.
10. Első szállítási ütem és ráfordítás — a tényleges környezet megismerése után.

Ezeket ne egyszerre tedd fel tíz kérdésként Vilmosnak. A rendelkezésre álló anyagból dolgozd ki az ajánlást; egyszerre csak a valóban döntést igénylő pontokat emeld ki.

## 18. Cowork első munkamenetének konkrét feladata

**Első körben három eredményt készíts:**

1. **Átvételi állapot:** milyen csomagot/kódot kaptál, mi indul el, mely ismert v6-javítás kész és melyik nincs ellenőrizve.
2. **Megvalósítható alapterv:** modulok, profiladatgazda, hosthatárok, AI- és tárolási csatlakozók, theme/copy/i18n helye; röviden indokolt technológiai döntések.
3. **Első építési egység:** a közös profil + onboarding minimális végig működő útjának feladatsora, elfogadási feltétele és még szükséges hozzáférései.

Ne kérd Vilmostól újra az üzleti célok megfogalmazását. Ne állj meg annál, hogy felsorolod, mit tudnál csinálni. A tervet és az ellenőrizhető előkészítést ténylegesen készítsd el. Éles rendszermódosítást, külső publikálást és fizetős szolgáltatás bekapcsolását csak a megfelelő felhatalmazás szerint végezz.

## 19. Rövid indító utasítás

> Ezt a projektet veled, Claude Coworkkal valósítom meg. Olvasd el a teljes átadót és a csatolt aktuális designcsomagot. Te vagy a megvalósítás vezetője; ChatGPT külső szakmai felülvizsgálóként ellenőrzi a fontos terveket és eredményeket, amelyeket átadok neki. A rögzített követelményekből indulj, a javaslatokat indokoltan konkretizáld. Elsőként a 18. fejezet három eredményét készítsd el. Ne keverd össze a prototípust az éles kóddal, és ne szűkítsd a terméket ügynökségi posztgyártásra. A modulok hordozhatósága, a központi profil, a teljes témázhatóság és a HU/RO/EN felület alapkövetelmény. Röviden kommunikálj, de a technikai munkát és dokumentálást végezd el részletesen.
