> **2026-09-11 este — ez a lap részben elévült.** A 4.2 pont (saját git-szerver a Gigabyte-on, a GitHub
> csak tükör) **NEM valósul meg**: a kód otthona a GitHub marad. Az érvényes rend: `docs/EGYENES-UT.md`.
> A lap többi része — a próba, az elvek, a gépek szerepe, a mentés terve — továbbra is érvényes.

# Közös gépház — minden projekt fejlesztése, kirakása és mentése

**Elmélet, 1. változat · 2026-09-11 · csak terv, kód nincs. A kivitelezés a „mehet” után indul.**

> **2026-09-11, Vilmos döntése:** a mentés (5. fejezet, 6–12. lépés) **halasztva**. Először a fejlesztés
> átállítása a Gigabyte-ra (4. fejezet; a 9. fejezet 2–5. lépése).
> **2026-09-11, Vilmos döntése:** egyelőre **csak a SaaS**. A többi projekt később, egyenként.

**Forrás:** a meglévő jegyzetek (HANDOFF, MELYIK-GEP-MIT-CSINAL, MENTES, UZEMELTETES, NAS-szabályok,
a gépek leírásai). Ami ezekből jön, azt a kivitelezés első lépésében élőben ellenőrizni kell.
Ahol ez különösen fontos, **[ellenőrizendő]** jelölés áll. Semmit nem mértem hozzá, és nem is fogok
végigszámoló parancsot futtatni a NAS-on.

---

## 0. A kérés — ezt kell teljesítenie

| # | Követelmény | A gyakorlatban |
|---|---|---|
| K-1 | minden projektre érvényes | egy minta; projektenként csak egy leíró fájl más |
| K-2 | biztonságos | titok nem hagyja el a házat; minden gép csak azt éri el, amit kell; a távoli mentést az irodából senki nem törölheti |
| K-3 | csak helyi hálón és Tailscale-en fut | a gépezet egyetlen darabja sem nyilvános; kívülről csak a weboldalak látszanak |
| K-4 | gyors | kirakás ~2 perc; a fejlesztés nem vár hídra, fájlmásolgatásra |
| K-5 | kíméli a NAS-t | a NAS nem fordít, nem szkennel; mentéskor csak a megváltozott részek mennek |
| K-6 | kiszámítható | mindig ugyanaz az út, ugyanabban a sorrendben, naplóval |
| K-7 | minimális beavatkozás | éjjel magától megy; csak baj esetén jön üzenet |
| K-8 | hosszú távon fenntartható | kevés alkatrész; minden leírás a tárhelyben; egy gép kiesése pótolható |
| K-9 | napi mentés két távoli helyre | két külön épület, két külön doboz, mindkettő naponta frissül, és hetente kipróbáljuk |

---

## 1. A mai helyzet — mi a baj vele

1. **A munka egy köztes dobozon megy át.** Felhő → a Cowork munkaterülete a Gigabyte-on → GitHub →
   Gigabyte → NAS. 2026-09-11-én a köztes doboz hálózata meghalt, és vele állt a feltöltés, a
   fordítás és a kirakás is.
2. **Miért van köztes doboz:** a felhőből, ahol Claude a kódot írja, csak webes forgalom megy ki.
   Se Tailscale, se ssh (a transportlocal-munkában mérve). A privát GitHubra onnan csak úgy lehetne
   feltölteni, ha a belépő a felhőben ülne — ezt a titoktár-szabály tiltja. Ezért kerülő úton megy.
3. **Minden projekt máshogy él.** SaaS: GitHub, Claude kerülővel tölt fel. Transportlocal: GitHub,
   te töltesz fel a Macről, a cég NAS-a maga húzza le. Marosvásárhelyiek: a repó a NAS-on van, egy
   munkadobozban. Egy minta helyett három.
4. **Házon kívüli mentés nincs.** A SaaS mentése a NAS másik kötetére megy (D-18); tűz, lopás vagy a
   teljes gép elvesztése ellen ez nem véd.
5. **A titoktár (vault) titkosítatlan fájlokból áll**, és a Synology Drive több gépre szinkronizálja.
6. **A NAS-on a jegyzet szerint kívülről nyitva van** a DSM (5001), a Drive (6690) és a WebDAV (5006).
   Ez ütközik a K-3-mal. **[ellenőrizendő]**

