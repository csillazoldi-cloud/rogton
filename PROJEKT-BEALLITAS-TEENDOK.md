# SaaS projekt — beállítási teendők

**Projekt:** AI-asszisztált kommunikációs SaaS (munkanév: „Kommunikációs munkatér")
**Terméktulajdonos:** Portik Vilmos / Aitmetica SRL
**Készítette:** Claude Cowork · 1.0 · 2026-09-06
**Alap:** `claudecoworkteljesprojektatado.md` (átadó 1.0)

Ez a dokumentum nem a termék terve. Ez a **munka beállítása**: hol él a projekt, milyen szabályok
szerint dolgozunk, milyen infrastruktúra áll rendelkezésre, és mi hiányzik ahhoz, hogy az átadó
18. fejezetének három eredménye elkészülhessen.

---

## 0. Amit MA élesben megmértem (nem dokumentumból vettem)

| Mérés | Eredmény |
|---|---|
| `E:\AI\SynologyDrive\SaaS` tartalma | **üres** — 0 fájl. Designcsomag, kód, korábbi anyag nincs benne. |
| Géped Linux-munkakörnyezete (Cowork híd) | git 2.34, node 22.23, npm 10.9, python 3.10 — **nincs** docker, php, pnpm |
| Géped munkakörnyezetének erőforrása | 2 mag, 3,8 GB RAM, **a lemeze tele van (40 MB szabad)** |
| Géped → github.com:22 (SSH) | **elérhető** (kulcs nélkül visszautasít, de a port nyitva) |
| Géped → NAS `https://100.111.190.75:8443` | **él** (401 = jelszót kér, tehát fut) |
| Géped → Dell Ollama `http://100.89.253.13:11434` | **él** (200) |
| Felhős konténer (ahol én dolgozom) | node 22, pnpm, docker, psql, php, Chromium; 30 GB szabad, 8 GB RAM |
| Felhős konténer kimenő hálózata | **csak HTTPS proxyn át**; SSH (22-es port) tiltva |
| Felhős konténer → privát GitHub repo | **nem éri el** (nyilvános repót igen). Ez nem megkerülendő, ez adottság. |

**Következtetés a munkamenetre:**

1. A **nehéz munka** (telepítés, build, teszt, Playwright) a **felhős konténerben** vagy a **NAS
   Docker konténerében** fut — a géped Linux-munkakörnyezete kicsi és tele van.
2. A **privát repo és a NAS csak a gépeden keresztül** érhető el. A géped munkakörnyezetéből
   viszont működik az SSH és a Tailscale — tehát ha egy telepítőkulcs a `SaaS` mappában él,
   a `kód → push → NAS deploy` lánc **kézi kattintás nélkül is végigmehet**. Ez lehetőség, nem
   elvégzett dolog; a döntés a tiéd.
3. A géped lemeze tele van — ezt érdemes megnézned, mert ez más Cowork-munkát is lassít.

---

## 1. Hol éljen a projekt — az első döntés

Amíg ez nincs eldöntve, nem lehet repót, dokumentumot, tesztkörnyezetet és deployt beállítani.

Amit el kell dönteni (egy kérdés, több következménnyel):

| Elem | Kérdés | Alapértelmezett javaslatom |
|---|---|---|
| Forráskód otthona | GitHub privát repo, milyen néven, melyik fiók/szervezet alatt | `aitmetica-saas` privát repo |
| Munkamásolat | hol áll a kód, amin dolgozom | NAS Docker konténer (`saas-work`), mint a marosvasarhelyieknél |
| Tesztkörnyezet | hol nézed meg a saját szemeddel | NAS, saját domain/port, Tailscale mögött |
| Deploy | mi viszi ki a kódot a tesztre | `infra/deploy.sh`, egy paranccsal, naplóval |
| Kulcsok | hol áll a telepítőkulcs és a jelszavak | `E:\AI\SynologyDrive\SaaS\vault\` — **soha nem kerül chatbe, gitbe, felhőbe** |

**Fontos:** minden, ami a NAS-on fut, TESZT. Éles rendszer csak külön döntéssel indul.

---

## 2. Rendszerprompt-réteg — mit lásson minden új munkamenet első percben

Cél: egy új munkamenet **egy percen belül** folytatni tudja a munkát, anélkül hogy neked bármit
újra el kellene magyaráznod.

| Réteg | Fájl / hely | Tartalom |
|---|---|---|
| Cowork projekt leírás | a „SaaS" projekt leírás mezője | 5–8 sor: mi ez, hol a repo, mit olvasson el először |
| Belépési pont | repo: `CLAUDE.md` (+ `AGENTS.md` másolat) | 20 sor: mi ez a projekt, hol az összes többi dokumentum, mit tilos |
| Együttműködési szabályok | repo: `EGYUTTMUKODES.md` | a közös munka szabályai (lásd 3. fejezet) |
| Aktuális állás | repo: `HANDOFF.md` | mindig a legfrissebb átadó legfelül |
| Napi feladatsor | repo: `FELADATSOR-<dátum>.md` | mi készül ma, milyen sorrendben |
| Híd nélküli összefoglaló | Claude-memória: `/areas/saas-kommunikacios-munkater.md` | akkor is elérhető, ha a géped nincs csatlakozva |
| Termékátadó | repo: `docs/ATADO-1.0.md` | a mostani átadó változatlanul, hivatkozási alapként |

**Szabály:** ha egy munkamenetnek utána kell néznie olyasminek, amit egy korábbi munkamenet
maga épített, az **könyvelési hiba** — a választ azonnal vissza kell írni a fenti fájlok
valamelyikébe.

---

## 3. Együttműködési szabályok — mi kerül bele SaaS-specifikusan

A meglévő szabálylistád (marosvasarhelyiek `EGYUTTMUKODES.md`) változtatás nélkül átemelendő.
Ehhez jönnek a projekt saját szabályai:

1. **Négy státusz külön tartása** (az átadó 0. fejezetéből), minden dokumentumban és chatben:
   `rögzített követelmény` / `megvalósítási javaslat` / `nyitott döntés` / `prototípus`.
   Javaslatból csak a te szavaddal lesz követelmény.
2. **Minden változás azonosítóra hivatkozik.** Melyik R-01…R-20 követelményt teljesíti, melyik
   A-01…A-16 elfogadási feltételt bizonyítja. Ha egyikre sem: külön indoklás kell.
3. **Döntési napló kötelező.** Minden jelentős műszaki döntés `docs/decisions/ADR-<szám>-<cím>.md`
   fájlba kerül: mi volt a kérdés, mit választottunk, miért, mit vetettünk el.
4. **„Kész" definíciója** (a te szabályod, itt is érvényes): tesztkörnyezetbe kitéve + élő
   képernyőn ellenőrizve + képernyőkép nálad. Semmi más nem „kész".
5. **Vaskalapos szabály a képernyőkre:** rajz (Claude Design) → jóváhagyásod → kód. Ami a
   képernyőn megjelenik, de nincs a rajzon, az hiba. Ami hiányzik a rajzról, arra kérdezek.
6. **Prototípuskódot nem másolunk.** A HTML-prototípus képet és szerződést ad, nem forráskódot.
7. **Külső felülvizsgálati csomag.** Amikor a 15. fejezet szerinti három pont valamelyikéhez érünk,
   automatikusan elkészítem a ChatGPT-nek átadható csomagot (döntés, indok, érintett modulok,
   fájlok, ténylegesen lefuttatott ellenőrzések, nyitott kérdések) — nem neked kell összeszedned.
8. **Amit nem mértem meg, azt nem állítom.** Ha nem tudtam futtatni, azt írom, hogy nem tudtam.

---

## 4. Infrastruktúra-leltár — mit kell felvenni és ellenőrizni

Ez lesz a `docs/INFRA.md`. Ami már tudott, azt beírom; ami kérdőjeles, azt megmérem vagy megkérdezem.

| Elem | Amit tudok | Amit ellenőrizni kell |
|---|---|---|
| Dell Pro Max T2 | Ultra 9 285K, 128 GB RAM, RTX 5000 Ada 32 GB, Win11 Pro; Ollama a 11434-en, ComfyUI is fut | melyik modellek vannak fent; a GPU-sorbaállítás és az idősávok hogyan érvényesek erre a projektre is |
| Synology NAS `transzmozaik` | Docker, n8n, teszt tükrök futnak rajta | van-e hely és erőforrás egy új teszt-veremnek (Postgres + app + worker) |
| MacBook Pro M5 Max | 128 GB, ComfyUI helyben | kell-e szerepe ebben a projektben (valószínűleg nem) |
| Tailscale | a gépeid és a NAS egy hálózaton | új konténerek elérése, ki lát mit |
| GitHub | privát repókat használsz, GitHub Desktoppal tolsz | melyik fiók/szervezet legyen a gazda ennél a projektnél |
| Domainek / hosting | cyber_Folks + cPanel a régi rendszerekhez | kell-e külön domain a SaaS teszthez, és később az éleshez |
| E-mail / SMTP | Mailpit teszt-fogó bevált a másik projektnél | ugyanez legyen itt is a tesztben |
| Fizetős AI-ágensek | DeepSeek, Kimi, OpenAI kulcsok — költségnaplóval | melyik kulcs használható ebben a projektben, van-e havi korlát |
| Helyi AI | Qwen az Ollamában, 100.89.253.13:11434 | mely feladatokra elég (szűrés, osztályozás igen; profiljavaslat valószínűleg nem) |
| Meglévő saját rendszerek | social platform, kétnyelvű médiatár, szervezési/dokumentumrendszer, előkönyvelés, feliratozó | **kódszinten még nincs felmérve** — melyikhez van forráskód-hozzáférésem |
| Titkok | a marosvasarhelyieknél bevált „vault a Drive-mappában" minta | ugyanez a minta ide is, `SaaS\vault\` |

---

## 5. Dokumentumváz — mi készüljön el, valós tartalommal

Üres fájlokat nem hozok létre. Ez a sorrend:

| Fájl | Mikor | Tartalom |
|---|---|---|
| `README.md` | 1. nap | mi ez, hogyan indul, hova nézz |
| `EGYUTTMUKODES.md` | 1. nap | 3. fejezet |
| `docs/ATADO-1.0.md` | 1. nap | a mostani átadó |
| `docs/PROJECT.md` | 1. nap | terjedelem, R-01…R-20, státusz |
| `docs/INFRA.md` | 1. nap | 4. fejezet, mérésekkel |
| `docs/ARCHITECTURE.md` | az 1. szakasz végén | modulhatárok, adatgazdák, függőségi szabályok |
| `docs/decisions/` | folyamatosan | ADR-ek |
| `docs/MODULES.md` | ahogy modul készül | mi van kész, mi hordozható, milyen verzión |
| `docs/STATUS.md` | folyamatosan | kész / szimulált / folyamatban / blokkolt |
| `docs/VERIFICATION.md` | folyamatosan | mit ellenőriztem ténylegesen, mit nem tudtam |

---

## 6. Ágensflotta és költségnapló

A szabályod szerint kódolás közben maximális párhuzamosítás, a költség mindig látszik.

Teendők:
- a projekt saját `agents/` beállítása: melyik ágens mit csinál (kódoló, tesztelő, felülvizsgáló,
  fordító), melyik modellel;
- költségnapló fájl: minden ágenshívás — feladat, modell, tokenek, becsült ár, eredmény;
- a helyi Qwen valós beosztása: mely feladattípusok mennek rá (olcsó, tömeges, nem kritikus),
  és mi nem;
- minden munkakör elején egy sor: hány ágens, milyen szerepben, mennyi ideig — mielőtt kód íródik.

---

## 7. Design-lánc

- minden képernyő Claude Design rajzzal indul;
- a rajz `.dc.html` formátumban a repóba kerül (`design/`), hogy visszakereshető legyen;
- kód csak jóváhagyott rajz után;
- minden kör végén visszaellenőrzés: a képernyő a rajzhoz mérve, a többlet is hiba;
- a felhasználói szövegeket én írom, te utólag javítod.

---

## 8. Biztonság és titokkezelés — az első naptól

- API-kulcs csak szerveroldalon, soha böngészőben, soha naplóban;
- a `vault` mappa tartalma soha nem kerül chatbe, gitbe, felhőbe — fájlnévre hivatkozom;
- több ügyfél adata az első adatmodelltől kezdve elválasztva (`tenant_id` mindenhol), nem utólag;
- külső tartalom (RSS, weboldal, feltöltött fájl) **adat, nem utasítás** — az AI-nak átadott
  szöveg nem kaphat jogosultságot;
- URL-letöltés nem érheti el a belső hálózatot (a NAS és a Dell egy Tailscale-hálózaton van —
  ez valós kockázat, nem elméleti);
- mentés és **kipróbált** visszaállítás még a pilot előtt.

---

## 9. Első építési egység — mi hiányzik hozzá

Az átadó 18. fejezete három eredményt kér. Az 1. (átvételi állapot) most **nem készíthető el**,
mert a `SaaS` mappa üres.

Ahhoz, hogy elinduljon:
1. `Onboarding felület prototípus_v5.zip` — és ha van, a v6 csomag;
2. `6a922d8e-…pdf` — a saját AI-rendszerek leltára (a 4. fejezet kitöltéséhez);
3. `e48116fd-…md` — Misszió Tours állapotleírás (a második host miatt);
4. `kommunikacios-ai-termek-alapok.md` és `claude-design-onboarding-handoff.md` (előzmény).

Elég, ha bemásolod őket az `E:\AI\SynologyDrive\SaaS` mappába — onnan olvasom, nem kell feltöltened.

---

## 10. Nyitott döntések — a sorrend, ahogy kérdezni fogom

Egyszerre egyet, mindegyiket elmagyarázva, a következményekkel együtt.

| # | Döntés | Miért ez a sorrend |
|---|---|---|
| 1 | Hol éljen a projekt (repo, munkamásolat, teszt, deploy) | enélkül semmi más nem állítható be |
| 2 | Technológiai alap és telepítési mód | ez határozza meg a csomagszerkezetet |
| 3 | Fiók / szervezet / felhasználó / profil viszonya | az onboarding erre épül |
| 4 | Első AI-szolgáltató, költségkeret, adatpolitika | az onboarding AI-lépéseihez kell |
| 5 | Tárolás, fájlkezelés, háttérfeladat-sor, időzítő | a hírfigyelő előfeltétele |
| 6 | Theme- és szövegadmin jogosultsága | a 4. szakasz kapuja |
| 7 | Profil- és brandverziók használata futó feladatokban | adatmodell-következménye van |
| 8 | Hírfigyelő első forrástípusai és a második host | az 5–6. szakasz kapuja |
| 9 | Üzemeltetési felelős, mentés, monitoring | a pilotkész kapu feltétele |
| 10 | Első szállítási ütem és ráfordítás | csak a környezet megismerése után |

---

## 11. Amit én tartok fontosnak, és nincs benne az átadóban

1. **A hálózati korlátok írásba.** (0. fejezet.) A másik projektnél sok idő ment el arra, hogy ez
   nem volt rögzítve. Itt a 0. nap része.
2. **Függőségi őr az 1. naptól.** A worklog bukásának valódi ellenszere nem a jó szándék, hanem egy
   automatikus ellenőrzés, ami elbukik, ha egy modul olyat importál, amit nem szabad. Enélkül a
   modulhatárok fél év múlva ugyanúgy összefonódnak.
3. **Szerződés először.** Minden modulhatáron séma (zod) áll, a típusok abból generálódnak. A
   szerződés a repóban verziózva él, nem a fejemben.
4. **Több ügyfeles elválasztás az első táblától.** Utólag beépíteni lényegében újraírás.
5. **Két teszt ügyfél az első adatbetöltésben.** Az A-11 (nem keverednek az adatok) csak így
   bizonyítható folyamatosan, nem a végén egyszer.
6. **Böngészős végigjátszás az első naptól.** A v5-öt nem lehetett böngészőben megnézni — ez most
   ne forduljon elő: a felhős konténerben van böngésző, minden kör végén végigmegy a fő úton.
7. **Költségszámláló minden AI-hívásra.** Nemcsak azért, hogy lásd, mibe kerül a fejlesztés — ez
   lesz később az ügyfélszámlázás alapja is. Utólag beépíteni drága.
8. **Promptok fájlban, verziózva.** Kódba égetett prompt = minden finomítás új deploy.
9. **A márkanév külön döntés.** A munkanév „Kommunikációs munkatér" marad, amíg te mást nem mondasz.
   Az Aitmetica a jogi név, nem automatikusan a termék neve.
10. **Ez a dokumentum él.** Minden döntés után frissül, és a repóba kerül.

---

## 12. Az első három nap javasolt menete

| Lépés | Mi történik | Mikor kész |
|---|---|---|
| 0 | Te: fájlok bemásolása a `SaaS` mappába; te: 1. döntés (hol él a projekt) | ma |
| 1 | Én: átvételi állapot — mi van a csomagban, mi indul el, mi hiányzik | a fájlok után 1–2 óra |
| 2 | Én: repo + dokumentumváz + együttműködési szabályok + infra-leltár, valós tartalommal | a döntés után fél nap |
| 3 | Közösen: 2. döntés (technológia), majd az alapterv és a modulhatárok | utána |
| 4 | Én: első építési egység feladatsora, elfogadási feltételekkel | az alapterv után |


---

## Döntési napló (ebben a dokumentumban, amíg nincs repo)

### D-01 · A projekt otthona — 2026-09-06, Vilmos döntése

**Döntés:** NAS-alapú felállás, a marosvásárhelyiek mintájára.
- forráskód: privát GitHub tárhely,
- munkamásolat: külön munkakonténer a NAS-on (`transzmozaik`),
- tesztkörnyezet: a NAS-on, Tailscale mögött, saját címen,
- deploy: egy script, naplóval.

**Következmény, amivel számolni kell:**
- a NAS-ra új adag kerül: adatbázis (Postgres), alkalmazás, háttérmunkás — helyet és erőforrást igényel,
- a tesztkörnyezet csak akkor él, ha a NAS be van kapcsolva,
- minden, ami a NAS-on fut, TESZT — éles rendszer külön döntés,
- a NAS-hoz és a GitHubhoz szükséges belépések a `SaaS\vault\` mappában állnak, fájlnévre hivatkozom rájuk, tartalmuk soha nem kerül chatbe, gitbe, felhőbe.

**Még hiányzik hozzá:** GitHub-fiók és tárhelynév; NAS-belépés; a tesztcím (aldomain vagy port).

### D-02 · A kész munka feltöltése — 2026-09-06, Vilmos döntése

**Döntés:** a feltöltést Claude végzi magától. Belépőkulcs a `SaaS\vault\` mappában; Claude tölt fel,
a NAS magától leszedi és kiírja a tesztoldalra.

**Következmény:**
- egy kis lépés után azonnal látható az eredmény, Vilmos nem vár senkire,
- Claude írhat a tárhelyre — a kulcs a vaultban marad, tartalma sehova nem kerül,
- minden feltöltés naplózva: mi ment ki, mikor, melyik lépéshez tartozik (`docs/STATUS.md`),
- ha egy feltöltés elrontja a tesztoldalt, a visszaállítás is Claude dolga, azonnal, jelentéssel.

**Még hiányzik hozzá:** a belépőkulcs és a NAS-belépés a `vault` mappában, plusz a GitHub-fiók neve.

### D-03 · Milyen joggal lépek be a NAS-ra — 2026-09-06, Vilmos döntése

**Döntés:** a meglévő, teljes jogú NAS-fiókkal, SSH-n, Tailscale-en (`100.111.190.75`, a 22-es
bejelentkezés nyitva — 2026-09-06-án megmérve).

**Következmény, amit Vilmos vállalt:** nincs műszaki korlát, ami megakadályozna egy hibás parancsot
a NAS bármely részén. Csak a mentés és a munkafegyelem véd.

**Ezért kötelező munkafegyelem ezen a projekten, kivétel nélkül:**
1. **Nem törlök.** Amit el kellene dobni, `_torolni/` mappába kerül a projekten belül, és szólok.
   A tényleges törlés Vilmos kattintása.
2. **A projekt saját területén kívül nem írok.** Más projektek mappáihoz, konténereihez nem nyúlok.
3. **Mentés/pillanatkép minden kockázatos lépés előtt.**
4. **Parancsnapló:** minden NAS-on kiadott parancs fájlba kerül (`docs/NAS-NAPLO.md`),
   Vilmos bármikor elolvashatja.
5. **Egy kis lépés egyszerre**, utána ellenőrzés. Nincs hosszú, átláthatatlan parancssorozat.
6. **Jelszó soha nem jelenik meg kimenetben** — a naplóból is kitakarva.

### D-04 · Belépések ellenőrizve — 2026-09-06

**NAS:** `transzmozaik`, Tailscale-cím **100.89.241.71** (a név is feloldódik: `transzmozaik`).
A megadott fiókkal a belépés **működik**. Kötetek: /volume1 (21 TB, ebből 15 TB szabad), /volume2.
Docker 24.0.2 fut és használható ezzel a fiókkal.

**Saját hiba, rögzítve:** először a 100.111.190.75 címet próbáltam, mert egy másik projekt jegyzetéből
vettem. Az egy MÁSIK Synology, „TransportLocal" néven. Négy sikertelen belépési kísérlet ment rá,
mielőtt megmértem a gép nevét. Tanulság: a címet a géptől kell megkérdezni, nem egy másik projekt
jegyzetéből átvenni.

**Ezen a NAS-on más projektek is futnak** (misszio-*, mvh-*, forgatag-*, benevolum-*). Ezekhez a
SaaS projekt nem nyúl — a D-03 munkafegyelem erre is vonatkozik.

**GitHub:** `git@github.com:Tolgyes/aitmetica-saas.git`. A kulcs a `vault/github-kulcs` fájlban,
a nyilvános fele felkerült a projekthez. Az olvasás **működik**, az azonosítás visszaigazolva.
Az írásjogot az első valódi feltöltés fogja bizonyítani.

### D-05 · A tesztoldal címe és elérhetősége — 2026-09-06, Vilmos döntése

**Cím:** `saas.mediapartizan.ro`. Ma még nem létezik, létre kell hozni.
A többi teszt-cím (`mt.mediapartizan.ro`, `uj.marosvasarhelyiek.ro`) a **81.18.94.4** címre mutat —
ugyanide kell mutatnia ennek is.

**Döntés:** nyilvánosan elérhető, **jelszós kapu nélkül**. Kereső-kitiltás **bekapcsolva**
(robots.txt + noindex fejléc, minden oldalon).

**Kimondott ellenvetés, elfogadva:** ez szembemegy a „a NAS teszt, a külső világ nem tud róla"
szabállyal. Amíg a rendszer üres, nincs tétje; amint valódi ügyféladat, profil vagy arculat kerül
rá, a jelszós kaput újra elő kell venni. Ez a pont a pilotkész kapu (7. szakasz) ellenőrzési
listájára kerül, nem felejthető el.

**Teendő Vilmosnak:** a `saas.mediapartizan.ro` bejegyzés létrehozása a mediapartizan.ro
névkezelőjében, a 81.18.94.4 címre. Utána a NAS-on én állítom be a továbbítást és a tanúsítványt.

### 0. lépés kész — a lánc bizonyítva, 2026-09-06

`https://saas.mediapartizan.ro` él. A lánc minden eleme megmérve:

| Honnan mérve | Eredmény |
|---|---|
| Nyilvános internetről (felhő) | 200, érvényes Let's Encrypt tanúsítvány, HTTP/2 |
| A NAS belső címére irányítva | 200 |
| Kereső-kitiltás | `X-Robots-Tag: noindex, nofollow, noarchive` + robots.txt |
| Portik gépéről | a név még nem oldódott fel — helyi gyorsítótár, magától rendeződik |

Felállás: `/volume2/docker/aitmetica-saas` mappa, `aitmetica-saas-web` doboz (nginx:alpine),
127.0.0.1:8400, a DSM fordított proxy irányítja rá a címet (ezt Vilmos állította be).

**Következő lépés:** a repo feltöltése (ez bizonyítja az írásjogot is), benne a mostani
dokumentumokkal — CLAUDE.md, EGYUTTMUKODES.md, ATADO-1.0.md, a beállítási teendők, a NAS-napló.

### D-06 · A nem biztonságos bejárat zárva marad — 2026-09-06

**Döntés:** a `saas.mediapartizan.ro` csak titkosított kapcsolaton (https) szolgálja ki az oldalt.
A titkosítatlan bejáratra nem teszünk bejegyzést.

**Miért biztonságos így:** azon a bejáraton semmi nem felel a projektből, tehát azon keresztül
tőlünk nem szivároghat ki adat. Ha később mégis kell, ott sem az oldalt szolgáljuk ki, hanem
csak átirányítunk a titkosítottra.

**A valódi nyitott kockázat ettől független:** az oldal jelszó nélkül elérhető (D-05).
Amíg üres, nincs tétje; valódi ügyféladat előtt a jelszós kaput elő kell venni.
Ez a pilotkész kapu ellenőrzési listáján van.

### D-07 · A technológiai alap jóváhagyva — 2026-09-06, Vilmos döntése

**Döntés:** az ADR-001 teljes javaslata elfogadva, négy kérdésben, egyesével:
1. Építőanyag: **Node 24 LTS + Next.js 16 + React 19** (a Node 26 megvárása elvetve).
2. **TypeScript 7** — a kockázat vállalva; ha az első héten akadozik, visszalépés a 6-os ágra.
3. Adatbázis-réteg: **Drizzle** (Prisma elvetve: próbakiadás, ill. egy éven belüli átállás).
4. Megjelenés: **saját tokenrendszer, Tailwind nélkül** — géppel ellenőrzött R-11.

A többi elem (zod 4, BullMQ + Redis, Playwright, pnpm munkaterület, dependency-cruiser)
ezekből következik, jóváhagyottnak számít. A PostgreSQL 18 korábban már megerősítve.

**Következmény:** az E-1 lépés indulhat. Előtte kötelező a `NAS-szabalyok.md` szerinti
ellenőrzés (`free -m`, `uptime`).

### D-08 · Az első felhős AI-szolgáltató — 2026-09-07, Vilmos döntése

**Döntés:** Anthropic (Claude) — a négy lehetőség (DeepSeek, Kimi, OpenAI, Anthropic) közül a D. Havi keret a
tesztre: 5 USD (Claude javaslata, Vilmos nem mondott mást). A kulcs a `vault/anthropic-key.txt` fájlba kerül,
onnan a NAS `.env`-jébe (`ANTHROPIC_API_KEY`); amíg nincs, a teszt-csatlakozó megy (`AI_SZOLGALTATO=teszt`).

**Következmény:** az ügyféladat (weboldal-szöveg, leírás) az Anthropic USA-beli feldolgozásába megy; az
adatpolitikát az ügyfeleknek ki kell mondani (pilotkész kapu, A-13). A másik három szolgáltató később egy
kapcsolóval jön, a mag (ai-adapters) nem változik. Alapmodell: `claude-sonnet-5` (AI_MODELL-lel cserélhető).

### D-09 · Ki szerkesztheti a témát és a szövegeket — 2026-09-07, Vilmos döntése

**Döntés:** a szervezetek tulajdonosai is (a „B" lehetőség) — nem csak a rendszergazda. Tehát: van egy közös,
rendszerszintű alaptéma és alapszövegkészlet (ezt a rendszergazda állítja), és minden szervezet tulajdonosa a saját
felületén felülírhatja a saját szervezete témáját és feliratait; ami nincs felülírva, az a közösből jön.

**Következmény:** a téma és a felirat táblák szervezethez is köthetők (közös sor + szervezeti felülírás), a
Theme-felület a fiókoldalról nyílik a tulajdonosnak, és külön rendszergazdai belépés kell a közös alaphoz.
A v6 csomag `Theme-beallitasok.dc.html` képernyője a Theme-felület mércéje (nem kell új rajz); a feliratok
szerkesztőjéhez nincs prototípus, ahhoz rajz és jóváhagyás kell. Részletek: `docs/NEGYEDIK-SZAKASZ.md`.


### D-10 · A tesztfázis AI-hátterét az előfizetések adják, nem API-kulcs — 2026-09-07, Vilmos döntése

**Döntés:** „mindkettőt" — átmenetileg a saját Claude- ÉS ChatGPT-előfizetése dolgozik a termék mögött a teszten.
A D-08 (Anthropic API-kulcs, 5 USD/hó) nem érvénytelen, csak későbbre tolódik (pilot/éles).

**Ellenőrzött tények (2026-09-07):** az Anthropic súgója szerint (2026-06-15-i állapot) a saját programba épített és
képernyő nélküli használat az előfizetés keretéből fogyaszt — engedett. A Codexnél az OpenAI nem írja le, hogy saját
termékbe építve szabad-e a ChatGPT-csomagos belépés → bizonytalan, csak saját tesztre. Mindkét keret közös a személyes
használattal (a Claude-nál a Coworkkal is).

**Következmény:** új `ai-hid` doboz a NAS-on (Claude Code + Codex, képernyő nélkül, HTTP mögött), két új szolgáltató a
csatlakozóban (`claude-elofizetes`, `codex-elofizetes`), a belépők a `vault`-ból a NAS `titkok/` mappájába
(`kirak.sh --titkok`). Részletek: `docs/D-10-ELOFIZETES.md`.

### D-11 · Az angol az alap- és tartaléknyelv — 2026-09-07 este, Vilmos döntése (az 5. szakasz tervének felülvizsgálatakor)

**Döntés:** angol az alap- és tartaléknyelv, magyar és román teljes támogatással; Vilmos saját felülete magyar marad.
A szabály **központi** (a `design-system` `ALAP_NYELV`-je), modul nem hoz létre sajátot.

**Következmény (K-1, kirakva):** ahol egy szöveg nincs meg magyarul/románul, az angol látszik; új látogatónak nyelv-süti és
böngésző-nyelv nélkül angol a felület; a feliratok-szerkesztőn az „English (eredeti)” oszlop az első; a szerkesztő magyarázatai
átírva (migráció 0026). A csomag mindhárom nyelven teljes, tehát a tartalék csak akkor látszik, ha egy szervezet vagy a közös
szint kitöröl egy fordítást. A próbák magyar felülettel futnak (a segéd adja a nyelv-sütit).

### D-12 · AI a hírfigyelő fejlesztésénél és a teszten — 2026-09-07 este, Vilmos döntése

**Döntés:** a fejlesztés a tesztadapterrel megy; a valódi AI ellenőrzése API-kulccsal (D-08, Anthropic, 5 USD/hó). A modul
lezárásához **sikeres valódi AI-próba kell** — addig nyitott ellenőrzési pont. Az előfizetéses híd (D-10) **nem automatikus
helyettesítő**. Az 5 USD/hó keretet a rendszer ellenőrzi (megvan: `AI_HAVI_KERET_USD`, `ai_koltseg_honap`, `AI_KERET_KIMERULT`),
a keret elfogyását érthetően jelzi a felület.

**Ugyanekkor:** a 30 napos feldolgozási minta LEJÁRATÁT kezelni kell — lejárt mintán a rendszer nem ígér azonos mintás
összehasonlítást, új próbafuttatást kér; a karakterkorlát miatt megvágott anyag jelölt, az AI nem kezelheti teljes cikként.

### D-13 · A kód otthona a GitHub marad, saját git-szerver nem lesz — 2026-09-11, Vilmos döntése

**Mi volt:** reggel jóváhagyott feladat indult arról, hogy a SaaS kódja a Gigabyte-on futó saját
git-szerverre (Forgejo) költözzön, és a GitHub csak másolat legyen
(`_atmenet/2026-09-11-gigabyte/docs/FELADAT-SAJAT-KODTAROLO.md`, `GEPHAZ-ELMELET.md` 4.2).

**A kérés, ami felülírta:** hárman dolgozzanak a projekten, mindenki a saját Claude-előfizetésével,
bárhonnan, bármilyen gépről vagy telefonról.

**Mérve 2026-09-11-én:** a GitHub egy felhőben futó munkamenetből elérhető (`api.github.com` → 200,
`git ls-remote` HTTPS-en működik). A Gigabyte-on futó git-szerver csak Tailscale-en érhető el, oda
felhős munkamenet nem tud belépni.

**Döntés:** a kód otthona a **privát GitHub-tárhely** marad (D-01 változatlan). A saját git-szerver
feladata **elhalasztva**; ha később kell házon belüli másolat, az a GitHub tükre lesz, nem a
helyettesítője. A Forgejo-feladat lapja a `_torolni/` mappába került.

**Ami helyette megvalósult:** a Gigabyte robotként figyeli a fő ágat, fordít, és a kész dobozt viszi a
NAS-ra; az éjszakai mentés egy fájlba megy a SynologyDrive-ba. Leírás: `docs/EGYENES-UT.md`.
