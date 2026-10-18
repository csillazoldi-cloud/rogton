-- 0129: J-1 (2026-09-25, a NAS-ról mérve) — a forrás-ajánló régi, nem olvasható címei a már felvett forrásoknál is a lap saját
-- RSS-címére cserélődnek, és újra ellenőrzésre kerülnek (a következő futás maga ellenőrzi). Így a tesztelők munkaterei is hírt kapnak.
UPDATE "hf_forras" SET "cim" = v.uj, "allapot" = 'ellenorzes_alatt', "hiba_ok" = NULL
FROM (VALUES
  ('https://szekelyhon.ro/rss', 'https://szekelyhon.ro/rss/szekelyhon_hirek.xml'),
  ('https://kronikaonline.ro/rss', 'https://kronika.ro/rss/kronika_hirek.xml'),
  ('https://foter.ro/feed', 'https://foter.ro/rss/foter.xml'),
  ('https://szabadsag.ro/rss', 'https://szabadsag.ro/rss.xml'),
  ('https://www.3szek.ro/rss', 'https://feeds.feedburner.com/3szekHirek'),
  ('https://www.stiridecluj.ro/feed', 'https://www.stiridecluj.ro/rss.xml'),
  ('https://hargitanepe.ro/feed', 'https://hargitanepe.ro/rss'),
  ('https://vasarhely.ro/feed', 'https://www.vasarhely.ma/feed/'),
  ('https://transtelex.hu/rss', 'https://transtelex.ro/rss')
) AS v(regi, uj)
WHERE "hf_forras"."cim" = v.regi;