---

## 2. Alapelvek — ezekből következik minden más

| # | Elv | Miért |
|---|---|---|
| E-1 | **A munka ott történik, ahol a kód és a gépek vannak: a Gigabyte-on.** | nincs köztes doboz, nincs fájlmásolgatás, nincs titok a felhőben |
| E-2 | **A gépezet Claude nélkül is fut.** A kirakás és a mentés időzített, a gépeken élő program, nem munkamenethez kötött. | ha nincs Claude-munkamenet, a mentés akkor is lefut |
| E-3 | **Minden gépnek egy szerepe van** (a D-22 kiterjesztése). | kiszámítható terhelés, nincs „ma épp itt fordítunk” |
| E-4 | **A NAS-hoz két szűk ajtón lehet hozzányúlni:** kirakás és mentés. Minden más csak olvasás. | a NAS a legérzékenyebb gép: öt projekt, 16 GB, nincs tartalék |
| E-5 | **Titok nem hagyja el a házat; ami elhagyja (a mentés), az titkosítva megy.** | K-2 |
| E-6 | **Csend, ha minden rendben; egy üzenet, ha nem.** | K-7 |
| E-7 | **A mentés csak akkor ér valamit, ha vissza is töltöttük.** Hetente magától. | a nem kipróbált mentés remény, nem mentés |
| E-8 | **Minden projektben ugyanaz a minta**, a különbség egy leíró fájlban van. | K-1, K-8 |
| E-9 | **Minden újraépíthető leírásból.** Ha egy gép meghal, a tárhelyben lévő útmutatóból pótolható. | K-8 |

---

## 3. A gépek szerepe

| Gép | Hol | Szerep | Mit NEM csinál |
|---|---|---|---|
| **Gigabyte** — *műhely* | iroda, mindig megy | Claude munkahelye; a kód otthona (saját git-szerver); fordítás; a kirakás indítása; a saját adatai mentésének indítása; állapotlap; értesítés; heti visszaállítási próba | nem futtat éles szolgáltatást (a meglévő whisper/TTS tudatos kivétel) |
| **NAS (transzmozaik)** — *üzem* | iroda | a dobozok futtatása; adatbázisok; a saját adatainak pillanatfelvétele és elküldése a két távoli helyre | nem fordít, nem szkennel, Claude nem dolgozik rajta |
| **Dell** — *AI* | iroda | Ollama, ComfyUI, átírás | nem fordít; mentést nem fogad |
| **Távoli doboz A** és **B** — *széf* | két külön épület | csak fogad és őriz | semmit nem kezdeményez az iroda felé |
| **Mac** — *kliens* | veled | innen beszélsz Claude-dal és nézed a teszteket, Tailscale-en | semmi nem függ tőle |

A mérések (2026-09-10): a Gigabyte i9-9900K, ~46–48 GB, 468 GB NVMe (345 GB szabad), Docker 29.6.1.
A NAS DS1525+, 16 GB, Docker 24.0.2, 27 doboz. A Gigabyte-on a fordítás 65 mp, közben a NAS
terhelése 1,6-ról nem mozdult.

---

## 4. A fejlesztés és a kirakás útja

```
 Vilmos (Mac / telefon / bárhonnan)
        │ beszélget
        ▼
 Claude a GIGABYTE-on ──► saját git-szerver (Gigabyte, csak Tailscale)
                                │                         │
                   tükör (opció)│                         ▼
                                ▼                 automatikus sor (Gigabyte)
                             GitHub               fordít + gépi próbák (~1 perc)
                                                          │ ha piros: a NAS-hoz nem nyúl
                                                          ▼
                                             NAS: közös kapu → betölt → indít
                                                  (másodpercek, fordítás nélkül)
                                                          │
                                                          ▼
                                     egészség-ellenőrzés → zöld: kész + képernyőkép
                                                         → piros: vissza az előzőre + üzenet
```

### 4.1 Hol dolgozik Claude

