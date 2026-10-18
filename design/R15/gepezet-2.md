# Machinery — R-15 · 3rd shipment (03 Kezdőlap · 04 Hírek, empty and done states)

What the drawing `R15-lapok-2.dc.html` needs that does not exist yet, or exists in a different form. Numbers are referenced
from the drawing's notes. Continues `gepezet.md` (2nd shipment, items 1–11); nothing here removes an item from there.

1. **Introduction post, written at onboarding approval (03a).** When an organisation's onboarding is approved, the machine
   writes ONE Facebook post from the approved profile (same generator as Posztszöveg › "Saját ötletből"; fixed idea:
   introduce the company — what you do, where). It goes into "Vár rád" with origin = profile and short name
   "Bemutatkozó poszt" (gepezet 5). On 08 its subtitle is `r15.kezdolap.elso_alcim` instead of "Ebből a hírből írtuk".
   If the text is not ready when Tibor presses the button, 08 opens in the "Írjuk a posztot…" state (gepezet 1).
   Cost: one AI call per new organisation (see kerdesek-2 · 2).
2. **Home state selection (replaces the N = 0 half of gepezet 7).**
   - N ≥ 1 waiting posts → 03b ("Ma N poszt vár rád"). If the only waiting post is the introduction post and the org has
     never finished a post → the 03a texts (`r15.kezdolap.elso_kerdes`, `elso_alcim`, info line `bemutatkozo`).
   - N = 0 → 03c: title `r15.kezdolap.kesz_kerdes`, the done-moment (`data-r15="kesz"`, the largest element on the
     page), and an explicitly optional offer (`r15.kezdolap.kesz_ajanlat`, "Ha van kedved: …") with ONE primary button
     `r15.kep.uj_kep` ("Új képet készítek", item 4). Round 2 (judge 10-01): the done state must read as done.
   - N = 0 and nothing finished this week (e.g. the intro post failed) → 03c without the done-moment; the title is
     `r15.kozos.munkad_cim`. Same layout, no new element.
   "Ma nincs dolgod" without a primary button is retired as a screen state (the key stays).
3. **Zero-progress wording.** Same weekly counter as gepezet 2; text variant only: when `poszt_kesz = 0` and a post is
   waiting → `r15.kozos.halad_elso` ("Ezen a héten: ez lesz az első."). On Hírek the plain short counter stays
   (`r15.kozos.halad_rovid`, with zeros).
4. **"Képet készítek a munkámról" deep link (03c, 04a).** Opens the Képek filler (10) with the "Kész munka" card already
   chosen and the photo upload as the first step. Assumed route `/kepek/uj/<type>` (the probe visits `/kepek/uj/akcio`);
   if "kész munka" has no such entry yet, add it. The preview image on the card is that template rendered with the org's
   brand (R-16 arculat) — before Tibor uploads a photo it shows a sample photo (kerdesek-2 · 8). In the drawing the paving
   pattern is a stand-in for that image (it is image content, not UI colour; in code it is an `<img>`, alt text
   `r15.kozos.kep_minta_alt`).
5. **Hírek empty state leads with the news fact and says WHEN news comes (04a).** Title `r15.hirek.ures_kerdes`
   ("Ma nincs új hír nektek"), subtitle = the existing skipped-count line `r15.hirek.kihagytuk`, then:
   - daily watch OFF → the quiet row "Friss hírek minden reggel · Bekapcsolom" (drawn);
   - daily watch ON → in place of that row, a quiet info line `r15.hirek.holnap_ujra` ("Holnap reggel újra nézzük.");
   - first gathering still running (just after onboarding) → title `r15.hirek.elso_kerdes`, no subtitle.
   Then the offer card (`r15.hirek.ures_ajanlat`, "Addig mutasd meg…") with the one primary button.
   Needs: the daily-watch flag (exists — the Kezdőlap already offers "Bekapcsolom") and a "gathering in progress" flag
   (assumed to exist from the gathering job's status; not measured).
6. **03c subtitle depends on the daily watch.** ON → `r15.kezdolap.kesz_alcim` ("Holnap reggel hozzuk a következő
   híreket."). OFF → no subtitle; the row "Friss hírek minden reggel · Bekapcsolom" becomes the first row of the right-hand
   list (as on 03a).
7. **"43 hír nem illett hozzátok"** (04a subtitle) is the existing `r15.hirek.kihagytuk` line; it needs the count of news gathered
   but not matched in the last gathering (the live page already shows it — measured on the 10-01 screenshot).
8. **Reassurance line next to every "Megnézem a posztot" primary (03a, 03b, 04b)** — `r15.kozos.nyugtato`
   ("Átírhatod, és csak te teszed ki."). Text only; it states existing behaviour (08 is editable, nothing is published
   by the app — "Kész, másolom" copies). On phones it sits in the free left part of the Visszajelzés strip, directly above
   the bottom primary button. If the app ever publishes directly, this line must change.
9. **04b news card: source behind "···" › Részletek (05)**, and the idea line reads `r15.hirek.posztod`
   ("Posztod: …") instead of "Ötlet: …" — the post already exists (gepezet 1). Text/placement only.
