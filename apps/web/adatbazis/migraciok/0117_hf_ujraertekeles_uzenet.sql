-- 0117: 2026-09-22 (Vilmos: „az egyik be sem akar töltődni”) — az „Összefoglaló újrapróbálása” eredménye látszik.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.ujraertekeles_sikertelen', 'hu', 'Most sem sikerült elkészíteni az összefoglalót. Az eredeti cikket elolvashatod, vagy próbáld újra később.'),
  ('hf.ujraertekeles_sikertelen', 'ro', 'Nici acum nu s-a putut face rezumatul. Poți citi articolul original sau încearcă din nou mai târziu.'),
  ('hf.ujraertekeles_sikertelen', 'en', 'The summary could not be made this time either. You can read the original article, or try again later.'),
  ('hf.ujraertekeles_fut_mar', 'hu', 'Egy gyűjtés vagy újrapróbálás már fut. Várd meg, amíg véget ér.'),
  ('hf.ujraertekeles_fut_mar', 'ro', 'O colectare sau o reîncercare este deja în curs. Așteaptă să se termine.'),
  ('hf.ujraertekeles_fut_mar', 'en', 'A collection or retry is already running. Wait until it finishes.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
