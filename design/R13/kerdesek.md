# Questions — R-13 credit screens (round 3)

## Answered — locked decisions (Csilla, 2026-10-03; final, not reopened)
- **L1 · Money line approved** (Vilmos after the fact). The screens may say „Nem kerül külön pénzbe — a havi keretből megy”, adapted per page
  („keret” alone is fine, never „AI-keret”). Drawn once per screen, short and quiet, on: 13a credit section, the Kreditek view (13b1–13b3), 13a3 (phone strip),
  13d2, 13d3 and 13d4. Measured effect: see the report (on 13d2/13d3 it lowered the score; it was implemented as decided).
- **L2 · 13b restructure.** The Tagok first screen stays R-2 (members, roles, Meghívás) with no credit columns. One quiet row „Kreditek ›” opens its own view,
  where the 13b1/13b2/13b3 states live. 13b4 (alone) stays on Tagok with the single primary „Meghívok valakit”.
- **L3 · Judge persona.** Complaints in a member's voice („szólj a munkatér tulajdonosának — nem én vagyok a tulajdonos?”) are context artifacts
  (the same ruling as Cipó Pékség, 10-01). They are recorded, not acted on. The screens stay owner-voiced.
- Earlier answers carried over: (1) „szűr*” is never visible text (T3) · (8) the new sections go on top of Saját fiók · (9) choices behind „Átírom” with auto-save,
  and the „mire ment el” rows behind „Részletek” · (10) 13d1 is drawn on 03c.

- **L4 · Q15 ACCEPTED (Csilla, 2026-10-03 12:52).** The stable robot-Tibor reds on the owner-only settings pages (Tagok, the Kreditek view,
  being alone in a workspace, and three Saját fiók views on a computer screen) are a judge limitation — on a normal day there is nothing to do
  there. Recorded, not redrawn; the pages go to human review. The code round (2026-10-03) built them as drawn.
- **Q14 · answered by measurement (round 4):** 13d2/13d3 went back to „Ehhez nem kell kredit.”; the money line stays on 13a and the Kreditek view.
  The final run did not show the hoped-for lift (13d2 4/4, 13d3 5/4); the earlier 5/5 for 13d2 was within the judge's ±1 noise.

## Open (each has a marked default ★)
2. **(Csilla + Vilmos) Owner vs member sentences.** 13a3 is drawn for the owner („…a Kreditek lapon adhatsz magadnak”). Szerkesztő/néző get `r13.kredit.ha_most`.
   The under-button sentence on 13d3/13d4 is the request's literal member sentence. ★ The owner variant of it: „Elfogyott a kredited ebben a hónapban — a Kreditek lapon adhatsz magadnak többet.”
3. **(Vilmos) Does a néző get an equal share?** A néző cannot start AI work. ★ Left out of the equal split.
4. **(Vilmos) Validation of `PUT /api/kredit/tagok/{fiok}`**: (a) separate amounts above the workspace month, (b) an amount below what was already used.
   ★ (a) an error code with one sentence under the field; (b) allowed.
5. **(Vilmos) Monthly reset = calendar month?** The screens say „jövő hónapban újra kapsz”. ★ Confirm.
6. **(Vilmos) Endpoint for the admin's used credit per workspace.** ★ Add it to `/api/koltseg/osszes`.
7. **(Vilmos) Which actions cost credit?** Image work is left enabled when the credit is used up. ★ Confirm.
12. **(Csilla) „Jó így” on the Kreditek view changes no data**; it goes back to Tagok. ★ Keep.
15. ~~**(Csilla)** Six owner-only pages … accept them as they are for human review? ★ Yes.~~ → answered above (L4).
