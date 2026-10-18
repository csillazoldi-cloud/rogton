-- F9-L4: a harang céllapjának böngészőcíme Értesítések
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('beallitasok.oldalcim', 'hu', 'Értesítések — Kommunikációs munkatér'),
  ('beallitasok.oldalcim', 'ro', 'Notificări — Spațiu de comunicare'),
  ('beallitasok.oldalcim', 'en', 'Notifications — Communication workspace')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
