# tools/titok — secrets from the Mac vault to where they are used, without the clipboard

Decision: `docs/decisions/2026-10-09-c1-c7-telegram.md`. Built 2026-10-09 for c7 (Telegram bot token).

The token lives on Csilla's Mac in `~/saas/vault/telegram-bot-token` (mode 600). It is needed in two places:

| Where | What | Read by |
|---|---|---|
| NAS `/volume2/docker/aitmetica-saas/.env` | `TELEGRAM_BOT_TOKEN=…`, `TELEGRAM_CHAT_ID=-5557911968` | the app (c7 morning notice, `apps/web/visszajelzes/ertesites.ts`) via `nas/docker-compose.yml` |
| Gigabyte `/home/gigabyte/.config/gigabyte-robot/telegram` (700/600, owner `gigabyte`) | `TOKEN=…`, `CHAT=-5557911968` | the deploy robot's messages (`tools/gigabyte-robot/uzenet.sh`) |

The chat id is the team group and is not secret. The token never appears on screen, on a command line or in a log:
it travels on ssh **stdin**, and every printout shows `••••` or an 8-character sha256 fingerprint instead.

## The path (measured from the repo, not on the machines)

- Mac → NAS directly: **not possible** (no NAS login on the Mac; `claude/FEEDBACK-STATUS-2026-09-29.md`).
- Mac → Gigabyte with `gigabyte-forditas-kulcs`: **not possible** (forced command: only `epit`/`kuld`/`allapot`).
- So: Mac → Gigabyte as **`csilla`** (her own login), then on the Gigabyte with `sudo` → the robot user `gigabyte` → the NAS
  through the robot's own `nas/nas-parancs.sh` (vault NAS login, `sudo` on the NAS) — the same channel every deploy uses.

## Scripts

| Script | Runs on | Does |
|---|---|---|
| `mac-gigabytera.sh` | Mac | token file → `csilla@100.113.109.91:~/.km-titok/telegram-bot-token` (700/600), prints length match + fingerprint |
| `telegram-telepit.sh` | Gigabyte, `sudo` | default = **dry run** (writes nothing: NAS memory/load, which keys exist now, what it would write). `--irj` = writes the robot file, backs up and edits the NAS `.env`, sends one "c7 próba" robot message |

Both are idempotent: a second run says `változatlan` and writes nothing. Old files are kept (`telegram.elotte-<time>`,
`.env.elotte-c7-<time>`), never deleted. The NAS step does not restart, build or recreate anything.

## Batches (Csilla)

Run them after the branch `c1-c7-ertesitesek` is pushed (the scripts are taken from it, so no merge is needed first).
Assumed (not measured): the Mac clone is `~/saas/aitmetica-saas`; Csilla can `ssh csilla@100.113.109.91` from the Mac
(if there is no key, ssh asks her Gigabyte password once).

**Batch 1 — MAC:**
```bash
cd ~/saas/aitmetica-saas && git fetch -q origin c1-c7-ertesitesek
git show origin/c1-c7-ertesitesek:tools/titok/mac-gigabytera.sh > /tmp/km-mac-gigabytera.sh
bash /tmp/km-mac-gigabytera.sh
```
Output must show: `[rendben] a token átment a Gigabyte-ra … ujjlenyomat: xxxxxxxx`.

**Batch 2 — GIGABYTE** (as `csilla`; dry run, writes nothing):
```bash
sudo -v
sudo -u gigabyte -H git -C /home/gigabyte/projektek/saas fetch -q origin c1-c7-ertesitesek
sudo -u gigabyte -H git -C /home/gigabyte/projektek/saas show FETCH_HEAD:tools/titok/telegram-telepit.sh > /tmp/km-telegram-telepit.sh
sudo bash /tmp/km-telegram-telepit.sh
```
Output must show: the same fingerprint as Batch 1, `NAS: szabad memória` ≥ 3000 MB and `terhelés` < 20, `NAS: próba — nem írtam semmit`.

**Batch 3 — GIGABYTE** (writes; running it is the go-ahead):
```bash
sudo bash /tmp/km-telegram-telepit.sh --irj
```
Output must show: `[rendben] megírva (600 gigabyte)`, `NAS: mentés: …/.env.elotte-c7-…`, `+ TELEGRAM_BOT_TOKEN=••••`,
`+ TELEGRAM_CHAT_ID=-5557911968`, `[rendben] a robot próbaüzenete kiment` — and a "c7 próba" message appears in the Telegram group.

Undo the NAS part: `cp -p /volume2/docker/aitmetica-saas/.env.elotte-c7-<time> /volume2/docker/aitmetica-saas/.env` (printed by the script).

## When the app sees the new variables

`nas/docker-compose.yml` passes `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` to `aitmetica-saas-app` from this branch on (the old compose
file does not list them, so writing the `.env` early changes nothing in the running app). The deploy of this branch runs
`docker compose up -d --no-build`, which **recreates** the app container because its environment changed — no separate step.
If the `.env` is written AFTER this branch is already live, a plain `docker restart` is NOT enough (it keeps the old environment);
the container must be recreated: `cd /volume2/docker/aitmetica-saas && sudo docker compose up -d --no-build app` (a NAS change:
explain first, per NAS-szabalyok.md). Missing variables are harmless: the app logs one line a day and sends nothing.
