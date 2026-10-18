-- 0091: V4 (2026-09-18, Vilmos 8.) — a feltöltés hibaüzenetei a valódi okot mondják,
-- és a korlátok a mező mellett állandóan látszanak.
-- A meglévő arculat_fajl.nagy_mit / tipus_mit szövegeit UPDATE-tel frissítjük (nem INSERT),
-- az új kulcsokat (korlatok, halozat_mit, szerver_mit) INSERT-tel visszük fel.

-- 1) A meglévő szövegek frissítése (a szerződés szerinti pontos szövegre).
UPDATE "felirat" SET "szoveg" = 'Túl nagy: legfeljebb 10 MB.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.nagy_mit' AND "nyelv" = 'hu';
UPDATE "felirat" SET "szoveg" = 'Prea mare: cel mult 10 MB.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.nagy_mit' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Too large: at most 10 MB.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.nagy_mit' AND "nyelv" = 'en';

UPDATE "felirat" SET "szoveg" = 'Csak PNG, JPG vagy PDF.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.tipus_mit' AND "nyelv" = 'hu';
UPDATE "felirat" SET "szoveg" = 'Doar PNG, JPG sau PDF.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.tipus_mit' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Only PNG, JPG or PDF.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.tipus_mit' AND "nyelv" = 'en';

-- 2) Az új kulcsok felvétele (ha még nincsenek).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('arculat_fajl.korlatok', 'hu', 'PNG, JPG vagy PDF, legfeljebb 10 MB.'),
  ('arculat_fajl.korlatok', 'ro', 'PNG, JPG sau PDF, cel mult 10 MB.'),
  ('arculat_fajl.korlatok', 'en', 'PNG, JPG or PDF, at most 10 MB.'),

  ('arculat_fajl.halozat_mit', 'hu', 'Nem ért fel a fájl — túl nagy, vagy megszakadt a kapcsolat. Legfeljebb 10 MB.'),
  ('arculat_fajl.halozat_mit', 'ro', 'Fișierul nu a ajuns — prea mare sau conexiunea s-a întrerupt. Cel mult 10 MB.'),
  ('arculat_fajl.halozat_mit', 'en', 'The file did not arrive — too large, or the connection dropped. At most 10 MB.'),

  ('arculat_fajl.szerver_mit', 'hu', 'A szerver nem tudta elmenteni. Szóltunk a fejlesztőknek; próbáld meg pár perc múlva.'),
  ('arculat_fajl.szerver_mit', 'ro', 'Serverul nu a putut salva. Am anunțat dezvoltatorii; încearcă din nou peste câteva minute.'),
  ('arculat_fajl.szerver_mit', 'en', 'The server could not save it. We notified the developers; try again in a few minutes.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
