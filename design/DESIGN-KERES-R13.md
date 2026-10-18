# Design-kérés — R-13 · Kredit és egyéni hírszűrés — négy lap

2026-09-22 · Aitmetica SRL · Írta: a fejlesztő oldal (Claude), Vilmos kérésére.
**Ezt a lapot egészben, változtatás nélkül add át a Claude Designnak.** A korábbi rajzcsomagokra (R-1 v4 felső sáv,
R-2 Tagok, R-3 v2 Saját fiók, R-7/R-12 Kezdőlap, R-10 sémák) hivatkozunk; a tokenlap: `design/semak/semak.css`.

---

## 0. Mi ez, és miért

Vilmos két dolgot döntött el 2026-09-22-én (a döntések táblája: `claude/KREDIT-ES-EGYENI-SZURES.md`):

1. **A hírszűrés fiókonként állítható.** Egy munkatérben mindenki maga dönti el, mennyire szigorúan szűrjön neki a
   gép (három fokozat), és kér-e előszűrést (be/ki). A gép egy hírt egyszer olvas el, és mindenkinek a saját
   beállítása szerint dönt. **A kiszűrt hírekből soha nem látszik más, csak a számuk** (ez ma is így van).
2. **Pénz helyett kredit.** Minden mai AI-művelet **1 kredit** (egy hír alapos elolvasása, egy gyűjtés előszűrése,
   egy posztszöveg, egy fordítás, egy Iránytű-javaslat …). A munkatér havonta kap kreditet (egyelőre a
   rendszergazda adja, később a csomag), és a **tulajdonos osztja szét a tagok között**. Aki nem kapott külön
   összeget, az a ki nem osztott rész **egyenlő részét** kapja. Ha egy tagé elfogy, **csak neki** áll le az AI-munka.
   Ha a gép egy hírt több tagnak olvas el, az 1 kredit **megoszlik** közöttük (ezért lehet tört kredit — egy tizedesre
   kerekítve mutatjuk).

A gépezet a rajzzal párhuzamosan épül (2. pont). **A képernyőt csak a rajz után építjük.** A rajz a szerződés:
ami a rajzon nincs, az nem kerül a képernyőre; ami többlet, az hiba.

## 1. Szabályok — ugyanazok, mint eddig

- Csak tokenből (`design/semak/semak.css`, mindhárom séma). Új tokent a `tokenek.md`-ben indokolj.
- Minden szöveg feliratkulcsból, három nyelven (hu · ro · en), a `feliratok.json`-ban; új kulcs a lap előtagjával.
- **Halott vezérlő tilos** — csak az rajzolható, aminek a 2. pontban gépezete van.
- Asztali 1440 és telefon 390, vízszintes görgetés nélkül.
- Egyszerű magyar, kb. 10. osztályos szinten. **Nem szerepelhet:** token, API, költség dollárban a tagnak, „hívás”.
  A szó: **kredit**.
- Egy fő művelet lapon.

## 2. A gépezet — ebből rajzolhatsz

| Mi | Végpont | Ki |
|---|---|---|
| A saját hírszűrésem: `fokozat` = `nagyon_szigoru` · `kozepes` · `laza`; `eloszures` = be/ki. Alap: nagyon szigorú + be. | `GET/PUT /api/hirfigyelo/sajat-szures` | minden tag, a saját fiókjára |
| A saját kreditem ebben a hónapban: havi összeg, elhasznált, maradt; mire ment el (hírek · posztszöveg · Iránytű · egyéb) | `GET /api/kredit/sajat` | minden tag |
| A munkatér kreditje: havi összeg, kiosztott, ki nem osztott; tagonként: név, szerep, havi összeg (**külön megadott** vagy **egyenlő rész**), elhasznált, maradt | `GET /api/kredit/tagok` | tulajdonos |
| Egy tag havi kreditjének megadása (szám), vagy vissza „egyenlő részre” | `PUT /api/kredit/tagok/{fiok}` | tulajdonos |
| Egy munkatér havi kreditje | `PUT /api/kredit/munkater/{szervezet}` | rendszergazda |
| Ha egy tag kreditje elfogyott, minden AI-művelete ezt a hibát kapja: `KREDIT_ELFOGYOTT` | — | — |

