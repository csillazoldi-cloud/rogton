# Megvalósítható alapterv

Claude Cowork · 2026-09-06 · az átadó 18. fejezet 2. pontja

Státuszjelölés végig: **[R]** rögzített követelmény · **[J]** megvalósítási javaslat ·
**[N]** nyitott döntés. Javaslatból csak Vilmos szavával lesz követelmény.

---

## 1. Technológiai választás

Az átadó 5.1 iránya: TypeScript, React/Next.js, PostgreSQL, külön háttérfeldolgozó, egy tárhely.
Ez az irány megmarad. Az alábbi verziókat **ma, a hivatalos csomagjegyzékből mértem le**
(npm registry, nodejs.org, endoflife.date), nem egy régi projektből másoltam.

| Elem | Mért aktuális | Választás | Indok |
|---|---|---|---|
| Node | 24.20.0 LTS (Krypton), támogatás 2028-04-30-ig; a 26 csak 2026-10-28-tól LTS | **Node 24 LTS** [J] | a 26 még nem LTS; a 24 két évig biztosan támogatott |
| Next.js | 16.3.4 | **Next.js 16** [J] | az átadó iránya; egy keretben a felület és a kiszolgálóoldal |
| React | 19.2.8 | **React 19** [J] | a Next 16 ezzel megy |
| TypeScript | 7.0.2 (új, Go-alapú fordító) | **TypeScript 7** [J], **kockázattal jelölve** | ez a stabil kiadás; cserébe friss, néhány kiegészítő eszköz még nem biztos, hogy felzárkózott — az első héten ellenőrizzük, és ha akadozik, 6-os ágra lépünk vissza |
| PostgreSQL | 18.6 (támogatás 2030-11-ig), 17.11 (2029-11-ig) | **PostgreSQL 18** [J] | új projekt, leghosszabb támogatás; ha a NAS-on gond van vele, 17 a tartalék |
| Adatbázis-réteg | Drizzle 0.45.2 stabil; Prisma 8 még kiadásjelölt | **Drizzle** [J] | kiadásjelöltre nem építünk alapot; a Drizzle közel áll az SQL-hez, ami a több ügyfeles elválasztásnál előny |
| Séma és ellenőrzés | zod 4.5.4 | **zod 4** [J] | egy helyen írjuk le a szerződést, a típus abból generálódik |
| Háttérfeladatok | BullMQ 6.3.4 + Redis | **BullMQ** [J] | a hírfigyelő és a hosszú AI-munkák miatt kell; a NAS-on már fut Redis más projektnél, itt sajátot kap |
| Böngészős teszt | Playwright 1.63 | **Playwright** [J] | a fő út végigjátszása minden kör végén |
| Megjelenés | — | **saját tokenrendszer, Tailwind nélkül** [J] | az R-11 azt írja, hogy semmilyen szín/betű/lekerekítés nem éghet a komponensbe. Ezt akkor lehet géppel ellenőrizni, ha minden érték egyetlen tokenkészletből jön. A Tailwind ezt megengedné, de nehezebb kikényszeríteni. |
| Csomagkezelő | pnpm | **pnpm munkaterület** [J] | egy tárhely, több csomag, verziózott belső függőségekkel |
| Határőr | dependency-cruiser | **kötelező, az első naptól** [J] | ez a worklog-bukás valódi ellenszere: gép bukjon el, ha egy modul olyat használ, amit nem szabad |

**Amit NEM választunk** és miért: nincs mikroservice-háló (nincs rá méret), nincs Vercel-függés
(a mag bárhol fusson), nincs egyedi CMS a termékmagban, nincs kiadásjelölt csomag az alapban.

---

## 2. Modulhatárok

Az átadó 5.2 táblázata a kiindulás. Nem hozzuk létre mind az első napon — a határokat írjuk le
előre, a csomagot valós feladat mentén állítjuk ki.

