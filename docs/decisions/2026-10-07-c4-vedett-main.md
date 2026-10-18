# 2026-10-07 — c4: protected main (gate inside the Gigabyte robot)

**Decided by:** Csilla, 2026-10-07 14:54, on the plan `docs/plans/c4-vedett-main.md` (summary: `docs/plans/c4-vedett-main.html`).
All nine open questions take the recommended default.

| # | Question | Decision |
|---|---|---|
| Q1 | Deploy when "no worse than the baseline", or only all-green? | **No worse than the baseline.** |
| Q2 | Quiet period after the last push | **2 minutes.** |
| Q3 | May a commit add to the known-failures baseline? | **Yes, with a reason; the robot announces it loudly.** |
| Q4 | Notification channel | **The c7 Telegram bot to Csilla; local file as fallback** (`~/.local/state/gigabyte-robot/uzenetek.txt`). **Changed 2026-10-09 07:58 (Csilla):** the bot posts to the team group (Csilla, Kati, Vilmos — not developers), so Telegram gets only a plain Hungarian sentence from `tools/gigabyte-robot/uzenet-szovegek.txt` (no SHA, commit subject, paths or technical words); a successful deploy sends nothing. The technical detail stays in the local file. |
| Q5 | Migrations must be additive (the previous app keeps working on the new schema) | **Yes.** It is what makes the automatic app rollback safe. |
| Q6 | GitHub branch protection | **Only "no force-push, no deletion" on `main`.** No required PRs or status checks. |
| Q7 | Test migrations on a copy of NAS data | **No.** From-scratch DB in the gate; manual `BEGIN…ROLLBACK` dry run on the NAS stays for risky migrations. |
| Q8 | The 2 import cycles and F-11 | **Fix F-11 in K1; baseline the 2 hatar cycles with a reason** (own hub chunk to fix them). |
| Q9 | ~8–12 min from push to live instead of ~1–2 | **Accepted.** |

## Security items (Vilmos's area)

Three items in the plan need Vilmos's sign-off (plan §8):

1. the Telegram bot token stored on the Gigabyte (`~/.config/gigabyte-robot/telegram`, mode 600);
2. GitHub: block force-push and deletion on `main`;
3. the rule that the robot may refuse a deploy.

**Csilla approved 10-07, on Vilmos's behalf; Vilmos to see it on the hub.** Vilmos has not signed these himself.

## What this means in practice

- Switch-on is one setting on the Gigabyte: `KAPU=1` in `~/.config/gigabyte-robot/beallitas`. Without it the robot runs the old
  path unchanged (`tools/gigabyte-robot/robot-regi.sh`).
- The baseline lives in `tools/kapu/ismert-bukasok.json`. Every entry carries a reason and a date. Changing it is changing a test
  expectation, so EGYUTTMUKODES rule "tests are never silently changed" applies to it.
- A red version is tried once and never deployed; the test site keeps the previous version. The next push brings the fix.
