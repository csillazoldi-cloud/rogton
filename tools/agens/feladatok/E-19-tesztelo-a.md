# Feladat — TESZTELŐ (E-19): egységpróbák a Hírfigyelő magjához — a SPEC alapján, a kód ISMERETE NÉLKÜL

Mellékelve: `HIRFIGYELO-SZERZODES.md` (a SPEC, 2.1–2.11) és mintának egy meglévő próbafájl részlete (`feliratok.proba.ts` eleje — a
vitest stílusához: `describe`/`it`/`expect`, magyar nevek, sorszámozott esetek). Az építő PÁRHUZAMOSAN írja a kódot ugyanebből a
specből — te a spec szerinti NEVEKET és ALAKOKAT használd (`import { … } from "../src/index"`), így a próbák a kész kódra illeszkednek.

Írd meg a következő fájlokat a `packages/news-monitor-core/probak/` mappába (vitest, tiszta egységpróbák, nincs hálózat/DB; a
`most` mindig rögzített `new Date("2026-09-07T10:00:00Z")`, az `idAdo` számláló):

1. `beallitas.proba.ts` — ellenőrzés (hiányzó cél/téma → hibakód `required`/`too_short`; túl hosszú → `too_long`); normalizálás (trim, egyediség, rendezés);
   **változatlan mentés nem ad új verziót** (`ujVerzio` → `uj: null`, lista változatlan); új tartalom → verzió max+1, az előző `korabbi`; `visszaallit` → új aktív verzió `eredet: "visszaallitas"`; nem létező verzió → `null`.
2. `forras.proba.ts` — `forrasCimOsztalyoz`: facebook.com / m.facebook.com / instagram / x.com → `nem_tamogatott`+`belepes_mogott`; `http://localhost`, `http://192.168.1.5`, `ftp://…` → `nem_nyilvanos`; „nem url" → `ervenytelen`; `https://pelda.hu/feed` → `rss`; `https://pelda.hu/hirek` → `null` tipus, `ellenorzes_alatt`.
   `kanonikusUrl`: utm_ és fbclid ki, töredék le, paraméterek rendezve, záró / le, gazda kisbetűs; hibás → Error. `forrasEllenorzesEredmeny`: hasznalhato / korlatozott / hibas + `utolso_sikeres`; AI-javaslat ellenőrzés előtt `ellenorzott: false`.
3. `kivonat.proba.ts` — 8000 felett vág szóhatáron és `csonkolt: true`; alatta `csonkolt: false`; `lejar` = +30 nap; `ujjlenyomat` determinisztikus, a kisbetű/írásjel-eltérés nem változtat rajta, más szöveg más ujjlenyomat; `kivonatLejart`.
4. `talalat.proba.ts` — `megtekint`; `jelol("mentett")` megtekintetté is tesz; a nem elrejtett önmagában nem új; `szuro` négy módja; `cikkKulcs`.
5. `dedup.proba.ts` — `gyanusPar`: azonos ujjlenyomat → igaz; hasonló cím 72 órán belül → igaz; hasonló cím 5 nap különbséggel → hamis; más cím → hamis. `esemenybeSorol`: 3 kivonat, ebből 2 ugyanarról (az `ugyanaz` tiszta függvény igazat ad rájuk) → 2 esemény, az egyikben 2 kivonat; meglévő eseményhez bővít; determinisztikus (kétszer futtatva ugyanaz).

Add vissza az 5 fájlt (1–5) külön blokkban (`=== FÁJL: packages/news-monitor-core/probak/… ===`). Ne írj kódot a `src`-be. Ha a spec valahol nem egyértelmű, a próbát a spec szó szerinti szövege szerint írd, és jelöld `// SPEC-KÉRDÉS:` megjegyzéssel.
