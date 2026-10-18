-- 0102: a Hírek lapról a Posztszöveg lapra vezető gomb feliratai (hu/ro/en). R-11/A: a hírből poszt lesz.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.poszt_keszits', 'hu', 'Készíts belőle posztot'),
  ('hf.poszt_keszits', 'ro', 'Fă o postare din ea'),
  ('hf.poszt_keszits', 'en', 'Make a post from it'),
  ('hf.poszt_keszul', 'hu', 'Nyitom a posztot…'),
  ('hf.poszt_keszul', 'ro', 'Deschid postarea…'),
  ('hf.poszt_keszul', 'en', 'Opening the post…'),
  ('hf.poszt_hiba', 'hu', 'Most nem sikerült megnyitni. Próbáld újra.'),
  ('hf.poszt_hiba', 'ro', 'Nu s-a putut deschide acum. Încearcă din nou.'),
  ('hf.poszt_hiba', 'en', 'It could not be opened just now. Try again.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
