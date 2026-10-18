-- Kézzel írt migráció, E-18: a Theme-lap betöltési hibaútjának feliratai (a hibaút-végigjátszás találta: a kulcsok hiányoztak,
-- a lap a nyers kulcsot mutatta). A feliratok-lap párjaiból, három nyelven.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('tema.betoltes_loading', 'hu', 'A téma betöltése…'),
  ('tema.betoltes_load_err', 'hu', 'A téma betöltése nem sikerült. Mentés és alkalmazás letiltva, amíg nincs betöltve — a működő téma érintetlen.'),
  ('tema.betoltes_retry', 'hu', 'Betöltés újra'),
  ('tema.betoltes_loading', 'ro', 'Se încarcă tema…'),
  ('tema.betoltes_load_err', 'ro', 'Încărcarea temei a eșuat. Salvarea și aplicarea sunt dezactivate până la încărcare — tema funcțională rămâne neschimbată.'),
  ('tema.betoltes_retry', 'ro', 'Reîncercare încărcare'),
  ('tema.betoltes_loading', 'en', 'Loading theme…'),
  ('tema.betoltes_load_err', 'en', 'Loading the theme failed. Save and apply are disabled until loaded — the working theme remains untouched.'),
  ('tema.betoltes_retry', 'en', 'Retry loading')
ON CONFLICT ("kulcs", "nyelv") DO NOTHING;
