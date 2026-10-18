# Feladat — FORDÍTOTT ELLENŐR (E-28): a referencia-host bekötése — keresd a HIBÁT, ne dicsérj

Egy MÁSODIK host készült el (`apps/referencia-host`) a hírfigyelő magjához (`@km/news-monitor-core`), hogy bebizonyítsuk: ugyanaz a mag két különböző rendszerben
fut, ügyfélspecifikus kód és MÁSOLÁS nélkül. A webalkalmazás hostja Next + Postgres; ez a host sima Node + SQLite-fájl, `profil.json`-ból vett profillal,
saját sorral és ütemezéssel.

Mellékletben a host TELJES kódja (`sqlite-tar.ts`, `utemezo.ts`, `napi.ts`, `kiszolgalo.ts`, `kornyezet.ts`, `ai.ts`, `beallitasok.ts`, `indit.ts`, `letolto.ts`)
és a mag szerződése (`MAG-API.md`, `tar.ts` — benne a memóriabeli tár, ami a VISELKEDÉS MÉRCÉJE).

A te dolgod NEM az, hogy megerősítsd, hogy jó. A te dolgod megtalálni, hol NEM az. Nézd végig ezeket, és minden megállapításodhoz add meg a FÁJLT és a SORT:

1. **Eltér-e az SQLite-tár viselkedése a memóriabeli tártól** bármelyik metódusban? (sorrend, `"uj"`/`"letezik"`, üres lista, több szervezet, lejárat-törlés,
   a tervezet `null`-ja, a verziólista cseréje). Konkrét ellenpéldát írj: milyen hívássorozat után térnek el.
2. **Van-e MÁSOLT üzleti logika a hostban?** A hostnak csak csatlakozót szabad adnia (tárolás, profil, AI, ütemezés). Ha bármelyik fájl olyan szabályt valósít meg
   újra, ami a magban már benne van (relevancia, deduplikáció, verziózás, jogosultság), az HIBA — nevezd meg.
3. **Van-e host-specifikus elágazás vagy „ha referencia-host, akkor…” a magban?** (A mellékelt magbeli fájlban keresd; a hostnak nem szabad látszania a magban.)
4. **Sor és ütemező:** elveszhet-e tétel? Beragadhat-e „fut” állapotban örökre? Két párhuzamos kör futhat-e egyszerre? A `FUT_MAR` őr kijátszható-e?
   A napi esedékesség számítása helyes-e nyári/téli időszámítás váltáskor és éjfél körül?
5. **Kiszolgáló:** van-e útvonal, amely kivételt dobhat és ledöntheti a folyamatot? Kiszivárog-e belső részlet a hibaválaszba? A törzsméret-korlát tényleg megáll-e
   64 kB-nál? Helyesek-e a HTTP-kódok a mag hibakódjaihoz képest?
6. **AI-csatlakozó:** a mag `AiHivo` szerződését pontosan tartja-e (hibakódok, `becsult_usd`)? A teszt-AI válasza megfelel-e a mag séma-ellenőrzésének
   (`hf_relevancia`: fontossag/temacimke/miert/indoklas/osszefoglalo)? Az ollama-ág elhallgat-e valamilyen hibát?
7. **Beállítások:** rossz vagy hiányos `profil.json` esetén a host beszédesen áll-e le, vagy csendben rosszul indul? Útvonal-feloldás: kerülhet-e fájl váratlan helyre?
8. **Bármi más, ami elromolhat éles használatban** (fájlzárolás, egyidejű írás, a WAL-fájlok, a folyamat leállítása futás közben).

Írj `docs/E-28-FORDITOTT-ELLENORZES-deepseek.md` néven egy TÖMÖR jelentést: minden megállapítás egy sor — `SÚLYOS` / `KÖZEPES` / `APRÓ` + fájl:sor + mi a baj +
mi lenne a javítás. A végén EGY mondat: mi az, ami tényleg működik. Ha valamiről nem tudsz dönteni a mellékletből, írd oda, hogy „nem eldönthető”, és ne találgass.
Ne írj kódot, ne írj dicséretet, ne ismételd a feladatot.

## FONTOS — a jelentés alakja

LEGFELJEBB 15 sor. Minden sor MÁS megállapítás; ugyanazt a hibát MÉGEGYSZER leírni tilos. Ha nincs 15 megállapításod, írj kevesebbet — 5 valódi hiba többet ér
30 ismétlésnél. A `sqlite-tar.ts` `mentesUpsert`-jét NE elemezd (már ellenőrizve): az `ON CONFLICT ... DO UPDATE SET adat = excluded.adat` csak az adatot írja,
a `sorszam` érintetlen marad. A súlypont: `utemezo.ts`, `napi.ts`, `kiszolgalo.ts`, `ai.ts`, `kornyezet.ts`, `beallitasok.ts`, `indit.ts`.
