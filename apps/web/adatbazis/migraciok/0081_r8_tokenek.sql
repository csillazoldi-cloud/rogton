-- R-8 (Vilmos 2026-09-15): a tokenkészlet a rajz szintjén — a TÁROLT közös alapban a rajz értékei nyernek; új tokenek; a Megjelenés lap feliratai

UPDATE "tema"
SET "definicio" = jsonb_set(
  "definicio",
  '{tokens}',
  ("definicio" -> 'tokens') || '{"--bg":"#070912","--bg-elev":"#0d1020","--primary":"#5b6cff","--primary-2":"#9a6bff","--accent":"#ff7a59","--accent-text":"#ffb39f","--accent-link":"#9fa8ff","--font-display":"''Sora'',sans-serif","--font-body":"''Manrope'',sans-serif","--fs-metric":"34px","--r-card":"16px","--r-block":"12px","--r-btn":"12px","--r-field":"10px","--r-badge":"999px","--keszul":"#9fb0d8","--accent-warm":"#ff7a59","--accent-gold":"#ffb86b","--aurora-opacity":"50","--orb-size":"88px"}'::jsonb
)
WHERE "allapot" IN ('alkalmazott', 'tervezet');

--> statement-breakpoint

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('tema.accent_warm', 'hu', 'Meleg kiemelő szín'),
  ('tema.accent_warm', 'ro', 'Culoare de accent caldă'),
  ('tema.accent_warm', 'en', 'Warm accent'),
  ('tema.accent_gold', 'hu', 'Arany jelzés (érdekes)'),
  ('tema.accent_gold', 'ro', 'Auriu (interesant)'),
  ('tema.accent_gold', 'en', 'Gold (interesting)'),
  ('tema.aurora_opacity', 'hu', 'Fényudvar erőssége (0 = nincs)'),
  ('tema.aurora_opacity', 'ro', 'Intensitatea aurei (0 = fără)'),
  ('tema.aurora_opacity', 'en', 'Aurora strength (0 = none)'),
  ('tema.orb_size', 'hu', 'AI-korong mérete'),
  ('tema.orb_size', 'ro', 'Mărimea discului AI'),
  ('tema.orb_size', 'en', 'AI orb size')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
