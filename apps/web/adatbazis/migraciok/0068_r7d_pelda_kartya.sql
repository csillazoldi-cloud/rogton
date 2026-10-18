-- R-7d (D-F43): a nyitólap PÉLDA-találatkártyájának szövegei — kitalált példa (a rajz szerint), „Példa" jelöléssel; nem élő adat (A-11).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('nyitolap.pelda_cim', 'hu', 'Új buszjáratok indulnak a marosvásárhelyi külvárosokba'),
  ('nyitolap.pelda_cim', 'ro', 'Noi linii de autobuz spre cartierele mărginașe din Târgu Mureș'),
  ('nyitolap.pelda_cim', 'en', 'New bus lines to the suburbs of Târgu Mureș'),
  ('nyitolap.pelda_kiado', 'hu', 'Népújság'),
  ('nyitolap.pelda_kiado', 'ro', 'Népújság'),
  ('nyitolap.pelda_kiado', 'en', 'Népújság'),
  ('nyitolap.pelda_datum', 'hu', '2026. 09. 13.'),
  ('nyitolap.pelda_datum', 'ro', '13.09.2026'),
  ('nyitolap.pelda_datum', 'en', '13 Sep 2026'),
  ('nyitolap.pelda_osszefoglalo', 'hu', 'Októbertől három új járat köti össze a külvárosokat a központtal, reggel és délután sűrűbb indulásokkal. A menetrend a városi honlapon már elérhető.'),
  ('nyitolap.pelda_osszefoglalo', 'ro', 'Din octombrie, trei linii noi leagă cartierele mărginașe de centru, cu plecări mai dese dimineața și după-amiaza. Orarul este deja pe site-ul primăriei.'),
  ('nyitolap.pelda_osszefoglalo', 'en', 'From October, three new lines connect the suburbs with the centre, with more frequent departures in the morning and afternoon. The timetable is already on the city website.'),
  ('nyitolap.pelda_indok', 'hu', 'A vásárlóid egy része ezekből a városrészekből jár be — érdemes tudni róla.'),
  ('nyitolap.pelda_indok', 'ro', 'O parte dintre clienții tăi vin din aceste cartiere — merită să știi.'),
  ('nyitolap.pelda_indok', 'en', 'Some of your customers commute from these districts — worth knowing about.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();

-- R-7c 04 (D-F43, 3.1 A): a Beállítások lap fülének és alcímének új értéke a MEGLÉVŐ kulcsokon
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('beallitasok.ful_adatpolitika', 'hu', 'Adatkezelés'),
  ('beallitasok.ful_adatpolitika', 'ro', 'Prelucrarea datelor'),
  ('beallitasok.ful_adatpolitika', 'en', 'Data handling'),
  ('beallitasok.bevezeto', 'hu', 'Értesítések, és ahogy a megadott adatokat használjuk.'),
  ('beallitasok.bevezeto', 'ro', 'Notificări și modul în care folosim datele tale.'),
  ('beallitasok.bevezeto', 'en', 'Notifications, and how we use the data you gave us.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
