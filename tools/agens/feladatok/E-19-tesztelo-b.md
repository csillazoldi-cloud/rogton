# Feladat — TESZTELŐ (E-19): egységpróbák a Hírfigyelő magjához — a SPEC alapján, a kód ISMERETE NÉLKÜL

Mellékelve: `HIRFIGYELO-SZERZODES.md` (a SPEC, 2.1–2.11) és mintának egy meglévő próbafájl részlete (`feliratok.proba.ts` eleje — a
vitest stílusához: `describe`/`it`/`expect`, magyar nevek, sorszámozott esetek). Az építő PÁRHUZAMOSAN írja a kódot ugyanebből a
specből — te a spec szerinti NEVEKET és ALAKOKAT használd (`import { … } from "../src/index"`), így a próbák a kész kódra illeszkednek.

Írd meg a következő fájlokat a `packages/news-monitor-core/probak/` mappába (vitest, tiszta egységpróbák, nincs hálózat/DB; a
`most` mindig rögzített `new Date("2026-09-07T10:00:00Z")`, az `idAdo` számláló):

6. `futas.proba.ts` — `indithato`: `fut` állapotú mellett hamis (dupla indítás tiltva); átmenetek: kezd → fut; forrás-hiba gyűjt; vége minden forrás hibás → `hiba`; egy hibás → `reszleges`; AI-hiba → `ai_fuggoben`; hibátlan → `kesz`; `utolsoSikeres` a `kesz`/`reszleges` közül a legkésőbbi, üres → null (**a mentés nem futás**: egy verzió-mentés után is null);
   `kovetkezoFutas`: `kezi` → null; `napi` 07:00 Europe/Bucharest, `most` = 2026-09-07T10:00Z (13:00 helyi) → 2026-09-08T04:00Z; `most` = 2026-09-07T03:00Z (06:00 helyi) → 2026-09-07T04:00Z.
7. `minta.proba.ts` — `mintaLejart`; `osszehasonlithato`: lejárt → `{ok:false, ok_kod:"lejart"}`, hiányzó kivonat → `hianyos`; `osszehasonlitas` előrébb/hátrébb/változatlan.
8. `visszajelzes.proba.ts` — `okok` max 4 (5 → séma hiba); `javaslatAlkalmazhato` csak az aktív verzióra és csak függő/kipróbált; `javaslatDontes`; a visszajelzés önmagában nem ad verziót (a `verziok` lista változatlan marad).
9. `ai.proba.ts` — `aiValaszEllenoriz("hf_relevancia", …)`: jó válasz ok; ismeretlen `fontossag` → `AI_ROSSZ_VALASZ`; `hf_osszkep` nem létező találat-hivatkozás kiesik, ha egy sem létezik → hiba; `promptAdatBlokk` tartalmazza az ADAT-jelölést és csonkoltnál a „Részlet, nem a teljes cikk" szöveget; a hírszövegbe írt „utasítás" változatlanul, jelölt blokkban marad (nem kerül a jelölésen kívülre)
10. `host-tar.proba.ts` — `jogosult`: néző csak `nez`; tulajdonos/szerkesztő mind. `memoriaTar`: `kivonatMent` ugyanarra a cikk-kulcsra másodszor `"letezik"` (A-10 magja); két szervezet adata nem keveredik; `lejartKivonatokTorol` csak a lejártakat.

Add vissza az 5 fájlt (6–10) külön blokkban (`=== FÁJL: packages/news-monitor-core/probak/… ===`). Ne írj kódot a `src`-be. Ha a spec valahol nem egyértelmű, a próbát a spec szó szerinti szövege szerint írd, és jelöld `// SPEC-KÉRDÉS:` megjegyzéssel.
