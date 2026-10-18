# MODULSZABÁLY — hogyan épül minden újrahasznosítható elem

Kommunikációs munkatér · Aitmetica SRL · 2026-09-12
**Ez előírás, nem ajánlás.** Ami ezt megsérti, az nem kerül be a főágba.
Érvényes minden új fejlesztésre; a meglévő kód akkor igazodik, amikor amúgy is hozzányúlunk.

Alapvetés (Vilmos, 2026-09-11): *minden modulárisan épüljön, és bármilyen más, ezzel a
technológiával készült projektbe integrálható legyen.* Ez a lap ezt fordítja le mérnöki
szabályokra.

---

## 1. Az első kérdés: modul-e egyáltalán?

Mielőtt egy sor kód megszületik, három kérdés. **Csak akkor modul, ha mind a háromra igen.**

1. **Kellhet-e egy másik projektben is?** Jogosultság, fájlfeltöltés, értesítés, ütemezés,
   naplózás, hírfigyelés — igen. „Az Aitmetica ügyfélprofiljának mezősorrendje" — nem.
2. **Le tudod-e írni úgy, hogy nem mondod ki a szót, hogy Next, Postgres vagy React?**
   Ha nem, akkor még nem modul, hanem egy képernyő, aminek nincs kimondva a szabálya.
3. **Tesztelhető-e adatbázis és hálózat nélkül?** Ha nem, akkor a szabály és a tárolás
   össze van nőve — előbb szét kell választani.

Ha mindhárom igen: **az első naptól csomagként épül**, nem „majd később kiszervezzük".
A későbbi kiszervezés mindig drágább, mert addigra a szabály beleívódik a képernyőbe.

Ha bármelyik nem: ne csinálj csomagot. A feleslegesen kiemelt modul ugyanolyan hiba, mint
a bennfelejtett.

## 2. A három réteg — minden modul ugyanígy áll

| Réteg | Mi van benne | Hol él |
|---|---|---|
| **mag** (`*-core`) | a szabályok. Se tárolás, se hálózat, se képernyő | `packages/<modul>-core/` |
| **feliratok** (`*-feliratok`) | minden látható szöveg, három nyelven, adatfájlként | `packages/<modul>-feliratok/` |
| **promptok** (`*-promptok`) | ha a modul AI-t hív: a promptok szövegként | `packages/<modul>-promptok/` |
| *befogadó* | táblák, végpontok, sütik, képernyők | `apps/<host>/` — **nem a csomagban** |

A feliratok és a promptok azért külön csomagok, mert **külön életük van**: a szöveg
lektorálható és fordítható anélkül, hogy a szabályhoz hozzányúlnánk, és egy másik befogadó
átveheti a feliratokat a mag nélkül is, vagy fordítva.

## 3. A kötelező mappaszerkezet

Minden mag-csomag pontosan így áll. Ettől eltérni nem lehet.

```
packages/<modul>-core/
├── package.json          @km/<modul>-core · "exports": csak "./src/index.ts"
├── tsconfig.json
├── vitest.config.ts
├── README.md             KÖTELEZŐ — lásd 7. pont
├── src/
│   ├── index.ts          az EGYETLEN bejárat: csak újraexportál
│   ├── host.ts           a konnektor: amit a befogadónak meg kell adnia
│   └── <tárgy>.ts        a szabályok, tárgyanként egy fájl
└── probak/
    └── <tárgy>.proba.ts  a próbák a modullal utaznak
```

**Az `index.ts` az egyetlen bejárat.** A befogadó soha nem importál `…/src/valami.ts`-t,
csak a csomag nevét. Ezt a határőr kikényszeríti (5. pont).

**A `host.ts` a fogantyú.** Ebben áll minden, amit a modul a külvilágtól kér. Ha ez a fájl
üres, a modul nem hordozható — csak még nem derült ki.

## 4. Amit a mag SOHA nem importálhat

Tiltott, kivétel nélkül:

