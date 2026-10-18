-- 0126: VZ-2 — a munkatér iparági képcsomagjai. A „Közlekedési közlemények (3)” sor (a régi három kép) csak ott látszik,
-- ahol a "kozlekedes" csomag be van kapcsolva (DESIGN-KERES-VZ2, 3. pont). Alapból egy munkatérnek sincs.
ALTER TABLE "szervezet" ADD COLUMN IF NOT EXISTS "iparagi_csomagok" text[] DEFAULT '{}'::text[] NOT NULL;
