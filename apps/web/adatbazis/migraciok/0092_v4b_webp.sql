-- V4b (2026-09-19): a WEBP is engedett típus (fajl-core) — a hibaszöveg ezt is mondja.
-- A külön „korlátok" sor a lapról lekerült: a mező mellett már ott állt a régi sor (PNG · JPG · WEBP · PDF · legfeljebb 10 MB).
UPDATE "felirat" SET "szoveg" = 'Csak PNG, JPG, WEBP vagy PDF.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.tipus_mit' AND "nyelv" = 'hu';
UPDATE "felirat" SET "szoveg" = 'Doar PNG, JPG, WEBP sau PDF.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.tipus_mit' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Only PNG, JPG, WEBP or PDF.', "frissitve" = now()
  WHERE "kulcs" = 'arculat_fajl.tipus_mit' AND "nyelv" = 'en';
