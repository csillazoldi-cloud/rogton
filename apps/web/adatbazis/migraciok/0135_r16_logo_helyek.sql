-- 0135: R-16 K1 — a logó négy helye (gepezet 2–3) és a 12f „Töltsd fel a logóidat” feliratai (design/R16-arculat/TERV.md 1.1, 1.7 R4, 2-K1, 2-K8).
-- CSAK BŐVÍT (TERV 1.7 R4): három új oszlop az arculat_fajl-ban (null-t engedő, vagy állandó alapértékkel — Postgres 18: nincs táblaújraírás),
-- CHECK csak az új oszlopokon, egyetlen UPDATE (a régi logó-sorok helye NULL → vilagos). Semmit nem töröl, semmit nem ír át, ami már érték volt.
-- A régi kód a saját drizzle-oszlopait olvassa, és az új oszlopok nélkül szúr be → az alapértékek érvényesek.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: ALTER TABLE ×3, UPDATE <a logó-sorok száma>, INSERT 0 42, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0135_r16_logo_helyek.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

-- 1. A hely (csak cel = 'logo'): vilagos · sotet · egyszinu · negyzetes. NULL egy logó-soron = vilagos (a régi sorok).
ALTER TABLE "arculat_fajl" ADD COLUMN IF NOT EXISTS "logo_valtozat" text
  CONSTRAINT "arculat_fajl_logo_valtozat" CHECK ("logo_valtozat" IN ('vilagos', 'sotet', 'egyszinu', 'negyzetes'));--> statement-breakpoint
-- 2. Ki tette a fájlt: feltöltés · a cég honlapjáról (K7) · a gép készítette (névlogó, K6). Ez a „gépi” jel.
ALTER TABLE "arculat_fajl" ADD COLUMN IF NOT EXISTS "eredet" text DEFAULT 'feltoltes' NOT NULL
  CONSTRAINT "arculat_fajl_eredet" CHECK ("eredet" IN ('feltoltes', 'honlap', 'gep'));--> statement-breakpoint
-- 3. A böngészőben számolt logó-elemzés (@km/arculat-core LogoElemzes; a kiszolgáló zod-dal ellenőrzi, ≤ 2 KB). NULL: régi logó / nem logó.
ALTER TABLE "arculat_fajl" ADD COLUMN IF NOT EXISTS "elemzes" jsonb;--> statement-breakpoint

-- A meglévő logó-sorok a világos helyre (így a hely soha nem „ismeretlen”); más célú sor NULL marad.
UPDATE "arculat_fajl" SET "logo_valtozat" = 'vilagos' WHERE "cel" = 'logo' AND "logo_valtozat" IS NULL;--> statement-breakpoint

-- 4. A 12f feliratai (design/R16-arculat/feliratok.json, r16.arculat.* — 14 kulcs × hu/ro/en = 42 sor). ON CONFLICT: ismételhető.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r16.arculat.logok.kerdes', 'hu', 'Töltsd fel a logóidat'),
  ('r16.arculat.logok.kerdes', 'ro', 'Încarcă-ți logourile'),
  ('r16.arculat.logok.kerdes', 'en', 'Upload your logos'),
  ('r16.arculat.logok.alcim', 'hu', 'Többet is egyszerre. Mi tudjuk, melyik hova.'),
  ('r16.arculat.logok.alcim', 'ro', 'Mai multe deodată. Știm noi unde merge fiecare.'),
  ('r16.arculat.logok.alcim', 'en', 'Several at once. We know which goes where.'),
  ('r16.arculat.logok.vilagos', 'hu', 'Világos háttérre'),
  ('r16.arculat.logok.vilagos', 'ro', 'Pentru fundal deschis'),
  ('r16.arculat.logok.vilagos', 'en', 'For light backgrounds'),
  ('r16.arculat.logok.sotet', 'hu', 'Sötét háttérre'),
  ('r16.arculat.logok.sotet', 'ro', 'Pentru fundal închis'),
  ('r16.arculat.logok.sotet', 'en', 'For dark backgrounds'),
  ('r16.arculat.logok.egyszinu', 'hu', 'Egy színnel'),
  ('r16.arculat.logok.egyszinu', 'ro', 'Într-o singură culoare'),
  ('r16.arculat.logok.egyszinu', 'en', 'Single colour'),
  ('r16.arculat.logok.negyzetes', 'hu', 'Négyzetes'),
  ('r16.arculat.logok.negyzetes', 'ro', 'Pătrat'),
  ('r16.arculat.logok.negyzetes', 'en', 'Square'),
  ('r16.arculat.logok.feltoltes', 'hu', 'Feltöltés…'),
  ('r16.arculat.logok.feltoltes', 'ro', 'Se încarcă…'),
  ('r16.arculat.logok.feltoltes', 'en', 'Uploading…'),
  ('r16.arculat.logok.valasztas', 'hu', 'Logók kiválasztása'),
  ('r16.arculat.logok.valasztas', 'ro', 'Alege logourile'),
  ('r16.arculat.logok.valasztas', 'en', 'Choose logos'),
  ('r16.arculat.logok.huzd', 'hu', 'vagy húzd ide őket'),
  ('r16.arculat.logok.huzd', 'ro', 'sau trage-le aici'),
  ('r16.arculat.logok.huzd', 'en', 'or drag them here'),
  ('r16.arculat.logok.melyik_hova', 'hu', 'Melyik hova?'),
  ('r16.arculat.logok.melyik_hova', 'ro', 'Care unde merge?'),
  ('r16.arculat.logok.melyik_hova', 'en', 'Which goes where?'),
  ('r16.arculat.logok.melyik_hova_szoveg', 'hu', 'Világos háttérre: a krém és fehér képekre. Sötét háttérre: a színes és sötét képekre. Egy színnel: ha a kép zsúfolt. Négyzetes: profilkép, kis hely. Ami hiányzik, arra a legközelebbit tesszük.'),
  ('r16.arculat.logok.melyik_hova_szoveg', 'ro', 'Pentru fundal deschis: imaginile crem și albe. Pentru fundal închis: imaginile colorate și închise. Într-o singură culoare: când imaginea e aglomerată. Pătrat: poză de profil, spațiu mic. Unde lipsește unul, punem cel mai apropiat.'),
  ('r16.arculat.logok.melyik_hova_szoveg', 'en', 'For light backgrounds: cream and white images. For dark backgrounds: coloured and dark images. Single colour: when the image is busy. Square: profile picture, small spaces. Where one is missing, we use the closest.'),
  ('r16.arculat.vissza', 'hu', 'Vissza'),
  ('r16.arculat.vissza', 'ro', 'Înapoi'),
  ('r16.arculat.vissza', 'en', 'Back'),
  ('r16.arculat.igy_nez_ki', 'hu', 'Így néz ki egy képed:'),
  ('r16.arculat.igy_nez_ki', 'ro', 'Așa arată o imagine de-a ta:'),
  ('r16.arculat.igy_nez_ki', 'en', 'This is how an image of yours looks:'),
  ('r16.arculat.masik_minta', 'hu', 'Másik minta'),
  ('r16.arculat.masik_minta', 'ro', 'Alt exemplu'),
  ('r16.arculat.masik_minta', 'en', 'Another sample')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();

-- VISSZAÁLLÍTÁS (NEM fut automatikusan; csak kézzel, ha a K1-et teljesen vissza kell vonni — a feliratok maradhatnak):
--   ALTER TABLE arculat_fajl DROP COLUMN elemzes, DROP COLUMN eredet, DROP COLUMN logo_valtozat;
