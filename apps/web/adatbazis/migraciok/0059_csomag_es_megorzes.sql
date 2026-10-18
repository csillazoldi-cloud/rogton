-- F-5c (T-24, D-F35): az értesítések és az eseménynapló 30 napos megőrzése; F-7a (D-F35): a csomag-gépezet váza (pilot — egy csomag, ár és fizetés nélkül).

-- 1. Takarítás: a 30 napnál régebbi eseménysorok törlése — SECURITY DEFINER függvény, mert az `esemeny` sorszintű védelme a km_app-nak csak a saját
--    szervezet sorait engedi; a takarítás minden munkatéren átmegy. A soronkénti olvasott-jelölés (ertesites_olvasott) CASCADE-del megy vele.
--    Az app óránként hívja (hirfigyelo/futtato → hitelesites/takaritas.ts), a paraméter a napok száma.
CREATE OR REPLACE FUNCTION esemeny_takarit(nap int) RETURNS int
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n int;
BEGIN
  DELETE FROM esemeny WHERE ido < now() - (nap * interval '1 day');
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION esemeny_takarit(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION esemeny_takarit(int) TO "km_app";

-- 2. Csomag: melyik munkatér melyik modult használhatja. Host-adat (nincs sorszintű védelem): a csomagok listája közös.
--    A pilotban EGY csomag van ("pilot"), benne a Hírfigyelő; ár és pénznem NULL — az ár később egy UPDATE-tel bővíthető (D-F35/4).
CREATE TABLE IF NOT EXISTS "csomag" (
  "kod" text PRIMARY KEY,
  "modulok" text[] NOT NULL DEFAULT '{}',
  "ar_havi" numeric(10, 2),
  "penznem" text,
  "letrehozva" timestamptz NOT NULL DEFAULT now()
);
INSERT INTO "csomag" ("kod", "modulok") VALUES ('pilot', ARRAY['hirfigyelo']) ON CONFLICT ("kod") DO NOTHING;
GRANT SELECT ON "csomag" TO "km_app";

ALTER TABLE "szervezet" ADD COLUMN IF NOT EXISTS "csomag_kod" text NOT NULL DEFAULT 'pilot' REFERENCES "csomag"("kod");

-- 3. Feliratok: a csomag neve és a modul-kapu hibája (a felület mondata, ha egy modul nincs a munkatér csomagjában).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('csomag.pilot_nev', 'hu', 'Pilot'),
  ('csomag.pilot_nev', 'ro', 'Pilot'),
  ('csomag.pilot_nev', 'en', 'Pilot'),
  ('csomag.pilot_megj', 'hu', 'A pilot csomag: a Hírfigyelő modul, ár és fizetés nélkül. Az árazás a pilot után dől el.'),
  ('csomag.pilot_megj', 'ro', 'Pachetul pilot: modulul Monitor de știri, fără preț și fără plată. Prețurile se decid după pilot.'),
  ('csomag.pilot_megj', 'en', 'The pilot package: the News monitor module, with no price and no payment. Pricing is decided after the pilot.'),
  ('hiba.MODUL_NEM_ELERHETO', 'hu', 'Ez a modul nincs a munkatér csomagjában.'),
  ('hiba.MODUL_NEM_ELERHETO', 'ro', 'Acest modul nu face parte din pachetul spațiului de lucru.'),
  ('hiba.MODUL_NEM_ELERHETO', 'en', 'This module is not part of the workspace''s package.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
