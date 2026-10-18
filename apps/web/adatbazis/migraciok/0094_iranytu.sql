-- V1: a cég iránytűje. A célok, a vízió és az értékrend NEM a tartalom forrása, hanem a SZŰRŐJE:
-- ehhez mérjük a generált szöveget. Egy szervezethez egy sor. A `tervezet` a még jóvá nem hagyott
-- változat, a `jovahagyott` a hiteles pillanatkép, a `verziok` a korábbi jóváhagyott állapotok.
-- Sorszintű védelem: a `km_app` csak a saját szervezetének sorát látja (mint a szervezet_profil).
CREATE TABLE "szervezet_iranytu" (
	"szervezet_id" uuid PRIMARY KEY NOT NULL,
	"tervezet" jsonb,
	"jovahagyott" jsonb,
	"verziok" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verzio" integer DEFAULT 0 NOT NULL,
	"jovahagyva" timestamp with time zone,
	"jovahagyta" uuid,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "szervezet_iranytu" ADD CONSTRAINT "szervezet_iranytu_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szervezet_iranytu" ADD CONSTRAINT "szervezet_iranytu_jovahagyta_fiok_id_fk" FOREIGN KEY ("jovahagyta") REFERENCES "public"."fiok"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON "szervezet_iranytu" TO "km_app";--> statement-breakpoint
ALTER TABLE "szervezet_iranytu" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "iranytu_sajat_szervezet" ON "szervezet_iranytu" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
