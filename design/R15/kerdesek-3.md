# Questions — R-15 utókérés 2 + 4th shipment (03c2 · 04a · 06 · R-16 phones)

Only what the brief could not decide. Each has a marked default (★); if it is fine, no answer is needed.

1. **(Csilla) 04a departs from brief item 2 (c) and from the round-2 placement.** Measured: with the skipped-news line and any 0/0 counter
   line visible, the judge gave 4 points in 3/3 runs ("ki döntötte el?", "le vagyok maradva", "számonkérés"); with the watch row visible, 2/3.
   The drawing puts all three (skipped count, 0/0 counter, "Friss hírek minden reggel · Bekapcsolom") behind one quiet link "Miért nincs ma hír?"
   and hides the counter only when both numbers are 0. ★ Accept as drawn. (Alternative: keep (c) literally and accept a red 04a.)
2. **(Vilmos) Can the screen say the morning news costs nothing extra?** Every judge run asked "mibe kerül / fizetős?" at "Bekapcsolom" and
   "Jó így, kezdjük". Nothing in the drawings claims a price. ★ Leave it unsaid until you confirm; if it is true for the pilot, add
   "Ez benne van az árban." to `r15.kozos.napi_hirek_reszlet` (no layout change).
3. **(Vilmos + Csilla) There is no way to turn the morning watch off** (measured in code: only `PUT /api/r15/napi-figyeles`, which turns it on;
   06 today has no off control either). The redraw keeps it that way (silence ≠ permission). ★ Add "Reggeli hírek kikapcsolása" inside 06 › Részletek
   in the code round (sets `idozites.mod = "kezi"`); needs your yes because it is a new control.
4. **(Csilla) R-16 desktop 12a / 12f still lead with upload,** while the phones now lead with the name-logo / the has-a-logo question.
   ★ Mirror the phone structure on desktop in the next design round; code round implements phone only (CSS breakpoint), as drawn.
5. **(Csilla + Vilmos, rule 5) 06 drops two visible controls whose function stays:** the "Beállítás mentése" button (saving was already automatic after
   800 ms — it stays automatic) and the module tab row on this page (navigation kept via nav "Hírek" and "Mit találtunk eddig?").
   ★ Accept; nothing stops working.
