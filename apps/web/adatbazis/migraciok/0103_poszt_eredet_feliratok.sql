-- 0103: az eredetjelölés feliratai (hu/ro/en). R-11/A · A-4: mit írt át az ember az AI javaslatából.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('poszt.eredet_gomb', 'hu', 'Mit írtál át?'),
  ('poszt.eredet_gomb', 'ro', 'Ce ai rescris?'),
  ('poszt.eredet_gomb', 'en', 'What did you rewrite?'),
  ('poszt.eredet_vissza', 'hu', 'Vissza a szerkesztéshez'),
  ('poszt.eredet_vissza', 'ro', 'Înapoi la editare'),
  ('poszt.eredet_vissza', 'en', 'Back to editing'),
  ('poszt.eredet_cim', 'hu', 'A szöveg eredete'),
  ('poszt.eredet_cim', 'ro', 'Originea textului'),
  ('poszt.eredet_cim', 'en', 'Where the text came from'),
  ('poszt.eredet_ai', 'hu', 'az AI javaslata'),
  ('poszt.eredet_ai', 'ro', 'propunerea AI'),
  ('poszt.eredet_ai', 'en', 'the AI draft'),
  ('poszt.eredet_ember', 'hu', 'te írtad'),
  ('poszt.eredet_ember', 'ro', 'ai scris tu'),
  ('poszt.eredet_ember', 'en', 'you wrote it'),
  ('poszt.eredet_arany', 'hu', 'A szöveg {szazalek}%-a a tiéd.'),
  ('poszt.eredet_arany', 'ro', '{szazalek}% din text este al tău.'),
  ('poszt.eredet_arany', 'en', '{szazalek}% of the text is yours.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