**A három fokozat jelentése** (a lapon egy-egy rövid mondat kell hozzá):
- **Nagyon szigorú** — csak ami a te helyeden (pl. Marosvásárhelyen) történt, és a fő témája az egyik témád; vagy
  rólad, a cégedről szól.
- **Közepes** — a hely nem feltétel: az országos vagy külföldi hír is jöhet, ha a fő témája az egyik témád.
- **Laza** — az is jöhet, ami csak érinti az egyik témádat.

**Előszűrés:** bekapcsolva a gép csak azt olvassa el, amiben a téma szavai szerepelnek, és aminek a címe a témádba
vág. Kikapcsolva minden friss hírt elolvas neked — ez **kb. hétszer több kredit** (mérve 2026-09-22: 91 hírből
előszűréssel 8-at olvasott el).

**Mit nem rajzolj:** kreditvásárlás, fizetés, ár pénzben (nincs mögötte gépezet); a kiszűrt hírek listája
(Vilmos döntése: soha); a szűrés szavainak listája (a háttérben készül, nem szerkeszthető).

## 3. A négy lap

### R-13a · Saját fiók (R-3 v2) — új szakasz: „Hírek szűrése” és „Kreditjeid”
- A három fokozat választója, mindegyik mellett egy mondat (fent).
- Az előszűrés kapcsolója, egy mondattal a következményéről (több kredit).
- „Kreditjeid ebben a hónapban”: maradt / havi összeg, és mire ment el (legfeljebb 4 sor).
- Állapotok: alap (nagyon szigorú + be) · közepes + ki (a kredit-figyelmeztetéssel) · elfogyott kredit.

### R-13b · Tagok (R-2) — kredit a tagok mellett
- A munkatér havi kreditje, kiosztott / ki nem osztott.
- Tagonként: havi összeg (szám mező, vagy „egyenlő rész” jelölés), elhasznált, maradt.
- Egy tag visszaállítása „egyenlő részre”.
- A meghívásnál (a meghívólink mellett) nem kell kredit — az új tag magától egyenlő részt kap.
- Állapotok: mindenki egyenlő részen · egy tagnak külön összeg · egy tagé elfogyott · egyedül vagy a munkatérben.
- A szerkesztő és a néző ezt a részt **nem látja**.

### R-13c · Rendszergazda — a munkaterek havi kreditje
- A mai Költség lap (`/koltseg`, rendszergazdai nézet) munkaterenként mutatja a valódi költséget és a keretet
  dollárban. Ide kell munkaterenként a **havi kredit** (szám mező) és az elhasznált kredit. A dolláros oszlopok
  maradnak (ez a mi belső nézetünk).

### R-13d · Kezdőlap (R-12) — az üzemállapot-sor és az elfogyott kredit
- A mai sor: „AI-keret: 4,57 € maradt” → helyette a **saját** kredit: „Kreditjeid: 312 / 500 ebben a hónapban”.
- Elfogyott kreditnél egy teendő-sor a Kezdőlapon (másodlagos gombbal a Saját fiókra), és az AI-gombok alatt
  (Posztszöveg, Iránytű, Hírek „Futtatás most”) egy mondat: „Elfogyott a kredited ebben a hónapban — szólj a
  munkatér tulajdonosának.” Rajzold meg legalább a Posztszöveg és a Hírek esetét.

## 4. Amit visszakérünk

- A négy lap `.dc.html`-ként, asztali + telefon, az állapotokkal.
- `feliratok.json` (hu · ro · en) az új kulcsokkal.
- `kerdesek.md`, ha valamihez nincs gépezet, vagy döntés kell Vilmostól.