| | **A — javaslat: Claude a Gigabyte-on fut** | **B — tartalék: Claude a felhőben marad** |
|---|---|---|
| Hogyan | A Claude Code (a Claude parancssoros változata) közvetlenül a Gigabyte-on fut, nem a Cowork belső dobozában. Te ugyanúgy az alkalmazásból vagy telefonról beszélsz vele, távvezérléssel. | A kód egy postaláda-mappába érkezik a Gigabyte-on. Az alkalmazás fájl-hídja ide akkor is ír, ha a munkaterület hálózata áll. Egy figyelő program a Gigabyte-on átveszi, és a git-szerverre teszi. |
| Előny | közvetlenül eléri a gépeket; saját maga mér és ellenőriz; nincs híd | a felhőbe titok nem kerül; a Gigabyte-on nem fut Claude |
| Hátrány | Claude-nak saját felhasználója van a Gigabyte-on (lásd 6.3) | lassabb visszajelzés; élőben mérni csak kerülővel tud |
| Szabálykönyv | az EGYUTTMUKODES.md és a HANDOFF a tárhelyben van — onnan olvassa | ugyanígy |

**[ellenőrizendő]** Hogy az A változat távvezérlése a te előfizetéseddel, a Linuxos Gigabyte-on így
működik, azt az 1. lépésben ki kell próbálni. Addig semmi nem épül rá. Ha nem megy, marad a B.

### 4.2 A kód otthona

> **ELÉVÜLT, 2026-09-11 este.** A saját git-szerver (Forgejo) **nem lesz a munkapont**. Oka mérve: csak
> Tailscale-en érhető el, tehát a kollégák felhőben futó Claude-ja nem tud belépni — márpedig a cél az,
> hogy hárman, bárhonnan, bármilyen gépről dolgozhassanak. **A kód otthona a GitHub marad** (D-01).
> Házon belüli másolatnak később visszahozható, de nem helyettesíti a GitHubot. Lásd: `docs/EGYENES-UT.md`.

- ~~**Saját git-szerver a Gigabyte-on** (Forgejo). Egyetlen kis program: kódtár + automatikus sor +
  csomagtár egyben. Csak Tailscale-en érhető el.~~
- **GitHub: tükör.** A git-szerver magától frissíti. Ez a kód harmadik, házon kívüli példánya.
  Kell-e: döntés (D-C).
- **Transportlocal:** a te gombos feltöltésed marad, a cég NAS-a maga húzza le a kódot. Nem nyúlunk
  hozzá, csak ha te kéred. A cég NAS-a nem a te géped.

### 4.3 A kirakás lépései — magától, minden projektben ugyanúgy

1. Új változat kerül a fő ágra → elindul a sor. **Egyszerre egy kirakás fut az egész házban.**
2. A Gigabyte lefordít, és lefuttatja a gépi próbákat (határőr, tokenőr, a projekt próbái).
   Ha bármi piros, a NAS-hoz nem nyúl.
3. A kész csomag egy **szűk kulccsal** megy át a NAS-ra. Ezzel a kulccsal csak a „fogadó” program
   futtatható, semmi más (ugyanez a minta 2026-09-10 óta él a Gigabyte fordító-kulcsán).
4. A NAS-on: **közös kapu** (szabad memória, terhelés, egy projekt egyszerre) → betöltés → indítás
   fordítás nélkül → adatbázis-változások.
5. **Egészség-ellenőrzés** a leíróban megadott címen. Zöld: napló és állapotlap. Piros: **automatikus
   visszaállás az előző csomagra** és üzenet. Az utolsó 3 csomag a NAS-on marad, a visszaállás
   másodpercek.
6. Claude képernyőképet készít és elküldi — a „kész” szabályod szerint.

**Következmény a NAS-szabályra:** fordítás nélkül egy kirakás a NAS-nak másodpercek munkája. Így a
„ne rakj ki egymás után” szabály helyett elég lehet ennyi: egyszerre egy, a közös kapun át.
Ez a te döntésed (D-I), magamtól nem változtatom meg.

### 4.4 Élesítés

A tárhelyes oldalaknál (cPanel, később a Hetzner) a sor csak a csomagot készíti el, és leírja a
lépéseket. **Élesíteni te élesítesz** — ez nem változik.

---

## 5. A mentés

### 5.1 Mit mentünk

