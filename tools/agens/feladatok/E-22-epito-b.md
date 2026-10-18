# Feladat — ÉPÍTŐ B (E-22): helyi AI-csatlakozó a Dell gépen futó Ollama-hoz (Qwen) + a GPU sora

Döntés (Vilmos, 2026-09-08): a nehéz AI-munka a Dell videókártyáján fut; a Dell Ollama-ja a NAS-ról a helyi hálózaton érhető el
(`http://192.168.1.188:11434`, mérve; modellek: `qwen3.8:27b` 17,7 GB, `qwen3:4b`, `gemma4:31b`). A hírfigyelő a közös csatlakozón át kér
FELADATOT — ez az új szolgáltató a csatlakozóban él, a hírfigyelő kódja nem változik.
Mellékelve: `alap.ts` (a szerződés: `Szolgaltato`, `HivasKeres`, `HivasValasz`, `HivasMeres`, `AiHiba`, `koltseg`, `idokorlattal`, a `tesztSzolgaltato`),
`anthropic.ts` (egy valódi szolgáltató mintája), `hid.ts` (a másik), `index.ts` (exportok), a webalkalmazás `ai/index.ts` (a szolgáltató-választás).

Készítsd el:
1. **`packages/ai-adapters/src/ollama.ts`** — `export const ollamaSzolgaltato: Szolgaltato` (azonosító `helyi-ollama`, `hol: "helyi"`, `orszag: "Románia"`,
   nyelvek hu/ro/en, `modell: process.env.OLLAMA_MODELL ?? "qwen3.8:27b"`, árak 0, `feladatok`: MIND, a hat `hf_*`-gal együtt).
   `hiv(keres)`: `POST {OLLAMA_URL ?? "http://192.168.1.188:11434"}/api/chat` törzs `{ model, messages: [{role:"system", content: keres.rendszer},{role:"user", content: keres.szoveg}], stream: false, format: "json", options: { temperature: 0, num_predict: keres.maxKiToken ?? 400 }, think: false }`
   (a `format: "json"` a hírfigyelő sémás válaszaihoz; a `think: false` a Qwen3 gondolkodó módját kapcsolja ki — ha a szerver 400-at ad rá, próbáld nélküle egyszer);
   időkorlát `idokorlattal(keres.idokorlatMs ?? 120_000)` (a helyi modell lassabb lehet); a válasz `message.content`, a mérés: `prompt_eval_count`/`eval_count` → tokenek,
   `becsult_usd: 0`, `ido_ms`; hálózati/HTTP-hiba → `AiHiba("AI_NEM_ELERHETO")`, üres válasz → `AiHiba("AI_ROSSZ_VALASZ")`.
   **A GPU sora:** a helyi hívások EGYSZERRE EGY: egy modulszintű (globalThis-őrzött) ígéret-lánc (`utolso = utolso.then(() => hivEgyszer(...))`), hogy két
   párhuzamos hívás ne fussa egyszerre a kártyát; plusz `OLLAMA_MAX_VAR_MS` (alap 10 perc) — ha ennyit várna a sorban, `AI_NEM_ELERHETO`.
   `export async function ollamaElerheto(): Promise<{ ok: boolean; modellek: string[]; fut: string[] }>` — `GET /api/tags` + `/api/ps`, 5 mp időkorlát (a felület/ellenőrzés használja).
2. **`index.ts`**: export `ollamaSzolgaltato`, `ollamaElerheto`.
3. **`apps/web/ai/index.ts`** (add vissza a teljes fájlt): a `szolgaltato(nev)` `case "helyi-ollama": return ollamaSzolgaltato;` — a `hirfigyeloSzolgaltato()` így
   `HF_AI_SZOLGALTATO=helyi-ollama`-ra a Dellre megy. Semmi más nem változik.
4. **`docs/D-13-HELYI-AI.md`** — rövid magyar leírás (10–15 sor): mi ez, hogyan kapcsolható (`HF_AI_SZOLGALTATO=helyi-ollama`, `OLLAMA_URL`, `OLLAMA_MODELL`), mit mér,
   mi történik, ha a Dell nem elérhető (a találat „értékelés függőben” marad, a futás `ai_fuggoben`, az `ertekeles-ujra` később pótolja), és hogy a GPU-n egyszerre egy hívás megy.
5. **`nas/docker-compose.yml`** (add vissza a teljes fájlt): az `app` környezetébe `HF_AI_SZOLGALTATO: ${HF_AI_SZOLGALTATO:-teszt}`, `OLLAMA_URL: ${OLLAMA_URL:-http://192.168.1.188:11434}`,
   `OLLAMA_MODELL: ${OLLAMA_MODELL:-qwen3.8:27b}`, `HF_FUTTATO: ${HF_FUTTATO:-1}`.

Szabályok: TypeScript 7 + exactOptionalPropertyTypes; nincs új npm-függőség (a beépített `fetch`); magyar nevek/megjegyzések. Add vissza az ÖSSZES érintett fájlt.
