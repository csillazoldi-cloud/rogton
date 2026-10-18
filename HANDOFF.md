# HANDOFF — Rögtön (newest on top)

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
