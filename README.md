# Rögtön

An AI communications workspace for small companies: a company is set up once, then the machine watches the news,
drafts social posts and makes branded images in the company's own voice. The owner only approves.

This repository is a frozen, self-contained fork. Hungarian-only interface; content languages stay per organisation.

## Layout

| Path | What |
|---|---|
| `apps/web` | the Next.js application (UI, API, background news runner) |
| `apps/kepgyar` | the image maker (Node + headless Chromium), internal service |
| `apps/proba-host` | a minimal second host used by the module-portability tests |
| `packages/*` | the modules (contracts, design system, cores, adapters) |
| `uzem/` | operations: DB init + migration runner (compose, nginx, deploy script follow) |
| `tools/hatar` | the boundary, token, frame and Dockerfile guards (`pnpm hatar / tokenor / keretor`) |
| `tools/tibor-proba`, `tools/tibor-biro` | screen-simplicity checks |
| `docs/` | module rules and decisions |

## Checks

```bash
pnpm install --frozen-lockfile
pnpm ellenoriz        # hatar, tokenor, keretor, terkoz, dockerfile-or, tipus, epit
pnpm -r --if-present run proba
```

Node 24 and pnpm 10.28 are required (`engine-strict`). The web tests need a local Postgres 18 with the migrations
applied and the app running.

## Deploy

Being rebuilt for a single host behind `127.0.0.1:8410`; see `uzem/` once it lands.
