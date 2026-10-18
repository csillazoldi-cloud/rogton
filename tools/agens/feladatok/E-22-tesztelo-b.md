# Feladat — TESZTELŐ (E-22): a háttérfutás élő próbái + a helyi csatlakozó egységpróbája

Mellékelve: a meglévő `hirfigyelo.proba.ts` (E-20 — ezt kell ÁTÍRNOD az új, sorba tett futásra) és a `segedek.ts`; a szerződés.
Az E-22 után: `POST /api/hirfigyelo/futas {proba}` → **202** `{ hirfigyelo: { sor: { id, allapot: "var", fajta: "futas", … } } }`; a futtató 5 mp-enként
vesz ki egy tételt; `GET /api/hirfigyelo/futas/sor/{id}` → `{ hirfigyelo: { sor } }` (`allapot`: var → fut → kesz | hiba; `eredmeny.futas_id` a kész futás);
`GET /api/hirfigyelo/futas` → a futások listája (a `futas_id`-vel); `GET attekintes` → `sorban` (a szervezet var/fut tétele vagy null); második beküldés,
amíg az első var/fut → 409 `FUT_MAR`; `POST ertekeles-ujra` → 202. Minden más útvonal változatlan.

2. Új `packages/ai-adapters/probak/ollama.proba.ts` (vitest; ha a csomagban nincs `vitest.config.ts`/`proba` script, add vissza azokat is a `package.json`-nal —
   devDependency vitest 5.0.0): a `fetch` globálist `vi.stubGlobal`-lal helyettesítve: (a) jó válasz `{ message: { content: "{\"a\":1}" }, prompt_eval_count: 10, eval_count: 5 }` →
   `szoveg` és a mérés tokenjei; (b) HTTP 500 → `AiHiba` `AI_NEM_ELERHETO`; (c) üres `content` → `AI_ROSSZ_VALASZ`; (d) **egyszerre egy**: két párhuzamos `hiv` — a hamis fetch
   naplózza a kezdés/vég sorrendjét (egy `await new Promise(r => setTimeout(r, 30))` a válasz előtt) → a második csak az első vége után kezdődik; (e) `ollamaElerheto` a `/api/tags`
   válaszból a modellneveket adja. Az importok: `import { ollamaSzolgaltato, ollamaElerheto } from "../src/index"` (a nevek rögzítettek).
3. A mag `futas.ts` új `esedekes(idozites, utolsoKezdet, most)` függvényére 4 eset a `packages/news-monitor-core/probak/futas.proba.ts` VÉGÉRE (add vissza az egész fájlt — mellékelve):
   kezi → hamis; napi 07:00 Bucharest, most 2026-09-07T05:00Z (08:00 helyi), utolsó null → igaz; utolsó ma 04:10Z → hamis; most 03:00Z (06:00 helyi, még nem múlt el) → hamis.


Add vissza a fájlokat külön blokkban, teljes tartalommal. Ne írj `src` kódot.
