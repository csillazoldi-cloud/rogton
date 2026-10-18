-- Kézzel írt migráció (drizzle-kit --custom).
-- 1. A védelem a tábla tulajdonosára is érvényes — így a migráló szerep sem lát át véletlenül.
ALTER TABLE "szervezet" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "felhasznalo" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
-- 2. Az alkalmazás szerepe (km_app) NEM tulajdonos: csak olvas/ír, és a sorszintű védelem alá esik.
GRANT USAGE ON SCHEMA public TO km_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "szervezet", "felhasznalo" TO km_app;--> statement-breakpoint
-- 3. Két teszt szervezet az első naptól (ALAPTERV 4. pont, A-11): rögzített azonosítóval, hogy
--    az ellenőrzés mindig ugyanarra hivatkozhasson. Ismételt futtatás nem duplikál.
INSERT INTO "szervezet" ("id", "nev") VALUES
  ('11111111-1111-4111-8111-111111111111', 'Teszt Szervezet A'),
  ('22222222-2222-4222-8222-222222222222', 'Teszt Szervezet B')
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "felhasznalo" ("szervezet_id", "id", "email", "nev", "szerep") VALUES
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0001-4000-8000-000000000001', 'anna@teszt-a.example', 'Teszt Anna', 'tulajdonos'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0002-4000-8000-000000000002', 'andras@teszt-a.example', 'Teszt András', 'szerkeszto'),
  ('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-0001-4000-8000-000000000001', 'bela@teszt-b.example', 'Teszt Béla', 'tulajdonos')
ON CONFLICT ("id") DO NOTHING;
