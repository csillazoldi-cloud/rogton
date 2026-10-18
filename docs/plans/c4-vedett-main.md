# c4 — Protected `main`: automatic checks before deploy, one deploy at a time

Hub chunk: **c4** ("Protect main: automatic checks before merge, one deploy at a time").
Status of this document: **implementation proposal** (EGYUTTMUKODES rule 12). Nothing here is a requirement until Csilla says so.
Written 2026-10-06 against `main` = `edf3016`. Every "measured" claim below was read from the code at that commit, in a cloud
copy of the repo; nothing was run on the Gigabyte or the NAS. Claims about the live machines are marked **assumed** and are the
first thing chunk K1 measures.

---

## 1. Summary (the recommendation)

Put the gate **inside the Gigabyte robot**, not in GitHub.

1. The robot reads `origin/main`, waits until it has been quiet for 2 minutes, and **pins that one SHA**.
2. It checks out that SHA into a **clean worktree** and runs, on the Gigabyte only: `pnpm ellenoriz` + every test package, the
   live tests included, against a **throwaway Postgres 18 + the just-built app image** on a private Docker network.
3. It compares failures and skips against a committed **known-failures baseline** (`tools/kapu/ismert-bukasok.json`, every entry
   with a reason). Green or "no worse than the baseline" → deploy. Anything new red → **no deploy**, Csilla gets one message
   naming the failing test.
4. The deploy uses **only that SHA**: images built from the worktree and labelled with the SHA, the source package made with
   `git archive <sha>`, no `git pull` anywhere in the deploy path. After the deploy the robot reads the SHA back from the NAS
   (image label + `forras/VALTOZAT`) and only then says "live".
5. Order on the NAS becomes: backup → migrations → app swap (today the new app starts first, then migrations run).

GitHub branch protection adds little and would break the current `git am` + push workflow; the only GitHub setting worth having
is "no force-push / no deletion on `main`" (needs Vilmos, see §8).

---

## 2. Current state — measured in code

### 2.1 What runs on a push today

| Step | Where | What it does |
|---|---|---|
| Timer | `tools/gigabyte-robot/gigabyte-robot.timer:6` | `OnUnitInactiveSec=1min` — one minute after the previous run ends |
| Lock | `robot.sh:35-36` | `flock -n` on `~/.local/state/gigabyte-robot/zar`; a second run exits silently |
| Change check | `robot.sh:41-47` | `git fetch`; compare local `HEAD` with `origin/main`; equal → exit 0 silently |
| Dirty check | `robot.sh:50-54` | uncommitted files → skip + message |
| **Fetch #1** | `robot.sh:56-57` | `git merge --ff-only origin/main` — local `HEAD` moves to the new SHA **before** anything is checked |
| Checks | `nas/teljes-kirakas.sh:36-46` | `pnpm ellenoriz` **only if `pnpm` is on PATH**; otherwise prints `KIMARADT` and goes on |
| **Fetch #2** | `nas/gigabyte-forditas.sh:86` | the build (`epit saas`, run in the background) does its own `git pull --ff-only` |
| Build | `gigabyte-forditas.sh:88-101` | `docker build` app + referencia, `docker save` → `/tmp/saas-kepek.tgz`; image tag is always `:helyi` |
| Wait | `teljes-kirakas.sh:53-86` | polls the build log until `KESZ:<code>` |
| Image maker | `teljes-kirakas.sh:92-97` | `apps/kepgyar/indit.sh --ha-valtozott` rebuilds the live `km-kepgyar` on the Gigabyte if its fingerprint changed |
| **Fetch #3** | `nas/kirak.sh:84-89` (`--kepek`) | `git pull --ff-only` again, then tars the working tree → NAS `forras/` (compose, nginx.conf, **migrations**) |
| Load | `kirak.sh:104` | `docker load` on the NAS |
| Start | `kirak.sh:112` | `docker compose up -d --no-build` — **the new app starts here** |
| Migrations | `kirak.sh:120-121` → `nas/adatbazis/migral.sh` | backup (`pg_dump`) **only if there are new migrations**, then each file in its own transaction |
| Health | `teljes-kirakas.sh:116-131` | `curl https://saas…/` until 200; on failure "rollback" = stop `aitmetica-saas-web`, start `aitmetica-saas-web-regi` |
| Message | `robot.sh:66,72` → `uzenet.sh:6` | appends one line to `~/.local/state/gigabyte-robot/uzenetek.txt` — **nothing else**; the phone line is commented out (`uzenet.sh:8-10`) |