| Mi | Hol keletkezik | Hogyan megy | Mikor |
|---|---|---|---|
| minden projekt adatbázisa | NAS | éjjel fájlba írjuk (projektenként másodpercek, a közös kapun), azt viszi a pillanatfelvétel | naponta |
| feltöltött fájlok, médiatárak (pl. a marosvásárhelyiek MinIO-ja) | NAS | pillanatfelvétel, csak a megváltozott részek | naponta |
| a projektmappák és a Synology Drive (benne a titoktár — titkosítva, lásd 6.2) | NAS | ugyanígy | naponta |
| a kód (git-szerver), a sor beállításai, a projekt-leírók, a titoktár | Gigabyte | titkosított, csak a változást küldő mentőprogram (restic) | naponta |
| a Dell saját munkái (tanított kiegészítők, jegyzetek) | Dell | ugyanaz a mentőprogram, Windowson | naponta, ha be van kapcsolva — a körét te döntöd el (D-H) |
| **NEM mentjük:** dobozképek, AI-modellek, függőségek, fordítási gyorsítótár | — | újraépül vagy újra letölthető | — |

A méreteket **nem mérem végig** (a NAS-on tilos az ilyen parancs). A DSM kijelzőjéről vagy tőled
kérem, és ebből jön ki, mekkora távoli doboz kell.

### 5.2 Két út, mert két gép termel adatot — mindenki a sajátját küldi

**A NAS útja — pillanatfelvétel-másolás (Synology Snapshot Replication).**
- A NAS helyben pillanatfelvételt készít. Ez azonnali, és szinte semmibe nem kerül.
- A két távoli dobozra **csak a megváltozott blokkok** mennek át. Nincs fájlonkénti végigjárás, ezért
  ez a NAS-kímélő mód. Az a munka, ami 2026-09-06-án megülte a gépet (fotótár végigolvasása), itt
  nem történik.
- **Feltétel:** a távoli doboz is Synology legyen, Btrfs kötettel. **[ellenőrizendő: a NAS kötetei
  Btrfs-ek-e — a jegyzet pillanatfelvételeket említ, ami erre utal]**
- Megosztott mappánként állítható, mi megy át.

**A Gigabyte útja — restic.**
- Titkosít, és csak a változást küldi.
- A távoli dobozon a fogadó **„csak hozzáírható”** módban fut: a Gigabyte írni tud, törölni nem.
  Ha az irodában egy gépet feltörnek, a távoli mentés akkor is megmarad.

### 5.3 Éjszakai menetrend — amikor a NAS a legüresebb

| Idő | Mi | Hol dolgozik |
|---|---|---|
| 02:30 | adatbázisok fájlba, projektenként egymás után, a közös kapun | NAS, másodpercek |
| 03:00 | helyi pillanatfelvétel | NAS, azonnali |
| 03:15 | pillanatfelvétel-másolás az **A** helyre, sávkorláttal | NAS, csak a változás |
| 03:30 | restic az **A** és a **B** helyre | Gigabyte; a NAS-t nem terheli |
| 04:30 | pillanatfelvétel-másolás a **B** helyre — egymás után, nem egyszerre | NAS |
| 06:00 | összesítés: ha minden zöld, csend; ha bármi piros, egy üzenet a telefonodra | Gigabyte |
| vasárnap 10:00 | visszaállítási próba (5.5) | Gigabyte |

A NAS-on futó lépések is a közös kapun mennek, és indulás előtt mérnek: 3 GB szabad memória
alatt vagy 20 fölötti terhelésnél a lépés vár, és ezt jelenti.

### 5.4 Megőrzés

- **Javaslat:** 14 napi, 8 heti, 12 havi változat.
- A távoli dobozon a pillanatfelvételek **14 napra zárolva** (megváltoztathatatlan pillanatfelvétel).
  Egy zsarolóvírus az irodából sem tudja őket törölni. **[ellenőrizendő: a DSM-változat tudja-e]**
- A lejárt változatokat **a gép maga törli**, a szabály szerint. Nem Claude töröl alkalmanként.
  Mivel ez törlés, **a te döntésed** (D-D). Nélküle a lemez előbb-utóbb betelik.

### 5.5 Visszaállítási próba — magától

- **Hetente:** a Gigabyte lehozza a legfrissebb adatbázis-mentést az egyik távoli helyről (felváltva
  A-ról és B-ről). Visszatölti egy ideiglenes adatbázisba **a Gigabyte-on**, összeveti a sorszámokat,
  aztán eldobja. A NAS-hoz nem nyúl. Ez a mostani `visszaallit-proba.sh` általánosítása.