| Csomag | Mit csinál | Mit NEM használhat |
|---|---|---|
| `contracts` | sémák, azonosítók, hibakódok, események | React, Next, adatbázis |
| `profile-core` | ügyfélprofil, arculati verziók, jóváhagyás szabályai | képernyők, hírfigyelő |
| `onboarding-core` | a három lépés folyamata, piszkozat, AI-javaslat kezelése | konkrét adatbázis |
| `onboarding-ui` | a képernyők | saját API-kulcs, közvetlen adatbázis |
| `design-system` | komponensek, tokenek, állapotok | ügyfél arculata |
| `ai-adapters` | szolgáltatók, hívások, hibák, költségmérés | ügyfélspecifikus logika |
| `news-monitor-core` | gyűjtés, szűrés, relevancia, találatok | a webalkalmazás útvonalai |
| `host-adapters` | tárolás, azonosítás, ütemezés bekötése | más modul belső fájljai |
| `apps/web` | a befogadó alkalmazás | — |
| `apps/worker` | háttérfeladatok | böngésző |
| `apps/reference-host` | a második, minimális befogadó | a teljes SaaS behúzása |

**Szabály [R]:** más modul belső fájlját importálni tilos, más modul tábláját szerződés nélkül
írni tilos. Ezt nem ígéret védi, hanem automatikus ellenőrzés minden feltöltés előtt.

---

## 3. Ki tárolja mit — adatgazdák

| Adat | Gazdája | Ki olvassa |
|---|---|---|
| Fiók, felhasználó, jogosultság | `apps/web` adatbázisa | minden modul a hosttól kéri |
| **Hiteles ügyfélprofil** | `apps/web` adatbázisa (R-05) | a modulok csak olvassák |
| Onboarding-piszkozat | `apps/web` adatbázisa, a fiókhoz kötve | csak az onboarding |
| Arculati verziók | `apps/web`, teljes pillanatképként (R-08 szerinti verziózás) | a tartalomgyártó modulok |
| Téma (SaaS megjelenés) | `apps/web`, verziózva | a design-system |
| Felületi szövegek | `apps/web`, stabil kulcsokkal (R-09) | minden képernyő |
| AI-promptok | fájlban, verziózva a tárhelyen | `ai-adapters` |
| Hírfigyelő beállítás és találatok | a modul saját táblái, ügyfélkulccsal | csak a modul |

**Az onboarding nem a profil végleges szerkesztője** (R-06). Piszkozatot ír, a jóváhagyáskor
átadja a hostnak, és onnantól a host fiókoldalán szerkeszthető.

---

## 4. Fiók, szervezet, felhasználó — javaslat

Ez az átadó 17. pontjának 3. nyitott kérdése. A javaslatom:

- **Szervezet** (ügyfél) a fizetési és adatgazdai egység. Minden adat ehhez tartozik.
- **Felhasználó** e-mail + jelszó vagy céges belépés; egy felhasználó több szervezethez tartozhat.
- **Szerepek** az első kiadásban: tulajdonos, szerkesztő, néző. Több nem kell.
- **Az onboarding-piszkozat a szervezethez tartozik**, nem a böngészőhöz. Ezért:
  fiók létrehozása → szervezet létrehozása → onboarding indul → piszkozat mentése minden lépésnél
  → jóváhagyás → a profil a szervezethez kerül.
- Aki e-mail nélkül akar körülnézni: „kipróbálás" mód, amiből a jóváhagyás előtt fiókot kell nyitni.
  A piszkozat ekkor a böngészőben él, és **ezt a felület ki is mondja** — nem nevezzük mentettnek. [J]

**Több ügyfeles elválasztás [R]:** minden tábla első oszlopa a szervezet azonosítója, és az
adatbázis maga is ellenőrzi (sorszintű védelem). Nem a program jóindulatán múlik. Az első
adatbetöltésben **két teszt szervezet** lesz, hogy az A-11 feltétel (nem keverednek az adatok)
folyamatosan bizonyítható legyen, ne csak a végén egyszer.

---

## 5. AI-réteg

- Feladattípusonként szerződés (összefoglalás, profiljavaslat, hangnem, arculatelemzés,
  relevancia, ötlet). A hívó a feladatot kéri, nem egy konkrét modellt.
- Minden szolgáltató egy leírólapot ad magáról: mit tud, milyen nyelven, mennyibe kerül, hol fut.
- **Minden hívás költsége mérve és tárolva** [J] — ez most a fejlesztési költséget mutatja,
  később az ügyfélszámlázás alapja lesz. Utólag beépíteni drága.
- Időkorlát, leállítás, újrapróbálás, hibakód. A modell válasza **javaslat, nem jogosultság** (R).
- Helyi modell (Qwen a Dellen) a tömeges, olcsó, nem kritikus feladatokra: nyelvfelismerés,
  előszűrés, osztályozás. A profiljavaslathoz felhős modell kell — ezt mérni fogjuk, nem hinni.
