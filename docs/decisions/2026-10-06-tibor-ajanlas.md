# Decision — the Tibor gate is a recommendation, not a blocker (2026-10-06)

**Decided by:** Csilla (chat, 2026-10-06 16:56).

**Why:** On 10-06 the gate closed three times in one afternoon; twice on byte-identical screenshots that had passed an hour earlier (Posztszöveg phone 15:43, Belépés phone 16:21) — robot-Tibor noise in the score 4–5 band. One closure was a real bug (Feedback button covering the logo-design button on the name-logo phone page) and was fixed.

**Rule from now on:** kapu.py still runs after every deploy and its output is kept. A ZÁRVA result no longer blocks by itself. For every red, Claude tells Csilla in simple words what the page is, what Tibor complained about, and whether the screenshot changed since the last pass (real change vs judge noise). Csilla decides: fix, accept, or ignore. The probe (deterministic measurements, e.g. a floating element covering a button) is still treated as a real bug by default.

Supersedes the blocking part of 2026-10-01-zar-ismetles-szabaly.md and 2026-10-04-elfogadott-pirosak.md (the accepted list stays as a record).
