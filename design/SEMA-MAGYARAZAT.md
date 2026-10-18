# Séma-magyarázat — válasz a Design kérdéseire (KERDES-sema-gepezet.md)

2026-09-21 · a fejlesztő oldal (Claude) válasza, a kérdések sorrendjében.

**Honnan tudjuk:** a kódból (`packages/design-system/src/semak.ts`, `tema-alap.json`, `index.ts` → `szarmaztat()`,
`apps/web/tema/`, `apps/web/app/tema/`), **és élő méréssel a tesztoldalon** (2026-09-21 13:30 körül, Chromium 1440 px,
a próba-munkatéren tulajdonosként mindhárom sémára váltva, a lap `:root`-jából kiolvasva). A mellékelt `semak/semak.css`
a kódból generált, és **tokenről tokenre azonos** azzal, amit az élő lap kapott (három sémában 0 eltérés).

## Röviden

- Egy séma **25 alaptoken** értéke (a színek + néhány forma- és effekt-token). Minden más (betűk, méretek, térköz) a közös alapból jön. Ebből a 25-ből és a közös alapból a kód további **99 tokent számol**, így a lap `:root`-ja sémánként **169 token**.
- A séma **a kódban** él (egy állandó), nem az adatbázisban. Váltáskor a téma-tár **új verziót** ír a munkatérnek (vagy a közös alapnak), és eltárolja a séma kódját is.
- Az **Éjkék nem az R-1 v4 `:root`**, hanem az R-8 értékei, a 0093-as gombszín-javítással.
- A teljes értéklista: **`design/semak/semak.css`** (generált, három blokk: `:root`/`[data-sema="ejkek"]`, `[data-sema="vilagos"]`, `[data-sema="sotet"]`).
- Mérés közben **három hibát** találtunk a Megjelenés lapon (2. pont vége), és **négy kontraszthibát** a Világos/Sötét sémában (3. pont). Ezeket a kód oldalon javítjuk. Négy dolog **döntés** (a dokumentum végén).

---

## 1. Mi egy „séma" a kódban?

**Nem a teljes készlet és nem csak a színcsoport, hanem 25 alaptoken.** A lista (`SEMA_KULCSOK`, `semak.ts`):

- **16 szín:** `--bg` `--bg-elev` `--text` `--text-mut` `--text-dim` `--text-faint` `--on-primary` `--primary` `--primary-2` `--accent` `--accent-text` `--accent-link` `--ok` `--err` `--focus` `--shadow-color`
- **Forma:** `--r-card` `--r-btn`
- **Betű:** csak `--font-display` (Éjkék: Sora · Világos és Sötét: Manrope)
- **Effekt:** `--shadow-strength` `--glass-alpha` `--accent-warm` `--accent-gold` `--aurora-opacity` `--orb-size`

**Nem séma-token, tehát mindhárom sémában ugyanaz** (a közös alapból jön): a `--font-body`, minden `--fs-*`, `--fw-*`, `--ter-*`,
`--control-min`, `--lista-max`, `--urlap-max`, `--r-block` `--r-field` `--r-badge`, `--lh`, `--motion`, és két szín is:
**`--keszul`** és **`--olvasatlan`**. Ez utóbbi kettő a Világos sémában gondot okoz (3. pont).

A számok a kódban: az alapkészlet (`km-theme/2`) **73 token** (a „67 token, hat csoport” a rajz régebbi állása). Ebből a
`szarmaztat()` **99 tokent** számol (`--line*`, `--field-*`, `--panel-soft*`, `--btn-ghost-*`, `--src-*`, `--warn*`, `--keszul-*`,
`--grad-*`, `--fs-sm/md/xs/h2` stb.). Hárman átfedik egymást, így a lap `:root`-ja **169 token**.

**Hol él:**

| Mi | Hol |
|---|---|
| A három séma értékei | a kódban: `packages/design-system/src/semak.ts` (állandó; az Éjkék értékeit a `tema-alap.json`-ból olvassa ki) |
| A munkatér választása | a `szervezet_tema` tábla (a munkatér téma-verziói, csak a közös alaptól eltérő tokenek) + `sema_kod` oszlop — a **tulajdonos** váltja |
| A közös alap választása | a `tema` tábla (a közös alap verziói, teljes készlet) + `sema_kod` oszlop — a **rendszergazda** váltja |

