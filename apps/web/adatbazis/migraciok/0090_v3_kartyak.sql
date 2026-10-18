-- 0090: V3 (2026-09-18, Vilmos 7. és 4. pont) — háttérhírek külön sorban, főoldal-találat kihagyása,
-- forrás hírfolyam nélkül. A feliratok hu/ro/en nyelven.

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.hatter_sor', 'hu', '+{n} háttérhír — megnézem'),
  ('hf.hatter_sor', 'ro', '+{n} știri de context — le văd'),
  ('hf.hatter_sor', 'en', '+{n} background stories — show me'),

  ('hf.hatter_elrejt', 'hu', 'Háttérhírek elrejtése'),
  ('hf.hatter_elrejt', 'ro', 'Ascunde știrile de context'),
  ('hf.hatter_elrejt', 'en', 'Hide background stories'),

  ('hf.kihagyott_fooldal', 'hu', '{n} találatot kihagytunk: nem cikk, hanem főoldal'),
  ('hf.kihagyott_fooldal', 'ro', 'Am omis {n} rezultate: nu sunt articole, ci pagina principală'),
  ('hf.kihagyott_fooldal', 'en', 'We skipped {n} results: not articles, but the front page'),

  ('hf.forras_nincs_hirfolyam', 'hu', 'Ez az oldal nem ad hírfolyamot — a főoldalát nem olvassuk. Adj meg egy rovatot vagy egy másik oldalt.'),
  ('hf.forras_nincs_hirfolyam', 'ro', 'Acest site nu oferă flux de știri — nu citim pagina principală. Dă o rubrică sau un alt site.'),
  ('hf.forras_nincs_hirfolyam', 'en', 'This site does not provide a news feed — we do not read its front page. Give a section or another site.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