- `react`, `react-dom`, `next`, `server-only` — nincs képernyő
- `drizzle-orm`, `pg`, `postgres`, bármilyen adatbázis-illesztő — nincs tárolás
- `node:fs`, `node:http`, `node:crypto`, `fetch` — nincs lemez, nincs hálózat
- másik modul magja — a modulok nem ismerik egymást

Engedélyezett: **`@km/contracts` és `zod`. Más semmi.**

És három dolog, ami nem import, mégis tilos, mert ugyanúgy a külvilág:

| Tiltott | Helyette |
|---|---|
| `Date.now()`, `new Date()` | **óra-port**: a befogadó adja az időt |
| `Math.random()`, `crypto.randomUUID()` | **azonosító-port**: a befogadó adja |
| `process.env` | **beállítás-paraméter**: a befogadó adja át hívásban |

Ok: e három nélkül a modul próbái nem determinisztikusak, és a lejárat, az azonosító és a
környezet nem tesztelhető. Ez a különbség egy hordozható modul és egy „nálam működik" kód közt.

## 5. A határőr — ugyanaznap, nem később

**Minden új csomag a létrehozása napján kap egy nevesített szabályt** a
`.dependency-cruiser.cjs`-ben. Szabály nélkül a modul első hete alatt beszivárog egy import,
és onnantól már nem hordozható.

A mai rendszerben tizenhat ilyen szabály van (mérve a 2026-09-01-i mappamásolatból), és ezek
tartják a hírfigyelőt tisztán — például a `news-monitor-core-csak-contracts-es-zod`.

Minden új modulhoz **legalább három** szabály kell:

```js
{ name: "<modul>-core-csak-contracts-es-zod",
  comment: "A <modul> magja tiszta szabály: csak a contracts és a zod.",
  severity: "error",
  from: { path: "^packages/<modul>-core/" },
  to:   { path: "^packages/(?!contracts)|node_modules/(react|react-dom|next|drizzle-orm|pg|postgres|server-only)(/|$)" } },

{ name: "alkalmazas-a-<modul>t-csak-a-bejaratan-at",
  severity: "error",
  from: { path: "^apps/" },
  to:   { path: "^packages/<modul>-core/src/(?!index\\.ts)" } },

{ name: "a-<modul>-feliratai-host-semlegesek",
  severity: "error",
  from: { path: "^packages/<modul>-feliratok/" },
  to:   { path: "node_modules/(react|react-dom|next|drizzle-orm|pg|postgres|server-only)(/|$)|^packages/(?!<modul>-feliratok)" } },
```

A `pnpm hatar` minden deploy előtt lefut. Aki megsérti, nem tud kiadni.

## 6. A konnektor — mit tartalmaz a `host.ts`

Öt dolog, ebben a sorrendben. Amelyik nem kell, kimarad; amelyik kell, itt áll és sehol máshol.

1. **A modul saját szerep- és művelet-szótára.** Rövid: amit a modul tud, nem amit a rendszer.
   A hírfigyelőnél ma három szerep és öt művelet — és ez a jó méret.
2. **Tár-portok.** Szűk, nevesített műveletek: „add meg ennek a szervezetnek a forrásait",
   nem „adj egy adatbázis-kapcsolatot". Ha a port neve tartalmazza a szót, hogy *tábla*,
   *lekérdezés* vagy *SQL*, akkor rossz.
3. **Óra és azonosító.** Lásd a 4. pontot.
4. **Esemény-kimenet.** A modul nem értesít, nem naplóz, nem ír Telegramra — **eseményt ad**,
   és a befogadó dönti el, mit kezd vele.
5. **A zárt hibakód-lista.** Nem szöveg, hanem véges halmaz — a befogadó erre fordít feliratot.

**Fontos elvi pont: minden modul a SAJÁT szótárát hozza, és a befogadó fordít rá.**
Csábító lenne egy közös jogosultság-csomag, amitől minden modul függ — de akkor egyetlen modult
sem lehetne kiemelni külön, mert mindet magával húzná. A fordítás a befogadó dolga: ő tudja,
hogy nála a „szerkesztő" az, ami a modulnál a „szerkeszto".