- **Negyedévente:** egy teljes projekt újraépül a Gigabyte-on **kizárólag a távoli mentésből**.
  Ez bizonyítja, hogy egy tűz után is talpra áll.
- Az eredmény az állapotlapra kerül. Ha elbukik: üzenet.

### 5.6 A két távoli hely — amit tudnia kell

- éjjel-nappal megy, szünetmentes tápegységgel
- vezetékes internet (a napi különbség kicsi; a szűk hely az iroda feltöltési sebessége)
- Tailscale; **a routeren semmilyen nyitott port**
- titkosított lemez: ellopva sem olvasható
- kapacitás: a mentett adat kb. 1,5–2-szerese (a régebbi változatok miatt)
- **az első teljes másolat az irodában készül, helyben** (terabájtokat nem töltünk fel interneten),
  aztán viszed a helyére. A Tailscale-címe költözéskor nem változik, a beállításhoz nem kell nyúlni.
- **Iszló ma** napelemes, 4G-s: csak a kis rétegre alkalmas (adatbázisok, kód), a médiatárra nem —
  amíg nincs ott vezetékes net és állandó áram.
- Ha a távoli doboz nem Synology (pl. bérelt gép külföldön), a NAS útja csak fájlszintű mentéssel
  menne. Az jobban terheli a NAS-t, ezért ott csak a kis réteget javaslom.

---

## 6. Biztonság

### 6.1 Hálózat

**Tailscale-szabálylista (ACL)** címkékkel — ki kit érhet el:

| Honnan | Hová | Mire |
|---|---|---|
| a te eszközeid | műhely, üzem | Claude, git, állapotlap, DSM-felület |
| műhely (Gigabyte) | üzem (NAS) | csak a kirakás és a mentés lehozása, a szűk kulcsokkal |
| műhely | AI (Dell) | az AI-port (11434) |
| műhely | széf A, B | a mentés fogadója |
| üzem (NAS) | AI (Dell) | az AI-port |
| üzem | széf A, B | a pillanatfelvétel-másolás |
| **széf A, B** | **senki** | csak fogad |
| AI (Dell) | senki | nem kezdeményez |

- **Router:** kívülről csak a 443 (és a tanúsítványokhoz a 80) a NAS felé. A DSM, a Drive és a
  WebDAV csak Tailscale-en. **[ellenőrizendő:** a jegyzet szerint ma nyitva vannak; bezárás előtt
  megnézzük, mi használja őket. Egy kívülről szinkronizáló Drive Tailscale-en ugyanúgy megy.**]**
- **A szervergépeken a Tailscale-kulcs lejárata kikapcsolva.** Különben időnként leválnak, és ez
  kiszámíthatatlanná teszi a gépezetet. **[ellenőrizendő a fiókodban]**

### 6.2 Titkok

- Egy titoktár a Gigabyte-on, **titkosítva**. Kirakáskor minden gép csak a neki szóló titkot kapja.
- A mostani vault (titkosítatlan fájlok a Synology Drive-on, több gépre szinkronizálva) kivezetése —
  javaslat, a te döntésed (D-F).
- **A mentések jelszavai és a titoktár kulcsa papíron is, két fizikai helyen.** Ha az iroda leég,
  e nélkül a távoli mentés sem nyitható ki. Ez az egyetlen dolog a tervben, amit gép nem végezhet el
  helyetted.

### 6.3 Claude jogai

- Az A változatban Claude a Gigabyte-on a **saját felhasználójával** dolgozik, nem a tiéddel.
- A NAS-hoz két szűk kulcson át ér: **„kirakás”** és **„olvasás”** (a mostani `nas-parancs.sh`
  továbbfejlesztése, a tiltólistával és az időkorláttal együtt).
- A teljes jogú NAS-belépés (D-03) a mindennapi munkához nem kell. Vészhelyzetre maradhat,
  a te engedélyeddel (D-G).
- A távoli mentésekhez **senkinek nincs törlési joga az irodából**, Claude-nak sem.

### 6.4 Frissítések

- A Gigabyte biztonsági frissítései magától mennek.
- A távoli dobozok DSM-je a biztonsági frissítéseket magától telepíti.
- A gépezet programjai (git-szerver, restic) rögzített változaton futnak. Havonta egyszer Claude
  frissíti őket, naplóval, egy projekten kipróbálva.

---

## 7. Kiszámíthatóság és a beavatkozásod minimuma

