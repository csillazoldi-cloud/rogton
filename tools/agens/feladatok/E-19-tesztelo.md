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
6. `futas.proba.ts` — `indithato`: `fut` állapotú mellett hamis (dupla indítás tiltva); átmenetek: kezd → fut; forrás-hiba gyűjt; vége minden forrás hibás → `hiba`; egy hibás → `reszleges`; AI-hiba → `ai_fuggoben`; hibátlan → `kesz`; `utolsoSikeres` a `kesz`/`reszleges` közül a legkésőbbi, üres → null (**a mentés nem futás**: egy verzió-mentés után is null);
   `kovetkezoFutas`: `kezi` → null; `napi` 07:00 Europe/Bucharest, `most` = 2026-09-07T10:00Z (13:00 helyi) → 2026-09-08T04:00Z; `most` = 2026-09-07T03:00Z (06:00 helyi) → 2026-09-07T04:00Z.
7. `minta.proba.ts` — `mintaLejart`; `osszehasonlithato`: lejárt → `{ok:false, ok_kod:"lejart"}`, hiányzó kivonat → `hianyos`; `osszehasonlitas` előrébb/hátrébb/változatlan.
8. `visszajelzes.proba.ts` — `okok` max 4 (5 → séma hiba); `javaslatAlkalmazhato` csak az aktív verzióra és csak függő/kipróbált; `javaslatDontes`; a visszajelzés önmagában nem ad verziót (a `verziok` lista változatlan marad).
9. `ai.proba.ts` — `aiValaszEllenoriz("hf_relevancia", …)`: jó válasz ok; ismeretlen `fontossag` → `AI_ROSSZ_VALASZ`; `hf_osszkep` nem létező találat-hivatkozás kiesik, ha egy sem létezik → hiba; `promptAdatBlokk` tartalmazza az ADAT-jelölést és csonkoltnál a „Részlet, nem a teljes cikk" szöveget; a hírszövegbe írt „utasítás" változatlanul, jelölt blokkban marad (nem kerül a jelölésen kívülre).
10. `host-tar.proba.ts` — `jogosult`: néző csak `nez`; tulajdonos/szerkesztő mind. `memoriaTar`: `kivonatMent` ugyanarra a cikk-kulcsra másodszor `"letezik"` (A-10 magja); két szervezet adata nem keveredik; `lejartKivonatokTorol` csak a lejártakat.

Add vissza a 10 fájlt külön blokkban (`=== FÁJL: packages/news-monitor-core/probak/… ===`). Ne írj kódot a `src`-be. Ha a spec valahol nem egyértelmű, a próbát a spec szó szerinti szövege szerint írd, és jelöld `// SPEC-KÉRDÉS:` megjegyzéssel.
