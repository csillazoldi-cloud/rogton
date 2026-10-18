# Feladat — TESZTELŐ (E-7): próbák a letöltőre, az AI-rétegre és az összefoglalóra

Vitest 5, Node 24. Két próbafájlt adj vissza:

## 1. `apps/web/probak/letolto.proba.ts` — EGYSÉGPRÓBÁK, alkalmazás nélkül
Import: `import { cimNormalizal, nyilvanosCim, weboldalSzoveg, LetoltesHiba } from "../onboarding/letolto";`
(a modul elején `import "server-only"` van — a vitest beállításban ezt egy üres modulra kell irányítani:
`resolve: { alias: { "server-only": new URL("./probak/ures.ts", import.meta.url).pathname } }` → adj vissza egy
`apps/web/probak/ures.ts` fájlt is, üres `export {}`-vel, és add vissza a frissített `apps/web/vitest.config.ts`-t,
amely a meglévő beállítást (`include: ["probak/**/*.proba.ts"]`, `testTimeout: 20000`, `fileParallelism: false`) megtartja).
Esetek:
- `cimNormalizal("mintamuhely.hu")` → `https://mintamuhely.hu/`; `"ftp://x"` és `"nem cím"` → `LetoltesHiba` `FORRAS_ROSSZ_CIM`
- `nyilvanosCim(new URL("http://127.0.0.1/"))`, `http://10.1.2.3/`, `http://192.168.1.1/`, `http://169.254.1.1/`,
  `http://100.89.241.71/`, `http://localhost/`, `http://[::1]/`, `http://[fd00::1]/` → mind `FORRAS_TILTOTT_CIM`
- helyi HTTP-kiszolgáló (`node:http`, 127.0.0.1, véletlen port) — mivel a 127.0.0.1 tiltott, a `weboldalSzoveg` ellen a
  szűrő ÁTUGRÁSÁVAL kell tesztelni? NEM: ehelyett teszteld, hogy `weboldalSzoveg("http://127.0.0.1:<port>/")` `FORRAS_TILTOTT_CIM`-mel
  bukik (a kiszolgáló meg sem kapja a kérést — számold a kéréseket, legyen 0)
- a szövegkinyerést egy exportált segéddel teszteld, ha van; ha a modul nem exportál ilyet, hagyd ki és jelezd a válaszodban
  10 sorban

## 2. `apps/web/probak/osszefoglalo.proba.ts` — HTTP-próbák futó alkalmazás ellen (`PROBA_CIM`, `DATABASE_URL` mint az E-6-ban)
Import a meglévő segédekből (`./segedek`: `keres`, `veletlenEmail`, `sql`, `takaritas`, `lezar`), az E-6 próbák mintájára
(fiók + szervezet létrehozása süti visszaadásával). A tesztkörnyezetben az `AI_SZOLGALTATO` = `teszt`.
Esetek:
- `POST /api/onboarding/osszefoglalo` leírással (`forras_tipus: "leiras"`, 200+ karakteres leiras) → 200,
  `forras === "teszt"`, `osszefoglalo` nem üres, `forras_tipus === "leiras"`
- ugyanez után az `ai_hivas` táblában a szervezethez EGY sor van `allapot='ok'`, `szolgaltato='teszt'` (SQL-lel)
- és az `ai_koltseg_honap` sorban az aktuális hónapra (`to_char(now(),'YYYY-MM')`) a `hivasok` ≥ 1
- weboldallal, tiltott címmel (`http://192.168.1.1/`) → 400, `hiba === "ERVENYTELEN_ADAT"`, `mezok.weboldal === "FORRAS_TILTOTT_CIM"`
- weboldallal, nem létező tartománnyal (`https://nincs-ilyen-tartomany-km-proba.example/`) → 502, `hiba === "FORRAS_NEM_ELERHETO"`
- üres forrással → 400 `ERVENYTELEN_ADAT`, `mezok.forras === "ures"`
- süti nélkül → 401

Szabályok: nincs `any`; `unknown` válaszok ellenőrizve; takarítás a végén. A feltételezett válaszalakot a mellékelt
szerződés (`OsszefoglaloValasz`) adja.
