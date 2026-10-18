# Decision — accepted judge reds don't block the gate (2026-10-04)

**Decided by:** Csilla (chat, 2026-10-04 19:33). **Vilmos:** after-the-fact OK requested (gate rule change, like 2026-10-01-zar-ismetles-szabaly.md).

**Why:** On 10-03 Csilla accepted (Q15) that the robot-Tibor gives red on the owner-only credit pages because on a normal day there is nothing to do on them — a judge limitation, not a design defect. The gate on 10-04 19:26 (ki-1004) still closed on exactly that class: Tagok in the "alone in the workspace" state (the gate's test account has no other members), desktop 3/3 red, phone 2/3 red, "would press nothing". Everything else passed (probe 28/42 = baseline; Kezdőlap phone cleared 1/3 on re-judge).

**Rule:** `tools/tibor-proba/elfogadott.json` lists page/view pairs whose judge-red Csilla explicitly accepted. For those, the new-page judge-red rule does not block; zar.md shows them in a separate "Elfogadott pirosak" list. Still blocking for them: probe red, and any worsening against alap.json. Draw-time gate (--rajz) ignores the list.

**Adding a line:** only on Csilla's explicit decision, with date and a pointer to the decision log.

**Initial list:** tagok/asztali, tagok/telefon.

**Vilmos: OK (relayed by Csilla, 2026-10-06 12:27).**
