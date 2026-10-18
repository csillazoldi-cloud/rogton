# Feladat — FORDÍTOTT ELLENŐR (E-29): a közös darabok kiemelése — keresd a HIBÁT, ne dicsérj

Két darab került ki a webalkalmazás belsejéből közös csomagba, hogy a MÁSODIK host (referencia-host) ne másoljon:
1. **`@km/letolto`** — a letöltő (SSRF-védelem, robots.txt, RSS/Atom). Eddig `apps/web/letoltes/index.ts` volt, `import "server-only"`-lal; a csomagban ez a sor kikerült,
   minden más VÁLTOZATLAN. Használja: a webalkalmazás onboardingja és hírfigyelője, valamint a referencia-host.
2. **`@km/news-monitor-feliratok`** — a modul 189 felirata három nyelven, JSON-adatfájlokban. Eddig CSAK adatbázis-migrációban éltek (0030, 0031). Mostantól az adatfájl a
   forrás, és abból KÉSZÜL a migráció (`tools/feliratok/general.mjs` → 0032, `ON CONFLICT … DO UPDATE`). Egy próba őrzi, hogy az adatbázis és az adatfájl egyezzen.

Mellékletben: a két csomag forrása, a generátor, a felirat-szinkron próba, és a `hf.hu.json` első része.

Nézd végig ezeket, minden megállapításodhoz FÁJL és SOR:

1. **Vesztettünk-e viselkedést a letöltő áthelyezésével?** A `server-only` eltávolítása mit jelent: kerülhet-e ez a kód böngészőbe? (A webalkalmazás melyik hívási útján?)
   Van-e a csomagban bármi, ami csak Next alatt működött?
2. **A generált migráció** (`general.mjs`): helyesen kezeli-e az aposztrófot, a `\n`-t, az ékezetet és a `{}` helyőrzőket? Elronthat-e egy már élő feliratot?
   Mi történik, ha valaki egy kulcsot TÖRÖL az adatfájlból — eltűnik-e az adatbázisból is, és baj-e ez?
3. **A szinkron-próba** tényleg fog-e hibát, ha valaki kézzel átír egy feliratot a migrációban? Van-e olyan eltérés, amit ÁTENGED?
4. **A feliratok csomagja**: a `readFileSync` az `import.meta.url`-ből számolt útvonalról olvas — működik-e ez lefordított (bundle-elt) alkalmazásban, Docker-képben?
   Ha nem, mi a következménye és mi a javítás?
5. **A határőr új szabályai** (mellékelve): tényleg megfogják-e, ha a referencia-host a webalkalmazásból importál, vagy ha a letöltő csomag Next-et húz be? Van-e kiskapu?
6. **Bármi más, ami elromolhat**: körkörös függőség, két csomag ugyanazt a nevet exportálja, verziószámok, a `pnpm` munkatér beállítása.

Írj `docs/E-29-FORDITOTT-ELLENORZES-deepseek.md` néven TÖMÖR jelentést: **legfeljebb 15 sor**, minden sor MÁS megállapítás — ugyanazt mégegyszer leírni TILOS.
Alak: `SÚLYOS` / `KÖZEPES` / `APRÓ` + fájl:sor + mi a baj + mi lenne a javítás. A végén EGY mondat: mi az, ami tényleg működik.
Ha valamiről nem tudsz dönteni a mellékletből, írd oda, hogy „nem eldönthető”, és ne találgass. Ne írj kódot, ne dicsérj, ne ismételd a feladatot.
