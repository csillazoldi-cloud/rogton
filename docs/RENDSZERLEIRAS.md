# Kommunikációs munkatér — teljes rendszerleírás

**Termék:** AI-központú kommunikációs SaaS és újrahasználható moduljai
**Terméktulajdonos:** Portik Vilmos, Aitmetica SRL (Marosvásárhely)
**Dokumentum:** 1.0 · 2026-09-08 · a 6. szakasz lezárása utáni állapot
**Kinek szól:** projektmenedzsernek, fejlesztőnek és üzemeltetőnek. A tesztelő külön kézikönyvet kap: `docs/TESZTELESI-UTMUTATO.md`.

> **Ez a dokumentum azt írja le, ami MA MŰKÖDIK ÉS MÉRVE VAN.** Ahol tervről vagy szándékról van szó,
> az külön jelölve van: **[terv]**. Ahol egy szám szerepel, azt a 2026-09-08-i állapoton mértem
> (forráskód, adatbázis, illetve az élő tesztoldal). A rendszer **tesztkörnyezetben fut, nem éles**.

---

## Tartalom

1. [Miért van a termék és mit old meg](#1-miért-van-a-termék-és-mit-old-meg)
2. [Mi készült el — a szakaszok állása](#2-mi-készült-el--a-szakaszok-állása)
3. [Funkciók részletesen](#3-funkciók-részletesen)
4. [Architektúra](#4-architektúra)
5. [Technológiai készlet és miért az](#5-technológiai-készlet-és-miért-az)
6. [Adatmodell](#6-adatmodell)
7. [AI-réteg](#7-ai-réteg)
8. [Megjelenés (téma) és nyelvek](#8-megjelenés-téma-és-nyelvek)
9. [A hírfigyelő modul és a hordozhatóság](#9-a-hírfigyelő-modul-és-a-hordozhatóság)
10. [Biztonság](#10-biztonság)
11. [Környezetek, kirakás, üzemeltetés](#11-környezetek-kirakás-üzemeltetés)
12. [Minőségbiztosítás: mi véd mitől](#12-minőségbiztosítás-mi-véd-mitől)
13. [Használat — a fő útvonalak](#13-használat--a-fő-útvonalak)
14. [Amit a rendszer MA NEM tud](#14-amit-a-rendszer-ma-nem-tud)
15. [Kockázatok és nyitott döntések](#15-kockázatok-és-nyitott-döntések)
16. [Szótár](#16-szótár)

---

## 1. Miért van a termék és mit old meg

### 1.1 Az üzleti kiindulás

Az Aitmetica SRL (korábban Mediapartizan SRL) mintegy 12 éves marosvásárhelyi kommunikációs
vállalkozás, magyarul és románul dolgozik. Az elhagyandó modell az **alacsony marzsú, emberi
munkaórákkal arányosan növekvő ügynökségi munka**: minden új ügyfél új óraszámot jelent.

A termék célja, hogy az **ügyfél saját marketingesének képességeit növelje** — és idővel kiváltsa
azt, amit ma külsősként az ügynökség csinál (a tartalom formába öntése, elkészítése, néha ötletadás).

### 1.2 Mi a termék

**Egy több ügyfél számára személyre szabható, AI-központú kommunikációs munkakörnyezet.**
Nem posztgenerátor, nem egyetlen iparágra szabott alkalmazás. Napelemes vállalkozás, utazási iroda,
CNC-műhely vagy sportoló-influenszer **ugyanazokat a közös modulokat** használja, eltérő profillal.

A rendszer szíve a **közös ügyfélprofil**: mit csinál a cég, kinek, milyen céllal, milyen nyelven,
milyen hangnemben, milyen arculattal. Ezt egyszer veszi fel az ügyfél (onboarding), a központi
alkalmazás tárolja hitelesen, és **minden modul innen kapja** — nem kérdezi meg újra.

### 1.3 A legfontosabb tanulság, ami az egész architektúrát alakítja

Egy korábbi PHP-alapú worklog/workspace projekt előzetes modulhatárok nélkül nőtt sok fájlos,
összefonódó rendszerré. Amikor egy funkciót ki kellett venni belőle és más alkalmazásba építeni,
az **lényegében újraírást** jelentett.

Ezért ebben a rendszerben a modulhatárokat **nem ígéret védi, hanem gép**: minden feltöltés előtt
lefut egy határőr (`pnpm hatar`), és ha egy csomag olyat használ, amit nem szabad, a folyamat elbukik.
A hordozhatóságot pedig nem elmélet bizonyítja, hanem **két valóban működő befogadó rendszer**
(lásd 9. fejezet).

### 1.4 A 20 rögzített követelmény

Az átadó (`docs/ATADO-1.0.md`) R-01…R-20 követelményjegyzéke a szerződés. A legfontosabbak:

| ID | Követelmény | Hol valósul meg |
|---|---|---|
| R-01 | Több ügyfélnek értékesíthető, iparágfüggetlen; ügyfélsajátosság konfigurációban | szervezetenkénti profil + beállítás, nulla ügyfélspecifikus kódág |
| R-04 | Cserélhető felhős AI-szolgáltatók és helyi LLM | `@km/ai-adapters`: 5 szolgáltató, feladat alapú szerződés (7. fejezet) |
| R-05 | A közös profil a befogadó alkalmazás adatbázisában él és ott szerkeszthető | `szervezet_profil` tábla + `/fiok` oldal |
| R-07 | Önállóan használható, minimális bekötéssel átvihető, verziózott modulok | `@km/news-monitor-core` 0.2.0 két hostban (9. fejezet) |
| R-09 | Minden felhasználói szöveg központilag szerkeszthető és lokalizálható | felirat-rendszer két szinten, 3 nyelven (8. fejezet) |
| R-11 | Nincs komponensbe égetett szín, betű, lekerekítés | tokenrendszer + `pnpm tokenor` gépi ellenőrzés |
| R-14 | HU / RO / EN az első naptól | minden felület és hibaüzenet |
| R-16 | Kézi javítás védelme; AI nem írhat felül csendben emberi adatot | `*_forras` mezők (`sajat` / `ai`), verziózás |
| R-17 | Forrás, következtetés, hiány, jóváhagyás és módosító követhető | eredetjelölés, jóváhagyó + időpont, verziótörténet |

---

## 2. Mi készült el — a szakaszok állása

A munka hét szakaszra bomlik. Az állapotlap élőben: **https://saas.mediapartizan.ro/allapot/**

| # | Szakasz | Állapot | Mit bizonyít |
|---|---|---|---|
| 1 | Átvétel | **100%** | a v6 designcsomag mérve, nem papírból elfogadva |
| 2 | Alapterv | **100%** | technológiaválasztás mért verziókkal, modulhatárok, fenyegetési vázlat |
| 3 | Közös alap | **100%** | fiók, szervezet, adatbázis, sorszintű elválasztás (A-11) |
| 4 | Onboarding | **100%** | a három lépés végigvihető, mentéssel, hibautakkal, 3 nyelven (A-01…A-06) |
| 5 | Brand és Theme | **100%** | arculat- és témaverziók, hibás betöltés nem ront el működőt (A-07…A-09) |
| 6 | Hírfigyelő | **100%** | valódi RSS → értékelt találatok, ismétlésbiztosan (A-10, A-14) |
| 7 | Hordozhatóság | **100%** | ugyanaz a mag két rendszerben, mindkettő él (A-12) |
| 8 | Pilotkész | **15%** | *folyamatban* — E-34 (belépési védelem) kész; hátra: adatpolitika, mentés-visszaállítás, terhelés, lektorálás, jegyzőkönyv |

**Összesített készültség: 89%.**

### 2.1 A 16 elfogadási feltétel állása

| ID | Feltétel | Állapot |
|---|---|---|
| A-01 | Üres profilból URL nélkül is végigvihető az onboarding | ✅ bizonyítva |
| A-02 | AI-javaslat és kézi javítás elkülönül; újragenerálás nem veszít adatot | ✅ bizonyítva |
| A-03 | AI-kiesés és forráshiba külön látszik; kézi folytatás működik | ✅ bizonyítva |
| A-04 | Mentési hiba nem mutat sikert; visszatéréskor visszatöltődik a piszkozat | ✅ bizonyítva |
| A-05 | Jóváhagyott profil a host profilfelületén szerkeszthető | ✅ bizonyítva |
| A-06 | HU/RO/EN felület és hibák; nyelvváltás megőrzi a munkát | ✅ bizonyítva |
| A-07 | Témaváltás minden komponensre hat; brandkreatívra nem | ✅ bizonyítva |
| A-08 | Brandmódosítás új tervezet; a korábbi jóváhagyott pillanatkép változatlan | ✅ bizonyítva |
| A-09 | Hibás téma-import nem rontja el a működő konfigurációt | ✅ bizonyítva |
| A-10 | Ismételt vagy párhuzamos hírfigyelő-futás nem készít ellenőrizetlen duplikátumot | ✅ bizonyítva |
| A-11 | Két külön ügyfél adatai nem keverednek | ✅ bizonyítva (gépi próba: `/api/belso/elvalasztas`) |
| A-12 | Azonos csomag két hostban, ügyfélspecifikus kód és másolás nélkül | ✅ bizonyítva (6. szakasz zárása) |
| A-13 | Helyi-only adatpolitika esetén nincs automatikus felhős továbbítás | ⚠️ **részben** — a helyi modell kiesésekor nincs csendes átváltás, de az adatpolitika mint termékfunkció nincs kész (7. szakasz) |
| A-14 | Külső tartalom nem indíthat jogosulatlan műveletet | ✅ bizonyítva (SSRF-védelem, jelölt ADAT-blokkok) |
| A-15 | Mentésből helyreállítás ténylegesen kipróbált | ❌ **nincs** — a 7. szakasz feladata |
| A-16 | Az állított vizuális/nyelvi ellenőrzések ténylegesen elvégzettek | ⚠️ **részben** — a gépi ellenőrzések futnak, a román/angol szöveg nyelvi lektorálása hiányzik |

### 2.2 Mennyi kód van

| Egység | Kód (sor) | Próba (sor) |
|---|---:|---:|
| `apps/web` — a befogadó alkalmazás | 10 222 | 5 365 |
| `apps/referencia-host` — a második befogadó | 1 951 | 646 |
| `packages/news-monitor-core` — a hírfigyelő magja | 1 777 | 2 933 |
| `packages/ai-adapters` | 611 | 109 |
| `packages/design-system` | 525 | — |
| `packages/letolto` | 431 | 302 |
| `packages/contracts` | 307 | — |
| `apps/proba-host` — bekötési minta | 315 | 54 |
| `packages/profile-core` | 130 | — |
| `packages/onboarding-core` | 72 | — |
| `packages/news-monitor-promptok` | 57 | 45 |
| `packages/news-monitor-feliratok` | 52 | 44 |
| **Összesen** | **~16 450** | **~9 500** |

**Automatikus próbák száma: 421** (186 webalkalmazás + 166 mag + 32 referencia-host + 19 letöltő
+ 5 feliratok + 5 promptok + 5 AI-adapterek + 3 próba-host).

---

## 3. Funkciók részletesen

### 3.1 Fiók és szervezet

| Funkció | Mit csinál |
|---|---|
| Regisztráció | név + e-mail + jelszó (legalább 10 karakter). Foglalt e-mailre `EMAIL_FOGLALT` |
| Belépés | e-mail + jelszó; siker esetén 30 napos munkamenet-süti |
| Kilépés | a munkamenet törlődik az adatbázisból, a süti lejár |
| Szervezet létrehozása | a belépett fiók tulajdonosként hozza létre; minden adat ehhez kötődik |
| Szerepek | **tulajdonos**, **szerkesztő**, **néző**. A néző csak nézhet |
| Rendszergazda | a `RENDSZERGAZDA_EMAIL` címre belépéskor egyszer felkerül a jelölés; utána a fiókon marad |

Egy felhasználó **több szervezethez** is tartozhat (`tagsag` tábla). Az aktuális szervezet a
munkamenethez tartozik.

### 3.2 Onboarding — három lépés

A prototípus (v6) a specifikáció. A folyamat **megszakítható és folytatható**: minden lépés
piszkozatot ment az adatbázisba (nem a böngészőbe).

**1. lépés — Bemutatkozás.** Név, és **vagy** weboldalcím, **vagy** néhány mondatos leírás.
Az AI ebből javítható tevékenység-összefoglalót készít. Weboldal esetén a rendszer letölti és
szöveget nyer ki belőle (SSRF-védelemmel — 10.4).

**2. lépés — Kommunikációs alapok.** Célközönség, kommunikációs cél, tartalomnyelvek, hangnem
leírása és egy rövid hangnemminta. Bármelyik mező **„későbbre hagyható"** — ez rögzített állapot,
nem üres mező.

**3. lépés — Ellenőrzés és jóváhagyás.** Összefoglaló minden mezőről, mellette **eredetjelölés**
(`sajat` = a felhasználó írta, `ai` = az AI javasolta), helyben szerkeszthető, majd jóváhagyás.
A jóváhagyás időbélyeget és jóváhagyót rögzít.

**Kötelező állapotviselkedés (mind bizonyítva):**

- az automatikus mentés **piszkozatot** ment, nem jóváhagyást;
- mentés/kilépés és jóváhagyás **megvárja a tárolási eredményt** — hibánál nincs hamis sikeroldal;
- AI-kieséskor **kézi összefoglalóval folytatható**;
- újragenerálás **külön javaslatot** hoz, a kézi javítás nem tűnik el;
- a **nyelvváltás nem ír át profiladatot** és nem indít új onboardingot;
- a forrásfeldolgozási hiba (`FORRAS_NEM_ELERHETO`) és az AI-szolgáltatói hiba (`AI_NEM_ELERHETO`)
  **külön hibakód**.

### 3.3 Ügyfélprofil (a hiteles adat)

Az onboarding **nem** a profil végleges szerkesztője. A jóváhagyás után a profil a `szervezet_profil`
táblába kerül, és a `/fiok` oldalon szerkeszthető tovább. Mezői:

`nev`, `osszefoglalo`, `celkozonseg`, `cel`, `nyelvek`, `hangnem_leiras`, `hangnem_minta`,
`hangnem_nyelv` — mindegyik mellett `*_forras` (`sajat` / `ai`), továbbá `kesobbre` lista,
`jovahagyva` időpont és `jovahagyta` fiókazonosító.

### 3.4 Arculat (brandprofil)

Külön tartomány a SaaS témájától (R-13). Négy állapot, egymást kizárva:
**nincs megadva / tervezet / későbbre hagyva / jóváhagyott**.

Adatai: elsődleges, másodlagos és háttérszín; cím- és törzsbetű; képvilág; követendő és kerülendő
példák; lekerekítés; nyelv; eredet (`ai` / `sajat`); módosítva jelző.

**A jóváhagyás mindig egy konkrét, változatlan verzióhoz tartozik.** Módosításkor új tervezet
keletkezik, és a korábbi jóváhagyott **teljes adatpillanatkép** megmarad (nem csak a verziószám).
Ez az A-08 feltétel.

### 3.5 Theme — a SaaS megjelenése

Adminfelület (`/tema`), ahol minden megjelenési érték **elnevezett tokenből** jön: színek, betűk,
vastagságok, méretek, sorköz, térköz, keret, lekerekítés, árnyék, üveghatás, mozgás.
**46 token** az alaptémában.

Munkafolyamat: **tervezet → élő előnézet → mentés → külön alkalmazás**. Két szint van:
**közös** (a teljes rendszerre) és **szervezeti** (egy ügyfélre). Verziózva, visszaállítható.
Hibás import **nem** ír felül működő tervezetet vagy alkalmazott témát (A-09).

A rendszer olvashatósági (kontraszt-) visszajelzést ad, és a támogatott színformátumokat
(hex, rgb, rgba, hsl, hsla) a színválasztó és a kontrasztellenőrzés egyaránt kezeli.

### 3.6 Feliratok — minden szöveg szerkeszthető

Minden látható szöveg — cím, mezőcímke, gomb, hiba, példa, hozzáférhetőségi felirat —
**stabil azonosítójú központi tartalomból** jön, három nyelven. Adminfelület: `/feliratok`.

Két szint, mint a témánál: **közös** felülírás és **szervezeti** felülírás, verziózva,
visszaállíthatóan. A csomag alapja a `felirat` tábla (a kódból jövő szövegek).

**Rögzített szabály: a felirat átírása nem változtathat jogosultságot.** A felirat csak szöveg.

**Az alap- és tartaléknyelv az angol** (D-11 döntés): ha egy kulcs hiányzik a kért nyelven,
az angol jön, nem a magyar.

### 3.7 Hírfigyelő — az első szakmai modul

Lásd részletesen a 9. fejezetben. Röviden: az ügyfél által kijelölt RSS-forrásokból és
weboldalakból gyűjt, kiszűri az ismétléseket, a jóváhagyott profil alapján értékel,
forrással ellátott összefoglalót és igény esetén tartalomötletet készít.

Felületei: `/hirfigyelo` (találatok), `/hirfigyelo/beallitas` (mit, honnan, mikor),
`/hirfigyelo/finomhangolas` (visszajelzés → AI-szabályjavaslat → kipróbálás → elfogadás).

---

## 4. Architektúra

### 4.1 A nagy kép

```
                    ┌──────────────────────────────────────────────┐
   böngésző  ──────►│  apps/web  —  Next.js 16 + React 19          │
                    │  fiók · szervezet · profil · onboarding      │
                    │  arculat · téma · feliratok · hírfigyelő-UI  │
                    └───────┬──────────────────────────┬───────────┘
                            │                          │
                   ┌────────▼────────┐        ┌────────▼─────────┐
                   │  PostgreSQL 18  │        │  AI-szolgáltató  │
                   │  sorszintű      │        │  (teszt/Claude/  │
                   │  védelemmel     │        │   Ollama/híd)    │
                   └─────────────────┘        └──────────────────┘

   KÖZÖS CSOMAGOK (mindkét befogadó rendszer ugyanezeket használja)
   ┌──────────────────────────────────────────────────────────────┐
   │ contracts · design-system · ai-adapters · letolto            │
   │ news-monitor-core 0.2.0 · -feliratok · -promptok             │
   │ profile-core · onboarding-core                               │
   └──────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────────────────┐
   böngésző  ──────►│  apps/referencia-host  —  sima node:http     │
                    │  node:sqlite fájl · saját ütemező · HTML     │
                    └──────────────────────────────────────────────┘
```

### 4.2 Csomaghatárok — ki mit használhat

| Csomag | Mit csinál | Mit NEM használhat |
|---|---|---|
| `@km/contracts` | közös sémák, azonosítók, hibakódok | React, Next, adatbázis |
| `@km/profile-core` | ügyfélprofil, arculati verziók, jóváhagyás szabályai | képernyők, hírfigyelő |
| `@km/onboarding-core` | a három lépés folyamata, piszkozat, AI-javaslat kezelése | konkrét adatbázis |
| `@km/design-system` | tokenek, téma-séma, CSS-változók | ügyfél arculata |
| `@km/ai-adapters` | szolgáltatók, hívások, hibák, költségmérés | ügyfélspecifikus logika |
| `@km/news-monitor-core` | gyűjtés, szűrés, relevancia, találatok | a webalkalmazás útvonalai, adatbázis |
| `@km/letolto` | letöltés SSRF-védelemmel, RSS/Atom, robots.txt | keretrendszer, `server-only` |
| `@km/news-monitor-feliratok` | a modul 189 felirata × 3 nyelv | keretrendszer, adatbázis, a mag |
| `@km/news-monitor-promptok` | a 6 AI-rendszerutasítás | keretrendszer, adatbázis, host |
| `apps/web` | a befogadó alkalmazás | — |
| `apps/referencia-host` | a második, minimális befogadó | `apps/web` |

**Ezt nem ígéret védi.** A `.dependency-cruiser.cjs` **16 szabályt** tart karban; a `pnpm hatar`
minden feltöltés előtt lefut, és a rossz importra elbukik. A mai állás: **249 modul, 0 sértés.**

A legfontosabb szabályok:

- `news-monitor-core-csak-contracts-es-zod` — a mag semmi mást nem használhat;
- `alkalmazas-a-hirfigyelot-csak-a-bejaratan-at` — az alkalmazás nem nyúlhat a mag belsejébe;
- `a-masodik-host-nem-nyul-a-webalkalmazasba` — a referencia-host nem importálhat `apps/web`-ből;
- `a-kozos-letolto-host-semleges`, `a-modul-feliratai-host-semlegesek`, `a-modul-promptjai-host-semlegesek`;
- `csomag-nem-import-alkalmazast`, `app-nem-import-app`, `nincs-kor`.

### 4.3 A mag függősége

`@km/news-monitor-core` teljes függőségi listája: **`@km/contracts` és `zod`.** Semmi más.
Nincs benne HTTP-ügyfél, adatbázis-illesztő, keretrendszer vagy fájlrendszer-hozzáférés.
**Ez teszi hordozhatóvá.**

---

## 5. Technológiai készlet és miért az

A verziókat 2026-09-06-án a hivatalos csomagjegyzékből mértük, nem régi projektből másoltuk.

| Elem | Verzió | Miért ez |
|---|---|---|
| Node | **24 LTS** (24.20.0) | támogatás 2028-04-30-ig; a 26 még nem volt LTS |
| Next.js | **16.3.4** | egy keretben a felület és a kiszolgálóoldal |
| React | **19** | a Next 16 ezzel megy |
| TypeScript | **7.0.2** (Go-alapú fordító) | a stabil kiadás; kockázattal jelölve — friss |
| PostgreSQL | **18** | új projekt, leghosszabb támogatás (2030-11) |
| Adatbázis-réteg | **Drizzle 0.45.2** | közel áll az SQL-hez, ami a több ügyfeles elválasztásnál előny; a Prisma 8 még kiadásjelölt volt |
| Séma és ellenőrzés | **zod 4.5.4** | egy helyen írjuk le a szerződést, a típus abból generálódik |
| Megjelenés | **saját tokenrendszer, Tailwind nélkül** | az R-11 gépi kikényszerítéséhez minden érték egy tokenkészletből kell jöjjön |
| Csomagkezelő | **pnpm munkaterület** | egy tárhely, több csomag, verziózott belső függőségekkel |
| Határőr | **dependency-cruiser** | a worklog-bukás valódi ellenszere |
| Böngészős teszt | **Playwright** | a fő út végigjátszása |

**Szigorú TypeScript-beállítások:** `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
`verbatimModuleSyntax`. Ezek nem kényelmesek, viszont a „véletlenül `undefined`" hibaosztályt
fordításkor megfogják.

**Amit NEM választottunk és miért:** nincs mikroservice-háló (nincs rá méret), nincs Vercel-függés
(a mag bárhol fusson), nincs egyedi CMS a termékmagban, nincs kiadásjelölt csomag az alapban.

### 5.1 Eltérés az eredeti tervtől — és miért

| Alapterv | Ami lett | Indok |
|---|---|---|
| BullMQ + Redis háttérsor | **Postgres-alapú várólista** (`hf_sor` tábla) + futtató az alkalmazás folyamatában | a NAS-on nincs memória egy Redis-doboznak; a mérhető terhelés (napi néhány tucat feladat) ezt nem indokolja |
| `apps/worker` külön doboz | nincs — a futtató az app-dobozban él | ugyanaz az ok; a sor tartós (adatbázisban), tehát újraindítás nem veszít feladatot |
| S3 / MinIO fájltároló | **nincs** — fájlfeltöltés még nem épült | a mai funkciók nem igényelnek fájlfeltöltést; a 7. szakasz kérdése |
| `host-adapters` csomag | nincs külön csomag — a csatlakozók a hostban élnek | a szerződés (`Kornyezet`) elég absztrakció volt; egy üres közvetítő réteg csak zajt adott volna |

---

## 6. Adatmodell

**27 tábla, 36 migráció.** A migrációk sorszámozva, egyszer futnak le, nyilvántartva
(`_migracio` tábla).

### 6.1 Táblák csoportosítva

**Fiók és szervezet**

| Tábla | Mit tárol |
|---|---|
| `fiok` | e-mail, jelszó-lenyomat (argon2), név, rendszergazda-jelölés, felület nyelve |
| `munkamenet` | a süti tokenjének SHA-256 lenyomata + lejárat (a token maga nincs tárolva) |
| `belepesi_kiserlet` | E-34: minden belépési/regisztrációs kísérlet — sebességkorlát **és** hozzáférésnapló |
| `jelszo_visszaallitas` | E-34: egyszer használatos, lejáró visszaállító jegyek (csak lenyomatként) |
| `szervezet` | az ügyfél — minden adat ehhez tartozik |
| `tagsag` | ki milyen szerepben tartozik melyik szervezethez |
| `felhasznalo` | korai tábla a séma első köréből |

**Profil és onboarding**

| Tábla | Mit tárol |
|---|---|
| `onboarding_piszkozat` | a félbehagyott onboarding, fiókhoz és szervezethez kötve |
| `szervezet_profil` | a **hiteles** ügyfélprofil + az arculat verziói |

**Megjelenés és szövegek**

| Tábla | Mit tárol |
|---|---|
| `tema` | az alaptéma tokenjei |
| `szervezet_tema` | szervezeti témaverziók (tervezet / alkalmazott) |
| `felirat` | a kódból jövő szövegek kulcsonként, 3 nyelven |
| `kozos_felirat_verzio` | közös felülírások verziózva |
| `szervezet_felirat_verzio` | szervezeti felülírások verziózva |

**AI**

| Tábla | Mit tárol |
|---|---|
| `ai_hivas` | minden AI-hívás: feladat, szolgáltató, modell, tokenek, becsült költség, siker/hiba |
| `ai_koltseg_honap` | havi összesített költség és hívásszám (a keret ebből dolgozik) |

**Hírfigyelő (11 tábla, `hf_` előtaggal)**

| Tábla | Mit tárol |
|---|---|
| `hf_beallitas_verzio` | a figyelési beállítás verziói (aktív / korábbi), eredettel |
| `hf_tervezet` | a még nem mentett beállítás-tervezet, fiókonként |
| `hf_forras` | RSS/weboldal források, állapottal (`hasznalhato`, `korlatozott`, `hibas`, …) |
| `hf_futas` | egy figyelési futás: kezdet, vég, állapot, új találatok száma |
| `hf_kivonat` | a letöltött cikkek szövege és ujjlenyomata, 30 napos megőrzéssel |
| `hf_esemeny` | az esemény (több cikk = egy esemény a deduplikálás után) |
| `hf_talalat` | az értékelt találat: fontosság, témacímke, összefoglaló, indoklás |
| `hf_visszajelzes` | „releváns / nem releváns" + saját indok |
| `hf_javaslat` | az AI szabálymódosítási javaslata + a felhasználó döntése |
| `hf_minta` | a javaslat kipróbálásának eredménye (lejárattal) |
| `hf_sor` | a háttér-várólista: fajta, állapot, kísérlet, eredmény |

### 6.2 A több ügyfeles elválasztás

**Minden ügyféladat-táblán ott van a `szervezet_id`, és az adatbázis maga is ellenőrzi.**
18 táblán van bekapcsolva a **sorszintű védelem (RLS)**, `szervezet_id = current_setting('app.szervezet_id')`
szabállyal.

Két adatbázis-szerep van:

- **`km_tulaj`** — a táblák gazdája. **Csak migrációhoz** használjuk.
- **`km_app`** — az alkalmazás szerepe: `NOSUPERUSER NOCREATEDB NOCREATEROLE **NOBYPASSRLS**`.
  Nem tulajdonos, és **nem kerülheti meg a sorszintű védelmet**.

Az alkalmazás minden ügyféladat-műveletet a `szervezetKent(...)` burkolón át végez: tranzakciót nyit,
beállítja az `app.szervezet_id` értéket, és abban dolgozik. **Beállítás nélkül a `km_app` semmit nem lát.**

Ahol az RLS miatt rendszerszintű adat kellene (a napi ütemezés lekérdezése), ott `SECURITY DEFINER`
függvény van: `hf_napi_utemezesek()`.

**Ez folyamatosan bizonyítható**, nem csak a végén egyszer: két teszt szervezet van az első
adatbetöltésben, és a `/api/belso/elvalasztas` végpont gépileg leméri, hogy nem keverednek —
válasza `"eredmeny": "RENDBEN"`.

---

## 7. AI-réteg

### 7.1 Az alapelv

**A hívó feladatot kér, nem modellt.** A kód azt mondja, hogy „relevanciaértékelés",
és nem azt, hogy „claude-sonnet-5". Melyik modell válaszol, az konfiguráció.

### 7.2 Az öt szolgáltató

| Azonosító | Mi ez | Hol fut |
|---|---|---|
| `teszt` | determinisztikus teszt-csatlakozó, AI és hálózat nélkül | helyben — **ez az alapértelmezés** |
| `anthropic` | Claude, API-kulccsal | felhő |
| `helyi-ollama` | a Dell munkaállomás Ollama-ja, Qwen modellel (`qwen3.8:27b`) | házi hálózat |
| `claude-elofizetes` | a Claude Code program képernyő nélkül, az `ai-hid` dobozon át | NAS |
| `codex-elofizetes` | a Codex program képernyő nélkül, az `ai-hid` dobozon át | NAS |

Minden szolgáltató **leírólapot** ad magáról: mit tud, milyen nyelven, mennyibe kerül, hol fut.

### 7.3 Költségkeret és mérés

**Minden hívás költsége mérve és tárolva** (`ai_hivas` tábla: tokenek be/ki, becsült USD, időtartam,
siker vagy hibakód). A havi összeg az `ai_koltseg_honap` táblában gyűlik.

**Minden hívás ELŐTT** lefut a keretellenőrzés: ha a hónap becsült költsége eléri az
`AI_HAVI_KERET_USD` értéket (alapérték: 5 USD), a hívás `AI_KERET_KIMERULT` hibával elutasításra
kerül. Ez ma a fejlesztési költséget mutatja, később az ügyfélszámlázás alapja lesz.

### 7.4 Promptok

A hírfigyelő 6 rendszerutasítása a **közös** `@km/news-monitor-promptok` csomagban van
(E-31 óta) — **a webalkalmazás és a referencia-host szó szerint ugyanazt küldi**:

`hf_relevancia`, `hf_ugyanaz_az_esemeny`, `hf_osszkep`, `hf_szabaly_javaslat`,
`hf_tartalomotlet`, `hf_beallitas_javaslat`.

**A válasz nyelve a felület nyelve.** Ehhez egy mért felfedezés kellett: a modell a **magyarul
megfogalmazott** „írj románul" utasítást figyelmen kívül hagyta a prompt elején, közepén és
végén is — a **célnyelven** megfogalmazott mondat viszont működött. Ezért a nyelvfüggő promptot
a rendszer a célnyelvi mondattal keretezi elöl és hátul.

### 7.5 Amit az AI NEM tehet

- **A modell válasza javaslat, nem jogosultság.** Minden AI-kimenetet program ellenőriz
  (zod-séma) tárolás vagy végrehajtás előtt.
- A külső forrás szövege **adat, nem rendszerutasítás**: jelölt `<<ADAT …>> … <<ADAT VÉGE>>`
  blokkokban megy a modellnek.
- **Helyi modell kiesésekor nincs csendes átváltás felhőre.** Aki helyi adatkezelést kért,
  annál a feladat inkább álljon meg.
- Minden hívásnak van időkorlátja (a helyi modellnél 180 mp, mert a hidegindítás mérve ~30–41 mp).

---

## 8. Megjelenés (téma) és nyelvek

### 8.1 A tokenrendszer

**46 token** írja le a teljes megjelenést: `--bg`, `--text`, `--primary`, `--accent`,
`--font-display`, `--font-body`, `--fs-base`, `--r-card`, `--r-btn`, `--pad-card`, `--gap`,
`--motion` és így tovább. A komponensek **kizárólag** ezekre hivatkoznak.

**Gépi ellenőrzés:** a `pnpm tokenor` végigméri a forrást, és elbukik, ha bárhol beégetett szín,
betűcsalád, méret vagy lekerekítés van a design-systemen kívül. Mai állás: **187 fájl, 0 sértés.**
Indokolt kivétel csak jelöléssel lehetséges: `/* tokenőr: ok — <indok> */`.

Ez az R-11 gépi kikényszerítése: nem elég megígérni, hogy nincs beégetett szín.

### 8.2 Nyelvek

**HU / RO / EN** az első naptól. Az **alap- és tartaléknyelv az angol** (D-11).

Három nyelvfogalom külön él (R-15):

| Fogalom | Mi ez | Hol állítható |
|---|---|---|
| **Felület nyelve** | amilyen nyelven a képernyő beszél | nyelvválasztó; sütiben és belépett fióknál a fiókon is |
| **Kommunikációs nyelvek** | amilyen nyelveken az ügyfél kommunikál | profil |
| **Egy anyag nyelve** | egy konkrét szöveg nyelve | az adott anyagnál |

**A kiszolgálóoldal hibakódot ad, nem szöveget.** Magyar végfelhasználói üzenet nem íródik
a kiszolgálóba — a szöveget mindig a felület adja a felirat-rendszerből. Ez teszi lehetővé,
hogy egy negyedik nyelv fordítás legyen, ne kódmódosítás.

---

## 9. A hírfigyelő modul és a hordozhatóság

### 9.1 A folyamat

```
források (RSS / weboldal)
        │  @km/letolto — SSRF-védelem, robots.txt, RSS/Atom, CDATA
        ▼
    kivonatok  (cím + szöveg + ujjlenyomat, 30 napig megőrizve)
        │  deduplikálás: azonos ujjlenyomat VAGY (címhasonlóság ≥ 0,5 ÉS 72 órán belül)
        │  → a gyanús párokat az AI dönti el (hf_ugyanaz_az_esemeny)
        ▼
    események  (több cikk = egy esemény)
        │  relevanciaértékelés a jóváhagyott profil + a beállítás alapján (hf_relevancia)
        ▼
    találatok  (fontosság, témacímke, összefoglaló, „miért fontos neked?")
        │
        ▼
    kártyák a felületen  +  igény esetén tartalomötlet
```

### 9.2 A beállítás

Mit figyelünk: **célok** (`sajat_marka` / `szakmai` / `tartalomotlet`), **témák** (név,
névváltozatok, megkülönböztetés), **földrajzi fókusz**, **nyelvek**, **kizárások**.
Mikor: **kézi** vagy **napi** (óra, perc, időzóna).

A beállítás **verziózott**: minden mentés új verziót hoz létre, eredettel
(`kezi` / `ai_elokeszites` / `ai_javaslat` / `visszaallitas`), és bármelyik korábbi visszaállítható.

### 9.3 A finomhangolási kör

1. A felhasználó **visszajelzést** ad egy találatra: releváns / nem releváns + saját indok.
2. Az AI ebből **szabálymódosítási javaslatot** készít (`hf_szabaly_javaslat`), indoklással,
   várható hatással és azzal, hogy mi alapján javasolja.
3. A javaslat **kipróbálható** a meglévő találatokon (`hf_minta`), mielőtt bármi változna.
4. A felhasználó **elfogadja vagy elveti**. Elfogadásnál új beállításverzió keletkezik.

Ez az R-16 gyakorlati megvalósítása: **az AI javaslata nem lép életbe magától.**

### 9.4 Biztonsági fékek a futásban

| Fék | Érték | Miért |
|---|---|---|
| `HF_NAPI_CIKK` | 60 cikk/nap/szervezet | költségkorlát |
| `HF_PAR_KORLAT` | 60 AI-összehasonlítás futásonként | egy elszabadult dedup ne égesse el a keretet |
| `hatarido` | 14 perc (a sor 15 perces lejárata előtt egy perccel) | a futás magától fejezze be és **mentse, amit elért** |
| `KIVONAT_MAX_HOSSZ` | 8 000 karakter | a modell bemenetének korlátja |
| `KIVONAT_MEGORZES_NAP` | 30 nap | a régi kivonatok törlődnek |

Ha egy fék közbelép, a futás állapota `reszleges` — a felhasználó látja, hogy nem teljes.

### 9.5 A hordozhatóság bizonyítéka (A-12)

**Ugyanaz a `@km/news-monitor-core` 0.2.0 csomag két különböző rendszerben fut.**

| | `apps/web` | `apps/referencia-host` |
|---|---|---|
| keret | Next.js 16 + React 19 | nincs — sima `node:http` |
| tárolás | PostgreSQL, sorszintű védelemmel | egy SQLite-fájl (`node:sqlite`) |
| profil | adatbázisból, onboardingból | egy `profil.json`-ból |
| ütemezés | Postgres-várólista + futtató | saját, kis SQLite-sor |
| felület | React-kártyák | kiszolgálón összerakott HTML |
| memória | 512 MB doboz (57 MB használt) | **256 MB doboz (132 MB használt)** |
| cím | https://saas.mediapartizan.ro/ | https://saas.mediapartizan.ro/referencia/ |

**Mérve:** a két host `.ts` fájljai közül **azonos tartalmú: 0 darab**. Nincs másolás.
A referencia-host a tár-interfész **mind a 21 metódusát** megvalósítja SQLite-on.

**A verziófrissítési próba:** a mag 0.1.0 → 0.2.0 egy szerződés-kompatibilis változással
(`Kartya.esemeny_ideje`, új és választható mező). **Egyik host kódját sem kellett hozzányúlni**,
mindkettő próbái zöldek maradtak.

**A négy csatlakozó**, amit a hostnak adnia kell: **profil, tárolás, AI, ütemezés.**
Ezt egy harmadik rendszerhez a `docs/HIRFIGYELO-BEKOTES.md` (285 sor) írja le lépésről lépésre.

---

## 10. Biztonság

> A rendszer **tesztkörnyezetben** fut. Ez a fejezet azt írja le, mi van megépítve —
> nem tanúsítványt állít. Éles, több ügyfeles indulás előtt **független biztonsági
> szakértői vizsgálat kell**; ez a 7. szakasz feladata.

### 10.1 Ügyfélelkülönítés

- Minden ügyféladat-táblán `szervezet_id`; **18 táblán sorszintű védelem (RLS)**.
- Az alkalmazás szerepe (`km_app`) **`NOBYPASSRLS`** — nem kerülheti meg a védelmet.
- Minden művelet a `szervezetKent(...)` burkolón át, tranzakcióban.
- Gépi bizonyíték: `/api/belso/elvalasztas` + két teszt szervezet az első naptól.
- Idegen szervezet adatára a válasz `NINCS_JOG` (403) vagy „nincs ilyen" (404) — **nem** részleges adat.

### 10.2 Jelszó és munkamenet

| Mit | Hogyan |
|---|---|
| Jelszó tárolása | **argon2** (`@node-rs/argon2`) — nem MD5, nem SHA |
| Jelszó-szabály | legalább 10 karakter (`GYENGE_JELSZO`) |
| Munkamenet-token | 32 bájt véletlen, base64url |
| A token tárolása | **csak SHA-256 lenyomatként** — az adatbázisból ellopott sorral nem lehet belépni |
| Süti | `HttpOnly`, `SameSite=Lax`, éles módban `Secure`; élettartam **30 nap** |
| Lejárt munkamenet | nem enged be, és **az adott sor törlődik** a lekérdezéskor. Általános takarító feladat nincs: a más fiókok lejárt sorai a táblában maradnak, amíg valaki azzal a tokennel nem próbálkozik (ellenőrizve a forráson, 2026-09-08) |
| Hibás belépés | mindig `ROSSZ_BELEPES` — nem árulja el, létezik-e az e-mail |

### 10.3 AI-végrehajtás

- A modell válasza **javaslat, nem jogosultság**; minden kimenetet zod-séma ellenőriz.
- A külső szöveg **jelölt ADAT-blokkban** megy a modellnek — forrás mint adat, nem utasítás.
- Az AI által javasolt szabálymódosítás **csak felhasználói jóváhagyással** lép életbe.
- Költségkeret minden hívás előtt.

### 10.4 URL-feldolgozás (SSRF-védelem)

A `@km/letolto` csomag védelmei, mind próbával fedve (**19 próba**):

| Védelem | Részlet |
|---|---|
| Protokoll | csak `http:` és `https:` — `ftp:`, `file:`, `javascript:` elutasítva |
| Magáncímek | 0/8, 10/8, 100.64/10, 127/8, 169.254/16 (felhő-metaadat), 172.16/12, 192.168/16 + IPv6-megfelelők |
| **DNS-visszakötés** | a feloldott cím is ellenőrizve, nem csak a név |
| Átirányítás | legfeljebb **3**, minden lépésnél újraellenőrizve |
| Méretkorlát | a letöltés bájtban korlátozva |
| Időkorlát | alapban 10 mp (robots.txt: 5 mp) |
| robots.txt | ellenőrizve; tiltás esetén `robots_tiltja` |

### 10.5 Külső tartalom megjelenítése

A hírek szövege idegen forrás, HTML-t tartalmazhat. Minden megjelenített adat (cím, összefoglaló,
forráscím, témanév) escape-elve megy ki. A referencia-host lapjai emellett
`content-security-policy: default-src 'none'` fejlécet küldenek, és **nincs bennük script**.

### 10.6 Titkok

| Titok | Hol van |
|---|---|
| Adatbázis-jelszavak | a NAS `.env` fájljában — **nincs a tárhelyen** |
| GitHub-kulcs, NAS-belépés, AI-kulcsok | Vilmos gépén a `vault/` mappában |
| Előfizetéses AI-belépők | a NAS `titkok/` mappájában (700/600 jogosultsággal), csak az `ai-hid` doboz látja |

**Szabály:** a vault tartalma soha nem kerül chatbe, kódba, GitHubra vagy felhőbe.
API-kulcs csak kiszolgálóoldalon; böngészőcsomagba és naplóba soha.

### 10.7 Hálózati kitettség

- A NAS-on **egyetlen** kifelé nyíló port van: `127.0.0.1:8400` (az nginx doboz).
- Az adatbázis, az alkalmazás, a referencia-host és az AI-híd **csak belül** érhető el.
- Kifelé: `X-Robots-Tag: noindex, nofollow, noarchive`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, érvényes Let's Encrypt tanúsítvány, HTTP/2.

### 10.8 Háttérmunkák

- A várólista tartós (adatbázisban), tehát **újraindítás nem veszít feladatot**.
- Párhuzamos indítás: `FUT_MAR` (409) — nem indul két futás.
- Ismételt futás **nem hoz létre duplikátumot** (A-10): a deduplikálás a kivonat ujjlenyomatán alapul.
- Beragadt tétel: 15 perc után `hiba` állapotba kerül; a futásnak 14 perces határideje van,
  hogy ne fusson gazdátlanul tovább.

### 10.9 Belépési védelem (E-34, 2026-09-09)

D-17 döntése szerint a regisztráció **nyitva marad**, ezért a sebességkorlát nem kényelmi funkció,
hanem a fő védelem.

| Védelem | Hogyan |
|---|---|
| **Fiók szerinti korlát** | 5 sikertelen belépés / 15 perc egy e-mailre. A zár alatt **a helyes jelszó sem megy át** |
| **Cím szerinti korlát** | 20 sikertelen belépés / 15 perc; regisztráció 20 / óra |
| **A számláló nullázása** | a sikeres belépés után a korlát csak az utolsó siker ÓTA nézi a sikerteleneket — **naplósort nem törlünk** |
| **Hozzáférésnapló** | a `belepesi_kiserlet` tábla minden kísérletet megőriz (fajta, e-mail, cím, siker, idő), 30 napig |
| **Jelszó-visszaállítás** | a rendszergazda ad ki egyszer használatos, 1 óra alatt lejáró jegyet; a jegy csak SHA-256 lenyomatként tárolódik; az új jelszó a fiók **összes** munkamenetét érvényteleníti |
| **HSTS** | `Strict-Transport-Security: max-age=86400` (szándékosan rövid, mert teszt környezet) |
| **Óránkénti takarítás** | lejárt munkamenetek, felhasznált jegyek, 30 napnál régebbi naplósorok |

**A kérő címének megállapítása — mérve, nem feltételezve.** A rendszer két fordított proxy mögött ül
(Synology DSM → a saját nginxünk), és az nginx `$proxy_add_x_forwarded_for`-t használ, ami **hozzáfűz**:
a lista eleje ezért olyan érték, amit maga a kérő is beírhatott. Ezért **jobbról** számolunk
(`MEGBIZHATO_PROXY_DB`, alapérték 2).

Élő mérés (2026-09-09, `https://saas.mediapartizan.ro/api/belso/cim`):

| Amit küldtem | Amit a kiszolgáló látott | Amire jutott |
|---|---|---|
| semmi | `86.120.238.206, 172.23.0.1` | `86.120.238.206` — **a valódi címem**, független forrással egyeztetve |
| `x-forwarded-for: 1.2.3.4` | `1.2.3.4, 86.120.238.206, 172.23.0.1` | `86.120.238.206` — a hamisítás nem nyert |
| három hamis elem | `9.9.9.9, 8.8.8.8, 7.7.7.7, 86.120.238.206, 172.23.0.1` | `86.120.238.206` |
| `x-real-ip: 5.5.5.5` | a DSM felülírja | `86.120.238.206` |

**Amit tudatosan vállalunk:** a cím szerinti korlát a **második** védelmi vonal — a FIÓK szerinti az,
ami hamisítással eleve nem kerülhető meg (az e-mail a kérés törzséből jön). A fiókzár mellékhatása,
hogy aki ismer egy e-mailt, 5 rossz jelszóval 15 percre kizárhatja onnan a gazdáját is; ez minden
fiókzár velejárója, a zár rövid, és a rendszergazda tud visszaállító jegyet adni.

### 10.10 Ismert biztonsági hiányok (nyitott)

| Hiány | Következmény | Hova tartozik |
|---|---|---|
| **A tesztoldal jelszós kapu nélkül nyilvános** | bárki, aki a címet ismeri, regisztrálhat — **D-17 tudatos döntése**, sebességkorláttal fedezve | 7. szakasz, ha a pilot előtt szűkíteni kell |
| Nincs mentés-visszaállítás kipróbálva | A-15 nem teljesül | 7. szakasz (E-35) |
| Nincs független biztonsági szakértői vizsgálat | éles indulás előtt kötelező | 7. szakasz |
| Nincs önkiszolgáló (e-mailes) jelszó-visszaállítás | a rendszergazdának kell linket adnia | 7. szakasz, ha lesz SMTP-fiók |
| Nincs riasztás a hozzáférésnaplóra | a napló megvan, de senki nem figyeli | 7. szakasz (E-40) |
| Fájlfeltöltés nincs megépítve | — (nincs is támadási felület) | későbbi funkció |

## 11. Környezetek, kirakás, üzemeltetés

### 11.1 A gépek

| Gép | Szerep |
|---|---|
| **Felhős munkakörnyezet** | itt készül a kód, itt futnak a próbák és a helyi összerakás |
| **Vilmos gépe** (Linux-munkakörnyezet) | innen megy a `git push` és a kirakás; ez éri el a vaultot és a NAS-t |
| **Synology NAS `transzmozaik`** | a tesztkörnyezet gazdája (`/volume2/docker/aitmetica-saas`) |
| **Dell Pro Max T2** | a helyi AI (Ollama, Qwen) — a NAS a házi hálózaton éri el |
| **GitHub** | a forrás (`Tolgyes/aitmetica-saas`) |

### 11.2 A dobozok a tesztkörnyezetben

| Doboz | Mi ez | Port | Memóriakorlát |
|---|---|---|---|
| `aitmetica-saas-db` | PostgreSQL 18 (ICU `hu-HU`) | csak belül, 5432 | 384 MB |
| `aitmetica-saas-app` | a Next.js alkalmazás | csak belül, 3000 | 512 MB |
| `aitmetica-saas-referencia` | a **második** befogadó rendszer | csak belül, 8600 | 256 MB |
| `aitmetica-saas-web` | nginx — **az egyetlen kifelé nyíló port** | `127.0.0.1:8400` | 64 MB |
| `aitmetica-saas-ai-hid` | az előfizetéses AI-programok képernyő nélkül | csak belül, 8500 | 768 MB |

**Szándékosan nincs docker-szintű healthcheck**: a 2026-09-06-i leállás valószínű oka az
eltakarítatlan állapotellenőrző munkamenetek voltak.

### 11.3 Egy kérés útja kívülről

```
https://saas.mediapartizan.ro
    → DNS: 81.18.94.4
    → DSM fordított proxy (a NAS-on)
    → 127.0.0.1:8400  →  nginx doboz
         ├─ /allapot/ és /robots.txt  → statikus fájl (az app újraépítése alatt is él)
         ├─ /referencia/              → referencia:8600
         └─ minden más                → app:3000  →  db:5432
```

### 11.4 A kirakás menete

| Lépés | Parancs | Idő |
|---|---|---|
| 1. Ellenőrzés a felhőben | `pnpm ellenoriz` (határőr + típus + összerakás) | ~1 perc |
| 2. Forrás Vilmos gépére, majd GitHubra | `git push` | ~10 mp |
| 3. Kirakás indítása | `bash nas/kirak.sh` | **méréssel indul** |
| 4. Állapot | `bash nas/kirak.sh --allapot` → `KESZ:0` | az összerakás ~3–5 perc |
| 5. Indítás + migrációk | `bash nas/kirak.sh --indit` | ~1 perc |

A 3. lépés **mér, mielőtt bármit tenne**: `free -m` és `uptime` a NAS-on. **3 GB szabad memória
alatt vagy 20 fölötti terhelésnél nem indul el** (`MEGÁLLÍTVA`, kilépési kód 2).

Az összerakás a **közös kapun** át megy (`/volume1/homes/Portik/kozos/szabad-e.sh`):
a NAS-on öt projekt fut 27 dobozzal 16 GB memórián, és **egyszerre csak egy projekt rakhat össze**.

A régi forrásmappa nem törlődik, hanem a `_torolni/` alá kerül. A régi web doboz átnevezve marad.

### 11.5 Adatbázis-migrációk

A `migral.sh` a db dobozban fut. Létrehozza a `_migracio` táblát, végigmegy a
`migraciok/*.sql` fájlokon **név szerint rendezve**, és amelyik neve már benne van a táblában,
azt **kihagyja**. Minden fájl **egy tranzakcióban** fut (`psql -1`, `ON_ERROR_STOP=1`).
A migrációk a `km_tulaj` szerep nevében futnak.

### 11.6 Üzemeltetési szabályok (NAS)

**Amit tilos:**

- egész lemezt vagy összes dobozt végigmérő parancs (`docker system df`, `du -sh /volume`,
  `find /`, `updatedb`, …) — a `nas-parancs.sh` **kódban tiltja** (kilépési kód 3);
- két projekt egyidejű összerakása;
- egymás utáni ismételt kirakás (a változásokat összevárjuk; hibajavítás mérés után kivétel, naplózva);
- törlés — a `_torolni/` mappa van helyette;
- a gép kikapcsolása.

**Beépített korlátok minden NAS-parancsra:** 60 mp kemény időkorlát, `nice -n 19`, `ionice -c 3`.

**Minden nehéz munka naplózva** a `NAS-NAPLO.md`-ben: mikor, mi, meddig, mit érintett.

---

## 12. Minőségbiztosítás: mi véd mitől

| Ellenőrzés | Parancs | Mit fog meg | Mai állás |
|---|---|---|---|
| **Határőr** | `pnpm hatar` | ha egy modul olyat importál, amit nem szabad | 249 modul, **0 sértés** |
| **Tokenőr** | `pnpm tokenor` | beégetett szín, betű, méret, lekerekítés | 187 fájl, **0 sértés** |
| **Típusellenőrzés** | `pnpm tipus` | típushibák szigorú beállításokkal | **zöld** |
| **Egység- és élő próbák** | `pnpm -r proba` | működési hibák | **421 próba, mind zöld** |
| **Felirat-szinkron őre** | próba | ha egy felirat-kulcs kimarad az adatbázisból | zöld |

**Mindegyik lefut minden kirakás előtt** (`pnpm ellenoriz`).

### 12.1 A munkamódszer, ami a hibákat megtalálta

**VASSZABÁLY — fordított ellenőrzés minden körben.** Minden elkészült lépést egy külön AI-ágens
vizsgál át azzal a feladattal, hogy **próbálja megcáfolni** az állításokat. Ez a módszer több
valódi hibát talált, amit a próbák nem:

| Mit talált | Következmény |
|---|---|
| A leálláskor „fut" állapotban ragadt sortétel örökre beragadt volna | újranyitáskor visszakerül a sorba |
| A hibára futott napi futást az ütemező körönként újraindította volna egész nap | a hibás napi futás is „ma megvolt"-nak számít |
| A `server-only` őr elveszett a letöltő csomagba mozgatásakor | a webalkalmazás bejáratára visszatéve |
| Aki még nem váltott nyelvet, magyar választ kapott volna | a kérés nyelve (süti, böngésző) dönt |

**Az ágens állításait viszont mindig visszaellenőrizzük**: több esetben az ágens „SÚLYOS" vádja
**tévesnek bizonyult** (E-30 két escape-vádja; E-29b ujjlenyomat-állítása — utóbbit visszavonás-próbával
cáfoltuk meg). Nem javítunk el nem létező hibát.

### 12.2 A legnagyobb megtalált hiba: az üres cikkek

Érdemes megjegyezni, mert megmutatja, miért kell **valódi adatot mérni**, nem próbában bízni.

Az E-29 kirakása után egy nagy hírcsatornán indított valódi figyelés **27 percig tartott,
496 AI-összehasonlítással 32 cikkre**, és a végén 32 találat lett — **üres címmel és üres szöveggel**.

Az ok: az RSS-olvasó a HTML-t így vágta ki: `szoveg.replace(/<[^>]*>/g, " ")`. A `<![CDATA[`
burok nyitása is illeszkedik erre a mintára, és mivel a burkon belül nincs `>` a lezárásig,
a minta a **teljes tartalmat** kivágta. Ahol a hírcsatorna CDATA-t használ (a legtöbb WordPress-oldal
`content:encoded` mezője is), ott a cím és a szöveg is eltűnt. Ebből következett a lassúság:
üres szöveg → minden cikk ujjlenyomata azonos → minden párt megkérdeztünk az AI-tól.

| | előtte | utána |
|---|---|---|
| cikk címmel | 0 / 32 | **32 / 32** |
| átlagos szöveghossz | 0 karakter | **112 karakter** |
| dedup AI-hívás | **496** | **0** |
| a futás hossza | 27 perc, lejárt | **~3 perc, kész** |

A marosvasarhelyiek.ro cikkeinek átlagos szöveghossza **507 → 2174 karakterre** nőtt — az AI
eddig ott is a cikkek töredékét látta.

**A hiba E-20 óta bent volt, és minden próba zöld volt.** Csak az élő mérés mutatta meg.

---

## 13. Használat — a fő útvonalak

### 13.1 Első használat, végig

1. **Regisztráció** — `/regisztracio`: név, e-mail, jelszó (min. 10 karakter).
2. **Belépés** — `/belepes`.
3. **Szervezet létrehozása** — `/szervezet/uj`. Innentől a fiók tulajdonos.
4. **Onboarding** — `/onboarding`:
   - 1. lépés: név + weboldal **vagy** leírás → AI-összefoglaló (javítható);
   - 2. lépés: célközönség, cél, nyelvek, hangnem (bármi „későbbre" hagyható);
   - 3. lépés: ellenőrzés eredetjelöléssel → **Jóváhagyás**.
5. **A profil megvan** — `/fiok`-on szerkeszthető, az arculat itt adható meg.
6. **Hírfigyelő beállítása** — `/hirfigyelo/beallitas`: témák, kizárások, források, időzítés.
   Az AI a profil alapján javaslatot tud tenni.
7. **Források hozzáadása és ellenőrzése** — RSS-cím megadása, majd „ellenőriz":
   a rendszer megnézi, elérhető-e, RSS-e, engedi-e a robots.txt.
8. **Futtatás** — `/hirfigyelo`: „Futtatás most" gomb, vagy napi időzítés.
9. **Találatok** — kártyák fontossággal, összefoglalóval, „miért fontos neked?" indoklással.
10. **Finomhangolás** — `/hirfigyelo/finomhangolas`: visszajelzés → AI-javaslat → kipróbálás → elfogadás.

### 13.2 A második rendszer (referencia-host)

**https://saas.mediapartizan.ro/referencia/** — belépés nélkül, egyetlen bemutató szervezettel.

Két oldala van: a találatok listája (futtatás gombbal) és a beállítás megtekintése.
Nyelvváltó: HU / RO / EN. **A célja a bizonyítás, nem a használat.**

Beállítása (`profil.nas.json`): valódi letöltő, `marosvasarhelyiek.ro/feed` forrás,
a Dell Ollama-ja, napi futás 7:00-kor (Europe/Bucharest).

### 13.3 Adminfelületek

| Felület | Mit lehet |
|---|---|
| `/tema` | a megjelenés tokenjei — közös és szervezeti szinten, verziózva |
| `/feliratok` | minden felületi szöveg 3 nyelven — közös és szervezeti felülírás |

Mindkettőnél: tervezet → előnézet → mentés → alkalmazás, és bármelyik korábbi verzió visszaállítható.

### 13.4 Ellenőrző végpontok

| Cím | Mit ad |
|---|---|
| `/allapot/` | az élő munkaállapot-lap (statikus, az app újraépítése alatt is él) |
| `/api/egeszseg` | az alkalmazás életjele |
| `/api/belso/elvalasztas` | a több ügyfeles elválasztás gépi próbája |
| `/referencia/allapot` | a második rendszer életjele |

---

## 14. Amit a rendszer MA NEM tud

Ez nem hiánylista, hanem **határ**: ezek tudatosan nincsenek megépítve.

| Nincs | Miért |
|---|---|
| **Tartalomgyártás, ütemezés, közzététel** | a SaaS célterülete, de nem ez a szakasz |
| **Automatikus közösségimédia-publikálás** | az átadó kizárja ebből a modulból |
| **Fájlfeltöltés** (logó, arculati kézikönyv, minta) | a tárolás (S3/MinIO) nincs megépítve |
| **Jelszó-visszaállítás, e-mail-küldés** | 7. szakasz |
| **Fizetés, előfizetés, számlázás** | nincs eldöntött üzleti modell |
| **Mentés és visszaállítás** | 7. szakasz (A-15) |
| **Arab / RTL felület** | bővíthetőségi pont, nem átadási kapu |
| **Valódi integráció külső ügyfélrendszerbe** (Misszió) | felhatalmazás és kódfelmérés nélkül nem |
| **Harmadik befogadó rendszer** | a bekötési leírás alapján elindulna, de nem épült |
| **Néző szerep felületi finomítása** | a jogosultság él, a felület nem rejt el mindent |

---

## 15. Kockázatok és nyitott döntések

### 15.1 Műszaki kockázatok

| Kockázat | Súly | Mit teszünk vele |
|---|---|---|
| **TypeScript 7 friss** (Go-alapú fordító) | közepes | eddig gond nélkül ment; ha akadozik, 6-os ágra lépünk vissza |
| **A NAS nem tartalék nélküli**: 5 projekt, 27 doboz, 16 GB | magas | mérési küszöbök + közös kapu + naplózás; a szabályok kódban vannak, nem papíron |
| **A Dell (helyi AI) elérhetősége ingadozó** | közepes | mérve: volt, hogy órákig nem válaszolt; a hibaút tiszta (`AI_NEM_ELERHETO`, 502), semmi nem mentődik hibásan |
| **A referencia-host doboza 553 MB lemezen** | alacsony | a memória a szűk keresztmetszet (132 MB), nem a lemez |
| **Nyelvi minőség**: a román és angol szöveg gépi fordítás | közepes | lektorálás kell a pilot előtt (A-16) |

### 15.2 Nyitott döntések

| Döntés | Mikor kell |
|---|---|
| Első felhős AI-szolgáltató, keret és **adatpolitika** | a pilot előtt (A-13) |
| Üzemeltetési felelős, mentés, monitorozás | a pilotkész kapunál |
| A tesztoldal jelszós kapuja | a pilotkész kapunál |
| Ár, csomag, üzleti modell | üzleti döntés, nem műszaki |
| Piaci márkanév (az Aitmetica jogi név) | üzleti döntés |

### 15.3 Ami a 7. szakaszra (Pilotkész) marad

- **A-13** — adatpolitika: helyi-only esetén nincs felhős továbbítás, végigvezetve terméken.
- **A-15** — mentés és **kipróbált** visszaállítás.
- **A-16** — a nyelvi és vizuális ellenőrzések lezárása, lektorálással.
- Jelszós kapu a tesztoldalra, jelszó-visszaállítás, sebességkorlát.
- Hozzáférésnapló, hibajelzés, költségfigyelés, felelős.
- Független biztonsági szakértői vizsgálat.

---

## 16. Szótár

| Kifejezés | Mit jelent ebben a rendszerben |
|---|---|
| **Szervezet** | az ügyfél; a fizetési és adatgazdai egység. Minden adat ehhez tartozik |
| **Fiók** | egy ember belépése. Egy fiók több szervezethez tartozhat |
| **Profil** | a hiteles ügyfélprofil: mit csinál a cég, kinek, milyen céllal és hangnemben |
| **Arculat (brandprofil)** | az ügyfél vizuális kommunikációja. **Nem** a SaaS megjelenése |
| **Téma** | a SaaS kezelőfelületének megjelenése, tokenekben |
| **Token** | egy elnevezett megjelenési érték (`--primary`, `--r-card`, …) |
| **Felirat** | egy felületi szöveg stabil kulccsal, 3 nyelven |
| **Piszkozat** | mentett, de még nem jóváhagyott állapot |
| **Verzió** | egy jóváhagyott, változatlan pillanatkép (profil, arculat, téma, felirat, beállítás) |
| **Host / befogadó rendszer** | az az alkalmazás, amelybe egy modul be van kötve |
| **Csatlakozó** | amit a host ad a modulnak: profil, tárolás, AI, ütemezés |
| **Kivonat** | egy letöltött cikk címe, szövege és ujjlenyomata |
| **Esemény** | több cikk, ami ugyanarról szól (a deduplikálás után) |
| **Találat** | egy értékelt esemény: fontosság, összefoglaló, indoklás |
| **Határőr** | a `pnpm hatar` gépi importellenőrzés |
| **Tokenőr** | a `pnpm tokenor` gépi ellenőrzés a beégetett értékekre |
| **Fordított ellenőrzés** | külön AI-ágens, aki megcáfolni próbálja az állításokat |
| **VASSZABÁLY** | minden kör végén kötelező fordított ellenőrzés |

---

## Kapcsolódó dokumentumok

| Dokumentum | Mit tartalmaz |
|---|---|
| `docs/TESZTELESI-UTMUTATO.md` | **a tesztelő kézikönyve** — tesztesetek elvárt eredménnyel |
| `docs/ATADO-1.0.md` | a termék hiteles leírása: R-01…R-20, A-01…A-16, 7 szakasz |
| `docs/ALAPTERV.md` | technológiaválasztás mért verziókkal, modulhatárok, fenyegetési vázlat |
| `docs/HIRFIGYELO-SZERZODES.md` | a hírfigyelő modul szerződése és verziótáblája |
| `docs/HIRFIGYELO-BEKOTES.md` | hogyan köt be egy harmadik rendszer — lépésről lépésre |
| `docs/HATODIK-SZAKASZ-ZARAS.md` | a hordozhatóság bizonyítéka mérésekkel |
| `docs/KIRAKAS.md` | a kirakás részletes menete és a mérési naplók |
| `docs/INFRA.md` | az infrastruktúra leltára |
| `NAS-szabalyok.md` | a NAS üzemeltetési szabálykönyve |
| `EGYUTTMUKODES.md` | a munkamódszer szabálykönyve |
| `NAS-NAPLO.md` | minden nehéz NAS-munka naplója |
| `docs/AGENSEK.md` | az AI-ágensek költségnaplója |
