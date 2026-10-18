-- 0106: a Költség lap feladatnevei az új AI-munkákhoz (hu/ro/en). Eddig a gépi név látszott
-- (pl. „poszt_szoveg"), ami fejlesztői nyelv — az F-8.2 szabálya szerint ez nem maradhat.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('koltseg.f_iranytu_javaslat', 'hu', 'Javaslat a cég iránytűjéhez'),
  ('koltseg.f_iranytu_javaslat', 'ro', 'Propunere pentru busola firmei'),
  ('koltseg.f_iranytu_javaslat', 'en', 'Suggestion for the company compass'),
  ('koltseg.f_poszt_szoveg', 'hu', 'Posztszöveg írása'),
  ('koltseg.f_poszt_szoveg', 'ro', 'Scrierea textului de postare'),
  ('koltseg.f_poszt_szoveg', 'en', 'Writing a post text'),
  ('koltseg.f_poszt_atiras', 'hu', 'Posztszöveg átírása'),
  ('koltseg.f_poszt_atiras', 'ro', 'Rescrierea textului de postare'),
  ('koltseg.f_poszt_atiras', 'en', 'Rewriting a post text'),
  ('koltseg.f_poszt_forditas', 'hu', 'Posztszöveg fordítása'),
  ('koltseg.f_poszt_forditas', 'ro', 'Traducerea textului de postare'),
  ('koltseg.f_poszt_forditas', 'en', 'Translating a post text'),
  ('koltseg.f_poszt_nyelvre_szabas', 'hu', 'Posztszöveg nyelvre szabása'),
  ('koltseg.f_poszt_nyelvre_szabas', 'ro', 'Adaptarea la limbă a textului de postare'),
  ('koltseg.f_poszt_nyelvre_szabas', 'en', 'Adapting a post text to the language'),
  ('koltseg.f_poszt_osszhang', 'hu', 'Összhang a cég iránytűjével'),
  ('koltseg.f_poszt_osszhang', 'ro', 'Potrivirea cu busola firmei'),
  ('koltseg.f_poszt_osszhang', 'en', 'Fit with the company compass'),
  ('koltseg.f_javitocsomag', 'hu', 'Napi javítócsomag'),
  ('koltseg.f_javitocsomag', 'ro', 'Pachetul zilnic de corecții'),
  ('koltseg.f_javitocsomag', 'en', 'Daily fix package')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
