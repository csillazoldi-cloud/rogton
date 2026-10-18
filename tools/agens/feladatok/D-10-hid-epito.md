# Feladat — ÉPÍTŐ (D-10): „AI-híd" doboz — a Claude Code és a Codex programok képernyő nélküli futtatása HTTP mögött

Kontextus. A termék AI-csatlakozója (mellékelve: `packages/ai-adapters/src/alap.ts`) FELADATOT kér egy szolgáltatótól.
A tesztfázisban két ELŐFIZETÉST kötünk be API-kulcs helyett: a Claude Code (`claude`) és a Codex (`codex`) parancssori
programokat, amelyek a saját belépőjükkel futnak. Ezek egy külön kis dobozban élnek („ai-hid"), és egy pici HTTP-szolgáltatás
áll előttük. Az alkalmazás dobozából csak ezt a HTTP-t hívjuk. Node 24, ESM, KÜLSŐ CSOMAG NÉLKÜL (csak `node:http`,
`node:child_process`, `node:fs`, `node:os`, `node:path`). Magyar azonosítók (ékezet nélkül), magyar megjegyzések.

Írd meg (két fájl, mind `=== FÁJL: <út> ===` blokkban):

## 1. `nas/ai-hid/hid.mjs`

HTTP-szerver a `PORT` (alap 8500) porton, csak a dobozon belül.

### `POST /hiv` — törzs (JSON):
```json
{ "szolgaltato": "claude" | "codex", "rendszer": "…rendszerutasítás…", "szoveg": "…felhasználói rész…",
  "nyelv": "hu", "maxKiToken": 400, "idokorlatMs": 60000 }
```
Válasz 200 (JSON): `{ "szoveg": string, "modell": string, "tokenek_be": number, "tokenek_ki": number, "ido_ms": number }`
Hibák (JSON, `{ "hiba": KOD, "reszlet": string }`): 400 `ROSSZ_KERES` (hiányzó/rossz mező, ismeretlen szolgáltató);
503 `NINCS_BELEPO` (lásd lent); 502 `AI_NEM_ELERHETO` (a program hibával tért vissza, időtúllépés, nem elemezhető kimenet);
429 `TUL_SOK` (több mint `MAX_PARHUZAMOS`, alap 2, egyidejű hívás — ne sorolj, azonnal utasítsd el);
502 `ROSSZ_VALASZ` (üres szöveg).

### Claude ág
Indítás: `claude -p --bare --output-format json --no-session-persistence --tools "" --max-turns 1 --system-prompt <rendszer>`
(+ `--model <CLAUDE_MODELL>`, ha a környezeti változó meg van adva). A `szoveg` a program BEMENETÉRE (stdin) megy,
utána a bemenet lezárva. A kimenet egyetlen JSON-objektum; mért alakja (2026-09-07, Claude Code 2.1.263):
```
{"is_error":false,"result":"…a válasz…","usage":{"input_tokens":N,"cache_creation_input_tokens":N,"cache_read_input_tokens":N,"output_tokens":N},
 "modelUsage":{"<modellnév>":{…}},"total_cost_usd":0,…}
```
- `is_error: true` → 502 `AI_NEM_ELERHETO`, `reszlet` = `result` első 200 karaktere. Ha a `result` „Authentication error"-t
  vagy „Not logged in"-t tartalmaz → 503 `NINCS_BELEPO`.
- `tokenek_be` = `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`; `tokenek_ki` = `output_tokens`;
  `modell` = a `modelUsage` első kulcsa, különben `CLAUDE_MODELL` vagy `"claude"`.
- Belépő: a `CLAUDE_CODE_OAUTH_TOKEN` környezeti változó; ha ÜRES → 503 `NINCS_BELEPO` indítás nélkül.
  (A doboz indítója a `/titkok/claude-belepo.txt` fájlból tölti a változóba — ez a 2. fájl dolga.)

### Codex ág
Előkészítés: ideiglenes mappa (`fs.mkdtempSync` az `os.tmpdir()` alatt), benne `AGENTS.md` = a `rendszer` szöveg
(a Codex ezt a mappa utasításaként olvassa); hívás után a mappa törlődik (`finally`).
Indítás: `codex exec --json --ephemeral --skip-git-repo-check --sandbox read-only -C <mappa> -o <mappa>/valasz.txt <prompt>`
(+ `-m <CODEX_MODELL>`, ha meg van adva). A `<prompt>` = `rendszer + "\n\n---\n\n" + szoveg` (egyetlen argumentum).
Kimenet: soronként egy JSON-esemény (JSONL). Elemzés soronként, a nem-JSON sorok kihagyva:
- a használat a `turn.completed` típusú eseményben: `usage.input_tokens`, `usage.output_tokens` (+ `cached_input_tokens`,
  ha van, a bemenethez hozzáadva); ha nincs ilyen esemény, 0/0;
- a szöveg: elsőként a `-o` fájl tartalma (ha létezik és nem üres), különben az utolsó `item.completed` esemény
  `item.text` mezője, ahol `item.type === "agent_message"`.
- a `modell`: `CODEX_MODELL` vagy `"codex"`.
- Ha a program kilépési kódja nem 0 és nincs szöveg → 502; ha a hibakimenet „login"/„not logged in"/„unauthorized"
  szöveget tartalmaz → 503 `NINCS_BELEPO`.
- Belépő: a `/home/node/.codex/auth.json` fájl; ha NEM létezik → 503 `NINCS_BELEPO` indítás nélkül.

### Közös
- Időkorlát `idokorlatMs` (alap 60 000, legfeljebb 180 000): lejáratkor `SIGTERM`, 3 mp múlva `SIGKILL`, válasz 502
  `AI_NEM_ELERHETO` „időtúllépés".
- A programok környezete: `HOME=/home/node`, `PATH` örökölve, `NO_COLOR=1`, `CI=1`; a `CLAUDE_CODE_OAUTH_TOKEN` CSAK a
  claude ágnak adódik át. Semmilyen belépő nem kerül naplóba vagy válaszba.
- Minden hívásról egy napló-sor a kimenetre (JSON): `{ ido, szolgaltato, modell, ido_ms, tokenek_be, tokenek_ki, allapot: "ok"|"hiba", hiba? }`.
- `GET /allapot` → 200 `{ "claude_belepo": boolean, "codex_belepo": boolean, "futo": number }` (csak a belépő MEGLÉTE, tartalom soha).
- A törzs legfeljebb 1 MB; `SIGTERM`-re a szerver leáll.

## 2. `nas/ai-hid/Dockerfile`
- `FROM node:24-bookworm-slim` (glibc kell: a Codex natív program). `RUN npm install -g @anthropic-ai/claude-code@2.1.263 @openai/codex@0.153.4`
  (rögzített verziók — ezeket mérve ellenőriztük). `apt` nélkül, ha lehet; ha a `claude`-nak kell a `git`/`ripgrep`, NEM kell —
  `--bare --tools ""` módban fut.
- `ENV HOME=/home/node NODE_ENV=production PORT=8500 NO_COLOR=1 CI=1`, `WORKDIR /hid`, `COPY hid.mjs .`, `USER node`,
  `EXPOSE 8500`.
- Indító: `CMD ["sh","-c","export CLAUDE_CODE_OAUTH_TOKEN=\"$(cat /titkok/claude-belepo.txt 2>/dev/null | tr -d '\\r\\n')\"; exec node hid.mjs"]`
  — a `/titkok` mappát a docker-compose csatolja (csak olvasásra), a `/home/node/.codex/auth.json`-t szintén.

Ne találj ki új mezőt, végpontot vagy kapcsolót a fentieken túl. A kód legyen rövid és olvasható (kb. 200–250 sor).
