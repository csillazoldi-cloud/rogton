# tools/kapu — the c4 gate (protected `main`)

Plan: `docs/plans/c4-vedett-main.md` · decision: `docs/decisions/2026-10-07-c4-vedett-main.md` (Csilla, 10-07; the security
items approved by Csilla on Vilmos's behalf, Vilmos to see it on the hub).

## What it does

```
push to main ─► robot sees it ─► 2 min quiet ─► kapu.sh <sha> ─┬─ green / no worse ─► kirak-sha.sh <sha> ─► "Kint van"
                                                               └─ new red ─────────► nothing deployed, "Nem raktam ki"
```

- **One SHA.** The robot pins the SHA it saw. The gate works in a clean worktree at that SHA; the deploy ships
  `git archive <sha>` and the images built from it (label `km.valtozat=<sha>`). There is no `git pull` anywhere in the
  deploy path. At the end the NAS is read back: the running app image's label and `forras/VALTOZAT` must both equal the SHA.
- **Everything is checked.** `pnpm install --frozen-lockfile`, every item of the `ellenoriz` chain separately (the boundary
  checker violation by violation), and every test package, live tests included, against a throwaway Postgres 18 (all
  migrations from scratch, through the repo's own `migral.sh`) and the app built from that SHA, with the test AI connector.
- **Known failures are written down.** `ismert-bukasok.json`: every failing test and every skipped test must be listed, each
  with a reason (≥ 15 characters) and a date. A new failure, a new skip, or an entry without a reason → red. A version may add
  entries (Q3), and then the "Kint van" message says so loudly.
- **NAS order:** measure (3 GB / load 20) → source + images → `:helyi` → `:elozo`, `:<sha>` → `:helyi` → backup + migrations
  (`migral.sh`) → only then the new app → fence → health → read-back. Health red and no migration ran → back to `:elozo` (exit 4).
  Health red after a migration → no automatic rollback, loud message with the backup file name (exit 7).
- **Messages** (`tools/gigabyte-robot/uzenet.sh`): the technical line (SHA, commit subject, log paths) always goes to
  `~/.local/state/gigabyte-robot/uzenetek.txt`. The Telegram group gets ONLY a plain Hungarian sentence, looked up by key in
  **`tools/gigabyte-robot/uzenet-szovegek.txt`** (the one place to edit the texts) — Csilla 2026-10-09 07:58: the group is read by
  Csilla, Kati and Vilmos, not developers. Successful deploy (`kint`) and a dirty robot copy (`piszkos`) send nothing (silence = fine).
  Keys: `nem_kerult_ki` (gate red) · `elakadt` (infra, retries failing) · `visszaallt` (exit 4) · `felresiklott` (exit 8, old path
  failure) · `nem_mukodik` (exit 7) · `nem_stimmel` (exit 9) · `napi_baj` (heartbeat) · `proba` (setup test). Self-test:
  `tools/kapu/onproba/uzenet-onproba.sh` (fake Telegram API). Daily heartbeat 08:57 (`szivdobbanas.timer`) speaks only on trouble.
- **Switch:** `KAPU=1` in `~/.config/gigabyte-robot/beallitas`. Without it the robot runs the old path (`robot-regi.sh`) unchanged.
  Switching back = delete the line or set `KAPU=0`.

## Files

| File | Role |
|---|---|
| `kapu.sh <sha>` | the gate; exit 0 go · 1 red (code) · 2 machinery (retry) |
| `proba-kornyezet.sh fel/le` | throwaway Postgres 18 + app on 127.0.0.1; DB comment `kapu-<sha12>` |
| `osszesit.mjs` / `osszevet.mjs` | vitest JSON → one result list; compare with the baseline → decision |
| `hatar-hibak.mjs` | boundary violations one per line (so the 2 old cycles can be baselined, a new one is red) |
| `ismert-bukasok.json` | the baseline (21 failures + 2 skipped files, each with a reason; removed entries stay in `kivett` with the reason) |
| `onproba/robot-onproba.sh` | robot decisions on a local bare repo (no network) |
| `onproba/kirak-onproba.sh` | NAS step order and exit codes of `nas/kirak-sha.sh`, with a stub NAS |
| `proba-naplo/` | self-test logs from 2026-10-07 |
| `../gigabyte-robot/robot.sh` | the robot (new path behind `KAPU=1`; `--sha <sha>` manual mode; `--proba` no NAS) |
| `../../nas/kirak-sha.sh` | deploy exactly one SHA |

The test helper `apps/web/probak/segedek.ts` refuses to touch a database whose comment is not `KAPU_JELOLO` (the gate sets it),
and without `KAPU_JELOLO` it only connects to a loopback address. The tests delete rows; this keeps them off the NAS.

## Switching it on — on the Gigabyte

**Before:** Csilla merges `c4-terv` into `main` and pushes. The old robot deploys it as today (unchecked, last time), and the
robot's copy `~/projektek/saas` then contains the c4 code. Run the batches **as the robot user `gigabyte`** (the user that runs
`gigabyte-robot.timer`; assumed: the same login you used for `telepit.sh`).

**Batch 1 — GIGABYTE:**
```bash
cd ~/projektek/saas && git log --oneline -1 && grep -c "KAPU=1" tools/gigabyte-robot/robot.sh
command -v pnpm || echo "nincs pnpm a gazdagépen"; grep -c KIMARADT ~/.local/state/gigabyte-robot/utolso.log
bash tools/gigabyte-robot/telepit.sh 2>&1 | tail -14
docker pull -q postgres:18-alpine && docker pull -q node:24-alpine
systemctl --user list-timers --no-pager | grep -E "gigabyte-robot|szivdobbanas"
```
Output must show: the merge commit on top and a number ≥ 1; `nincs pnpm` + a KIMARADT count ≥ 1 (this measures that the old robot ran no checks); `[rendben] a napi szívdobbanás beidőzítve (c4)`; both images pulled; two timers listed.

**Batch 2 — GIGABYTE** (gate + a dry deploy, the NAS is not touched; about 10–15 minutes):
```bash
cd ~/projektek/saas && bash tools/gigabyte-robot/robot.sh --sha "$(git rev-parse origin/main)" --proba; echo "robot kilépés: $?"
grep -E "^KAPU:|^futás:" ~/.local/state/gigabyte-robot/utolso-kapu.log
tail -4 ~/.local/state/gigabyte-robot/utolso.log
cat ~/saas-kapu/futasok/*/idok.txt | tail -9
docker ps -a --filter label=km.kapu --format '{{.Names}}' | wc -l
```
Output must show: `robot kilépés: 0`, `KAPU: nem-rosszabb — Zöld a kapu …`, `próba vége — a NAS-hoz nem nyúltam`, the timings, and `0` leftover containers. If it says `KAPU: piros`, stop and send the `futás:` folder path — the baseline was measured in a cloud copy (see below) and the Gigabyte may differ.

**Batch 3 — GIGABYTE** (switch on; Telegram comes later with c7 — until then messages go to the local file):
```bash
mkdir -p ~/.config/gigabyte-robot && chmod 700 ~/.config/gigabyte-robot
bash ~/projektek/saas/tools/gigabyte-robot/uzenet.sh "c4 próba" "A robot üzenetei ide kerülnek." && tail -2 ~/.local/state/gigabyte-robot/uzenetek.txt
echo "KAPU=1" > ~/.config/gigabyte-robot/beallitas && cat ~/.config/gigabyte-robot/beallitas
sleep 90; journalctl --user -u gigabyte-robot.service -n 5 --no-pager
```
Output must show: the test message in the file, `KAPU=1`, and robot runs without errors. From the next push on, the gate is live.

**Telegram (c7, done 2026-10-09):** `~/.config/gigabyte-robot/telegram` (mode 600, `TOKEN=…`, `CHAT=-5557911968`) is written by
`tools/titok/telegram-telepit.sh --irj` (see tools/titok/README.md). Test: `bash ~/projektek/saas/tools/gigabyte-robot/uzenet.sh "próba" "teszt" proba`
→ the `proba` sentence appears in the group, and no "(nem ment ki)" line in `uzenetek.txt`.

**GitHub (Q6, no terminal):** repository Settings → Rules → Rulesets → New branch ruleset, target `main`, tick only
"Restrict deletions" and "Block force pushes". (Assumed: rulesets on a private repo may need a paid plan; if not offered, skip.)

**Switch back:** `echo "KAPU=0" > ~/.config/gigabyte-robot/beallitas` — the old path runs again from the next minute.

## Manual fallback

`bash tools/gigabyte-robot/robot.sh --sha <sha>` on the Gigabyte: the same gate, the same lock, the same deploy. The old
step-by-step `nas/kirak.sh` remains for emergencies only; it bypasses the gate and the lock.

## Measured / not measured (2026-10-07, cloud copy of the repo)

- Measured here: all checks and all 16 test packages on `edf3016`+c4, with Postgres **18.4** (npm binaries, `KAPU_MOD=helyi`),
  all 154 migrations from scratch in 11 s, the app via `next start`, the image maker on :8601. Result: 1403 tests — 1367 green,
  20 failing entries (18 failing tests + 2 files whose `beforeAll` fails), 16 skipped (the tests of those 2 files) — all in the
  baseline. Boundary checker: exactly the 2 old cycles. Everything else in `ellenoriz` green after the F-11 fix.
- **Not measured here:** `KAPU_MOD=docker` (Docker Hub is blocked from the cloud sandbox: no `postgres:18-alpine`,
  no `node:24-alpine`, so no image build and no `migral.sh` backup step inside the gate), the real NAS, the real Telegram API,
  systemd units. Batch 2 measures the docker mode on the Gigabyte.