## 7. A `README.md` — a modul használati utasítása

Kötelező, és pontosan öt szakasz:

1. **Mit csinál** — három mondat, technológiai szó nélkül
2. **Mit kér a befogadótól** — a `host.ts` minden portja, egy sorral mi a dolga
3. **Mit ad vissza** — a bejárat függvényei és az események
4. **Hibakódok** — a zárt lista, és mikor melyik jön
5. **Beillesztés** — a 9. pont hat lépése, erre a modulra konkretizálva

Ez a lap az, ami miatt egy másik projektben dolgozó ember egy nap alatt beköti, nem egy hét
alatt. **Modul README nélkül nincs kész**, akkor sem, ha a kód hibátlan.

## 8. Verziózás és törés

- A csomag `version` mezője valódi: minden kiadásnál emelkedik.
- **A `host.ts` megváltozása töréses változás** — ott emelünk nagy verziót, mert a befogadó
  adapterei törnek el, nem a mag.
- A mag belső átszervezése nem törés, ha a bejárat változatlan. Ez az `index.ts` értelme.
- A hírfigyelőnél ez már bizonyított: a 0.1.0 → 0.2.0 lépéshez **egyetlen befogadó-fájlt sem
  kellett módosítani.** Ez a mérce.

## 9. Hogyan emelsz ki egy modult egy másik rendszerbe

Hat lépés. Ha bármelyik többe kerül egy napnál, a modul megsértette ezt a szabálylapot.

1. Átmásolod a `packages/<modul>-core/` mappát (és ha van, a `-feliratok`, `-promptok` párját).
2. Beírod a workspace-listába.
3. Megírod a `host.ts` portjait a saját tárolódra — ez az egyetlen valódi munka.
4. **Lefuttatod a modul saját próbáit.** Vele utaznak; ha zöldek, a mag landolt.
5. Átemeled a három határőr-szabályt az új projekt `.dependency-cruiser.cjs`-ébe.
6. Bekötöd a feliratokat a saját felirat-rendszeredbe.

Amit **nem** viszel: táblát, migrációt, végpontot, képernyőt. Azok a régi befogadóé.

## 10. Mikor mondhatjuk, hogy a modul kész

Hat feltétel. Öt nem elég.

- [ ] `pnpm hatar` · `pnpm tipus` · `pnpm ellenoriz` hibátlan
- [ ] a modul saját próbái zöldek, és **adatbázis nélkül futnak**
- [ ] `README.md` megvan, mind az öt szakasszal
- [ ] a határőr-szabályok bekerültek
- [ ] a feliratok külön csomagban, három nyelven
- [ ] **a modul fut a második befogadóban is** (`apps/referencia-host`, sima `node:http` +
      SQLite), és a két befogadó illesztő-fájljai közt **nincs azonos fájl**

Az utolsó a lényeg. **Egyetlen befogadóban futó modulról nem tudjuk, hogy hordozható — csak
azt, hogy még nem derült ki az ellenkezője.** A hírfigyelőnél ez a próba (A-12) megvolt, és
ezért tudjuk róla biztosan, hogy hordozható.

## 11. Amit ez a szabály tudatosan NEM ír elő

- **Nem kér külön adattár-absztrakciót** minden modulhoz. A port elég; ORM fölé épített réteg
  nem kell.
- **Nem kér publikálást npm-re.** A monorepo `workspace:*` hivatkozása elég, a másolás működik.
- **Nem tiltja a modulok közti közös nyelvet**: a `@km/contracts` pont erre való — de abban
  csak típus és séma lehet, szabály nem.
- **Nem követeli meg, hogy minden legyen modul.** A 1. pont három kérdése a kapu.

## 12. Ki tartja be

Minden fejlesztő, aki ehhez a projekthez nyúl — ember és Claude egyaránt. A határőr a gépi fék,
ez a lap az emberi. **Új modul indításakor ez a lap az első olvasnivaló**, és a
`CLAUDE.md` / `AGENTS.md` hivatkozzon rá.
