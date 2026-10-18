-- Kézzel írt migráció (drizzle-kit --custom), az E-3 lépéshez.
ALTER TABLE "tagsag" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "fiok", "tagsag", "munkamenet" TO km_app;--> statement-breakpoint
-- Teszt-fiókok (üres jelszó-lenyomat: ezekkel nem lehet belépni, csak az elválasztás bizonyítására vannak).
INSERT INTO "fiok" ("id", "email", "nev", "jelszo_hash") VALUES
  ('aaaaaaaa-0001-4000-8000-000000000001', 'anna@teszt-a.example', 'Teszt Anna', ''),
  ('aaaaaaaa-0002-4000-8000-000000000002', 'andras@teszt-a.example', 'Teszt András', ''),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'bela@teszt-b.example', 'Teszt Béla', '')
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "tagsag" ("szervezet_id", "fiok_id", "szerep") VALUES
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0001-4000-8000-000000000001', 'tulajdonos'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0002-4000-8000-000000000002', 'szerkeszto'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0001-4000-8000-000000000001', 'tulajdonos')
ON CONFLICT DO NOTHING;
