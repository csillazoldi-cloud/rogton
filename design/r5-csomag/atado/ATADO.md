# R-5 · Csomag, Kimenő értesítések, AI-kapcsoló — átadó

2026-09-13 · Aitmetica SRL · az **utolsó rajzkör** (R-2 → R-3 v2 → R-6 → R-4 → **R-5**)

## 0. A hiteles rajzfájl és a hálózat

A hiteles rajz: **`rajz/R5-csomag-kimeno-ai.dc.html`**. Egyetlen fájl, benne **hét artboard** (01–07).

**A megnyitásához hálózat kell** (a betűk a Google Fontsról), és a **`support.js` a rajz mellett kell** legyen — a csomag `rajz/` mappájában ott van.

Tokenkészlet: az R-1 v4 `:root`-ja + az R-4 hat tokenje. **Új token nem kell** — lásd `tokenek.md`. Beégetett érték a rajzon nincs.

## 1. A hét artboard

| # | Mi | Méret |
|---|---|---|
| 01 | Gépház, tulajdonos — a mai két csempe mellé **Csomag** és **Kimenő értesítések** | asztali 1440 |
| 02 | Gépház, rendszergazda — hat csempe; a két új a **közös alapról** szól | asztali 1440 |
| 03 | Kimenő értesítések lapja, **tulajdonos** — a 24 fajta öt csoportban, háromállású választóval | asztali 1440 |
| 04 | Kimenő értesítések lapja, **rendszergazda** — a közös alap, kapcsolóval; itt a 25. fajta is | asztali 1440 |
| 05 | Adatpolitika fül — az **AI-kapcsoló** doboza, **A:** bekapcsolva · **B:** kikapcsolva | asztali 1440 |
| 06 | A hírfigyelő kikapcsolt AI-val — a figyelmeztető sáv és a jelölt találatok | asztali 1440 |
| 07 | Telefon — **A:** a Gépház a két új csempével · **B:** a Kimenő lap, csoportonként összecsukva | telefon 390 |

## 2. A három kérdésre adott válasz

**1 · A kimenő lista háromállású választót kapott** (örökli · kimenő · nincs), nem két kapcsolót. Huszonöt sorral egyetlen szem-oszlop olvashatóbb, mint két egymás mellé állított vezérlő, és az „örökli" így a lista saját nyelvén látszik — nem egy jelölőnégyzet mögé rejtve, amit előbb ki kell pipálni ahhoz, hogy a másik vezérlő élővé váljon. A választó mellett ott a **közös alap** (csak olvasható) és az **ami érvényes** oszlop, hogy az öröklés következménye ugyanabban a sorban látszódjon.

**2 · A Csomag csempe a rács első helyén áll a tulajdonosnál.** Nincs benne tennivaló, de erre a kérdésre jön be az ember a Gépházba: mi az enyém, meddig. A tennivaló-csempék (Költség, Munkatér) utána következnek.

**3 · A Kezdőképernyő nem kap új jelzést a kikapcsolt AI-ról.** A hírfigyelő csempéje ma is tud „részleges futás"-t mutatni, és a 06. artboard sávja ott áll, ahol a hiány számít — a hírfigyelő lapján. Ha mégis kell, az egy sor a meglévő csempén, és új rajz nélkül megy.

## 3. Amit a rajz még eldöntött

**A Csomag csempének nincs „→"-ja** — ez az egyetlen ilyen csempe a rácsban. Nincs hova vinnie: a csomag ma nem állítható, a csempe a teljes mondanivalóját ott mondja el. A rajz jegyzete ezt ki is mondja, hogy a kódoláskor ne tűnjön hiánynak.

**Az „Árazás és fizetés" sor szaggatott keretes, kapcsoló nélkül.** A „még nem működik" jelölés eddig mindig egy kikapcsolt vezérlő mellett állt; itt nincs mit kapcsolni, ezért a jelölés a **sorra** kerül, a mondattal együtt. Ez a jelölés-nyelv harmadik alakja (az első a kikapcsolt kapcsoló, a második a nem szerkeszthető mező az R-3-ban) — ugyanaz a szín, keret és jelvény, vezérlő nélkül.

**A két AI-doboz egymás alatt áll a jobb oszlopban**, ebben a sorrendben: előbb a működő AI-kapcsoló, utána a készülő felhő-kapcsoló. A bal oszlop (a szolgáltató doboza) változatlan. A sorrend szándékos: ami működik, előbb.

**A kikapcsolt AI állapota nem hibaszínt kap, hanem `--warn`-t** — se a csempén, se a hírfigyelő sávján, se a találatok jelölésén. Ez állapot, nem hiba: a felhasználó kapcsolta ki.

**A `belepesi_kiserletek` sor a tulajdonos lapján nincs ott** (rendszerszintű esemény), csak a rendszergazdáén. Nem szürkén: egyáltalán nem — ugyanaz az elv, mint az előző négy rajzban.

**A horog címe sehol nem jelenik meg.** A lap csak annyit mond: be van kötve / nincs bekötve. A „nincs bekötve" állapot `--text-dim` színt kap, nem hibaszínt: nem hiba, csak nincs.

## 4. Halott vezérlő

Kattintható minden, aminek gépezete van: a két új csempe hivatkozásai, a kimenő lista választói és kapcsolói, a mentés, az AI-kapcsoló, a hírfigyelő sávjának hivatkozása, a csoportok összecsukása telefonon.

**Ami jelölten nem működik:** az „Árazás és fizetés" sor a Csomag csempén, és a felhő-kapcsoló (az R-4-ből, változatlanul).

**Ami nincs a rajzon, mert nincs mögötte gépezet:** csomagváltás, ár, fizetés, számla, kártya, próbaidő, lemondás (D-F35).

## 5. Feliratkulcsok

Új előtagok: **`csomag.*`**, **`kimeno.*`**, **`ai_kapcsolo.*`** — mind a három nyelven a `feliratok.json`-ban, a 25 `esemeny.<fajta>_cim` kulccsal együtt. A `csomag.pilot_nev` és `csomag.pilot_megj` a meglévő szöveggel áll, nincs duplázva.

A `rajz.*` kulcsok a rajz jegyzetei, **nem kerülnek a felületre**.