- **Helyi modell kiesésekor nincs csendes átváltás felhőre** (R). Aki helyi adatkezelést kért,
  annál a feladat inkább álljon meg, mint hogy adat menjen ki.

**Nyitott [N]:** melyik legyen az első felhős szolgáltató, milyen kerettel, és mi az adatpolitika.
Ezt akkor kérdezem, amikor az onboarding AI-lépése épül — nem előbb.

---

## 6. Tárolás, háttérfeladat, időzítő

- Feltöltött fájl (logó, arculati kézikönyv, minta): S3-kompatibilis tároló. A NAS-on erre már
  fut MinIO más projektnél; itt saját példányt kap. [J]
- Háttérsor: BullMQ + Redis. Minden feladat ismételhető anélkül, hogy kétszer csinálná meg
  ugyanazt (A-10).
- Időzítő: a soron belül, nem a rendszer óráján — így egy újraindítás nem hagy ki futást.

---

## 7. Megjelenés, szövegek, nyelvek

- **Egyetlen tokenkészlet**, a v6 prototípus `tema-alap.json` szerkezetéből indulva.
  Komponensben nincs szín, betű, méret, lekerekítés — ezt gép ellenőrzi.
- **A prototípusból nem másolunk kódot** (R). A `km-theme.js` ellenőrzési logikáját viszont
  átemeljük szerződésként: ma megmértem, hogy helyesen működik.
- Szövegek stabil kulccsal, adatbázisban, adminfelületről szerkeszthetően (R-09).
  **A felirat átírása nem változtathat jogosultságot** (R).
- HU / RO / EN az első naptól (R-14). A hibaüzenetek a kiszolgálóoldalról **kódként** jönnek,
  a szöveget a felület adja — magyar végfelhasználói üzenet nem íródik a kiszolgálóba.

---

## 8. Fenyegetési vázlat

| Kockázat | Válasz |
|---|---|
| Egyik ügyfél adata a másiknál | szervezetazonosító minden táblán + adatbázis-szintű ellenőrzés + két teszt szervezet az első naptól |
| Külső oldal szövege utasításnak látszik | a forrás mindig adat; az AI kimenetét program ellenőrzi, mielőtt bármit tenne |
| URL-letöltés a belső hálózat felé | a NAS és a Dell egy hálózaton van — a letöltő csak nyilvános címeket érhet el, átirányítás után is ellenőrizve, mérettel és időkorláttal |
| Feltöltött fájl | típus- és méretellenőrzés, elkülönített feldolgozás, aktív tartalom kiszűrése |
| Kulcsok | csak kiszolgálóoldalon; böngészőbe és naplóba soha |
| Kétszer lefutó háttérfeladat | minden feladatnak egyedi kulcsa van, ismétléskor nem keletkezik új rekord |
| Mentés | adat és fájl mentése, és **kipróbált** visszaállítás még a pilot előtt |

---

## 9. Mit bizonyít melyik elfogadási feltétel

| Szakasz | Amit bizonyít |
|---|---|
| Közös alap | A-11 (nem keverednek az adatok), A-07 (téma minden komponensre hat) |
| Onboarding | A-01…A-06 (végigvihető, mentés, hibautak, nyelvek) |
| Brand és Theme | A-08, A-09 (verziók, hibás betöltés) |
| Hírfigyelő | A-10, A-14 (ismétlésbiztonság, külső tartalom) |
| Hordozhatóság | A-12 (ugyanaz a csomag két helyen) |
| Pilotkész | A-13, A-15, A-16 (adatpolitika, visszaállítás, valós ellenőrzés) |

---

## 10. Ami tényleg Vilmos döntése — és mikor kérdezem

Nem most, hanem akkor, amikor az adott darab épül:

1. Első felhős AI-szolgáltató, keret és adatpolitika — az onboarding AI-lépésénél.
2. Ki szerkesztheti a témát és a szövegeket — a Theme-admin építésénél.
3. A hírfigyelő első forrástípusai és a második befogadó rendszer — az 5. szakasz elején.
4. Üzemeltetési felelős, mentés, monitorozás — a pilotkész kapunál.

Minden más az átadóból és ebből a tervből következik.
