# HANDOFF — Rögtön (newest on top)

## 2026-10-18 G5b — no „teszt” mark, Saira Condensed UI font, no Google Fonts

- „teszt” chip removed from the public headers (`Keretek.tsx`); `0183_g5b_teszt_jelzes_nelkul.sql` drops „· teszt” from
  `kezdolap.sor` (dry run INSERT 0 3).
- `--font-code` (buttons, nav/menu items, chips, labels) → Saira Condensed in both modes; `--fs-ui` 15px, `--fs-gomb` 16px,
  `--fw-ui` 600. New `--font-mono` (JetBrains Mono) only on code/ID places: theme keys / colour codes / JSON import field / spacing
  field, label keys, URL input, account code cell, language codes.
- The Google Fonts stylesheet for the brand-font picker samples is gone (TODO in `layout.tsx`: self-host the samples later).
- Tests: new `g5b-arculat.proba.ts` (4); `modok.proba` `--fs-ui` 13 → 15 px with the reason. Failure list identical to abfbf73;
  Tibor 36/46, nothing worse than abfbf73, Kezdőlap/Posztszöveg/Képek at 390 green.

## 2026-10-18 G5 — re-skin (gyorsmedia palette, Saira, » logo, dark by default)

- Tokens: `tema-sotet.json` (neon primary with ink text, orange accent, white text on ink), `tema-vilagos.json` (ink primary with
  neon text, orange fill with ink text, #B83200 for orange text), radii 2–4 px; `modok.ts` glass / aurora (neon + orange, low),
  new `--marka-jel`, `--on-accent`, `--marka-arany`, `--cap-ratio` 0.688 (Saira Condensed, measured from the font file).
- Fonts: Saira 400–700 + Saira Condensed 600/700 (latin + latin-ext) self-hosted; Inter / Inter Tight files and the a/t PNGs removed.
- Logo: `Marka.tsx` draws the » (gyorsmedia favicon geometry) and the outlined „Rögtön” wordmark (Saira Condensed 800, −12°).
- Icons regenerated from the » by `tools/kepernyokep/ikonok.mjs` (same file names; favicon.ico = 16 + 32 px PNG-in-ICO).
- Dark by default (`MOD_FEJ_SZKRIPT`; the toggle no longer follows the device). Calendar „today” dot text uses `--on-accent`.
- Tests (reasons in place): `modok.proba` (palette rule instead of „one purple”, 16 font files, Saira), `r18-arculat` (PNGs gone,
  `--primary:#d0ff2c`). apps/web failure list identical to abfbf73; Tibor: nothing worse, 8 better. Decision doc:
  `docs/decisions/2026-10-18-g5-arculat.md` (contrast table).

## 2026-10-18 G4 — identity scrub + banned-string guard

- **Labels:** `0181_g4_rogton_nev_es_peldak.sql` (128 rows, hu/ro/en): product name → Rögtön (also the old name's RO/EN
  translations), the old company name, the old city / village examples → Debrecen, the „30 lej” example → 3000 Ft, the
  data-location line „Románia” → „az Európai Unióban”, „100 MB” → „95 MB”. `0182_g4_magyar_forraspeldak.sql` (13 rows): site
  examples → telex.hu / probapekseg.hu. Dry runs: INSERT 0 128 / INSERT 0 13, ROLLBACK. JSON base files edited the same way
  (hf.* stay in sync with the DB).
- **Code:** feedback Telegram/hub senders removed (`apps/web/visszajelzes/ertesites.ts`, `visszajelzes-core/src/ertesites.ts` and their
  two test files; the runner hook is gone; the daily package stays in the DB). Faint wordmark (`HalvanyLogo`, its CSS, two PNGs)
  removed. `/` redirects to `/belepes` (or `/kezdolap` when logged in); `Nyitolap.tsx` removed. Manifest name Rögtön.
  Timezone Europe/Bucharest → Europe/Budapest in all code (72 places). UA `Mozilla/5.0 (compatible; RogtonBot/1.0)` (robots.txt token
  `rogtonbot`). Image-maker default `http://kepgyar:8601`, Ollama default `127.0.0.1`. Upload cap 95 MB (Cloudflare reason in place).
  Prompts: names out of the version headers, old-city rows out of the place-name tables (Kolozsvár examples). Test-AI fixtures →
  Debrecen. News-source list → 7 national + 5 trade Hungarian feeds, all measured live RSS on 2026-10-18.
- **Image hygiene:** the standalone build had traced the whole `apps/web` (458 .ts files incl. tests) because of two dynamic fs
  calls (`fajl/tar.ts`, `visszajelzes/export.ts`) — fixed with `turbopackIgnore` + tracing excludes; now `.next/standalone/apps/web`
  holds only `.next`, `prompts`, `server.js`. The Dockerfile deletes `*.map` (server source maps carried the comments).
- **Guard:** `tools/tiltott/` (`minta.txt`, `engedett.txt`, `ellenoriz.mjs`), `pnpm tiltott` at the end of `ellenoriz`. Modes:
  repo (default), `--kep`, `--db`, `--bejar [--fiok]`, `--sql-minta`. Old migrations: comment lines tolerated; label rows tolerated
  ONLY when a 0181+ migration overwrites the same (key, lang) — checked structurally. Results: repo 0, simulated image 0, DB 0,
  crawl of the standalone server (262 URLs, logged in) 0. Mutations: DB label → red (db + crawl), new migration with the old city → red.
- **Tests (reasons in place):** 95 MB boundaries (fajl-core, nagy-feltoltes), Budapest times (futas, album-szabaly, horgony),
  place-name tables (poszt-bemenet, poszt-forditas-elavult), feed list (forras-ajanlo, szakmai-hely), r18-arculat (PNGs gone),
  vj-tg-hub (now asserts the sender is gone), c30-f6 (fixture place). Removed: c1c7-ertesitesek, visszajelzes-core ertesites.
  apps/web 1081/1034/16/31, failure list identical to abfbf73.
- **kirak.sh dry run** (fake `docker`, real git archive / migral.sh / psql / guard / nginx on :8410 / curl): first deploy → 183
  migrations, label guard 0, health 200, crawl 0, exit 0; second run → no-op; nginx down → exit 4 with rollback to `:elozo`;
  banned word in the image → exit 5. Two fixes from it: the health code read „000000” on a refused connection; a first deploy with
  no previous image now says so instead of claiming a rollback. Log: plan-out/kirak-szaraz-futas.log.
- **Gotcha:** a dynamic `fs` path in any server module makes Turbopack trace the whole project into the standalone output —
  watch for the „Dynamic filesystem access causes tracing of the whole project” warning in `pnpm epit`.

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
