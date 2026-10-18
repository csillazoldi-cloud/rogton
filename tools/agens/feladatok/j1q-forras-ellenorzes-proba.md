Te egy TypeScript tesztíró vagy. A mellékelt fájl (`futas-fek.proba.ts`) egy meglévő vitest-próba a hírfigyelő magjához:
ebből látod, hogyan kell környezetet (`Kornyezet`), memóriatárat (`memoriaTar()`), aktív verziót és forrást beállítani,
és hogyan kell `figyelesFuttat`-ot hívni. KÖVESD PONTOSAN ugyanezt a mintát (ugyanazok az importok a "../src"-ből).

A VISELKEDÉS, AMIT PRÓBÁLNI KELL (új, 2026-09-25):
A `figyelesFuttat` a letöltés előtt maga ellenőrzi azokat a forrásokat, amelyek `allapot: "ellenorzes_alatt"` állapotban
vannak, KIVÉVE ha `eredet: "ai_javaslat"` és `ellenorzott: false`. Az ellenőrzés a `k.letolto(f)`-et hívja: ha az
`ok: true` és `tipus: "rss"`, `szovegOlvashato: true`, a forrás `hasznalhato` lesz, és a futás a cikkeit feldolgozza.

Írj EGY új fájlt: `packages/news-monitor-core/probak/forras-ellenorzes-futaskor.proba.ts`, három esettel:
1. Egy `eredet: "kezi"`, `allapot: "ellenorzes_alatt"`, `ellenorzott: false` forrás: a futás után a tárban a forrás
   állapota `"hasznalhato"`, és a futás `uj_talalatok` értéke > 0 (a letöltő 2 cikket ad).
2. Ugyanez, de a letöltő `{ ok: false, hibaOk: "nem_elerheto" }`-t ad: a forrás `"hibas"` lesz, a futás állapota `"hiba"`.
3. Egy `eredet: "ai_javaslat"`, `ellenorzott: false`, `ellenorzes_alatt` forrás: a letöltőt NEM hívja a futás (számláld),
   és a forrás állapota `"ellenorzes_alatt"` marad.

A forrás objektum mezői (a `Forras` típus): id, cim, tipus, eredet, allapot, ellenorzott, utolso_sikeres, hiba_ok.
A tár metódusai: `k.tar.forrasMent(szervezetId, forras)`, `k.tar.forrasok(szervezetId)`, `k.tar.verziokMent(...)`;
a mellékelt fájl segédfüggvényét (aktív verzió + forrás beállítása) másold át és igazítsd.

Kimenet: a fájl teljes tartalma, így:
=== FÁJL: packages/news-monitor-core/probak/forras-ellenorzes-futaskor.proba.ts ===
...
=== FÁJL VÉGE ===
