# Rögtön — entry point for Claude

Read in this order, do not re-explore what they say:

1. this file — how we work;
2. `HANDOFF.md` — where the work is (newest entry on top);
3. `docs/MODULSZABALY.md` — how every reusable module is built (mandatory before a new module);
4. `uzem/README.md` — how the app runs and deploys.

## What this is

A multi-tenant AI communications workspace: a company is set up once, the machine then watches the news, drafts posts
(FB/IG/LI) and makes branded images in the company's voice. Display name **Rögtön**, slug `rogton`.
This repo is a frozen fork: it does not track any upstream, and nothing from the upstream's infrastructure applies here.

Requirement and acceptance IDs in old code comments (R-xx, A-xx, F-x, c-x) refer to the upstream specification, which is
not part of this repo. New work references a decision in `docs/decisions/` or carries its own reason.

## Non-negotiables

- Hungarian-only interface (`FELULETI_NYELVEK = ['hu']`); the organisation's content/AI output language stays its choice.
- Full theming: no colour, font, size, weight or radius hard-coded in a component — tokens only, `pnpm tokenor` = 0.
- Module boundaries are law: `pnpm hatar` must stay green (the 2 known cycles in `apps/web/profil` ↔ `apps/web/vizual` are the only tolerated violations until fixed).
- Tenant data is always separated: organisation context everywhere, row-level security.
- All UI text comes from label keys (`felirat`), added through a NEW migration. An applied migration file is never edited.
- Banned strings (the list in `tools/tiltott/minta.txt`: old product, company, place and team names, private hosts and IPs) never reach the image, the DB labels or a served page. `pnpm tiltott` is part of `ellenoriz`; `uzem/kirak.sh` runs the same guard on the built image, on the DB labels after the migrations and on the running site, and stops the deploy on any hit. Tolerated places are listed with a reason in `tools/tiltott/engedett.txt`.
- Secrets live only in the host's `.env` / secret files, never in the repo, never printed.

## How we work

1. **Discuss first, then code.** Repeat back how you understood the request and wait for the word. Once something is discussed, drawn and decided: code it immediately.
2. **Silence is not permission.** Don't build your own suggestion that got no answer.
3. **Every screen starts from a drawing.** Nothing on screen that isn't on the drawing; anything missing from it is a question, not improvisation.
4. **No dead controls.** A button, toggle or field ships only with the machinery behind it.
5. **Never remove an existing feature without an explicit yes.**
6. **"Done" = deployed + checked on the live screen + a screenshot was sent.** Otherwise say "not done" or "I couldn't test it".
7. **A document is not a fact.** Measure the live system first and say where you measured from.
8. **Small steps, each deployed right away.**
9. **Tests are never silently changed.** If an expectation moves, the reason goes in its place.
10. **Realistic test data:** Hungarian accents, spaces, commas, long names.
11. **Never delete data:** retire or move to `_torolni/`.
12. **When something breaks:** get the exact error line before guessing.

## The Tibor filter

Every screen is judged by a tired small-business owner on his phone in the evening. If he doesn't understand something at
first sight, he doesn't press it. One page, one question; one primary button; show results, not machinery; everything
pre-filled; little text; phone first (390 px). Tools: `tools/tibor-proba`, `tools/tibor-biro`.

## Checks before every push

`pnpm tipus`, `pnpm hatar`, `pnpm tokenor`, `pnpm keretor`, `pnpm epit` + `pnpm tiltott`, the unit tests (`pnpm -r --if-present run proba`).
`pnpm ellenoriz` runs the chain.
