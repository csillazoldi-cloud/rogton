# HANDOFF — 2026-10-17 c30 F12: a festival never sees „cég / company / firmă” — label variants by org type, festival prompts, festival image samples (NOT pushed)

- **Base:** F10 (`4739290`, the amended F10 commit). Csilla 10-17 19:26. Decision doc: `docs/decisions/2026-10-17-c30-f12-fesztival-szavak.md`.
- **Mechanism:** a variant is a label row `<key>@fesztival` (HU/RO/EN). `szovegek/fesztival.ts` `tipusValtozat` runs last in `lapFeliratai`:
  strips every `@fesztival` key for all orgs (company dictionary byte-identical) and, for a festival, puts each variant on its base key
  unless the org has its own override. Suffix `@`, not `.`: `c30.tipus.fesztival` is a real key (caught by the dry run; guarded by a test).
- **Migration:** `0180_c30_f12_fesztival_feliratok.sql` — 44 keys × 3 = 132 rows (nav.cegeim → „Szervezeteim”, iránytű/összhang, kezdőlap,
  hírfigyelő, arculat, beállítások, Képek samples „Ilyen volt” / „Jegy, kedvezmény”, festival iránytű examples). Dry run: INSERT 132, rerun 132, ROLLBACK.
  The 4 `hf.*` variants also in `packages/news-monitor-feliratok/feliratok/hf.*.json`.
- **Code:** `ai/fesztival-szo.ts` (cég → fesztivál in 9 prompts + the machine's input phrases), `ai/index.ts` `prompt(…, tipus)`,
  `poszt/index.ts`, `poszt/profil-blokk.ts` („=== A FESZTIVÁL PROFILJA ===”), `iranytu/javaslat.ts`, `vizual/melle.ts`, `vizual/peldak.ts`,
  `vizual/helyzet.ts` (`KepArculat.fesztival`, `MINTA_FESZTIVAL`, `mintaSzoveg`), `app/api/vizual/helyzet-minta/[helyzet]`, `app/kepek/uj/[helyzet]`,
  `app/iranytu/page.tsx` (festival → `semleges` examples), vizual-core `FELIRAT_FESZTIVAL` (ILYEN VOLT / JEGY), ai-adapters test AI festival branch.
- **Tests:** new `c30-f12-fesztival.proba.ts` (11 with the sync test file) + vizual-core `helyzet-fesztival.proba.ts` (2). apps/web
  1077/1045/16/16, identical failure and pending lists to the pre-change run; packages 682/682; `tipus`, `epit`, `tokenor`, `keretor`,
  `terkoz`, `dockerfile-or` ✔; `hatar` the 2 known cycles (same as base).
- **Measured (VM):** festival DOM crawl HU/RO/EN × 34 pages → 0 „cég/company/firmă” hits (12 before); company pixel compare 11 screens ×
  390/1512 = 0 px except the known arculat-390 render noise; festival Tibor at 390 green except Kezdőlap T5 42 (pre-existing).
  Shots: `~/saas/_c30-f12-kepek` (`elotte-`/`utana-`, `vegso/`, `ceg-pixel/`).
- **Cost:** an existing festival's AI image examples are regenerated once (profile fingerprint changes); companies: no call.
- **Not run:** the real AI model, the live screen.
- **Gotcha:** a label-key suffix must not be a valid key segment — `.fesztival` would have eaten `c30.tipus.fesztival`.

---

# HANDOFF — 2026-10-17 c30 F10: the photo album post — phone upload (D8a), the machine's pick + caption, the strip + Megosztom (D8b), the reorder sheet (D8c) (NOT pushed)

- **Base:** F9 + F11 pushed as one commit (`7ba2728`). Plan §6, §10 F10; drawings D8a–c (canvas v19); Csilla's 10-17 decisions 1–5.
  Decision doc: `docs/decisions/2026-10-17-c30-f10-album-ux.md`.
- **Migration:** `0179_c30_f10_album_feliratok.sql` — 75 `c30.album.*` rows + `hiba.ALBUM_MEGTELT` ×3 rewritten (points to „Kiveszem”).
  Dry run (keys removed in the transaction): INSERT 78, 75 keys, the new sentence; ROLLBACK.
- **Code:** `album/exif.ts` (EXIF time, resize math), `album/szabaly.ts` (+ fallback pick, answer parser, order helpers), `album/poszt.ts`
  (background pick, reorder, Kiveszem), `album/koltoztet.ts` (+ `albumFotoKivesz`), `album/index.ts` (+ `albumFotok`, `albumHasznalatPosztokbol`),
  `poszt/index.ts` (`tipustKeszit` extra input, `albumFeliratKeszit`, `albumKetnyelvu`), `onboarding/kepolvaso.ts` (`max`, `reszlet`),
  `prompts/album_valogatas.hu.md`, routes `app/api/poszt/[id]/album` (GET/POST 202/PUT) and `app/api/album/foto` (+ post check, + GET),
  `app/poszt/C30Album.tsx` + `c30-album.css`, `app/poszt/R15Poszt.tsx` (album branch, `ketMezo` extracted, bilingual for the done album),
  `hirfigyelo/futtato.ts` (the posts' use for D7), contracts `PosztAlbum` / `PosztForras.album`, ai-adapters `album_valogatas`,
  `tema/ter-hasznalat.json` regenerated.
- **Tests:** new `c30-f10-album-szabaly.proba.ts` 8 + `c30-f10-album.proba.ts` 8; `c30-f9-album.proba.ts` moved to real posts as album keys
  (reason in place: decision 2). apps/web **1048/1016/16/16 → 1064/1032/16/16**, identical failure list; packages 680/680; mutations 5/5 red;
  `tipus` 0, `epit` 0, `tokenor`, `keretor`, `terkoz --ellenoriz`, `dockerfile-or` ✔; `hatar` the 2 known cycles.
- **E2E (VM, Chromium, the first 10 test photos):** all steps green — see the decision doc „Measured”. Shots + `meres.json`: `~/saas/_c30-f10-kepek`
  (`_zoom.png` there is a debugging crop, delete it). Tibor D8a 33 · picking 32 · D8b 31 · D8c 27 — all green at 390.
- **Not run:** real phones, the real vision model and its cost, the live screen.
- **F9 fix in this commit (502 after the 7ba2728 deploy):** the robot deploys with `nas/kirak-sha.sh`, which made only `adatok/postgres` and
  `adatok/fajlok`; F9 had patched only the manual `kirak.sh`, so `./adatok/album` was missing and the app container could not start (the
  Synology Docker does not create bind-mount folders). `kirak-sha.sh` step 5 now runs `mkdir -p adatok/postgres adatok/fajlok adatok/album &&
  chown 1000:1000 adatok/fajlok adatok/album && chmod 770 adatok/fajlok adatok/album` before any container starts. New
  `probak/nas-kotet-mappak.proba.ts` (3): every `./adatok/*` bind in the compose must be created by BOTH kirak scripts, the app's own ones
  chowned to 1000 (red on the unpatched script, measured). The robot runs its OWN repo copy, which advances only after a successful
  deploy — so this fix does not reach the next deploy by itself: the folder must be made once by hand on the NAS (batch in the report).
- **Gotcha:** a new compose bind mount needs its folder in `nas/kirak-sha.sh` (the robot's path), not only in `kirak.sh`.
- **Gotcha:** Web Share must be called inside the tap — fetch the files BEFORE (we prefetch when D8b opens), never after an await in the click.

---

# HANDOFF — 2026-10-17 c30 F11: the festival's sample photo — category `rendezveny`, the stage-and-crowd photo on the „Kész munka” sample (NOT pushed)

- **Base:** the local F9 commit (on `c49119c`); one push with F9. Plan §1.2, §10 F11. Decision doc: `docs/decisions/2026-10-17-c30-f11-rendezveny-foto.md`.
- **Photo:** `apps/kepgyar/minta/kesz-minta-rendezveny.jpg`, made from `~/saas/_c30-minta/rendezveny-minta.jpg` (2576×1472, sRGB ICC):
  1600×914, JPEG 82, progressive, no metadata, 161 kB. Licence confirmed by Csilla 10-17.
- **Code:**
  - `vizual/minta-kategoria.ts`: `MINTA_FOTO_KATEGORIAK` = `KATEGORIAK` + `rendezveny` (contracts untouched; `KATEGORIAK` is unchanged: no company chip, no prompt
    change, no example rewrite).
  - kepgyar `MINTA_KATEGORIAK` + `MINTA_FOTOK.rendezveny`.
  - `vizual/minta-kategoria.ts fotoKategoria`; `vizual/peldak.ts` (`fotoKategoria` in `peldakFrissen`, not in the fingerprint).
  - `app/api/vizual/helyzet-minta/[helyzet]/route.ts` (both calls).
- **Tests:**
  - New `c30-f11-rendezveny-foto.proba.ts` 3.
  - `c15-minta-kategoria` and `c30-f1-tipus`: the image-maker list comparison moved to the photo list (reasons in place).
  - kepgyar fust-minta 43/43.
  - apps/web **1048/1016/16/16**, identical failure list; packages 680/680.
  - `tipus` 0 (kepgyar too); `epit` 0; `tokenor`, `keretor`, `terkoz --ellenoriz`, `dockerfile-or` ✔; `hatar` 2 known cycles.
- **Screens:** `~/saas/_c30-f11-kepek` (elotte-/utana-): the festival's Képek + Arculat samples now show the event photo. Tibor's
  company: 0 px (6 px ±1 AA on one corner of /fiok/arculat 1512). Festival Képek 390 Tibor green.
- **Not run:** the real AI's festival example texts (still company wording with the test AI; see the decision doc's Open note); the
  live screen.
- **Status page:** this commit carries C30-F9 and C30-F11 and their log lines, plus both HANDOFF entries (the F9 commit doesn't touch
  these two files, so the two commits can be rebuilt from copied files).

---

# HANDOFF — 2026-10-17 c30 F9: the photo album's storage backend — purpose `album`, separate folder (D7: 30 days, no backup), limits, ZIP, the 30-day move (NOT pushed)

- **Base:** F8 pushed (`c49119c`). Plan §1.5, §6 "Server" + "Limits", §10 F9; D7. Decision doc: `docs/decisions/2026-10-17-c30-f9-album-tar.md`.
- **Migration:** `0178_c30_f9_album.sql`: the index `arculat_fajl (szervezet_id, cel)` and 9 label rows (`hiba.ALBUM_MEGTELT`,
  `hiba.ALBUM_TELE`, `hiba.TUL_SOK_FELTOLTES`). Dry run on the test DB (index and labels removed first): CREATE INDEX, INSERT 9 inside the
  transaction; after ROLLBACK nothing is left; applied twice → same result. EXPLAIN of the quota sum uses the new index.
- **Code:**
  - `@km/fajl-core` 0.4.0: `album` purpose, `kepMeret` (JPEG SOF / WebP header), the dimension check in `feltolt`, `feltoltFajlbol` refuses
    album. Contract doc §8 and the module README.
  - `apps/web/fajl/tar.ts`: `albumMappa()` = `ALBUM_MAPPA`, else `<FAJL_MAPPA>/_album`; album bytes go there.
  - New module `apps/web/album/`:
    - `szabaly.ts`: pure limits, the D7 rule, ZIP names;
    - `zip.ts`: store ZIP, CRC32, exact size;
    - `index.ts`: upload with pair, quota, rate and per-album checks; ZIP;
    - `koltoztet.ts`: the hourly 30-day move to `_torolni/`, per-org RLS, safe to run twice.
  - Routes: `POST /api/album/foto` and `GET /api/album/zip`. `/api/arculat/fajl` refuses `cel=album`, and its list leaves album rows out.
  - `hirfigyelo/futtato.ts`: the hourly hook.
  - Contracts: `HibaKod` + 3 codes. `ArculatAnyagok.tsx`: one new state key, which was a type error in `next build` only.
- **NAS / tools (outside apps docs packages):**
  - `nas/docker-compose.yml`: `ALBUM_MAPPA` + volume `./adatok/album`.
  - `nas/kirak.sh`: mkdir/chown/chmod for `adatok/album`.
  - `nas/mentes.sh` 4b: `--exclude ./_album ./album` + comment.
  - `tools/kapu/proba-kornyezet.sh`: `ALBUM_MAPPA` in the gate environment.
  - The robot judges with its own older gate, so the F9 test also passes without `ALBUM_MAPPA` (measured).
- **Tests:**
  - fajl-core `album.proba.ts` 14; apps/web `c30-f9-album-szabaly.proba.ts` 10 (pure); `c30-f9-album.proba.ts` 8 (live). Green with and
    without `ALBUM_MAPPA`.
  - Mutations 5/5 red: no dimension check · SOF height/width swapped · `kicsi` counted in the rate limit · the Kitettem branch dropped ·
    UTF-8 flag off. The last one was not caught at first; an assertion was added.
  - apps/web **1027/995/16/16 → 1045/1013/16/16**, identical failure list. Packages **666 → 680/680**.
  - `tipus` 0, `epit` 0 (the 3 known Turbopack warnings in `fajl/tar.ts`, no new one); `tokenor`, `keretor`, `terkoz --ellenoriz`,
    `dockerfile-or` ✔; `hatar` the 2 known cycles.
- **Measured in the VM:**
  - The first 10 real Zilele photos by name: 201 each (11–29 ms). The 11th (2.67 MB) → 413.
  - ZIP 18,941,129 bytes = content-length; Python `testzip` clean; md5 equal; store method.
  - The real `mentes.sh` 4b against a fake tree: the tar has no album entry, including a trap folder `fajlok/album`.
  - Tibor's company: `/fiok/arculat` + `/kepek` 0 differing pixels vs `c49119c` (390/1512); Képek 390 Tibor green (23 words).
    Shots: `~/saas/_c30-f9-kepek`.
- **Not run:** the NAS (the compose change takes effect on the robot's next deploy); a real phone (F10).
- **Open:** see the decision doc: the "töröld a Fájlok közül" sentence has no delete yet (F10 decision) · album key = post id (F10) ·
  quota race ≤ 2.5 MB accepted · Vilmos §9.2/§9.4.
- **Gotcha:** the robot's gate is its OWN last-deployed `tools/kapu`. A test that needs a new environment variable must still pass
  without it on the first deploy (give the app a fallback that the test can derive the same way).

---

# HANDOFF — 2026-10-17 c30 F8: the festival's anchored ideas — Kezdőlap idea card (D7a), Naptár ghost rows (D7b), „Megírjuk”, event image (NOT pushed)

- **Base:** F6b pushed (`a171586`). Plan §4, §10 F8; drawings D7a · D7b. Decision doc: `docs/decisions/2026-10-17-c30-f8-horgonyok.md`.
- **Migration:** `0177_c30_f8_horgony_feliratok.sql` — 72 label rows (`c30.horgony.*`). Dry run on a DB at 0176: INSERT 72, ROLLBACK clean.
- **Code:** `program/horgony.ts` (pure anchors, caps, keys, due ideas, ghost rows), `program/otletek.ts` (server: profile + programme + existing
  posts), `program/blokk.ts kiemeltTetelek` (shared with the F7 summary); `r15/index.ts` + `r15/tipusok.ts` (`otletek` on the Kezdőlap);
  `app/kezdolap/R15Kezdolap.tsx` (idea card + rows; companies unchanged); `app/naptar/{page,Naptar}.tsx` + `naptar.css` (`.c30-szellem`);
  `app/_kozos/C30Horgony.tsx` (texts + „Megírjuk”); `poszt/index.ts munkatLetrehoz` (+ optional `javasolt_nap`, new post only);
  `app/kepek/uj/[helyzet]/page.tsx` (esemeny from the anchored item); `tema/ter-hasznalat.json` regenerated.
- **Tests:** new `probak/c30-f8-horgony.proba.ts` 10 (8 pure with the day injected + 2 live). Mutations 4/4 red (no cap · written idea offered
  again · rank swap · naive 24 h day step across DST).
- **Measured in the Cowork VM:** apps/web **1017/985/16/16 → 1027/995/16/16**, identical failure list; packages 666/666; `tipus` 0; `tokenor`,
  `keretor`, `terkoz --ellenoriz`, `dockerfile-or` ✔; `hatar` the 2 known cycles. Tibor's company Kezdőlap + Naptár 0 px (390/1512) vs `a171586`.
  Festival screens: `~/saas/_c30-f8-kepek` (event moved to start tomorrow — real clock). Tibor: Naptár green; Kezdőlap T5 43 (open, decision doc).
- **Not run:** the real AI on an anchored post; the live screen.
- **Gotcha:** a faked server clock (Date preload) breaks login — sessions expire against Postgres' real now(). Inject the day into pure
  functions; for screenshots move the data, not the clock.

---

# HANDOFF — 2026-10-17 c30 F6b: live findings on F6 — programme read in the background, content languages, recall, neutral page name „Adatok” (NOT pushed)

- **Base:** the local F7 commit (`848ccb9`, on `5376e9a`). Decision doc: `docs/decisions/2026-10-17-c30-f6b-elo-javitasok.md`.
- **Migration:** `0176_c30_f6b_adatok_felirat.sql` — 48 label rows (16 existing keys × HU/RO/EN): the page name „Adatok / Date / Details”.
  Dry run on a DB at 0174 (+0175): INSERT 246 / INSERT 48, ROLLBACK clean.
- **1 · Read in the background:** cause measured in `nas/nginx.conf` (`location /` → `proxy_read_timeout 60s`; the DSM proxy assumed the same) vs a
  60–120 s model call. Contract `SzervezetProfil.program_olvasas`, `PROGRAM_OLVASAS_ELAKAD_MS`; `program/allapot.ts` (pure `olvasasAllapot`);
  `program/index.ts` (`programOlvasasIndit` → 202, background run, state in the profile; `programOlvasasLekerdez`; model timeout 300 s);
  `app/api/program/olvas/route.ts` (POST 202, GET state); client `programOlvasasVar` (poll 2 s, no error on hiccups, 12 min cap), `ProgramForras` and
  `Programod` resume a running read (`fut` from the pages). The F5 live test fetches the result by polling (expectations unchanged; reason in place).
- **2 · Languages:** `profil/tipus-szabaly.ts nyelvekSzovegbol`; `onboarding/javaslatok.ts` (named languages first, else the model's); `ElsoBeallitas`
  ticks the proposal (`nyelvek_forras: ai`) before falling back to the UI language.
- **3 · Recall:** `program/szabaly.ts` (`nyelviTisztit` odd keys + plain string → first language; `fellepo` as name; `programTisztit({nyelv})`);
  prompt `program_kiolvasas` v2 (the dropped patterns + a per-day pass). Split-by-day proposed, not built (decision doc).
- **4 · Page name:** 16 keys (list in the decision doc); the other „cég/company” texts a festival sees are listed there, not changed.
- **Tests:** new `probak/c30-f6b-elo-javitasok.proba.ts` 9 (6 pure + 3 live). Mutations 3/3 red. apps/web **1008/976/16/16 → 1017/985/16/16**,
  identical failure list; packages 666/666; `tipus` 0; `tokenor`, `keretor`, `terkoz --ellenoriz`, `dockerfile-or` ✔; `hatar` 2 known cycles.
- **E2E (VM):** the Word tile with slowed polls shows „Olvassuk a programot…” and no error; the real .docx: POST 202 → „kesz”; a [ro, de]
  description in Part A (HU UI) → draft languages ro, de (`ai`); D9a reads „‹ Adatok”. Tibor's company Part B: 0 px except 11 px of ±1
  anti-aliasing on one checkbox (b0, 390). Shots: `~/saas/_c30-f6b-kepek`.
- **Not run:** the real AI (recall on the real file with prompt v2; timing); the live screen.
- **Gotcha:** the nginx `location /` timeout is 60 s — any request that waits on a long model call must go async (POST 202 + poll), never
  a raised proxy timeout (the DSM proxy in front is outside the repo).

---

# HANDOFF — 2026-10-17 c30 F7: the festival in the topic plan and the post prompts — festival topics (fajta), category line, programme slice, names, fact guard (NOT pushed)

- **Base:** F6 pushed (`5376e9a`). Plan §3 (temak_terv, TARTALEK, poszt_tipus album; slice · glossary · guard), §4 topic table (anchoring = F8),
  §10 F7. Decision doc: `docs/decisions/2026-10-17-c30-f7-fesztival-posztok.md`. No migration, no UI, no profile writes.
- **Code:** contracts `FESZTIVAL_TEMA_FAJTAK`, `TemaTerv.fajta?`; `program/blokk.ts` (`programHorgony`, `szeletTetelei`, `programSzelet`,
  `programOsszegzes`, `programNevek`); `poszt/profil-blokk.ts programSorok`; `poszt/index.ts` (`profilBemenet(szervezetId, munka, nyelv)` adds the
  festival block to every post action, `hivatalosNevek` merges the programme pairs, `szovegetKeszit` runs the guard for festivals);
  `poszt/tipus.ts` (`tenyorrelKer`; `kitalaltReszek` accepts an inflected input word); `profil/kinalat-szabaly.ts` (`fesztival` TARTALEK HU/RO/EN,
  `temakTisztit` fajta, `szakmaSor`); `onboarding/kinalat.ts temakatJavasol`; prompts `temak_terv` v2, `poszt_tipus` v4; test AI `temak_terv`.
- **Tests:** new `probak/c30-f7-fesztival-poszt.proba.ts` 10 (8 pure + 2 live). Moved with reasons: `r18-kor7` and `r18-kor8` header checks
  (poszt_tipus v4). Mutations 4/4 red (slice keeps the internal note · guard never retries · no programme names · festival fallback ignored).
- **Measured in the Cowork VM:** apps/web **998/966/16/16 → 1008/976/16/16**, identical failure list; packages 666/666; `tipus` 0; `tokenor`,
  `keretor`, `terkoz --ellenoriz`, `dockerfile-or` ✔; `hatar` the same 2 known cycles. Tibor's company Part B 0 px diff (12 shots). Gate
  emulation: see the commit report. Shots: `~/saas/_c30-f7-kepek/utana`.
- **Not run:** the real-AI live run (5 festival topic posts, hand-checked, cost log) — needs the test site.
- **Gotcha:** `kitalaltReszek` flagged every Hungarian inflected name („Várban") as invented (5-letter prefix rule) — loosened for input word +
  ≤ 4-letter ending. Prompt header tests pin versions: bumping a prompt moves those expectations (with the reason in place).

---

# HANDOFF — 2026-10-17 c30 F6: festival setup — type line/question (D1), „Mikor és hol lesz?" (D2), „Ez a programod?" (D3), item sheet (D4), Programod (D9a) (NOT pushed)

- **Base:** rebased on `main` `2e6e07f` (F5 + the F5 fix: the real-DOCX skipped test removed). Plan §2, §10 F6; drawings D1 · D2 · D3 · D4 · D9a. Decision doc: `docs/decisions/2026-10-17-c30-f6-fesztival-beallitas.md`.
- **Migration:** `0175_c30_f6_fesztival_feliratok.sql` — 246 label rows (`c30.tipus.*`, `c30.kat.*`, `c30.rend.*`, `c30.prog.*`, `c30.tetel.*`,
  `c30.fajta.*`), every key HU/RO/EN. Local dry run on a DB at 0174: INSERT 246, ROLLBACK clean.
- **Code:** `profil/tipus-szabaly.ts` (`lepesekFor`, tighter regex, `datumTartomany`, `rendezvenyJavaslat`); `profil/index.ts rendezvenyMent` +
  `app/api/profil/rendezveny/route.ts` (PUT, szerkesztő); contracts (`Rendezveny`, profile `rendezveny|rendezveny_javaslat|program_forras`,
  `tipus_sajat`, `ProgramTetel.kep_fajl_id`); profile-core copy at approval; javaslatok prompt v3 + `onboarding/javaslatok.ts`; test AI type keys;
  `program/{index,tar,szabaly}.ts` (empty read → `NINCS_SZOVEG`, no write; `program_forras`; `kep_fajl_id` same-org check); UI
  `app/_kozos/C30Program.tsx` + `c30-program-szabaly.ts` (pure), `onboarding/ElsoBeallitas.tsx` (D1), `onboarding/beallitas/{Beallitas,page}.tsx`
  (D2/D3/D4), `fiok/program/{page,Programod}.tsx` + `fiok/Fiok.tsx` (D9a); `r18.css` c30 F6 block; `tema/ter-hasznalat.json` regenerated.
- **Main session's answers (10-17):** D9a T5 + D3b T5 accepted; the second-language town is re-translated only while it is the machine's
  (`helyTerv` + `rendezveny.hely_gep`, route uses `kepFordit`; a person's town is never overwritten); D9a phone margin 20 px (`--ter-9`).
- **Tests:** new `probak/c30-f6-fesztival.proba.ts` 9 passed (8 pure + 1 live; the live one also checks the town rule); B-01 matrix +1 row (`profil/rendezveny` PUT; the known „42 missing"
  unchanged); F1 two expectations moved with reasons (prompt v3, test AI type keys); F5 test object + `kep_fajl_id: null`. Mutations 3/3 red
  (one-language company gets the language step; „rendezvény" in the festival regex; a person's RO town treated as the machine's).
- **Measured in the Cowork VM:** apps/web **990/957/16/17 → 998/966/16/16** (F5 fix −1 skipped, F6 +9), identical failure list; packages
  666/666; `tipus` 0; `tokenor`, `keretor`, `terkoz --ellenoriz`, `dockerfile-or`, `allapotor` ✔; `hatar` the same 2 known cycles.
  E2E festival flow + Tibor's company Part B 0-pixel diff (12 shots); shots in `~/saas/_c30-f6-kepek/{elotte,utana}` (`v2-`/`v3-` = intermediate).
- **Tibor (390):** green D2, D3a, D4a; accepted: D3c (T2), D9a (settings page, Tibor-exempt), D3b T5 43 (real data). D1 review page T5
  (red before F6: 54 → 57) is not measured by the gate or by `tools/tibor-proba` (its pages start after onboarding).
- **Gate emulation** (`tools/kapu` ell chain member by member + `hatar-hibak` + all test packages → `osszesit` → `osszevet` against
  `ismert-bukasok.json`): `nem-rosszabb`. Commit within 5 minutes of the status page time, or `allapotor` (part of the gate) turns red.
- **Not run:** real-AI javaslatok on the Zilele text (does v3 return the dates/town?); NAS dry run of 0175; live screen check.
- **Gotcha (paid 10-17):** the c4 gate refuses NEW skipped tests („új kimaradt próba") — no `skip`/`skipIf`/`todo` in new tests; one-off checks
  on real files go in a script outside the suite. Also: `.r15e-keskeny > :not(...)` caps every child at 620 px (specificity 0,3,1) — a wide
  element inside the setup column needs a stronger selector (`.r15e-belso.r15e-keskeny.c30-szeles > …`).

---

# HANDOFF — 2026-10-17 c30 F5: festival programme — table program_tetel (0174), reader (link · PDF · photo · Word), API; no UI (NOT pushed)

- **Base:** F4 pushed (`3ac77eb`). Plan §1.4, §3, §10 F5. Decision doc: `docs/decisions/2026-10-17-c30-f5-program.md`.
- **Migration:** `0174_c30_f5_program_tetel.sql` — table + FK + index + GRANT SELECT/INSERT/UPDATE (no DELETE) + RLS policy; extra column
  `gep_kulcs` (re-read never duplicates a renamed row). Local dry run on a DB at 0173: clean; idempotent second run clean.
- **Code:** `apps/web/program/{szabaly,docx,tar,blokk,index}.ts`; `app/api/program/{olvas,lista,tetel}/route.ts` + `_kozos.ts`;
  `adatbazis/sema.ts` (programTetel); contracts `PROGRAM_FAJTAK`, `ProgramTetel`, `ProgramTetelMezok`, `PROGRAM_MAX_TETEL`; ai-adapters task
  `program_kiolvasas` (+ test sample); `onboarding/kepolvaso.ts` test sample; prompt `prompts/program_kiolvasas.hu.md` v1.
- **Tests:** new `probak/c30-f5-program.proba.ts` 14 passed + 1 skipped (real file); fixture `probak/adat/zilele-2026.json` (88 rows; Thu 8 · Fri 25 · Sat 25 · Sun 26 ·
  whole event 4 — the flag-day item + the internal note on 26 June, accepted). The real .docx is NOT in the repo: its test needs
  `ZILELE_DOCX=<path>` (skipped otherwise; passed locally with the file in Csilla's folder); a synthetic .docx built by the test covers the reader.
  B-01 matrix +4 rows (the known „42 missing" failure unchanged — none of them is a program endpoint). Mutations 5 + 2 red.
- **Measured in the Cowork VM:** apps/web **975/943/16/16 → 990/957/16/17**, identical failure list; packages 666/666; `tipus` 0; `tokenor`,
  `keretor`, `terkoz --ellenoriz`, `dockerfile-or`, `allapotor` ✔; `hatar` the same 2 known cycles (no new one: program/blokk is a leaf for F7).
- **Not run:** the real-AI reading of the programme (PDF + photo, ±10 % of 77, hand-checked list); the NAS dry run of 0174.
- **Open:** see the decision doc (output-token size). Editor may edit the programme: accepted.

---

# HANDOFF — 2026-10-17 c30 F4: Képek follow the org's second language (0173, labels only) + F3 follow-up: no title sentence at the top (NOT pushed)

- **Base:** F3 pushed (`5335d66`). Plan §5 „Images (F4)", §10 F4. Decision doc: `docs/decisions/2026-10-17-c30-f4-kep-masodik-nyelv.md`.
- **Migration:** `0173_c30_f4_kep_masodik_nyelv_feliratok.sql` — 60 label rows (`c30.kep.masik_is`, `c30.kep.ket_kep`, `nyelv.nev.*` for the 18 content
  languages). 0172 untouched (applied on the NAS).
- **Contract:** `PosztForras.kep_beallitas.masik?: {nyelv: Tartalomnyelv, ertek}` (old `ro` stays and is read).
- **Code:** `vizual/melle.ts kepCel` (any content language for `kepFordit`/`kepForditMezok`); `app/kepek/uj/[helyzet]/page.tsx` (profile → `elsoNyelv`,
  `masikNyelv` = saved language, else old `ro`, else `masodikNyelv`; `egyben` only for a new image); `app/kepek/Kitolto.tsx` (props `elsoNyelv`,
  `masikNyelv`, `egyben`, `kezdoMasik` replacing `kezdoRo`; internal roles `elso|masik`; toggle only with a second language; names from
  `nyelv.nev.*`; saves `masik`; egyben: toggle ON + „Mindkettő").
- **F3 follow-up (main session's live finding 10-17):** `poszt/bemenet.ts` `mondatCim` + `kozolhetoSzoveg(szoveg, cimek)` (a ≤ 6-word period-ended first
  paragraph that repeats the trigger title is a title) and `forditasCimNelkul` (an extra short first paragraph in a translation is dropped);
  `poszt/index.ts` passes the titles in write / rewrite (incl. the shorten retry) / post types, and guards the translation. Affects the one-language
  path too (same guard). No prompt version change.
- **Tests:** new `probak/c30-f4-kep-nyelv.proba.ts` 6/6, `probak/c30-f3-cimsor.proba.ts` 5/5; mutations 3 + 3 red. No existing test changed.
- **Measured in the Cowork VM:** apps/web **964/932/16/16 → 975/943/16/16**, identical failure list; packages 666/666; `tipus` 0; `tokenor`, `keretor`,
  `terkoz --ellenoriz`, `dockerfile-or`, `allapotor` ✔; `hatar` the same 2 known cycles. Browser with a LOCAL képgyártó (`apps/kepgyar` on 8611,
  `KEPGYAR_URL`): Sovata [ro, de] egyben → „Német változat is" ON, `cel: "de"`, „Mindkettő" pre-selected, two files `-ro.png` + `-de.png`; [hu, ro]
  before/after 0 differing pixels (off, on, old `ro` reopen; 390/1512/whole page); one-language: only the toggle row gone. Tibor green (27–29 words).
  Shots `~/saas/_c30-f4-kepek/{elotte,utana}`.
- **Open:** the image's small fixed words (EVENIMENT/UNDE/CÂND…) exist in hu/ro/en only (vizual-core `FELIRAT`) — a German image carries the org's
  first-language small words; needs a yes. The title fix needs a live re-check on the real AI.

---

# HANDOFF — 2026-10-17 c30 F3: bilingual post — D5 setup step, D6 Posztszöveg (post first, both modes), D9b Posztok nyelve (0172, labels only) (NOT pushed)

- **Base:** F2 (5cc85ac locally). Plan §5, §10 F3. Decision doc: `docs/decisions/2026-10-17-c30-f3-ketnyelvu-poszt.md`. Drawings: canvas c30
  D5 · D6a · D6b · D6 desktop · D9b (live version `1792224034-9eea`, given as "v19").
- **Migration:** `0172_c30_f3_ketnyelvu_feliratok.sql` — 174 label rows (c30.nyelvmod.*, c30.beall.posztok_nyelve, c30.ket.* incl. tul_hosszu_fb/ig/li, nyelv.hatarozo.* and
  nyelv.targy.* for the 18 content languages). Ran from scratch in the VM with all others.
- **Pure:** new `poszt/ketnyelvu.ts` (join D1, hashtags once, per-half budget IG 1050 / LI 1450, tulHosszu, masodikTeendo, mezoTorzs/mezoOsszerak,
  alapCta). `poszt/bemenet.ts`: optional `keret` → "Hossz-keret" input line (absent = input unchanged). `profil/tipus-szabaly.ts elsoNyelvMod`.
- **Server:** `poszt/index.ts ketnyelvuKontextus` (egyben = first two languages, not blog): half budget + D15 CTA intent in text/rewrite/translate;
  the second half translated from the first-language cell; one shorten-retry (machine text only) when the joined post is over the limit.
  `profil/index.ts nyelvModMent` + `app/api/profil/nyelvmod` (GET tag, PUT szerkesztő; `mezoMent`). B-01 matrix row added.
- **UI:** `_kozos/C30NyelvMod.tsx` (the three rows, built from the org's languages); `onboarding/beallitas` (step `nyelvmod`, 2+ languages only);
  `poszt/R15Poszt.tsx` + `page.tsx` (`nyelvModja`; joined field, auto second part, stale line, copy of the joined text via ClipboardItem promise,
  both cells finalised, CTA field hidden, counters, „Más nyelven” back to joined); `beallitasok` (row + `?ful=nyelv`); `r18.css` § c30.
- **Tests:** new `probak/c30-f3-ketnyelvu.proba.ts` 10/10 (join, budget with the longest Zilele performer post ≤ 2200, edited RO never overwritten,
  budget line only in egyben, D6 pre-selection, mode endpoint, byte-identical `szovegek[]` through egyben→kulon→egy→egyben, the shorten retry and
  a person's half untouched). Mutations: 2 red as expected.
- **Measured in the Cowork VM:** apps/web **954/922/16/16 → 964/932/16/16**, identical failure list; packages 666/666; `tipus` 0; `tokenor` ✔ (612);
  `keretor` ✔; `terkoz` regenerated (`ter-hasznalat.json` +10 uses); `hatar` the same 2 known cycles. Screens `~/saas/_c30-f3-kepek/`: one-language
  company 0 differing pixels (6 shots); D5, D6 desktop, D6a, D6b (+ field crops), D9b, Beállítások list. Clipboard after „Kész, másolom”: the joined
  text, one separator, hashtags once; both cells `vegleges`.
- **Follow-up (Csilla 10-17 12:4x):** post first in BOTH modes — fej = title only; under it the platform tabs and the field; below the post, quiet:
  phone „Szöveg / Így fog kinézni” + preview, then `.c30-poszt-alatt` (desktop „Ezen a héten”, „Téma:” line, type chips). Nothing removed. Phone:
  each joined half ≥ 7 lines, one-language field 400 px. Overflow: `tulHosszuMost` → one quiet `Info` sentence under the counter
  („Hosszabb, mint amit az Instagram enged — rövidítsd a magyar részt.”), labels `c30.ket.tul_hosszu_*` in 0172. One-language page no longer
  pixel-identical (accepted).
- **Tibor (tibor_proba.py MERO_JS, 390×844) after the follow-up:** all green — one-language news/own idea 34/34, D6a news/own idea 37/37, D6b 35,
  D5 32 (first build: D6a 45/52 red, today's page 49). Re-run after the follow-up: apps/web 964/932/16/16 (identical list), packages 666/666, `tipus`,
  `tokenor`, `keretor`, `terkoz` (regenerated) + `--ellenoriz`, `dockerfile-or`, `allapotor` green; `hatar` the same 2 known cycles (also on c05d720).
  After-shots `~/saas/_c30-f3-kepek/utana3/`.
- **Not run:** the R18 layout audit script; a real-model run (budget line, CTA intent, translation quality); the live tibor-proba/bíró.
- **Open:** none from F3 (the 4 questions answered 12:4x, see the decision doc). Font gotcha as in F2 (ő/ű boxes in the VM Chromium).

---

# HANDOFF — 2026-10-17 c30 F2: post language mode + second language + „Más nyelven” = union (no migration) (NOT pushed)

- **Base:** F1 (pushed 11:47 local). Plan §1.3, §5, §10 F2. Decision doc: `docs/decisions/2026-10-17-c30-f2-nyelvmod.md`.
- **Contracts:** `POSZT_NYELV_MODOK` (`egy | egyben | kulon`), `PosztNyelvMod`; profile `poszt_nyelv_mod` (plain string, not written yet — F3).
- **profile-core:** `nyelvMod` (≤1 language → `egy`; else stored known mode, else `kulon` = today), `masodikNyelv` (= `nyelvek[1]`),
  `masNyelvenLista` (hu, ro, en + other profile languages in profile order).
- **Posztszöveg:** `app/poszt/page.tsx` passes `profilNyelvek`; `R15Poszt.tsx` menu = `masNyelvenLista`; extra languages named by
  `nyelvNev` (Intl) — no new labels, no migration. The server already took any `Tartalomnyelv` for cells/translation.
- **Tests:** new `probak/c30-f2-nyelvmod.proba.ts` 6/6 (incl. Sovata [ro, de]: menu adds `de`, live `de` cell via `/forditas`).
  Mutation: default `egyben` / hu-ro-en-only menu → 5 red.
- **Measured in the Cowork VM:** apps/web **948/916/16/16 → 954/922/16/16**, identical failure list; packages 666/666; `tipus` 0;
  `tokenor` ✔; `keretor` ✔; `terkoz` ✔ (unchanged); `hatar` the same 2 known cycles.
  **Screens** (Posztszöveg with a written post + the open menu, 390/1512; phone menu is under „Így fog kinézni”): 14 shots, 0 differing
  pixels except the Sovata menu's extra „germană” row. `~/saas/_c30-f2-kepek/`.
- **VM gotcha (screenshots):** the Sparticuz arm64 Chromium has NO usable system fonts by default (its fonts.conf points at /tmp/fonts);
  any glyph fallback hits Skia `SkFontMgr_FontConfigInterface … Not implemented` FATAL → "Page crashed" on logged-in pages. Fix: own
  `FONTCONFIG_PATH` with DejaVu Sans (npm `dejavu-fonts-ttf`) + Open Sans. ő/ű may still show as boxes in some app fonts (both builds).
- **Status page:** `C30-F2` started + naplo (`--nem-tesz-ki`).
- **Open:** F3 writes the mode and builds the joined post.

---

# HANDOFF — 2026-10-17 c30 F1: organisation type + category — model, AI guess, regex fallback (no screen change, no migration) (NOT pushed)

- **Base:** F0 (31c0b4d on origin). Plan §1.2, §2 Part A, §3, §10 F1. Decision doc: `docs/decisions/2026-10-17-c30-f1-tipus-kategoria.md`.
- **Contracts:** `SZERVEZET_TIPUSOK`/`szervezetTipus()` (unknown → `ceg`, D13), `KATEGORIAK`/`kategoria()` (unknown → `semleges`; the single
  list, moved from `vizual/minta-kategoria.ts`, which re-exports it). Profile: `szervezet_tipus`, `kategoria`, `tipus_forras` (plain
  strings). Draft `bemutatkozas`: `szervezet_tipus`, `kategoria`, `tipus_biztos`. `JavaslatokValasz`: `szervezet_tipus`, `kategoria`, `biztos`.
- **Prompt:** `javaslatok` v2 (+3 keys; category descriptions = `kep_peldak`'s). `kep_peldak` prompt unchanged (v3).
- **Server:** `profil/tipus-szabaly.ts` (new, pure: `kategoriaOf`, `tipusOf`, `tipusJavaslat`, festival regex). `onboarding/javaslatok.ts`
  parses the 3 keys separately (never fails the proposal). `profile-core profilPiszkozatbol` copies only when `tipus_biztos`.
  `onboarding/kinalat.ts` + `app/onboarding/beallitas/page.tsx` use `kategoriaOf` (the `temak_terv` prompt line unchanged).
  `kinalat-szabaly.ts temaTartalek(kinalat, kat | boolean, nyelv)` keyed by category. `vizual/peldak.ts`: stored category wins
  (`kepKategoria`), one input line only for orgs that have one (other fingerprints unchanged).
- **Client:** `ElsoBeallitas.tsx` puts the guess into the draft. Nothing rendered.
- **Tests:** new `probak/c30-f1-tipus.proba.ts` 12/12 (lists = contracts = web = kepgyar = prompt; every hospitality fixture: same list
  title + same TARTALEK in hu/ro/en/de; Zilele → `fesztival`; Kovács Térkő + AI answer → `epites`; garbage AI answers never sure; copy only
  when sure; kepKategoria; live: javaslatok answer, draft → profile, unsure → nothing stored, `olvas` list flag, re-approval keeps the
  category). `c30-f0-profil.proba.ts`: 4 expectations moved with the reason in place (`szervezet_tipus` is known now → the unknown-key
  example is `jovo_tipus`). Mutation check: dropping the regex fallback → 2 red; copying an unsure guess → 1 red.
- **Measured in the Cowork VM** (disposable Postgres 18.4, all 172 migrations, `next build`, test AI): apps/web **936/904/16/16 → 948/916/16/16**,
  identical failure list; packages 666/666; `tipus` 0; `tokenor` ✔ (609 files); `keretor` ✔; `terkoz` ✔ (`ter-hasznalat.json` unchanged);
  `hatar` the same 2 known cycles. **Screens:** headless Chromium (Sparticuz arm64 build + playwright-core), the real client flow for a
  company and a restaurant, 390 + 1512, animations off: 12 shots, 0 differing pixels except the "Mentve: HH:MM" clock; list titles
  „Van szolgáltatás-listád vagy árlistád?” / „Van étlapod?” in both builds. Shots: `~/saas/_c30-f1-kepek/`.
- **NAS count:** `~/saas/c30-f1-egyezes.sql` (read-only; regex vs kategoriaOf; JS regex translated `\b` → `\y`; checked against JS on 18 rows).
- **Status page:** `C30-F1` started + naplo (`--nem-tesz-ki`).
- **Open:** real-model `javaslatok` v2 run on the test site; the equivalence count on the NAS before/after deploy; the festival regex is
  broad (inert until F6, unsure only).

---

# HANDOFF — 2026-10-17 c30 F0: profile safety net (no visible change, no migration) (NOT pushed)

- **Base:** main c05d720 (round 8, 0171). Plan: `docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md` (§1.1, §8 risks 1–4, §10 F0).
  Decision doc: `docs/decisions/2026-10-17-c30-f0-profil-biztositek.md`.
- **Contracts:** `SzervezetProfil` → `.loose()` (zod 4.5.4): unknown stored keys survive parse. `ProfilModositas` untouched (non-loose).
- **profile-core (pure):** `PROFIL_MAG` (core = required, no default; derived from the schema) + `PROFIL_MAG_TIPUS`;
  `profilTureloOlvas` (tolerant read: bad non-core fields left out → `kihagyott`; `kesobbre` filtered); `profilMentesre` (full save
  keeps stored unknown/unparseable keys the new profile does not carry); `profilMezokEllenoriz` (merge patch: known non-core keys
  only, parsed; unknown/core/null/empty refused); `ProfilTar.mezoMent`, types `ProfilMezok`, `MezoMentEredmeny`.
- **apps/web `profil/tar.ts`:** `betolt` tolerant — `null` ONLY for no row / not visible under RLS, non-object jsonb, broken core
  (logged with field names). `ment` reads the row `FOR UPDATE` and writes `profilMentesre`. New `mezoMent` + exported `mezoMentTx`
  (`adatok = adatok || $1::jsonb`, UPDATE only, inside `szervezetKent`) and `profilNyersen` (raw jsonb, re-approval only).
- **`onboarding/jovahagyas.ts`:** whitelist removed; `profilTureloOlvas({ ...previousRaw, ...draft })`; `weboldal` → `honlap` as before.
- **Untouched call sites:** `profilModosit`, `hivatalosNevekMent`, `kinalatMent`, `arculatMent` (still refuses on a strict-parse failure).
- **Tests:** new `apps/web/probak/c30-f0-profil.proba.ts` 12/12 (unknown keys load → save, also through `PUT /api/profil/kinalat`;
  garbage `szervezet_tipus`/`arak_posztban`/`tema_terv` loads, `GET /api/profil` 200, the next `PUT /api/profil/nevek` writes the raw
  values back; broken core → null; re-approval keeps `kinalat`, `hivatalos_nevek`, `arak_posztban`, a made-up future key, and the jsonb
  diff shows only draft keys (+ `frissitve`, stamped by the background arculat job); `mezoMent` merge + refusals; A-11 as `km_app`:
  another org's context → 0 rows, own → 1). Mutation check: the old whitelist and the old full overwrite each turn one test red.
- **Measured in the Cowork VM** (Node 24.22, disposable Postgres 18.4, all 172 migrations from scratch, `next build` + `next start`,
  test AI, image maker unreachable): apps/web **before 924/892/16 fail/16 skip → after 936/904/16/16, identical failure list**.
  Packages + proba-host + referencia-host: 666/666 both before and after. `pnpm tipus` 0 · `tokenor` 0 findings · `keretor` ✔ ·
  `terkoz` unchanged (`ter-hasznalat.json` not modified) · `hatar`: the same 2 known `nincs-kor` cycles as the base
  (profil/index ↔ vizual/peldak; both in `tools/kapu/ismert-bukasok.json`), nothing new.
- **Status page:** `C30-F0` step started + a naplo line (`--nem-tesz-ki`; the base's `allapotor` was already red: last commit
  10-15 07:57 vs page 10-14 19:48).
- **Open:** deploy; repeat approve → re-approve + jsonb diff on the test site; re-approval still replaces `arculat` with the draft's
  (pre-existing, noted in the decision doc); nested schemas still strip unknown sub-keys (rule for F1+ in the decision doc).

---

# HANDOFF — 2026-10-15 R18 round 8: Kati's fixes + Round 8 drawings (Naptár, Beállítások) — migration 0171 (NOT pushed)

- **Base:** main 2b340cb. Decision doc: `docs/decisions/2026-10-14-r18-kor8-kati-naptar-beallitasok.md`.
  Screens: `design/R18-arculatfrissites/epitett-6/`. Drawing shots and audit reports: `design/R18-arculatfrissites/round8/`.
- **Labels:** `0171_r18_kor8_feliratok.sql`, 48 keys × HU/RO/EN (Naptár, Beállítások, Kép szerkesztése/letöltése, honlap/közösségi).
- **Contracts:** `PosztForras.kep_beallitas`, `.torolve` (soft delete), `.naptar_le` (undo for Levétel). All optional jsonb fields; no
  table, column or RLS change.
- **Server:**
  - `poszt/tar.ts`: `nemTorolt` filter in `mind`/`lista`/`naptarSorok` (`torolttel` flag for undo).
  - `halad/index.ts`: deleted posts are not counted.
  - `poszt/index.ts naptarMuvelet`: new `levesz`, `torol`, `visszavon`; the `nap` range is today −31…+90; `naptarBetolt` skips
    `naptar_le` posts.
  - `ctaBeleir` → `poszt_atiras` op `felhivas`.
  - `poszt/tipus.ts`: echo guard. `bemenet.ts`: title guard + CTA intent.
  - `r15/kep.ts` + `api/r15/kep`: `x-kep-beallitas`.
- **UI:**
  - `naptar/Naptar.tsx` rewritten: week grid ≥1024, strip view below; pointer drag; "…" sheet; 10 s undo.
  - `beallitasok/BeallitasokMenu.tsx` (new) + `Beallitasok.tsx`: list layout, the tab bar removed; Értesítések rows are whole-row links
    with relative time; Adatkezelés = one switch + Részletek.
  - `FelsoSav` aktiv `beallitasok`.
  - Visszajelzés fixed bottom-right (`r18.css` §12).
  - `r15-lapok.css`: invalid nested `:has()` fixed. This is the "phone frame slides away on scroll" bug.
  - `/tema` phone Részletek; logo-replace sheet (`r18.css` §15).
  - `R15Poszt`: `?sajat=1`, `?nap=`, Kép letöltése / szerkesztése.
  - `Kitolto` + `kepek/uj/[helyzet]`: `szerk=1` prefill.
  - `Fiok`: honlap + közösségi editable.
- **Measured in the VM:**
  - Drag on desktop and in the phone view writes `tervezett_nap`.
  - Levétel → Visszavonás restores the day; Törlés hides the post from `/naptar` and `/poszt`, and Visszavonás brings it back; another
    org's post → 404.
  - `kep_beallitas` is saved and `?szerk=1` prefills.
- **Tests:** apps/web 892/16/16 (the same 16 known failures); `r18-kor8.proba.ts` +14. Moved expectations, each with its reason:
  `poszt-bemenet`, `poszt-forditas-elavult`, `r17-blog`, `r18-kati-1011`, `r18-kor3` (`nap` range), `r18-kor6` (CTA no longer literal),
  `r18-kor7`. Packages green.
- **Audit:** `nem-a-lap-vegen` ignores elements with a floating ancestor; new check `vj-fo-gombot-takar` (T10). 1890 views → **0 findings**.
  The first run found the Naptár buttons wrapping at 768/1024 px; fixed with the strip view below 1024 px and smaller nowrap card buttons.
- **10-15 Posztszöveg phone fixes:**
  - The rewrite buttons now wrap; previously the scroller cut off "Közvetlenebbül".
  - The faded logo moved from `position: fixed` into the flow at the end of the scrolling `<main>` on every bottom-bar page.
  - "Kép letöltése" is in the sticky bottom bar beside "Kész, másolom".
  - The invitation page's buttons got `box-sizing`.
  - New audit rules `kilog` and `halvany-takar`. Full audit 1890 views → 0 findings.
  - Before/after shots: `epitett-6/*-elotte.png` vs `epitett-6/kor8-poszt-*-390.png`, `meghivo-elotte-390.png` / `meghivo-utana-390.png`.
- **Open:** "Minden méret" skipped (Csilla 10-15); live Tibor-proba/bíró to run after deploy (`adatkezeles`, `naptar` are now in its list).

---

# HANDOFF — 2026-10-12 R18 round 7 follow-up: no invented details in post types; Visszajelzés + faded logo at the page end (NOT pushed)

- **1 · Invented details (live, real model):** the own idea „Csapatépítő hétvége Szovátán … 14-en voltunk a Medve-tónál …” got hiking,
  campfire stories and marshmallows in the VIDEO script and „Hiking and nature shot / Campfire evening moment” in the POLL. Prompt
  `poszt_tipus` **v2**: facts only from the trigger, profile, offer list and glossary; no invented activities/events/numbers/names/places;
  missing specifics → general wording or a question to the viewer; proper names in one form („Medve-tó” stays, other-language form only
  if the glossary gives it for the output language) — a „CSAK A MEGADOTT TÉNYEKBŐL” line in each of the four type sections. Guard
  `poszt/tipus.ts kitalaltReszek`: numbers and capitalised names in the output that are not in the input → `tipustKeszit` asks the model
  once more naming them (the second answer stays). Activities themselves cannot be checked reliably by code — prompt + tests.
- **2 · Layout (live, 1512 px, Posztszöveg):** after a CLIENT-SIDE page change React inserted the new header/main before the nodes portalled
  to the body end, so the Visszajelzés button and the faded wordmark sat under the top bar. Fix: a stable last element
  `<div id="km-lap-vege">` in `app/layout.tsx`; both portals target it (`_kozos/Visszajelzes.tsx`, `_kozos/HalvanyLogo.tsx`).
  Reproduced and verified in the VM with `window.next.router.push` (before: button y=89 / logo 151 above main; after: below main).
- **Audit:** new check `nem-a-lap-vegen` (button / wordmark not floating → must be below the last visible content element) and every
  logged-in page now opened by client-side navigation from Kezdőlap (1350 of 1620 reached their path; the rest are server redirects).
  Proven on the live-bug DOM (2 hits) and 0 on the fix. Full audit 1830 views: **0 findings**.
- **Tests:** `r18-kor7.proba.ts` +4 (prompt rule per type, fixture of the live bug, guard inputs, the retry wiring with the stand-in model).

---

# HANDOFF — 2026-10-12 R18 round 7: post topics & types — offer, prices, page, topic plan, five post types (NOT pushed)

- **Base:** main 196c0be (round 6 live). Decision doc: `docs/decisions/2026-10-12-r18-kor7-temak-tipusok.md`. Screens + audit:
  `design/R18-arculatfrissites/epitett-5/`. Spec `IRANYOK-round7.md` added; `IRANYOK.md` = round 7 on top of rounds 6–3.
- **Contracts:** `PosztTipus`, `KinalatSor`, `TemaTerv`, `TipusAdat`; optional profile fields (honlap, kinalat, kinalat_fajlok,
  arak_posztban, kozossegi_oldal, kepernyokepek, poszt_szokasok, tema_terv, beallitas_r7); `PosztForras.poszt_tipus / tipus_javasolt /
  tipus_adat`. ai-adapters: tasks `kinalat_kiolvasas`, `temak_terv`, `poszt_tipus`, `poszt_szokasok` (+ stand-in answers).
- **Server:** `profil/kinalat-szabaly.ts` (pure: hospitality, cleaning, social link, offer sub-pages, fallback plan), `profil/index.ts
  kinalatMent`, `onboarding/kinalat.ts` (site read, list read, habits, topics), `onboarding/kepolvaso.ts` (images/PDF → OpenAI Responses;
  stand-in in test mode), `onboarding/jovahagyas.ts` (honlap from the draft; keeps round-7 fields), `poszt/tipus.ts` (offer block, price
  post-check, type output check, video word count, copy texts, suggested type), `poszt/profil-blokk.ts` (offer + plan + habits in every
  prompt), `poszt/index.ts tipustKeszit / tipustTorol` + price post-check in text and rewrite. Prompts: `poszt_tipus`,
  `kinalat_kiolvasas`, `temak_terv`, `poszt_szokasok` (v1).
- **API:** `/api/onboarding/beallitas/{olvas,fajl,lista,oldal,temak}`, `/api/profil/kinalat` (GET tag / PUT szerkeszto),
  `/api/poszt/[id]/tipus`. **UI:** `app/onboarding/beallitas/*` (5 steps), `app/_kozos/R18Kinalat.tsx` (tick list, topic rows, type
  chip), `app/fiok/kinalat/*` + Fiok section, `app/poszt/R18Tipus.tsx` + `R15Poszt.tsx` (chips, panels), `poszt/page.tsx` (javasolt),
  `kepek/page.tsx` (`tipus=kartya`), `ElsoBeallitas.tsx` (approval → setup), `r18.css` §13. Migration **0170** (255 label rows).
- **Checks:** see the hand-back line (tipus, tokenor, keretor, hatar = 2 old cycles, terkoz, dockerfile-or, allapotor; apps/web + packages;
  new `r18-kor7.proba.ts` 18 tests incl. tenant isolation, km_app RLS on the profile row, prices off → no price in output).
  Layout audit 1830 views (+ /onboarding/beallitas, /fiok/kinalat, a video-type post): **0 findings**.
- **Open:** Vilmos — editors may edit offer/prices/plan; real site/model/vision output only checkable live; Kezdőlap/Naptár type
  suggestions not built; weekly volume postponed.

---

# HANDOFF — 2026-10-11 R18 round 6: Kati's 10-11 feedback — bugs + features A–G (NOT pushed)

- **Base:** R18 last round (0165–0167, live). Decision doc: `docs/decisions/2026-10-11-r18-kati-1011-kor6.md`. Screens + audit:
  `design/R18-arculatfrissites/epitett-4/` (`kor6-*.png` features, rest = bug part). `IRANYOK.md` restored = round 6 + 5 + 4 + round 3 text.
- **Bugs:** `app/kepek/Kitolto.tsx` (back keeps post + fields, per-field RO via `vizual/fordit-mezok.ts` + `/api/vizual/fordit {mezok,cel}`,
  `nyelv` override in `/api/vizual/helyzet*`), `R15Poszt.tsx` (copy stays, „✓ Kimásoltuk”), `R15Elonezet.tsx` + `r15/platform-aranyok.ts`
  (ratios, logo avatar via `r15/kep.ts`, no „+ Követés”), prompt `poszt_szoveg` **v8** + `poszt/bemenet.ts kozolhetoSzoveg`. Migration **0168**.
- **Features:** contracts `PosztForras.cta`, `SzervezetProfil.hivatalos_nevek` (both optional). `poszt/nevek.ts` (`nevekTisztit`,
  `nevekSorok`, `nevCsere`) → `profilSorok` + post-checks in szovegetKeszit/atir/forditastKeszit/nyelvreSzab + `vizual/melle.ts`.
  `poszt/index.ts ctaBeleir` ← `PUT /api/poszt/[id] {cta}`. `profil/index.ts hivatalosNevekMent` ← `GET/PUT /api/profil/nevek` (tag/szerkeszto);
  `onboarding/jovahagyas.ts` keeps the list on re-approval. UI: `R15Poszt.tsx` (chips, links, CTA, emoji), `R18Emoji.tsx`, `kurzor.ts`,
  `app/fiok/nevek/*`, `Fiok.tsx` section, `Helyzetek.tsx` + `kepek/page.tsx` (template step), `helyzet-minta ?poszt=`, `Kitolto.tsx` (HU|RO
  switch, „Mit töltsünk le?”, two files), `r18.css` §10–11. Migration **0169** (174 labels).
- **Checks (VM, PG 18.4, prod build):** tipus 0 · tokenor 0 · keretor 53 · terkoz regenerated · dockerfile-or ok · allapotor ok · hatar = the
  same 2 old cycles. apps/web **856/16/16** (the same 16 failures as main; new `r18-kati-1011` 12 + `r18-kor6` 14 tests). packages 666/0.
  Expectations moved with the reason next to them: `r18-kor3` + `poszt-forditas-elavult` v7→v8, `vj-javitas-1010` #7 (per-field RO) and
  #10/#5 (post → template step `/kepek?poszt=`). Layout audit 1740 views (+ `/fiok/nevek`, `/kepek?poszt=`, the image editor opened from a
  post `/kepek/uj/{uj,kesz}?poszt=` — never audited before: `/kepek/uj/munka` redirects): **0 findings**.
- **Coordinator review fixes:** (1) the floating Visszajelzés button never covers content: `r18.css` §12 — it sits at the page end (static)
  everywhere, and floats only on phone pages with a bottom bar, whose frame reserves its strip. (2) „A poszthoz teszem” on one line in the
  phone bar (`kepek.css`: nowrap, tighter padding) and the size picker columns fit their labels. Audit (`epitett-4/audit-szkript/`): new rule
  `lebego-takar` (fixed/sticky element over visible text/control, at load and scrolled to the bottom of window + scroll frames); the two-line
  rule counts a two-part card button per part. On the pre-fix build (HU only) the new checks found 16 floating overlaps + the bar button.
- **Migrations:** 0000–0169 from scratch OK; BEGIN/…/ROLLBACK: 0168 INSERT 24 · 0169 INSERT 174.
- **Open:** Vilmos — glossary editable by editors (not owner-only); real images + emoji glyphs + real model output only checkable live.

---

# HANDOFF — 2026-10-11 R18 last round: old name gone, „Saját ötlet”, „Naptár”, plural forms, layout audit 606 → 0 (NOT pushed)

- **Base:** R18 rounds 1–2 (main). Decision doc: `docs/decisions/2026-10-11-r18-kor3-naptar-sajat-otlet.md`. Screens, audit:
  `design/R18-arculatfrissites/epitett-3/` (audit.html / audit.json / audit-szkript/; `_munka-kepek/` = scratch shots, deletable).
- **1 · Old name:** migration **0165** (15 label rows + `belepes.cim_kiemelt` ×3 + `belepes.cim_eleje` EN = INSERT 19). Local DB after all
  migrations: 0 label rows match the old name in any language (before: 14 by regex + 3 sign-in rows). Code grep (apps, packages, nas, tools,
  excl. old migrations / R8 prompt drawings / comments): 0 user-visible hits. Icons: `public/r18/ikon/*` + `public/favicon.ico` +
  `app/manifest.ts`, `layout.tsx` `metadata.icons` (dark/light 32 px by `prefers-color-scheme`); measured all 200 (`ikon-ful.png`).
- **2 · Saját ötlet:** `app/poszt/R18SajatOtlet.tsx` + `r18-sajat.css`; `R15Poszt.tsx` opens it from all four „Saját ötletből” entries; the
  text → `forras.szoveg`/`forras.cim`, title = first 6 words. Prompt `poszt_szoveg` **v7** (idea = subject, profile = background, no invented
  facts). Input builder moved verbatim to pure `poszt/bemenet.ts` (`szovegBemenet`, `kivaltoSorok`). Info line „Téma: …” on the post page.
  Photo picker NOT built (no vision path; decision 3). Measured locally with the TEST AI only — real output must be checked live.
- **3 · Naptár:** migration **0166** (`poszt_munka` + `tervezett_nap date`, `javasolt_nap date`, `kiteve timestamptz`; nullable, no RLS
  change). Rules `poszt/naptar.ts` (pure); store `poszt/tar.ts naptarSorok/naptarMent` (only these columns, `frissitve` untouched); module
  `poszt/index.ts naptarBetolt/naptarMuvelet`; routes `GET /api/poszt/naptar`, `POST /api/poszt/[id]/naptar`; page `app/naptar/`
  (`page.tsx`, `Naptar.tsx`, `naptar.css`); nav item after Képek (desktop + ☰). Week range built from `formatToParts` (Node vs Chromium ICU
  differ on en-GB `formatRange` → React 418 hydration error, measured, fixed).
- **4 · Plural + audit:** `nyelv/sablon.ts` (ICU plural subset, one/few/other) used by `nyelv/kliens.tsx`, `nyelv/index.ts`, `esemeny/index.ts`;
  migration **0167** (labels for parts 2–3 + EN/RO plural values; INSERT 180). Live bug „This week: 1 posts done” → „1 post done” (EN), RO
  „1 postare gata” (measured, `kezdolap-egyes-vilagos-1100-en.png`). Audit (1620 views): **606 → 0** (286 h-scroll, 212 two-line buttons, 88
  overflow, 20 overlap → 0; misaligned rows 0 before and after). Top bar phone layout now ≤ 900 px (`felsosav.css`); other fixes `r18.css` §9.
  Kezdőlap „From the … news” line now only for news-based posts (`R15Kezdolap.tsx`; it said „A(z) <own idea> hírből”).
- **Checks (VM, PG 18.4, prod build):** tipus 0 · tokenor 0 · keretor ok · terkoz regenerated · dockerfile-or ok · allapotor ok · hatar = the
  same 2 old cycles. apps/web **830/16/16** (main 814/16/16; the same 16 failures, +16 new in `r18-kor3.proba.ts`), packages 666/0.
  `poszt-forditas-elavult.proba` expectation moved v6 → v7 with the reason next to it. The (already failing) `jogosultsag` matrix test now also
  lists `POST /api/poszt/[id]/naptar` among its 35 unlisted handlers — not added to the matrix (it lists none of the poszt routes).
- **Migrations:** all 167 from scratch OK; BEGIN/…/ROLLBACK re-run: 0165 INSERT 19 · 0166 ALTER · 0167 INSERT 180.
- **Open:** NAS dry runs; live check of an own idea with the real model; Vilmos: Naptár nav item + 900 px bar breakpoint; photos for Saját ötlet.

---

# HANDOFF — 2026-10-11 R18 round 2: public pages branded, visible breathing, name on the mark's baseline, tab titles (NOT pushed)

- **Base:** 6b43272 (R18 live). Csilla's three fixes. Screens + evidence: `design/R18-arculatfrissites/epitett-2/`.
- **1 · Public/pre-login screens:** new `app/_kozos/Marka.tsx` (`Jel` + `Marka`: a/t mark + `fejlec.termeknev`, uppercase) used by the
  top bar AND by Nyitolap (/), Adatkezelés, FiokOldal (Belépés, Regisztráció, jelszó pages, szervezet/új), the old onboarding frame, Első
  beállítás (name desktop-only there, as the old name was) and the invitation card. Small mode switch (`ModValto` gomb) on those headers
  (not on the invitation card; desktop-only in Első beállítás). Mode/fonts/aurora were already global; `r18.css` 8a: glass header bar,
  mono buttons, h1 tracking, transparent page backgrounds (.km-ny, hero, záró, .km-adk-lap). Content text unchanged; old `.km-ny-logo`
  /`.km-logo` CSS left in place (unused on these headers).
- **Titles:** migration **0164** rewrites the „… — Kommunikációs munkatér / Communication(s) workspace / Spațiu de (lucru de) comunicare”
  ending of every `*.oldalcim` to the product name (local: 60 rows + `nyitolap.oldalcim` = name, 3 rows; idempotent); `hf.oldalcim`
  also changed in `packages/news-monitor-feliratok/feliratok/hf.*.json` (sync test). `nyelv/oldalcim.ts` appends „ — <name>” to titles
  that are plain page labels (Képek, Posztszöveg …). Measured: „Posztgyár”, „Belépés — Posztgyár”, „Sign in — Post factory”, RO „Fabrica de postări”.
- **2 · Breathing:** `r18.css` §1 — opacity `--aur-min → --aur-max` (dark 0.25 → 0.9, light 0.35 → 0.8), scale 0.85 → 1.2, drift 6–10 %,
  7/9/8 s, purple core stop in the gradient; layer = `--aurora-atlatszo × --aurora-szorzo` (dark 0.88, light 0.77; `modok.ts`). Static
  under reduced motion. Measured 4 s apart on /belepes (dark): blob opacities 0.26/0.46/0.51 → 0.74/0.87/0.55, scale 0.85 → 1.12–1.18,
  translate up to 73 px (`pulzus-*-t0/t4s.png`).
- **3 · Name alignment:** `.r18-marka` `align-items: baseline` (the mark box has no text baseline → its bottom = bottom of the „a”,
  153.5/155 px rows in the PNG); gap ×1.5 (15 px desktop, 12 px phone); size unchanged (24 / 17.4 px). Pixel-measured at 3× on the
  rendered bar: name bottom vs „a” bottom = 0.33 px (1280, HU/EN), 0.0 px (390, HU/RO). Mark/name/mode-switch CSS moved from
  `felsosav.css` to `r18.css` (shared).
- **Checks:** tipus 0 · tokenor 0 · keretor ok · terkoz regenerated · dockerfile-or ok · allapotor ok · hatar: the same 2 old cycles.
  apps/web 813/17/16 vs 814/16/16 before: the one extra failure is `visszajelzes-export.proba` — a race (the list file is written
  fire-and-forget after the 201); it also fails 2 of 3 runs on the untouched base 6b43272 build (measured), so not caused by this round —
  worth adding to `ismert-bukasok.json` or fixing (await the write) separately. Packages 666/0.
- **Flake fixed (root cause):** `apps/web/visszajelzes/index.ts` now awaits `listaFajlbaIr` (3×) and `csomagFajlbaIr` before
  responding (they never throw; response unchanged). `visszajelzes-export.proba` 5/5 green in a row; full apps suite 814/16/16 = the main baseline list.
- **Open:** NAS dry run of 0164 (expect UPDATE ~60 / 3); Vilmos items from round 1 unchanged.

---

# HANDOFF — 2026-10-11 R18 arculatfrissítés: Posztgyár, one purple, dark + light mode, new top bar (NOT pushed, NOT deployed)

- **Contract:** Claude Design „Posztgyár · sötét/világos” (round 4) + `design/R18-arculatfrissites/IRANYOK*.md`. Decision doc:
  `docs/decisions/2026-10-11-r18-arculatfrissites.md`. Built screens: `design/R18-arculatfrissites/epitett/` (Kezdőlap, Hírek, Képek,
  Szervezet adatai × dark/light × 1280/390; Profil menu open; ☰ sheet; Cégeim desktop + sheet; RO/EN phone; 1024).
- **Tokens:** `packages/design-system/src/modok.ts` (+ `tema-sotet.json`, `tema-vilagos.json` = approved tema-A/B), `index.ts`
  `modTokenek()` / `modCss()` → `<style id="km-modok">` after `km-tokenek` in `app/layout.tsx` (`:root[data-mod=…]`, so KozosTema on
  public pages does not override it). `betuk.ts` `betuCss()` → `<style id="km-betuk">`; woff2 in `apps/web/public/betuk/` (14, OFL).
  Mode keys win over the org theme (colour/scheme edits no longer show in the chrome — flagged for Vilmos); non-mode keys stay the org's.
- **Mode:** `app/_kozos/mod.ts` (head script, `localStorage km-mod`, try/catch, `.mod-valt` 250 ms, none under reduced motion),
  `ModValto.tsx` (desktop icon button / phone switch row; follows device changes until the user chooses).
- **Top bar:** `FelsoSav.tsx` + `felsosav.css` rewritten (classes `r18-*`; old `km-sav*` kept on the same elements where tests/CSS
  refer to them). Profil ▾, Cégeim ▾ (only `munkaterek.length > 1`, existing `/api/szervezet/valt`), bell → `/beallitasok`, mode switch,
  account menu (+ Tagok, Visszajelzések moved from the removed company button). Phone: page label (hidden when it does not fit — measured:
  „Szervezet adatai” at 390 hides, RO „Acasă” fits beside „FABRICA DE POSTĂRI”), ☰ full-height sheet; VJ-1011 sticky Nyelv ·
  Kijelentkezés kept. The bar's glass is on `::before` (a backdrop-filter on the bar would trap the fixed sheet in the 60 px bar).
- **Look:** `app/r18.css` (global): aurora (`.km-aurora` in layout), mono UI type, solid buttons, panel cards, active-box edge on
  `[data-r15="teendo"]:has([data-r15="fo-gomb"])`, orange progress shimmer + orange generating spinner/skeletons, transparent page
  wrappers so the aurora shows, `HalvanyLogo.tsx` (fixed, z −1, rendered outside the bar). `alap.css`: old static aurora + fixed
  `color-scheme: dark` removed (now per mode).
- **Labels:** migration **0163** (9 keys × 3, `design/R18-arculatfrissites/feliratok.json`). Local PG 18.4: all 163 from scratch, then
  BEGIN/0163/ROLLBACK re-run OK, 27 rows.
- **Measured (VM, local production build, Postgres 18.4):** tipus 0 · tokenor 0 · keretor ok · terkoz updated (`pnpm terkoz`) ·
  dockerfile-or ok · allapotor ok · hatar: the same 2 pre-existing cycles (vizual/helyzet ↔ profil ↔ vizual/peldak), none new.
  apps/web tests: before 809 passed / 16 failed / 16 skipped → after 814 / 16 / 16 (identical failure list; +5 = r18-arculat.proba);
  packages: 660 → 666 passed, 0 failed (+6 = modok.proba). One expectation moved with its reason: vj-javitas-1011 #2 (sheet is 100dvh).
  Mode switch clicked in a browser: dark → light (data-mod, localStorage, `.mod-valt` during the fade), survives reload; phone row toggles
  back. Faded logo vs Visszajelzés at 390: no overlap on any page; no horizontal scroll at 390.
- **Screenshot caveat:** the VM's arm64 Chromium (sparticuz 143) crashes on any web font, so the shots use the SAME font files installed
  as system fonts (woff2 → ttf) with the `km-betuk` rules emptied in the page. The woff2 serving itself is measured over HTTP (200, font/woff2).
- **Not tested here:** the NAS, real Safari/iPhone, the live `Készül` overlay with a real image job (image maker unreachable — colours/animation
  only), test accounts are fresh (no news/posts), so content states differ from the drawing's sample data.
- **Open:** Vilmos OK (nav regroup; Theme-page colours overridden by mode); pre-login/onboarding header still „K · Kommunikációs munkatér”;
  logo SVG master.

---

# HANDOFF — 2026-10-11 robot-kint-javitas: the NAS read of the status page (branch robot-kint-javitas)

- Root cause (confirmed): `nas/nas-parancs.sh` ends with `ssh … 2>&1 | sed …`, so the 3-line post-quantum ssh warning lands in front of
  the file → „Expecting value: line 1 column 1”. Reproduced exactly with the old kint-sor.sh + a faithful fake NAS (36/41, same error text).
- Fix in `tools/gigabyte-robot/kint-sor.sh` only (nas-parancs.sh untouched — kirak-sha.sh relies on the merged stream): the NAS prints the
  file as one base64 line between KINT-ELEJE / KINT-VEGE markers plus its sha256; locally only that line is decoded and the hash checked.
  Empty / marker-less / corrupt read → local log line, no write, deploy unaffected. The write path only greps „átment” (warning-safe).
- Fake NAS in robot-onproba.sh now prints the 3 warning lines on stderr merged into stdout, plus an empty-read case: 41/41 green.
- The fix's own deploy still runs the OLD kint-sor.sh (the robot calls it from its clone before the clone moves to the new sha), so it
  logs the old error once; the robot-side history already holds 3681928 and the fix sha, and the NEXT successful deploy merges all lines in.

---

# HANDOFF — 2026-10-11 robot-kint: the robot writes „Kint: <sha> — <subject>” to the LIVE status page (branch robot-kint)

- `tools/gigabyte-robot/kint-sor.sh` (+ `kint-sor.py`; Python because the Gigabyte host has no node — kapu.sh:19). Called from `robot.sh`
  right after „Kint van” (success only); after a FAILED kirakás it runs `--csak-olvaszt` (no new line, only re-merges the robot's lines,
  because kirak-sha.sh:85 already overwrote public/ with the repo file). History: `~/.local/state/gigabyte-robot/kint-sorok.jsonl`
  (last 30, one line per sha). NAS: read via nas-parancs (NAS_SUDO) → merge (lines inserted in place, existing order untouched, no
  duplicates, frissitve = Bucharest now, schema = sema.mjs rules) → `cat > allapot.json.robot-uj && mv`. Any failure: one local
  robot-naplo line, exit 0. The repo file is never touched.
- Tests: `tools/kapu/onproba/robot-onproba.sh` new section I → 37/37 green (success = 1 line; re-deploy same sha = 0; red gate / 7 / 4 = 0;
  overwrite + re-merge keeps lines; malformed NAS JSON → no write, deploy still 0; repo lines untouched; Bucharest time).
- `tools/allapot`: `naplo --ido` now skips the old undated „23:50” lines. Rule written: docs/ALLAPOT-SZABALY.md 4.4 + 4.5 (lines describe
  what was done, never „még nincs kint”).
- No reinstall: the robot runs from its clone (`gigabyte-robot.service` ExecStart = %h/projektek/saas/tools/gigabyte-robot/robot.sh);
  the clone moves to a deployed sha only after success, so the merge commit's own deploy runs the OLD robot (no line for it); every
  deploy after that writes the line.

---

# HANDOFF — 2026-10-11 c6 status page cleanup (branch c6-allapot, NOT merged)

- `tools/allapot/allapot.mjs`: new `lezar <kód> --miert` (done + one-line reason appended to the name, never deletes), `naplo --ido "MM-DD HH:MM"`
  (dated line filed in place), `kezd --hatra` (open, not started). Used for everything; no hand edit of the JSON.
- Closed with evidence: sections F-8, F-9, F-10, F-11, J-1, C-4, R-15 (R-15 text rewritten) and 20 steps; waiting-list items c4 / R-14 / F-8.5 /
  contact e-mail removed or reworded. Open: KAPU-20, C3-JELSZO, C15-EMAIL, KATI-TESZT + Vilmos's c9 decisions. 8 dated log lines 10-09 → 10-11.
  Summary for Csilla: docs/c6/ALLAPOT-RENDRAKAS.html. README „Állapot” + deploy path refreshed.
- Publishing: the robot's `nas/kirak-sha.sh:85` copies `nas/public/` to the NAS on every deploy, so merging should publish; the live file still
  showing 10-09 08:20 contradicts that — not measurable from here (proxy). Diagnose + publish batch in the c6 report.

---

# HANDOFF — 2026-10-11 VJ-1011: Kati's phone items (branch vj-javitas-1011, NOT merged)

- **#9 logos:** root cause `packages/fajl-core/src/logo.ts:16` (2 MB `kepreAlkalmasLogo`) vs phone camera photos (3–5 MB): upload 201,
  never shown. Fix `LogokFeltoltes.tsx` `kepreMeretez` (shrink in the browser before upload). Open: logos already stored > 2 MB (re-upload),
  several legacy no-place logos collapse into „világos”.
- **#2 logout:** menu not scrollable + under the page bottom bar (z 50 vs 60); at 390 × 664 the row was at 643–681 px. Fix `felsosav.css`
  (bar 72 while open, menu max-height + scroll, sticky Nyelv · Kijelentkezés row) → 597–635 px.
- **#8 font names:** phone too (`Betuk.tsx`), overview „Tiszta · Public Sans` (`ArculatSzakasz.tsx`), drawing R16-arculat updated (probe 17/17).
- **#4 Kezdőlap:** `elso_sor_rovid` (≤ 8 words) on phone: 43 → 39. **#5 Hírek:** 3 cards (desktop) / 2 (phone) + „Még n hír” (0162):
  phone 46/52/52 → 35, desktop 63/73/73 → 56 (4/6/10 news).
- Tests: vj-javitas-1011.proba 6/6, r15-szamol +1; 0162 dry run INSERT 0 3 / ROLLBACK, run + rerun. Decision: docs/decisions/2026-10-11-vj-1011.md.
  Before/after: design/VJ-1011/ELOTTE-UTANA.html.

---

# HANDOFF — 2026-10-10 vj-tg-hub: hub line in the 08:00 tester Telegram message (branch vj-tg-hub, NOT merged)

- Csilla 21:55: `reggeliUzenet` (packages/visszajelzes-core/src/ertesites.ts) ends with one fixed line after the list link — `vj.tg_hub`
  „Nézd meg a hub kártyát is — lehet új tesztfeladat.” (migration **0161**, HU/RO/EN, no URL: the hub has no known web address). Only the
  morning message, only when it is sent (N ≥ 1); truncation keeps the link and this line (`szemelyes(…, zaro)`). Web: `hub` in the label frame
  (apps/web/visszajelzes/ertesites.ts). Tests: core ertesites.proba 36/36 (two expectations moved, reasons in place; new order test);
  apps/web vj-tg-hub.proba 2/2; live c1c7-ertesitesek.proba: the sent morning message is 5 lines, the 5th is the hub line (expectation moved, reason in place). 0161 dry run INSERT 0 3 / ROLLBACK, run + rerun OK.

---

# HANDOFF — 2026-10-10 c5 R-15 Round 3 BUILD + files up to 100 MB (branch c5-r15-kor3-kod, NOT merged, NOT deployed)

- **R-15 (drawing R15-lapok-6, Csilla 21:02–21:03):** `app/_kozos/R15Csempek.tsx` (4 tiles, `div role="navigation"`, `r15.kezdolap.csempek`;
  Hírek tile carries the old „Legutóbb …” time on desktop) first on `R15Kezdolap.tsx`; phone `telLathato = 0` (every „Még vár” row behind
  „Még n javaslat”). `app/_kozos/R15Ikon.tsx` (inline SVG, paths from gen6) on `Gephaz.tsx` TulajGephaz rows + Haladó, and
  `Beallitasok.tsx` switches (`KAPCSOLO_IKON`; the sysadmin „belépési kísérletek” switch has no icon — not on the drawing).
  `r15.kezdolap.meg_apro` → „Még {n} javaslat” / „Încă {n} sugestii” / „{n} more suggestions”; drawings R15-lapok-1/2/5/6, 03-kezdolap.resz,
  R13-lapok and both feliratok.json updated; kep-6 phone PNGs re-rendered; rajz-próba 14/14 green.
- **100 MB (Csilla):** fajl-core 0.3.0 (`celMaxMeret`, `KEP_MAX_MERET_BAJT`, `feltoltFajlbol` + `mentFajlbol`, `fajlFolyam` + `olvasFolyam`);
  `apps/web/fajl/beolvas.ts` (`torzsFajlba` streams to `FAJL_MAPPA/_feltoltes`, `korlatosBeolvas`, `eldob`); routes `arculat/fajl` (POST
  streamed except fonts), `arculat/fajl/[id]` (download streamed), `r15/kep` (10 MB, capped read); `vizual/helyzet.ts` + `arculat/nevlogo.ts`
  check metadata before reading. `hibaMitKulcs(kod, korlat10)` (Betuk passes true). `nas/nginx.conf`: 105m only on `/api/arculat/fajl`.
  Migration **0160** (24 rows; design/R15/feliratok-8.json). Decision: `docs/decisions/2026-10-10-fajl-100mb.md`.
- **Measured locally (production build):** 99 MB PDF peak RSS above baseline — upload +344 → +47 MB, download +443 → +45 MB (old code with
  only the limit raised vs this branch). Live tests `nagy-feltoltes.proba.ts` 7/7 (3 runs); `c5-kor3.proba.ts` 6/6; fajl-core 55/55;
  related live suites: only the known pre-existing kezdolap.proba 11/12/14 fail. UI: 101 MB PDF → „A fájl túl nagy: legfeljebb 100 MB lehet.”
  0160 dry run INSERT 0 24 / ROLLBACK, run + rerun OK. Checks: tipus, tokenor, keretor, terkoz, dockerfile-or, allapotor green; hatar has the
  same 2 pre-existing cycle errors as the base (vizual/helyzet ↔ profil ↔ vizual/peldak), none new. Probe on built views 10/12:
  03 phone 43 words (> 40) with the test AI's 12-word headline; the drawing's 5-word headline → ≤ 40 (open for Csilla). Drawing vs built:
  `design/R15/rajz/R15-lapok-6-epites.html`.
- **Deploy note:** the robot (`nas/kirak-sha.sh:110`) does not recreate the web container, so the new nginx.conf is NOT live until, on the NAS:
  `cd /volume2/docker/aitmetica-saas && sudo docker compose up -d --no-build --force-recreate web`, then
  `sudo docker exec aitmetica-saas-web grep -n client_max_body_size /etc/nginx/conf.d/default.conf` (12m and 105m). DSM's reverse proxy
  limit: check read-only (decision doc), don't touch.
- **Not tested here:** the NAS, DSM proxy, iPhone/Safari.

---

# HANDOFF — 2026-10-10 c5 R-15 Round 3 DRAWING (branch c5-r15-kor3, drawing only)

- **What:** `design/R15/rajz/R15-lapok-6.dc.html` — 03bT/03cT/03c2T/03jT (the approved 03 states with a tile row first: Hírek · Posztszöveg ·
  Képek · Iránytű) and 13aI/13bI/14cI (settings with inline-SVG line icons). Generator outside the repo (`/tmp/claude-0/c5kor2/gen6.py`,
  reuses gen5). Docs: kerdesek-6 (5 ★), gepezet-6, feliratok-8.json (1 key; feliratok-7 is 0159's), review page R15-lapok-6-attekintes.html,
  kep-6/, meres/rajz6/. Decision doc: Round 3 section (Facebook preview declined for now; triage a–d).
- **Measured:** rajz-próba 14/14 green. The tiles are `div role="navigation"` on purpose — the probe skips `<nav>`; counted honestly:
  03bT 59/60 · 38/40, 03cT 43 · 39, 03c2T 43 · 34, 03jT 59 · 38. Triage a–d measured on a local build of 4923dbe (PDF 3 MB 201 / 11 MB 413).
- **NEXT:** the judge on the four Kezdőlap views (Mac) → Csilla's ★ answers → build on a new branch.

---

# HANDOFF — 2026-10-10 Kati's feedback 10-10: five fixes (branch vj-javitas-1010, NOT merged, NOT deployed)

- **Triage** (no code): design/R15/VISSZAJELZES-TRIAZS-1010.html (branch vj-triazs-1010). Csilla 19:56: build A–E.
- **What:** (A #10) Kezdőlap `R15Kezdolap.tsx` → existing `r15.kozos.kepet_keszitek_munka` · (B #5) Posztszöveg `R15KepHely.tsx` → new
  `r15.kep.kep_ehhez_poszthoz` (migration **0159**, design/R15/feliratok-7.json) · (C #11) `packages/visszajelzes-react/src/stilus.css`:
  ≤ 640 px `box-sizing: border-box` on `.km-vj-bub` + the mode bar wraps (text on top, the two buttons in one row); desktop unchanged ·
  (D #7) `Kitolto.tsx` `NovoMezo`: the Romanian field is an auto-growing textarea (2–4 lines, then scrolls). The HU fields are separate
  one-line fields per question (title, one sentence) — not the same component, unchanged · (E #4) `R15Hirek.tsx`: one quiet `Info` line with
  the card's existing `forras_nev` (domain only, DESKTOP only — see the measurements; reason in the code comment).
- **Drawings updated (drawing = built):** R15-lapok-2 (03c/03c2 label; 03c2's `r15.kozos.minta_sor` text brought to today's value; 04b desktop
  source lines) · 08c-kep.resz.html (new label). Probe: R15-lapok-2 12/12 green, R15-lapok-1 7/7. 10: the RO field is not on the drawing (switch off).
- **Measured (local production build of the branch, 390 + 1440):** bubble right edge 408 → 378 at 390 (desktop 940 → 940); mode bar 206 → 126 px;
  RO field 44 px one line (364/1513 px visible) → 112 px (4 lines) phone / 88 px desktop; Hírek 2 cards phone 35 → 35, desktop 46 → 48 (green);
  with 4/6 cards the page is over T5 even without the line (existing). Kezdőlap phone 29 / desktop 30 (green). Posztszöveg desktop 61 words
  in this local state, unchanged by the label (the label is not on the first screen) — the long [MINTA] news title.
  Before/after: design/R15/VISSZAJELZES-JAVITAS-1010.html (vj-javitas-1010/). Tests: vj-javitas-1010.proba.ts 4/4; checks green; 0159 dry run
  INSERT 0 3 / ROLLBACK, run + rerun OK; local gate: see the report.
- **Not tested here:** the NAS; iPhone/Safari for the textarea growth and the feedback bar.
- **NEXT:** merge vj-javitas-1010 → live check on the phone; open from the triage: #1 (c15), #3 icons (drawing), #12 (Csilla answers Bruno).

---

# HANDOFF — 2026-10-10 c5 R-15 Round 2 BUILT (branch c5-r15-kor2-kod, NOT merged, NOT deployed)

- **What:** the approved drawing R15-lapok-5 (judge 18:17, Csilla 18:20 BUILD; drawing fixes in 4c900d0) built:
  09 `Helyzetek.tsx` (KerdesCim, one primary on the Kész munka card / phone bar `r15-also-sav`, descriptions hidden ≤ 640) ·
  10 `Kitolto.tsx` (Letöltés `data-r15` primary, 10w `DolgozoGomb` + `r15.kozos.par_masodperc`, spinner over the image, ✓ + 2 px size choice,
  „Így jó” only under empty fields, compact photo row after „Így jó”, megirtuk under the title, 10b: phone title + Letöltés újra, no badge,
  copy primary in the card / phone bar) · 12 `Fiok.tsx` + `r15-szervezet.css` (calm list, Átírom/Megadom, source sentence in the editor,
  `r15.sz.ai_nem_teny` footnote, `r15-keretes` phone frame, Mentés in the phone bar while editing) · 13 `Gephaz.tsx` (owner `TulajGephaz`,
  sysadmin `RendszergazdaGephaz` unchanged; credit line via `sajatKredit` in page.tsx; „Meghívok valakit” → `/tagok?meghivo=1`, Tagok opens its
  dialog) · 14 `Beallitasok.tsx` (state title, newest-unread primary / back home, switches behind „Miről szóljon ▾” incl. the live
  „A felületen”, dead e-mail/phone rows gone; Adatkezelés tab unchanged) · 03 c7: `visszajelzes.sajatJavitott` + `belsoUt`,
  `_kozos/R15Javitva.tsx` (✓ + count in `FelsoSav`, drop-down), Kezdőlap page passes `javitott`.
  kepgyar: the trade sample photo also on the `uj` sample. Migration **0158** (21 keys × hu/ro/en from feliratok-6.json).
- **Measured here (cloud copy, PG 18.4, test AI, local image maker on 8601):** tipus 0 errors (web, kepgyar) · hatar = the 2 known cycles ·
  tokenor 0 · keretor green · terkoz updated · allapotor green. Migration 0158: dry run INSERT 0 63 / ROLLBACK, run + rerun OK.
  New tests: c5-kor2-feliratok 4/4, c5-kor2-elo 4/4 (c7 cross-org, /tagok?meghivo=1, R-15 pages), kepgyar minta-foto smoke 39/39.
  Built views (production build, the Tibor-próba measurer, 1440 + 390): **26/26 green**; 10w working state measured (disabled, aria-busy,
  spinner, calm line). Drawing vs built: design/R15/rajz/R15-lapok-5-epites.html (kep-5-epitett/, meres/epites5/).
- **Deviations:** see docs/decisions/2026-10-10-c5-rajz-biralat.md „Round 2 build”. Footnote wording „Az AI javaslata nem tény.” (T3 token).
- **Not tested here:** the NAS; the real AI texts (local = [MINTA]); the trade photo on 09 (local org has no stored trade → neutral photo);
  WebKit/iPhone; the Tibor judge on the BUILT pages.
- **NEXT:** Csilla reviews R15-lapok-5-epites.html → merge c5-r15-kor2-kod (c4 gate) → robot deploys (kepgyar image too) → live check +
  screenshots; R-15 Round 3 (Adatkezelés with Vilmos, 15 Tagok, 06/07).

---

# HANDOFF — 2026-10-10 c5 R-15 Round 2 DRAWING (branch c5-r15-kor2, drawing only, no code)

- **What:** `design/R15/rajz/R15-lapok-5.dc.html` — 13 sections, desktop 1440 + phone 390: 09 Képek · 10a Kitöltő (ready) · 10w (making, working
  state) · 10b (downloaded) · 12a/12b Szervezet adatai (`/fiok`, read + editing) · 13a/13b Beállítások (`/gephaz`, Haladó closed/open) ·
  14a/14b/14c Értesítések (`/beallitasok`: 2 new / none / switches open) · 03j/03j2 Kezdőlap = the approved 03b byte-for-byte + the c7
  „Tegnap javítva” item (✓ + number in the top bar, drop-down list). Generator kept outside the repo (`/tmp/claude-0/c5kor2/gen5.py`, reuses Round 1 helpers).
- **Docs:** `design/R15/gepezet-5.md` (machinery per element; NEW: c7 per-person read `sajatJavitott`, `/tagok?meghivo=1`, credit read on
  /gephaz, 3 small client conditions), `design/R15/kerdesek-5.md` (18 questions with ★ + the full removed/moved table + my Tibor read),
  `design/R15/feliratok-6.json` (21 new keys hu/ro/en, no changed values), review page `design/R15/rajz/R15-lapok-5-attekintes.html`,
  screens `design/R15/rajz/kep-5/`, probe `design/R15/meres/rajz5/`.
- **Measured:** `rajz_proba.py` on the drawing: **26/26 green**. Today's pages photographed on a local production build of `6c1eea5` for
  reference (not committed). c7 machinery measured in code: `visszajelzes.kesz_ido` (0154) exists; the 09:00 Telegram job reads ALL fixed items,
  nothing per person reaches the app → one new read, no migration.
- **Measured on the drawing, decided by it:** the approved 03b is at 58/60 (desktop) and 39/40 (phone) words, so any body line breaks T5;
  a worded bar item wrapped the desktop menu → ✓ + number only (kerdesek-5 · 16).
- **Rule (Csilla 17:25):** 12/13/14 not judged; judge only on 09, 10a, 10b, 03j, 03j2. Decision doc appended (Round 1 live; Iránytű ideas =
  Csilla's call; Q1 support e-mail parked to c15 with c3).
- **Not done:** the Tibor judge (Mac batch); no code, no migration.
- **NEXT:** judge on the 5 views → Csilla answers kerdesek-5 (★ defaults) → Vilmos: Q6, Q8, Q12, Q13 → build on a new branch.

---

# HANDOFF — 2026-10-10 c5 R-15 Round 1 BUILT (branch c5-r15-kor1-kod, NOT merged, NOT deployed)

- **What:** the approved drawing R15-lapok-4 (f8f60a1) built: 01 Belépés (+01b), 02 Első beállítás (02a · 02a2 · 02b, title „Mit kell tudnunk
  rólatok?”), 05 Hír részletei (new page `/hirfigyelo/hir/[id]`; R15 Hírek card title + „··· › Részletek” link there; old `?talalat=` unchanged),
  11 Iránytű (`R15Iranytu.tsx`: 11a trade-picked example · 11a2 · 11b · 11c ideas → `POST /api/poszt` tipus "terv" · 11c2; the old editor
  `Iranytu.tsx` behind Átírom/Módosítás/„Inkább magam”/„Az egész iránytű”, new props `kezdoMod`/`sajatKezdesKezdo`/`onKesz`, T3 marks off).
  Shared: `DolgozoGomb` (R15.tsx) + `.r15-porgo`; `.r15-keretes` phone frame for km-hatter pages (login, onboarding); `FiokOldal r15` variant.
  Pure modules: `apps/web/iranytu/otletek.ts`, `apps/web/iranytu/pelda.ts`. Server: `r15Hir()` in `apps/web/r15/index.ts`.
- **Migration 0157** (`0157_r15_c5_kor1_feliratok.sql`, from design/R15/feliratok-5.json — now 57 keys incl. the 24 trade-example keys):
  2 changed values (`onboarding.eb_cim`, `iranytu.mire_hasznalja_szoveg`) + 55 new keys × hu/ro/en. Dry run (BEGIN/ROLLBACK) on local PG 18.4:
  INSERT 0 6 · INSERT 0 165 · ROLLBACK; real run + idempotent rerun OK; the gate ran all 158 migrations from scratch OK.
- **Measured here (cloud copy, PG 18.4 from npm binaries, test AI, no image maker, no outside network):**
  - `pnpm tipus` 0 errors · `pnpm hatar` the 2 known cycles only · `pnpm tokenor` 0 · `pnpm keretor` green · térköz-számláló updated (`pnpm terkoz`).
  - Local gate `tools/kapu/kapu.sh e3f8db0` (KAPU_MOD=helyi): **nem-rosszabb, green** — 1464 tests: 1428 green, 20 failing (all already in
    ismert-bukasok.json), 16 skipped; no new failure. New tests all green: c5-feliratok 5, c5-iranytu-otletek 4, c5-iranytu-pelda 2,
    c5-dolgozik 2, c5-elo 6 (05 route own 200 / foreign 404 / bad id 404 / logged-out → /belepes / old ?talalat= redirect; 05 post call tenant;
    11c tipus "terv" tenant-scoped + A-8 reuse + foreign 404; 11a example by trade incl. no leak between organisations).
  - Built views (production build, `/tmp` script with the Tibor-próba measurer, 1440 + 390): **22/24 green**; red = 01b both widths
    (T7: the error line has no action because `kozos.kapcsolat` is unset — with a local test contact label 01b is green). Working states
    02a2/05w/11a2/11c2: measured disabled + aria-busy + spinner + calm line (8/8). Drawing vs built page: design/R15/rajz/R15-lapok-4-epites.html
    (screens in design/R15/rajz/kep-4-epitett/, numbers in design/R15/meres/epites4/).
  - Full `tibor_proba.py` on the local build: 26/42; vs alap.json only `mit-figyeljunk` (both widths) got worse — cause measured in the app log:
    the test AI returns zero news topics → `GET /api/hirfigyelo/beallitas` 500 „Hibás tervezet … temak too_small” (existing code path, not touched
    by c5; on the NAS the real AI returns topics). Re-check on the NAS after deploy.
- **Deviations from the drawing (all small, listed for Csilla):** (1) 02a „Készítsük el” stays disabled until a website or description is typed
  (live logic kept; the drawing showed it enabled). (2) Phone: the calm/nyugtató line sits left of Visszajelzés in its strip (the approved live
  pattern), not inside the bottom bar. (3) 11c phone: the 3rd idea + „Jóváhagyva” start below the first screen (a measured spacer, so T5 holds).
  (4) 11a shows the neutral example when the trade is unknown (the drawing showed the paving one). (5) Átírom/Módosítás on 11 opens the full old
  editor view (not in-card editing) — as gepezet-4 · 4 says.
- **Tool change (rule 10):** `tools/tibor-proba/tibor_proba.py` registration clicks „Nincs weboldalunk” before typing (reason in place). Without it
  the gate cannot create its test account after this build.
- **Open for Vilmos:** Q1 support contact (`kozos.kapcsolat`); Q7 compass→post direction review; the security surface list in
  docs/decisions/2026-10-10-c5-rajz-biralat.md (no auth/RLS/secret change; new page + server reads are organisation-scoped).
- **Not tested here:** the NAS, real AI output (topics, compass suggestion, post writing), WebKit/iPhone, the Tibor judge on the BUILT pages.
- **NEXT:** Csilla reviews R15-lapok-4-epites.html → merge c5-r15-kor1-kod → robot deploys → live check + screenshots; Vilmos: Q1 + Q7.

---

# HANDOFF — 2026-10-10 c5 R-15 Round 1: 11a example + working states out of the judge (branch c5-r15-kor1, DRAWING ONLY)

- Rerun 14:07 on a49ff0a: 0 · 11 · 13 (working states "félrenyom: semmit"; 11a 4/3 „nem tudja, mi a dolga"). Csilla 14:09: (A) working states are
  states of the parent page — probe only, no judge; (B) 11a shows a greyed example compass (r15.ir.pelda_jel/_kampany/_tolni/_cel). Recorded in
  docs/decisions/2026-10-10-c5-rajz-biralat.md + kerdesek-4 (new Q13: térkő-specific example).
- No tool changed. Measured in zar.py: views without a verdict don't close; elfogadott.json is ignored with --rajz → 01b ×2 + 02a asztali still close
  the drawing gate. Proposed (not made): `zar.py --rajz --elfogadott <file>`.
- rajz_proba.py 24/24 green (11a: 39 words desktop, 39 phone). feliratok-5.json 33 keys (31 new + 2 changed).

---

# HANDOFF — 2026-10-10 c5 R-15 Round 1: judge fixes (branch c5-r15-kor1, DRAWING ONLY)

- Judge (Csilla's Mac, sonnet, on 383601f): 0 green · 13 yellow · 11 red. Csilla 13:56: accept 01b (both) + 02a desktop — recorded in
  docs/decisions/2026-10-10-c5-rajz-biralat.md + kerdesek-4 (NOT in tools/tibor-proba/elfogadott.json: zar.py ignores it with --rajz, keys are live pages).
- Fixed: calm line next to every busy button (02a2 r15.eb.fel_perc, 05w/11c2 r15.kozos.par_masodperc, 11a2 r15.ir.varj); 11a2 own title
  r15.ir.irjuk_kerdes + no links while working; 11a title/line and 11b title/line rewritten (T1). feliratok-5.json: 29 keys (27 new + 2 changed).
- Measured: rajz_proba.py 24/24 green. Re-judge NOT run here (no Ollama/key) — Csilla re-runs on the Mac.

---

# HANDOFF — 2026-10-10 c5 R-15 Round 1 update: Csilla's answers Q2 + Q9 + phone top bar (branch c5-r15-kor1, DRAWING ONLY)

- Q2: `onboarding.eb_cim` → „Mit kell tudnunk rólatok?” (changed value in feliratok-5.json, RO/EN added).
- Q9: four new drawn working states (screens, probed): 02a2 „Készítjük…”, 05w „Írjuk a posztot…”, 11a2 „Írjuk az iránytűtöket…”, 11c2 „Írjuk a posztot…”.
  Pattern = the live R15Poszt spinner (`r15p-porgo` + `r15.poszt.irjuk`) + `disabled`/`aria-busy` on the pressed button (gepezet-4 · 5).
  Duration line only on 02 (existing „Kb. fél perc…”, not measured); none on 05/11 (not measured — 05/11c answer at once, 08 writes with its own spinner).
- Phone onboarding top bar: „HU ▾” and „Mentés és vissza” are quiet text controls now (T2 note from Csilla), same actions.
- **Measured:** rajz_proba.py → **24/24 green** (16 earlier views + 8 working-state views). Judge still not run (no Ollama/key here).
- feliratok-5.json: 25 keys (23 new + 2 changed). kerdesek-4: Q2, Q9 marked DECIDED 10-10. Review page + kep-4/ (24 PNGs) regenerated.

---

# HANDOFF — 2026-10-09 c5 R-15 Round 1 drawings: 01 Belépés · 02 Első beállítás · 05 Hír részletei · 11 Iránytű (branch c5-r15-kor1, DRAWING ONLY)

- **No app code, no migration, no deploy.** Files: design/R15/rajz/R15-lapok-4.dc.html (8 sections, 16 screens = 1440×900 + 390×844, plus state
  panels, "TIBOR" tables and "HOVA KERÜLT" lists), design/R15/feliratok-5.json (22 new keys + 1 changed value: iranytu.mire_hasznalja_szoveg),
  design/R15/gepezet-4.md, design/R15/kerdesek-4.md (12 questions with ★ + full removed/moved table), review page
  design/R15/rajz/R15-lapok-4-attekintes.html with screenshots in design/R15/rajz/kep-4/, probe report design/R15/meres/rajz4/.
- **Measured:** `rajz_proba.py` on the drawing → **16/16 green** (cloud, Playwright Chromium; React/Google Fonts blocked by the proxy, so the
  raw x-dc template was measured with fallback fonts — same as earlier cloud runs). `zar.py --rajz` → ZÁRVA only because there is no
  biralat.json: **the judge was not run** (no Ollama / no API key here). Csilla runs on the Mac:
  `python3 tools/tibor-proba/rajz_proba.py design/R15/rajz/R15-lapok-4.dc.html --ki rajz-c5k1 && python3 tools/tibor-biro/tibor_biro.py --ki rajz-c5k1 --max 3 && python3 tools/tibor-proba/zar.py --ki rajz-c5k1 --rajz`.
- **Labels:** every visible string has `data-felirat`. Existing keys (127) carry their CURRENT value, read from the migrations (last value wins,
  script-extracted, not retyped); feliratok-5.json holds only new/changed keys (convention of feliratok-2/3/4).
- **Measured in code (main ff4253e), not live:** `kozos.kapcsolat` is set by no migration → "Elfelejtetted a jelszavad?" is hidden live
  (kerdesek-4 · 1); news detail today = HirFelugro popup at /hirfigyelo/osszes?talalat=…; `POST /api/r15/hirek/[id]/poszt` works for any
  talalat id; `PosztMunka.forras.tipus` accepts "terv"; onboarding approval only requires nev + osszefoglalo (`jovahagyhato`).
- **New machinery the code round needs (flagged in gepezet-4):** 05 route /hirfigyelo/hir/[id] (existing data); 11c idea list + POST /api/poszt
  with tipus "terv" (client only, not run end to end); 02a description reveal; 02b card read view + in-place edit (existing controls).
- **Product-direction question for Vilmos:** 11c makes the compass a post source (kerdesek-4 · 7).
- Status page: R-15i added as folyamatban with `--nem-tesz-ki` (not pushed to the NAS from here).
- Drawing generator (not in repo): /tmp/claude-0/c5kor1/gen.py in the agent sandbox — the .dc.html is the artifact.
- **NEXT:** Csilla reviews the attekintes page + answers kerdesek-4; judge run on the Mac; then the code round (one migration from feliratok-5.json).

---

# HANDOFF — 2026-10-09 08:2x c1/c7 → two personal Telegram messages (branch c1-telegram-osszevont, NOT live)

- Csilla 08:13: "say WHO needs to do WHAT". 08:00 → tester („Kati, tegnap N dolgot javítottunk — kérlek, nézd meg újra:"), 19:00 →
  developer („Csilla, ma N új visszajelzés jött:"); only when N ≥ 1; names from TELEGRAM_TESZTELO_NEV / TELEGRAM_FEJLESZTO_NEV; labels 0156;
  markers ertesites.telegram / ertesites.telegram_este. Core reggeliUzenet/estiUzenet; the 07:53 combined builder removed (never merged).

# HANDOFF — 2026-10-09 08:0x robot Telegram texts made human (same branch c1-telegram-osszevont)

- Csilla 07:58 on „Kint van / 41ccae624ffa …": "what am i supposed to understand from this?". uzenet.sh now takes a 3rd arg (key);
  Telegram gets only the plain sentence from tools/gigabyte-robot/uzenet-szovegek.txt; kint/piszkos = silence; local file keeps the detail.
  Callers: robot.sh, robot-regi.sh, szivdobbanas.sh, tools/titok/telegram-telepit.sh. Self-tests: uzenet-onproba 40/40 (fake API),
  robot-onproba with key assertions green. kirak-onproba needs a docker daemon (2/12 here, same on main; kirak-sha.sh untouched, sends no messages).

# HANDOFF — 2026-10-09 c1 → Telegram (combined 08:00 message: BUILT on branch c1-telegram-osszevont, NOT live)

- Csilla 07:53: the hub is not a target (its connector is Claude's OAuth). ONE 08:00 Telegram message: „Új visszajelzések" (since the
  previous morning message: words shortened, page, first name) + „Tegnap javítva"; empty part skipped, both empty → nothing. Migration
  0155 (label vj.tg_uj_cim). Hub sender kept, off (no HUB_* env). Core `osszevontUzenet`; app ertesites.ts; decision doc updated.
- Live already (41ccae6 deploying): NAS .env has TELEGRAM_* (07:47, backup .env.elotte-c7-20261009-074725); robot telegram file + test message OK.
- NEXT: merge c1-telegram-osszevont → robot → first combined message 08:00 tomorrow.

---

# HANDOFF — 2026-10-09 c1 + c7 (nightly hub digest + morning Telegram notice: BUILT on branch c1-c7-ertesitesek, NOT live)

- **Branch `c1-c7-ertesitesek`** from main 29dfd47. Decision: docs/decisions/2026-10-09-c1-c7-telegram.md. Secrets how-to: tools/titok/README.md.
- **How:** the hirfigyelo runner calls `ertesitesekTick` (apps/web/visszajelzes/ertesites.ts) once a minute. 02:00 Bucharest → hub digest
  (items since last digest, verbatim, page, author); 08:00 → one Hungarian Telegram message if anything became kész since the last notice.
  Pure part (texts, timing, once-a-day guard, env readers) in @km/visszajelzes-core `src/ertesites.ts`. Markers in `rendszer_beallitas`
  (`ertesites.hub`, `ertesites.telegram`). Migration **0154**: `visszajelzes.kesz_ido` (set by allapotValt) + labels vj.tg_cim/tg_tobb/tg_link.
- **Env** (nas/docker-compose.yml, all empty by default): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (-5557911968), HUB_FEEDBACK_URL, HUB_WRITE_KEY,
  HUB_SLUG, NYILVANOS_CIM. Missing → one log line a day, nothing else.
- **Hub write path NOT determined** (nothing in repo/docs): the sender is a pluggable POST {slug,text} + Bearer key, off until both env vars
  are set. Open question in the decision doc.
- **Measured here (cloud copy, PG18 npm binaries, KAPU_MOD=helyi, local kepgyar :8601):** core ertesites 23/23 (accents, empty day, many items,
  long text, 4096 limit — that test found a real overflow, fixed), live probe c1c7-ertesitesek 5/5 (DB, fetch intercepted: kesz_ido,
  missing env no-op, one TG + one hub send, no resend next minute, nothing-done = no message, send error = marker stays). Gate (KAPU_MOD=helyi) on 532c066: nem-rosszabb, 1437 tests = 1401 green, 20 failing + 16 skipped all in the baseline; the 2 old import cycles only.
  tools/titok self-tested with a fake ssh, a fake NAS folder and a throwaway robot user (dry run / write / unchanged).
- **Not tested:** real Telegram API, real NAS .env, real Gigabyte sudo/ssh csilla login, the robot's vault NAS login from a sudo shell,
  the compose recreate on deploy. The home-page "fixed yesterday" list is NOT built (needs a drawing).
- **NEXT:** Csilla runs tools/titok README Batches 1–3 (any time, before or after merge) → merges the branch → robot gate + deploy
  (migration 0154 with backup) → first notice next 08:00 after something is marked kész. Answer the hub endpoint question → set HUB_* in the NAS .env.

---

# HANDOFF — 2026-10-08 c15b (last 3 industry photos; MEASURED LOCALLY, NOT YET LIVE)

- muhely / kozlekedes / kert photos added to apps/kepgyar/minta/ and enabled in MINTA_FOTOK (apps/kepgyar/src/minta-foto.ts). All 8 categories filled; semleges = iroda.
- Measured locally: kepgyar fust-minta 38/38, kepgyar tipus 0, tokenor 0, allapotor ok, hatar = the same 2 old cycles. Full gate not rerun (kepgyar-only change); the robot's gate runs it on deploy.
- NEXT: Csilla merges c15b → robot rebuilds km-kepgyar → live check of a workshop/transport/garden sample.

---

# HANDOFF — 2026-10-08 (c15 industry-matched sample photo: BUILT on branch c15-iparagi-foto, NOT live)

## 2026-10-08 — c15 (Csilla decided 10-08 15:43–15:50)

- **Branch `c15-iparagi-foto`** from main c63a75f (c14 live). Decision: docs/decisions/2026-10-08-c15-iparagi-mintafoto.md.
- **How:** prompt kep_peldak v3 returns `kategoria` (8 closed keys or "semleges") in the SAME call → apps/web/vizual/minta-kategoria.ts
  parses it (unknown → semleges) → stored in `kep_pelda.adat.kategoria` (no migration) → `peldakFrissen().kategoria` → helyzetMinta sends
  `minta_kategoria` → apps/kepgyar/src/minta-foto.ts `MINTA_FOTOK` picks the file (missing → semleges = iroda photo; muhely/kozlekedes/kert
  have no photo yet = one commented line each). Category is in the image maker's sample cache key.
- **JPEG:** the photo-bearing kesz sample is image/jpeg q85 (~160–250 kB vs ~1.3 MB PNG); others PNG; the web route forwards the type.
  r16-betuk-vegpont expectation now png|jpeg (reason in place).
- **Deploy:** kepgyar fingerprint changes → robot rebuilds km-kepgyar; web image changes; no migration, no .env. Old web + new kepgyar →
  neutral photo; new web + old kepgyar → paving photo, PNG (both fine).
- **Measured here:** before/after for térkő, kávézó, fodrász in /home/claude/c15/out/ (before = paving PNG for all three; after = paving,
  café, salon as JPEG; text unchanged); a request without category → iroda photo. Tests: c15-minta-kategoria 6/6, kepgyar fust-minta 33/33.
- **Open:** existing workspaces get their category only when their samples are rewritten (Képek visit or profile change); until then the
  Kezdőlap shows the neutral photo. Live check + Tibor gate not done. The test AI connector returns no category (→ neutral).
- **NEXT:** Csilla reviews + merges → robot → live check (a café workspace: open Képek once, then Kezdőlap) + screenshot.

---

# HANDOFF — 2026-10-08 (c14 real example photo in the "Kész munka" sample: BUILT on branch c14-mintafoto, NOT live)

## 2026-10-08 — c14 (Csilla decided 10-08 15:05: Magnific stock photo, paid plan, no attribution)

- **Branch `c14-mintafoto`** (not merged). Decision: docs/decisions/2026-10-08-c14-mintafoto.md (supersedes the 10-01 "nem stock-fotó" note,
  whose comment in apps/web/app/_kozos/R15MunkaMinta.tsx now carries the new decision).
- **How:** apps/kepgyar/minta/kesz-minta-terko.jpg (Magnific 12455263, 1600×1066, JPEG 82, no metadata, 312 kB) + apps/kepgyar/src/minta-foto.ts.
  The image maker's POST /helyzet-minta puts it into `tartalom.fotok[0]` for `kesz` when the content has no photo and is not before/after —
  the same path an uploaded photo takes (vizual-core `foto()`). The editor image (POST /helyzet), the other six templates and the web app
  are unchanged; unreadable file → old stripes, no error. Smoke probe `pnpm --filter @km/kepgyar fust-minta` 10/10.
- **Deploy:** `apps/kepgyar/indit.sh --ujjlenyomat` changes (9906f13e… → b176af63…), so the robot rebuilds km-kepgyar on the Gigabyte
  (`--ha-valtozott`, before the web images go to the NAS). No migration, no NAS .env change.
- **Measured here (cloud copy, local image maker on :8601, Chromium 1194):** before/after PNGs in /home/claude/c14/out/ — the text block
  (y 700–1350 of 1080×1350) is pixel-identical, only the photo slot changed; RO general sample gets the photo; "Új" sample and the editor
  image keep the stripes. Sample PNG grows ~76 kB → ~1.3 MB (cached in the image maker; noted in the decision as a possible follow-up).
- **Not tested here:** the live phone Kezdőlap / Hírek / Képek screens, the real Gigabyte rebuild, the Tibor gate on the new sample.
- **NEXT:** Csilla reviews + merges → robot rebuilds kepgyar → live check of Kezdőlap phone + screenshot → Tibor gate on Kezdőlap phone.

---

# HANDOFF — 2026-10-07 (c4 protected main: gate + pinned-SHA robot BUILT on branch c4-terv; NOT switched on, NOT on main)

## 2026-10-07 — c4 K1–K5 (Csilla approved the plan 10-07 14:54, all 9 defaults; security items approved by Csilla on Vilmos's behalf — Vilmos to see it on the hub)

- **Branch `c4-terv`** (not merged). Plan docs/plans/c4-vedett-main.md, decision docs/decisions/2026-10-07-c4-vedett-main.md, how-to tools/kapu/README.md.
- **Built:** tools/kapu/ (kapu.sh gate, proba-kornyezet.sh throwaway PG18 + app on 127.0.0.1, osszesit/osszevet/hatar-hibak, ismert-bukasok.json);
  tools/gigabyte-robot/robot.sh rewritten (quiet 2 min, one lock, pinned SHA, `--sha`, `--proba`, red never retried, infra retried 5/15/30 min
  then red); the old robot kept verbatim as robot-regi.sh and used unless `KAPU=1` in ~/.config/gigabyte-robot/beallitas; nas/kirak-sha.sh
  (git archive + VALTOZAT, `<sha12>` images → :helyi, old → :elozo, backup+migrate BEFORE app swap, rollback only without migration, read-back);
  uzenet.sh Telegram (token via curl -K stdin) + file; szivdobbanas.sh/.timer daily 08:57, speaks only on trouble; telepit.sh installs it.
- **Test helper guard:** apps/web/probak/segedek.ts refuses any DB whose comment ≠ KAPU_JELOLO, and without KAPU_JELOLO refuses non-loopback
  hosts BEFORE connecting. No test expectation changed.
- **Measured here (cloud copy, Postgres 18.4 from npm binaries, KAPU_MOD=helyi, image maker on :8601, no outside network):** 1403 tests in 16
  packages — 1367 green, 20 failing entries (18 tests + 2 files whose beforeAll fails), 16 skipped; apps/web 777 = 744/17/16 + 1 file that
  cannot load. Same set in two independent runs. Boundary checker: exactly the 2 old cycles. All 154 migrations from scratch: 11 s.
  Never-run tests, first run: nyelv-munkater 2/2 and arculat-fajl-hibak 8/8 green; kredit 5/8 (default credit 1000 vs code 500/150), sema
  (beforeAll expects `hatasos` from GET /api/tema), hf-temak (cannot load TSX), visszajelzes-export (race) — all baselined with reasons.
  Real gap found: jogosultsag.proba — 33 modifying handlers missing from the B-01 matrix (Vilmos's area).
- **F-11 fixed** (status page): F-11b added for the never-run tests; C-4 section added; allapotor green. Also fixed the stale page time.
- **Self-tests:** gate end to end green on d3cb673 (184 s here, no image build); injected failure refused (see tools/kapu/proba-naplo/kapu-piros);
  comparator rules 5/5; robot on a local bare repo 20/20 (two pushes 1 s apart → only the 2nd deployed after the quiet period); kirak-sha with a
  stub NAS 12/12 (order measure → source → load → tags → MIGRATE → app → fence → read-back; exit 4/7/8/9/3); Telegram against a local fake API.
- **NOT tested here:** KAPU_MOD=docker (Docker Hub blocked in the sandbox: no image build, no migral.sh backup inside the gate), the real NAS,
  the real Telegram API, systemd units, the Gigabyte itself. README Batch 2 measures the docker mode with `--proba` (no NAS).
- **Gotchas paid for:** a background postgres/next must not inherit the robot's lock fd 9 or the caller's pipe (an orphan next-server held the
  lock; `cmd | tee` hung on a `cd && … &` list). pg_dump 16 refuses a PG18 server, so migral.sh's backup refuses to migrate (correct).
- **NEXT:** Csilla reviews + merges c4-terv → the old robot deploys it → README Batches 1–3 on the Gigabyte (as user `gigabyte`) → KAPU=1.
  Then hub chunks for: the 2 import cycles, the 33-handler permission gap (Vilmos), the stale tests (feliratok, kezdolap/tagok-lap, kredit, sema, hf-temak).

---

# HANDOFF — 2026-10-06 evening (tester-feedback round + credit screens + Szöveges képek LIVE; Tibor gate = recommendation)

## 2026-10-03 → 10-06 — what happened (main = 906ce42)

- **Credit screens (R-13) live** (b41c33e, 38d143e; migrations 0145–0146). Kati's phone fixes live and retested OK by her (10-05).
- **Feedback triage:** all 46 items (42 in-app + Kati's hub notes) checked against code; 37 of 42 in-app items marked done in /visszajelzes (open: #3 declined FB preview; #22, #23, #27, #30 need Kati's retest on the original accounts). Triage page: ~/saas/_patches/visszajelzes-triazs-1006.html.
- **Fixes live:** top-bar K → Kezdőlap; 8 wording fixes (0147); several font files at once; Romanian place names in translations (H1); Találatok pontosítása off the menu; Feedback button before login (anonymous, rate-limited, 0148); R-17 drawings built (0149–0150): Arculat back link + Kész, exact colour code, slot preview, phone logo tiles + font names, free name-logo + paid logo-design request (admin price + recipient + list; email only when SMTP_* env is set — not set yet), Posztszöveg Blog / honlap, landing first-visit language; T10 fixes (content ends above the Feedback button on all bottom-bar pages, Saját fiók one frame).
- **Szöveges képek (VZ-1 redraw, built):** Képek row + /kepek/szoveges-kepek (redirects from /kepek/kozlemenyek and /kepek/kozlekedes); pre-fill from post (one AI call), notice-number counter per workspace, brand-rule warnings to an admin list (0151–0153). Name decided by Csilla 10-06 18:15.
- **Decisions:** docs/decisions/2026-10-04-elfogadott-pirosak.md (Vilmos OK), 2026-10-06-nevtelen-visszajelzes.md, **2026-10-06-tibor-ajanlas.md — the Tibor gate is a recommendation: every red goes to Csilla in plain words (screenshot changed or not), she decides.** Gate 18:36: login desktop (identical screenshot, noise) + Kezdőlap phone (striped sample still confuses) — both accepted by Csilla 20:43; hub chunk c14 = replace the striped sample with a real example photo.
- **Workflow facts:** patches built by cloud Opus agents on repo snapshots, applied with git am in Csilla's clone via the device bridge, she pushes. Request delete permission on ~/saas at every session start (git lock files). The gate runs with ~/saas/_tibor/bin/python3 (system python3 has no playwright). Cloud sandbox has Node 22; agents use node 24 from the npm package node-linux-x64@24.
- **NEXT:** move to the MacBook Air (clone + vault + _tibor venv). Then: c1 + c7 feedback loop (02:00 digest to the hub, morning Telegram "fixed yesterday" to Kati — needs bot token + Kati's chat ID in the NAS .env), c4 protect main, c14 example photo, SMTP mailbox for logo requests (whenever).

---

# HANDOFF — 2026-10-06 (VZ-1 Közlemények built; MEASURED LOCALLY, NOT YET LIVE)

## 2026-10-06 — VZ-1 notice editor (design/VZ1-szerkeszto, Csilla approved 17:32, every ★ default)

- **Built:** Képek row + page „Közlemények” (/kepek/kozlemenyek, V1 choose; old /kepek/kozlekedes redirects there with ?poszt=). Editor on its
  old URLs /kepek/zavar · allitas · adatsavok (V2 filled · V3 Számokban · V4 nem fér ki + „Legyen ez”, image shows the shorter text · V5 kész
  · V6 image maker down). Old VZ-1b screen (Szerkeszto.tsx, Sablonok.tsx) removed; its machinery stays (keszit, fordit, mintakep, sablonok).
- **New machinery:** (1) pre-fill from a post — POST /api/vizual/kozlemeny/kitolt, ONE AI call (feladat `kozlemeny_kitoltes`, prompt
  kozlemeny_kitoltes v1; keret + cost + credit as melle.ts), only well-formed fields reach the form; (2) notice number — `kozlemeny_sorszam`
  (0152, RLS): suggestion = last downloaded + 1 per workspace & recipe, editable under Részletek, POST /api/vizual/kozlemeny/letoltve stores it;
  (3) „Hol?” vs „Melyik járat?” — new package VALUE `tomegkozlekedes` in `iparagi_csomagok` (no new field; nobody has it yet).
  Brand-rule warnings → `kep_jelzes` (0152, RLS) on download, admin list /gephaz/kep-jelzesek (SECURITY DEFINER kep_jelzes_osszes()).
- **Labels:** 0151 = 45 drawing keys verbatim + 34 machinery keys (237 rows). Decision: docs/decisions/2026-10-06-vz1-kozlemenyek.md.
- **Measured locally** (local image maker apps/kepgyar on :8601, teszt AI): tipus 0 · hatar same 2 old cycles · tokenor 0 · keretor ok ·
  terkoz updated · allapotor only old F-11 · tests 776 / 741 pass / 19 fail = the same 19 as before; 25 new (vz1-kozlemeny-szabaly 14,
  vz1-feliratok 5, vz1-kozlemeny 6 live incl. km_app RLS for both tables and the AI pre-fill with the test connector) · 0151/0152 dry run +
  idempotent rerun · Tibor probe (tools/tibor-proba MERO_JS) on 22 views 1440 + 390: T10 22/22 clear, no other red. Screenshots out9/kep.
- **Not done / open:** live check; Vilmos review (AI call, two tables, admin DEFINER list, removal of the old screen); the test connector's
  translation is long sample text (V4 screenshot RO typed by hand); the image uses the próba-arculat (first-round machinery, not Kovács colours).
- **NEXT:** Csilla applies vz1k patches → push → robot (0151/0152 with backup; kepgyar unchanged) → live check + screenshots → Vilmos review.

---

# HANDOFF — 2026-10-06 (R-17 drawings built into code; MEASURED LOCALLY, NOT YET LIVE)

## 2026-10-06 — R-17 build (Csilla approved the drawings 10-06 14:18, every ★ default + three answers)

- **A · Arculat:** „‹ Logó, színek, betűk” back link on Logók / Színek / Más szín / Betűk / Névlogó; „Kész” primary on Logók once a logo
  exists (bottom „Vissza” gone); tapping a filled slot selects it and the preview follows (Profilképnek → round profile mock, others →
  sample image with that logo); „Pontos kódom van” on Más szín (hex / RGB, all three colour tabs, error sentence, colour unchanged on
  error); phone overview shows all logo tiles + font names.
- **B · Logótervezés (paid):** quiet „Tervezzünk neked logót — 79 €” under the free name-logo; /fiok/arculat/logoterv questionnaire
  (pre-filled from the profile) → thank-you (call, contract, bank transfer, no online payment); Beállítások (rendszergazda): price,
  recipient, Logókérések list with status. Migration **0150** (`rendszer_beallitas`, `logoterv_keres` with RLS, two SECURITY DEFINER
  functions). Email only with SMTP_* env + recipient; otherwise row `nincs_beallitva`, no error. No hub mechanism exists → none added.
  Decision: docs/decisions/2026-10-06-r17-logoterv-levelezes.md (Vilmos to review).
- **C · Posztszöveg „Blog / honlap”:** fourth tab, title line, soft „n / kb. 2500 karakter” counter, no hashtags, prompt poszt_cikk v1,
  poszt_forditas v4 (translates the title). Contracts: PosztFelulet + "blog", PosztSzoveg.cim.
- **D · Nyitólap:** browser language if HU/RO/EN; otherwise a quiet „Nyelv · Limba · Language” chooser; the choice is remembered (cookie).
- **Labels:** migration **0149** (72 keys × 3 = 216 rows; the 32 drawing keys verbatim). design/R16-arculat/feliratok.json + drawing
  text now match the live 0147 labels (open item from the fb round closed).
- **Measured locally:** tipus 0 (every package) · hatar = same 2 old cycles · tokenor 0 · keretor ok · terkoz updated · allapotor only
  old F-11 · tests 751 / 716 pass / 19 fail = the same 19 names as main; 54 new r17 tests pass (incl. live RLS check as km_app and a
  fake SMTP server → `elkuldve`) · 0149/0150 dry run + idempotent rerun · screenshots 1440 + 390 in out5/kep, drawing frames in out5/kep/rajz.
- **Deviations:** the R-17 drawing still shows old slot labels (live = 0147) · admin rows sit after Árfolyam; recipient + list rows not
  drawn (required by Csilla) · HU counter shows „2500” (Intl does not group 4 digits; drawing „2 500”) · blog preview menu bars
  decorative · Tibor probe/judge not run.
- **NEXT:** Csilla applies the r17k patches → push → robot (0149/0150 with backup) → live check + screenshots → Vilmos reviews
  logoterv (DEFINER list, SMTP env) → if wanted, fill SMTP_* in the NAS .env and the recipient in Beállítások.

---

# HANDOFF — 2026-10-06 (tester feedback round 10-06: 12 items; MEASURED LOCALLY, NOT YET LIVE)

## 2026-10-06 — tester feedback round (triage + Csilla's decisions 10-06, „do not wait for Vilmos”)

- **Built (plain names; feedback numbers in brackets):** top bar „K” + product name → Kezdőlap [#1] · Logó, színek, betűk: „Minták,
  kézikönyv” [#4/H4] · Válassz logót a cégnevedből: „A négy helyre mi tesszük.” removed [#6] · Milyen betűtípus illik hozzátok?: title
  [#7], licence sentence [#8], several font files at once (`multiple`, one after another; hint text says it) [#9] · Töltsd fel a
  logóidat: „Melyik logó hova kerül?” [#12], „Profilképnek” [#16] · first setup: „Mely híroldalakat figyeljük” [#24] · Posztszöveg:
  stale, not hand-edited language cell re-translates on switch + place-name rule in poszt_szoveg v6 [H1] · Találatok pontosítása off
  Tibor's path (menu row, tab, two links gone; page + route kept) [#17/#40] · Feedback button on the pre-login pages, anonymous path [Kati 10-02].
- **H1 root cause (code):** R15Poszt `nyelvreValt` translated only EMPTY cells; a stale (`elavult_forditas`) machine translation came back
  unchanged. Fix in app/poszt/forditando.ts. Cells translated earlier by the old v2 prompt that are NOT stale are not re-translated
  automatically („Új változat” does it). Phone Posztszöveg has no „Más nyelven” at all (as drawn) — measured on desktop only.
- **Migrations:** 0147 (8 existing keys, 22 rows, labels only) · 0148 (visszajelzes: szervezet_id/fiok_id nullable, `nevtelen` column,
  vj.nevtelen × 3) — dry run + idempotent rerun measured locally. Decision: docs/decisions/2026-10-06-nevtelen-visszajelzes.md.
- **Security (Vilmos, after the fact):** POST /api/visszajelzes is now `nyilvanos`: with a workspace → old path; without session/workspace
  → 10 attempts/hour/address (korlat.ts `visszajelzes`), body ≤ 450 kB, text ≤ 1000, image only PNG data URL; anonymous rows only in the
  admin list. Password inputs are filtered out of the screenshot. Phone ≤ 640 px: on these pages the button sits at the page end (it
  covered „Készítsük el” when floating).
- **Measured locally:** tipus 0 · hatar = same 2 old cycles · tokenor 0 · keretor ok · terkoz updated + ok · allapotor only old F-11 ·
  tests 697 / 662 pass / 19 fail = the same 19 names as main (diffed); 30 new tests pass. Screenshots /home/claude/out3/kep.
- **Not done here:** design/R16-arculat/feliratok.json still holds the drawing-time texts (design/ untouched by request).
- **NEXT:** Csilla applies the fb-* patches, pushes; robot deploys (0147/0148 run with backup) → live check → Vilmos reviews the anonymous path.

---

# HANDOFF — 2026-10-06 (credit screens round 2: Csilla's four answers; MEASURED LOCALLY, NOT YET LIVE)

## 2026-10-06 — credit screens round 2

- **Decisions** (docs/decisions/2026-10-03-kredit-rajz-dontesek.md, „2026-10-06” section): (1) Tagok stays as today — no change. (2) Kezdőlap credit
  line only on „Mára kész vagy” — the code also showed it on the „Mutasd meg a legutóbbi munkádat” variant; fixed. (3) Hírek + Posztszöveg out of
  credits: the owner gets the quiet link „Szeretnél több kreditet?” → /tagok/kreditek (migration **0146**, 1 key × 3); members keep the sentence.
  (4) Saját fiók out of credits: the news settings stay below, faded with the new token `--szakasz-halvany` (0.55), still usable.
- **Measured locally:** 0146 dry run INSERT 0 3 / ROLLBACK, re-run idempotent; tipus, hatar (same 2 old cycles), tokenor, keretor, terkoz; tests:
  the 19 old failures only, new tests pass (one existing assertion changed with its reason written in place: decision 4). Screenshots in out/kep2.
- **NEXT:** apply kredit2 patches → push → live check → kapu.py.

---

# HANDOFF — 2026-10-03 evening (credit screens built + Kati's two phone fixes; MEASURED LOCALLY, NOT YET LIVE)

## 2026-10-03 — credit screens built + Kati's two phone fixes

- **Built by a cloud Opus agent on snapshot 17534ca** (local Postgres 16 with all 146 migrations, `next build` + `next start`, Node 24 from the
  npm `node-linux-x64` package because the sandbox has Node 22; Playwright Chromium 1194). Nothing deployed; no push. Patches: `kredit-000N-*.patch`.
- **Commits:** f0563ec Kati fixes · 2a10037 migration **0145** (76 r13 labels × hu/ro/en, verbatim from design/R13/feliratok.json) + the 4 tokens
  (r15.css) · 62c782b data + shared pieces (kredit `sajatKredit`/`kreditekNezet`, hirfigyelo/sajat-szures-nezet.ts, R13Kredit.tsx, r13-szabaly.ts,
  r13.css) · 9d8a443 **Saját fiók** news + credit sections · 9e1b74d **Tagok** „Kreditek ›” row, being-alone state, **Kreditek view** /tagok/kreditek ·
  200f0cd **Kezdőlap** credit line + used-up row, **Hírek** and **Posztszöveg** used-up states · 0269238 **admin /koltseg** monthly credit columns ·
  last commit: tests, térköz numbers, this entry, kerdesek Q15 → L4; állapotlap in its own commit (nas/public/allapot/allapot.json).
- **No new endpoint.** Every control uses the R-13 endpoints that were already live (gepezet.md): sajat-szures GET/PUT, kredit sajat/tagok/
  tagok/{fiok}/munkater/{szervezet}/munkaterek, R-2 tagok PUT/DELETE + meghivo. The pages read the same data server-side through the kredit
  module. Tenant separation measured: another workspace's owner gets 404 on PUT /api/kredit/tagok/{member}, row unchanged (new live test).
- **Kati, phone:** (1) „Mutasd be a szervezetet” — ROOT CAUSE measured: `.km-eb-kartya` and `.km-eb-mezo` were `width:100%` with content-box sizing,
  so padding+border pushed the card to 404 px and fields to 417 px on a 390 screen. Fixed with border-box; 390/360/320: nothing past the edge.
  (2) show-password on account creation — NOT reproduced: in Chromium phone emulation (390 and 360, touch, keyboard text) the button works on the
  unchanged code too. Hardened: the button no longer takes focus from the field (keyboard stays open, nothing jumps under the finger) — measured:
  before, focus left the field; after, it stays. Needs Kati's retest on her phone (WebKit not available here).
- **Measured:** tipus 0 · hatar = the same 2 old cycles · tokenor 0 · keretor ok · terkoz updated + ok · allapotor only the old F-11 · tests
  664 / 629 pass / 19 fail = the same 19 names as main (diffed); 15 new tests pass. 45+ screenshots at 1440 and 390 (MEASURED.md lists them).
- **Open questions (MEASURED.md has the full list):** Tagok first screen kept as today (decision 10-03) although the 13b0 drawing restyles it and
  drops e-mail, join date, pending invites and the event log — Csilla's yes needed before removing them; owner variant of the under-button
  sentence on Hírek/Posztszöveg (kerdesek 2, still member wording); credit line only on Kezdőlap 03c (as drawn) — also on 03a/03b?; the news
  sentence when the workspace has no news setting yet (general sentence used); Saját fiók used-up state hides the news section (not drawn);
  Vilmos: kerdesek 3–7 unchanged (equal share for néző, PUT validation, calendar month, which actions cost credit). No auth/RLS change was made.
- **NEXT:** Csilla applies the patches, pushes; robot deploys (0145 runs with backup) → live check on her workspace → kapu.py for the credit pages.

---

# HANDOFF — 2026-10-03 (R-13 credit screens drawn; rajz-zár ZÁRVA on stable owner-page reds; Csilla's accept pending)

## 2026-10-03 — c5: R-13 credit drawing package, 4 judge-driven rounds

- **Package (design/R13/):** all 4 pages in rajz/R13-lapok.dc.html, 24 marked views (13a ×3 states, 13b0/13b1/13b2/13b3/13b4, 13d1–13d4; desktop+phone) + 13c admin view (unmarked, Tibor-exempt per Csilla). feliratok.json 76 r13.* keys ×3 languages; gepezet.md maps every control to the R-13 request §2 endpoints; tokenek.md adds 4 tokens. Drawn by a cloud Opus agent on snapshot 01e5446; generator in the agent's workspace, drawing is static.
- **Csilla's decisions (docs/decisions/2026-10-03-kredit-rajz-dontesek.md):** (1) money line "Nem kerül külön pénzbe" allowed, Vilmos after-the-fact — stays on 13a + Kreditek view; 13d2/13d3 keep "Ehhez nem kell kredit." BY MEASUREMENT (money line scored 4 vs 5 there). (2) Tagok first screen unchanged; credit split behind a quiet "Kreditek ›" row → own view /tagok/kreditek (new small requirement). (3) Member-voice judge reds = context artifacts (Cipó Pékség class), recorded not redrawn — applies to 13d3.
- **Results (final run ~/saas/_tibor/rajz-r13-FINAL/):** rajz-próba 24/24 GREEN (independently re-run by the main session). Sonnet judge 0 zöld · 10 sárga · 14 piros; zar.py --rajz: ZÁRVA. The reds are STABLE (±1 over 4 rounds, two full stability reruns) at 3–4 points, all on owner-only settings pages (13a1–3 desktop, 13b0/13b1/13b2/13b4, 13d2) — "dolgom: nem tudom" on pages with nothing to do on a normal day; 8 layout shapes tried. Calibration: approved live R15-lapok-2 scores sárga 5–6 with the same judge; 06 Mit figyeljünk 4 sárga. Q15 (kerdesek.md) = Csilla's accept/reject of these as a judge limitation; plain-language brief delivered (~/saas/HOL-TARTUNK-2026-10-03.html).
- **Kati feedback 10-02 (hub):** (a) phone onboarding: "jelszó mutatása" dead, "Mutasd be a szervezetet" overflows, and no Feedback button pre-login (pre-login exposure = Vilmos); (b) first-visit language chooser popup proposal (public surface = Vilmos). The two phone bugs go in the next code round.
- **Gotchas:** cloud GitHub credential has no access to Tolgyes/aitmetica-saas and the device VM has no ssh/DNS for git — every pull/push runs in Csilla's own terminal. Device bridge dropped twice mid-session; queued commits via device_commit_files worked on reconnect.
- **Open / NEXT:** Csilla: Q15 accept/reject + OK on the simplified 5-step stage names (Megbeszéljük → Rajz → Tibor-teszt → Építés → Kirakás+Kapu; on OK, bake into EGYUTTMUKODES.md). Then: code round for R-13 (migrations for r13 keys, Kreditek view, Kezdőlap credit line) + Kati's 2 phone bugs → deploy → kapu.py. Then VZ-1 image editor drawing. Unchanged: helyzet.ts logo sizing, c7, c4, Vilmos items. Állapotlap entry not added this round (no pnpm in the device VM); add with the code round.

---

# HANDOFF — 2026-10-02 morning (utókérés-2 LIVE; kirakás-zár NYITVA for the first time; kapu.py = one-command gate)

## 2026-10-01 evening → 10-02 06:25 — five reds fixed, gate noise solved, NYITVA

- **Drawings (615552d):** 03c2 + 04a rewritten in R15-lapok-2; Mit figyeljünk full redraw = R15-lapok-3 (06a "Innen hozunk híreket — jó így?" / 06b "Innen jönnek a posztjaid hírei"); R-16 12a phone opens on name-logo choice + new 12f0 "Van már logód?"; feliratok-3/gepezet-3/kerdesek-3. Rajz-próba green, Sonnet rajz-zár 0 red. Csilla approved: 04a departure (3 lines behind "Miért nincs ma hír?"), removal of "Beállítás mentése" + tab row on 06 (auto-save stays), morning-watch OFF switch under Részletek.
- **Code round 1 (5bca884…396d600):** migration 0142 (3 rewritten + 68 new keys ×3), 03c2/04a, DELETE /api/r15/napi-figyeles, 06a/06b rebuild, R-16 phone states. Pushed 21:46, robot deployed.
- **Gate 22:07:** all five targets passed; probe 22→28. Blocked by 3 UNTOUCHED views flipping sárga→piros at pont 4 (judge wobble ±1–2 in the 4–6 band).
- **Micro round 2 (a2c5dd0, 9cd49bd):** 0143 — 12g desktop title = approved phone wording; 12d2 quiet "hol látszik" line per tab.
- **Gate 05:54:** 12g/12d2 cleared; kezdőlap/telefon 3/3 red (real: striped sample read as missing upload slot), hirek/telefon 1/3 (noise).
- **Micro round 3 (9956319, eb33a8e):** 0144 — quiet "Minta" chip on the striped sample (shared component: 03c2 + 04a), 03c2 caption "A fotódat a következő lépésben kérjük."
- **Gate rule change (1c22eeb, b738575):** `tools/tibor-biro/ismetlo.py` + `tools/tibor-proba/kapu.py`; docs/decisions/2026-10-01-zar-ismetles-szabaly.md (extended 10-02): EVERY blocking red counts only with a 2-of-3 majority on the same screenshot. kapu.py chains probe → judge → auto re-judge of blocking reds → zár. Bar unchanged: deterministic reds still block (proved by 03c2 at 05:54). Vilmos's after-the-fact OK requested.
- **Gate 06:24 (ki-1002, kapu.py):** probe 28/42 green (baseline 22); 1st pass ZÁRVA on arculat/asztali + belepes/telefon → both 1/3 on re-judge → **NYITVA**, alap.json re-baselined (--frissit). Live screenshots: ~/saas/_tibor/ki-1002/kep/.
- **Gotchas:** cloud + sandbox cannot reach saas.mediapartizan.ro (proxy 403) — gate runs on the Mac. Device delete permission resets per session; without it git leaves lock files on every commit/am — request it at session start. Local fonts fall back in agent screenshots.
- **Open / NEXT:** Vilmos — OK on the two judge-rule decisions; "costs nothing" wording for the morning news; R-16 desktop views still lead with upload (mirror phone next round). EN 03c2 phone 46 words (over 40, pre-existing). Remaining c5 designs (credit R-13, VZ-1 image editor), helyzet.ts logo sizing, c7 morning notice, c4 protect main. Tests: 19 known failures on main (not 16).

---

# HANDOFF — 2026-10-01 afternoon (R-15 shipment 2 LIVE; gate ZÁRVA on 5 stable reds; utókérés-2 decided)

## 2026-10-01 afternoon — 03b/03c/04a/04b live, gate rerun, the five reds are deterministic

- **Shipment 2 code (c5):** built by a cloud Opus agent on snapshot 27830bc, applied with git am on this clone:
  3192378 · e059551 (migration 0141: 6 updated + 20 new keys × hu/ro/en, upsert, idempotent) · 5801f7f · 06682d5 · 042778b
  + állapotlap 7062b74. Pushed 16:32, robot deployed ~2 min, 0141 ran with DB backup. Live check in Csilla's Chrome (Air):
  03b on her workspace (EN labels live → migration proven), 04a on Hírek with the real brand "Kész munka" render.
  Build report + 57 local screenshots: `~/saas/_patches/c5s2-MEASURED.md`, `c5s2-kepek.tar.gz`, patches `c5s2-000*.patch`.
- **Checks:** tipus/tokenor/keretor green (agent + independent rerun). `hatar` red with main's PRE-EXISTING 2 cycles
  (vizual/helyzet → profil → vizual/peldak) — this branch added none. Tests 582/614 pass; the 16 failures are identical to
  main's (diffed by name); the 12 new tests pass. `allapotor`: only the old F-11 orphan remains.
- **Build facts measured, not assumed (details in c5s2-MEASURED.md):** intro-post marker = `poszt_munka.forras`
  tipus `"sajat"` + azonosito `"profil:bemutatkozo"` (display branch only; the GENERATOR waits on Vilmos, kerdesek-2 q2);
  daily watch read from the active news-settings `idozites.mod` (on/off/no-row); first-gathering state keyed on `aktivFutas`;
  deep link `/kepek/uj/kesz` already existed. EN 03b is over the word budget (68/60) and the RO 04a title is 7 words —
  values are verbatim from the approved feliratok-2.json.
- **Gate 16:51 (`~/saas/_tibor/ki-1001b`):** probe **26/42 green** (baseline 22, no regression); judge 0 zöld · 22 sárga ·
  20 piros; **ZÁRVA** on 5 reds: kezdolap/telefon + hirek/asztali (ours, pont 4, Tibor presses the CORRECT primary both
  times, complaints copy-level), mit-figyeljunk/telefon (ROMLOTT, page untouched, c5 backlog), arculat/telefon +
  arculat-logok/telefon (R-16 leftovers; on logok Tibor presses "Nincs logóm" instead of the measured fő gomb — for a man
  with no logo arguably right). **Cloud re-judge on the same screenshots: all 10 verdicts identical → deterministic, not
  noise.** `--frissit` wrote nothing (zár zárva). The gate opens only when NO R-15-marked view is judge-red.
- **Decision (Csilla, chat):** utókérés round for all five → project doc `claude/DESIGN-KERES-R15-UTOKERES-2.md`
  (verbatim verdicts + proposed defaults per view; R-16 empty-state changes need her approval on the updated drawing).
- **NEXT:** (1) utókérés-2 drawings: 03c/04a text tweaks + R-16 arculat phone empty states + Mit figyeljünk full redraw
  (= shipment 3, c5 list) → rajz-próba + Sonnet rajz-zár; (2) mini code round (migration 0142+, small components) →
  deploy → full gate rerun; (3) unchanged open items: helyzet.ts logo sizing chunk, /visszajelzes done-marking (c7),
  intro-post generator + news-watch default (Vilmos, kerdesek-2). This HANDOFF commit is docs-only, push pending.

---

# HANDOFF — 2026-10-01 morning (c10 LIVE and gate-verified; Tibor judge moved to the Claude API; alap.json re-baselined)

## 2026-10-01 morning — c10 done (12g red → yellow), judge = Claude Sonnet, new gate baseline

- **c10 (12g name-logo redraw), full loop done:** drawing (6a1d542 + e4a79cf, uniform 280×120 / 84-high boxes; rajz-próba 2/2 green,
  measured in the cloud AND on the Mac) → rajz-zár: Sonnet judge red on the DRAWING (4/4 both views) — **Csilla 10-01: recorded as
  context artifacts, not design defects** (the bakery demo brand "Cipó Pékség" confuses the paver persona; "Készítsünk egyet?" judged
  without the "Nincs logóm" flow context; the original "three identical boxes" complaint was GONE from the verdict) → code (cloud Opus
  agent on a repo snapshot, applied with git am: 5432599 · ec5316c · 39935ad; vizual-core/src/nevlogo.ts is where the SVG builder
  lives, NOT apps/web/arculat/nevlogo.ts) → állapotlap fb15b19 → pushed 06:25, robot deployed ~2 min incl. kepgyar rebuild →
  **live check in Csilla's Chrome on her workspace: three distinct layouts (szó · bélyeg · tábla), uniform boxes** → gate rerun.
- **Style enum unchanged** ("nev"/"kor"/"negyzet" keep parsing — TERV R1); only what kor/negyzet DRAW changed (stamp: initial in
  main-colour circle + name below, 16+ chars wrap to two lines; band: name in second-colour band with thin main-colour frame).
  Egyszínű slot cuts letter/ring/frame/name from the black shape so white tinting stays readable. Négyzetes slot unchanged.
- **Tibor-bíráló on the Claude API** (010e99a · b20c720 · 2906a4b): ANTHROPIC_API_KEY set → Claude (default claude-sonnet-5-5),
  else Ollama unchanged. Facts measured 09-30: newer Claude models reject `temperature` with HTTP 400 (removed); 700-token cap
  truncated Sonnet's JSON ("Unterminated string") → 1500 + one re-ask on a garbled answer. Calibration on the SAME 42 screenshots
  (ki-0930b): gemma 0/9/5 on 7 pages (noisy ±2) · **Haiku 1/1/40 — unusable, "nem tudom" everywhere, garbled small text** ·
  Sonnet 0/14-17/23-25, accurate reading, stable shape. Key: ~/saas/vault/anthropic-kulcs (600, outside repo). Cost ≈ cents/run.
  The judge now runs from anywhere — Mac or cloud; the Dell is no longer needed for the gate.
- **Gate rerun 06:40 (ki-1001):** probe 22/42 green — no regression from c10; **12g red → YELLOW both views** ("my company's name
  in three styles, I pick one"). Zár closed only on the c5 R-15 backlog (kezdolap/hirek: 0 primary button; arculat pages judge-red)
  and on gemma-era ROMLOTT artifacts → **alap.json re-baselined from ki-1001 (Csilla approved 10-01)**: 42 views, proba 22 green,
  biro 17 sárga · 25 piros. After this the ratchet is honest again; the gate OPENS only when the c5 pages get their designs.
- **Known issues / follow-ups:** (1) sample post images render the stamp/framed logo tiny — helyzet.ts sizes every logo to one
  fixed height; fix = own chunk + drawing check (touches ALL images incl. uploaded logos). (2) Agent saw locally: logo box vs sample
  image used different colours on a fresh org — check live before trusting. (3) Pre-existing: light-yellow main colour → white text
  on the dark slot is hard to read. (4) Inherited: if EVERY judge call fails, tibor_biro still exits 0 ("0 piros") — same as the old
  Ollama path; a wrong key looks like a pass to automation. (5) The _snap/ and _patches/ folders under ~/saas are working files.
- **NEXT:** c5 (R-15 designs: kezdolap, hírek first — they block the gate) · helyzet.ts logo-sizing chunk (decision + drawing) ·
  mark fixed feedback items done in /visszajelzes (c7 morning notice depends on it).

---

# HANDOFF — 2026-09-30 evening (R-16 Arculat K1–K7 LIVE and verified; first full gate run from the Mac + Dell gemma; R-15f fixes; 12g redraw requested)

Ezt olvasd el elsőként egy új munkamenetben. Egy perc alatt folytatható innen a munka.
Ne derítsd fel újra, amit itt megtalálsz.

---

## 2026-09-30 evening — R-16 LIVE (K1–K7), the gate ran for real, two fixes shipped (R-15f), 12g goes back to Design

**Live and verified in Chrome (16:15–16:30):** K3/K4/K5 (12b, 12d, 12e) and K6/K7 (`/fiok` has one row "Logó, színek, betűk · Megnyitás";
old identity box retired; `/fiok/arculat/nevlogo` renders three name-logos — the robot rebuilt the kepgyar on the first `indit.sh --ha-valtozott` run).
Status page `frissitve` 13:12Z after Batch 13 (3ec8a49 + 02c222b).

**Kirakás-zár, first full run** (`tools/tibor-proba/tibor_proba.py` on Csilla's Mac in a venv `~/saas/_tibor` with Playwright; judge `tibor_biro.py`
against gemma4:31b on the Dell; `zar.py --frissit`). Facts, not docs:
- The Dell is `t2` in Csilla's tailnet, **`100.122.166.73`** — not the `100.89.253.13` in CLAUDE.md/MELYIK-GEP (that address times out from her Mac).
  Pass `OLLAMA_URL=http://100.122.166.73:11434` to the judge. The NAS is `100.85.253.57` in her tailnet.
- Run 1 (16:58/17:22): probe 20/42 green (baseline 11); judge on the 6 Arculat pages 11 yellow · 1 red (12d phone, score 3). ZÁRVA.
  Red causes: 12d phone showed two cards both named "Természetes" (current = nearest szett's name, the szett itself passed ΔE ≥ 10);
  `posztszoveg` on a fresh account was an empty page with no primary button (T2); `kezdolap`/`hirek` T2 (R-15 pages waiting on design, c5);
  `kepek-kitolto` 61 words (AI sample text one word longer — noise).
- **R-15f (e33bf92, live 15:20Z):** `szinJavaslatok` rejects a card whose name is already used (+1 probe); Posztszöveg empty state =
  "Miről posztolunk?" + one sentence + "Saját ötletből" as the single primary button (migration 0140, 2 keys × 3 languages, `design/R15/feliratok.json`).
- Run 2 (18:39/18:54, `~/saas/_tibor/ki-0930b`): probe **22/42 green**, posztszoveg green both views, 12d shows four distinct sets.
  Judge on 7 pages: 9 yellow · 5 red — 12g both views (4: "three almost identical boxes"), 12e desktop (4), 12f phone (4), 12d phone (3).
  Judge is noisy: same page 6 → 4 and 5 → 4 between runs at temperature 0 (content differs). Still ZÁRVA; `alap.json` untouched.
- **Csilla 09-30: 12g is a design fix** → `design/R16-arculat/UTOKERES-12G.md` (three layouts, not decoration), hub chunk c10, status "rajtad".
  Other judge reds recorded as opinions on the approved drawing; no action unless Csilla/Kati say the same.

**Working setup (unchanged):** Claude edits/commits in `~/saas/aitmetica-saas` on the Mac through the linked-Mac shell (Node 24 in `$HOME/n24`),
patches from the cloud copy via `git apply --index --binary --exclude=nas/public/allapot/allapot.json`; Csilla pushes; the Gigabyte robot deploys.
The Mac link drops when the laptop sleeps — then the patch goes through chat (`~/saas/_patches/NN.diff`).

**Open:** c10 (12g redraw → rajz-zár → code → gate rerun) · mark fixed items done in `/visszajelzes` (c7) · Csilla's daily news watch OFF ·
test post "From my own…" (munka 15f5bcc5) in her workspace · B3/B4/B5/B7/B8 · A4 (Vilmos) · c5 R-15 pages.

---

## 2026-09-30 day — R-16 ARCULAT BUILT (K1–K7): "Logó, színek, betűk" replaces the old identity box — MEASURED LOCALLY, NOT YET LIVE

Contract: `design/R16-arculat/TERV.md` (from the approved drawing `R16-arculat.dc.html`, 12a–12g) + `gepezet.md` 1–13 + `kerdesek.md`
(all decided; 1 = Csilla's yes: the old "Vizuális arculat — tervezet" box is absorbed). Built by cloud Opus agents on worktree branches,
merged to `main` chunk by chunk. **Everything below was measured on a local stack** (Postgres 16 + all migrations, `next start`, the
kepgyar with Playwright's Chromium 1194, Playwright 1440×900 / 390×844) — NOT on saas.mediapartizan.ro. The Tibor-bíráló (gemma on the
Dell) was unreachable from the cloud: no chunk has a `biralat.json`, so `zar.py` has not opened for any R-16 page yet.

- **K1 (08b97c3 · 4ba1afb · 4ea50e0 · c40654b):** data model — `arculat_fajl.logo_valtozat` (vilagos/sotet/egyszinu/negyzetes), `eredet`
  (feltoltes/honlap/gep), `elemzes` (0135); all new `ArculatTervezet` fields at once with a read-time transform (stored JSON never rewritten);
  the R2 stale-write guard (`409 ELAVULT_ADAT` when a whole-arculat PUT carries an older `verzio`/`jovahagyott_verzio`; snapshots immutable).
  `@km/arculat-core` (new): browser-side logo analysis (transparency, lightness, colours, ratio) + batch slot assignment. 12f
  `/fiok/arculat/logok` (4 slots, multi-upload). `meres/k1k2`.
- **K2 (c97e398 · bbd9858 · f43fb5c):** vizual-core — logo per background, tint only transparent logos, plate fallback, readable text on any
  colour; POST preview ("Így néz ki") + per-slot logo map on the web. **K1+K2 wiring (a0ef474):** images get the workspace's newest logo
  per slot with its analysis. `meres/k2`, `meres/k1k2`.
- **Pre-migration backup (ea13a4b):** `nas/adatbazis/migral.sh` pg_dumps before any NEW migration and stops if the dump fails (R1).
- **K3 (8d158c7 · 9567bac · 7becebb · 75099d4):** 12a/12b/12c at `/fiok/arculat` — view model, one-transaction save-and-approve
  (`SELECT … FOR UPDATE`), the six proven colour sets, trade→mood keyword table, default set on images when there is no draft (0136);
  Részletek (képvilág/követendő/kerülendő/lekerekítés — what the old box edited), Fájlok (manual/references/documents). 9/9 Tibor-green.
- **K4 (d151da3 · c9bbc84 · 91c9e96 · 23fc669):** 12d colour suggestions + 12d2 twelve-colour ring (0137); the onboarding background job may
  only write into an untouched arculat (`hatterTervezetBefogad`). 5/5 green.
- **K5 (42d31f7 · 0973696 · 6168dfb · 64438d1):** 12e fonts — font file types + cel↔type rule (fajl-core), fontkit accent check, own font
  upload, two fonts on images (0138). 6/6 green.
- **K6 (da63cfa · 18a455a · 1798bcb · 1a50027 · d7e46fb · c84c7ba):** 12g name logo — path-only SVG via a fontkit glyph port in the
  kepgyar (`POST /nevlogo`, latin → latin-ext → Public Sans per character), 8 files per approval (4 slots × PNG + SVG, `eredet='gep'`),
  regeneration only on machine-owned slots after colour/title-font changes (0139). The robot rebuilds the kepgyar image when its COPY
  sources change (`indit.sh --ha-valtozott`, fingerprint LABEL). 6/6 green.
- **K7 (branch o-k7, this entry):** (1) `@km/letolto` `nyersBajtok(cim, { maxBajt, engedettTipus, idokorlatMs })` — bytes with the SAME
  protection as `nyersSzoveg` (public address at start and after every manual redirect, time limit on the whole body, size cap while
  reading, only `image/png|jpeg|webp|svg+xml`, else new code `FORRAS_ROSSZ_TIPUS`); the text path is unchanged (one `lekerKovetveAltal`
  with a body reader). (2) kepgyar `POST /svg-png { adat: data:image/svg+xml…, szelesseg? }` → transparent PNG (default 1200 wide, height
  from viewBox/width/height, ≤ 2400): the SVG is drawn as `<img>` (no script) on a page in an **offline** browser context with a CSP
  (`apps/kepgyar/src/svg-png.ts`; smoke `probak/svg-png-fust.ts`, `pnpm --filter @km/kepgyar fust-svg`). (3) `apps/web/onboarding/
  honlap-logo.ts` + `onboarding/arculat.ts`: after `sajatSzinek` the draft gets `forras_cim`, `szin_jeloltek` and (if the colours came
  from the site) `szin_forras='honlap'` (`honlapTervezetbe`, pure); the found logo is downloaded → SVG rasterised by the kepgyar → type
  re-checked from the bytes (`fajlEllenoriz`, `kepreAlkalmasLogo`) → `fajlTar.ment` with `cel='logo'`, `logo_valtozat='vilagos'`,
  `eredet='honlap'`, **only when the workspace has no logo file** (R7, checked before the download and again before saving). It runs in
  parallel with the AI call, never throws, is logged (`[honlap_logo] …`), and also completes when the AI call fails. (4) **Switch-over:**
  `Fiok.tsx` — the `<details>` box (draft card + ArculatBlokk + ArculatAnyagok), `arculatValtozik` and the 800 ms whole-arculat PUT are
  gone; one quiet entry row (`r16.arculat.szakasz` + existing `fiok.arculat_megnyitas`, ghost button, left, under the title) → `/fiok/arculat`.
  `/fiok` page no longer loads the approver name or `arculat-anyagok.css`. `ArculatBlokk.tsx` stays unreferenced with a `RETIRED (R-16 K7)`
  header. 12f "Vissza" and its viewer redirect → `/fiok/arculat`. No migration. Probes: `packages/letolto/probak/letolto.proba.ts`
  (+8: binary exact, SVG, public redirect, redirect to private IP / to a name resolving private, private start without network, 2 MB
  streaming cap and exact boundary, non-image types, time limit), `apps/web/probak/letolto.proba.ts` (+1: a real local server gets 0
  requests), `apps/web/probak/r16-honlap-logo.proba.ts` (13 pure + 3 with DB/real file store). Local e2e (`meres/k7/README.md`): new
  registration with a PNG-logo site → file `png·honlap·vilagos`, colours + `forras_cim`, 12b shows the logo and "Honnan?" the site, the
  Képek image carries the logo; SVG-logo site (RO) → PNG stored; logo URL 404 → onboarding completes, no file, one log line; logo uploaded
  before approval → untouched, site logo not even downloaded. `/fiok` Tibor (local): T6 2 → 1 level, words 95→80 / 130→116 desktop, no new
  primary button; still red on its old T2 (0 primary) / T3 / T5 / T10 (undrawn page, red in `alap.json` too). Full Tibor probe local:
  20/42, all 12 arculat views green. **`alap.json` NOT refreshed** (no bíráló → zar cannot open).
- **Gates on o-k7:** `pnpm tipus` 0, `pnpm hatar` = the same 2 old cycles, `tokenor` 0, `keretor` ok, dockerfile-or ok, `terkoz --ellenoriz`
  ok, `allapotor` only the old F-11, kepgyar `tipus` ok, `next build` ok. Full web probe suite locally: 12 files / 17 tests red, all in
  areas K7 did not touch (hírfigyelő, kredit, feliratok counts, jogosultság matrix missing hírfigyelő/iránytű routes, old Kezdolap `km-kp-`,
  séma, tagok, visszajelzés export) — not compared against a `main` run.
- **Open / next:** deploy (robot; the kepgyar must be rebuilt on the Gigabyte — its fingerprint changes with `svg-png.ts`), then the live
  check on Csilla's workspace (below) and a Tibor-bíráló run on the Mac VM for all `arculat*` LAPOK + `zar.py`, then `--frissit`.
  Site logos have no `elemzes` (analysis is browser-side at upload) → treated as opaque (plate on dark ground, no white tint). The old
  `.km-fp-arculat-csukott` CSS rules stay (retired with the box). The Képek "arculat nélkül" link still points to `/fiok` (one click more).
- **Live check list (Csilla's workspace — she has an uploaded logo and approved colours):** /fiok shows only the "Logó, színek, betűk ·
  Megnyitás" row (no draft box, no Fájlok block); Megnyitás → 12c "Így készülnek a képeid" with her logo, colours and fonts; 12c Fájlok
  lists her manual/references; Részletek shows képvilág/követendő/kerülendő/lekerekítés; 12f Vissza → 12c; her `arculat_fajl` logo rows
  unchanged (the site-logo path runs only in a NEW first setup and only without a logo file); /kepek unchanged; then a fresh test
  registration with a real public site that has a PNG logo, and one with an SVG logo.

## 2026-09-30 morning — TESTER FEEDBACK ROUND 1: A-7 · A-2 · A-8 · thumbnails · translation/rewrite — LIVE, MEASURED (273d8dc · 4017e85 · c458cce · c00d12c · 37119ed)

- **Setup (Csilla leads from 09-29):** repo clone `~/saas/aitmetica-saas` on Csilla's Mac (not synced). Claude edits/commits there through the
  linked-Mac shell; **Csilla pushes** (the Mac VM shell has no route to GitHub: SSH blocked, measured). Checks run in a VM-home copy
  (`$HOME/wk`, Node 24 arm64 from npm `node-linux-arm64`): the connected folder forbids pnpm's temp renames. Heavy work: 3 Opus agents
  in the cloud on git worktrees of a repo snapshot; patches applied on the Mac with `git am -3`.
- **A-7 (273d8dc):** `ArculatAnyagok.tsx` — Visual references + Other document pickers `multiple`, files upload one after another
  (`feltoltSorban`: one busy state per target). Logo/manual stay single (B1 = decision). Live: `multiple=true` on those two inputs.
- **Thumbnails (4017e85):** all 4 `<img loading="lazy">` in ArculatAnyagok → `eager`. Measured live 09-30: the block is inside a
  `<details>` in `Fiok.tsx`, the lazy images were never requested (currentSrc "", naturalWidth 0) even in the viewport; the endpoint was
  fine (200 image/png). After deploy: all 8 imgs naturalWidth > 0, logo previews visible.
- **A-2 (c458cce):** the "freeze" was the disabled Add button's `cursor: wait` (macOS spinner) — disabled on an empty field and right after
  an add. Fix: Add always pressable, an empty click focuses the field, a no-op says why (`hf.tema_mar_van/_tul_hosszu/_tul_sok`, 0134,
  `temaMuvelet.ts`); disabled = `not-allowed`, busy = `aria-busy` + `progress` (also `_kozos/fiok.css`). Real defects on the same path:
  `hfKeres` had no timeout (now 120 s default, 30 s saves, `IDOTULLEPES`); a save during a running save was dropped (now `mentoSor`
  queue); a >120-char or 31st topic went in silently; `napiBekapcsol` saved stale state. Probe `probak/hf-tema-hozzaadas.proba.ts` (11).
  Live: duplicate → "This topic is already on the list.", text kept; cursor pointer. Side finding, NOT fixed: the draft autosave
  (`PUT /beallitas/tervezet`) only runs when validation fails, and the server validates the same schema → always 400.
- **A-8 (c458cce):** `ElsoBeallitas.tsx` — without a website and with a description < 40 chars or < 5 words: one sentence under the field, no
  AI call (`leirasTulRovid` in onboarding-core); `osszefoglalo.hu.md` v2 answers `NEM_DERUL_KI` when the source is thin → 400
  `ERVENYTELEN_ADAT` `mezok.tevekenyseg=nem_derul_ki`, the page shows what to write (`onboarding.eb_leiras_keves` / `eb_weboldal_keves`).
  Helper `onboarding.eb_leiras_megj` reworded. Probe `probak/onboarding-leiras.proba.ts` (6). **NOT measured live** (needs a new registration).
- **Translation / rewrite (c00d12c):** `poszt_forditas.hu.md` v3 = faithful translation (same sentences/paragraphs/emojis, place-name guide
  HU·RO·EN, names unchanged, profile only for terminology/address); `poszt_atiras.hu.md` v3 = audience-aware plain language, and the
  operation names now match what the buttons send (`rovidebb`, `kozvetlenebb`, … — before, the model got a bare word). New pure module
  `poszt/bemenet.ts` (+ `probak/poszt-bemenet.proba.ts`, 15). The agent also changed `app/poszt/Poszt.tsx` — that is the OLD page, nobody
  renders it (R-15 `R15Poszt.tsx` is live); harmless. R15 already calls `forditas` when switching to an empty language cell.
  Live (Csilla's workspace, gpt-5-mini): HU test post → RO: 2 paragraphs, 🧱 kept, "La Târgu Mureș", "județul Mureș", "Kovács Térkő Kft."
  and the phone unchanged, "30 septembrie", "Piața Rózsák" left untranslated (rule: only if certain), #térkő kept, #TârguMureș. "More
  direct" on a jargon RO sentence → one plain sentence. The test post "From my own…" (munka 15f5bcc5) is left in the workspace — delete/ignore.
- **Status page:** J-1i/j/k/l done. `allapotor` still red on the old "F-11 folyamatban, no step in progress" (chunk c6).
- **Migration 0134** (label upserts only) ran via the robot; NOT dry-run on the NAS first (no route from here).
- **Open from this round:** Vilmos decisions A4 (self-service reset), A9 (identity draft box), B8; the brand-kit package (A5+B1+B2) needs a
  design; the in-app feedback list has 0 items marked done (chunk c7) — mark the ones fixed today.

## 2026-09-28 reggel — POSZT-ÍRÓ v5 (9bbfff6): a bűnmegelőzés-poszt hibái

- **Vilmos hibája:** a gép-írta poszt (Vilmos gmail-es munkatere, `ba48be34-…`) felajánlást tett („Ha érdekel, készítek mintát…”),
  lezajlott eseményről jelen időben írt („zajlik”, pedig 21–25. volt), iskolavezetőknek tanácsolt, 5 bekezdés, sablonos fordulatok.
- **Ok (mérve az adatbázisból):** a hírből írt poszt bemenete az összefoglaló MELLETT a kártya `miert` mondatát is vitte
  („Készíthettek rövid, gyakorlati cikket…”) — ebből lett a felajánlás; a gép nem kapta a mai dátumot; a prompt „ügynökségi munkatárs”-nak szólította.
- **Javítás:** `poszt_szoveg` v5 (a profil gazdájának hangja — cégnél „mi”, személyes oldalnál egyes szám első személy; tilos a felajánlás/vállalás;
  idő a mai dátumhoz; FB legfeljebb 3 bekezdés; sablon-tilalom); `forrasBemenet` + `Mai dátum`; `hirbolPoszt` a `miert` helyett a hír megjelenésének napját teszi be;
  a `poszt_szoveg` hívás `gondolkodas: "low"`.
- **Mérve (a Mac VM-ből, OpenAI gpt-5-mini, ugyanazzal a profillal és hírrel):** v4 → felajánlás („készíthetünk…”, „összegzem…”);
  v5 minimal → „zajlik” / „ma kezdődött” (kitalált); **v5 low → 2/2 próbán „zajlott”, felajánlás nincs, 3 bekezdés**. Költség 0,004 USD/poszt.
- A régi posztok szövege NEM változik magától — „Új változat” gombbal íródik újra. Kirakva, a dobozban a v5 prompt ellenőrizve.

## 2026-09-27 este — R-15 · 08b ELŐNÉZET A FELÜLETEKEN + 08c KÉP A POSZTHOZ — KINT, ÉLŐBEN MÉRVE (1b9e428)

- **Honnan:** a `claude/R15-08bc-CSOMAG.md` projekt-dokumentum (tgz, base64, 199504 bájt, 48 fájl). A Mac-munkakörnyezetből ment fel:
  friss klón `/tmp/sr2` (a régi `/tmp/sr` egy másik munkamenet felhasználójáé, nem írható), kulcs `vault/github-kulcs` → `/tmp/k2/gh`.
  A `/tmp` közös gyökere nem írható — ideiglenes fájl a `/tmp/k2/`-be.
- **0133 próba a NAS-on** (BEGIN; … ROLLBACK;): `INSERT 0 102`, visszagörgetve. Figyelem: a `BEGIN` után pontosvessző kell, különben szintaktikai hiba.
- **Kirakás:** push 16:24:55 UTC → a `PUT /api/r15/poszt/x/kep` 404 → **401** 16:26:23-kor (~1,5 perc).
- **Élő mérés (Playwright, a felhőből, friss „Próba Térkő” fiókkal):** a Hírek lapon nem volt illő hír, ezért „Saját ötletből” poszt, kézzel beírt szöveggel.
  - asztal: FB / IG / LI kártya az oldalsávban helyes (IG kép nélkül: „Instagramra kép kell.” + Feltöltök egy fotót / Új képet készítek)
  - fotó-feltöltés → a kép a kártyán; „Kép nélkül” → eltűnik; „Kész képeim” választó („Melyik kép menjen hozzá?”) → „Ezt teszem hozzá” → a kép visszakerül
  - `/kepek/uj/hir?poszt=` → „Ehhez a poszthoz: …” és „A poszthoz teszem” látszik
  - telefon (390): Szöveg / Így fog kinézni fül mindhárom felületen működik, vízszintes görgetés nincs (390)
- **Tibor-próba:** 10/30 lapnézet zöld; a posztszöveg telefonon zöld, asztalon üres állapotban piros (0 fő gomb) — az üres állapot rajza a Designnál vár.
  A többi piros lap (Beállítások, Szervezet adatai, Értesítések, Mit figyeljünk) nem ennek a csomagnak a része.
- **Apróság a kódban:** az FB-kártyán a „· Nyilvános” szó be van égetve (nincs felirat-kulcs) — román/angol nyelven is magyarul jelenik meg.
- **Takarítandó:** a mérés egy „Próba Térkő” teszt-szervezetet és egy proba-tibor…@proba.example fiókot hozott létre.
- **Nyitott kérdés Vilmosnak:** kerdesek #16 (külön, rövidebb Instagram-szöveg).

## 2026-09-27 — R-15 · 2. SZÁLLÍTMÁNY KINT: 03 KEZDŐLAP · 04 HÍREK · 08 POSZTSZÖVEG A RAJZBÓL + GÉPEZET (4275b18 · 6eaab64 · fc1da7b · ez)

- **Vilmos (09-27): „indulhat a kódolás”** = a `kerdesek.md` 1. pontjára IGEN (a T5 szószám nem számolja a `sotet-sav`-ot és az
  `eredmeny`-t — `tools/tibor-proba/tibor_proba.py`), a 2–12. pontban a rajz választása érvényes. A rajz a Tibor-próbán 7/7 zöld,
  a bírálón 0 piros volt (`design/R15/meres/rajz2/`, projekt: `claude/TIBOR-RAJZ-R15-LAPOK1.md`).
- **Adat és gépezet:** `apps/web/r15/` — `tipusok.ts` (a lapok szerződése), `szamol.ts` (tiszta, próba: `probak/r15-szamol.proba.ts`,
  Qwen írta, 22 zöld), `index.ts` (`r15Kezdolap`, `r15Hirek`, `r15PosztLista`, `hirbolPoszt`, `posztokatIrHirekbol`, `keszJelol`,
  `napiFigyelesBe`, `r15HirSzam`, `r15VaroSzam`). Végpontok: `PUT /api/r15/napi-figyeles`, `POST /api/r15/hirek/{talalat}/poszt`,
  `POST /api/r15/poszt/{id}/kesz`. `PosztForras` + `rovid_nev`, `rovid_cim`, `otlet` (jsonb, nincs séma-migráció); `posztTar.mind`;
  `posztTar.letrehoz` szerzője lehet `null` (a gép írta).
- **gepezet 1:** a futtató a `futas` / `napi` / (lezárt) `ertekeles_ujra` után `posztokatIrHirekbol` — a tulajdonos szemével érdekes
  hírekhez Facebook-posztot ír az első tartalomnyelven, legfeljebb 6/kör, a munkatér kreditjéből. Prompt `poszt_szoveg` v4 (rövid név,
  rövid cím, ötlet; rövid nyitó sor). **Két állapot:** Kész = bármely cella `vegleges`; „Kész, másolom” = `veglegesit` (ettől nő a heti
  számláló is). A Hírek kártyája eltűnik, ha a posztja Kész.
- **Lapok:** `app/kezdolap/R15Kezdolap.tsx`, `app/hirfigyelo/R15Hirek.tsx`, `app/poszt/R15Poszt.tsx`, közös váz `app/_kozos/r15-lapok.css`,
  `R15Ido.ts` (`IdoSzo`, `nevelo`). A régi áttekintés: **`/hirfigyelo/osszes`** (a „Hírek beállításai” menüből; `?talalat=` és
  `?szuro=mentett`); a `/hirfigyelo?talalat=` oda irányít. A régi `Kezdolap.tsx` és `Poszt.tsx` a tárban maradt, senki nem hívja.
  Felső menü: Kezdőlap · Hírek (szám) · Posztszöveg (váró szám) · Képek · Iránytű · Szervezet adatai · Beállítások.
- **Feliratok:** `0131` (80 kulcs × 3), `0132` (`{az}` névelő a Hírek címében). A magyar „A(z)” mondatok névelő nélkül.
- **Élőben mérve (friss fiók, szekelyhon.ro-s hír):** a gép magától megírta a posztot („Járdahatás”); Hírek és Posztszöveg zöld
  mindkét nézetben; „Kész, másolom” → kész-pillanat („az első”), vágólapon a szöveg, Kezdőlap „Ma nincs dolgod”, halad 1 poszt.
- **Ügynökök:** DeepSeek A1–A3 (a három lap első vázlata, 0,013 USD — a rajzhoz kézzel újraírva), Qwen Q1 (próba, 0 USD).
- **Nyitva:** gepezet 6 (a „Kép készítése” most a Képek lapot nyitja, de nem tölti ki előre és a kép nem kerül vissza a poszthoz);
  a telefonos felső sáv a rajzon más („Díszburkolat · 1/2 ▾” a sávban) — a választó most a lap tetején; a nulla-hír állapotot a rajz
  nem mutatja („Ma nincs dolgod” áll ott); a többi lap (00–02, 05–07, 09–15) a következő szállítmányra vár.





## 2026-09-26 — R-15 2. LÉPÉS: TIBOR-ALAPELEMEK, HETI SZÁMLÁLÓ, VEGYES SÉMA, TIBOR-BÍRÁLÓ, KIRAKÁS-ZÁR (ea02c1c + ez)

- **Irány (Vilmos):** nem lapot javítgatunk, hanem MINDEN lap a Tibor-szabálylapból épül újra (Design „Onboarding” projekt,
  `claude/DESIGN-KERES-R15-TIBOR.md`); a számokat program méri, és ami romlik, nem maradhat kint.
- **Alapelemek:** `apps/web/app/_kozos/R15.tsx` + `r15.css` (KerdesCim, FoGomb, HalkGomb, HalkLink, Teendo, Info, Halad, KeszPillanat,
  Baj, Reszletek) — mind `data-r15` jelöléssel; `<html data-sema>` a layoutban. Még EGY lap sem használja: a rajzra várnak.
- **T8 számláló:** `halad_esemeny` (0130, RLS), `apps/web/halad`, `GET/POST /api/halad`; a Képek letöltése jegyez. Élőben mérve (0 → 1, hét = hétfő 00:00 Bukarest).
- **Vegyes séma:** `KESZULO_SEMAK` — NEM választható, Vilmos dönt.
- **Tibor-bíráló** (`tools/tibor-biro`): gemma4:31b a helyi Ollamán (díjmentes), Tiborként nézi az első képernyőt: mit lát, mi a dolga,
  hova nyomna (egyezik-e a fő gombbal). A Mac Linux-környezetében a hosszú háttérfolyamatot leállítja a héj → `--max 3` darabokban, folytatja.
- **Kirakás-zár** (`tools/tibor-proba/zar.py`, `ZAR.md`, racsni: `alap.json`): új R-15 lap csak zölden; semmi nem romolhat. Szintetikus romlással
  kipróbálva: zár. **Alap (09-26):** próba 11/30, bíráló 1 zöld · 10 sárga · 19 piros (`design/R15/meres/`). A robot még NEM futtatja magától;
  valódi előzárhoz második példány kell a NAS-on — Vilmos dönt.
- **Vilmos (09-26 este): Tibor a RAJZOT nézi, kódolás ELŐTT.** `tools/tibor-proba/rajz_proba.py` (a .dc.html képernyőit kiemeli és
  ugyanazzal a mérővel méri) → `tibor_biro.py` → `zar.py --rajz`. Piros rajz vissza a Designhoz; a kirakáskor csak ellenőrzés
  (`ZAR.md`). A Gigabyte-os előzár NEM kell (Vilmos). A Designnak: `design/R15/R15-KIEGESZITES-2.md` (képernyő-jelölés).
  Kipróbálva a szabálylap T2 példáján: a próba a jót zöldnek, a rosszat pirosnak mérte; a bíráló 6 / 4 pont.
- **Mérőhiba javítva:** a lebegő gomb `data-r15="lebego"` jelölése minden lapot R-15 lapnak mutatott → kizárva.
- **Nyitva:** telefonon a lebegő Visszajelzés gomb 3 helyen takar (Mit figyeljünk: „Napi figyelés bekapcsolása”; Képek: helyzet-kártya;
  Beállítások: Megjelenés). A Design szabálylapja a fiók-menübe tenné, Vilmos: „maradjon lebegő, de ne lógjon rá semmire” — a forma kérdés.

## 2026-09-25 este — J-1: A TESZTELŐI VISSZAJELZÉSEK ÉS A BEJÁRÁS HIBÁI — KINT (13ff9e8 · 9a575f4), ÉLŐBEN MÉRVE

- **Források a projektben:** `claude/VISSZAJELZES-2026-09-25.md` (17 tesztelői tétel, A/B lista), `claude/BEJARAS-2026-09-25.md`
  (Tibor-szemmel bejárt felület: M1–M13 működés, T1–T15 teendő/tájékoztatás), `claude/FELADATLAPOK-J1-BEJARAS.md`,
  `claude/DESIGN-KERES-R14-TEENDO-ES-TAJEKOZTATAS.md` (Vilmos adja át a Designnak). Új vasszabály a szabálykönyvben (3., 8. fejezet):
  **teendő ≠ tájékoztatás, első ránézésre**; és: meglévő funkciót elvenni csak Vilmos szavával.
- **A fő hiba (mérve):** az első beállításban felvett forrás `ellenorzes_alatt` maradt (csak a beállítás-lap Forrasok.tsx kérte az
  ellenőrzést), a futás pedig kihagyta → SENKI nem kapott hírt. Javítva a magban: `figyelesFuttat` a letöltés előtt ellenőrzi az
  ellenőrizetlen, nem AI-javasolt forrást. Őrpróba: `probak/forras-ellenorzes-futaskor.proba.ts` (Qwen; a javítás nélkül 2/3 bukik).
- **Forráslista (`forras-lista.ts`), a NAS-ról mérve:** 7 cím a lap saját RSS-ére javítva, vasarhely.ro → vasarhely.ma,
  transtelex.hu → .ro; kivéve e-nepujsag.ro (404), erdon.ro, agerpres.ro. `0129` a már felvett forrásokat is átírja.
- **Első beállítás (DeepSeek J-1a + Claude):** újratöltés után a hírtervezet a `GET /api/hirfigyelo/beallitas`-ból jön vissza (eddig
  elveszett → nem mentett semmit); az oldal-ajánló töltése látszik, közben a jóváhagyás nem nyomható; 0 oldalnál figyelmeztet;
  jóváhagyás után a tervezet törlődik; az AI célmondata nem mentődik rejtve (a lapon kockák vannak). `hivas()` GET-et is tud.
- **Hírek:** `attekintes` új mező `utolsoFutas`; sikertelen gyűjtésnél „nem sikerült” + teendő-sor. **Beállítás:** mentés után eltűnik
  a „Folytatom”. **Posztszöveg:** átírás közben pörgő a szövegnél, a letiltott gomb halvány; prompt v3 (nincs megjegyzés a posztról).
  **Visszajelzés gomb:** a lap alján hely, a Képek alsó sávja fölé kerül. **Szervezet adatai:** az üres állapot-keret eltűnt.
  Feliratok: `0128` + a `news-monitor-feliratok` JSON-jai.
- **Élőben mérve (20:37–20:41, új fiók, asztali + telefon):** jóváhagyás → v1 mentve, 3 oldal feldolgozva, 40 cikk; átírás-jelzés;
  telefonon a Letöltés szabad. **Nyitva:** 0 hír, mert az AI-témajavaslat a cég nevéből csinált témákat („Tibor Térkő márka…”) —
  következő javítandó (összefügg Kati B8-cal) → **J-1f kész (d1c0d37):** prompt v4 + `tema-nev-szuro.ts` őr + egy újrakérdezés; élőben
  (20:48) a témák: térkő lerakás, kertépítés, járda és útburkolat, építőanyag-árak; 40 cikkből 0 illett, mert a 3 oldal 2 napjában
  nincs ilyen cikk (NAS-ról mérve) — a szakmai forrás hiánya, nem hiba;
  **J-1g (31d50b7):** 8 szakmai hírfolyam a `forras-lista.ts`-ben (`szakma` kulcsok, szóelejére illesztve; sorrend: 2 helyi → szakmai →
  többi). Élőben: alap szűréssel (nagyon szigorú + előszűrés) így is 0 hír — a helyfeltétel kiszűri a szakmai hírt; laza + előszűrés
  nélkül az epiteszforum.hu-ról 3 illő hír jött (fiók: proba-j1g…). **Vilmos döntése (2): a szakmai oldalakra NEM kell a helyfeltétel** →
  **J-1h (84cca1c):** `szakmaiForrasCim()`; a futás és az újraszűrés a szakmai forrás cikkénél a hely-tényt igaznak veszi. Élőben
  (09-26 08:16, alap szűréssel) 2 illő hír a magyarepitok.hu-ról. A menet a Macről ment (csatolt SynologyDrive/SaaS); a poszt-AI „díjmentes felmérést” ígért (nincs a bemenetben) és magáz a hangnem-minta
  miatt — Vilmos döntése a megszólításról. Kami (rövid leírás) és Csilla (Témák hozzáadása fagy) hibája NEM jött elő.
- **A menet helye:** Windows-gép („l”), csatolt `E:\AI\SynologyDrive\SaaS`; a repó `/tmp/repo` a gép Linux-környezetében (vault-kulccsal),
  a felhőben `/root/saas` (Node 24 kézzel: `/tmp/node-v24.9.0-linux-x64`). `pnpm hatar` 2 régi körkörös függést jelez
  (vizual/helyzet ↔ profil ↔ vizual/peldak) — nem ettől a körtől.

## 2026-09-23 — VIZUÁLGYÁRTÓ MODUL: 1–3. LÉPÉS KINT (VZ-1 1fa7f29 · VZ-2 dfbb573 · VZ-3 fbb725b) — a szerkesztő a rajzra vár

- **Forrás:** Vilmos `modul-atadas.zip` csomagja → `docs/vizualgyarto/` (leírások), `packages/vizual-receptek/`
  (3 recept + `szabalyok.json`, változatlanul), próba-arculat: `tools/vizual/referencia/` (Transport Local — ADAT, semmi
  nincs beégetve). **Vilmos döntései:** `claude/VIZUALGYARTO-DONTESEK.md` (a projektben): V-1 egy vagy két nyelv;
  V-2 nincs jobbról balra; V-3 arculatot a tulajdonos ÉS a szerkesztő is jóváhagyhat; V-3b nincs második ellenőrző;
  V-4 kész poszt soha nem változik visszamenőleg; V-5 tárolás = a 09-19-i fájltárolási döntés.
- **Mag (`packages/vizual-core`):** `marka.ts` (márkaréteg: betűk, színek, méretlépcsők, stílusok, elrendezés-változat
  receptenként, `szabaly_parameterek`), `recept.ts`, `tartalom.ts`, `html.ts` (`osszeallit` — tiszta), `meres.ts`
  (`MERO_SZKRIPT` adatként; a szerep a TÉNYLEGES betűből; a túllépés a belső margóba lógást is méri), `illesztes.ts`
  (`illeszt`: lépcső → keskeny (csak táblázat, vagy ahol a mező maga a gond) → rövid változat → képaláírás →
  figyelmeztetés), `host.ts` (`Mero`), `ellenorzo*.ts` (keret + ügynöki A/B1/B2a + kézi `ellenorzo-javitas.ts`, ez nyer).
  Próbák: 14 zöld (`pnpm --filter @km/vizual-core proba`). Import `.ts` kiterjesztéssel (`allowImportingTsExtensions`),
  hogy a Node közvetlenül futtassa.
- **Eszköz:** `tools/vizual/kepgyar.ts` (`node kepgyar.ts [--rogzitett] zavar allitas adatsavok` — Playwright-core +
  `/opt/pw-browsers/chromium-1194`; `CHROMIUM=` felülírja) és `kifer-proba.ts` (10 főcím, két külön böngészőben).
- **Mérve:** rögzített főcímmel a mintát adja (Zavar 0, Állítás 0, Adatsávok 65 képpont — a kötelező `lang="hu"` miatt);
  két KÜLÖN indítású Chromium ~5%-ban eltér → **az előnézet = a gép képe**, nem élő böngészős rajz. Kiférés: 10/10
  kétszer képpontra egyezik; 8 elfér, 2 (rövid változat nélkül) figyelmeztetés. Szabályellenőrző a 3 mintán: csak a
  próba-arculat valódi sértései (monospace technikai betű, 30<36 metaadat, 42<46 táblázat, adat-főcím 44>28 betű).
  52 szabály egy képből el nem dönthető, 24-nek nincs ellenőrzője (B2b: tiltott elem/kombináció — a DeepSeek kétszer
  16k tokennél elvágott).
- **Galériák a teszten:** `/allapot/kepek/vizual/`, `/vizual2/`, `/vizual3/` (feltöltés: `nas-parancs.sh` +
  `NAS_STDIN_FILE` tgz → `public/allapot/kepek/<név>`).
- **Ügynökök:** DeepSeek ×5 (0,032 USD; mindegyik MINDEN check-fajtát megírta csonkkal — az index csoportonként választ);
  Qwen ×1 (használhatatlan próbaszöveg — kézzel írva; a Mac VM-ből `OLLAMA_URL=http://100.89.253.13:11434` kell);
  Kimi ×1 (VZ3-K ellenőrzés) — 20+ perce futott, eredmény a `.agens-ki/VZ3-K`-ban a Mac VM-en, ha megjött.
- **A menet helye:** Mac desktop-app, csatolt `SynologyDrive/SaaS`; a repó `/tmp/repo` a Mac VM-ben (klón a vault
  kulcsával, `$HOME/k/gh`); a felhőben `/root/saas` (tar a `Claude outputs/`-on át). **Buktató:** a Mac VM a
  `Claude outputs/` fájlt a commit után egy ideig a RÉGI méretben látja — mindig ÚJ fájlnevet adj, és méretre várj.
- **Nyitva:** a szerkesztő rajza — `design/DESIGN-KERES-VZ1.md` (a projektben is), Vilmos adja át a Designnak;
  B2b ellenőrzők; a képgyártó szolgáltatás a befogadóban (Chromium a NAS-on vagy külön dobozban — döntés a rajz után);
  a sorszám-számláló.

## 2026-09-22 délután (2) — R-13: FIÓKONKÉNTI HÍRSZŰRÉS + KREDIT — A GÉPEZET KINT, A KÉPERNYŐK A RAJZRA VÁRNAK (2dee6c0 · 2b38131)

- **Vilmos 12 döntése** (kattintással, egyenként): `claude/KREDIT-ES-EGYENI-SZURES.md` (a projektben). Röviden: a hírszűrés
  EGYÉNENKÉNT (3 fokozat: nagyon szigorú = hely + fő téma · közepes = fő téma · laza = fő vagy érdemben érintett téma;
  előszűrés be/ki); a gép EGYSZER olvas, a kredit megoszlik; a kiszűrt hírekből SOHA csak a szám; pénz helyett KREDIT,
  minden mai művelet 1 kredit; a munkatér havonta kap (most a rendszergazda adja, alap 1000), a tulajdonos osztja,
  aki nem kapott külön összeget, egyenlő részt kap; ha egy tagé elfogy, csak neki áll le.
- **Rajzkérés:** `design/DESIGN-KERES-R13.md` (négy lap: Saját fiók „Hírek szűrése” + „Kreditjeid”; Tagok kredit-oszlop;
  rendszergazdai munkatér-kredit; Kezdőlap kredit-sor + elfogyott állapot). Vilmos adja át a Designnak. **A képernyőt
  csak a rajz után építjük** — addig a Kezdőlapon a régi „AI-keret: … € maradt” sor áll.
- **Mag (news-monitor-core):** `tag-szures.ts` (`eloAtmegy`, `fokozatSzerint`, `nezoSzerint`, `kinekKell`, `szuroKulcs`),
  `elo-tenyek.ts`; az előszűrő tagonként (`eloszur(k, beallitas, kivonatok, tagok, lejart)`: szólista-tények nev/hely/tema,
  cím fo/erinti/nem; a gép azt olvassa el, ami LEGALÁBB EGY kredites tagnak átmegy). A tárolt értékelés a
  LEGENGEDÉKENYEBB fokozaté + tények (`rola_szol`, `fo_tema`, `erintett_tema`, `hely_ok` — a helyfeltétel a kódban,
  `elo`); a néző szerinti fontosság OLVASÁSKOR (`nezoSzerint` — soha nem mentjük vissza). `SZURO_VERZIO` 12.
  `Kornyezet.tagok` (kredites tagok beállítása), `.nezo`, `.kreditTerhel` (háttérben: előszűrés → bekapcsolt előszűrésű
  tagok; olvasás → akiknek átment; „ugyanaz?” → minden kredites tag). `tagok` = [] → nincs kredit → a gép nem olvas,
  a találatok `keret_kimerult`-ek.
- **Promptok:** `hf_relevancia` v12 (Kimi írta, Claude javította: tények előbb, laza fontosság, `erintett_tema`);
  `hf_cim_szures` v2 (`megtart` + `erinti`).
- **Web:** `0119` (`hf_tag_szures`; `hf_osszkep` szűrő-kulcsonként, PK szervezet+kulcs), `0120` (`szervezet.kredit_havi`,
  `tagsag.kredit_havi`, `kredit_mozgas` ezredben, `kredit_havi_allit`/`kredit_osszes` SECURITY DEFINER).
  `apps/web/kredit/{szabaly.ts (DeepSeek, 24 próba), index.ts}`; `apps/web/hirfigyelo/tag-szures.ts`;
  `kornyezet(szervezetId, nyelv, nezoFiokId?, { fizeto? })` — API-kérésnél a KÉRŐ kreditjéből (`aiHivo(..., fizeto)`,
  `keretEllenoriz(szervezetId, fiokId)`, `meresRogzit(..., fiokId)`); poszt, Iránytű-javaslat, első beállítás is a kérőé.
  Kimerült kredit egyelőre `AI_KERET_KIMERULT` (429) — a saját szövege a rajzzal jön.
- **Végpontok:** `GET/PUT /api/hirfigyelo/sajat-szures` · `GET /api/kredit/sajat` · `GET /api/kredit/tagok` (tulajdonos) ·
  `PUT /api/kredit/tagok/{fiok}` · `PUT /api/kredit/munkater/{szervezet}` (rg) · `GET /api/kredit/munkaterek` (rg).
  Élő próbák: `apps/web/probak/kredit.proba.ts` (Qwen írta, Claude javította) — NEM futott (élő próbakörnyezet kell).
- **Élőben mérve (próbafiók):** saját szűrés GET/PUT/400 rendben; kredit 1000/0 → Iránytű-javaslat után 999 (bontás:
  iránytű 1); a saját keret 0-ra állítva az Iránytű-javaslat 429, visszaállítva megy; a Hírek lap változatlan.
  **Gmail-es munkatér újraszűrve v12-vel:** 8 AI-kérés (szólista 1, címek 1, olvasás 6) = 8 kredit a 91 hírre; a
  nagyon szigorú szemmel 3 érdekes (UMFST-workshopok; bűnmegelőzési hét; „Oktatás hivatással”), közepessel 5.
- **Ügynökök:** DeepSeek (kredit-szabályok, 0,0014 USD), Kimi (prompt v12, 0,0256 USD), Qwen (élő próbák, 0 USD).
- **ROBOT ÁLL:** a 10:05 és a 11:10 UTC-s push után a Gigabyte robotja nem rakott ki — kézzel: `GIGABYTE_KULCS=/tmp/gf
  GIGABYTE_GAZDA=gigabyte@100.113.109.91 REPO=/tmp/repo bash nas/kirak.sh` (epit) → `--kepek` (KEPEK=/tmp/k/…) →
  `--betolt` → `--indit` (a migrációkkal). **Migrációs próba:** `{ echo "BEGIN;"; cat …sql; echo "ROLLBACK;"; }` —
  a `BEGIN` után pontosvessző KELL.
- **Nyitva:** a rajz (R-13); a beállítás változásakor a korábban senkinek el nem olvasott hírek nem olvasódnak újra
  (csak a következő gyűjtéstől); az `allapotor` „gazdátlan szakasz: F-11” hibát jelez (régi, nem ettől).

## 2026-09-22 délután — HÍREK: ELŐSZŰRŐ (v11) — SZÓLISTA + CÍMEK; A NEM TÉMÁBA VÁGÓT A GÉP EL SEM OLVASSA (adb9add)

- **Vilmos:** „miért nézünk meg 93 hírt? … azt akarom, hogy ne is nézzen olyan cikket, ami nem a témába vagy iránytűbe
  vág”. Döntése a két felkínált útból: **mindkettő** (szólista ÉS címek).
- **Működés** (`packages/news-monitor-core/src/eloszuro.ts`, a teljes olvasás ELŐTT, a futásban és az újraszűrésben is):
  1) `hf_szolista` — gyűjtésenként EGY kérés: a hely minden alakja (HU/RO/DE, megye), témánként és az Iránytű céljaihoz /
  tolni-tételeihez HU+RO szavak/szótövek, a figyelt nevek. A PROGRAM keres velük, AI nélkül (`szolistaDont`: név mindig
  átenged; különben hely ÉS téma kell; ékezet nélkül, szó eleji egyezés, ≤3 betűs szó csak egészként).
  2) `hf_cim_szures` — a megmaradt címek egy kérésben (50-es adagok), sorszámmal.
  Ami kiesik: kész/háttér, `kiszurve: "szolista" | "cim"`, NINCS rá `hf_relevancia` és „ugyanaz?” kérdés.
  Ha egy lépés nem sikerül (hiba/kivétel), a lépés kimarad — nem dob el mindent. `SZURO_VERZIO` 11.
  Promptok: `hf_szolista.hu.md`, `hf_cim_szures.hu.md` (nem nyelvfüggők; `HivasKeres.nyelvSzabad` — a „válasz nyelve”
  záradék elmarad, mert a szólista két nyelvű). Mindkettő `reasoning_effort: "low"`.
- **Mérve a gmail-es munkatér 91 hírén (10:14–10:17 UTC):** szólista → 76 kiesett, 15 maradt; címek → 7 kiesett, 8
  maradt; teljes olvasás 8 hírre → **3 érdekes** (UMFST-workshopok; bűnmegelőzési hét Maros megyei iskolákban; Maros
  megyei szívgyógyászati kutatóközpont — „tudomány”). 10 AI-kérés 91 helyett, 0,044 USD (előtte ~0,31).
- **Próbafiókon:** 4 hír, mind a szólistán esett ki; az Áttekintésen „4 hír nem illett hozzád — ezeket kiszűrtük.”
- **ROBOT:** az adb9add pusht (10:05 UTC) a robot NEM vette fel (a Gigabyte állt, a NAS forrás-mappája a régi maradt) →
  kézzel: `epit saas` → `kuld saas` → NAS `kepek.tgz` → `docker load` → `kirak.sh --indit` (10:13 UTC).
- **Mellékjavítás:** `apps/proba-host` mintacikkei relatív dátummal (a 48 órás szűrő miatt bukott a próba).
- **Költség, Vilmos kérdésére:** hírenként a teljes olvasás ~0,34 cent; az alap havi AI-keret munkaterenként 5 USD —
  napi gyűjtéssel előszűrő nélkül ~6 USD/hó lett volna; az előszűrővel ennek töredéke.

## 2026-09-22 délelőtt — HÍREK: NAGYON SZIGORÚ, SZEMÉLYRE SZABOTT SZŰRŐ (dc5f146 · d543be7 · a2c165d)

- **Vilmos:** „a szűrő egy kalap szar” — a gmail-es munkatér (`9ecd5f30-…`) 91 híréből szinte semminek nem kellett volna
  átjönnie. **Négy döntése:** (1) a kiszűrt hír NE is jelenjen meg, csak a száma („{n} hír nem illett hozzád — ezeket
  kiszűrtük.”, `0118`); (2) a személyre szabás forrása CSAK az Iránytű (jóváhagyott célok, tolni, kerülendő témák →
  `profil.iranytu`, `apps/web/hirfigyelo/iranytu-szuro.ts`); (3) a témák közti helynév (Marosvásárhely) CSAK FELTÉTEL;
  (4) „nagyon szigorú” — kétségnél háttér.
- **Működés:** háttér = kiszűrt (`kiszurt()` a news-monitor-core-ban). Az Áttekintés, a Pontosítás, a Kezdőlap számai
  és az összkép nem mutatják / nem számolják. `SZURO_VERZIO` (most **10**): ha nő, a régebbi értékelések maguktól
  újraszűrődnek — az `ertekelesUjra` a kész, de elavult értékeléseket is viszi (legfrissebb elöl, legfeljebb 150), a sor
  15 perces korlátja előtt megáll és újra sorba teszi magát; futás/napi után `ujraszuresSorba`; az összkép ilyenkor törlődik.
- **Mérve, ugyanazon a 91 hírön, három lépésben:**
  v8 (csak a prompt szigorú) → 4 maradt, ebből 2 országos (munkajogi szabály, szenátusi egyenruha-törvény);
  v9 (+ ellenőrző mezők `rola_szol`, `fo_tema`, `helyszin` és a kód zára: `relevanciaSzigorit`) → 7 maradt, ebből 2 országos,
  amire a modell „egyezik”-et mondott;
  v10 (+ `hely_feltetel`, `hatokor`, és szó szerinti `hely_idezet`, amit a kód a cikkben keres: `idezetACikkben`; a
  hf_relevancia `reasoning_effort: "low"` — `HivasKeres.gondolkodas`, keret 5000, 60 mp) → **2 maradt**, mindkettő
  marosvásárhelyi + oktatás (UMFST-hallgatók workshopjai; bűnmegelőzési hét Maros megyei iskolákban).
- **Minimális gondolkodással a gpt-5-mini a több feltételes szabályt nem tartja be** — ezért kell a „low” és a kód zára.
  Ára: ~11 mp és ~0,0034 USD / cikk (előtte ~4 mp, 0,002). Egy 60 cikkes futás ~11 perc; ami a futás határidején túl
  marad, a futás utáni újraszűrés viszi.
- **Határeset, ami kiesett:** „Maros: kisebbségi nyelvismeret … iskolaigazgatók” (a modell maga tette háttérbe, megyei +
  oktatás). Ha Vilmos ilyet hiányol, a szigorból lehet engedni (prompt, nem a kód zára).
- **Élőben ellenőrizve (próbafiók, „Próba Pékség ihhgvb”):** hírfigyelés beállítva (vasarhely.ma; témák Marosvásárhely /
  oktatás / iskola / pékség) → futás: 4 cikk, mind kiszűrve → az Áttekintésen „4 hír nem illett hozzád — ezeket
  kiszűrtük.”, kártya nincs; a Kezdőlap „0 új hír”; a Pontosítás lista üres.
- **Mellékjavítás:** `apps/referencia-host` letöltő-mintájának dátumai relatívak (a 48 órás szűrő miatt bukott a próba).

## 2026-09-22 reggel — HÍREK: „NAPOK ÓTA NEM VÁLTOZNAK” — A MUNKATÉR KÉZI INDÍTÁSRA ÁLL (37e302d)

- **Mérve (adatbázis, olvasva):** Vilmos gmail-es „aitmetica” munkaterében (`9ecd5f30-…`) a hírfigyelés `idozites.mod = "kezi"`,
  egyetlen futás volt (09-13 14:25). A napi ütemező működik (más munkaterek `napi` sorai minden reggel 07:00-kor kész).
  → Nem hiba: be kell kapcsolni a napi figyelést (Kezdőlap „Napi figyelés bekapcsolása”), vagy „Futtatás most”.
  Figyelem: KÉT „aitmetica” munkatér van (a yahoo-s `316c9948-…` más).
- **Vilmos döntése (09-22):** a napi gyűjtés alapból KÉZI marad, az új felhasználóknál is; a munkatereket nem kapcsoljuk át
  helyettük. A fontos munkatér a gmail-es (sima felhasználói fiók) — abban ő kapcsolja be.
- **A „még készül” hír:** egy értékelés 09-13 óta `fuggoben`; újrapróbálás soha nem került a sorba. A gépezet mérve jó
  (próbafiókon `ertekeles-ujra` 202 → kész). Most: ha az újrapróbálás sem hoz összefoglalót, a lap megmondja (`0117`).
- **AI-keretek emelve** (`hirfigyelo/ai.ts`): relevancia 3000, összkép 3000 (09-14/15-én háromszor `AI_ROSSZ_VALASZ`),
  javaslat 2500, szabály-javaslat 3000, tartalomötlet 1500. A `hf.*` feliratfájlok a `szinkron.py`-val frissítve.

## 2026-09-21 délután (2) — IRÁNYTŰ: A JÓVÁHAGYÁS NEM BUKIK EL A HOSSZÚ AI-SZÖVEGEN (866bac3)

- **Vilmos hibája:** a Jóváhagyás gomb „nem csinált semmit”. Mérve az nginx naplóból: `PUT /api/iranytu` és
  `POST /api/iranytu/jovahagyas` → 400. Az AI 60 karakternél hosszabb „Mikorra” szöveget írt, a hibaüzenet pedig
  csak a TÁROLT tervezet sávjában jelent volna meg (a még nem tárolt javaslatnál sehol).
- **Javítás:** `@km/contracts` `IRANYTU_HATAR` (mikorra 200, mirol_tudod 600, miert 1200, vizio 2000 …); az AI-javaslat
  a határra vágva érkezik (`apps/web/iranytu/vag.ts`); prompt v2 (a „mikorra” rövid időjelölés); a lapon `maxLength`,
  és a mentés/jóváhagyás hibája a gombsor alatt, a mezőt megnevezve (`0116`). Próba: `probak/iranytu-hatar.proba.ts`.
- **Élőben:** próbafiókon célokra kért AI-javaslat → Jóváhagyás → 200, három cél jóváhagyva.
- **Vilmos piszkozata nem mentődött el** (a böngészőben volt) — neki újra kell kérnie a javaslatot.

## 2026-09-21 délután — SÉMÁK: A DESIGN KÉRDÉSEIRE VÁLASZ, VILMOS HÁROM DÖNTÉSE KINT; IRÁNYTŰ-JAVASLAT JAVÍTVA (c763fb2 · 7b7bee4 · 67576f2)

- **Design-válasz:** `design/SEMA-MAGYARAZAT.md` (a `KERDES-sema-gepezet.md` hat kérdésére, élő méréssel) +
  `design/semak/semak.css` = a három séma teljes `:root`-ja (169 token), a KÓDBÓL generálva:
  `npx tsx tools/semak/semak-css.mts > design/semak/semak.css` — minden séma-érték-változás után újra kell generálni.
- **Séma = 25 alaptoken** (`SEMA_KULCSOK`), a többi a közös alapból; alap 73 + származtatott 99 → 169 a `:root`-ban.
- **Döntések (Vilmos):** D1 sémaváltáskor a saját fő szín és betűméret marad (`semaraValt`); D2 az Éjkék fényudvar nélkül
  (`tema-alap.json` + `0115`); D3 a nyilvános lapok mindig a közös alapot mutatják (`app/_kozos/KozosTema.tsx` — a lap
  fejének munkatér-témáját egy második `<style>` írja felül; ÚJ NYILVÁNOS LAPBA IS BE KELL TENNI). D4 (kontraszt-értékek) a Designé.
- **Javítva:** mentéskor a séma neve megmarad (`semaFelismer`, a fő szín párja nem számít); az előnézet sémaváltás után frissül
  (`useEffect` a kezdő tokenekre); a betűméret a `--fs-title`/`--fs-h1`-et is állítja (×1,0625 / ×2,125); az előnézetből kikerült
  a régi v6 első-lépés blokk és a lépésszámláló.
- **Iránytű-javaslat (Vilmos hibája):** „Az AI most nem válaszol” — mérve: `AI_ROSSZ_VALASZ … finish_reason: length`, 900 tokenes
  keret a bővebb profil mellett kevés. Most `mind` 4000 / blokk 2000, időkorlát 55 mp (nginx 60); a poszt hívásai 2500, az összhang
  1500. Élőben: 200, 10 mp, teljes javaslat.
- **ROBOT-BUKTATÓ (mérve):** két push 2 percen belül → a robot az ELSŐ commitból fordított képet rakta ki, de a NAS forrás-mappájába
  már a MÁSODIK commit került, és a robot „naprakésznek” hitte magát — a 2. commit kódja nem ment ki. Kézzel pótolva:
  Gigabyte `epit saas` → `kuld saas` → NAS `kepek.tgz` → `docker load` → `kirak.sh --indit`. **Szabály: két push között várd meg,
  hogy az első kint legyen** (a lefordított kódban ellenőrizhető, pl. `grep -o "maxKiToken:[^,]*"` a `.next/server/chunks`-ban).

## 2026-09-21 dél — HANGNEM 3000 KARAKTER; A POSZTSZÖVEG MEGKAPJA A PROFILT (1bce8b9 · c9ac5da)

- **Vilmos döntése:** a „Hogyan fogalmazzunk?" leírása 3000 karakterig (volt 300 — oka nem volt, a mező
  eredetileg 2–4 jelzőre készült). `@km/contracts` `HANGNEM_LEIRAS_MAX = 3000`, minden hangnem-séma és a
  hírfigyelő javaslat-végpontja ezt használja; a lap felirata „Hogyan írjunk — szabályok, példák" (`0114`).
- **Hiba, amit közben találtunk:** a Posztszöveg AI-hívásai a cég profilját EGYÁLTALÁN nem kapták meg
  (a prompt hivatkozott rá, a bemenet nem vitte). Javítva: `apps/web/poszt/profil-blokk.ts` (`profilSorok`,
  tiszta függvény, próba: `probak/poszt-profil.proba.ts`) — írás, átírás, fordítás, nyelvre szabás mind
  megkapja. Promptok v2: a „HOGYAN ÍRJUNK" szabályai kötelezők (erősebbek a felület-szabályoknál, kivéve a
  karakterhatárt és a tényeket). A fordítás/nyelvre szabás promptjában a `{{nyelv}}` a FELÜLET nyelve volt
  (hibás cél nyelv) → `{{tartalomnyelv}}`.
- **Élőben mérve (próbafiók):** 1146 karakteres hangnem ment, újratöltés után megvan; a posztjavaslat a
  hangnem kötelező nyitómondatával kezdődött, egy emoji a végén, zárómeghívás — 5 mp, OpenAI.
- **A Posztszöveg és az Iránytű lapon a felső sáv a `<main>` belsejében volt** (összenyomva) → kívül, mint
  a többi lapon.
- A Szervezet adatai lapon a mentett szöveg megtartja a beírt bekezdéseket (`.km-fp-ertek` `white-space: pre-line`).

## 2026-09-21 délelőtt — FIÓK-MENTÉSI HIBA JAVÍTVA; R-12 (kezdőlap + felső sáv) KÉSZ ÉS KINT (1395797 · 13c23d7 · 4481e59 · 7d8ab7c)

- **Hiba (Vilmos):** a Szervezet adatai lapon a „Milyen nyelven írjunk?" és a „Hogyan fogalmazzunk?"
  szerkesztése nem mentett. Ok: a szabad szöveges nyelvmezőből üres lista lett, a 300 karakternél
  hosszabb hangnemet a szerver elutasította, a minta mondat nem volt szerkeszthető. Javítva: nyelv-kockák
  (`_kozos/kockak.css`, közös az első beállítással), a hangnem két mező (leírás 300 · minta 1500)
  számlálóval és hibasorral; `ProfilModositas.nyelvek` min(1), új `hangnem_minta`. Próba:
  `probak/profil-hangnem-nyelv.proba.ts`. Élőben mérve: a mentés újratöltés után is megmarad.
- **R-12 (Design zip: `ELLENORZES-kezdolap.md` A1–A12, B1–B4 + `rajz/R12-kezdolap.dc.html`):**
  kezdőlap = lapcím + egy fő gomb („Hírek megnyitása") · Hírek csempe (szám, utolsó gyűjtés, AI-összkép,
  hírsorok semleges jelvénnyel) · legfeljebb két teendő-sor másodlagos gombbal · egy üzemállapot-sor.
  A csomag-blokk lekerült. `--grad-primary` korall nélkül. Felső sáv: navigáció keret nélkül, jobbra
  „Értesítések" + a név menüje (nyelv, szerep, Visszajelzés, Kijelentkezés). A lebegő Visszajelzés-gomb
  megszűnt: `visszajelzes-react` új `lebego={false}` + `inditoEsemeny` propja, a menü a `km-vj-indit`
  eseménnyel indítja a jelölő módot. Feliratok: `0111`, `0112`, `0113` (`kozos.kilepes` → Kijelentkezés).
- **Tokenőr:** `font-weight: normal/inherit` nem mehet; normál betűhöz `font-weight: 400; /* tokenőr: ok — … */`.
- **Nyitva, Vilmosé:** a kapcsolati e-mail-cím a nyitólapra és az Adatkezelés lapra (rajtad-lista).

## 2026-09-19 este — F-8.2 SZÖVEGTISZTÍTÁS KÉSZ; a teszt AI-ja OpenAI-n (a821736 · feff543)

- **A teszten az AI-szolgáltató `openai`** (Vilmos döntése 2026-09-19). A NAS `.env`-jében
  `AI_SZOLGALTATO=claude-elofizetes` → `openai`, app-újraindítás; a mentés `.env.mentes-2026-09-19`.
  **Ez gépállapot, nem kód — új NAS-doboznál újra be kell állítani.** Az első beállítás ettől azonnal válaszol.
- **Az OpenAI JSON-ba csomagolta a folyó szöveget** (`{"summary":"…"}`), és a nyers JSON kikerült a
  felületre. Javítva: `apps/web/ai/szoveg.ts` (`szovegRobusztusan`) bontja ki kódjelölésből és egymezős
  JSON-ból; az `osszefoglalo.hu.md` prompt is kimondja. Nyolc gépi próba (`probak/ai-szoveg.proba.ts`).
- **F-8.2 kész:** 54 felirat három nyelven (`0105`), plusz a Költség lap feladatnevei (`0106`).
  „token" → beállítás · „hívás" → AI-kérés · „AI-gépidő" → az AI munkaideje · „webes horog" → a megadott
  cím · „onboarding" → első beállítás · „szerver" → a rendszer · Pilot → Próbaidőszak · Nem releváns →
  Nem érdekel · Próbafuttatás → Próba indítása · Desktop → Számítógép · Hover → Egérrel fölé mutatva.
- **Így ment:** a szöveget **Kimi (k2.6)** írta öt részletben (0,05 USD), Claude vette át és javította
  (négy kulcs elvetve, három átírva). **Tanulság az ágensekhez: a gép Linux-munkakörnyezetében egy
  parancs legfeljebb ~180 másodpercig él, és a háttérbe tett folyamat is meghal vele** — ezért a nagy
  feladatlapot 20-25 kulcsos részletekre kell bontani (egy részlet ~40 mp, 0,01 USD).
- **Migrációt próbálni a teszt adatbázisán:** `{ echo BEGIN; cat 01xx.sql; echo ROLLBACK; } > /tmp/p.sql`
  majd `NAS_STDIN_FILE=/tmp/p.sql NAS_SUDO=1 nas/nas-parancs.sh 'docker exec -i aitmetica-saas-db bash -lc "psql -v ON_ERROR_STOP=1 -U \$POSTGRES_USER -d \$POSTGRES_DB"'`.
  Így a hibás SQL nem a kirakáson bukik el.

## 2026-09-19 délután — R-11 KÉSZ ÉS KINT: Posztszöveg + A cég iránytűje (8b5fb67)

- **Két lap él a teszten.** `/poszt` (Posztszöveg) és `/iranytu` (A cég iránytűje). Élőben mérve: a Posztszöveg
  megírta a facebookos szöveget (482 karakter), a jelzés helyesen „nem futott" volt, mert a próbacégnek nincs iránytűje.
- **A kötés, ami mindent visz:** a cég iránytűje NEM forrás, hanem SZŰRŐ. A szöveg a kiváltóból születik
  (hír · terv · belső infó · saját gondolat), az iránytű csak megméri. A jelzés FIGYELMEZTETÉS, nem zár:
  pirossal is lehet véglegesíteni, és a piros ténye a munkán marad (`piros_veglegesites`).
- **Adat:** `poszt_munka` tábla (RLS, `0098`), szerződések a `@km/contracts`-ban (`PosztMunka`, `PosztSzoveg`,
  `OsszhangAllapot`, `PosztMunkaLista`). Egy munka = egy gondolat; azon belül cellák: felület × nyelv.
- **Gépezet:** `apps/web/poszt/{index.ts,tar.ts}` — `munkatLetrehoz`, `szovegetKeszit`, `szovegetMent`,
  `szovegetAtir`, `forditastKeszit`, `nyelvreSzab`, `osszhangotVizsgal`, `veglegesit`, `veglegesitestVisszavon`.
  Öt új prompt (`apps/web/prompts/poszt_*.hu.md`), öt új `FeladatTipus`. A tiltott szavakat KÓD nézi szó szerint,
  az AI csak a jelentést vizsgálja.
- **Végpontok:** `/api/poszt` (GET lista, POST új munka), `/api/poszt/[id]` (GET, PUT mentés) és a cellaműveletek
  (`szoveg`, `atiras`, `forditas`, `nyelvre-szabas`, `veglegesites` POST+DELETE, `osszhang`). Mind a közös kapun át,
  a közös darabok az `app/api/poszt/_kozos.ts`-ben.
- **Lap:** `app/poszt/` — bal oldali blokkválasztó (munka · felület · nyelv, mindegyik az állapotával), középen a
  szerkesztő, jobbra a jelzés. **Vilmos szabálya 2026-09-19: nincs több hosszú, görgetős lap** — az iránytű lapja is
  eszerint készült.
- **A Hírek lapon a „Tartalomgyárba" jelölt gomb helyén valódi gomb áll:** a hírből munkát nyit a Posztszöveg lapon,
  és oda is visz (`?munka=…`). Ugyanabból a hírből ugyanaz a munka nyílik meg (A-8).
- **Feliratok:** `0099` (poszt.* · osszhang.*), `0100` (iranytu.inkabb_magam), `0101` (a három felület neve),
  `0102` (a Hírek gombja). **Tanulság: egy már lefutott migrációs fájlt hiába írsz át — a futtató név szerint
  hagyja ki. Új felirat = új fájl.**
- **A felső sávban a termék neve 1600 px alatt elmarad** — hat menüpont mellett nem fért el, és két sorba tört.
- **Hátra van:** az eredetjelölés (melyik mondatot írta át az ember — A-4), a piros jelzés helye egy listában (A-6),
  a hűséges előnézet és a posztolás. A gépi próbák a poszt-gépezetre még nincsenek megírva.
- **Élő ellenőrzés fiókja:** `proba-<véletlen>@proba.example` — ezeket a `takaritas()` magától elviszi.

## 2026-09-19 reggel — V1–V5 KINT ÉS ÉLŐBEN ELLENŐRIZVE (5cd29b7); F-11a KÉSZ

- **A kirakás magától megy:** a Gigabyte robotja a `main`-re tett push után ~1 perc alatt épít és kirak (mérve: push 05:11:46 → új doboz 05:12:31 UTC), a migrációkkal együtt. Kézi `nas/kirak.sh` csak akkor kell, ha a robot áll. A Gigabyte-kulcs ehhez nem kell.
- **Élőben mérve Vilmos belépésével (08:15):** nyelv-süti nélkül a lap ÉS a fülcím a munkatér nyelvén (hu); Hírek: 2 érdekes kártya + „+10 háttérhír — megnézem" sor; témák: „a, b; c" → 3 chip, Enter is hozzáad; a módosítás 800 ms után VALÓDI mentés (v2, v3 keletkezett; „Mentve · 08:15"), nincs „nem mentett" címke; a Hírek felugróján a Visszajelzés gomb jelölő módot nyit, a felugró nyitva marad, a buborék az ablakon belül, a Küldés látszik.
- **Az élő ellenőrzés három hibát talált, javítva ugyanabban a körben:** az automatikus mentés csak a tervezetet mentette → a valódi mentés (`mentesRef`); a Visszajelzés modul a fejléc rétegében (z-index 50) a felugró (55) ALATT volt → portál a `<body>`-ra (`_kozos/Visszajelzes.tsx`); a fülcím angol maradt → `oldalcim.ts` is a `hatasosNyelv`-et nézi. Plusz: a V4 duplázott „korlátok" sora lekerült (a régi sor már ott volt, WEBP-pel), 0092 a WEBP-et a hibaszövegbe teszi.
- **Csomag:** a 09-19 05:00-s futás rendben: „nincs mit összesíteni (2026-09-18)". A 09-16-i húsz visszajelzésről sosem készült csomag — Vilmos dönt, kell-e kézzel.
- **Tanulság:** a NAS naplói 5 MB × 3 fájlra forognak; a robot minden kirakásnál új dobozt csinál, a régi napló elvész — méréshez a `FAJL_MAPPA/visszajelzes/` fájl-kimenet és az adatbázis a forrás, nem a docker-napló.
- **Hátra:** a 4 élő próba futtatása a teszten; R-11 (3 kérdés Vilmosnál); 3–4. sáv.

## 2026-09-18 — V1–V5: A TESZTELŐI VISSZAJELZÉSEK JAVÍTÁSA — A MAIN-EN (816ad60), KIRAKÁS ELŐTT

**Ha itt folytatod:** a döntések `claude/VISSZAJELZES-2026-09-16.md` (a projektben, a 9 döntés táblázata). Feladatlapok: `tools/agens/feladatok/V{1,2,3,3b,4,5,5b}-*.md` (a `be/V/` mappában is). Ügynökök: DeepSeek ×7 (V3 és V5 elvágva 14k tokennél → V3b/V5b szűk lappal), 0,03 USD. A rajz nélküli sáv ez; a Kezdőlap és a Hírek egy lapja (R-11) a Claude Design vásznon áll, három kérdéssel Vilmosnak.
- **Mi változott:** V1 `apps/web/nyelv/munkater.ts` (`hatasosNyelv`: a fiók választása, különben a munkatér első tartalomnyelve) — belépés, `szervezet/valt`, `layout.tsx`. V2 `Beallitas.tsx`: a javasolt témák egyből a listában („javaslat" címke, `javasoltNevek`), `temakBont` a `_kozos/kliens.tsx`-ben (vessző/pontosvessző/Enter), mentés ≤800 ms, nincs `beforeunload`, a próba magától indul a mentés után, `probaHiba: string|null` + `hf.proba_hiba.*` (0089). V3 `Attekintes.tsx`: háttérhír csak a „+N háttérhír — megnézem" sor mögött; `kartyakEpit` VÁLTOZATLAN alakú, az új `kartyakEpitReszletes` adja a `kihagyott_fooldal`-t (az `attekintes` eredményében is); `forras.ts`: gyökér-cím hírfolyam nélkül = `hibas`/`nincs_hirfolyam` (0090). V4 `ArculatAnyagok.tsx`: `HALOZAT`/`BELSO_HIBA`/`URES` ágak, `arculat_fajl.korlatok` a mező alatt, `BELSO_HIBA` magától a Visszajelzés modulba (a `VisszajelzesBekuldes` sémával, `[rendszer]` előtaggal); `nas/nginx.conf` `client_max_body_size 12m` (0091). V5 `visszajelzes-react`: `poziciotBefog` (ablakon belül, balra vált), `data-vj-jelol` a body-n → a `HirFelugro` jelölő módban nem zár; `napiCsomagKeszit` a `hirfigyeloSzolgaltato()`-val; a futtató 10 perc múlva EGYSZER újrapróbál; `apps/web/visszajelzes/export.ts` → `FAJL_MAPPA/visszajelzes/{lista.md,lista.json,csomag-<nap>.md}`.
- **Kézzel javítva az ügynökök után (tanulság a lapokra):** a DeepSeek a V2-ben más CSERE-formát írt (`## CSERE n` + `RÉGI:`/`ÚJ:` kódblokk) — a `reszlet-alkalmaz.py` nem érti, egy 10 soros python alkalmazta; a `kartyakEpit` visszatérő alakját megváltoztatta (10 régi próba bukott) → kompatibilis bővítés; `„.jpg"` idézőjel a TS-ben; `tegnapKulcs` a `try` belsejében; `../hirfigyelo/ai` helyett `../ai`; `lista({})` → `lista({ szervezetId: null })`; a rendszer-visszajelzés kitalált mezőkkel ment → a valódi séma; `km-af-korlatok` CSS hiányzott; `margin: … 0 0` a tokenőrön bukott.
- **Ellenőrzés a felhőben (zöld):** tokenőr, keretőr, határőr, térköz, Dockerfile-őr, `pnpm tipus`, `apps/web` építés; egységpróbák: visszajelzes-react 3/3 (új `probak/` + vitest a csomagban), news-monitor-core 250/250. **NEM futott:** a 4 élő próba (`nyelv-munkater`, `hf-temak`, `arculat-fajl-hibak`, `visszajelzes-export`) és a `sema.proba.ts` — a teszten kell.
- **Mérés még hátra:** a NAS naplójából — Szente jpg/PDF feltöltése miért bukott (app napló), és a 09-17-i reggeli csomag miért nem készült (a feltételezés: az általános AI-szolgáltató 25 mp-es időtúllépése; a kód már a hírfigyelő AI-ját hívja).
- **A menet ezen a gépen (Windows, „l"):** a VM `$HOME` ($/sessions) tele, ezért a kulcsok `/tmp/k/`, a repó `/tmp/repo` (a hívások közt megmarad). GitHub, Gigabyte 22, NAS 22, Dell 11434, DeepSeek — mind elérhető. **Buktató:** a Synology Drive on-demand fájlja (`vault/gigabyte-forditas-kulcs`, 0 blokk a lemezen) a VM-ből I/O-hibát ad → a `vault` mappa „Mindig maradjon ezen az eszközön". A kirakás lépései változatlanok (R-10 szakasz lent).
- **Állapotlap:** F-11 szakasz (R-10 kész, F-11a folyamatban), kitéve a NAS-ra.


## 2026-09-18 — R-10: HÁROM SZÍNSÉMA EGY KATTINTÁSRA (Éjkék · Világos · Sötét) — KINT A TESZTEN, ÉLŐBEN MÉRVE (8f62524)

**Ha itt folytatod:** a döntés és a terv `claude/R10-SEMAK.md` (a projektben) / `docs/R10-SEMAK.md`; a rajz a Claude Design vászon „R-10 Hírek — három színváltozat" (A/B/C 1440 + telefon, D = a sémaválasztó sor; a `.dc.html`-ek a `design/r10/` alatt is). Feladatlapok: `tools/agens/feladatok/R10-{S1,S1b,S2,P}-*.md`. Ügynökök: DeepSeek ×3 (S1 elvágott 16k tokennél → S1b szűk kerettel), Qwen ×1 (a próba) — összesen 0,015 USD.
- **A munka helye: a Mac-hez kötött desktop-app menet, a `SynologyDrive/SaaS` mappa csatolásával — MINDEN innen megy, MÉRVE:** a Mac Linux-munkakörnyezetéből GitHub (vault/github-kulcs), a Gigabyte fordító (vault/gigabyte-forditas-kulcs: allapot/epit/naplo/kuld), a NAS (`nas-parancs.sh`), a Dell Ollama, a DeepSeek API mind elérhető. `nas/kirak.sh` pont erre íródott: `GIGABYTE_KULCS=$HOME/k/gf GIGABYTE_GAZDA=gigabyte@100.113.109.91 REPO=$HOME/repo bash nas/kirak.sh` → `--allapot` → `--kepek` → `--betolt` → `--indit`. **Buktató:** a csatolt mappából a `jelszo-kerdes.py` nem futtatható (Permission denied) — a repó `$HOME/repo` klónjából kell futtatni (`chmod +x nas/*.py nas/*.sh`); a kulcsokat `$HOME/k/` alá kell másolni `chmod 600`-zal. **Nincs pnpm és ~0,9 GB hely a VM-ben:** a típus/határőr/tokenőr/keretőr/próbák a felhős dobozban futnak (tar a `Claude outputs/`-ba → stage → `/root/saas`; nvm Node 24 — a 3b. recept). A Gigabyte-os távvezérelt menet NEM kötelező; Vilmos nem akar oda ülni, és nem akar böngészőzni.
- **Sémák adatként:** `packages/design-system/src/semak.ts` — `SEMAK`, `semaKeres`, `SemaKod` (ejkek · vilagos · sotet), `SEMA_KULCSOK` (25 token); az Éjkék értékei a `tema-alap.json`-ból olvasva. `szarmaztat()`: ha `--aurora-opacity` = 0, a `--glow-*` értéke `none`. `--orb-size` alsó határa 44 px (szabály), a sémák ezt kapják — a forgó korong marad, ragyogás nélkül.
- **Gépezet:** migráció **0088** (`tema.sema_kod`, `szervezet_tema.sema_kod` + 7 kulcs × 3 nyelv `tema.sema.*`); `tar.ts` `szervezetTervezetMent/kozosTervezetMent(…, semaKod)`, az állapotokban `sema_kod`; `tema/index.ts` `szervezetSemaValt`, `kozosSemaValt` (tervezet a séma tokenjeiből → alkalmaz → gyorsítótár ürítése); `PUT /api/tema/sema {kod}` (tulajdonos) és `PUT /api/tema/kozos/sema` (rendszergazda); új hibakód `ISMERETLEN_SEMA` (400).
- **Felület:** `apps/web/app/tema/SemaValaszto.tsx` + `sema-valaszto.css` (a D rajz: három csempe kis előnézettel a séma saját értékeiből, az aktívon „Ezt használjátok", a többin „Erre váltok"; az aktív a válaszból frissül); a `TemaEgyszeru` (tulajdonos) és a `Tema` (rendszergazda; `key={szint}`, kozos a közös szinten) tetején.
- **Élőben mérve a teszten (Vilmos rendszergazda-fiókjával, a beépített böngészőben):** Világos → a Hírek lap világos; Sötét → a Kezdőlap meleg sötét, fényudvar nélkül; vissza Éjkékre. A két végpont kívülről 401 (van). A tábla-oszlopok és a 21 felirat a NAS adatbázisában (olvasva).
- **Próbák:** `packages/design-system/probak/semak.proba.ts` (4, zöld a felhőben); `apps/web/probak/sema.proba.ts` (8 eset, Qwen írta) — **NEM futott** (élő próbához km_tulaj URL + próbakörnyezet kell; a 3b. recept 4. pontja).
- **Nyitva:** a 20 visszajelzés megoldáslistája (`claude/VISSZAJELZES-2026-09-16.md`) Vilmos „mehet" szavára; a reggeli javítócsomag 09-17-én nem készült el — mérendő; a csomag-készítő fájlba is írja a listát (Vilmos szavára); a haladó Megjelenés lap „Live preview" panelje a séma váltása után is a régi tervezet színeit mutatja (a tervezet-állapot, nem hiba, de zavaró).
- **Tanulságok:** a DeepSeek 16k kimeneti tokennél elvág — a „RÉSZLET legfeljebb 6 CSERE" keret az S1b-ben 10 mp alatt jó eredményt adott; a `packages/design-system` vitest csak a `probak/` mappát futtatja — a `src/` alá tett próba némán kimarad; a `--orb-size` szabálya 44–120 px, 0 nem adható; a rendszergazda a `/tema`-n a haladó lapot kapja, nem az egyszerűt — ami a tulajdonos egyszerű lapjára kerül, azt oda is be kell tenni.

## 2026-09-16 délelőtt — F-10 (R-9 menet): KÖZÖS KERET + KERETŐR, HÍREK KÉT HASÁBBAN, R-8 KINÉZET, VISSZAJELZÉS MODUL — mind kint a teszten (45ed240 + fejléc-javítás)

**Ha itt folytatod:** Vilmos 2026-09-16-i döntéseinek egy menete („megbeszéljük, terv, végignyomás"). A rajz: „R-9 Hírek és Visszajelzés" (Claude-vászon, `/home/claude/r9/gen9.py` — a felhőben), az R-8 rajz beépítése a `claude/R8-ATADO.md` szerint. Az állapotlap `F-10` szakasza (a–f). Az ügynök-feladatlapok: `tools/agens/feladatok/{F9-K1,F10-M1,F10-M1b,F10-W1,F10-W1b,F10-B1,R8T,R8K,R8F,R8O,V1,V1b,V2,V3}-epito.md` (a mellékletek a `feladatok/F10/` és `feladatok/R8/` alatt, az R-8/R-9 rajzlapok `.dc.html`-ként is ott). 14 DeepSeek-menet, összesen 0,08 USD.
- **Közös keret (F-10a):** MINDEN belépett lap `<main className="km-lap-keret …">` (1180 középen, azonos margók; `alap.css`). **Keretőr:** `tools/hatar/keretor.mjs` (`pnpm keretor`, az `ellenoriz` része): a `<main>`-en és a körülötte lévő elemeken álló `km-…` osztályok NEM adhatnak `max-width/width/margin/padding`-ot; a Hírek felső sávjának tartalma `km-lap-keret-sav`-ban. MÉRVE 1440-en: mind a 13 lap x=130, w=1180. A Megjelenés lap külső burka lett a `<main>`; az onboarding egyoszlopos rácsa is a keretben.
- **Hírek (F-10b):** `HirKartya.tsx` (két hasáb, `.km-hf-at-kartyak` grid; a kártyán elöl a `miert` = „mit tehettek vele" mondat, a cím a beállított nyelven `cim_forditott`, alatta halványan az eredeti; 8 kártya + „Mutasd a következő 8-at"), `HirFelugro.tsx` (felugró, `calc(var(--lista-max) - var(--ter-9) - var(--ter-7))` = 1146; jobbra „Mit adhat ez neked": A cégednek · A vevőidnek · Egy tartalom, amit ma megírhattok), „Tartalomgyárba" gomb kikapcsolva „később működik" jelöléssel (Vilmos döntése). **A mag:** `Ertekeles.cim_forditott/cegednek/vevoidnek` (opcionális; jsonb, nincs migráció), `RelevanciaValasz` ugyanezek, `Kartya` is; `hf_relevancia` v7 (a „miert" új jelentése; háttérnél „Háttérhír; most nem kell tennetek semmit."); `hf_osszkep` v4 (legfeljebb két mondat); az `ertekelesUjra` a `cim_forditott` nélküli kész értékeléseket is újraértékeli; **a futás nyelve a profil ELSŐ tartalomnyelve** (`tetelNyelve` a futtatóban — MÉRVE: a kérés nyelvéből „en" jött), `Kornyezet.nyelv` (azonos nyelvű cikk címe = a cím). A teszt-szervezethez felvettem a `zi-de-zi.ro` RSS-t (román forrás a fordítás látványához).
- **Figyelés beállítása (F-10c):** `.km-hf-be-racs` 2/3 + 1/3; jobb oszlop: Javaslat a profilodból (a meglévő javaslat-gépezet), Mi történik a témákkal, Korlátok (HF_NAPI_CIKK, HF_CIKK_MAX_KOR_ORA).
- **R-8 kinézet (F-10d):** tokenek (`tema-alap.json` + `0081`: `--primary #5b6cff`, `--primary-2 #9a6bff`, `--accent-warm`, `--accent-gold`, `--aurora-opacity`, `--orb-size`, Sora/Manrope; `szarmaztat()`: `--grad-primary` három pont, `--glow-*` ÁRNYÉK-érték (a régi szín `--glow-primary-color`), `--aurora-1/2/3`, `--surface`, `--border`, `--motion-rise`; `alap.css`: `body::before` fényudvar, `.km-orb`, `.km-emelkedik`, `.km-grad`); Kezdőlap újraírva (`Kezdolap.tsx` + css: összkép · Elkészült · Teendő · Csomagod · Üzemállapot; első használat egy kártya; Folyamatban sáv a `varjSor` haladásából; néző); Szervezet adatai (kérdések emberi nyelven `mezo.*`, arculat összecsukva, nincs hiányjelzés, `0084`); fejléc ≤1100: márkanév nélkül, kezdőbetűs lenyíló; **Első beállítás** (`app/onboarding/ElsoBeallitas.tsx`: egy lap → „az AI dolgozik" a valódi lépésekből → átnéző lap → jóváhagyás + `PUT beallitas` + források + `POST futas` → Kezdőlap Folyamatban; a régi `/onboarding/1|2|3|kesz` átirányít; `beallitas/javaslat` végpont `profil_tervezet`-ből is dolgozik; `0085`). **A teszten az onboarding AI-ja (AI_SZOLGALTATO=claude-elofizetes, az ai-híd) 25 mp után AI_NEM_ELERHETO-t ad — a lap ezt kezeli (üres sorok, Szerkesztés), de a bemutatkozás/javaslat nem készül el; a hírfigyelő OpenAI-n megy.**
- **Visszajelzés modul (F-10e):** `packages/visszajelzes-core` (típusok, `csomagBemenet`, `csomagOsszeall`, 4 próba), `packages/visszajelzes-react` (`VisszajelzesModul`: gomb → jelölő mód (capture-fázisú figyelők, a lap gombjai nem indítanak) → buborék → `html-to-image` kép → `kuldes`; README a beillesztéshez), `apps/web/visszajelzes/index.ts` (bekuld, lista, allapotValt, napiCsomagKeszit, csomagok, csomagTetelAllapot), táblák `visszajelzes` + `javito_csomag` (`0083`, nincs RLS — **a `szervezet` táblát `leftJoin`-nal, mert a host-szintű `db()` az RLS miatt nem látja**), végpontok `/api/visszajelzes[…]`, prompt `apps/web/prompts/javitocsomag.hu.md` (`FeladatTipus` + `javitocsomag`), napi csomag 05:00 (Europe/Bucharest) a futtató óránkénti blokkjában; lapok `/visszajelzes` (lista, állapot: új · elfogadva · kész, kép felugróban) és `/visszajelzes/csomag` (napi csomag, Elfogadom/Később/Nem javítjuk; „Készítsd el most" a rendszergazdának); a link a munkatér lenyílójában (a fő menü négy elem marad). A `Dockerfile` függőség-rétegébe a két csomag felkerült (enélkül `Module not found: zod/html-to-image`).
- **Eltérések a rajztól (nem építettem, mert nincs mögötte gépezet):** a hír részleteinél az „Ötlet mentése" gomb (A-11 mentett ötletek nincs — az ötlet a találaton magától megmarad); a Kezdőlap Teendő „mentett ötlet" sora; a Figyelés beállítása „Ajánlott oldalak" doboza és az első beállítás „Mely oldalakat figyeljük" javaslata (G-4 forrás-ajánló nincs — a sor üres lista + beviteli mező). A Pontosítás tételes javaslata (R-8 11., AI-4) és a Hírek futás közbeni sávja (R-8 8.) NEM készült el ebben a menetben (F-10f).
- **Tanulságok:** a `kirak.sh --allapot` a RÉGI naplót mutatja, amíg az új fordítás el nem indul — indítás után várj, amíg a napló ideje frissül; a DeepSeek 8000/16000 token felett vág — a nagy feladatot bontsd, a folytatás egy „b" lap; a mellékletek ÚTJA legyen abszolút (a `nohup … &` alhéjban a cwd más).
- **Teszt-adatok TÖRÖLVE (Vilmos kérése, 2026-09-16 10:50):** a teszt-adatbázisból minden gépi teszt fiók (103, a @proba.hu / @proba.example / @aitmetica.local / @teszt-*.example címek) és minden olyan szervezet, ahol nem ember a tag (82) — előtte NAS-mentés (nas/mentes.sh, 10:46). Maradt 5 emberi fiók (Vilmos kettő, Szente, Viography, Transport Local) és 5 szervezet. **A vezeto-proba-a@proba.hu próbafiók és a Próba Pékség is törlődött** — az élő méréshez (Playwright a felhőből) ÚJ teszt-szervezet kell, és azt utána törölni. Nyitott (rajtad): a rendszergazdai fiókból nem lehet fiókot törölni — megbeszélendő.


## 2026-09-15 délután — F-9: A MÁSODIK AUDIT JAVÍTÁSA A GIGABYTE-RÓL, A FLOTTÁVAL (DeepSeek · Kimi · Qwen) — 13 tétel kint a teszten, F-9 45%

**Ha itt folytatod:** a terv `claude/JAVITASI-TERV-2026-09-15.md` és a feladatlapok `tools/agens/feladatok/F9-*.md` (a Claude projektben is: `claude/FELADATLAPOK-F9.md`). Az állapotlap `F-9` szakasza sorolja a lépéseket; a TEENDOK T-44 az A-1 mérése.
- **A munka helye: a Gigabyte (Tailscale + SSH, `ssh gigabyte`, a felhős munkamenet `claude-felho` kulcsával).** A gazdagépen nincs node/pnpm — az ellenőrzések docker dobozban futnak: **`~/bin/saas-pnpm.sh <pnpm parancs>`** (a repóban: `tools/gigabyte-pnpm.sh`; a node_modules a repóban, a pnpm tár `~/.saas-pnpm-tar`; `pnpm install --frozen-lockfile` egyszer, utána `hatar`/`tokenor`/`tipus`/`--filter ./packages/… proba` 3–5 mp). Az állapotlap írása a dobozból: `saas-pnpm.sh allapot … --nem-tesz-ki`, majd a gazdagépen `bash nas/allapot-kirak.sh`.
- **Kirakás a Gigabyte-ról:** `bash nas/kirak.sh` (mérés + fordítás a háttérben, ~3 perc) → `--allapot` (KESZ:0) → **`--kepek` → `--betolt` → `--indit`** (mind kell; az `--indit` egyedül csak újraindít és migrál). Az app doboz 20 mp alatt kész.
- **Az ügynökök:** `tools/agens/agens.py` a Gigabyte-on; a Qwenhez **`export OLLAMA_URL=http://100.89.253.13:11434`** (a Dell), különben a gazdagép üres Ollamáját találja (404). A nagy fájlokhoz a feladatlap **RÉSZLET-fájlt** kér (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE` blokkok), amit **`python3 tools/agens/reszlet-alkalmaz.py <_RESZLET.md> <célfájl>`** alkalmaz (csak egyedi találatnál ír). DeepSeek 35–40 mp / menet, 0,005 USD; Kimi 6–8 perc; Qwen 20 mp.
- **A hf.* feliratok adatfájlja** (`packages/news-monitor-feliratok/feliratok/hf.*.json`) 73 kulccsal lemaradt a migrációk mögött (0064 óta) — **`python3 tools/feliratok/szinkron.py`** húzza utána a migrációkból (az utolsó érték nyer); minden felirat-migráció után futtatandó, a szinkron-próba erre épül.
- **Kész és kint (0069–0077 migrációk):** A-1 (szelídítés + keretek + promptok; T-44), A-2 (`hf_osszkep` tárolva futásonként; a Hírek lap nem vár), A-4, A-6, A-7 (48 óra: `cikkFrissesseg`), A-8 (`csomag.forras_max`, `FORRAS_KORLAT`), A-9 (Radar · Studio · Newsroom · Agency; `pilot` → `radar`, `ALAP_CSOMAG_KOD = "radar"`), A-10 (`/hirfigyelo?talalat=<id>`), L-1, L-4, L-5 (`nyilvanosCim`), Sz-1 (két menet: pótlás + lektor), Sz-5 (belépéskor nyelv-süti a fiók nyelvére).
- **Kézzel igazítva az ügynökök kimenetén (mind a commitban leírva):** a „Megnézem a mostanit” gomb csak aktív beállításnál; egy `useEffect` a `megtekint` mögé (TS2448); a `HitCard` nem kért átnevezése vissza; egy JSX-attribútum-komment; a `folyamat.proba.ts` rögzített cikkei a próba órájához képest kapnak dátumot (48 órás szűrő); a `pilot` a séma-alapértékben és két próbában `radar`.
- **Nyitva:** A-3 (futás-számláló — folyamatban), A-11 (mentett ötletek, az R-8-hoz), AI-1…AI-4 (promptok, a `hf-prompt-proba.py`-vel), G-4 (forrás-ajánló), majd az R-8 beépítése (`claude/R8-ATADO.md`). **Vilmosé:** az Adatkezelés három válasza (a helyükön „Ezt a részt még írjuk…”), a 2.5 döntés („még nem működik” dobozok), az R-8 hét kérdése.
- **Nem futott ma:** az `apps/web` élő próbái (`pnpm -r proba` a km_tulaj URL-lel) — ezekhez futó rendszer kell (a régi `/tmp/nasproba` a felhőben elveszett); a mag, a feliratok és a promptok próbái zöldek, a típus/határ/tokenőr/térköz zöld.


## 2026-09-13 éjjel, zárás — F-8 az audit javítása: MINDEN ÉPÍTÉS KÉSZ ÉS KINT A TESZTEN; ami marad, Vilmosé és a Designé

**Ha itt folytatod:** az audit válasza (a ChatGPT-nek szóló felülvizsgálati csomag): `docs/AUDIT-2026-09-13-VALASZ.md` — Vilmos adja át. A mérések: `docs/MERES.md` 15–16. (promptok), `docs/meres/`. Képek: `/allapot/kepek/f81/`, `r7a/`, `r7b/`, `r7c/`, `r7d/`.
- **F-8.3 kész**: relevancia-prompt v5 + tartalomötlet v4 (`packages/news-monitor-promptok/promptok/`), a `prompt()` replaceAll; a mérőeszközök: `tools/agens/hf-prompt-proba.py` (a csomagból olvas, `--prompt-mappa`, kiírja a szövegeket) és **`tools/meres/hf-elo-meres.py`** (élő mérés egy futó rendszeren: fiók → profil → beállítás → próbafutás → kártyák + ötlet → markdown). Élő eredmény a teszten: 10 kártya, 0 fontos · 6 érdekes · 3 háttér, a szövegek közérthetőek.
- **F-8.5**: a csomag kész (VALASZ.md); a valódi kezdővel végzett újrateszt Vilmosé (rajtad-lista).
- **Nyitott (nem építés):** T-38 (mag 0.4: nyelv + fordított cím — a 3.5 A-hoz), T-40 (ai.* csoportnév), T-41 (a Design három kérdése), T-42 (lektor a rajzon nem szereplő szövegekre), T-43 (a 2. lépés előnézete), a 3.6 adatai (kapcsolat, árazás, tájékoztató — a nyitólap és a jelszó-hivatkozás ezekre vár).
- **Ma összesen:** 33 ügynökmenet (DeepSeek 22 · Kimi 8 · Qwen 3), ~0,9 USD; 20 commit; 7 migráció (0061–0068, a 0066 366 sorral); az állapotlap F-8 szakasza 90%.

## 2026-09-13 éjjel — AZ R-7 MIND AZ ÖT LAPJA A KÓDBAN, R-7c + R-7d KIRAKÁS ALATT (0874a8c); az audit szerkezeti javításai kész

**Ha itt folytatod:** a képek `/allapot/kepek/r7b/`, `r7a/`, (r7c, r7d a kirakás után); az ELLENORZES 7. pontja (E8–E15) mondja, mi tért el a rajztól és miért. Ami az F-8-ból hátra van: **F-8.3** (AI-szövegek: prompt v3, `hf-prompt-proba.py` + élő mérés), **F-8.5** (újrateszt valódi kezdővel + a ChatGPT-nek szóló felülvizsgálati csomag), a Design három kérdése (K-R7b-6 célok, K-R7c-4 szerepváltó sor, K-R7c-6 logó), T-38 (mag 0.4: nyelv + fordított cím — a 3.5 A ezen áll), a 3.6 adatai Vilmostól (kapcsolat, árazás mondata, tájékoztató), T-40 (`ai.*` csoportnév).
- **R-7c** (10 ügynökmenet): Gépház → Beállítások sorlista (0066); Értesítések lista külön a kapcsolóktól, Adatkezelés három kérdésben (a jelölt dobozok maradnak — 3.3 B); Kapcsolat más rendszerekkel üres állapottal; **Megjelenés egyszerű nézet** (`tema/TemaEgyszeru.tsx`, a haladó lap `?halado=1`, a rendszergazdáé a régi); Felület szövegei nyelvfülekkel; Saját fiók három rész; Csapattagok szövegei; Szervezet adatai három szakasz (a weboldal nem része a profilnak — sor nincs).
- **R-7d**: nyitólap újra (`Nyitolap.tsx` + `nyitolap.css` egészben: nincs fotó, fényfolt, üveg), példa-kártya kulcsból (0068), gyakori kérdések; Adatkezelés lap a közös fejléccel (`adatkezeles/Adatkezeles.tsx`).
- **Mérés:** 120 élő próba zöld (12 fájl), egy őrpróba igazítva indokkal (E12); tokenőr 18 hibát fogott az ügynök-CSS-ben (csupasz 0 térköz, kör) — javítva. Ágensköltség az R-7-re összesen ~0,7 USD (24 menet).
- **Tanulság:** a Bash-eszköz elhasal a `≤` jelen a parancsban (unexpected EOF) — a feladatlapokat python-fájlból írjuk (`scratchpad/r7c-kartyak.py` minta); a `kep.mjs`-nek a főoldal az üres `''` lapnév (a `nyitolap` név 404).

## 2026-09-13 késő este — R-7 ÉPÜL: R-7e (skála) és R-7b (kezdőlap + hírek) KINT A TESZTEN (képek: /allapot/kepek/r7b/), R-7a (első beállítás) a tárhelyen, kirakás folyik; Vilmos hét döntése (D-F43)

**Ha itt folytatod:** a rajz `design/r7-audit-javitas/atado/`, az ellenőrzés `design/r7-audit-javitas/ELLENORZES.md` (1. tábla: mi nem épül; 7. pont: amit építés közben találtunk), döntések D-F42…D-F44.
Sorrend: R-7e ✔ → R-7b ✔ → R-7a ✔ (kód; 128 élő próba zöld) → **R-7c** (beállítások-szint) → R-7d (nyitólap). A feladatlapok `tools/agens/feladatok/R7*.md` — a következő lapoknak ugyanez a minta (rajz HTML + ATADO melléklet, a kulcsok a lap `feliratok.json`-jából generált migrációval: `0064` a minta, a duplikált kulcs-nyelv párokat ki kell szedni).
- **D-F43 (Vilmos):** mind az öt lap mehet; 3.1 A (Kezdőlap · Hírek · Szervezet adatai · Beállítások · Megjelenés · Felület szövegei · Adatkezelés · Találatok pontosítása), 3.2 A (Mentés és vissza), **3.3 B** (a „még nem működik" dobozok MARADNAK — az R-7c rajz A-ját ott nem építjük), 3.4 A (jelszó-hivatkozás a rendszergazdához; a kapcsolat-cím nélkül rejtve), 3.5 A (magyar cím — mag 0.4, T-38), 3.6 Vilmos adja az adatokat (még nem jött).
- **R-7e** (3783ee4, zöld): arányos skála (16/15/14/12,5), 46 px vezérlők 10 stíluslapon, semleges AI/saját eredet, `--urlap-max`/`--lista-max`, 0063; a `--primary-2` származtatása az R-7c-re maradt (E5).
- **R-7b** (a commit a fenti): felső sáv Hírek közvetlen pont + új nevek; kezdőlap 3 állapot (`elso_cimek` gépezet a `kezdolap/index.ts`-ben); hírek üres/rövid kártya/„További helyi hírek"/panel; beállítás egy oszlop + forrás-műveletek (0.3.0) + gombsor sorrend; pontosítás helyi próba + újrapróbálás; 0064. **D-F44:** a célok, a szabad szöveg és a „Mikor?" rádió a rajzon nincs → rejtve, az adat marad, a napi figyelést a gomb kapcsolja.
- **Tanulságok:** az ügynök-kimenet CRLF (`sed -i 's/
$//'`); Kimi 24k tokennél 4/5 fájlt adott (fiok.css külön menet); a képernyőképet NE a próbákkal egyszerre (a `takaritas()` viszi a próbafiókot); a `pnpm terkoz` minden CSS-változás után; a próbák `km_tulaj` URL-lel.
- **R-7a** (0065): regisztráció/belépés mezőnkénti hibával + jelszó mutatása + adatkezelési sor + `/jelszo-elfelejtve` (a hivatkozás a `kozos.kapcsolat` adat nélkül rejtve); onboarding kompakt fejléc, „Mentés és vissza" (nem jelentkeztet ki), 1. lépés két mező, 2. lépés négy sor + állapotsáv, 3. lépés egy összefoglaló arculat nélkül (jóváhagyás előtt az arculat `kesobb`), Kész lap → hírforrások. A 2. lépés előnézete a mai (a rajz 05 nem szól róla — K-R7a).
- **Nyitva:** a teszt-képek az R-7a-ról (galéria `/allapot/kepek/r7a/`); K-R7b-6, K-R7c-4, K-R7c-6 a Designnak; T-38 (mag 0.4: `nyelv`, `cim_forditott`); a 3.6 adatai Vilmostól; F-8.3 (promptok) az R-7 után.

## 2026-09-13 este — F-8.1 (az audit mért hibái) a TESZTEN: a három P0-ból kettő javítva és élőben mérve, a harmadik Vilmos adata; R-7 Design-kérés kiment

**Ha itt folytatod:** a terv `docs/AUDIT-2026-09-13-TERV.md`; a rajzkérés `design/DESIGN-KERES-R7.md` (Vilmos adja át a Designnak, a csomag a `SynologyDrive/SaaS/be/R7-audit-javitas.zip`-be jön);
az F-8.1 tételei a terv 5. pontjában; a helyi próbakörnyezet receptje a `b5e589ef…/scratchpad/f2-lanc.sh` mintájára (PG_BIN, PROBA_ENV ott; a próbák a **km_tulaj** URL-lel futnak — km_app alatt az RLS miatt 4 fájl bukik, ez nem hiba).
- **Élőben mérve a teszten (a NAS LAN-címén át):** `/beallitasok/nyit/<id>` átirányítása `https://saas.mediapartizan.ro/...` (volt: `0.0.0.0:3000`) — T-30 kész. A részletpanel a sáv fölé (T-31) — kép még nincs róla.
- **A kódban kész, kint a teszten (8cc5d1b):** nyelvcímke ki (D-F41), „N új" a kártyákból számolt (elrejtés = megtekintés), AI-kiesés számmal (`hf.stAiPendN`, 0062), Költség lap a munkatér pénznemében
  (`SajatNezet.penznem/arfolyam_egy_usd`), a kezdőlap forrás-hibája a források mai állapotából, Feliratok lap 26 csoportnév + `feliratok.apply/apply_kozos` (0061), semleges mintakártya,
  **news-monitor-core 0.3.0**: `forrasTorol` port + `forrasCimModosit`/`forrasTorol` (`src/forras-muvelet.ts`), mindkét befogadó tárja, `PUT/DELETE /api/hirfigyelo/forrasok/[id]` — a gomb az R-7b után.
- **Flotta:** DeepSeek ×4 (Attekintes, Költség, mag, végpontok), Qwen ×1 (migráció) — 0,017 USD, egy javítás kellett (Penznem import — a feladatlapom hibája). Az ügynök kimenete CRLF-fel jön: `sed -i 's/
$//'`.
  A python `open(...,'w')` a Windowson CRLF-et ír — `newline='
'` kell, különben teljes-fájl diff (a HANDOFF így került be egyszer, javítva).
- **Nyitva az F-8.1-ből:** j) a teszten mérendő lista képekkel (mobil fülsor, 2. lépés, tartalomötlet); a 25–33 px-es mezők listája (R-7e-hez). **Vilmosra vár:** a terv 3.1–3.6 döntései és a nyitólap adatai (rajtad-lista).
- **Következik:** F-8.2 szövegtisztítás (Kimi lektor, egy migráció) — a 3.1 szótár-döntés nélkül a menünevek kimaradnak; F-8.3 prompt v3 az F-8.1 után; R-7 beépítése a csomag érkezésekor.

## 2026-09-13 délután — AZ AUDIT (ChatGPT) FELDOLGOZVA: F-8 szakasz, javítási terv a flottával — Vilmos hat döntésére vár

**Ha itt folytatod:** `docs/AUDIT-2026-09-13-TERV.md` a terv (a lényeg a 0. pontban), `docs/AUDIT-2026-09-13.md` maga az audit (változatlanul). D-F40 a döntés, T-30…T-37 a mért hibák.
- **Mérve** a kódon (Explore-ügynök + kézi, 15:10–16:30): az audit 15 kódon mérhető állításából 13 igaz, 2 részben, 0 téves. A három P0 valódi: az értesítés-megnyitás a doboz belső címére
  (`0.0.0.0:3000`) irányít (`beallitasok/nyit/[id]/route.ts`, öt `new URL(cél, _keres.url)`); a részletpanel (`z-index 40`) a sáv (`50`) mögé kerül; a nyitólap három helyőrzője
  (`0038_nyitolap.sql`) — az utóbbi Vilmos adata, a rajtad-listán 09-12 óta. A teljes tábla a terv 1. pontja, `file:sor` bizonyítékkal.
- **A terv útjai:** F-8.1 mért hibák rajz nélkül (11 tétel, ~6 óra, DeepSeek/Qwen/Claude, öt párhuzamos sáv) · F-8.2 szövegtisztítás rajz nélkül (Kimi lektor + Qwen egyezés-ellenőrzés, egy migráció)
  · F-8.3 AI-szövegminőség (prompt v3, `hf-prompt-proba.py` + élő mérés OpenAI-n) · F-8.4 **R-7 rajzkör** öt lapon (első beállítás · kezdőlap+hírek · beállítások-szint · nyitólap · token-skála),
  a kérés `design/DESIGN-KERES-R7.md` (még nincs megírva — az F-8.4 első lépése) · F-8.5 újrateszt valódi kezdővel + külső felülvizsgálati csomag. Ágens-költség ≈ 1,5 USD, ~40 óra.
- **Vilmosra vár (a terv 3. pontja, a rajtad-listán):** 3.1 a menünevek szótára (Gépház→Beállítások stb., soronként igen/nem) · 3.2 „Mentés és kilépés": vissza a kezdőlapra vagy marad a
  kijelentkeztetés · 3.3 a „még nem működik" jelölés (D-F33) maradjon-e az alapnézetben · 3.4 jelszó-visszaállítás a belépő lapról (rendszergazdai út egy lappal, vagy e-mailes gépezet a pilot után)
  · 3.5 fordított magyar cím a román hírekhez (mag 0.3 + prompt) · 3.6 a nyitólap három adata (régi tétel). **Ezek nélkül az F-8.1 és F-8.2 indul, a többi vár.**
- **Amit nem építünk:** posztvázlat (termék-ígéret), e-mailes visszaállítás/értesítés (nincs e-mail-küldő, T-10), a Feliratok/Theme lap elrejtése (rendszergazdáé; laikus nézet épül helyette).
- Kisebb tanulság: a Dellen mostantól **van pnpm** (a felhasználói npm-mappában), a `pnpm allapot` innen is kiteszi a lapot a NAS-ra (mérve 16:08) — a HANDOFF 09-11-i „nincs pnpm" sora elavult.

## 2026-09-13 délután — a Dell (T2) is látja a SaaS mappát: `S:` hálózati meghajtó (D-F39)

- `S:` = `\nas-saas\home\Katinka\SaaS` — a NAS-on Vilmos home-jának SaaS mappája, ugyanaz, amit a gépe és a Gigabyte (`~/SynologyDrive/SaaS`) tükröz: `vault/`, `be/`, `tarhely/`.
  Tartós leképezés, a belépő a Windows hitelesítő-tárolójában (`cmdkey`, célnév `nas-saas`); `nas-saas` a hosts fájlban a NAS LAN-címére mutat. Szkript: a scratchpad `smb-bekot.ps1`
  mintája a D-F39-ben leírva. **Két buktató:** a Dellen a másik projekt robotja (`dellbot`) SMB-ülést tart a NAS-hoz — külön kiszolgálónév kellett; a vault NAS-jelszava
  vezető szóközzel áll a fájlban — a beolvasásnál `Trim()`. A kulcsok (pl. `S:ault\openai-key.txt`) innen is elérhetők; a `kirak.sh --titkok` továbbra is a Gigabyte-on fut.

## 2026-09-13 dél után — T-25 KÉSZ: a teszt hírfigyelője OpenAI API-n (D-F37); a Gigabyte Drive-szinkronja rendbe téve (D-F38)

- **OpenAI csatlakozó** (`packages/ai-adapters/src/openai.ts`, `openai` a szolgáltató-választóban; Chat Completions, `OPENAI_API_KEY` + `OPENAI_MODELL`, alap `gpt-5-mini`; 4 próba).
  Két mért szabály: **`reasoning_effort: "minimal"`** a gpt-5 családnál (alapon a modell a teljes kimeneti keretet a gondolkodásra költi, üres válasz → 10/10 AI_ROSSZ_VALASZ), és a
  válasz nyelve a rendszerutasítás végén. A kulcs útja: `vault/openai-key.txt` → `kirak.sh --titkok` (a Gigabyte-on fut, ott van a vault tükre) → NAS `.env` `OPENAI_API_KEY`;
  `HF_AI_SZOLGALTATO=openai`, `docker compose up -d --no-deps app`. Élő mérés: 10/10 ok, 0,009 USD/futás, 4,2 mp/hívás; az Adatpolitika lap „OpenAI (API) · felhőben fut · USA".
  A futás nyelve a kérésé/fióké (D-11: alap angol) — magyar fiókkal magyar indoklás.
- **A Drive-szinkron** (T-28, D-F38): a Gigabyte 09-12 18:20-as újraindítása óta a Synology Drive kliens nem futott (asztali autostart, grafikus bejelentkezés nélkül) — 18 órán át
  semmi nem szinkronizált (a tükör sem ment ki, a vault sem jött be). Megoldás: `tools/gigabyte-robot/systemd/{xvfb,synology-drive}.service` felhasználói egységek
  (`Linger=yes`, bekapcsoláskor indulnak; telepítés a fájl fejlécében). Nyitva T-29: jelzés, ha a szinkron áll (a daemon.log frissessége az állapotőrbe).
- **A megbízás állása:** F-0…F-7 kész és kint a teszten; T-25 kész. Nyitva: T-27 (kimenő üzenetek naplója — Vilmos döntése), T-29, az árazás a pilot után.

## 2026-09-13 dél — F-7 KÉSZ, KINT A TESZTEN (12a7f2d, 11:09): az R-5 rajz beépült — A MEGBÍZÁS NYOLC CSOMAGJA (F-0…F-7) MIND KÉSZ

- A rajz `design/r5-csomag/atado/` (7 artboard), ellenőrzése `design/r5-csomag/ELLENORZES.md` (hibátlan; döntések D-F36). Új: a Gépház **Csomag** csempéje (`Gephaz.tsx`, a rács
  első helyén, hivatkozás nélkül; az „Árazás és fizetés" sor a „még nem működik" jelölés harmadik alakja) és **Kimenő értesítések** csempéje; a `/gephaz/kimeno` lap
  (`apps/web/app/gephaz/kimeno/`, adatforrás `apps/web/kimeno/`): a 25 fajta öt csoportban, tulajdonosnál háromállású választó (örökli · kimenő · nincs) + közös alap + ami
  érvényes, rendszergazdánál a közös alap kapcsolói; mentés `PUT /api/ertesites` / `/kozos`. Az **AI-kapcsoló** doboza (`AiKapcsoloDoboz` a `Beallitasok.tsx`-ben) az Adatpolitika
  fülön a felhő-kapcsoló fölött; a hírfigyelő áttekintője `ai_engedelyezve`-t ad, kikapcsolva a `km-hf-ai-sav` áll a lap tetején (hivatkozás csak tulajdonosnak).
- `GephazNezet.csomag/kimeno`, `AdatpolitikaNezet.ai_engedelyezve/ai_kikapcsolva` (az utolsó `ai_kapcsolo_valtozott` eseményből, a fiók nevével), `beallitasokNezet(fiok, szerep, szervezetId)`.
  Migráció 0060: 46 kulcs + a 25 `esemeny.<fajta>_cim` ékezetes szöveggel (a 0048 ékezet nélkül írta). Próbák: `r5-gephaz.proba.ts` (Qwen, 7); 305 zöld.
- **Ami nyitott (nem építés):** T-25 (a teszt doboza nem éri el a Dell Ollamáját — üzemeltetés), T-27 (kell-e a kimenő üzenetek naplója), az árazás a pilot után (a csomag
  `ar_havi`/`penznem` mezője kész, egy UPDATE), a rendszergazda-nézetek képei (02., 04.) csak SQL-es rendszergazda-jelöléssel készíthetők. A rajtad-listán: T-25, T-27.

## 2026-09-13 délelőtt — Vilmos négy döntése (D-F35); F-5c és F-7a KINT A TESZTEN (de9a08d, 10:01); az R-5 Design-kérés kiment

- **Döntések** (előre adott válaszlehetőségekből): T-26 a kiléptetés marad a mai (a többi eszköz lép ki); `logo_sotet` most nem; T-24 megőrzés **30 nap**; **F-7 pilot** — egy
  csomag, ár és fizetés nélkül. A rajtad-lista régi tételei lezárva (Design-kérés, Gigabyte, rajzmappák, modul-lista).
- **F-5c**: `esemeny_takarit(nap)` SECURITY DEFINER függvény (0059) — a 30 napnál régebbi eseménysorok óránként törlődnek (`hitelesites/takaritas.ts` → `esemenyekTakarit`),
  az olvasott-jelölés velük. **F-7a**: `csomag` tábla (pilot: hirfigyelo), `szervezet.csomag_kod`, `apps/web/csomag` (`szervezetCsomag`, `modulEngedelyezve`), `GET /api/csomag`;
  a hírfigyelő végpontjai a saját `_kozos.ts` kapuján át mennek, ami a csomagot is nézi (403 `MODUL_NEM_ELERHETO`); a sáv `FelsoSavAdat.modulok` szerint mutatja a Modulok lenyílót.
  Szerződés: `@km/contracts` `MODULOK`, `Csomag`, `ALAP_CSOMAG_KOD`. Próba: `csomag.proba.ts` (Qwen írta, első futásra jó); 298 zöld.
- **A Qwen-kudarc oka** (MERES 10., AGENSEK.md): egy elvágott válasz volt, nem képességhiány; az `agens.py` naplózza a megállás okát, ismétel, az alapmodell a 128k-s változat.
  A feladatlap Qwennek tényeket mondjon, ne kérdéseket.
- **Ami hátra van a lezáráshoz:** az **R-5 rajz** (`design/DESIGN-KERES-R5.md`: a Gépház Csomag csempéje + T-23: AI-kapcsoló az Adatpolitika fülön, kimenő értesítések a Gépházban)
  → F-7b és a T-23 képernyője (~fél nap). Üzemeltetés: T-25 (a teszt doboza nem éri el a Dell Ollamáját). Ezeken kívül a megbízás minden csomagja kint van a teszten.

## 2026-09-13 reggel — F-4 KÉSZ, KINT A TESZTEN (3c3b001, 09:19): a Saját fiók lap az R-3 v2 rajzból — a Design négy rajza MIND beépült

- A rajz `design/r3-sajat-fiok/atado/` (v1 + v2, a v2 a hiteles, 6 artboard), ellenőrzése `design/r3-sajat-fiok/ELLENORZES.md` (hibátlan; 1 gépezeti kiegészítés → D-F34).
  A végső csomag kísérőlevele: `design/ATADO-VEGSO-OLVASD-ELOSZOR.md`. Lap: `/sajat-fiok` (`apps/web/app/sajat-fiok/`), adatforrás `apps/web/sajatfiok/` (`sajatFiokNezet`:
  a fiók, az utolsó belépések a `belepesi_kiserlet`-ből (30 nap), a munkaterek az „utolsó tulajdonos" jelzéssel, az olvasatlan értesítések az oldalsávhoz).
- `POST /api/tagok/kilep` bővült: opcionális `szervezet_id` (bármelyik saját munkatér), a válasz `kovetkezo_szervezet_id` — az aktuálisból kilépve a maradék első lesz az
  aktuális (D-F25), ha nem maradt, a lap a `/szervezet/uj`-ra visz. A sáv fiók-neve a `/sajat-fiok`-ra visz (ott kiemelt), telefonon a menü legalsó sora is; az ügyfélprofil
  oldalsávjából a nyelvválasztó elmarad (a Saját fiókra költözött). Migráció 0058 (66 kulcs). Próbák: `sajat-fiok.proba.ts` (6); 292 zöld.
- Nyitott: T-23 (AI-kapcsoló + kimenő horog képernyője — Design-kérés), T-24 (értesítések megőrzése), T-25 (a tesztoldal doboza nem éri el a Dell Ollamáját), T-26 (a
  kiléptetés ezen a gépen is? — Vilmos szava). F-7 a modul-listára és az árakra vár (Vilmos). A rajtad-listán: `logo_sotet` (D-F31), T-24, T-26.

## 2026-09-13 reggel — F-5 KÉSZ, KINT A TESZTEN (5a477e6, 08:36): a Beállítások lap (Értesítések · Adatpolitika) az R-4 rajzból

- A rajz `design/r4-ertesitesek/atado/` (7 artboard, a 07. vázlat nem épül), ellenőrzése `design/r4-ertesitesek/ELLENORZES.md` (a rajz hibátlan; a gépezettel
  4 eltérés → D-F33). Lap: `/beallitasok` (`apps/web/app/beallitasok/`, a felső sávval, fül a `?ful=` címből); közös kapcsoló: `_kozos/Kapcsolo.tsx` + `kapcsolo.css`.
- Új gépezet (`apps/web/ertesites/`): FIÓK-szintű értesítés — `ertesites_fiok` (a hat kapcsoló + felületi csatorna + „mind olvasott" vízjel), `ertesites_olvasott`
  (soronként); a lista a fiók MINDEN munkateréből, az utolsó 50; végpontok `GET /api/ertesites/lista`, `GET/PUT /api/ertesites/sajat`, `POST /api/ertesites/olvasott`;
  a sor megnyitása `/beallitasok/nyit/[id]` (olvasott + munkatér-váltás + a cél). A régi `/api/ertesites` (kimenő horog, munkatér-szint) KÜLÖN dolog, marad képernyő nélkül (T-23).
- `@km/esemeny-core` **0.2.0**: 4 új fajta — `forras_hibas` (a `tar.forrasMent` a hibásra váltásnál), `ai_nem_valaszol` (az AI-hívó számlálója, a futás végén egyszer, `{n}`),
  `futas_beragadt` (`sor.beragadtakElenged`), `belepesi_kiserletek` (a belépési korlát betelt — rendszerszintű, csak a rendszergazda látja; e-mail/cím nincs benne).
- A harang a `FelsoSav`-ban (`FelsoSavAdat.ertesites_olvasatlan`, `olvasatlanSzam()`), a `--olvasatlan` tokennel; telefonon a menü sora. 6 új token (`--keszul`, `-bg`, `-border`,
  `--olvasatlan`, `--kapcsolo-w/h`) a Theme-lapon is. Migráció 0057 (2 tábla, token-patch, 109 kulcs). Próbák: `beallitasok.proba.ts` (13), a mátrix +2; 291 zöld.
- Tanulság: a Qwen a próbafeladatra csak gondolkodást adott, fájlt nem (MERES 10.) — a próbát én írtam; a képszkriptben az RSS-forrást ellenőrizni kell, különben a
  próbafutás „minden forrás hibás"-sal zár. A takarítás (`takaritas()`) a próba-fiókokkal MINDEN `proba-%@proba.example` fiók eseményeit is viszi — a képek a próbák UTÁN készüljenek.
- Következik: R-3 (Saját fiók — az utolsó rajz), T-23 a Design-kéréshez; F-7 a modul-listára vár (Vilmos). Rajtad: `logo_sotet` (D-F31), T-24 megőrzés.

## 2026-09-13 reggel — F-6 KÉSZ, KINT A TESZTEN (13d64a6, 07:45): az „Arculati anyagok" blokk az R-6 rajzból

- A rajz `design/r6-fajlfeltoltes/atado/` (6 artboard), ellenőrzése `design/r6-fajlfeltoltes/ELLENORZES.md` (hibátlan; a Design 4 kérdésére a válasz a kódból + D-F31).
  Komponens: `apps/web/app/_kozos/ArculatAnyagok.tsx` + `arculat-anyagok.css` (Kimi vázlata, átnézve — a hibái a MERES 9.-ben); két helyen: `Fiok.tsx`
  (saját kártya az arculat-kártya alatt, `szerkesztheto` a szerep szerint) és `onboarding/3/Lepes3.tsx`. Migráció 0055 (51 felirat a rajzból) + 0056 (6 kulcs).
- A logó a tervezetbe az `arculatModosit` állapotgépen át kerül: jóváhagyott arculatnál a feltöltés/csere ÚJ tervezetet nyit (verzió+1), a pillanatkép a régi
  fájlra mutat → a listában „a N. jóváhagyott tervezetben", halványan, csak Megnyitással; a csere megerősítője (05/A) csak jóváhagyott arculatnál és a fájl
  kiválasztása UTÁN nyílik (mostani → új kép). Nem jóváhagyott tervezetnél és a kézikönyvnél a csere azonnal felmegy. Eltávolítás nincs.
- Tesztoldali tanulság (T-22): a NAS-on az `adatok/fajlok` mappa root tulajdonú volt (sudo mkdir), az app `node`-ként fut → a feltöltés 500. A `kirak.sh` mostantól
  `chown 1000:1000` + `chmod 770`. Képek: `tools/kepernyokep/r6-kepek.mjs` (9 állapot), galéria https://saas.mediapartizan.ro/allapot/kepek/r6/.
- Apró javítás mellette: az ügyfélprofil arculat-kártyájának mondata („Nincs jóváhagyott arculat…") akkor is ezt írta, ha volt jóváhagyott verzió és rajta új tervezet — most a jóváhagyott mondat áll.
- Következik: R-3 (Saját fiók) és R-4 (Értesítések és adatpolitika) a Design csomagjaira várva; F-7 a modul-listára (Vilmos). A rajtad-listán: kell-e `logo_sotet` cél (D-F31).

## 2026-09-13 éjjel — F-3 KÉSZ, KINT A TESZTEN (6a244b1, 00:12): Tagok lap, beváltó lap, a sáv Tagok sora — az R-2 rajzból

- A rajz `design/r2-tagok/atado/`, ellenőrzése `design/r2-tagok/ELLENORZES.md` (hibátlan; a Design 6 kérdésére a válasz a kódból + D-F30).
  Lapok: `/tagok` (`apps/web/app/tagok/`, a felső sávval, aktív pont nélkül; néző → kezdőlap) és `/meghivo/<jegy>` (`apps/web/app/meghivo/[jegy]/`, sáv NÉLKÜL).
- Gépezet, ami a rajzhoz kellett: `GET /api/meghivo/{jegy}` (nyilvános megtekintés, csak élő meghívónál ad nevet; a jegy nincs naplóban), a belépő- és
  regisztrációs lap `?vissza=` címe (csak saját `/…` út), `apps/web/tagok/index.ts` (`tagokNezet`, `bevaltoNezet`), `fiokNeve()` (a jóváhagyó neve a fiókból —
  D-F30/4), a `hivas()` segéd DELETE-et is tud. Migráció 0054 (74 felirat). Próbák: `tagok-lap.proba.ts` (8 eset). Képek: `tools/kepernyokep/r2-kepek.mjs`,
  galéria https://saas.mediapartizan.ro/allapot/kepek/r2/.
- Eltérés a régi feladatlaptól: a szerkesztő IS hívhat (nézőt/szerkesztőt); a kilépés a munkatérből csak az R-3 lapon lesz; a függő meghívók blokkban az
  elfogadottak nem szerepelnek (a taglistán állnak). A felső sáv **Tagok sora** (D-F24) még nem éles — az a következő lépés, ha a lap kint van a teszten.
- Következik: R-3 (Saját fiók), R-6 (fájlfeltöltés-blokk), R-4 (Értesítések és adatpolitika) — a `design/DESIGN-KERES-R2-R6.md` sorrendjében, a Design csomagjaira várva.

## 2026-09-12 késő este — F-2d: az R-1 v4 (2. javítókör) beépítve (4495abf) — a felső sáv MINDEN belépett lapon, pénznem-vezérlő, részleges futás

- A v4 csomag `design/r1-kezdokepernyo/atado-3/` (10 artboard), ellenőrzése `ELLENORZES-JAVITOKOR-2.md` (hibátlan). Döntés D-F29: a négy
  rendszergazda-lap GazdaNav-váltója elmarad (a kód marad, senki nem hívja); a hírfigyelő fülsora a sáv alatt marad; a mentés-állapot a lapcím mellett.
- Új: `ujTalalatSzam()` (a sáv „{n} új" jelvénye), `HirfigyeloCsempe.utolso_futas`, `GephazNezet.munkater.penznem`, a Munkatér csempe a Gépház tulajdonos
  nézetén (`select` → `PUT /api/beallitas/penznem`), 0053 feliratok (9 kulcs). Próbák: 269 zöld (kezdolap.proba 15 eset). Képek: `f2-kepek.mjs --fazis 4`.
- A Design következő köre: `design/r2…r6` a meglévő feladatlapok szerint (a felső sáv adott, a gépezet kész).

## 2026-09-12 este — F-2 KEZDŐKÉPERNYŐ ÉS GÉPHÁZ kész, KINT A TESZTEN (87e5ebb, 19:46); a Gigabyte robotja újra jár

**Ha itt folytatod:** a szerződés `docs/KEZDOLAP-SZERZODES.md`, a típusok `apps/web/kezdolap/tipusok.ts`, az összeállító `apps/web/kezdolap/index.ts`
(`kezdolapNezet`, `gephazNezet`, `felsoSavAdat`), a képernyők `apps/web/app/kezdolap/`, `apps/web/app/gephaz/`, a felső sáv `apps/web/app/_kozos/FelsoSav.tsx`.
A rajz: `design/r1-kezdokepernyo/atado-2/` (8 artboard; kibontva képekké: `node tools/kepernyokep/_artboardok.mjs`). A képek a rajz mellett:
https://saas.mediapartizan.ro/allapot/kepek/f2/ (készítő: `tools/kepernyokep/f2-kepek.mjs`, két fázis — a 2. a rendszergazda-jelölés után).

- **Mi épült:** `GET /api/kezdolap` (egy lekérdezés a hat csempéhez), `GET /api/gephaz` (rendszergazda 4 / tulajdonos 2 csempe; a szerkesztőnek 403 — D-F23),
  `PUT /api/beallitas/penznem` (D5: EUR·USD·HUF·RON, munkatér-beállítás), `GET/PUT /api/beallitas/arfolyam` (TÁROLT árfolyam, rendszergazda — D-F22),
  `POST /api/szervezet/valt` (a fiókon tárolt választás, `aktualisFiok()` a választottat teszi elöl — D-F25). Migrációk 0050 (penznem, aktualis_szervezet_id,
  arfolyam), 0051 (111 felirat, a rajz csomagjából generálva), 0052 (két méret-token: `--tile-min`, `--fs-metric` — D-F26). Belépés után a `/kezdolap`.
- **Ami tudatosan nincs:** Tagok sor a lenyílóban (D-F24, R-2-re vár); pénznem-vezérlő (nincs a rajzon — T-14); a felső sáv a régi lapokon (T-15).
- **Próbakörnyezet-szabály (T-18):** egy adatbázison EGY webkiszolgáló fusson a próbák alatt — a Dellen a `next build` + `next start -p 8401`; ha a `next dev` (8400) is fut,
  azon `HF_FUTTATO=0`, különben két hírfigyelő-futtató versenyez a soron, és a hírfigyelő-próbák időt lépnek túl. A képernyőképek is a 8401-ről (a dev HMR-je zavar).
- **Mérés:** `docs/MERES.md` 7. — kulcsegyezés 0 hiány; `kezdolap.proba.ts` 13 eset; a teljes sor és a mátrix az éles építésen (8401); a csomagok 106 + a második befogadó 40 zöld.
  Tanulság: két kiszolgáló ugyanazon az adatbázison két hírfigyelő-futtatót jelent — a próbához egy fusson (T-18).
- **Ágensek:** DeepSeek (adatréteg), Kimi (felső sáv + kezdőlap; Gépház), Qwen (próbák) — 0,17 USD; a hibáik a MERES 7.-ben tételesen.
- **A kirakás:** a Dellről ssh-val érem a Gigabyte-ot (`~/.ssh/id_ed25519_gigabyte`, a `gigabyte` felhasználó); a robot (percenkénti timer) magától kirakja a főágat, amióta a saját naplója
  és a helyi képek a `.gitignore`-ban vannak (D-F27). Öt kör ma: két piros (T-19 Dockerfile-lista, T-20 hiányzó mappa + a visszaállítás nginx-e), három zöld. A kirakás újraindítja az adatbázis-dobozt (T-21).
- **Fájlok Vilmos és Claude közt (D-F28):** a tárhely tükre a `SynologyDrive/SaaS/tarhely/` (a robot írja zöld kirakás után, csak olvasni); ami Vilmostól jön, a
  `SynologyDrive/SaaS/be/` mappába kerül — a Gigabyte-on `~/SynologyDrive/SaaS/be/`, onnan olvasd (ssh), a feldolgozottat `be/_feldolgozva/` alá.
- **Vilmosra vár:** rajz a pénznem vezérlőjéhez és a felső sávhoz a régi lapokon (`design/r1-kezdokepernyo/JAVITOKOR-2-FELADAT.md`), a `design/r2…r6` rajzok.

## 2026-09-12 — AZ F-FUTAM (a megbízás: `docs/ORCHESTRATOR-MEGBIZAS.md`) — F-0 kész, F-1 a főágon

**Olvasd el először:** `docs/ORCHESTRATOR-MEGBIZAS.md` (a szabályok), `docs/MODULSZABALY.md`, majd `docs/DONTESNAPLO.md`
(D-F01…), `docs/MERES.md` (a számok), `docs/TEENDOK.md` (ami nyitva). Az élő állapotlap: https://saas.mediapartizan.ro/allapot/ —
a lépéseknél a „ki” mező mondja, melyik ágens dolgozott.

- **Hol fut a munka:** a Dellen (T2, Windows). Helyi próba-adatbázis Docker NÉLKÜL (`tools/proba-kornyezet/helyi-postgres.sh`,
  PG 18.4 a scratchpadben, port 5433; a Docker itt a hitelesítő-tároló miatt nem tud képet letölteni — D-F01, T-4).
  Az alkalmazás `next dev -p 8400`-on; a próbák `PROBA_CIM=http://127.0.0.1:8400`-ra. Képernyőkép: `node tools/kepernyokep/kep.mjs`
  (a gép Edge-ével; `--belep --profil` próbafiókkal; `--resolve saas.mediapartizan.ro:443:192.168.1.144` a tesztoldalhoz).
- **F-0 kész:** `docs/MERES.md` 1. — 902 px-térköz 677 helyen (nem 1021/491), 47 érték (nem 37), 53 token, 26 tábla, 44 migráció;
  határőr/tokenőr/típus zöld; 217 próba (215 zöld, 2 Windows-útvonal — javítva). Az állapotlap a valóságra hozva, és a
  `nas/allapot-kirak.sh` közvetlenül a NAS-ra teszi (a Gigabyte robotja NEM rakta ki a főágat — T-7).
- **F-1 (térköz-skála) — a kód kész, próbákkal, képernyőképekkel; KIRAKÁS a Gigabyte-ról vár (T-7):** 15 fok (`--ter-0…14`),
  a 7 régi térköz-token származtatott lett (D-F08), migráció 0044 (feliratok + a tárolt téma pótlása/tisztítása), a 13 stíluslap
  654 deklarációja átírva a determinisztikus `tools/meres/terkoz-atir.py`-vel, a tokenőr a pixeles térközt tiltja, a használat-
  számláló (`pnpm terkoz`) a Theme-lapot eteti; a Theme-lap hat füles (Kimi), a Térköz-csoport a rajz szerint; 8+8 új próba.
  Ágensek: DeepSeek (designrendszer), Kimi (Theme-lap — a CSS-számkulcsot rosszul párosította, D-F11), Qwen (API-próbák).
- **F-3 (tagság, meghívó, szerepek) — a GÉPEZET kész, képernyő nélkül (D-F14):** az első modul a MODULSZABÁLY szerint:
  `packages/hozzaferes-core` (szerződés: `docs/HOZZAFERES-SZERZODES.md`; 21 próba adatbázis nélkül; README 5 szakasz; 3 határőr-szabály),
  a webalkalmazásban `meghivo` tábla (migráció 0045, RLS + SECURITY DEFINER a jegy szerinti kereséshez), 8 végpont (`/api/tagok…`,
  `/api/meghivo/elfogad`) a közös kapun, a mátrixban; a referencia-hostban SQLite-tár + 3 útvonal (36 próba). A Tagok képernyő és a
  beváltó lap a `design/r2` rajzra vár (T-9). Ágensek: DeepSeek ×2 (mag, web), Kimi (2. befogadó), Qwen (11 élő próba) — a hibáikat a
  próbák fogták (D-F17).
- **F-4, F-5, F-6 — a GÉPEZET kész, képernyő nélkül (a rajzok hiányoznak, T-1/T-11):**
  F-4 Saját fiók: `PUT /api/fiok/jelszo` (a többi eszközt kilépteti), `PUT /api/fiok/nev`, `POST /api/fiok/kileptetes-mindenhol`; e-mail zárva, fióktörlés nincs
  (migráció 0047, 5 élő próba). F-5 Eseménynapló: `packages/esemeny-core` (szerződés: `docs/ESEMENY-SZERZODES.md`, 12 próba), `esemeny` +
  `ertesites_beallitas` tábla, `szervezet.ai_engedelyezve` (migráció 0048), 18 jel bekötve (`feljegyezHatterben`), `/api/esemenyek`, `/api/ertesites`,
  `/api/beallitas/ai`; az AI-kapcsoló a `keretEllenoriz()` elején — `AI_KIKAPCSOLVA` (409). Kimenő csatorna: webes horog `ERTESITES_WEBHOOK_URL`-ből
  (a NAS `.env`, a vaultból) — alapból SEMMI nem megy ki. F-6 Fájl: `packages/fajl-core` (szerződés: `docs/FAJL-SZERZODES.md`, 24 próba), `arculat_fajl`
  tábla (0049), a bájtok `FAJL_MAPPA` alatt (compose: `./adatok/fajlok`, a `mentes.sh` 4b menti), `POST/GET /api/arculat/fajl`, `GET /api/arculat/fajl/[id]`;
  `ArculatTervezet.logo_fajl_id`. 21 élő próba. Döntések: D-F19…D-F21.
  **Csapda, amit ma találtunk:** a Turbopack nem oldja fel a `./x.js` relatív importot egy `.ts` csomagban (a fajl-core így jött DeepSeektől — „Export … doesn't
  exist"); a `pg` próba-kliens nem nyitható újra a `lezar()` után (a segéd most frissen példányosít); a Next 16-ban a `params` ígéret; a `db().execute()`
  eredménye `{ rows }`.
- **Ami Vilmosra vár:** a Gigabyte kulcsa/robotja (T-7), az F-7 árak, a nyitólap adatai, a román/angol emberi lektor — az
  állapotlap „Most rajtad áll” listája.
- **Ami hiányzik a tárhelyről:** a `design/r1…r6` rajzmappák (T-1) — az F-2…F-6 képernyője rajz nélkül nem építhető.

## 2026-09-11 késő este — A FLOTTA HADRENDBEN, A DELLEN (T2)

- **Ez a munkamenet a Dellen fut** (Windows, `T2`, Tailscale 100.89.253.13), nem a Gigabyte-on — a CLAUDE.md sora
  nem minden munkamenetre igaz; **előbb mérd meg, hol vagy** (`hostname`, `tailscale status`). A tárhely másolata itt:
  `C:\Users\remoteadmin\aitmetica-saas`. Részletek: `docs/GIGABYTE-ES-MUNKAKORNYEZET.md` 1. fejezet kiegészítése.
- **A vault a tárhely mellett van** (`vault/`, a git kihagyja — ellenőrizve: `!!`). Benne a DeepSeek- és Kimi-kulcs, a
  GitHub-kulcs (ssh-n működik innen), a NAS- és adatbázis-belépés. A tartalmuk nem kerül chatbe.
- **`tools/agens/agens.py` frissítve:** a vaultot a tárhely mellett is keresi; **új, ingyenes `qwen` ágens** (a Dell
  Ollamája, `qwen3.8:27b`, gondolkodás nélkül, 32k szövegkeret); `--modell` kapcsoló. Mind a három ágens egy
  párhuzamos hívásban lemérve a `FLOTTA-proba.md` feladattal: DeepSeek 1,1 mp, Kimi 1,7 mp, Qwen 8,0 mp hidegen —
  ugyanaz a helyes fájl mindháromtól. Napló: `docs/agens-naplo.jsonl` (FLOTTA sorok). Használat: `docs/AGENSEK.md` 4.
- **A Dellen nincs pnpm** → próbák, fordítás, kirakás a Gigabyte-on (D-22, az egyenes út robotja). Innen: kód + feltöltés.
- Nyitva ugyanaz, mint eddig: a `HETEDIK-SZAKASZ.md` végén és az `EGYENES-UT.md` 10. pontjában felsoroltak.

## D-10 (2026-09-07 este) — előfizetéses AI a teszten: KINT, a Claude-ág élőben mérve

- Vilmos döntése: a teszten a saját Claude- ÉS ChatGPT-előfizetése dolgozik API-kulcs helyett (D-10 a döntési naplóban,
  részletek `docs/D-10-ELOFIZETES.md`). Új doboz: `aitmetica-saas-ai-hid` (Claude Code + Codex, HTTP a 8500-on, csak belül).
  Két új szolgáltató: `claude-elofizetes`, `codex-elofizetes`. A NAS `.env`: `AI_SZOLGALTATO=claude-elofizetes`.
- **Mérve élőben (NAS):** Claude-ág 4,9 mp (a `-p` alapmodellje `claude-haiku-4-5`; `CLAUDE_MODELL`-lel váltható);
  a tesztoldalon regisztráció → szervezet → AI-összefoglaló 5,7–7,8 mp, `szolgaltato: claude-elofizetes`, `becsult_usd: 0`;
  az 1. lépés képernyőjén az „AI-javaslat" blokk a Claude szövegével (d10-kep@proba.hu fiók, Székely Asztalos Kft.).
- **Codex-ág:** a kapcsolat és a belépés rendben (`Logged in using ChatGPT`), de az OpenAI válasza: „You've hit your usage
  limit… start a free trial of Plus… try again at Sep 13th" → a belépett ChatGPT-fiók NEM fizetős, vagy a Codex-kerete
  elfogyott. Kiderült: ROSSZ (ingyenes) ChatGPT-fiókkal lépett be. 15:47-kor a fizetős fiók belépője került a vaultba → `--titkok` + a híd-dobozban kézi csere (`cp /titkok/codex-auth.json /home/node/.codex/auth.json`, mert a doboz csak első indításkor másol) → **Codex-ág élőben mérve: 10,7 mp a hídon, 11,4 mp az alkalmazáson át (`szolgaltato: codex-elofizetes`).** Egy Codex-hívás ≈25 000 bemeneti tokent visz a keretből (a Codex saját alaputasításai miatt) — ezért az alap a Claude marad: `.env` visszaállítva `claude-elofizetes`-re; átkapcsolás: `.env` + `docker compose up -d --no-build app`. A híd ezt az okot már részletként visszaadja (502 AI_NEM_ELERHETO).
- Tanulságok: `claude -p --bare` a belépőt is átugorja (Not logged in) — nem használható; a híd képébe kell a
  `ca-certificates` (a Codex TLS-hibája nélküle); a `/titkok` fájlok a doboz `node` (1000) felhasználójáé legyenek;
  a gép Linux-környezetében a háttérfolyamat nem éli túl a parancsot (ágensek csak előtérben, ≤170 mp);
  párhuzamos munkamenetben `REPO=/tmp/repo-xy bash nas/kirak.sh`, a `--hid` csak a híd-dobozt rakja újra.
- Ágensköltség: DeepSeek 0,0018 + Kimi 0,0185 USD (`docs/agens-naplo.jsonl`).

## 1. Mi ez

AI-központú, több ügyfélnek eladható **kommunikációs munkakörnyezet**. Munkanév:
„Kommunikációs munkatér". Terméktulajdonos: Portik Vilmos / Aitmetica SRL.
Külső szakmai felülvizsgáló: ChatGPT, Vilmos által átadott anyagok alapján.

Építési sorrend: előbb a **közös profil + onboarding** megy végig, utána az első önálló modul
(hír-/sajtófigyelő), ami két különböző rendszerben ugyanazzal a maggal működik.

## 2. Olvasási sorrend

1. `EGYUTTMUKODES.md` — a közös munka szabálykönyve. **Ez a kánon**, nem javaslat.
2. `docs/ATADO-1.0.md` — a termék hiteles leírása (R-01…R-20, A-01…A-16, 7 szakasz).
3. `PROJEKT-BEALLITAS-TEENDOK.md` — a beállítás állása és a döntési napló (D-01…D-06).
4. `docs/ALAPTERV.md` + `docs/decisions/ADR-001` — technológia, modulhatárok, adatgazdák.
5. `docs/ELSO-EPITESI-EGYSEG.md` — a következő munkacsomag E-1…E-12 lépésekben.
6. `docs/INFRA.md`, `docs/AGENSEK.md`, `docs/ATVETELI-ALLAPOT.md`, `NAS-NAPLO.md`.

## 3. Hol mi van

| Mi | Hol |
|---|---|
| Munkamappa Vilmos gépén | `E:\AI\SynologyDrive\SaaS` (a Cowork hídon elérhető) |
| Forráskód | `git@github.com:Tolgyes/aitmetica-saas.git` (privát) |
| Belépések | `vault/` — **soha nem kerül chatbe, kódba, GitHubra, felhőbe** |
| Teszt gép | Synology NAS `transzmozaik`, Tailscale `100.89.241.71` |
| A projekt mappája a NAS-on | `/volume2/docker/aitmetica-saas` |
| A projekt doboza | `aitmetica-saas-web` (nginx:alpine), `127.0.0.1:8400` |
| Tesztoldal | `https://saas.mediapartizan.ro` |
| **Élő munkaállapot** | `https://saas.mediapartizan.ro/allapot/` — az adatai `nas/public/allapot/allapot.json` |
| Helyi AI | Dell, Ollama, `http://100.89.253.13:11434` |

**Belépés a NAS-ra:** kizárólag a `nas/nas-parancs.sh` scripten át (a munkamenetben `/tmp/nas.sh`
másolataként). Ebbe **bele van építve** a 60 másodperces időkorlát, a legalacsonyabb elsőbbség és
a tiltólista. Ne kerüld meg.

**Feltöltés:** Claude tölt fel a `vault/github-kulcs` kulccsal. Vilmos nem kattint. **Hogyan (mérve):**
a felhő a privát tárhelyet nem éri el; a gép Linux-munkakörnyezetében (`device_bash`) a `/tmp/repo`
másolatból megy a push (`GIT_SSH_COMMAND="ssh -i ~/mnt/SaaS/vault/github-kulcs -o IdentitiesOnly=yes"`).
A `/tmp` ott 4 GB, a `$HOME` tele van — ezért `/tmp`. A kód a felhőből tömörítve, a `SaaS\Claude outputs\`
mappán át érkezik. A NAS-ra a `nas/kirak.sh` viszi (a NAS-on nincs git, a docker csak rendszergazdaként megy —
`NAS_SUDO=1`). Részletek: `docs/KIRAKAS.md`.

## 3b. A felhős munkakörnyezet újraépítése (ha a felhős doboz újraindult — 2026-09-08 megtörtént, 12 perc)

1. A kód: a gépen `cd /tmp/repo && tar -czf "$HOME/mnt/SaaS/Claude outputs/repo.tgz" --exclude=.git --exclude=node_modules .`
   → `device_stage_files` → a felhőben `mkdir -p /root/saas && tar -xzf … -C /root/saas`. (Ha a `/tmp/repo` is eltűnt:
   `git clone git@github.com:Tolgyes/aitmetica-saas.git /tmp/repo` a vault kulcsával; és a `/tmp/ap.py` pótlása — a vault
   `nas-belepes.txt` `jelszo:` sorát írja ki, semmi mást.)
2. Node 24: `curl -s -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash; . ~/.nvm/nvm.sh; nvm install 24; npm i -g pnpm@10.28.0`;
   minden parancs előtt `export PATH=/root/.nvm/versions/node/v24.20.0/bin:$PATH`. `cd /root/saas && pnpm install` (a felhő eléri a registry-t).
3. Docker: `(nohup dockerd --host=unix:///var/run/docker.sock > /tmp/dockerd.log 2>&1 &); sleep 12`. A felhő kimenő proxyja saját
   tanúsítvánnyal megy, ezért a `node:24-alpine`-ból egy `node24-proxy` képet kell építeni: `/tmp/node24-proxy/Dockerfile` =
   `FROM node:24-alpine` + `COPY ca-bundle.crt` (a `/root/.ccr/ca-bundle.crt` másolata) a `/usr/local/share/ca-certificates/`-be,
   hozzáfűzve a `/etc/ssl/certs/ca-certificates.crt`-hez, `ENV NODE_EXTRA_CA_CERTS=…`. Építés: `docker build --build-arg NODE_KEP=node24-proxy -t saas-proba forras`.
4. A helyi tesztkörnyezet `/tmp/nasproba`: a `nas/docker-compose.yml` másolata ezekkel az eltérésekkel: a db `ports: 127.0.0.1:5433:5432`,
   az app `image: saas-proba`, nincs `mem_limit`, nincs `ai-hid`/`ai-hid-codex` szolgáltatás; `nginx.conf` és `public/` a `nas/`-ból;
   `.env`: `KM_TULAJ_JELSZO`, `KM_APP_JELSZO` (véletlen), `AI_SZOLGALTATO=teszt`, `AI_HAVI_KERET_USD=5`. Forrás: `forras/` = a repo
   tar-másolata. Indítás: `docker compose up -d; docker compose exec -T db bash /migral/migral.sh; docker compose restart app web`.
5. Próbák: `cd apps/web && PROBA_RSS=https://marosvasarhelyiek.ro/feed PROBA_CIM=http://127.0.0.1:8400 DATABASE_URL="postgres://km_tulaj:<KM_TULAJ_JELSZO>@127.0.0.1:5433/km" pnpm proba`.
   Végigjátszó scriptek (`/tmp/e*-jatek.py`) a felhővel együtt elvesznek — a KIRAKAS.md írja le, mit játszottak végig; újraírandók, ha kellenek.

## 4. Meghozott döntések

| Kód | Döntés |
|---|---|
| D-01 | A projekt otthona: privát GitHub-tárhely + NAS-on futó teszt |
| D-02 | A feltöltést Claude végzi magától |
| D-03 | Claude a meglévő, teljes jogú NAS-fiókkal lép be — cserébe kötelező munkafegyelem (nem töröl, napló, kis lépések) |
| D-04 | Belépések ellenőrizve; a `transzmozaik` a 100.89.241.71, **nem** a 100.111.190.75 (az a transportlocal NAS-a) |
| D-05 | A tesztoldal nyilvános, **jelszó nélkül**, kereső-kitiltással. Vilmos döntése, Claude ellenvetése rögzítve. Valódi ügyféladat előtt a jelszós kaput elő kell venni |
| D-06 | A titkosítatlan bejárat szándékosan zárva marad |
| D-07 | Az ADR-001 teljes technológiai alapja elfogadva (Node 24, Next 16, React 19, TS 7, Drizzle, saját tokenrendszer + a többi) |
| — | **PostgreSQL 18** megerősítve (a többi projektje 16-on fut, ő a 18-at választotta) |

Az alapterv többi eleme (Node 24 LTS, Next.js 16, React 19, TypeScript 7, Drizzle, zod 4,
BullMQ+Redis, pnpm, dependency-cruiser, Tailwind nélküli saját tokenrendszer) **D-07-tel jóváhagyva** (2026-09-06 este).

## 5. Mi kész

- A teljes beállítás: tárhely, dokumentumváz, szabálykönyv, belépési pont, infra-leltár,
  ágens-szereposztás és költségnapló; tesztoldal él, élő állapotoldal
- **Az első építési egység (E-1…E-12) a teszten**: belépés, szervezet, három nyelv, tokenrendszer, onboarding
  3 lépésben (v6 szerint), AI-csatlakozó (teszt-szolgáltató), arculati tervezet, jóváhagyás → profil, fiókoldal,
  hibautak, fordított ellenőrzés. 92 gépi próba.
- **E-12b (2026-09-07): a modulok szétválasztása az alapterv modultáblája szerint.** `packages/profile-core`
  (a profil szabályai, arculati állapotgép, a `ProfilTar` tároló-kapu), `packages/onboarding-core` (a három lépés
  szabályai), `apps/web/profil` (tárolás + a fiókoldal műveletei). Az onboarding a jóváhagyáskor a profil kapuján
  át ad át, és elengedi az adatot (R-06); a fiókoldal semmit nem importál az onboardingból. **A modulhatár a
  határőrben él** (`.dependency-cruiser.cjs`, öt szabály), nem csak a dokumentumban. Kirakva, kívülről végigjátszva.

## 6. Mi nincs kész

- A 4. szakasz (`docs/NEGYEDIK-SZAKASZ.md`, E-13…E-18): a téma és a feliratok két szintje (közös alap +
  szervezeti felülírás, D-09), a Theme-felület a v6 szerint, a feliratok szerkesztője (rajz kell), export/import.
- A-07 részben, A-09/A-10/A-12/A-15 még nincs (lásd `docs/E-12-ELLENORZES.md`).

## 7. A NAS üzemeltetése — kötelező olvasmány

**Olvasd el a `NAS-szabalyok.md` fájlt, mielőtt bármit telepítenél vagy nehezet futtatnál.**
Ez a gép öt projektet futtat 16 GB memórián, tartalék nélkül.

**2026-09-06-i leállás, a valódi ok mérésekkel:** a dobozkezelő vezérlőprogramja négy nap alatt
**8,6 GB-ot halmozott fel a 16-ból** (valószínűleg eltakarítatlan állapotellenőrző munkamenetek).
Emiatt kiszorult a lemez-gyorsítótár, egy írás 122–164 másodperc lett, a terhelés 564-re ment,
miközben a processzor 1%-on ült. **Nem** a lemezek, **nem** a tárhely, **nem** a pillanatfelvételek,
**nem** a lemeztömbök és **nem** a sok szolgáltatás — mind kizárva méréssel.

**Ezt a korábbi átadó tévesen „memóriahiánynak" nevezte, és döntést kért a memória bővítéséről.
Az a rész érvénytelen.** A dokumentum kimondja: memóriát bővíteni nem megoldás, mert nem a
memória volt kevés.

**Amit ez a projekt köteles betartani:**
- nehéz munka (telepítés, összerakás, mérés, tömeges átalakítás) előtt: `free -m` és `uptime`;
  **3 GB szabad memória alatt vagy 20 fölötti terhelésnél nem indul el a munka**
- nem telepítünk egymás után többször — a változásokat összevárjuk
- két projekt összerakása soha nem futhat egyszerre ezen a gépen
- hosszú munka előtt egy sor a projektnaplóba: mit indítunk, meddig tart
- lassú gépet nem kapcsolunk ki

## 8. Mi a következő lépés

1. ~~Alapterv~~ D-07 · ~~E-1~~ · ~~E-2~~ · ~~E-3~~ — **mind KÉSZ** 2026-09-06-án.
2. ~~E-1~~ … ~~E-12~~ **mind kész — az első építési egység (`docs/ELSO-EPITESI-EGYSEG.md`) lezárva** 2026-09-07-én.
   Zárójelentés: `docs/E-12-ELLENORZES.md` (fordított ellenőrzés, végigjátszás 3 nyelven + telefon, A-01…A-16 állása —
   teljesült: A-01…A-06, A-08, A-11, A-14, A-16; részben: A-07, A-13; még nincs: A-09, A-10, A-12, A-15). Hibautak:
   `docs/E-11-HIBAUTAK.md`. Képernyőképek: `Claude outputs/e12-kepernyok/`. Részletek: `docs/KIRAKAS.md`.
   **E-12b (szétválasztás) kész és kirakva. E-13 (a téma két szintje: közös alap + szervezeti felülírás, verziózva,
   rendszergazda-jelölés) kész és kirakva** — részletek `docs/KIRAKAS.md` „A téma két szintje”. A rendszergazda Vilmos: a NAS
   `.env`-ben `RENDSZERGAZDA_EMAIL` a címe, a következő belépéskor a fiókja megkapja a jelölést. **E-14 kész és kirakva:** a Theme-felület (`/tema`) a v6 szerint,
   két szinttel; a tervezetet csak a szerkesztő látja, az alkalmazottat mindenki (Vilmos „menj”-e a javaslatra). Részletek:
   `docs/E-14-ELLENORZES.md`. E-14b: a korábbi verziók listája + visszaállítás a Theme-lapon (Vilmos kérte és jóváhagyta). **E-15 rajz jóváhagyva, E-16 kész és
   kirakva:** a feliratok két szintje és szerkesztője (`/feliratok`) — részletek `docs/E-16-ELLENORZES.md`, `docs/KIRAKAS.md`. A terv
   3. kérdése (mit írhat át a szervezet): mindent, a `hiba.*` „hibakódhoz kötött” jelzéssel — Vilmos jóváhagyta a rajzzal.
   **E-17 kész és kirakva:** export/import fájlba mindkét admin-felületen (ugyanaz a csomag és ellenőrzés, mint a mezőnél; hibás fájl
   semmit nem ír) — `docs/KIRAKAS.md` E-17 rész; A-07 és A-09 ezzel teljesült. **E-17b kész és kirakva** — a fiókprofil (`/fiok`) átrajzolása
   Vilmos új mockupja szerint (`design/atado/Fiokprofil-optimalizalt.dc.html`, a v7-es zipből); minden meglévő gépezet marad (mezőnkénti
   mentés, jelvény→részlet, arculat-blokk, jóváhagyás, MentesAllapot a fejlécben, nyelvválasztó és a Theme/Feliratok linkek az oldalsávban).
   Részletek: `docs/KIRAKAS.md` E-17b rész, `docs/E-17b-FORDITOTT-ELLENORZES-kimi.md` (0 valódi eltérés).
   **E-18 kész, a 4. szakasz lezárva:** `docs/NEGYEDIK-SZAKASZ-ZARAS.md` (hibautak bizonyítéka, záró fordított ellenőrzések, A-07/A-09,
   nyitott pontok). Talált és javított: a Theme-lap betöltési feliratai hiányoztak (migráció 0025); telefonon a feliratok-kártya a rajz szerint.
   **Az 5. szakasz terve: `docs/OTODIK-SZAKASZ.md` (2. változat, a felülvizsgálat pontosításaival).** Döntések: D-11 (angol az alap- és
   tartaléknyelv — K-1 központilag átállítva és kirakva), D-12 (fejlesztés tesztadapterrel, valódi AI API-kulccsal, a modul lezárásához
   sikeres valódi AI-próba kell; a híd nem helyettesítő; keret ellenőrizve). **E-19 és E-19b kész:** `packages/news-monitor-core` (mag +
   folyamatok, 138 próba) a `docs/HIRFIGYELO-SZERZODES.md` (0.2) szerint; `apps/proba-host` bizonyítja a bekötést a modul módosítása
   nélkül (`pnpm --filter @km/proba-host indit`). **E-20 kész és kint:** tárolás (`hf_*` táblák, RLS, migráció 0027), `/api/hirfigyelo/…`, közös letöltő (`apps/web/letoltes`: SSRF,
   robots.txt, RSS/Atom), AI-hívó (`apps/web/ai` + `hirfigyelo/ai.ts`; **`HF_AI_SZOLGALTATO`** — alap `teszt`, D-12) — `docs/KIRAKAS.md` E-20.
   Kívülről működik valódi RSS-sel. Az E-21 tartalma (forrásellenőrzés, robots, korlátok) az E-20-ban elkészült. **E-22 kész és kint**
   (D-13: NEM Redis — várólista a Postgresben `hf_sor`, migráció 0028; futtató az alkalmazás folyamatában `instrumentation.ts` →
   `hirfigyelo/futtato.ts`, 5 mp-es tick, egy munka egyszerre, napi ütemezés `esedekes()`-szel és `hf_napi_utemezesek()` SECURITY DEFINER
   függvénnyel; a nehéz AI a Dell Ollamáján `helyi-ollama` csatlakozóval — `HF_AI_SZOLGALTATO=helyi-ollama`, `OLLAMA_URL`
   http://192.168.1.188:11434 a NAS-ról LAN-on; `docs/D-13-HELYI-AI.md`, `docs/KIRAKAS.md` E-22). A POST futás 202-t ad, a tétel
   `GET futas/sor/{id}`-n követhető, `attekintes.sorban` mutatja, fut-e. **E-23 kész és kint:** kártyák (`kartyakEpit`, `attekintes.kartyak` — egy esemény =
   egy kártya forrásszámmal, v-címkével), az értékelés `osszefoglalo`-ja, tartalomötlet CSAK kérésre (`tartalomotletKer`, `POST talalatok/{id}/tartalomotlet`,
   migráció 0029), promptok v2, mérhető próbakészlet (`tools/agens/hf-minta`, `hf-prompt-proba.py`) — `docs/KIRAKAS.md` E-23. **A Dell AI élesben:** a tesztoldal
   `HF_AI_SZOLGALTATO=helyi-ollama`-n áll (NAS `.env`); mérve: hideg 41 mp, meleg 3,8 mp/cikk, jó minőség — de a Dell ingadozott, majd az Ollama nem válaszolt;
   Vilmosnak feltett kérdés: fut-e ott képgenerálás/tanítás. **Nyitott kérdés (egy):** az AI-válaszok nyelve (javaslat: a szervezet beállításának első nyelve).
   **E-24 + E-25 kész és kint** (`docs/KIRAKAS.md`): `/hirfigyelo` (Áttekintés + részletpanel) és `/hirfigyelo/beallitas` a prototípus szerint, közös váz
   `apps/web/app/hirfigyelo/_kozos/` (`HirfigyeloKeret` — a fülek csak a létező lapokra: `ELERHETO_LAPOK`; `kliens.ts`), migráció 0030 (a modul feliratai `hf.*`),
   `beallitasJavaslatKer` + `POST beallitas/javaslat`, a fiókprofil „Modulok” sora, 9 élő próba. **E-26 kész és kint** (`/hirfigyelo/finomhangolas`, `finomhangolas()` folyamat + `GET finomhangolas`,
   migráció 0031, 8 élő próba; a `javaslatDont` őre; a kipróbálás a háttérsorban — `kiprobal` fajta, 202 + tétel). **A Dell AI visszatért** (2026-09-08 14:00): relevancia 6,5 mp/cikk, javaslat 11 mp; 9/49 válasz üres → `maxKiToken` 700 (nincs még kint). **E-27 kész: az 5. szakasz lezárva** — `docs/OTODIK-SZAKASZ-ZARAS.md` (a 12 feltétel mérve; H-10 a Dellen:
   8/12, 7/12, 8/8 — `docs/E-27-H10-MERES.md`; a szerkezet az ALAPTERV ellen: 3 eltérés, a terv hozzáigazítása Vilmosra vár). **Nyitva, Vilmosra vár:** (1) az AI-válaszok
   nyelve (javaslat: a szervezet beállításának első nyelve); (2) az ALAPTERV 3 sorának hozzáigazítása (worker, Redis, host-adapters); (3) belépés a saját fiókjával a teszten.
   **A 6. szakasz (Hordozhatóság) LEZÁRVA** — `docs/HATODIK-SZAKASZ.md` (E-28…E-32 lépésenként, mérésekkel) és
   `docs/HATODIK-SZAKASZ-ZARAS.md` (az I-1…I-5 feltételek megmérve). A lényeg: ugyanaz a `@km/news-monitor-core` **0.2.0**
   fut a webalkalmazásban ÉS az `apps/referencia-host`-ban (sima `node:http`, `node:sqlite`, saját ütemező, kiszolgálón
   összerakott HTML) — **0 azonos tartalmú fájl** a két host között, a határőr 4 új szabállyal védi. A második host él a
   tesztoldalon: **https://saas.mediapartizan.ro/referencia/** (saját doboz, 132 MB / 256 MB; egy valódi figyelés 78 mp,
   10 találat / 9 kártya, Dell AI, HU+RO). Közös csomagok E-29/E-31 óta: `@km/letolto`, `@km/news-monitor-feliratok`,
   `@km/news-monitor-promptok`. Két valódi hiba derült ki és javult közben: a **CDATA-ba csomagolt cikkek üresen érkeztek**
   (496 AI-hívás 32 cikkre, 27 perc → ~3 perc), és **az AI a román felületen magyarul válaszolt** (a nyelvi keret a
   célnyelven, a prompt elején ÉS végén — mérve a Dellen). Bekötési leírás egy harmadik hosthoz: `docs/HIRFIGYELO-BEKOTES.md`.
   Csapdák, amiket a kirakás talált: a feliratok és promptok **adatfájlok** (a Next önálló csomagja nem viszi — `COPY` kell
   a Dockerfile-ba, különben néma `AI_NEM_ELERHETO`); a `nas/jelszo-kerdes.py` már a tárhelyben van (a `/tmp`-beli elveszett).
   **A 7. szakasz (Pilotkész) ELINDULT** — terv: `docs/HETEDIK-SZAKASZ.md` (E-34…E-40, kb. 24 óra).
   **D-17 eldöntve (Vilmos, 2026-09-08): a regisztráció NYITVA marad, sebességkorláttal**; a jelszó-visszaállítás
   rendszergazda által kiadott, egyszer használatos linkkel megy (nincs e-mail-küldés). **E-34 KÉSZ és kint**
   (2026-09-09): fiókonként 5 rossz jelszó / 15 perc, címenként 20; regisztráció 20 / óra; `belepesi_kiserlet`
   tábla = sebességkorlát **és** hozzáférésnapló; `jelszo_visszaallitas` jegy (lenyomatként, egyszer használatos,
   1 óra); HSTS; óránkénti takarítás; `/api/belso/cim` mérő végpont. Migráció 0034 + 0035.
   **Élőben mérve:** a kérő címét két proxy mögül helyesen olvassuk (`MEGBIZHATO_PROXY_DB=2`), és három hamis
   `x-forwarded-for` elemmel sem kerülhető meg; a zár alatt a HELYES jelszó sem megy át; másik fiók ugyanarról
   a címről bejut. 421 zöld próba összesen. **Tanulság a kódhoz:** az nginx `$proxy_add_x_forwarded_for`-ja
   HOZZÁFŰZ, ezért a címet JOBBRÓL kell olvasni — balról a kérő saját írása jön.
   **Vilmosra vár:** a jelszó-visszaállítás teljes körét (jegy → új jelszó → kiléptetés) egyszer végig kell
   kattintania a saját rendszergazda-fiókjával — nekem nincs rendszergazda-jogom a teszten, és az adatbázishoz
   csak olvasási joggal nyúlok.

   **E-35 (mentés és visszaállítás, A-15) — KÉSZ ÉS A NAS-ON LEMÉRVE (2026-09-09 13:49–13:51).**
   **D-18 eldöntve (Vilmos, 2026-09-09): a mentés a NAS MÁSIK KÖTETÉRE megy** (`/volume1/homes/Portik/mentesek/aitmetica-saas`;
   a projekt a volume2-n él). Elkészült és a felhős másolaton MÉRVE: `nas/mentes.sh` (Postgres-mentés + a referencia-host
   SQLite-ja `VACUUM INTO`-val, mérés + közös kapu, 7 napi/4 heti megőrzés, nem töröl — `_torolni/`),
   `nas/visszaallit-proba.sh` (külön ideiglenes adatbázisba tölt vissza, tábláról táblára összevet, eldobja),
   `docs/MENTES.md` (a valódi visszaállítás lépései is). Mérés: ép mentés → 27 tábla / 3043 sor, 1 mp; csonka → 20 eltérő tábla;
   sérült gz → „A MENTÉS SÉRÜLT"; üres mappa → szól. **A fájlok már ott vannak Vilmos SaaS mappájában is** (nas/, docs/),
   de a git-be MÉG NEM kerültek be.
   **A NAS-on mérve:** a mentés 1 másodperc (adatbázis 248 kB + referencia-host 20 kB), a közös kapun át, a másik
   köteten (`/volume1/homes/Portik/mentesek/aitmetica-saas`); a visszaállítási próba **27 tábla / 4064 sor,
   eltérés 0, 9 másodperc** (a teljes próba 13 mp), az éles adatbázis érintése nélkül. Futtatáskor derült ki egy
   harmadik hiba: a szkript rendszergazdaként fut, ezért a mentésmappa a rendszergazdáé lett Vilmos saját mappáján
   belül — **javítva**: a mappa annak a felhasználónak jut, akié a fölötte lévő mappa (mérve: mind a hat fájl a gazdájáé).
   **HÁTRA VAN E-35-ből egyetlen dolog:** a napi indítás beállítása a Synology feladatütemezőjében — ez Vilmos
   egyszeri kattintása (`docs/MENTES.md` 3. fejezet). Addig a mentés csak kézzel indul.

   **2026-09-09, A HÍD ÁTKÖLTÖZÖTT A GIGABYTE GÉPRE — MŰKÖDIK, MÉRVE.** Előzmény: Vilmos Windows gépén a Cowork
   Linux-munkakörnyezete órákon át nem látta a SaaS mappát („no Plan9 drive shares mounted"), és ezt sem az
   alkalmazás, sem a Windows újraindítása nem oldotta meg.
   **Megoldás (Vilmos javaslata):** a Claude alkalmazás Linux-változata a **Gigabyte** gépen
   (`gigabyte-z390-designare`, Xubuntu, mindig fut, a NAS-sal egy hálózaton) + **Synology Drive kliens 4.2.0-20058**
   ugyanarra a SaaS mappára.
   **Így néz ki az új híd (2026-09-09 13:45-kor mérve):**
   - csatolt mappák: `~/SynologyDrive/SaaS` (= a munkamenetben `$HOME/mnt/SaaS`, benne a vault, a rajzok, a dokumentumok)
     és `~/projektek/saas` (üres munkamappa: forras/kimenet/naplo)
   - **GitHub elérhető** innen; **a NAS is** (`100.89.241.71`, Tailscale) — a `nas/nas-parancs.sh` változtatás nélkül
     megy, mert a vault útvonala ott is `~/mnt/SaaS/vault/...`
   - **a nyilvános tesztoldalt (`saas.mediapartizan.ro`) erről a gépről NEM éri el** (a házi hálózatból a saját
     nyilvános cím nem látszik — ugyanaz, mint a NAS-nál): **kívülről, a felhőből kell mérni**
   - **docker NINCS a gépen** (nem is kell: a dobozok a NAS-on futnak); van git, ssh, curl, node 24, python3, rsync
   - a kód lehozása egy új munkamenetben: `cp ~/mnt/SaaS/vault/github-kulcs ~/gh-kulcs && chmod 600 ~/gh-kulcs`, majd
     `GIT_SSH_COMMAND="ssh -i ~/gh-kulcs -o IdentitiesOnly=yes" git clone git@github.com:Tolgyes/aitmetica-saas.git ~/repo`
     — **`$HOME/repo`, nem `/tmp/repo`**; a munkamenet mappája minden munkamenetnél új, tehát újra kell klónozni
     (a köteten 9 GB szabad hely van)
   **Második lépésként** érdemes visszatérni a D-02 eredeti szövegéhez: **a NAS MAGÁTÓL szedje le a kódot a GitHubról**
   (időzített `git pull` + újraépítés). Akkor a kirakáshoz egyáltalán nem kell hídgép.

   **E-36 (adatpolitika, A-13) — RÉSZBEN KÉSZ: az adatút leírása megvan, a kapcsoló NEM épült meg.**
   **D-19 eldöntve (Vilmos, 2026-09-09):** a kapcsoló csak az AI-hívásra vonatkozna, a hírek letöltése marad —
   de Vilmos jogos kérdése („ez SaaS lesz hostingon, mit jelent ott a helyi AI?") megállította a lépést: élesben
   nincs saját AI-gépünk (a Dell az ő munkaállomása), tehát a kapcsoló olyat ígérne, amit a rendszer nem tud
   betartani. **Döntése: most csak az adatút leírása készül el**, a kapcsoló akkor jön, ha eldőlt, hol fut élesben az AI.
   Elkészült: **`docs/ADATUT.md`** — mi hagyja el a rendszert, mikor, kihez, mérésből. Amit a mérés hozott:
   (1) **a felület a Google betűkészletét tölti** (`fonts.googleapis.com`/`gstatic`, kívülről mérve) — minden látogató
   böngészője a Google-hez fordul; saját kiszolgálóról kiváltható, külön kis lépés, Vilmos döntése; (2) a második
   rendszer (`/referencia/`) egyetlen külső hivatkozást sem tölt; (3) az `ai_hivas` napló a kiküldött szöveget NEM
   tárolja, csak számokat; (4) eddig `helyi-ollama` 769 hívás / `teszt` 49 / `claude-elofizetes` 20 / `codex-elofizetes` 1
   (adatbázisból, olvasva); (5) az előfizetéses út valódi ügyféladathoz nem való (magánelőfizetésen haladna át).
   Visszaellenőrzés: Kimi k2.6, 0,0375 USD — három valódi hiányt talált (DNS-feloldás, a híd-doboz köztes lépése,
   a helyi AI állapotlekérdezése), beírva; két „hibás sorhivatkozás" jelzése viszont téves volt (utánamérve).
   **Az A-13 tehát RÉSZBEN teljesült**, és az E-40 jegyzőkönyvben így kell szerepelnie.
   **E-37 (terhelési mérés) KÉSZ** — `docs/E-37-TERHELES.md`. Mérve a futó rendszeren: **a szűk keresztmetszet az AI
   ideje**, nem a memória/lemez/web. Egy új cikk feldolgozása **5,8 mp** (11 valódi futás átlaga); a rendszer egyszerre
   EGY munkát futtat és egy AI-gép van, ezért **kb. 120 ügyfél** fér el, ha a napi futások egy 6 órás ablakban oszlanak
   el (egy órába zsúfolva csak ~20). Látogatói terhelés kívülről: **60 egyidejű látogató, 300 kérés, mind hibátlan,
   985 ms középső válaszidő**, az alkalmazás 143 MB / 512 MB. Lemez: egy cikk 3,3 kB → ~4,3 GB/év 120 ügyfélnél.
   **Talált tennivaló:** a referencia-host munka nélkül a memóriakorlátja 64%-án ül (164/256 MB) — valódi terhelés
   előtt emelni kell. A NAS-t szándékosan nem hajtottam törésig (öt projekt fut rajta).
   **E-38 (nyelvi lektorálás) — a GÉPI kör KÉSZ és kint, az EMBERI kör hátravan (D-20).** 677 kulcs / 2031 sor átnézve
   két AI-lektorral, egy harmadik ágens felülbírálta, a maradékot magam néztem át: **365 javaslatból 48 ment be**
   (41 román, 7 angol) — 201 „javaslat" szó szerint a meglévő szöveg volt, a felülbíráló 114-et elvetett, és **én kettőt
   vettem ki, mert hibát vitt volna be** („Create a account", és névütközés az „Overview" lapnévvel). Migráció **0036**,
   az app újraindítva (a feliratok a kiszolgálón gyorsítótárazódnak!). Kívülről mérve: a román belépőlap címe
   `Autentificare — Spațiu de lucru de comunicare`. **Tanulság: lektor-ágens kimenetét ránézés nélkül nem szabad
   beengedni — a javaslatok 13%-a volt jó.** Az A-16 korlátja kimondva: a RO/EN szöveget eddig csak gépek nézték.
   **E-39 (AI-költség és keret szervezetenként) KÉSZ ÉS KINT.** Rajz: `design/e39/` (Vilmos jóváhagyta). Migráció 0037:
   `szervezet.ai_keret_usd` + két SECURITY DEFINER függvény (csak összesítést adnak). `keretEllenoriz(szervezetId)` mostantól
   SZERVEZETENKÉNT mér, a rendszerkeret külön fék (`AI_RENDSZER_KERET_USD`, alapból az ügyfélkeret tízszerese).
   `/koltseg` két nézettel (rendszergazda: minden szervezet + keretállítás; tag: a sajátja), `/api/koltseg`,
   `/api/koltseg/osszes`, `/api/koltseg/keret`. A lap **hívásszámot, AI-gépidőt ÉS költséget** mutat, mert a munka java
   a házon belüli gépen fut (0 dollár) — az E-37 mérése miatt. **10 új próba**, köztük a bizonyíték: nulla kerettel az
   AI-hívás 429, visszaállítás után 200. Kívülről mérve a kirakott rendszeren: 401/403/403/200 a várt helyeken, valódi
   AI-hívás után 1 hívás / 7 071 ms a lapon. A képernyőkép egy `{n}` helyettesítő-hibát talált — javítva, újra kirakva.
   **Két saját hiba javítva:** az `apps/web/app/tokenek.css` (E-16-ban törölve, a 6. szakasz visszahozta, 35 tokenőr-sértés)
   újra törölve; az E-38 három `hf.*` szövege a modul adatfájljába is bekerült.
   **A fiókoldal oldalsávjában egy link mutat a lapra — ez NEM volt a rajzon, de enélkül nem elérhető (jelölve a kódban).**
   **E-40 KÉSZ — A 7. SZAKASZ (Pilotkész) LEZÁRVA (2026-09-09).** `docs/ELFOGADASI-JEGYZOKONYV.md` (A-01…A-16:
   **14 teljesült, 2 részben** — A-13 és A-16, mindkettő tudatos döntés; 11 néven nevezett kockázat; 5 nyitott döntés)
   és `docs/UZEMELTETES.md` (mi hol fut, napi/heti teendők, mit tegyünk ha baj van, mit nem csinálunk soha).
   A szakasz feltételeiből J-1, J-2, J-5, J-6 teljesült; J-3 és J-4 részben.
   **VILMOSRA VÁR (a pilot előtt):** (1) a napi mentés beállítása a NAS feladatütemezőjében; (2) a jelszó-visszaállítás
   egyszeri végigkattintása a rendszergazda-fiókjával; (3) D-20: ki nézi át anyanyelvi szemmel a román szöveget;
   (4) D-21: ki az üzemeltetési felelős és hogyan szóljon a rendszer; (5) hol fut élesben az AI (ettől függ az A-13
   lezárása); (6) az előfizetéses AI-út leváltása valódi ügyféladat előtt; (7) a Google-betűkészlet kiváltása;
   (8) házon kívüli mentés; (9) a D-05 (jelszó nélküli teszt) újratárgyalása valódi ügyféladat előtt.
   **A fejlesztés következő kérdése már nem műszaki: az első valódi pilot-ügyfél.**

   **E-41 (nyilvános nyitólap) KÉSZ ÉS KINT — a 7. szakasz zárása után, 2026-09-09.** Vilmos vette észre, hogy a főoldalon
   még az E-1 egysoros lapja volt; a tervet a **Claude Design** készítette (`design/nyitolap/`, teljes csomag:
   `design/aitmetica-felulet-prototipus-v8.zip`). **Négy új méret-token** került a közös témába a rajz miatt
   (`--fs-hero`, `--fs-hero-sm`, `--fs-szekcio`, `--fs-zaro`) — a zod sémában, a TOKEN_SZABALYOK táblában és a
   Theme-felület Tipográfia szekciójában is; Vilmos döntése volt, hogy token legyen belőlük, ne beégetett pixel.
   Elkészült: `apps/web/app/Nyitolap.tsx` + `nyitolap.css` (token-only), a `/adatkezeles` lap (a rajz hivatkozásának célja;
   kimondja, hogy a tájékoztató még készül), migráció **0038** (57 kulcs három nyelven). Kívülről mérve: a főoldal
   magyarul és románul 200, a CSS kiszolgálva, a négy új token a `:root`-ban, a nyelvválasztó asztalon teljes névvel,
   telefonon HU/RO/EN-nel. **A képernyőkép talált egy hibát** (telefonon a teljes nyelvnév jelent meg a rövidítés helyett) —
   javítva, újra kirakva. **Helykitöltők Vilmosra várnak:** `[KAPCSOLAT]`, `[ÁRAZÁS]`, és az adatkezelési tájékoztató szövege.
   A képernyők építésének tanulsága: egy DeepSeek ágensnek egy lap ≤ ~450 sor — a nagyobbat ketté kell vágni (űrlap / mellékkomponens+CSS), különben ismétlődő sorokba fut. Flotta-tanulság: párhuzamos ágensek EGY `device_bash` hívásban, `wait`-tel, mindegyik ≤170 mp;
   a hívás végén a háttérben maradó folyamat meghal. A zipben lévő
   Hírfigyelő-prototípus (`Hirfigyelo-prototipus.dc.html` + `HIRFIGYELO-ATADO.md`) az **5. szakasz**: az E-18 után terv készül róla
   (mint a NEGYEDIK-SZAKASZ), a döntéseket egyenként visszük Vilmos elé, kód csak a „mehet” után. Párhuzamos munkamenet (D-10): az előfizetéses AI-híd kint van, `docs/D-10-ELOFIZETES.md`.
   **Nyitott, Vilmosra vár:** (a) Anthropic-kulcs a `vault/anthropic-key.txt`-be (addig teszt-csatlakozó); (b) kell-e a
   v6 „Minta betöltése” linkje az 1. lépésre.
3. Ágensek: `tools/agens/agens.py` a gépén fut (kulcsok a vaultban), feladatok a `tools/agens/feladatok/`
   mappában — a feladatokat 1–3 perc alatt megválaszolható darabokra kell vágni (`docs/KIRAKAS.md`). — tárhely váza, határőr, és az első valódi alkalmazás a tesztoldalon.
   A lépés előtt kötelező a `NAS-szabalyok.md` szerinti ellenőrzés (`free -m`, `uptime`).
   **Fizetős ágens ehhez nem kell**, egyedül elvégezhető.
3. A fizetős ágensek kulcsai a `vault/agens-kulcsok.txt` fájlba (DeepSeek, Kimi, OpenAI) — csak a
   nehezebb lépésekhez (E-3-tól), nem az E-1-hez. Most nincsenek ott, más projektben használja őket.

## 9. A mai nap tanulságai — ezeket ne kövesd el újra

- **Ne futtass egész lemezt végigmérő parancsot a gépein.** Ez ma megtörtént, és tetézte a bajt.
  A `nas-parancs.sh` már tiltja, de a tiltólistát megkerülni tilos.
- **Ne dolgozz párhuzamosan ugyanazon a gépén egy másik munkamenettel.** Írd be a naplóba, mit
  indítasz és meddig tart, és nézd meg, fut-e már ott valami.
- **Ne küldd Vilmost olyan úton, amit magad nem ellenőriztél.** Ma kétszer megtörtént
  (nem létező oszlop a kezelőfelületen, rossz feltételezés az adatellenőrzésről).
- **Ne tűnj el időmegjelölés nélkül.** Minden munka előtt: mit csinálsz, meddig tart.
- **„Add ide", nem „add oda".** Ha magadnak kérsz tőle valamit, az „ide".
- **Ne állítsd tényként, amit dokumentumból tudsz.** Mérd meg, és mondd meg, honnan mérted.
- **(E-1) A NAS dobozkezelője nem tud `cpus:` korlátot** (a rendszermag nem támogatja) — a `mem_limit`
  megy. Emiatt az első indítás elhasalt és a tesztoldal ~20 másodpercig nem felelt. Új compose-beállítást
  előbb a NAS-on kell kipróbálni, mielőtt a régi doboz leáll.
- **(E-1) A NAS a saját nyilvános címét nem éri el** (`curl https://saas...` a NAS-ról időtúllépés) —
  kívülről a felhőből mérj, vagy a NAS-on `--resolve saas.mediapartizan.ro:443:127.0.0.1`-gyel.
- **(E-6) Minden kirakásnál ~5 mp kiesés van a dobozcsere alatt** — Vilmos egy 502-t kapott. Elfogadott a
  teszten; ha zavar, külön kis lépés: két app-doboz felváltva (kék–zöld), az nginx átkapcsol.
- **(E-6) A gép Linux-munkakörnyezetében a tárhely-másolat fájljai csak olvashatók lehetnek** (`cp` Permission
  denied) — `chmod u+w` vagy `cat >` segít.
- **(2026-09-07, E-16) Párhuzamos munkamenet: a push előtt `git fetch` + rebase, és a KÓDOT is újra kell ellenőrizni az egyesített fán**
  (a D-10 munkamenet 8 commitja közben ment ki; egyesítés után derült ki, hogy egy E-3-as, E-4 óta nem használt `tokenek.css` a
  tárhelyen maradt és a tokenőrt elbuktatta — törölve). A `kirak.sh` a másik munkamenet változatával ment (közös kapu, `--hid`).
- **(2026-09-07, E-16) A gép Linux-környezetében a háttérbe tett ágenshívás a parancs végén meghal** (E-3 tanulság, megint
  elkövetve: a fordító üres kimenetet adott) — ágenshívás csak szinkronban.
- **(2026-09-07, E-14) A Next az útvonalakat külön csomagokba fordítja — egy modulszintű gyorsítótár útvonalanként külön
  példány.** Az API alkalmazása nem ürítette a lap fejének gyorsítótárát, a téma 60 mp-ig a régi maradt. Megosztott állapot a
  kiszolgálón: `globalThis`-en (`apps/web/tema/tar.ts`), vagy egyáltalán ne legyen memóriabeli.
- **(2026-09-07, E-13) Az rsync a tárhely-másolatból a SaaS-mappába FELÜLÍRJA azt, amit oda más ír** — az ágens-futtató a
  `SaaS/docs/agens-naplo.jsonl`-be naplózott, az rsync a tárhely régi példányával felülírta: az E-9…E-13 részletes sorai
  elvesztek (a `docs/AGENSEK.md` táblájából pótolva, jelölve). Javítva: a futtató a `/tmp/repo` naplóba ír. Szabály: a
  tárhely-másolat az igazság, a SaaS-mappába csak onnan megy adat; ami a SaaS-mappában születik, előbb a tárhelyre kerül.
- **(2026-09-10, E-46) A KIRAKÁS FORDÍTÁSA ÁTKERÜLT A GIGABYTE-RA — MŰKÖDIK, MÉRVE.**
  A fordítás 4–5 percről **65 másodpercre** csökkent, és a NAS terhelése közben **meg sem mozdult**
  (1,6 előtte, 1,6–1,7 közben). A kész dobozok 170 MB-os csomagban mennek át; a NAS-on a betöltés
  másodpercek. A két Docker verziókülönbsége (29.6.1 vs 24.0.2) nem okozott gondot, mert a fordítás
  a `--provenance=false --sbom=false` kapcsolókkal megy — ezek nélkül a `docker load` elutasíthatja.
  Az új lépések: `kirak.sh` (fordítás a Gigabyte-on) → `--allapot` → `--kepek` → `--betolt` → `--indit`.
  **A beállítás, ami ehhez kellett és MOST MÁR ÁLL:**
  (1) `~/bin/claude-forditas.sh` a Gigabyte gazdagépén, az authorized_keys `command=` megkötésével
  — a kulccsal csak ez a szkript futtatható, és csak négy művelet (allapot/epit/naplo/kuld);
  (2) a kulcs privát fele a vaultban: `vault/gigabyte-forditas-kulcs`, a hídon `~/eszkoz/gigabyte-kulcs`;
  (3) a repó a gazdagépen: `/home/gigabyte/projektek/saas` (ez EGYBEN csatolt mappa is, tehát a
  hídból is látszik), a GitHub-kulcsa a `.git/saas-kulcs`, `core.sshCommand`-dal beállítva.
  **Két buktató, amibe belefutottunk:** a `git clone` nem megy nem üres mappába (init+fetch+checkout
  kell helyette), és a szinkronizált mappában lévő kulcs jogai miatt az ssh „bad permissions"-t mond.
  **FONTOS a következő munkamenetnek:** a hídban lévő `~/repo` és a gazdagépen lévő
  `projektek/saas` KÉT KÜLÖN másolat. A commit a hídból megy GitHubra, a fordító gép onnan húzza le
  — ezért **push nélkül a fordítás a RÉGI kódot építi.** Mindig push, aztán `kirak.sh`.

- **(2026-09-10) D-22 — MUNKAMEGOSZTÁS A HÁROM GÉP KÖZÖTT.** Vilmos döntése, két lépésben.
  Előzmény (2026-09-06-i NAS-összeomlás után): **a NAS nem fordít.** Pontosítás (2026-09-10):
  **minden AI-munka a Dellen, minden hagyományos fejlesztői munka — repók, fordítás, csomagolás,
  a kirakás indítása — a Gigabyte-on, a NAS pedig csak futtat.**
  Miért nem a Dell fordít, pedig erős gép: a nyelvi modell akkor gyors, ha bent van a memóriában
  (mérve 2026-09-08: hidegen 41,5 mp, melegen 3,8 mp/cikk), a fordítás pedig kiszorítja.
  Ha a Gigabyte nincs bekapcsolva, a kirakás VÁR — sem a Dellre, sem a NAS-ra nem megy át.
  Tudatos kivétel: a Gigabyte-on ma is fut néhány kisebb AI-szolgáltatás (whisper, TTS, beszéd);
  ezek maradnak, amíg nem zavarják a fordítást.
  Mérve 2026-09-10 a gazdagépen: `gigabyte-z390-designare`, i9-9900K, 8 mag / 16 szál,
  **46 GiB memória (41 szabad)**, **468 GB NVMe, 345 GB szabad**, **Docker 29.6.1**. A `/` maga az
  NVMe, tehát a Docker is ugyanott tárol. A gép készen áll a fordításra.
  (A hídon át csak 2 mag / 3,9 GB látszik — az a híd munkakörnyezete, nem a gazdagép.)
  **AZ ELSŐ KIRAKÁSNÁL KI KELL PRÓBÁLNI:** a Gigabyte Dockere 29.6.1, a NAS-é 24.0.2. Az újabb
  Docker alapból más csomagolásban menti ki a kész dobozt, amit a régebbi `docker load` elutasíthat.
  Ha előjön: `docker build --provenance=false --sbom=false`, végső esetben `DOCKER_BUILDKIT=0`.
  A repó helye a Gigabyte-on: `/home/gigabyte/projektek/<repo>` — a `projektek/saas` mappa
  csatolva van, de ÜRES; a munkamenetek eddig a híd ideiglenes munkaterületére klónoztak, ami
  a munkamenet végén eltűnik.
  Útmutató a kollégáknak: `docs/MELYIK-GEP-MIT-CSINAL.md`.
  **A SaaS saját kirakása (`nas/kirak.sh`) MÉG A NAS-ON FORDÍT — ez a döntéssel ellentétes, át kell állítani.**

- **(2026-09-10, E-44) A modell mérése nem mérés — az EREDMÉNYT kell mérni.** A fotó-fátyol kontrasztját
  úgy mértem, hogy a szöveget elrejtettem, és csak a hátteret néztem: 12:1 jött ki, minden rendben. Élesben
  a fátyol RÁFEKÜDT a szövegre, mert a háttérréteg pozicionált volt, a tartalom nem — a képernyőképen látszott
  meg, hogy a hero cím alig olvasható. Azóta a mérés a szöveget is nézi (a szövegdoboz legvilágosabb képpontja
  a betűszín közelében kell legyen). Szabály: minden mérés a MEGJELENŐ eredményre irányuljon, és minden kör
  végén nézd meg a képernyőképet — kétszer egymás után ez találta meg azt, amit a szám nem.
- **(2026-09-10, E-43) A `width: 100%` nem teljes szélesség, ha a doboz content-box.** A gomb belső margója
  hozzáadódott: 390 px-es ablakban a jobb széle 423-nál volt, és a lap `overflow: hidden`-je EL IS REJTETTE
  a tünetet — nem lett görgetés, csak levágódott. A `box-sizing: border-box` javította, és mellesleg a gombok
  magasságát is rendbe tette (70 px helyett a rajz szerinti 49).
- **(2026-09-10, E-44) Új alaptoken bevezetése MIGRÁCIÓT is igényel.** Az E-41 négy méret-tokenje nem került
  bele az adatbázisban tárolt közös témába, ezért az azóta nem ment át az ellenőrzésen, és a rendszer némán a
  csomag tartaléktémájára esett vissza (mérve: 46 tárolt token az 53-ból). A betöltés azóta ÖNJAVÍTÓ (a hiányzó
  tokent a csomag alapjából pótolja), és a 0040 migráció kiegészítette a tárolt témát úgy, hogy a már tárolt
  érték nyer. Új token bevezetésekor mindkettőre gondolj.
- **(2026-09-10, E-44) A tokenőr a `color-mix(`-et is tiltja a felületi fájlokban.** Ha egy rajz színkeverést
  kér (fátyol, átmenet), az a DESIGNRENDSZERBE megy: ott születnek a tokenek, ott megengedett. A lapba csak
  kész token kerül. Ugyanez a `font-size: clamp(var(...))`-ra: a szabály közvetlenül tokent követel.
- **(2026-09-09, E-42) A mérés HELYE része a mérésnek.** A zi-de-zi.ro-t a felhőből mértem, 403-at kaptam, és
  kijelentettem, hogy az oldal nem figyelhető. Vilmos javított ki: az oldalt egy másik projektje naponta olvassa.
  A NAS-ról (onnan fut a letöltő) 200 jött. Szabály: onnan mérj, ahol a munka VALÓBAN fut, és egy próbából soha
  ne legyen általános állítás.
- **(2026-09-09, E-42) A felhasználótól nem kérünk technikai tudást.** Ez a rendszer célközönsége nem tudja, mi az
  a protokoll vagy hírfolyam — és nem is kell tudnia. Amit begépel (`zi-de-zi.ro`), abból nekünk kell működő
  forrást csinálni: cím kiegészítése, átirányítás követése, hírfolyam megkeresése. Ha valamit nem tudunk, a
  hibaüzenet EMBERI mondat a valódi okkal, nem gépi kód és nem a legelső odaillő sablonszöveg.
- **(2026-09-09, E-42) Ha nincs törlés, ne engedd be a szemetet.** A forrásoknál nincs törlés, ezért az
  értelmezhetetlen cím mentése örök szemetet hagyott volna. Általánosan: mielőtt bekerül valami, nézd meg,
  ki lehet-e venni.
- **(2026-09-07, E-12b) A kód szerkezetét is mérni kell az alapterv ellen, nem csak a képernyőt a rajz ellen.** Az
  ALAPTERV modultáblájában szereplő `profile-core` és `onboarding-core` tizenkét lépésen át nem készült el (a terv
  „nem mind az első napon” engedményét kihasználtam, a határ csak papíron volt). Vilmos vette észre. Szabály: a
  modulhatár a határőrben él; egy csomag az első valódi feladatánál jön létre; minden egység zárásakor a modultábla
  ellen is mérünk (EGYUTTMUKODES 18.).
- **(2026-09-07, E-12 után) A csupasz címeket is végig kell próbálni** (`/onboarding`, `/fiok`, `/onboarding/`), nem
  csak a képernyőket: az `/onboarding` lépésszám nélkül 404 volt, Vilmos találta meg a zárás után.
- **(2026-09-07) Egy pontosítás miatt NEM állhat meg a munka** — Vilmos aludt, a munka órákig állt egy
  kérdés miatt. Amíg a válasz késik: minden, ami nem függ tőle, megy tovább; a tömör „Következő"/„mehet"
  az utoljára kérdezett dologra igen.
- **(2026-09-07) A gép Linux-munkakörnyezete újraindulhat** (a `/tmp/ap.py` és a `/tmp/repo` eltűnhet) —
  a `nas-parancs.sh` előtt ellenőrizd, és pótold (a HANDOFF 3. pontja szerint; az `ap.py` a vault
  `nas-belepes.txt` jelszó-sorát adja az ssh-nak).
- **(E-3) A db doboz a csatolt forrásmappa RÉGI példányát látja a forrás cseréje után** (a mv + új mappa
  miatt) — ezért a migrációk nem futottak le először. A `kirak.sh --indit` most újraalkotja a db dobozt.
- **(E-3) A gépén (Cowork híd) a háttérbe tett folyamat a parancs végén meghal, egy parancs max 3 perc** —
  ágenshívás csak szinkronban, rövid feladatokkal. A gondolkodó Kimi-modell (k2.7-code) üres választ ad,
  ha a keret elfogy; a k2.6 gondolkodás nélkül jó.
- **(E-2) A NAS dobozkezelője (24.0.2) a csatolt mappát nem hozza létre magától** (`adatok/postgres`) — a
  `kirak.sh --indit` most létrehozza. **(E-2) Az adatbázis első indításkor kétszer indul** (előbb a kezdeti
  feltöltés, aztán a végleges) — a `pg_isready -h localhost` a jó várakozás, a socketes túl korán mond igent.
- **(E-2) Lezárt tranzakció után a `SET LOCAL` beállítás üres szöveg lesz, nem NULL** — a védelmi szabályban
  `nullif(current_setting(...), '')` kell, különben a következő kérés hibát dob.
- **(E-2) Amit egyszer kijavítottál a tárhelyen, javítsd a felhős forrásban is** — a `cpus:` sor a második
  kirakásnál visszajött a felhőből, és megint elhasalt az indítás (kiesés ezúttal nem volt).
- **(E-1) A dependency-cruiser a TypeScript 7-et nem érti** — a határőr saját TS 6-ot kap (`tools/hatar`),
  a termék marad 7-en. Az ADR-001 kockázatának első esete, kezelve.
