# D-10 — Előfizetéses AI a teszten (Claude Code + Codex az „AI-híd" dobozon át)

Frissítve: 2026-09-07. Vilmos döntése: a teszten a saját Claude- és ChatGPT-előfizetése dolgozik, API-kulcs nélkül.

## Hogyan működik

- `nas/ai-hid/` — külön doboz (`aitmetica-saas-ai-hid`, node 24 + `@anthropic-ai/claude-code@2.1.263` + `@openai/codex@0.153.4`).
  Egy pici HTTP-szolgáltatás (`hid.mjs`, külső csomag nélkül) a 8500-as porton, csak a dobozhálózaton belül:
  - `POST /hiv` `{ szolgaltato: "claude"|"codex", rendszer, szoveg, nyelv, maxKiToken?, idokorlatMs? }`
    → `{ szoveg, modell, tokenek_be, tokenek_ki, ido_ms }`; hibák: 400 ROSSZ_KERES, 503 NINCS_BELEPO, 502 AI_NEM_ELERHETO,
    429 TUL_SOK (több mint `MAX_PARHUZAMOS`=2 egyidejű), 502 ROSSZ_VALASZ.
  - `GET /allapot` → `{ claude_belepo, codex_belepo, futo }` (csak a belépő MEGLÉTE).
  - Claude ág: `claude -p --output-format json --no-session-persistence --tools "" --max-turns 1 --system-prompt …`,
    a szöveg a bemeneten, üres munkamappában. **`--bare` tilos**: az a belépőt is átugorja (mérve: „Not logged in"); belépő a `CLAUDE_CODE_OAUTH_TOKEN` (a `/titkok/claude-belepo.txt`-ből tölti az indító).
  - Codex ág: `codex exec --json --ephemeral --skip-git-repo-check --sandbox read-only -C <ideiglenes mappa> -o …`;
    a rendszerutasítás a mappa `AGENTS.md`-je + a prompt eleje; belépő a `/home/node/.codex/auth.json`
    (első indításkor a `/titkok/codex-auth.json`-ból másolva; utána a névvel ellátott `ai-hid-codex` kötetben marad,
    mert a Codex maga frissíti).
- `packages/ai-adapters/src/hid.ts` — `claudeElofizetesSzolgaltato`, `codexElofizetesSzolgaltato` (a `hidSzolgaltato` gyár).
  Ár 0/0 (előfizetés), a tokenszám mérve. 503 → `AI_NINCS_KULCS`; egyéb hiba → `AI_NEM_ELERHETO`; üres → `AI_ROSSZ_VALASZ`.
- `apps/web/onboarding/osszefoglalo.ts` — `AI_SZOLGALTATO = teszt | anthropic | claude-elofizetes | codex-elofizetes`.
- NAS `.env`: `AI_SZOLGALTATO=claude-elofizetes` (vagy `codex-elofizetes`); `CLAUDE_MODELL`, `CODEX_MODELL` üresen = a program alapértelmezése.
- Belépők: `bash nas/kirak.sh --titkok` viszi a vaultból (`vault/claude-belepo.txt` — a mostani fájl neve `calude-belepo.txt`,
  azt is elfogadja —, `vault/codex-auth.json`) a NAS `$TAVOLI/titkok/` mappájába (600). Tartalom sehol nem íródik ki.

## Mérve (2026-09-07)

- Felhő: `packages/ai-adapters` típusellenőrzés rendben; `apps/web` típusellenőrzés rendben; `apps/web/probak/hid.proba.ts` 6/6
  (hamis híd-szerverrel, hálózat nélkül). A híd élőben: hamis Claude-belépővel 503 NINCS_BELEPO 1,8 mp alatt, hamis
  Codex-belépővel 503 NINCS_BELEPO 19 mp alatt; rossz kérésre 400.
- A `kirak.sh` összerakása mostantól a közös kapun át megy (`/volume1/homes/Portik/kozos/szabad-e.sh aitmetica-saas`).

- A híd képében kell a `ca-certificates` csomag: a Codex nélküle „invalid peer certificate: UnknownIssuer" hibával nem éri el a ChatGPT-t (mérve a NAS-on).

## Kirakás

`bash nas/kirak.sh --hid` csak a híd-dobozt rakja újra (a forrás átvitele után, a közös kapun át); a teljes kirakás változatlan.

## Állás (2026-09-07 este)

- Claude-ág: kint, élőben mérve, ez dolgozik (`AI_SZOLGALTATO=claude-elofizetes`).
- Codex-ág: kint, élőben mérve (a fizetős fiók belépőjével). Drága a keretre (≈25k bemeneti token/hívás), ezért nem alap; átkapcsolás: `.env` `AI_SZOLGALTATO=codex-elofizetes` + `docker compose up -d --no-build app`.

## Korlátok (kimondva)

- Egy személy előfizetése: saját tesztre jó, ügyfélnek/pilotra nem — ott a D-08 API-kulcs.
- A keret közös Vilmos napi használatával; ha a teszt sokat kér, a Cowork is lassul.
- A Codex ChatGPT-belépős használata saját termékben az OpenAI oldalán nincs leírva → bizonytalan.

## Ágensek

DeepSeek (építő, híd: 20 mp, 0,0018 USD — a Claude ágát Claude újraírta, mert nem létező változóra várt; a figyelőcímet
0.0.0.0-ra kellett tenni), Kimi (építő, csatlakozó + próba: 68 mp, 0,0185 USD — változtatás nélkül átment).
