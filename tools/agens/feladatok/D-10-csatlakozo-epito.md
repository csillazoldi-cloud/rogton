# Feladat — ÉPÍTŐ (D-10): két új szolgáltató a csatlakozóban (előfizetéses Claude és Codex az „AI-híd" dobozon át) + gépi próba

Kontextus. Mellékelve: `packages/ai-adapters/src/alap.ts` (a `Szolgaltato` felület, `AiHiba`, `idokorlattal`, `HivasMeres`) és
`packages/ai-adapters/src/anthropic.ts` (MINTA: PONTOSAN így épül egy szolgáltató; a hibakezelés mintája is). TypeScript 7
strict, ESM, zod 4. Magyar azonosítók (ékezet nélkül), magyar megjegyzések.

A tesztfázisban két ELŐFIZETÉS dolgozik API-kulcs helyett. A modellt nem mi hívjuk: egy külön doboz („ai-hid") futtatja a
Claude Code és a Codex programokat, és ezt a HTTP-t adja:

`POST {AI_HID_CIM}/hiv` (alap `http://ai-hid:8500`), törzs JSON:
`{ "szolgaltato": "claude"|"codex", "rendszer": string, "szoveg": string, "nyelv": string, "maxKiToken"?: number, "idokorlatMs"?: number }`
→ 200 `{ "szoveg": string, "modell": string, "tokenek_be": number, "tokenek_ki": number, "ido_ms": number }`
→ hiba `{ "hiba": string, "reszlet"?: string }`: 400 ROSSZ_KERES, 503 NINCS_BELEPO, 502 AI_NEM_ELERHETO, 429 TUL_SOK, 502 ROSSZ_VALASZ.

Írd meg (három fájl, mind `=== FÁJL: <út> ===` blokkban):

## 1. `packages/ai-adapters/src/hid.ts`
```ts
export function hidSzolgaltato(beallitas: { azonosito: "claude-elofizetes" | "codex-elofizetes"; nev: string; hidNev: "claude" | "codex"; modellEnv: "CLAUDE_MODELL" | "CODEX_MODELL" }): Szolgaltato;
export const claudeElofizetesSzolgaltato: Szolgaltato; // hidSzolgaltato({ azonosito: "claude-elofizetes", nev: "Claude (előfizetés, Claude Code-on át)", hidNev: "claude", modellEnv: "CLAUDE_MODELL" })
export const codexElofizetesSzolgaltato: Szolgaltato;  // hidSzolgaltato({ azonosito: "codex-elofizetes", nev: "ChatGPT (előfizetés, Codexen át)", hidNev: "codex", modellEnv: "CODEX_MODELL" })
```
- Leírólap: `hol: "felho"`, `orszag: "USA"`, `nyelvek: ["hu","ro","en"]`, `modell` = `process.env[modellEnv] ?? hidNev`,
  `ar_be_usd_1m: 0`, `ar_ki_usd_1m: 0` (előfizetés: nincs hívásonkénti ár; a tokenszám így is mérve), mind a négy feladat.
  A leírólapot a mintához hasonlóan FÜGGVÉNY adja (hogy a környezeti változót híváskor olvassa).
- `hiv`: `idokorlattal(keres.idokorlatMs ?? 90_000, keres.jel, …)` alatt `fetch(cim + "/hiv", { method: "POST", headers: { "content-type": "application/json" }, body, signal })`
  ahol `cim = process.env["AI_HID_CIM"] ?? "http://ai-hid:8500"`, és a törzs `idokorlatMs`-e = a sajátunk mínusz 5000 (legalább 10 000).
  Ismétlés NINCS (a program maga drága; a hívó dönt).
- Hibák leképezése: hálózati hiba / időtúllépés → `AiHiba("AI_NEM_ELERHETO")`; 503 NINCS_BELEPO → `AiHiba("AI_NINCS_KULCS")`;
  429 / 502 / egyéb nem-2xx → `AiHiba("AI_NEM_ELERHETO", "HTTP <státusz> <hiba kód>")`; 2xx, de a `szoveg` nem nem-üres string →
  `AiHiba("AI_ROSSZ_VALASZ")`. A választ zod-sémával ellenőrizd (`z.object({ szoveg: z.string(), modell: z.string(), tokenek_be: z.number(), tokenek_ki: z.number(), ido_ms: z.number() })`).
- Mérés: `szolgaltato` = azonosito, `modell` = a válasz `modell` mezője, `tokenek_be/ki` a válaszból, `becsult_usd: 0`, `ido_ms` a saját mérés.

## 2. `packages/ai-adapters/src/index.ts` (a meglévő két sor + a két új export)
```ts
export * from "./alap";
export { anthropicSzolgaltato } from "./anthropic";
export { claudeElofizetesSzolgaltato, codexElofizetesSzolgaltato, hidSzolgaltato } from "./hid";
```

## 3. `apps/web/probak/hid.proba.ts` — vitest, ADATBÁZIS ÉS FUTÓ ALKALMAZÁS NÉLKÜL
Indíts a `beforeAll`-ban egy pici `node:http` szervert (0-s port → a kiosztott portot írd az `process.env["AI_HID_CIM"]`-be),
amely a `/hiv`-re a teszt által beállított választ adja (egy `let valasz: { statusz: number; torzs: unknown }` változóból), és
rögzíti az utolsó kérés törzsét. Importáld: `import { claudeElofizetesSzolgaltato, codexElofizetesSzolgaltato, AiHiba } from "@km/ai-adapters";`
Esetek:
1. siker: 200 `{ szoveg: "Szia", modell: "claude-x", tokenek_be: 12, tokenek_ki: 3, ido_ms: 40 }` → a válasz `szoveg` „Szia", a mérés
   `szolgaltato` „claude-elofizetes", `modell` „claude-x", tokenek 12/3, `becsult_usd` 0, `allapot` „ok"; a kérés törzsében
   `szolgaltato: "claude"`, `rendszer`, `szoveg`, `nyelv` a beadott értékek, `idokorlatMs` szám.
2. a codex szolgáltató `szolgaltato: "codex"`-et küld, és a mérés `szolgaltato` „codex-elofizetes".
3. 503 `{ hiba: "NINCS_BELEPO" }` → `AiHiba` `kod === "AI_NINCS_KULCS"`.
4. 502 `{ hiba: "AI_NEM_ELERHETO" }` → `kod === "AI_NEM_ELERHETO"`.
5. 200, de `{ szoveg: "" , …}` → `kod === "AI_ROSSZ_VALASZ"`.
6. a szerver nem válaszol 200 ms-en belül (a kezelő késleltet) és `idokorlatMs: 100` → `kod === "AI_NEM_ELERHETO"`.
`afterAll`: a szerver leáll. Semmi valódi hálózat.

Ne találj ki új mezőt vagy modult a fentieken túl.
