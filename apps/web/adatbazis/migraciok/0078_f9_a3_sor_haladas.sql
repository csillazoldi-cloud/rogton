-- F9-A3: a futás haladása a sor tételén; a haladás mondata
ALTER TABLE "hf_sor" ADD COLUMN IF NOT EXISTS "haladas" jsonb;--> statement-breakpoint
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.futas_haladas', 'hu', '{f}/{m} oldal · {c} cikk · {e} átnézve'),
  ('hf.futas_haladas', 'ro', '{f}/{m} site-uri · {c} articole · {e} evaluate'),
  ('hf.futas_haladas', 'en', '{f}/{m} sites · {c} articles · {e} reviewed')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
