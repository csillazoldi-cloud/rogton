-- 0104: a karakterszámláló új szövegei (hu/ro/en). A-7: a platformok saját határai ellenőrizve
-- 2026-09-19 — Facebook 63 206, Instagram 2 200, LinkedIn 3 000; a hírfolyamban ennél jóval
-- kevesebb látszik (FB ~477, IG ~125, LI ~210), ezért ezt is kiírjuk.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('poszt.karakter_db', 'hu', '{db} karakter'),
  ('poszt.karakter_db', 'ro', '{db} caractere'),
  ('poszt.karakter_db', 'en', '{db} characters'),
  ('poszt.lathato_hatar', 'hu', 'Az első {db} karakter látszik, a többi a „Továbbiak" mögé kerül.'),
  ('poszt.lathato_hatar', 'ro', 'Se văd primele {db} caractere, restul intră sub „Vezi mai mult".'),
  ('poszt.lathato_hatar', 'en', 'The first {db} characters are shown; the rest goes behind “See more”.'),
  ('poszt.tul_hosszu', 'hu', 'Ennél többet a felület nem fogad el (legfeljebb {max}).'),
  ('poszt.tul_hosszu', 'ro', 'Platforma nu acceptă mai mult de atât (maximum {max}).'),
  ('poszt.tul_hosszu', 'en', 'The platform does not accept more than this (at most {max}).')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
