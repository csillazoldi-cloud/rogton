-- F9-A8 + F9-A9 (Vilmos döntése 2026-09-14): csomagnevek adatként (Radar · Studio · Newsroom · Agency), forrás-korlát (a próbaidőszakban 5), a pilot kód átnevezése radar-ra

ALTER TABLE "csomag" ADD COLUMN IF NOT EXISTS "forras_max" integer;--> statement-breakpoint
INSERT INTO "csomag" ("kod", "modulok", "forras_max") VALUES ('radar', ARRAY['hirfigyelo'], 5), ('studio', ARRAY[]::text[], NULL), ('newsroom', ARRAY[]::text[], NULL), ('agency', ARRAY[]::text[], NULL) ON CONFLICT ("kod") DO UPDATE SET "modulok" = EXCLUDED."modulok", "forras_max" = EXCLUDED."forras_max";--> statement-breakpoint
ALTER TABLE "szervezet" ALTER COLUMN "csomag_kod" SET DEFAULT 'radar';--> statement-breakpoint
UPDATE "szervezet" SET "csomag_kod" = 'radar' WHERE "csomag_kod" = 'pilot';--> statement-breakpoint
UPDATE "csomag" SET "forras_max" = 5 WHERE "kod" = 'pilot';--> statement-breakpoint
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('csomag.radar_nev', 'hu', 'Radar'),
  ('csomag.radar_nev', 'ro', 'Radar'),
  ('csomag.radar_nev', 'en', 'Radar'),
  ('csomag.radar_megj', 'hu', 'Próbaidőszak — a Hírek modul, ár és fizetés nélkül'),
  ('csomag.radar_megj', 'ro', 'Perioadă de probă — modulul Știri, fără preț și plată'),
  ('csomag.radar_megj', 'en', 'Trial period — the News module, without price or payment'),
  ('csomag.studio_nev', 'hu', 'Studio'),
  ('csomag.studio_nev', 'ro', 'Studio'),
  ('csomag.studio_nev', 'en', 'Studio'),
  ('csomag.newsroom_nev', 'hu', 'Newsroom'),
  ('csomag.newsroom_nev', 'ro', 'Newsroom'),
  ('csomag.newsroom_nev', 'en', 'Newsroom'),
  ('csomag.agency_nev', 'hu', 'Agency'),
  ('csomag.agency_nev', 'ro', 'Agency'),
  ('csomag.agency_nev', 'en', 'Agency'),
  ('csomag.studio_megj', 'hu', 'Később érhető el'),
  ('csomag.studio_megj', 'ro', 'Disponibil mai târziu'),
  ('csomag.studio_megj', 'en', 'Available later'),
  ('csomag.newsroom_megj', 'hu', 'Később érhető el'),
  ('csomag.newsroom_megj', 'ro', 'Disponibil mai târziu'),
  ('csomag.newsroom_megj', 'en', 'Available later'),
  ('csomag.agency_megj', 'hu', 'Később érhető el'),
  ('csomag.agency_megj', 'ro', 'Disponibil mai târziu'),
  ('csomag.agency_megj', 'en', 'Available later'),
  ('csomag.probaidoszak_cimke', 'hu', 'próbaidőszak'),
  ('csomag.probaidoszak_cimke', 'ro', 'perioadă de probă'),
  ('csomag.probaidoszak_cimke', 'en', 'trial'),
  ('hf.forras_szamlalo', 'hu', '{n} oldal az {m}-ből'),
  ('hf.forras_szamlalo', 'ro', '{n} site din {m}'),
  ('hf.forras_szamlalo', 'en', '{n} of {m} sites'),
  ('hf.forras_korlat_mondat', 'hu', 'A próbaidőszakban {m} oldalt figyelhetsz.'),
  ('hf.forras_korlat_mondat', 'ro', 'În perioada de probă poți urmări {m} site-uri.'),
  ('hf.forras_korlat_mondat', 'en', 'During the trial you can monitor {m} sites.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();--> statement-breakpoint
