-- 0124: VZ-2 — a Képek hét helyzetének példaszövege (a gép írja a cég profiljából; Vilmos, 2026-09-24).
-- Egy sor szervezetenként. Az `ujj` a forrás ujjlenyomata: ha a profil vagy az Iránytű „tolni” része változik, a gép újraírja.
-- Sorszintű védelem: a `km_app` csak a saját szervezetének sorát látja (mint a szervezet_iranytu).
CREATE TABLE IF NOT EXISTS "kep_pelda" (
	"szervezet_id" uuid PRIMARY KEY NOT NULL,
	"nyelv" text NOT NULL,
	"ujj" text NOT NULL,
	"adat" jsonb NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "kep_pelda" DROP CONSTRAINT IF EXISTS "kep_pelda_szervezet_id_szervezet_id_fk";--> statement-breakpoint
ALTER TABLE "kep_pelda" ADD CONSTRAINT "kep_pelda_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON "kep_pelda" TO "km_app";--> statement-breakpoint
ALTER TABLE "kep_pelda" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "kep_pelda_sajat_szervezet" ON "kep_pelda";--> statement-breakpoint
CREATE POLICY "kep_pelda_sajat_szervezet" ON "kep_pelda" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
