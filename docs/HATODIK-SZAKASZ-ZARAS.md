# 6. szakasz — Hordozhatóság (A-12) · ZÁRÁS (2026-09-08)

**Amit bizonyítani kellett:** a hírfigyelő nem az egyik ügyfél alkalmazásába nőtt bele, hanem egy önálló, áthelyezhető
modul. A bizonyíték nem papír: **ugyanaz a csomag két különböző rendszerben fut, és mindkettő él a tesztoldalon.**

| | webalkalmazás (`apps/web`) | referencia-host (`apps/referencia-host`) |
| --- | --- | --- |
| keret | Next.js 16 + React 19 | nincs — sima `node:http` |
| tárolás | PostgreSQL, sorszintű védelemmel | egy SQLite-fájl (`node:sqlite`) |
| profil | adatbázisból, onboardingból | egy `profil.json`-ból |
| ütemezés | Postgres-várólista + futtató | saját, kis SQLite-sor |
| felület | a prototípus kártyája, React | kiszolgálón összerakott HTML |
| memória | 512 MB doboz (57 MB használt) | **256 MB doboz (132 MB használt)** |
| cím | https://saas.mediapartizan.ro/ | https://saas.mediapartizan.ro/referencia/ |
| **a hírfigyelő magja** | **`@km/news-monitor-core` 0.2.0** | **`@km/news-monitor-core` 0.2.0 — UGYANAZ** |

## Az átvételi feltételek — megmérve

### I-1 — Azonos csomag két hostban, ügyfélspecifikus kód és másolás nélkül · **TELJESÜL**

- Mindkét host ugyanazokat a csomagokat húzza: `@km/news-monitor-core`, `@km/letolto`, `@km/news-monitor-feliratok`,
  `@km/news-monitor-promptok`, `@km/ai-adapters`, `@km/contracts`, `@km/design-system`.
- A mag függősége mindössze **`@km/contracts` + `zod`** — se Next, se adatbázis-illesztő, se HTTP-ügyfél.
- A mag forrásában **egyetlen említés sincs** egyik hostról sem (gépi ellenőrzés).
- **Másolás-próba**: a két host `.ts` fájljai közül **azonos tartalmú: 0 darab**.
- A határőr (`pnpm hatar`, dependency-cruiser) **239 modul, 0 sértés**, benne 4 új, E-29/E-31-ben írt szabállyal:
  a második host nem nyúlhat a webalkalmazásba; a közös letöltő, a feliratok és a promptok host-semlegesek.

### I-2 — A második host a 4 csatlakozót maga adja · **TELJESÜL**

`apps/referencia-host/src/csatlakozok/`:

| csatlakozó | fájl | mit ad |
| --- | --- | --- |
| **tárolás** | `sqlite-tar.ts` (13 kB) | a `HirfigyeloTar` **mind a 21 metódusa** SQLite-on (gépi ellenőrzés: egy sem hiányzik) |
| **AI** | `ai.ts` (7 kB) | teszt-csatlakozó (hálózat nélkül) + a Dell Ollamája a közös adapteren át |
| **ütemezés** | `utemezo.ts` + `napi.ts` (9 kB) | saját SQLite-sor, beragadt tételek elengedése, napi esedékesség időzónával |
| **letöltő** | `letolto.ts` (2 kB) | választás a rögzített minta és a **közös** `@km/letolto` között |

A profilt a host adja (`profil.json` / `profil.nas.json`) — a mag csak olvassa (10.3).

### I-3 — Verziófrissítési próba: a mag 0.2.0, mindkét host zöld · **TELJESÜL**

- A mag `0.1.0` → **`0.2.0`**, egy szerződés-kompatibilis változással: `Kartya.esemeny_ideje`
  (a kártya forrásai közül a legkorábbi megjelenés), **új és VÁLASZTHATÓ** mező.
- **Egyik host kódját sem kellett hozzányúlni.** Próbák a frissítés után: promptok 5, letöltő 19, feliratok 5,
  mag 166, referencia-host **32**, webalkalmazás 161 — mind zöld.
- A szerződés (`docs/HIRFIGYELO-SZERZODES.md` 5.) mostantól verziótáblát vezet, és kimondja, mi mehet kisverzióban
  (új választható mező, új felirat-kulcs, belső javítás) és mi kér főverziót (a tár-interfész bármely változása,
  meglévő mező típusa/neve/eltűnése, új kötelező mező).
- **Élő bizonyíték**: az `esemeny_ideje` ott van a tesztoldalon a referencia-host kártyáin (dátum a kártya alján).

### I-4 — Bekötési leírás, amiből egy harmadik host is elindulna · **TELJESÜL**

`docs/HIRFIGYELO-BEKOTES.md` (285 sor): mit ad a host, a teljes tár-interfész metódusonként, a letöltő és a
duplikátum-szűrés, az AI-csatlakozó, az ütemezés, a `Kornyezet` összefűzése, az **első használat hívási sorrendje**,
jogosultság és nyelv, feliratok, verziókompatibilitás, ellenőrzőlista.

