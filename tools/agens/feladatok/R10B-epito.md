# Feladat — ÉPÍTŐ (R10B): forrás-ajánló ellenőrzött listából (nyelv + térség), és 8–12 téma-javaslat az első beállításhoz

Vilmos kérte (2026-09-16, R-10 rajz): az első beállítás átnéző lapján a „Mely oldalakat figyeljük" sor javasoljon oldalakat a tevékenység és a nyelv alapján, plusz 4–5 általánosat; a „Miről szeretnétek híreket" sor 8–12 választható témát javasoljon. Az oldal-ajánlás NEM AI-ból jön (az AI nem létező címeket talál ki), hanem egy ellenőrzött listából (mellékelve: `forras-lista.json` — ez a szerződés adata).

TypeScript 7 strict, zod 4.5, vitest, Next.js 16. `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===`. TELJES fájlok; RÉSZLET (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE`, a RÉGI szó szerint) a meglévőkhöz. A mag (`packages/news-monitor-core`) tiszta: nincs hálózat, adatbázis, React. Nincs `any`. Magyar azonosítók.

## Fájlok

### 1. TELJES: `packages/news-monitor-core/src/forras-ajanlo.ts` + a lista `packages/news-monitor-core/src/forras-lista.json` (a mellékelt fájl VÁLTOZATLANUL; a tsconfig `resolveJsonModule`-t a mellékelt tsconfig mutatja — ha nincs, a listát egy `forras-lista.ts`-be tedd `export const FORRAS_LISTA = [...] as const`-ként, ugyanazzal a tartalommal)
- Típus: `AjanlottForras = { cim: string; nev: string; nyelv: string; leiras: string; miert: "terseg" | "nyelv" | "altalanos" }`.
- `export function forrasAjanlo(be: { nyelvek: string[]; szoveg: string; nyelv: "hu" | "ro" | "en"; max?: number }): AjanlottForras[]` — tiszta függvény:
  - `szoveg` = a bemutatkozás + a tevékenység szövege; kisbetűsítve és ékezet nélkül (`normalize("NFD")` + a kombináló jelek törlése) keressük benne a lista `terseg` kulcsszavait (szintén ékezet nélkül).
  - Sorrend: (1) a felhasználó tartalomnyelvein (`nyelvek`) azok az oldalak, amelyeknek van térség-találata (`miert: "terseg"`), a találatok száma szerint csökkenően; (2) ugyanezeken a nyelveken az `altalanos: true` oldalak (`miert: "altalanos"`); (3) ha még kevesebb, mint `max` (alap 8), a többi nyelv térség-találatai (`miert: "nyelv"`). Ugyanaz a cím egyszer. `leiras` a kért `nyelv` szerint.
  - A lista `_megjegyzes` kulcsát figyelmen kívül hagyja.
- Próba `packages/news-monitor-core/probak/forras-ajanlo.proba.ts`: magyar nyelv + „marosvásárhelyi pékség" → az első találatok közt `maszol.ro`, `szekelyhon.ro`, `vasarhely.ro`; román nyelv + Kolozsvár → `stiridecluj.ro` elöl; ismeretlen térség → csak általánosak; `max` betartva; nincs ismétlés.
- Az `index.ts` exportálja (`export * from "./forras-ajanlo";`).

### 2. TELJES: `apps/web/app/api/hirfigyelo/forrasok/ajanlat/route.ts`
`POST`, `kapu(keres, "szerkeszto")` (a hírfigyelő `_kozos` mintája, mellékelve), törzs `{ nyelvek: string[]; szoveg: string }` (zod, `szoveg` max 6000) → `forrasAjanlo({ nyelvek, szoveg, nyelv: eredmeny.fiok.nyelv ?? "hu" })` → `{ hirfigyelo: { ajanlat: AjanlottForras[] } }`. Nincs AI, nincs adatbázis.

### 3. TELJES prompt: `packages/news-monitor-promptok/promptok/hf_beallitas_javaslat.hu.md` (mellékelve) — v-szám +1, dátum 2026-09-16: a „temak" szabálya: **8–12 téma** (a mainál több, rövid, 1–3 szavas nevek, a tevékenységhez és a városhoz kötve; az első 3–4 a legfontosabb); minden más marad szó szerint.

### 4. RÉSZLET: `_RESZLET-hangnem.md` (a mellékelt `onboarding/javaslatok.ts` részlethez és `api/onboarding/hangnem/route.ts`-hez): az `irany` értékei közé `"kockak"` is bekerül: ilyenkor a `megjegyzes` a jelölt kockák neve vesszővel (pl. „barátságos, nyugodt"), és a prompt-szöveg: „A hangnem ezekből a jelzőkből álljon össze: {megjegyzes}. Írj egy rövid hangnem-leírást (max 200 karakter) és egy mintamondatot a szervezet nevében." — a meglévő `hangnemetFinomit` folyamata (AI-hívás, `hangnem_leiras` + `hangnem_minta` a válaszban) változatlan.

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm hatar` 0; a mag próbái zöldek; `POST /api/hirfigyelo/forrasok/ajanlat` a fenti sorrendet adja. Add vissza: forras-ajanlo.ts (+ a lista fájl, ha ts), forras-ajanlo.proba.ts, _RESZLET-index.md, ajanlat/route.ts, hf_beallitas_javaslat.hu.md, _RESZLET-hangnem.md.
