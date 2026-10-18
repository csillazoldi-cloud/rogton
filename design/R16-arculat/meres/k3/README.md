# R-16 K3 — a „Logó, színek, betűk” szakasz (12a · 12b · 12c) helyben végigjátszva (2026-09-30)

Helyben: Postgres 16 a 0000–0136 migrációkkal, `next start` (a k-k3 ág buildje), a képgyártó Chromium 1194-gyel, Playwright 1440 × 900
és 390 × 844. Az AI szándékosan nem érhető el (`helyi-ollama` → 127.0.0.1:9), így a háttérben futó arculat-javaslat NEM ír tervezetet —
ez a „a gép nem talált semmit” eset (12a). A T-szabályokat a `tools/tibor-proba` saját mérője (`MERO_JS` + `ertekel`) mérte; az
eredmény: `tibor-meres.json` — **9/9 lapnézet zöld** (a Tibor-bíráló — gemma a Dellen — innen nem érhető el, az nem futott).

| Kép | Mit mutat |
|---|---|
| `12a-asztali.png`, `12a-telefon.png` (+ `-teljes`) | Friss „Cipó Pékség” („Pékség … kovászos kenyér”), tervezet nélkül: „Kezdjük a logóddal”, a **Meleg** szett (#a4471f · #e3a857 · #fbf3e8), Gelasio „Klasszikus” / Public Sans „Tiszta”; a két kép a Meleg színekkel (POST-os előnézet), nem szürke. Telefonon a Logó sor nincs (a rajz szerint), a fő gomb alul. |
| `12a-asztali-reszletek.png`, `12a-asztali-fajlok.png` | A Részletek (képvilág, követendő, kerülendő, lekerekítés — mentés = jóváhagyás) és a Fájlok (kézikönyv, minták, dokumentumok, logó nélkül). |
| `kepek-cipo-alapszett-{vilagos,szines}.png` | A Képek lap GET-je ugyanerre a munkatérre, tervezet nélkül: már a Meleg szettel (a `kepArculat` alapszettje). |
| `12c-cipo-asztali.png`, `12c-cipo-telefon.png` | „Így jó, logó nélkül” után — újratöltés nélkül (mérve: a lapra tett jel megmaradt) — „Így készülnek a képeid”, ✓ „Jóváhagyva.”; a pillanatkép: Meleg, `szin_forras = szett`, `szin_szett = meleg`, betűk gelasio · public-sans. |
| `kepek-cipo-jovahagyva-szines.png` | A Képek GET-je a jóváhagyás után: ugyanazok a színek. |
| `12b-asztali.png`, `12b-telefon.png` (+ `-teljes`) | Kövesi-szerű munkatér, a 12f-en feltöltött négy logóval (a gép besorolta: világos · sötét · egy színnel · négyzetes), tervezet nélkül: „Jól ismer a gép?”, a Természetes szett (a szakmából); alcím és „Honnan?” NINCS, mert a honlap címe ismeretlen (TERV §4 15.). |
| `12b-asztali-masik-minta-{akcio,hir}.png` | „Másik minta”: 7 kattintás = 7 különböző kép (kesz → akcio → uj → hir → tudtad → esemeny → szam → kesz). |
| `12c-kovesi-asztali.png`, `12c-kovesi-telefon.png`, `12c-kovesi-asztali-reszletek.png` | „Igen, ez mi vagyunk” után: a Logók sorban a négy hely a saját próbahátterén; Részletek: „<idő> · <jóváhagyó>” és „jóváhagyás visszavonása”. |
| `12c-nezo-asztali.png` | Néző ugyanabban a munkatérben: Csere nélkül, fő gomb „Kép készítése”; a jóváhagyó végpont neki 403 NINCS_JOG. |

Telefonon (390): vízszintes görgetés nincs (scrollWidth 390); a fő gomb 52 px, a lap alján (772–824); a Visszajelzés (706–752) a fő gomb
fölött, semmit nem takar — a rajz telefonos kerete szerint csak a tartalom görög, a Visszajelzés sávja fölött véget ér.
A képek a tesztlogók gépi rajzaival készültek (nem valódi Kövesi-logó). A képeken a szöveg még egy betűvel (a cím-betűvel) készül — a két betű a K5.
