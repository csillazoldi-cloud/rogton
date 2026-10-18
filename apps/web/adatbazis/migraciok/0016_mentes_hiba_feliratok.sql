-- Kézzel írt migráció, E-11: a mentési hiba állapota a v6 szerint (szöveg + Újrapróbálás + „Mentve: idő”).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('onboarding.ujraprobalas', 'hu', 'Újrapróbálás'),
  ('onboarding.mentve_ekkor', 'hu', 'Mentve: {t}'),
  ('onboarding.ujraprobalas', 'ro', 'Reîncearcă'),
  ('onboarding.mentve_ekkor', 'ro', 'Salvat: {t}'),
  ('onboarding.ujraprobalas', 'en', 'Retry'),
  ('onboarding.mentve_ekkor', 'en', 'Saved: {t}')
ON CONFLICT ("kulcs", "nyelv") DO NOTHING;--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = 'A mentés nem sikerült — az adataid megvannak' WHERE "kulcs" = 'onboarding.mentes_hiba' AND "nyelv" = 'hu';
--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = 'Salvarea a eșuat — datele tale există' WHERE "kulcs" = 'onboarding.mentes_hiba' AND "nyelv" = 'ro';
--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = 'Saving failed — your data is intact' WHERE "kulcs" = 'onboarding.mentes_hiba' AND "nyelv" = 'en';
