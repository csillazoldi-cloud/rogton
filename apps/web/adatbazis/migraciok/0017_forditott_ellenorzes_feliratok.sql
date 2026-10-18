-- Kézzel írt migráció, E-12: a fordított ellenőrzés javításai az 1. lépésen (v6: leírás-súgó, csatolt dokumentum, arculati források be-állapota).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('onboarding1.leiras_sugo', 'hu', 'Elég pár mondat — a részleteket később is pontosíthatod.'),
  ('onboarding1.dokumentum_opcionalis', 'hu', '(opcionális — pl. bemutatkozó anyag)'),
  ('onboarding1.csatolva', 'hu', 'csatolva'),
  ('onboarding1.eltavolitas', 'hu', 'Eltávolítás'),
  ('onboarding1.arculat_logo_be', 'hu', '✓ Logó csatolva'),
  ('onboarding1.arculat_kezikonyv_be', 'hu', '✓ Arculati kézikönyv'),
  ('onboarding1.arculat_referenciak_be', 'hu', '✓ Referenciák'),
  ('onboarding1.arculat_weboldal_is_be', 'hu', '✓ A weboldal is forrás'),
  ('onboarding1.leiras_sugo', 'ro', 'Câteva propoziții sunt suficiente — detaliile pot fi precizate ulterior.'),
  ('onboarding1.dokumentum_opcionalis', 'ro', '(opțional — ex. material de prezentare)'),
  ('onboarding1.csatolva', 'ro', 'atașat'),
  ('onboarding1.eltavolitas', 'ro', 'Elimină'),
  ('onboarding1.arculat_logo_be', 'ro', '✓ Logo atașat'),
  ('onboarding1.arculat_kezikonyv_be', 'ro', '✓ Manual de brand'),
  ('onboarding1.arculat_referenciak_be', 'ro', '✓ Referințe'),
  ('onboarding1.arculat_weboldal_is_be', 'ro', '✓ Site-ul ca sursă'),
  ('onboarding1.leiras_sugo', 'en', 'A few sentences are enough — details can be refined later.'),
  ('onboarding1.dokumentum_opcionalis', 'en', '(optional — e.g. an intro deck)'),
  ('onboarding1.csatolva', 'en', 'attached'),
  ('onboarding1.eltavolitas', 'en', 'Remove'),
  ('onboarding1.arculat_logo_be', 'en', '✓ Logo attached'),
  ('onboarding1.arculat_kezikonyv_be', 'en', '✓ Brand guide'),
  ('onboarding1.arculat_referenciak_be', 'en', '✓ References'),
  ('onboarding1.arculat_weboldal_is_be', 'en', '✓ Website used as source')
ON CONFLICT ("kulcs", "nyelv") DO NOTHING;--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = '+ Dokumentum csatolása' WHERE "kulcs" = 'onboarding1.dokumentum' AND "nyelv" = 'hu';
--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = 'A weboldal is forrás' WHERE "kulcs" = 'onboarding1.arculat_weboldal_is' AND "nyelv" = 'hu';
--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = '+ Atașează document' WHERE "kulcs" = 'onboarding1.dokumentum' AND "nyelv" = 'ro';
--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = 'Site-ul ca sursă' WHERE "kulcs" = 'onboarding1.arculat_weboldal_is' AND "nyelv" = 'ro';
--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = '+ Attach document' WHERE "kulcs" = 'onboarding1.dokumentum' AND "nyelv" = 'en';
--> statement-breakpoint
UPDATE "felirat" SET "szoveg" = 'Use the website as a source' WHERE "kulcs" = 'onboarding1.arculat_weboldal_is' AND "nyelv" = 'en';
