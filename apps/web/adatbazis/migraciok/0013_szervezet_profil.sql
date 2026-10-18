-- Kézzel írt migráció, E-9: a szervezet jóváhagyott profilja (R-06).
CREATE TABLE "szervezet_profil" (
	"szervezet_id" uuid PRIMARY KEY NOT NULL,
	"adatok" jsonb NOT NULL,
	"jovahagyva" timestamp with time zone DEFAULT now() NOT NULL,
	"jovahagyta" uuid,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "szervezet_profil" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "szervezet_profil" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "szervezet_profil" ADD CONSTRAINT "szervezet_profil_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "szervezet_profil" ADD CONSTRAINT "szervezet_profil_jovahagyta_fiok_id_fk" FOREIGN KEY ("jovahagyta") REFERENCES "public"."fiok"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "profil_sajat_szervezet" ON "szervezet_profil" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "szervezet_profil" TO km_app;
