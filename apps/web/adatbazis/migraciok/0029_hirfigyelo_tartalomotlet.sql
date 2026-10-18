-- Kézzel írt migráció (drizzle-kit --custom), E-23: a Hírfigyelő találatainak tartalomötlete.
ALTER TABLE "hf_talalat" ADD COLUMN "tartalomotlet" jsonb;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_talalat" TO km_app;
