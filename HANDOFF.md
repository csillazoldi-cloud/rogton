# HANDOFF — Rögtön (newest on top)

## 2026-10-18 G3 — Hungarian-only interface

- `@rogton/design-system` nyelvek.ts: `FELULETI_NYELVEK = ['hu']`, `ALAP_NYELV = 'hu'` (was `en`), `feluletiNyelv()`,
  `VAN_NYELVVALASZTAS`. `NYELVEK` stays `['hu','ro','en']`: label storage, the label editor and the content languages still use it.
- `nyelvDontes` / `hatasosNyelv` always give `hu` while there is one UI language (a `ro` account language or a Romanian-first
  workspace still gets a Hungarian UI; its content languages are untouched). `/api/nyelv` accepts only `hu` (ro/en → 400).
- `Nyelvvalaszto`, `NyelvValasztoSav` render nothing, the Saját fiók language field is hidden, while `VAN_NYELVVALASZTAS` is false.
- New `probak/g3-csak-magyar.proba.ts` (9): every key has hu (DB + JSON), /api/nyelv, Romanian browser → hu page, no selector in
  the DOM on 9 pages. Mutation (three UI languages) → 7 of 9 red.
- 15 tests of the multi-language UI are now `skipIf(!VAN_NYELVVALASZTAS)` and 3 RO/EN-UI assertions sit under
  `if (VAN_NYELVVALASZTAS)`, each with the reason in place (r17-nyelv, nyelv-ai 1/3/4/5/fordított, nyelv-munkater en,
  hirfigyelo-felulet ro/en, c30-f4 RO/EN UI, feliratok 5 RO page).
- apps/web 1086/1039/16/31: failure list identical to abfbf73; +15 skips listed above; +9 new tests.

## 2026-10-18 G2 — single-host operations files (no machine touched)

- New `uzem/`: `docker-compose.yml` (project `gma`: gma-db Postgres 18, gma-app, gma-kepgyar internal-only, gma-web nginx on
  `127.0.0.1:8410`; networks `gma-belso` internal + `gma-kimeno`; G6 egress as a commented placeholder, exit country Hungary),
  `nginx.conf` (no /allapot, no /referencia, `server_tokens off`, `access_log off`, 300 s proxy timeouts, 12m default / 100m on
  `/api/arculat/fajl`), `.env.pelda` (every env var, NEW/COPY/REMOVED), `kirak.sh` (lock → fetch → git archive → build
  `gma-app:<sha12>` + `gma-kepgyar:<sha12>` → tiltott guard → migral.sh backup + migrations → DB label guard → `:aktiv`/`:elozo`
  switch → health on 127.0.0.1:8410 → crawl guard; rollback only when no migration ran), `systemd/gma-kirak.{service,timer}`,
  `README.md` with the Gigabyte batches (Batch 2 is the one sudo batch).
- `nas/` is gone. Tests: `nas-kotet-mappak.proba.ts` → `uzem-kotet-mappak.proba.ts` (same purpose, now on uzem/; +1 check: only
  127.0.0.1:8410 published, db/kepgyar internal); `c5-kor3` nginx expectation 105m → 100m on `uzem/nginx.conf` (reason in place).
- Bind mounts use absolute `$GMA_GYOKER/...` paths; kirak.sh copies config INTO the same folders so containers keep seeing them.
- Gotcha: a bind mount of a symlinked folder keeps the old target until the container is re-created — that is why config is
  copied into `~/gma/uzem-aktiv/`, not symlinked.
- Gotcha: `kirak.sh` runs from `~/admin`; the checkout moves to the live commit after a successful deploy, so a kirak.sh change
  takes effect from the next deploy.
- NOT VERIFIED here: the Docker images were not built (this sandbox cannot pull base images); the units were only
  `systemd-analyze verify`-ed; `kirak.sh` never ran against Docker.

## 2026-10-18 G1 — fork cleanup

- Scope renamed `@km/*` → `@rogton/*`, root package `rogton`; lockfile regenerated only to drop the removed workspace (no version moved).
- Removed: `apps/referencia-host`, `nas/ai-hid`, `nas/public` (status page), the NAS/Gigabyte helper scripts, `tools/allapot`,
  `tools/gigabyte-robot`, `tools/kapu`, `tools/titok`, `tools/dell`, `tools/agens`, `tools/meres`, `tools/r16`, `tools/semak`,
  the old team docs, `docs/` (except `MODULSZABALY.md`) and `design/` (except the label JSONs and four drawings the tests read).
- `nas/adatbazis` → `uzem/adatbazis` (init + migration runner). `nas/docker-compose.yml`, `nginx.conf`, `kirak*.sh` stay until G2
  replaces them (two tests read them).
- `ellenoriz` no longer runs `allapotor`.
- Checks: tipus 0 · hatar = the 2 known cycles (same as baseline) · tokenor 0 · keretor ✔ · apps/web 1077/1045/16/16, identical
  failure and skip list to abfbf73 · packages all green.
