# Ellenőrzés — R-5 · Csomag, Kimenő értesítések, AI-kapcsoló (a Design csomagja, „Onboarding felület prototípus11.zip", 2026-09-13 10:49)

Mérve az `atado/` csomagon (python a `feliratok.json`-on és a `.dc.html` törzsén; `_artboardok.mjs` a képekhez; a gépezet a kódból). Minden szám mérés.
Ez az **utolsó rajzkör**; a kérés: `design/DESIGN-KERES-R5.md`.

## 1. Összegzés

**Hibátlan, beépíthető.** 7/7 artboard, 0 pixel-térköz, 69 kulcs három nyelven hiánytalanul (ebből 25 az `esemeny.<fajta>_cim`, ami már a rendszerben van —
a rendszeré a hiteles, azok elmaradnak; 44 új), új token nincs. Minden kattintható elem mögött létező végpont áll; a rajzhoz kért egy mező (`bekotve`) már
megépült a kérés napján. A Design mind a három kérdésre a kérésnek megfelelő, indokolt döntést adott.

## 2. A mérés

| Mit | Eredmény |
|---|---|
| Artboardok | **7/7** (01 Gépház tulajdonos · 02 Gépház rendszergazda · 03 Kimenő lap tulajdonos · 04 Kimenő lap rendszergazda · 05 AI-kapcsoló A/B · 06 hírfigyelő kikapcsolt AI-val · 07 telefon A/B) |
| px-térköz a rajz törzsében | **0**; hex 18 — mind a `:root` |
| Feliratkulcsok | **69**, mind három nyelven; **25 már megvan** (`esemeny.*_cim`) → **44 új** (`csomag.*` 6, `kimeno.*` 31, `ai_kapcsolo.*` 8) — a 0060 + 2 kiegészítő (oldalcím, mentés hibája) |
| Tokenek | új nincs; a rajz öt olyan tokent használ, ami az R-4-ben nem volt — mind létezik (`--fs-metric`, `--tile-min`, `--ok-bg`, `--ok-strong`, `--btn-pad-x`) |
| Végpont-megfelelés | Csomag ← `GET /api/csomag` ✔ · Kimenő ← `GET /api/ertesites` (+ `bekotve` ✔ megépült 10:40), `PUT /api/ertesites` (tulajdonos), `PUT /api/ertesites/kozos` (rendszergazda) ✔ · AI-kapcsoló ← `GET/PUT /api/beallitas/ai` ✔ · a hírfigyelő sávja ← `ai_engedelyezve` (**a lap adatforrásába épül**, F-7b) |
| Ami a rajzon jelölten nem működik | az „Árazás és fizetés" sor (kapcsoló nélküli jelölés — a jelölés-nyelv harmadik alakja) és a felhő-kapcsoló (R-4-ből) — mindkettő mondattal |
| Ami nincs a rajzon | csomagváltás, ár, fizetés, számla (D-F35) ✔ |
| A rajz megnyitása | hálózat kell (Google-betűk) + `support.js` a rajz mellett — az átadó kimondja |

## 3. A Design kérdései — válaszok

| # | Kérdés | Válasz |
|---|---|---|
| 4 | A `bekotve` munkatérre vagy rendszerre vonatkozik? | **Rendszerszintű** — a horog címe a NAS `.env`-jében áll; a rajz jól mutatja. Munkatérenkénti horog nincs a tervben. |
| 5 | Az „örökli" állású sor vele mozdul-e a közös alappal? | **Igen** — a hatásos érték a mentéskor nem rögzül, a közös alapból származik (`hatasosErtesites`). A lap szövege ezt mondja. |
| 6 | Kell-e a kimenő üzenetek naplója? | Végpont nincs; a `feljegyez()` visszaadja, kiment-e (`kikuldve`, `kuldesHiba`), de nem tárolja. **Most nem épül** — TEENDŐ (T-27), ha a pilotban kell. |
| 7 | A háromállású választó billentyűvel | `role="radiogroup"`, nyilakkal léptethető — a kódolásé, megépül. |
| 8 | A 25 fajta címe | a rendszerben megvan (`esemeny.<fajta>_cim`, 0048/0057) — **a rendszeré a hiteles**, a rajz 25 kulcsa elmarad. |
| 9 | `esemeny.<fajta>_szoveg` | a kimenő üzenet mondata, a felületen nem jelenik meg — megvan a rendszerben, nem kell a rajzhoz. |

## 4. Döntések ebből (D-F36)

A Kimenő értesítések lapja `/gephaz/kimeno` (a Gépház alatt, mint a Theme és a Feliratok); szerkesztőnek és nézőnek nem jár (a Gépház sem). A Csomag csempe a
tulajdonos rácsának első helyén, hivatkozás nélkül. Az AI-kapcsoló doboza az Adatpolitika fül jobb oszlopában, a felhő-kapcsoló FÖLÖTT (ami működik, előbb). A
kikapcsolt AI állapota `--warn` (nem hiba). A hírfigyelő áttekintőjének válasza `ai_engedelyezve` mezőt kap, a sáv abból él; a hivatkozás csak tulajdonosnak.
A kimenő üzenetek naplója T-27.

## 5. Javaslat

**Beépíthető.** F-7b: a két csempe a Gépházon (mindkét nézet), a Kimenő lap (két nézet), az AI-kapcsoló doboza, a hírfigyelő sávja, 0060 feliratok, próbák, képek a 7 artboard mellé.
