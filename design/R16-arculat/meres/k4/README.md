# R-16 K4 — „Színek — javaslatok” (12d) és „Más színt” (12d2) helyben végigjátszva (2026-09-30)

Helyben: Postgres 16 a 0000–0137 migrációkkal (külön `km_k4` adatbázis), `next start` (az l-k4 ág buildje, :3014), a K3 képgyártója
(:8603, Chromium 1194), Playwright 1440 × 900 és 390 × 844. Az AI szándékosan nem érhető el (`helyi-ollama` → 127.0.0.1:9), így az
onboarding háttérben futó arculat-javaslata nem ír tervezetet. A T-szabályokat a `tools/tibor-proba` saját mérője (`MERO_JS` + `ertekel`)
mérte; az eredmény: `tibor-meres.json` — **5/5 lapnézet zöld** (12d asztal + telefon, 12d2 asztal a Fő és a Második fülön, 12d2 telefon).
A Tibor-bíráló (gemma a Dellen) innen nem érhető el — az nem futott.

A munkatér: „Kövesi Térkő Kft.” (térkövezés, burkolás), EGY logóval, amelyet a régi módon (a K1 előtti úton, elemzés NÉLKÜL — mint Csilla
`spotlight-01.png`-je) töltöttünk fel: az `arculat_fajl.elemzes` NULL. A logó gépi teszt-rajz (zöld jel, arany négyzet), nem valódi logó.

| Kép | Mit mutat |
|---|---|
| `12d-asztali.png` | Jóváhagyás előtt: négy kép („Kész munka”, színes változat, ugyanaz a szöveg), elöl a mostani **Természetes ✓** (a szakmából jött alapszett), kijelölve; a böngésző megnézte az elemzés nélküli logót → a második a **„A logódból”**; utána a hangulatok: Megbízható, Elegáns. Fő gomb „Ez legyen”, halk „Más színt”, „Mégse”. |
| `12c-termeszetes-asztali.png` | A mostanira „Ez legyen” (1 kattintás) → 12c, újratöltés nélkül; az adatbázisban 1. verzió jóváhagyva, `#2f5d50`, `szin_szett = termeszetes`. |
| `12d-asztali-megbizhato-kijelolve.png`, `12c-megbizhato-asztali.png`, `kepek-megbizhato-szines.png` | Megbízható kijelölve → „Ez legyen” → 12c sötétkékkel; 2. verzió `#1f3a5f`, `megbizhato`; az 1. pillanatkép változatlan (`#2f5d50`). A Képek GET-je ugyanaz a sötétkék. |
| `12d2-asztali-fo.png` → `12d2-asztali-fo-narancs.png` | „Más színt” (a kijelölt Megbízhatóval indul) → Fő fül; a gyűrű 12 gombja; a narancsra (`#c2410c`) mindkét kép új képet kapott (mérve: mindkét `img` új blob-URL). |
| `12d2-asztali-masodik.png` | A Második fül: a cím „Melyik legyen a második szín?”, a cím `?ful=masodik`. „Ez legyen” → `12c-narancs-asztali.png`: 3. verzió, fő `#c2410c`, `szin_forras = sajat`, három pillanatkép. |
| `12d-telefon.png` (+ `-teljes`) | 2 × 2 (158 × 198), a mostani (a 12d2-ben választott saját színek — a legközelebbi szett neve, „Játékos ✓”) és egyetlen „A logódból”; a fő gomb a lap alján (772–824), a Visszajelzés (706–752) fölötte, semmit nem takar; `scrollWidth` 390. |
| `12d2-telefon.png` (+ `-teljes`) | Cím → a két kép (150 + 104) → fülek → „A logódból:” → a gyűrű (170 / 30) mellette „Más szín:” és „Mégse”; a fő gomb alul. |

Mérve a 12d telefonos képén (első futás): a 12d2-ben választott saját színek is „A logódból” címkét kaptak (TERV §2-K4 1. szabálya),
és így két „A logódból” kártya állt egymás mellett. Javítva: ha a logóból rakott összeállítás ismert és nem a mostani, a mostani a
legközelebbi szett nevét kapja (próba: `packages/arculat-core/probak/szin-javaslat.proba.ts`). A fenti képek már a javítás utániak.
