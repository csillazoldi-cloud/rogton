Te egy TypeScript tesztíró vagy (vitest). A mellékelt `tema-nev-szuro.ts` egy kis modul a hírfigyelő magjában, a mellékelt
`beallitas-javaslat.proba.ts` egy meglévő próba ugyanebben a csomagban — ebből látod az importokat ("../src"), a környezet
(`Kornyezet`, `memoriaTar()`) felépítését és a `beallitasJavaslatKer` hívását. KÖVESD ezt a mintát.

Írj EGY új fájlt: `packages/news-monitor-core/probak/tema-nev-szuro.proba.ts`, ezekkel az esetekkel:
1. `temaCegnevbol("Tibor Térkő márka", "Tibor Térkő")` → true; ékezet és kisbetű nélkül is: `("tibor terko velemeny", "Tibor Térkő")` → true.
2. `temaCegnevbol("térkövezés", "Tibor Térkő")` → false; `temaCegnevbol("Tiborfalvi hírek", "Tibor")` → false (csak egész szóra illeszt).
3. `cegnevTemakNelkul` egy 4 elemű listán, amiből 2 a cég nevét tartalmazza → 2 marad, `kiesett: 2`.
4. `beallitasJavaslatKer`: a profil `{ nev: "Tibor Térkő" }`; a csonk AI ELSŐ hívásra 4 témát ad, mind „Tibor Térkő …” nevű;
   MÁSODIK hívásra 4 szakmai témát („térkövezés”, „udvarfelújítás”, „építőanyag-árak”, „útfelújítás”). Elvárás: a tervezet
   témái között nincs olyan, amelyik tartalmazza a „Tibor Térkő” nevet, és legalább 3 téma van; az AI-t pontosan 2-szer hívta.
5. Ugyanez, de az első válasz már jó (5 szakmai téma): az AI-t pontosan 1-szer hívja.

A csonk AI a `"hf_beallitas_javaslat"` feladatra `{ ok: true, valasz: { beallitas: {...} } }`-t ad, ahol a beállítás minden mezője
érvényes (nézd meg a mellékelt próbában, milyen beállítás-objektumot használ). Kimenet:
=== FÁJL: packages/news-monitor-core/probak/tema-nev-szuro.proba.ts ===
...
=== FÁJL VÉGE ===