Külön séma-tábla nincs. A váltás a meglévő téma-tár állapotgépén megy: tervezet → azonnal alkalmazott, a régi „korábbi” lesz.

**Az Éjkék nem azonos az R-1 v4 `:root`-tal.** Az Éjkék = `tema-alap.json` = az R-8 értékei (0081-es migráció) + a 0093-as
gombszín-javítás (`--primary` #5b6cff → #4b5ee3, mert fehér betűvel 4,2:1 volt). Eltérés az R-1 v4-től:

| Token | R-1 v4 `:root` | Éjkék (élő) |
|---|---|---|
| `--bg` | #0c0d13 | #070912 |
| `--bg-elev` | #12141c | #0d1020 |
| `--primary` | #4f5fd6 | #4b5ee3 |
| `--primary-2` | #7f8fff | #9a6bff |
| `--accent` | #ff4520 | #ff7a59 |
| `--accent-text` | #ff7a55 | #ffb39f |
| `--accent-link` | #ff6a40 | #9fa8ff |

A szöveg-, `--ok`, `--err`, `--focus` értékek azonosak.

**A kért értéklista.** Az első tábla a séma saját értékei, ahogy a lap megkapja. A második tábla a számolt tokeneké: a képlet
mindhárom sémában ugyanaz, az érték pedig a **kártyára (`--bg-elev`) keverve** szerepel, átlátszóság nélkül, hogy a rajzba
közvetlenül átvehető legyen. A kódban ezek `color-mix(in srgb, X N%, transparent)` alakúak, a teljes alak a `semak.css`-ben van.

**A séma saját értékei (élő):**

| Token | Éjkék | Világos | Sötét |
|---|---|---|---|
| `--bg` | `#070912` | `#F7F7F5` | `#15161C` |
| `--bg-elev` | `#0d1020` | `#FFFFFF` | `#1D1F27` |
| `--text` | `#e8ebf1` | `#1C1C1A` | `#ECEDF1` |
| `--text-mut` | `#9aa3b2` | `#63635C` | `#A2A5B3` |
| `--text-dim` | `#7a8496` | `#75756E` | `#8E91A0` |
| `--text-faint` | `#6b7484` | `#8A8A82` | `#7C8090` |
| `--on-primary` | `#ffffff` | `#FFFFFF` | `#FFFFFF` |
| `--primary` | `#4b5ee3` | `#4A63E7` | `#5563E8` |
| `--primary-2` | `#9a6bff` | `#4A63E7` | `#5563E8` |
| `--accent` | `#ff7a59` | `#C2410C` | `#FF8A65` |
| `--accent-text` | `#ffb39f` | `#9A3412` | `#FFB39F` |
| `--accent-link` | `#9fa8ff` | `#3B52D1` | `#9DA8FF` |
| `--ok` | `#7fe0a0` | `#1F7A4D` | `#7FE0A0` |
| `--err` | `#ffb3a3` | `#B42318` | `#FFB3A3` |
| `--focus` | `#8a98ff` | `#4A63E7` | `#8A98FF` |
| `--grad-primary` | `#4b5ee3 → #9a6bff` | `#4A63E7 → #4A63E7` | `#5563E8 → #5563E8` |

**Számolt tokenek (a kártyára keverve, élő):**

| Token | Képlet (mind a háromban ugyanaz) | Éjkék | Világos | Sötét |
|---|---|---|---|---|
| `--line` | --text 10% | `#232635` | `#e8e8e8` | `#32343b` |
| `--line-soft` | --text 7% | `#1c1f2f` | `#efefef` | `#2b2d35` |
| `--line-dash` | --text 15% | `#2e313f` | `#dddddd` | `#3c3e45` |
| `--field-bg` | --text 5% | `#181b2a` | `#f4f4f4` | `#272931` |
| `--field-border` | --text 14% | `#2c2f3d` | `#dfdfdf` | `#3a3c43` |
| `--panel-soft` | --text 2% | `#111424` | `#fafafa` | `#21232b` |
| `--panel-soft-2` | --text 4% | `#161928` | `#f6f6f6` | `#25272f` |
| `--btn-ghost-bg` | --text 5% | `#181b2a` | `#f4f4f4` | `#272931` |
| `--btn-ghost-border` | --text 14% | `#2c2f3d` | `#dfdfdf` | `#3a3c43` |
| `--btn-ghost-text` | --text 85% a --bg-n | `#c6c9d0` | `#3d3d3b` | `#cccdd1` |
| `--btn-ghost-hover` | --text 10% | `#232635` | `#e8e8e8` | `#32343b` |
| `--src-ai` | = --primary-2 | `#9a6bff` | `#4a63e7` | `#5563e8` |
| `--src-ai-bg` | --primary-2 14% | `#211d3f` | `#e6e9fc` | `#252942` |
| `--src-user` | = --text-mut | `#9aa3b2` | `#63635c` | `#a2a5b3` |
| `--src-user-bg` | --text 7% | `#1c1f2f` | `#efefef` | `#2b2d35` |
| `--src-web` | = --primary-2 | `#9a6bff` | `#4a63e7` | `#5563e8` |
| `--src-web-bg` | --primary-2 15% | `#221e41` | `#e4e8fb` | `#252944` |
| `--src-empty` | = --text-faint | `#6b7484` | `#8a8a82` | `#7c8090` |
| `--src-empty-bg` | --text 7% | `#1c1f2f` | `#efefef` | `#2b2d35` |
| `--warn` | = --accent-text | `#ffb39f` | `#9a3412` | `#ffb39f` |
| `--warn-bg` | --accent 8% | `#201825` | `#faf0ec` | `#2f282c` |
| `--warn-border` | --accent-text 30% | `#564146` | `#e1c2b8` | `#614b4b` |
| `--keszul` | alaptoken, NEM séma-token | `#9fb0d8` | `#9fb0d8` | `#9fb0d8` |
| `--keszul-bg` | --keszul 11% | `#1d2234` | `#f4f6fb` | `#2b2f3a` |
| `--keszul-border` | --keszul 34% | `#3f465f` | `#dee4f2` | `#495063` |
| `--ok-bg` | --ok 13% | `#1c2b31` | `#e2eee8` | `#2a3837` |
| `--err-bg` | --err 10% | `#25202d` | `#f8e9e8` | `#342e33` |
| `--err-border` | --err 30% | `#564147` | `#e8bdba` | `#614b4c` |

## 2. Hogyan viszonyul a sémához a Fő szín és a Betűméret?

**A Fő szín felülírja a séma `--primary`-ját.** A séma is tartalmaz fő színt (Éjkék #4b5ee3, Világos #4A63E7, Sötét #5563E8).
Ha a tulajdonos a Megjelenés lapon fő színt választ, akkor:

- `--primary` = a választott szín;
- `--primary-2` = ugyanez **30%-kal a fehér felé** keverve. Ezt a Megjelenés lap számolja (`TemaEgyszeru.tsx`, `vilagosabb()`), nem a `szarmaztat()`, és a `--primary-2` alaptokenként tárolódik;
- `--grad-primary` = `linear-gradient(120deg, --primary, --primary-2)`, ezt a `szarmaztat()` számolja.

Két következmény:

- A Világos és a Sötét séma a `--primary-2`-t a `--primary`-val **azonosra** teszi, vagyis ott a gradiens egyszínű.
- Saját fő színnél viszont visszajön a világosabb vég.

Az R-7c kerdesek.md 3. pontjának javaslata tehát részben áll: a `--primary-2` a fő színből jön, de a lap számolja, nem a származtatás.

**Betűméret: Kicsi 15 · Közepes 16 · Nagy 18 = a `--fs-base` három értéke.** Arányosan származtatott (R-7e):

| Token | Képlet | 15 | 16 | 18 (mérve) |
|---|---|---|---|---|
| `--fs-md` | alap × 0,9375 | 14 | 15 | 17 |
| `--fs-sm` | alap × 0,875 | 13 | 14 | 16 |
| `--fs-xs` | max(12,5; alap × 0,78) | 12,5 | 12,5 | 14 |
| `--fs-h2` | alap × 1,625 | 24 | 26 | 29 |

**Nem származtatott, fix alaptoken:** `--fs-title` (17), `--fs-h1` (34), `--fs-metric` (34) és a nyitólap négy mérete.
Mérve: Nagy betűnél a `--fs-base` 18, a `--fs-title` 17 — **a „cím” kisebb lesz a szövegnél**. Ez hiba: a `--fs-title`-t
(és valószínűleg a `--fs-h1`-et) is a `--fs-base`-ből kell származtatni. Kód oldali javítás, arányt a Design ad (javaslat: title = alap × 1,0625, h1 = alap × 2,125, ami 16-nál a mai 17 / 34).

**Verziók.** Minden művelet a munkatér téma-verzióinak **új verziója**:

- **Sémaváltás:** új verzió, séma-kóddal.
- **„Változtatások mentése”** (fő szín, betűméret): új verzió, séma-kód nélkül.

„A korábbi séma a verziók között marad” = a Theme verziólistája (a haladó Megjelenés lap verziólistája). Onnan
visszaállítható, és a visszaállítás is új verzió lesz. A séma és a fő szín tehát **nem ugyanabba a verzióba** mentődik.

**Mérés közben három hibát találtunk ebben a részben** (a próba-munkatéren, mindhárom élőben reprodukálva):

1. **A sémaváltás eldobja a tulajdonos saját fő színét és betűméretét.**
   - Mérve: Nagy betű + zöld fő szín mentve → Világosra váltás → a `--fs-base` 16 px, a `--primary` #4A63E7.
   - Ok: a sémaváltás a munkatér felülírásait a séma 25 tokenjére **cseréli**, nem keveri.
2. **A lapon kattintott sémaváltás után az előnézet és a mentés a régi fő színt és betűméretet viszi tovább.**
   - Mérve: Éjkékről a lapon Sötétre váltva a lap `--primary`-ja #5563E8 lett, az előnézeté #4b5ee3 maradt.
   - Ezután a „Változtatások mentése” Sötét hátteret tárolt Éjkék gombszínnel (`--primary` #4b5ee3, `--primary-2` #818eeb).
   - Ok: a lap a fő színt és a betűméretet csak a megnyitáskor olvassa be.
3. **Mentés után egyik csempén sem áll az „Ezt használjátok” felirat.** A „Változtatások mentése” séma-kód nélküli verziót ír, ezért a lap nem tudja, melyik séma az alap.

A javítás kód oldali, rajz nem kell hozzá. Ami viszont döntés, az az 1. pont iránya (D1 lent): váltáskor **megmaradjon**-e a
saját fő szín és betűméret, vagy a séma mindent visszaállít.


## 3. A színek jelentése sémánként

**A jelentés-szabály a kódban mindhárom sémára ugyanaz, mert a szerepeket a származtatás köti:**

- figyelmeztetés: `--warn` = `--accent-text`;
- AI-eredet: `--src-ai` = `--primary-2`;
- saját eredet: `--src-user` = `--text-mut`;
- link: `--accent-link`.

A narancs (`--accent`) csak a figyelmeztetés hátterében és a `--grad-headline`-ban szerepel. Ez utóbbit ma már csak az
előnézet régi blokkja használja (4. pont). Hogy a szabály mindhárom sémában *olvasható* is legyen, az már az értékeken múlik. Lent a mérés.

**Fényudvar az Éjkékben: igen, él.** Az Éjkék `--aurora-opacity` 50, `--orb-size` 88 px, ezért élőben:

- a lap hátterén ott a három fényfolt (`body::before`);
- a `--glow-primary` nem `none`, a fő gombok ragyognak.

A Világos és a Sötét sémában 0, ott nincs fényudvar. A leírás tehát a mai állapotot írja le: az R-7e szabálya (a munkafelületről ki) az Éjkékben
**nincs végrehajtva**. Ez döntés (D2): az Éjkék `--aurora-opacity` legyen 0, és ezzel a leírás is változik. Vagy maradjon, mert az Éjkék a „márkás” séma.

**A Sötét séma `--src-ai`-ja = a `--primary-2` = #5563E8** (a gombszín). Ez a kártyán **3,39:1**, a saját halvány hátterén
**2,94:1**, vagyis **nem olvasható** kis betűvel. Javaslat: a Sötétben a `--primary-2` ne egyezzen a gombszínnel. Vagy az
AI-jelvény kapjon saját, világosabb értéket (pl. az `--accent-link` #9DA8FF, amely 7,42:1). Ehhez a Design adjon színt.

**A Világos séma a fehér kártyán** (`--bg-elev` #FFFFFF) — mért kontraszt:

| Token | Érték | Kontraszt fehéren | 4,5:1 |
|---|---|---|---|
| `--text-faint` | #8A8A82 | **3,48** | nem |
| `--text-dim` | #75756E | 4,64 | igen (épphogy) |
| `--ok` | #1F7A4D | 5,32 | igen |
| `--ok` a saját `--ok-bg` hátterén | | **4,46** | nem (épphogy) |
| `--err` | #B42318 | 6,57 | igen |
| `--src-ai` a saját hátterén | #4A63E7 | **4,12** | nem |
| `--keszul` (nem séma-token, az Éjkéké maradt) | #9fb0d8 | **2,17** | nem |
| `--olvasatlan` (nem séma-token) | #7f8fff | **2,89** | nem (pont/harang, nem szöveg) |

Az R-12b rajz sötétített értékei a mérés szerint jók: `--text-faint` #6f7684 = 4,56:1, `--ok` #25764a = 5,57:1. Ezeket a Design
adja, mi beírjuk a `semak.ts`-be. A `--keszul`-t és az `--olvasatlan`-t séma-tokenné kell tenni (kód), a Világos értéküket a Design adja.

**A teljes kontraszttábla** (előtér a kártyán · a lap hátterén; mérve):

| Előtér | Éjkék | Világos | Sötét |
|---|---|---|---|
| `--text` | 15,81 · 16,64 | 17,07 · 15,91 | 14,05 · 15,43 |
| `--text-mut` | 7,42 · 7,81 | 6,05 · 5,64 | 6,71 · 7,37 |
| `--text-dim` | 5,01 · 5,27 | 4,64 · 4,33 | 5,25 · 5,77 |
| `--text-faint` | **4,01** · **4,22** | **3,48** · **3,24** | **4,19** · 4,60 |
| `--accent-link` | 8,56 · 9,01 | 6,34 · 5,91 | 7,42 · 8,15 |
| `--ok` | 11,75 · 12,37 | 5,32 · 4,96 | 10,23 · 11,24 |
| `--err` | 11,00 · 11,57 | 6,57 · 6,13 | 9,57 · 10,51 |
| `--warn` (= `--accent-text`) | 10,97 · 11,54 | 7,31 · 6,81 | 9,55 · 10,49 |
| `--src-ai` | 5,32 · 5,60 | 4,96 · 4,63 | **3,39** · **3,73** |
| `--src-ai` a saját hátterén | 4,51 | **4,12** | **2,94** |
| `--keszul` | 8,70 · 9,16 | **2,17** · **2,02** | 7,57 · 8,32 |
| `--on-primary` a `--primary`-n | 5,24 | 4,96 | 4,84 |
| `--on-primary` a `--primary-2`-n (a gradiens vége) | **3,55** | 4,96 | 4,84 |
| `--btn-ghost-text` a `--btn-ghost-bg`-n | 10,31 | 9,90 | 9,13 |

Vastaggal a 4,5:1 alattiak. **A `--text-faint` egyik sémában sem éri el a 4,5:1-et a kártyán.** Ez nem a Világos sajátja,
hanem a token szerepe: ha a `--text-faint` szöveg (dátum, lábjegyzet), mindhárom sémában sötétíteni vagy világosítani kell. Ha csak
díszítés (üres állapot ikonja), maradhat. Ezt a Design dönti el. Az Éjkék gradiensének vége (#9a6bff) fehér betűvel 3,55:1: a gomb közepén
a felirat olvasható, a jobb szélén gyengébb.


## 4. Az Élő előnézet

**Ugyanabból a tokenkészletből és ugyanazzal a származtatással renderel, de saját elemekkel.** Részletek:

- Az előnézet doboza a teljes, 169 tokenes készletet kapja **inline stílusként**. Ezt a Megjelenés lap a böngészőben számolja ugyanazzal a `teljesTokenek()` függvénnyel, amivel a lap feje. Ez tehát egy saját CSS-hatókör, nem másolat.
- Az elemei viszont **nem a valódi komponensek**, hanem az előnézet saját mini-elemei (`km-pv-*` a `tema.css`-ben). Ha egy valódi komponens (pl. a Hírek kártyája) más tokent használ, az előnézet ezt nem mutatja meg.
- Fő szín és betűméret: azonnal frissül, mentés nélkül.
- Sémaváltás: a lap újratölt, az előnézet átveszi az új sémát. **Kivétel a fő szín és a betűméret, azok a régiek maradnak** (a 2. pont 2. hibája).

**Az „Első beállítás — részlet” blokk a régi, v6 onboarding 1. lépése.** Ez a képernyő az R-8 óta nincs (a `/onboarding/1`
átirányít). A narancs kiemelés a `--grad-headline` (`--accent-text` → `--accent`), vagyis az R-8 visszavont színvilága. **Nem
szándékos, ki kell venni.** Ez rajz nélküli javítás. Ha kell helyette valami, a legtöbbet a mai Kezdőlap csempéjének
egy részlete mondana (szám + hírsor + másodlagos gomb). Ez viszont már új elem, tehát a Design dönti el, legyen-e.

A többi elem (Elsődleges/Másodlagos gomb, a két jelvény, a kódminta, a siker- és hibasáv) mai tokeneket használ, azok maradhatnak.
A „kék számláló” (`km-pv-lepes`) szintén a régi onboarding lépésszámlálója. Ha a blokk kimegy, ez is mehet.


## 5. Hol dől el a séma, és ki látja?

**A tulajdonos váltja a munkatérnek, és a munkatér minden tagja azt látja.** A lap feje a néző *aktív munkaterének* tokenjeit kapja
(`app/layout.tsx` → `hatasosTema(szervezetId)`). Felhasználónkénti választás **nincs**: a Saját fiók lapon nincs séma, és a kódban sincs ilyen tárolás.

**Van rendszerszintű alap: a közös alap.** A rendszergazda a haladó Megjelenés lapon (közös szint) ugyanígy válthat sémát. Azok a
munkaterek, amelyeknek nincs saját téma-verziójuk, ezt öröklik.

Mérve: a próba-munkatér a mérés előtt nem választott semmit, és a tokenjei **tokenről tokenre** a közös alapéi voltak. Azok
pedig pontosan az Éjkék értékei.

**Buktató:** amint egy munkatér egyszer sémát vált, a séma mind a 25 tokenje az ő felülírásaként tárolódik. Ha ezután a
rendszergazda a közös alapot átállítja, az ennél a 25 tokennél **nem ér el** ehhez a munkatérhez.

**A nyilvános lapok (nyitólap, belépés, adatkezelés):**

- **Belépés nélkül:** a közös alapot kapják. Mérve a `/belepes`-en: Éjkék értékek.
- **Belépett látogatónak:** a saját munkaterének sémáját. Mérve: a próba-munkatér Világos sémájával a nyitólap `--bg`-je #F7F7F5 lett, Sötéttel #15161C.

Vagyis a nyitólap ugyanannak a címnek más-más arcát mutatja, attól függően, ki nézi. Ez döntés (D3).


## 6. Mit vár a kód a Designtól?

**A javasolt munkamód jó, és a tokenlap első fele már megvan: `design/semak/semak.css`.**

- A kódból generáltuk (`npx tsx tools/semak/semak-css.mts > design/semak/semak.css`), és az élő laphoz mérve azonos.
- Három blokk: `:root, [data-sema="ejkek"]` · `[data-sema="vilagos"]` · `[data-sema="sotet"]`.
- Sémánként mind a 169 token benne van, a számoltak a képletükkel együtt.
- Az artboard sarkában a kapcsoló ennyi: `document.documentElement.dataset.sema = "vilagos"`.

**Kérjük, hogy a rajz ezt a fájlt töltse be, és ne kézzel hangolt `:root`-ot.** Ha egy értéket változtatni kell (pl. a Világos
`--text-faint`), azt a Design **egy táblában** adja meg: token, séma, új érték, indok. Mi beírjuk a `semak.ts`-be, és újragenerálunk. Így
az egy forrás a kód marad, a rajz pedig mindig azt mutatja, ami élesben megy. A `tokenek/semak.md`-be (a kontrasztértékekkel) a
3. pont táblái átvehetők.

**Amit a kód ehhez vállal:**

- a 2. pont három hibájának javítása;
- a `--fs-title` / `--fs-h1` származtatása;
- a `--keszul` és az `--olvasatlan` séma-tokenné tétele;
- az előnézet régi blokkjának kivétele;
- a Design értéktáblájának beírása.

Rajz ezekhez nem kell.

**A régi rajzok (R-7a–d, R-11):** igen, maguktól követik a sémát, amíg tokennévvel állnak. Kivétel az, ami a rajzban kézzel beírt
színnel áll (pl. az R-12b kézzel áthangolt értékei). Az élesben is csak akkor követi a sémát, ha a kódba tokennévvel kerül. A tokenőr ezt a kód oldalon
kikényszeríti: kézzel beírt szín nem mehet ki.

---

## Döntések és javítások (2026-09-21, Vilmos döntött — kint a teszten, élőben mérve)

| # | Döntés | Mi lett |
|---|---|---|
| D1 | Sémaváltáskor a saját fő szín és betűméret **megmarad** | `semaraValt()` (`semak.ts`): a séma a többi tokent cseréli; a `--fs-base/--fs-title/--fs-h1` és — ha a tulajdonos választotta — a `--primary/--primary-2` marad. Mérve: Nagy + zöld → Sötét: `--bg` #15161C, `--primary` #2f7d5a, `--fs-base` 18 px |
| D2 | Az Éjkék **fényudvar nélkül** | `tema-alap.json` `--aurora-opacity` 0 + a 0115 a tárolt közös alapon és az Éjkék munkatér-verziókon. Mérve: `--aurora-opacity` 0, `--glow-primary` none mindhárom sémában. Az Éjkék leírása: „Az alap: mély éjkék háttér, indigó gombok.” |
| D3 | A nyilvános lapok **mindig a közös alapot** mutatják | `_kozos/KozosTema.tsx` a nyitólapon, a belépésen, a regisztráción, a két jelszó-lapon, az adatkezelésen és a meghívón. Mérve: Sötét munkatérrel belépve a nyitólap és az adatkezelés `--bg`-je #070912 |
| D4 | A kontraszthibák értékei | **Nyitva — a Design ad értéket**: Világos `--text-faint`, `--ok` a saját hátterén, `--src-ai` a saját hátterén · Sötét `--src-ai` / `--primary-2` · Világos `--keszul` és `--olvasatlan` (ezt a kettőt ezzel együtt tesszük séma-tokenné) · és hogy a `--text-faint` szöveg-e |

**A 2. pont három hibája javítva** (élőben mérve):

- mentés után a séma neve megmarad: `semaFelismer()`, a fő szín párja nem számít bele;
- az előnézet a váltás után a friss fő színt és betűméretet mutatja;
- a „Ezt használjátok” jelölés a mentés után is a helyén van.

**A betűméret a `--fs-title` és a `--fs-h1` értékét is állítja** (×1,0625 és ×2,125). Mérve Nagy betűnél: 18 / 19 / 38 px.

**Az előnézetből kikerült a régi első-lépés részlet és a lépésszámláló.**

A `design/semak/semak.css` a döntések után újragenerálva.