### 2.2 Findings

- **F1 — Three separate fetches of `main` in one deploy** (`robot.sh:56`, `gigabyte-forditas.sh:86`, `kirak.sh:84`). The SHA that
  was checked, the SHA that was built and the SHA whose source/migrations reach the NAS can all differ.
- **F2 — A failed deploy is never retried.** `robot.sh:56` moves `HEAD` before deploying. If the deploy then fails for any reason
  (NAS memory gate `kirak.sh:49`, Gigabyte load `gigabyte-forditas.sh:72`, network), the next tick sees `HEAD == origin/main`
  (`robot.sh:45`) and exits silently. That SHA stays undeployed until someone pushes again.
- **F3 — The robot runs no checks today (assumed, strong).** The Gigabyte host has no node/pnpm (HANDOFF.md:788 — "A gazdagépen
  nincs node/pnpm"; checks run in a Docker wrapper, `tools/gigabyte-pnpm.sh`). `teljes-kirakas.sh:36` therefore takes the
  `KIMARADT` branch. Supporting evidence: `pnpm ellenoriz` is **red on `main`** — `hatar` reports "the same 2 old cycles"
  (HANDOFF.md:29) under the `nincs-kor` rule with `severity: "error"` (`.dependency-cruiser.cjs:220-225`), and `allapotor`
  reports "gazdátlan szakasz: F-11" and exits 1 (`tools/allapot/allapotor.mjs:33,41`). If the checks ran, **every** deploy would
  stop at exit 3; deploys do happen, so they do not run. K1 measures this.
- **F4 — Unit tests are not part of the robot at all.** `ellenoriz` (`package.json`) = hatar, tokenor, keretor, terkoz, Dockerfile
  guard, allapotor, tipus, epit. No `proba`.
- **F5 — The new app runs before its migrations** (`kirak.sh:112` before `:121`). For the length of the migration — or forever, if
  a migration fails — the new code runs on the old schema.
- **F6 — The rollback does not roll back the app.** `teljes-kirakas.sh:126-130` swaps the **nginx** container (`web` →
  `web-regi`); the app image is overwritten in place (`:helyi`, `gigabyte-forditas.sh:19-21`), so no previous app image exists to
  return to. There is no DB rollback (correct — but it means a migration is one-way).
- **F7 — Nobody is told.** `uzenet.sh` only writes a local file on the Gigabyte.
- **F8 — The manual fallback bypasses the lock.** `teljes-kirakas.sh:28-31` takes the Gigabyte flock, but the manual fallback
  (`nas/kirak.sh` from a Mac, as in the project instructions) takes no lock at all and does its own `git pull`.
- **F9 — The 19 known failing tests are not written down anywhere in the repo.** HANDOFF says "the same 19 names" (lines 29, 57,
  87, 127) but the list lives only in cloud scratch folders. `grep` finds no list.
- **F10 — The live tests clean up with `DELETE`** (`apps/web/probak/segedek.ts:33-37`, `takaritas()`), against whatever
  `DATABASE_URL` says. Several live test files have **no** `skipIf` guard (e.g. `kredit.proba.ts`, `sema.proba.ts`,
  `nyelv-munkater.proba.ts`, `hf-temak.proba.ts`, `arculat-fajl-hibak.proba.ts`, `visszajelzes-export.proba.ts`); without a
  server they fail (connection refused). **Assumed:** a good part of the 19 known failures are of this kind.

---

## 3. Root cause of the 09-21 and 09-22 incidents

**09-21 (HANDOFF.md:651-653, measured then):** two pushes within 2 minutes. Sequence that fits the code:
robot tick merges SHA **A** (`robot.sh:56`) → build starts and its `git pull` still sees A → image = A → meanwhile B is pushed →
`kirak.sh --kepek` pulls again (`kirak.sh:84`) → working tree and the NAS `forras/` = **B** (B's migrations, compose, nginx.conf)
→ next tick: `HEAD == origin/main == B` → "nothing to do". Result exactly as recorded: A's image, B's source, B's code never built.
**Cause: F1 + the "local HEAD = deployed" assumption.**

**09-22 (HANDOFF.md:554, 578):** pushes at 10:05 and 11:10 UTC not deployed; "the Gigabyte was stopped, the NAS source folder
stayed old". Two failure modes fit, and the record does not say which: the robot was not running at all, or a run started, moved
`HEAD` and then failed (F2), after which every tick was silent (F7). **Cause: F2 + F7** — a deploy can fail or never start
and nobody finds out until a human looks.

---

## 4. Design

### 4.1 Robot loop (rewritten `robot.sh`)

State in `~/.local/state/gigabyte-robot/` (never in the repo — the T-7 lesson, `.gitignore:29-31`):
`kint` (SHA confirmed live), `utolso-proba` (SHA + verdict + reason class), `szivdobbanas` (last tick time).

```
every minute:
  fetch origin/main → T
  if T == kint                      → idle
  if T changed less than 2 min ago  → wait (quiet period; batches bursts of pushes)
  if T == utolso-proba and verdict == code-red → idle (do not retry a red SHA every minute; one message was sent)
  if T == utolso-proba and verdict == infra    → retry with backoff (5, 15, 30 min), message after the 2nd failure
  take the lock → kapu.sh T → deploy T → verify T is live → kint = T
```

- The robot's own clone is **never moved** by the deploy; it only fetches. Each run works in
  `~/saas-kapu/<sha12>/` (`git worktree add --detach`), removed (moved to `~/saas-kapu/_torolni/`) after the run.
- Only the newest SHA is ever deployed; intermediate SHAs in a burst are skipped on purpose (one deploy per change set —
  NAS rule 2).
- `--sha <sha>` runs the same path for an explicit SHA (manual fallback, see 4.6).

### 4.2 The gate (`tools/kapu/kapu.sh <sha>`)

All on the Gigabyte, nothing on the NAS, no AI models (the app runs with `AI_SZOLGALTATO=teszt`).

1. Worktree at SHA; `pnpm install --frozen-lockfile` through the Docker node:24 wrapper (a parameterised copy of
   `tools/gigabyte-pnpm.sh`, which today hard-codes `~/projektek/saas`).
2. `pnpm ellenoriz` — each sub-check recorded separately, so a known red (the 2 cycles) can be baselined without hiding a new one.
3. Build the app + referencia images from the worktree, labelled `km.valtozat=<sha>`, tagged `:<sha12>` (and `:helyi` only after
   the gate is green).
4. Throwaway test environment (K2): Docker network `kapu-<sha12>`, `postgres:18-alpine` with the worktree's
   `nas/adatbazis/init` + `migral.sh` → **all migrations from scratch**, then the app container from the image of step 3,
   `AI_SZOLGALTATO=teszt`, `FAJL_MAPPA` bind-mounted to a temp folder that the test process also sees, ports on `127.0.0.1` only,
   random passwords generated per run and never written to disk outside the run folder.
5. Every package's `vitest run --reporter=json` (+ `apps/web` with `PROBA_CIM`, `DATABASE_URL`, `PROBA_APP_DATABASE_URL`,
   `FAJL_MAPPA` pointing at the throwaway environment).
6. Compare with the baseline → `kapu-<sha12>.json`: `zold` | `nem-rosszabb` | `piros`, with new failures, newly skipped tests,
   tests that now pass but are still in the baseline, and baseline entries added by this commit.
7. Tear down the environment (containers + network + volume carry the label `km.kapu=<sha12>`; teardown is verified).

**Verdict rule:** deploy if (failures ⊆ baseline failures) and (skips ⊆ baseline skips) and every ellenoriz sub-check is green or
baselined. Anything else is red. Fixed tests still in the baseline are reported, not red.

Expected time (**assumed**, measured in K3): install ~1 min cached, ellenoriz incl. `next build` 2–4 min, image build ~1 min
(65 s measured in NAS-NAPLO 2026-09-10), tests 2–4 min → **push to live goes from ~1–2 min to roughly 8–12 min.**
`TimeoutStartSec=2700` (`gigabyte-robot.service:9`) leaves room.

### 4.3 The never-run tests

`kredit.proba.ts`, `sema.proba.ts` and the 4 live tests (`nyelv-munkater`, `hf-temak`, `arculat-fajl-hibak`,
`visszajelzes-export`) need exactly what step 4 provides: a running server + Postgres with `km_tulaj` access. They run for the
first time in K2, by hand, before the gate depends on them. Whatever fails then is triaged: real bug → fixed in its own commit;
wrong expectation → fixed with the reason written in place (rule 10); environment-only → baseline with reason.
`vz1-kozlemeny` live tests also call the image maker on `:8601`; on the Gigabyte that is the **live** `km-kepgyar` (V-6), which the
tests only read from (**assumed**, checked in K2).

### 4.4 Deploy of exactly one SHA

- Images: `docker save aitmetica-saas-app:<sha12> aitmetica-saas-referencia:<sha12>`; on the NAS after `docker load`, retag to
  `:helyi` (compose keeps working unchanged) and keep the previous `:helyi` as `:elozo`.
- Source: `git archive <sha>` + a `VALTOZAT` file → NAS `forras/` (same place as today; the old one still goes to `_torolni/`).
- Order on the NAS: NAS memory gate (`kirak.sh:35-50`, unchanged) → `migral.sh` from a throwaway `compose run --rm` container
  against the new `forras/` (it backs up first when there is a new migration, `migral.sh:33-63`) → only then
  `compose up -d --no-build` for app/referencia → health.
- Verify: `docker inspect aitmetica-saas-app` label `km.valtozat` == SHA **and** `forras/VALTOZAT` == SHA **and** HTTP 200.
  Only then `kint = SHA` and the "live" message.
- The image maker (`apps/kepgyar/indit.sh --ha-valtozott`) is fingerprinted from `git ls-tree HEAD` (`indit.sh:26`); it runs
  from the worktree so `HEAD` is the pinned SHA.

### 4.5 Lock

One lock file on the Gigabyte (`~/.local/state/gigabyte-robot/zar`), taken for the whole run (gate + deploy). Every deploy path
goes through the robot, so one lock is enough (4.6).

### 4.6 Manual fallback

Today's Mac → `nas/kirak.sh` path always needed the Gigabyte anyway (it builds there). New fallback = on the Gigabyte:
`bash tools/gigabyte-robot/robot.sh --sha <sha>` (same gate, same lock). The old step-by-step `kirak.sh` stays for emergencies
but prints a warning and refuses to run while the robot lock is held (it checks the lock over SSH with the existing
`gigabyte-parancs.sh allapot`-style call). Nothing is removed.

---

## 5. Data-loss risks (top risk first)

1. **Live tests deleting rows in a real database.** `takaritas()` deletes `fiok` and `szervezet` rows (`segedek.ts:33-37`). If
   `DATABASE_URL` ever pointed at the NAS, test accounts (and with a bug, more) would go.
   *Mitigation:* the gate sets `DATABASE_URL` itself, only to the container it just created; `kapu.sh` refuses to start tests
   unless the DB host is `127.0.0.1` on the run's port **and** the DB carries a marker written at creation
   (`COMMENT ON DATABASE km IS 'kapu-<sha12>'`). The robot never has NAS DB credentials. Tests never run on the NAS.
2. **A migration runs from a commit that should not have shipped.** Today possible (F3). *Mitigation:* the gate is green before
   the NAS is contacted at all; all migrations are applied from scratch in the throwaway DB as part of the gate.
3. **Migration succeeds, app fails health → app/schema mismatch.** Migrations are one-way. *Mitigation:* order backup → migrate
   → app; previous app image kept as `:elozo`; automatic app rollback **only if no migration ran in this deploy**; if one did,
   the robot stops, keeps the new app running and sends a red message with the backup file name — the DB restore is a human
   decision (Csilla, Vilmos), never automatic. Proposed rule (open question Q5): migrations must be additive so the previous app
   still works on the new schema.
4. **Backup ordering.** `migral.sh` backs up only when there is a new migration and refuses to migrate if the backup fails — this
   stays exactly as is. The backup is on the same volume as the DB (`adatok/postgres/mentes`); the nightly `mentes.sh` copy goes
   to volume1 (D-18). No change proposed in c4.
5. **Two deploys interleaving.** *Mitigation:* single lock + pinned SHA + read-back verification (4.4, 4.5).
6. **Disk on the Gigabyte.** Each run adds images and a worktree. *Mitigation:* keep the last 5 `:<sha12>` image tags; older tags
   and worktrees are moved/untagged, never `docker system prune`. The existing 15 GB free-disk gate (`gigabyte-forditas.sh:71`)
   is reused.

---

## 6. Known-failures baseline format

File: `tools/kapu/ismert-bukasok.json` (committed; changing it is changing a test expectation → rule 10 applies).

```json
{
  "valtozat": 1,
  "bukasok": [
    {
      "azonosito": "apps/web::probak/pelda.proba.ts::leíró blokk > teszt neve",
      "fajta": "bukik",
      "ok": "Needs SMTP; the gate environment has none. Not a product bug.",
      "felvette": "2026-10-07 Csilla",
      "kod_ota": "edf3016"
    },
    {
      "azonosito": "ellenoriz::hatar::nincs-kor",
      "fajta": "ellenoriz",
      "ok": "2 old import cycles (list them); fix tracked as hub chunk cX.",
      "felvette": "2026-10-07 Csilla",
      "kod_ota": "edf3016"
    }
  ],
  "kimaradhat": [
    { "azonosito": "packages/ai-adapters::probak/openai.proba.ts::…", "ok": "Needs a real OpenAI key; never in the gate." }
  ]
}
```

Rules enforced by `kapu.sh`: `ok` non-empty (≥ 15 characters); `azonosito` unique; an entry added in the commit being checked is
listed in the message ("baseline grew: …"); a baseline test that passes is reported as "can be removed"; entries are never removed
silently — removal is a normal commit.

---

## 7. How Csilla hears about it

Messages are Hungarian, one or two lines, from `uzenet.sh` (which keeps writing the local file as well):

| When | Text (draft) |
|---|---|
| Live | `Kint van: 906ce42 — „VZ-1: Szöveges képek” (9 perc).` |
| Refused | `Nem raktam ki: 906ce42. Új hiba: vz1-kozlemeny.proba.ts › „letöltés után…”. A teszt kint marad a régin.` |
| Infra problem, 2nd try failed | `Elakadt a kirakás (a NAS foglalt). 30 perc múlva újra próbálom.` |
| Migration ran, health red | `PIROS: 0154 lefutott, az oldal nem válaszol. Mentés: …-elotte-0154.sql.gz. Döntés kell.` |
| Daily heartbeat (09:00) | only if something is wrong: robot not ticking for >30 min while the Gigabyte is up, or `kint` ≠ `origin/main` for >2 h |

Channel (recommended): the Telegram bot planned for c7, to Csilla's chat. The token then has to live on the Gigabyte too
(`~/.config/gigabyte-robot/telegram`, mode 600) — a new secret location → Vilmos (§8). Until that is signed off: the local file
plus the same lines in the robot's run log, and the hub `log_work` is done by the session as today.

---

## 8. What needs Vilmos's sign-off

| Item | Why |
|---|---|
| Telegram bot token stored on the Gigabyte | new secret location |
| GitHub: protect `main` against force-push and deletion | repository permissions |
| Any change to `nas/gigabyte-forditas.sh` (the forced-command script behind the restricted key) | access path. The plan avoids it: the robot builds directly in the worktree and does not call the forced-command script. |
| The rule that the robot may refuse a deploy | changes how the test site is fed; agree before switching on (product process, not security) |

Not needing him: the gate scripts, the throwaway environment (no secrets, no outside exposure, ports on 127.0.0.1 only),
the baseline file.

### Does GitHub branch protection add anything?

Little. Required pull requests or required status checks would break the current flow (cloud agents' patches → `git am` →
Csilla pushes to `main`) and need a status reporter with a GitHub write token (another secret). **Assumed:** branch protection on
a private repository of a personal account (`Tolgyes`) needs a paid GitHub plan. The one cheap, useful setting is "block
force-push and deletion on `main`": a rewritten `main` would make the robot's fast-forward logic fail. Recommended, with
Vilmos's yes; nothing else on GitHub.

---

## 9. Build chunks

Each chunk ends deployed or explicitly "not deployed", with its self-test output and a screenshot where there is a screen.

**K1 — Measure and write the baseline (read-only on the Gigabyte).**
Measure F3 (`command -v pnpm` as `gigabyte` under systemd; the `KIMARADT` line in `~/.local/state/gigabyte-robot/utolso.log`),
read `docs/robot-naplo.jsonl` for the 09-21/09-22 runs, run the full test suite by hand twice in a temporary environment and
write `tools/kapu/ismert-bukasok.json` with every failure and its reason. Fix the stale F-11 status section (status data only).
*Self-test:* two runs give the same failure set (no flaky test unlisted); every entry has a reason; `allapotor` green.

**K2 — Throwaway test environment (`tools/kapu/proba-kornyezet.sh fel|le <sha>`).**
*Self-test:* migrations 0001…latest apply from scratch; `/api/egeszseg` 200 from the container; the never-run tests (kredit,
sema, 4 live) run and their result is recorded; the DB-marker guard refuses a fake `DATABASE_URL` pointing elsewhere; after
`le`, `docker ps -a --filter label=km.kapu` and `docker volume ls --filter label=km.kapu` are empty.

**K3 — The gate (`tools/kapu/kapu.sh <sha>`).**
*Self-test:* on current `main` → `zold` or `nem-rosszabb`; on a local, never-pushed commit with one broken assertion → `piros`
naming exactly that test; on a commit adding a baseline entry with an empty reason → `piros`; on a commit that makes a live test
skip → `piros`. Time measured and written into this plan.

**K4 — Robot with pinned SHA (`robot.sh` rewrite + `kirak.sh --sha` path).**
*Self-test (all with `--proba`, no NAS contact):* point the robot at a scratch branch (`AG=kapu-proba`), push two commits 30 s
apart → exactly one run, for the second SHA; a red SHA is tried once and not again; a simulated infra failure is retried with
backoff; `kill -9` mid-run → next tick starts cleanly; no `git pull` left in the deploy path (`grep`).

**K5 — NAS order, verification, rollback, messages.**
Migrate-before-swap, `:elozo` image, read-back of `km.valtozat` + `forras/VALTOZAT`, app rollback only without migration,
`uzenet.sh` channel (file now; Telegram after sign-off).
*Self-test:* one real deploy of a harmless commit (status-page text) with Csilla's go-ahead, NAS measured before (`free -m`,
`uptime`), read-back shows the SHA, screenshot; the rollback is exercised once on the NAS only with an explicit go-ahead, on a
commit without migrations.

