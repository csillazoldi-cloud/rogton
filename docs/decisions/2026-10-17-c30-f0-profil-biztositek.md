# 2026-10-17 — c30 F0: profile safety net (forward-compatible schema, tolerant read, merge write, re-approval keeps everything)

**Decided by:** Csilla approved starting F0 on 2026-10-17 (plan c30, `docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md`, chunk F0, §1.1,
§1.7, §8 risks 1–4, §10). **Requirements:** R-01 (client specifics live in configuration, so the profile must be able to grow
without breaking older code), A-11 (tenant separation). **Visible change:** none. **Migration:** none. **RLS:** unchanged.
**Vilmos:** plan §9 item 6 (`SzervezetProfil.loose()`) is on his batched sign-off sheet; it is a schema-tolerance change, not an
exposure change (input schemas stay non-loose).

## Why

The plan found three latent data-loss traps in the profile path (§1.1) and a fourth race (§8 risk 4). F0 ships alone, BEFORE any
new profile field is written, so this version is the rollback floor for every later chunk (F1–F11).

| Risk (plan §8) | Before | After F0 |
|---|---|---|
| 1. A read failure looks like "no profile" → onboarding → re-approval overwrites | `betolt` returned `null` on ANY parse error | `betolt` parses tolerantly: a bad/unknown non-core field is left out of the returned profile and logged; the profile still loads |
| 2. Rollback strips new keys | `SzervezetProfil` was a plain `z.object` (strips unknown keys) | `.loose()` (zod 4.5.4, measured in `packages/contracts/node_modules/zod`): unknown stored keys pass through; `ment` also writes back stored keys it cannot represent |
| 3. Re-approval drops fields not on the whitelist | explicit whitelist (`hivatalos_nevek` + round-7 list) | previous profile first (read RAW), then the draft's own fields over it; no whitelist |
| 4. Concurrent full-jsonb overwrite | only `ment` (rewrites all of `adatok`) | `profilTar.mezoMent(id, patch)` = `UPDATE … SET adatok = adatok || $1::jsonb` inside `szervezetKent` |

## What changed

- `packages/contracts/src/index.ts` — `SzervezetProfil` is `.loose()`. `ProfilModositas` and the other input schemas are unchanged
  (non-loose: unknown client keys are still dropped). Nested objects (arculat, kinalat rows, tema_terv rows, hivatalos_nevek rows)
  still strip unknown sub-keys: a new NESTED field needs its own rollback-floor deploy first (or goes top-level).
- `packages/profile-core/src/index.ts` (pure, no DB):
  - `PROFIL_MAG` — the core, derived from the schema (required fields with no default): nev, osszefoglalo(+_forras),
    celkozonseg(+_forras), cel(+_forras), nyelvek(+_forras), hangnem_leiras, hangnem_minta, hangnem_nyelv, hangnem_forras, arculat,
    kesobbre, jovahagyva, jovahagyta. `PROFIL_MAG_TIPUS` is the same list as a type; a test keeps them equal.
  - `profilTureloOlvas(nyers)` — full parse; on failure, every top-level field whose value does not parse is left out (`kihagyott`)
    and the rest is re-parsed. `kesobbre` is derived (recomputed on every change), so unknown entries in it are filtered, not fatal.
  - `profilMentesre(tarolt, uj)` — what a full save writes: the new profile + every stored key the new profile does not carry AND this
    version cannot represent (unknown key, or an unparseable value). A known, valid key that the caller left out is still removed,
    exactly as before — so no existing save path changes meaning.
  - `profilMezokEllenoriz(patch)` — the merge patch: known NON-core keys only, each parsed by its own field schema (trimmed, defaults);
    unknown keys, core keys, `null` and empty patches are refused before SQL.
  - `ProfilTar` gains `mezoMent`.
- `apps/web/profil/tar.ts`:
  - `betolt` uses `profilTureloOlvas`. **It returns `null` only when:** (a) there is no row, or the row is not visible under RLS;
    (b) the stored jsonb is not an object; (c) a core field (`PROFIL_MAG`) is missing or invalid. (a) is normal; (b)/(c) are logged
    as `[profil] … nem olvasható (NEM_OBJEKTUM|HIBAS_MAG)` with the field names (never the values).
  - `ment` reads the stored row `FOR UPDATE` in the same transaction and writes `profilMentesre(...)`; preserved keys are logged.
  - `mezoMent(id, patch)` → `szervezetKent(id, tx => mezoMentTx(tx, id, patch))`; UPDATE only (a merge never creates a profile);
    returns the number of rows updated. The `frissitve` column is stamped; the jsonb `frissitve` only if the patch carries it.
  - `profilNyersen(id)` — the raw stored jsonb, for re-approval only.
- `apps/web/onboarding/jovahagyas.ts` — re-approval: the draft is validated alone as before (same `ERVENYTELEN_ADAT` errors), then
  `profilTureloOlvas({ ...previousRaw, ...draftProfile })`; the draft's `weboldal` still overrides `honlap` when filled.
  Because the previous profile is read raw, even a stored profile with a broken core keeps its other fields (the draft supplies a
  valid core), and unparseable previous values go back into the row through `ment`.
- Existing call sites (`profilModosit`, `hivatalosNevekMent`, `kinalatMent`, `arculatMent`) are unchanged. `arculatMent` still refuses
  to write when the stored profile does not parse strictly (its own R1 rule) — safe, and with `.loose()` it keeps unknown keys.

## Rules for later chunks (F1+)

1. New profile fields are optional, written through `profilTar.mezoMent`, and added to the schema in the same deploy that first
   writes them. Never a migration that rewrites `szervezet_profil.adatok` (plan §1.7).
2. Never make a new field required (that would put it in the core and make old rows `HIBAS_MAG`).
3. Never widen a CORE field's enum or limits in the same deploy that first writes the new value: ship the widening first.

## Measured (2026-10-17, Cowork VM, disposable Postgres 18.4 from scratch with all 172 migrations, the app built with `next build`
## and run with the test AI connector — not the NAS)

- `apps/web/probak/c30-f0-profil.proba.ts`: 12/12 green (7 pure, 5 live incl. A-11 as `km_app`).
- Mutation check: with the old whitelist re-approval the re-approval test fails (future key dropped); with the old full overwrite in
  `ment` the garbage test fails (raw value lost).
- apps/web suite before 924 tests / 892 pass / 16 fail / 16 skipped → after 936 / 904 / 16 / 16; the failure list is identical.

## Open

- The plan's E2E "approve → re-approve on the TEST DB (NAS), then diff the jsonb" was run on the local disposable DB only (no NAS
  access in this session); repeat it on the test site after deploy.
- Re-approval still replaces `arculat` with the draft's arculat (a draft field, pre-existing behaviour). Not changed by F0; flag for
  Csilla if re-approval of an org with an approved brand is a real path.
