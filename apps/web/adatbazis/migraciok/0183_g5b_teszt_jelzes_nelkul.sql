-- 0183: G5b (Rögtön, 2026-10-18) — a „teszt” jelzés kikerül: a nyilvános fejlécek „teszt” jelvényét a kód már nem teszi ki
--   (apps/web/app/_kozos/Keretek.tsx; a kozos.teszt_jelveny kulcs marad, de nem látszik), a verziósor végéről a „· teszt” lekerül.
--   Csak meglévő kulcs szövege változik; ismételhető.
--
-- Próbafuttatás (várt kimenet: INSERT 0 3, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0183_g5b_teszt_jelzes_nelkul.sql; echo "ROLLBACK;"; } | docker exec -i gma-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('kezdolap.sor', 'hu', 'Rögtön · {verzio}'),
  ('kezdolap.sor', 'ro', 'Rögtön · {verzio}'),
  ('kezdolap.sor', 'en', 'Rögtön · {verzio}')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