### 7.1 Egy állapotlap

A Gigabyte-on fut, csak Tailscale-en érhető el. Zöld és piros:
- projektenként: az utolsó kirakás (mikor, sikerült-e)
- mentés A és B: mikor volt az utolsó sikeres
- az utolsó visszaállítási próba eredménye
- a NAS szabad memóriája és terhelése (a könnyű mérés, nem végigszámoló)
- a Gigabyte szabad lemeze
- a távoli dobozok elérhetők-e

### 7.2 Értesítés

Csak ha baj van, vagy te kellesz. A csatorna: a Telegram (Katinka, amit már használsz), vagy egy
saját értesítő a Gigabyte-on — a te döntésed (D-E).

### 7.3 Ki vigyáz a vigyázóra

Ha a Gigabyte reggel 7-ig nem jelentkezik, **az egyik távoli doboz szól**. Így a gépezet leállása
sem marad csendben.

### 7.4 A projekt-leíró

Minden projekt gyökerében egy `projekt.yml`: a neve, mi fut hol, milyen adatbázisa van, mit kell
menteni, mi az egészség-címe, van-e tárhelyes élesítése. **Új projekt = egy új leíró.** A gépezet
ugyanaz marad.

### 7.5 A te teendőid

- **Egyszer:** a döntések (10. fejezet); a távoli dobozok beszerzése és elhelyezése; a papír a
  kulcsokkal; ha kell, a router beállítása; az A változathoz egy telepítés és belépés a Gigabyte-on
  (~10 perc).
- **Rendszeresen:** semmi kötelező. Ha jön üzenet, arra reagálsz. Havonta egy pillantás az állapotlapra.

---

## 8. Fenntarthatóság

**Alkatrészek — ennyi, nem több:** Tailscale · Forgejo és a futtatója · Docker · restic · a Synology
beépített pillanatfelvétele és másolása · egy állapotlap és értesítő. Mind elterjedt, ingyenes,
és egymástól függetlenül cserélhető.

**Minden beállítás egy „gépház” tárhelyben él:** a szkriptek, az időzítések, a Tailscale-szabálylista,
a leírók és az újraépítési útmutató. A mostani közös kapu (`kozos/`) is ide költözik a marosvásárhelyiek
repójából. Ez a dokumentum is ide kerül, és minden projekt AGENTS.md / CLAUDE.md fájlja hivatkozik rá.

**Ha egy gép kiesik:**

| Kiesik | Mi áll | Mi megy tovább | Pótlás |
|---|---|---|---|
| Gigabyte | fejlesztés, kirakás, a Gigabyte mentése | az oldalak; a NAS mentése a távoli helyekre | új gép az útmutatóból, a git-szerver a távoli mentésből — cél: fél nap (nem mérés) |
| NAS | az oldalak | fejlesztés | a távoli pillanatfelvételből; a nagy adat interneten napokig tartana, ezért a dobozt behozni gyorsabb |
| Dell | az AI | minden más | — |
| egy távoli hely | az a mentés | a másik távoli hely | új doboz, első másolat helyben |
| az iroda internete | az oldalak kívülről, a mentés küldése | a helyi munka | a mentés utólag pótol |
| a Tailscale központi szolgáltatása | új kapcsolatok felépítése | a meglévők általában igen | ritka; saját vezérlő (Headscale) lehetséges, de több karbantartás — nem javaslom |

---

## 9. Bevezetés kis lépésekben — terv és becslés

> **Javítás, 2026-09-11 (Vilmos szólt):** az alábbi lista úgy írta le a fordítást és a kirakást, mintha
> új munka lenne — pedig **már kész és mérve**. Ami megvan:
> - a Gigabyte fordít, a kész csomag a NAS-ra megy, a NAS csak betölt és indít (E-46, 65 mp, mérve 2026-09-10);
> - a Gigabyte-nak saját repómásolata van a saját GitHub-kulccsal (`/home/gigabyte/projektek/saas`);
> - `nas/gigabyte-kirak.sh`: egy paranccsal elment, feltölt, fordít (megírva, még nem futott).
>
> **Ami ténylegesen hiányzik az átállításhoz:** (1) Claude maga fusson a Gigabyte-on, ne a Cowork
> belső dobozában — ez a mai leállás oka; (2) a B-01 kirakása a `gigabyte-kirak.sh`-val.
> A saját git-szerver, az automatikus indítás és a visszaállás **opció**, nem feltétel — csak ha Vilmos kéri.