Amit a leírás a saját hibáinkból tanult meg — ezek a csapdák valóban megfogtak minket:

- a tárnak **másolatot** kell visszaadnia (a memóriatár nem tett így: egy későbbi módosítás visszamenőleg megjelent
  egy korábbi pillanatképben);
- a feliratok és a promptok **adatfájlok**: az önálló (bundle-elt) csomag nem viszi magával őket — kézzel kell bemásolni,
  különben néma `AI_NEM_ELERHETO`;
- a futásnak **határidőt** kell adni, különben a sor-tétel lejár, a munka meg gazdátlanul fut tovább.

### I-5 — A referencia-host él a tesztoldalon, 3 nyelven, tokenekből · **TELJESÜL**

https://saas.mediapartizan.ro/referencia/ — saját doboz a NAS-on, az nginx alatt.

| mérés (2026-09-08, kívülről) | eredmény |
| --- | --- |
| útvonalak | `/referencia` 301 → `/referencia/` 200 · `/referencia/allapot` 200 · `/referencia/beallitas` 200 · a fő alkalmazás `/` 200 |
| egy valódi figyelés | **78 másodperc**, marosvásárhelyiek.ro feed → Dell Ollama → **10 találat, 9 kártya** (egy esemény két cikkből összevonva) |
| memória | 132 MB / 256 MB |
| felület | HU és RO a **közös felirat-csomagból**, a színek és betűk a `design-system` tokenjeiből (`tokenőr`: 180 fájl, 0 beégetett érték) |
| NAS a kirakás után | 10,8 GB felszabadítható, terhelés 2,2 |

## Ami a szakaszban VÁRATLANUL kiderült (és javítva lett)

1. **Az üres cikkek (E-29b).** Az élő mérés egy nagy hírcsatornán 27 percig tartott, 496 AI-hívással 32 cikkre.
   Az ok: az RSS-olvasó a `CDATA`-ba csomagolt címeket és szövegeket **kitörölte** — minden cikk ujjlenyomata azonos
   lett, így a duplikátum-szűrő mindent mindennel összehasonlított. Ez E-20 óta bent volt, csak a hordozhatósági
   mérésen látszott meg. Javítás után: 32/32 cím megvan, 0 duplikátum-hívás, a futás ~3 perc.
2. **Az AI a felület nyelvén válaszol (E-29c).** A román felületen magyar szöveg jelent meg. A modellen mérve derült ki,
   hogy a **magyar nyelvű** utasítást ("írj románul") figyelmen kívül hagyja, a **célnyelvűt** viszont megfogadja —
   ezért a nyelvi keret a prompt elején és végén, a válasz nyelvén.
3. **A promptok is közös darab (E-31).** A második host nem nyúlhat a webalkalmazásba, tehát az AI-utasítások sem
   maradhattak ott. Ma mindkét host **ugyanazt a szöveget** küldi a modellnek.
4. **A NAS-jelszó kérdező szkriptje a `/tmp`-ben lakott (E-32)** és egy gép-újraindulással elveszett. Most a tárhelyben
   van (`nas/jelszo-kerdes.py`) — titok nélkül, csak a vault útvonalával.

## Fordított ellenőrzés (VASSZABÁLY)

Minden lépés kapott egyet. Az E-32-é 7 állítást próbált megcáfolni (útvonal-előtag szivárgás, a 303 átirányítás,
a nginx-blokk hatása a fő alkalmazásra, a compose-szolgáltatás elszigeteltsége, a jelszó-szkript). **Egy valódi hibát
sem talált** — és a legérzékenyebb állítást (szivárog-e ki az előtag alól) **utána élőben is megmértem**:
`/referenciaxyz` → 404 az alkalmazástól, `/referencia//allapot` → 404, `/referencia/%2e%2e/allapot` → nem jut a hosthoz.
Korábbi lépésekben az ellenőr két „SÚLYOS" vádja **tévesnek bizonyult** (E-30, HTML-escape) — ezeket megnéztem, nem
javítottam el nem létező hibát.

## Ami tudatosan NEM készült el

- **A referencia-host nem termék.** Két oldala van (találatok + beállítás megtekintése), belépés nélkül, egyetlen
  bemutató szervezettel. A célja a bizonyítás, nem a használat.
- **Nincs harmadik host.** A leírás alapján elindulna egy, de nem építettünk.
- **A referencia-host doboza 553 MB lemezen** (a munkatér függőségeit viszi, `tsx`-szel fordít futásidőben).
  A szűk keresztmetszet a memória (132 MB), nem a lemez — ezért nem optimalizáltuk.

## A szakasz állása

**6. szakasz — Hordozhatóság: 100%.** Az A-12 bizonyítva, mindkét host él a tesztoldalon.
Következik a **7. szakasz — Pilotkész**.