**K6 — Switch on, document, hand over.**
`telepit.sh` installs the new units; EGYENES-UT §7 and the project instructions' Deploy section updated; HANDOFF, state.md
(Gotchas: "the robot refuses red SHAs; baseline file"), hub chunk c4 done. GitHub force-push protection if Vilmos agreed.
*Self-test:* one ordinary push goes live through the gate unattended; one deliberately red commit on the scratch branch is
refused with the right message.

---

## 10. Open questions — recommended default in bold

| # | Question | Recommended default |
|---|---|---|
| Q1 | Deploy when results are "no worse than the baseline", or only when everything is green? | **No worse than the baseline.** All-green would block every deploy today (19 known failures, 2 cycles). |
| Q2 | How long a quiet period after the last push? | **2 minutes.** Enough to batch a burst of `git am` pushes. |
| Q3 | May a commit add to the baseline by itself? | **Yes, with a reason, and the message says so loudly.** Csilla can push a revert. |
| Q4 | Notification channel? | **The c7 Telegram bot to Csilla** (Vilmos signs off the token on the Gigabyte); local file until then. |
| Q5 | Rule: migrations must be additive (the previous app keeps working on the new schema)? | **Yes.** It is what makes an app rollback safe. |
| Q6 | GitHub branch protection? | **Only "no force-push, no deletion" on `main`**, with Vilmos's yes. No required PRs or checks. |
| Q7 | Test new migrations against a copy of the NAS data on the Gigabyte? | **No.** From-scratch DB in the gate; the manual `BEGIN…ROLLBACK` dry run on the NAS stays for risky migrations. Copying tenant data to another machine would need Vilmos. |
| Q8 | Fix the 2 import cycles and F-11 now, or baseline them? | **Fix F-11 in K1 (status data only); baseline the 2 cycles with a reason** and give them their own hub chunk. |
| Q9 | Accept ~8–12 min from push to live instead of ~1–2? | **Yes.** Measured in K3; if longer, split fast checks (deploy) from slow ones (report after). |

---

## 11. Things in the code that differ from the brief

- The race is **three** fetches, not two (F1); and a failed deploy is silently never retried (F2).
- The robot almost certainly runs **no** checks today (F3, assumed): no pnpm on the host, and `ellenoriz` is red on `main`.
- `uzenet.sh` reaches nobody (F7).
- The "rollback" restores nginx, not the app, and migrations run after the new app has started (F5, F6).
- The 19 known failures are not recorded in the repo (F9).
