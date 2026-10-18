-- Kézzel írt migráció (drizzle-kit --custom), E-6.
ALTER TABLE "onboarding_piszkozat" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "onboarding_piszkozat" TO km_app;
