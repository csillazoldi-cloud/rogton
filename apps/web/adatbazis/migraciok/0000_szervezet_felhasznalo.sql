CREATE TYPE "public"."szerep" AS ENUM('tulajdonos', 'szerkeszto', 'nezo');--> statement-breakpoint
CREATE TABLE "felhasznalo" (
	"szervezet_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nev" text NOT NULL,
	"szerep" "szerep" DEFAULT 'nezo' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "felhasznalo" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "szervezet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nev" text NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "szervezet" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "felhasznalo" ADD CONSTRAINT "felhasznalo_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "felhasznalo_szervezet_email" ON "felhasznalo" USING btree ("szervezet_id","email");--> statement-breakpoint
CREATE POLICY "felhasznalo_sajat_szervezet" ON "felhasznalo" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "szervezet_sajat" ON "szervezet" AS PERMISSIVE FOR ALL TO "km_app" USING (id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (id = nullif(current_setting('app.szervezet_id', true), '')::uuid);