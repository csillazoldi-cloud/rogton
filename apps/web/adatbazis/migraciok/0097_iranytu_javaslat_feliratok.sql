-- 0097: az iránytű AI-javaslatának feliratai (hu/ro/en).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('iranytu.javaslat_fut', 'hu', 'Az AI dolgozik…'),
  ('iranytu.javaslat_fut', 'ro', 'AI-ul lucrează…'),
  ('iranytu.javaslat_fut', 'en', 'The AI is working…'),
  ('iranytu.javaslat_hiba_ai', 'hu', 'Az AI most nem válaszol. Próbáld újra kicsit később.'),
  ('iranytu.javaslat_hiba_ai', 'ro', 'AI-ul nu răspunde acum. Încearcă din nou puțin mai târziu.'),
  ('iranytu.javaslat_hiba_ai', 'en', 'The AI is not responding right now. Try again in a moment.'),
  ('iranytu.javaslat_hiba_keret', 'hu', 'Elfogyott a havi AI-keret. Írni és szerkeszteni tudsz, új javaslat nem készül.'),
  ('iranytu.javaslat_hiba_keret', 'ro', 'Bugetul lunar pentru AI s-a epuizat. Poți scrie și edita, dar nu se mai face o propunere nouă.'),
  ('iranytu.javaslat_hiba_keret', 'en', 'The monthly AI budget is used up. You can still write and edit, but no new suggestion is made.'),
  ('iranytu.javaslat_hiba_kikapcsolva', 'hu', 'Az AI ki van kapcsolva ebben a munkatérben.'),
  ('iranytu.javaslat_hiba_kikapcsolva', 'ro', 'AI-ul este oprit în acest spațiu de lucru.'),
  ('iranytu.javaslat_hiba_kikapcsolva', 'en', 'The AI is switched off in this workspace.'),
  ('iranytu.javaslat_hiba_profil', 'hu', 'Előbb töltsd ki a Szervezet adatai lapot — a javaslat abból dolgozik.'),
  ('iranytu.javaslat_hiba_profil', 'ro', 'Completează mai întâi pagina Datele organizației — propunerea pornește de acolo.'),
  ('iranytu.javaslat_hiba_profil', 'en', 'Fill in the Organisation details page first — the suggestion works from it.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
