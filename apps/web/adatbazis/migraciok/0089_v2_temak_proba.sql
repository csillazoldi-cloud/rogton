-- 0089: V2 (2026-09-18, Vilmos) — témák előre kitöltve, vessző/Enter, a próba magától indul és okot mond.
-- A hf.* feliratok: a próba hibakódjaihoz emberi mondat, plusz a mentés és a javaslat címkéi.

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.proba_hiba.AI_NEM_ELERHETO', 'hu', 'Az AI most nem válaszol. Pár perc múlva újra próbáljuk — vagy kattints az Újra futtatom gombra.'),
  ('hf.proba_hiba.AI_NEM_ELERHETO', 'ro', 'AI-ul nu răspunde acum. Reîncercăm în câteva minute — sau apasă butonul Rulează din nou.'),
  ('hf.proba_hiba.AI_NEM_ELERHETO', 'en', 'The AI is not responding right now. We will try again in a few minutes — or press the Run again button.'),

  ('hf.proba_hiba.FORRAS_HIBAS', 'hu', 'Egyik figyelt oldal sem ad hírfolyamot. Nézd meg a listát lent.'),
  ('hf.proba_hiba.FORRAS_HIBAS', 'ro', 'Niciun site urmărit nu oferă flux de știri. Verifică lista de mai jos.'),
  ('hf.proba_hiba.FORRAS_HIBAS', 'en', 'None of the monitored sites provides a news feed. Check the list below.'),

  ('hf.proba_hiba.NINCS_AKTIV_BEALLITAS', 'hu', 'Előbb adj meg legalább egy témát és egy oldalt.'),
  ('hf.proba_hiba.NINCS_AKTIV_BEALLITAS', 'ro', 'Mai întâi adaugă cel puțin o temă și un site.'),
  ('hf.proba_hiba.NINCS_AKTIV_BEALLITAS', 'en', 'First add at least one topic and one site.'),

  ('hf.proba_hiba.EGYEB', 'hu', 'Nem sikerült. Újra próbáljuk egy perc múlva.'),
  ('hf.proba_hiba.EGYEB', 'ro', 'Nu a reușit. Reîncercăm într-un minut.'),
  ('hf.proba_hiba.EGYEB', 'en', 'It did not succeed. We will try again in a minute.'),

  ('hf.mentve_ekkor', 'hu', 'Mentve · {ido}'),
  ('hf.mentve_ekkor', 'ro', 'Salvat · {ido}'),
  ('hf.mentve_ekkor', 'en', 'Saved · {ido}'),

  ('hf.tema_javaslat_cimke', 'hu', 'javaslat'),
  ('hf.tema_javaslat_cimke', 'ro', 'sugestie'),
  ('hf.tema_javaslat_cimke', 'en', 'suggestion'),

  ('hf.ujra_javasol', 'hu', 'Újra javasol'),
  ('hf.ujra_javasol', 'ro', 'Sugerează din nou'),
  ('hf.ujra_javasol', 'en', 'Suggest again'),

  ('hf.proba_ujra', 'hu', 'Újra futtatom'),
  ('hf.proba_ujra', 'ro', 'Rulează din nou'),
  ('hf.proba_ujra', 'en', 'Run again')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
