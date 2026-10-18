-- Kézzel írt migráció (drizzle-kit --custom), E-7.
ALTER TABLE "ai_hivas" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT SELECT, INSERT ON "ai_hivas" TO km_app;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON "ai_koltseg_honap" TO km_app;
