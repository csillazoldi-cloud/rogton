-- 0130: T8 — a heti haladás számlálója. A „kep_letoltve” események naplója szervezetenként.
-- A hétfő 00:00-tól (Europe/Bucharest) számolunk; a poszt_kesz a poszt_munka szovegek celláiból jön.
-- Sorszintű védelem: a `km_app` csak a saját szervezetének sorait látja (mint a kep_pelda).
CREATE TABLE IF NOT EXISTS "halad_esemeny" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"fajta" text NOT NULL,
	"ido" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "halad_esemeny_fajta_check" CHECK ("fajta" IN ('kep_letoltve'))
);--> statement-breakpoint
ALTER TABLE "halad_esemeny" DROP CONSTRAINT IF EXISTS "halad_esemeny_szervezet_id_szervezet_id_fk";--> statement-breakpoint
ALTER TABLE "halad_esemeny" ADD CONSTRAINT "halad_esemeny_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "halad_esemeny_szervezet_ido_idx" ON "halad_esemeny" ("szervezet_id","ido");--> statement-breakpoint
GRANT SELECT, INSERT ON "halad_esemeny" TO "km_app";--> statement-breakpoint
ALTER TABLE "halad_esemeny" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "halad_esemeny_sajat_szervezet" ON "halad_esemeny";--> statement-breakpoint
CREATE POLICY "halad_esemeny_sajat_szervezet" ON "halad_esemeny" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
