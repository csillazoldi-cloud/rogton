# Adatkötés — R-5

## A · Csomag csempe

| A rajzon | Honnan |
|---|---|
| „Pilot" | `GET /api/csomag` → `csomag.kod` → a `csomag.<kod>_nev` felirat |
| „Hírfigyelő" + „benne" jelvény | `GET /api/csomag` → `modulok[]` `{ modul, benne }`; a modul neve a `hf.modTitle` felirat |
| a magyarázó mondat | `csomag.pilot_megj` felirat |
| „Árazás és fizetés" jelölt sor | **nincs végpont** — állandó szöveg, a jelölés nyelvével |
| ár, pénznem | a válaszban `null` — a rajz **nem jeleníti meg**; ha később nem null, az új rajz |

A **modul-kapu** nem ezen a lapon látszik: ha a modul nincs a csomagban, a hírfigyelő végpontjai 403 `MODUL_NEM_ELERHETO`-val felelnek, és a sáv Modulok lenyílója csak a csomag moduljait mutatja. A pilotban egy csomag van, ezért a rajz nem mutat „nincs benne" állapotot.

## B · Kimenő értesítések

| A rajzon | Végpont / mező |
|---|---|
| „be van kötve" / „nincs bekötve" | `GET /api/ertesites` → `bekotve: true\|false` (**ez a mező a rajzhoz épül meg**) |
| a csempe mérőszáma (tulajdonos) | `hatasos`-ban a `kimeno` értékek száma |
| a csempe mérőszáma (rendszergazda) | `kozos`-ban a `kimeno` értékek száma |
| „Közös alap" oszlop (03., csak olvasható) | `beallitas.kozos[fajta]`, hiányzó kulcs = `nincs` |
| „Ebben a munkatérben" háromállású választó | `beallitas.szervezeti[fajta]`; **a kulcs hiánya = „örökli"** |
| „Ami érvényes" oszlop | `beallitas.hatasos[fajta]` — mind a 25 fajtára jön |
| mentés, tulajdonos | `PUT /api/ertesites` — törzs: **csak a felülírt** fajták; az „örökli" állású sor kimarad a törzsből |
| mentés, rendszergazda | `PUT /api/ertesites/kozos` — ugyanaz az alak |
| a horog címe | a NAS `.env`-jében (`ERTESITES_WEBHOOK_URL`) — **titok, a felületen soha** |

**Mi megy ki egy eseménynél:** a fajta címe és egy mondat (`esemeny.<fajta>_cim`, `_szoveg`), a munkatér azonosítója, az idő. **A tartalom soha** — cikk, profil, jelszó nem hagyja el ezen az úton a rendszert. A lap ezt ki is mondja.

**A 25 fajta öt csoportban** — a rajz sorrendje: Fiók és belépés (5) · Tagok (7) · Hírfigyelő futás (7) · Beállítás és profil (5) · Rendszer (1). A `belepesi_kiserletek` **rendszerszintű**: csak a rendszergazda lapján áll, a tulajdonosén nincs ott, ezért ott 24 sor látszik.

## C · AI-kapcsoló

| A rajzon | Végpont |
|---|---|
| a kapcsoló állása | `GET /api/beallitas/ai` → `beallitas.ai_engedelyezve` |
| kapcsolás | `PUT /api/beallitas/ai` `{ "engedelyezve": false }` — **csak tulajdonos** |
| „Kikapcsolva {ido} · {ki}" | az `ai_kapcsolo_valtozott` esemény legutóbbi bejegyzése; **ha nincs adat, a sor elmarad** |
| a hírfigyelő sávja (06.) | ugyanaz a `ai_engedelyezve` mező; a hivatkozás **csak tulajdonosnak** |
| a találatok „az AI nem elérhető" jelölése | meglévő, a találat állapotából |

**Mit tesz kikapcsolva:** egyetlen AI-hívás sem indul a munkatér nevében. A hírfigyelő letölti a híreket, de nem értékel — a találat „az AI nem elérhető" jelölést kap, a futás lefut. Az onboarding AI-javaslatai sem készülnek.

**Ki látja a dobozt:** csak a tulajdonos. Nézőnek és szerkesztőnek nincs ott — nem szürkén, egyáltalán nem.