Minden lépés után látsz valamit. Az 1–8. lépéshez nem kell vásárlás, a „mehet” után indulhat.
**A sorrend a tiéd.**

| # | Lépés | Mit látsz a végén | Claude ideje | Tőled |
|---|---|---|---|---|
| 1 | Tailscale-szabálylista; a nyitott portok felmérése és bezárása | a szabálylista; a routeren csak a 443/80 | 1 óra | routerbeállítás, ha kell |
| 2 | Git-szerver a Gigabyte-on; a SaaS átköltöztetése; GitHub-tükör | a SaaS a saját szerveren | 2 óra | — |
| 3 | Claude a Gigabyte-on (A változat) kipróbálása | egy munkamenet, amit a telefonodról vezetsz | 1 óra | telepítés és belépés, ~10 perc |
| 4 | Automatikus kirakás a SaaS-ra, visszaállással és állapottal | egy új változat magától kint van, képernyőképpel | 3 óra | — |
| 5 | A többi projekt ugyanerre az útra, egyenként (marosvásárhelyiek, Forgatag, Misszió, Benevolum) | projektenként egy magától lefutó kirakás | 2–3 óra projektenként | — |
| 6 | Helyi pillanatfelvételek és éjszakai adatbázis-mentés minden projektre | a mentések a NAS-on, naplóval | 2 óra | ha kell, egy kattintás a DSM-ben |
| 7 | Állapotlap, értesítés, a „vigyázó” | a lap; egy próbaüzenet a telefonodon | 3 óra | — |
| 8 | A titoktár átállítása | titkosított titoktár; a régi vault kivezetve | 2 óra | a papír a kulcsokkal |
| 9 | Távoli doboz A: beszerzés, első másolat az irodában, kiszállítás, bekötés | az A hely zöld az állapotlapon | 2 óra | beszerzés, szállítás |
| 10 | Távoli doboz B: ugyanez | a B hely zöld | 2 óra | ugyanez |
| 11 | A Gigabyte mentése mindkét helyre | restic zöld mindkét helyen | 2 óra | — |
| 12 | Első teljes visszaállítási gyakorlat, újraépítési útmutató | egy projekt újraépítve a távoli mentésből | 3 óra | — |

**Összesen kb. 30–35 óra Claude-munka** — becslés, nem mérés. Párhuzamos ágensekkel ennél kevesebb
falióra: a szkripteket DeepSeek-építők írják párhuzamosan, Kimi ellenőriz, a leírókat a Qwen nézi
át a Dellen. A pontos ágens-kiosztást és időt a „mehet” előtt, lépésenként adom meg.
A dobozok beszerzése a te ütemed szerint megy.

---

## 10. Döntések — egyenként kérdezem meg, mindegyiket a következményeivel

| # | Döntés | Mitől függ |
|---|---|---|
| **D-A** | **A két távoli hely:** hol, és milyen doboz | ettől függ a mentés módja és a beszerzés |
| D-B | Claude munkahelye: A (Gigabyte) vagy B (felhő + postaláda) | az 1. lépés próbája után |
| D-C | Kell-e GitHub-tükör | a kód harmadik példánya házon kívül |
| D-D | Megőrzési idők — ez gépi törlési szabály | a távoli dobozok mérete |
| D-E | Értesítés: Telegram vagy saját | — |
| D-F | A mostani vault kivezetése | — |
| D-G | Megszűnjön-e Claude teljes jogú NAS-belépése a mindennapi munkában | — |
| D-H | Mi kerül mentésbe a Dellről és a Macről | a mentés mérete |
| D-I | Fordítás nélküli kirakásnál enyhüljön-e a „ne rakj ki egymás után” szabály | — |

---

## 11. Amit ez a terv nem old meg

- Tűz vagy lopás után a nagy adat visszahozása interneten lassú. A távoli dobozt be kell hozni.
- A TransportLocal NAS a cégé: ugyanez a minta alkalmazható rá, de a mentése a cég döntése.
- A Tailscale központi szolgáltatása egy külső cég.
- Árak és dobozválasztás: a méret és a helyszín eldöntése után (D-A, D-D, D-H).
