# D-13: Helyi AI-csatlakozó (Ollama a Dell gépen)

A nehéz AI-munka a Dell videókártyáján fut. A Dell Ollama-ja a helyi hálózaton érhető el
(`http://192.168.1.188:11434`), modellek: `qwen3.8:27b` (17,7 GB), `qwen3:4b`, `gemma4:31b`.
A hírfigyelő a közös csatlakozón át kér FELADATOT — ez az új szolgáltató a csatlakozóban él,
a hírfigyelő kódja nem változik.

**Bekapcsolás:** `HF_AI_SZOLGALTATO=helyi-ollama` környezeti változóval a hírfigyelő a Dellre megy.
További változók: `OLLAMA_URL` (alap `http://192.168.1.188:11434`), `OLLAMA_MODELL` (alap `qwen3.8:27b`),
`OLLAMA_MAX_VAR_MS` (alap 10 perc, a GPU-sorban várakozás korlátja).

**Mérés:** a hívás tokenjeit a válasz `prompt_eval_count`/`eval_count` mezőiből olvassuk;
a becsült költség 0 (helyi), az időt mérjük. A hívás időkorlátja a hírfigyelőből 180 másodperc (a hideg betöltés ~30 mp + a válasz), a modell `keep_alive` 30 perc (`OLLAMA_KEEP_ALIVE`).

**Mérés (2026-09-08, qwen3.8:27b, a relevancia-prompt 982 tokenje):** hideg betöltés 29,8 mp (első hívás 41,5 mp), utána **3,8 mp/cikk**, 183 kimeneti token; a válasz érvényes JSON, magyar, jól indokolt. 60 cikk ≈ 4 perc.

**Ha a Dell nem elérhető:** a hívás `AI_NEM_ELERHETO` hibát ad; a találat „értékelés függőben” marad,
a futás `ai_fuggoben` állapotba kerül, az `ertekeles-ujra` később pótolja. Nincs csendes átváltás felhőre.

**GPU-sor:** a helyi hívások egyszerre egy — ígéret-lánc biztosítja, hogy két párhuzamos hívás
ne fussa egyszerre a kártyát. Ha egy hívás 10 percnél tovább várna a sorban, `AI_NEM_ELERHETO` hibát kap.
