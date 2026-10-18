CREATE TABLE "fiok" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nev" text NOT NULL,
	"jelszo_hash" text NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "munkamenet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fiok_id" uuid NOT NULL,
	"token_lenyomat" text NOT NULL,
	"lejar" timestamp with time zone NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tagsag" (
	"szervezet_id" uuid NOT NULL,
	"fiok_id" uuid NOT NULL,
	"szerep" "szerep" DEFAULT 'nezo' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tagsag_szervezet_id_fiok_id_pk" PRIMARY KEY("szervezet_id","fiok_id")
);
--> statement-breakpoint
ALTER TABLE "tagsag" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "felhasznalo_sajat_szervezet" ON "felhasznalo" CASCADE;--> statement-breakpoint
DROP TABLE "felhasznalo" CASCADE;--> statement-breakpoint
ALTER TABLE "munkamenet" ADD CONSTRAINT "munkamenet_fiok_id_fiok_id_fk" FOREIGN KEY ("fiok_id") REFERENCES "public"."fiok"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tagsag" ADD CONSTRAINT "tagsag_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tagsag" ADD CONSTRAINT "tagsag_fiok_id_fiok_id_fk" FOREIGN KEY ("fiok_id") REFERENCES "public"."fiok"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fiok_email" ON "fiok" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "munkamenet_token" ON "munkamenet" USING btree ("token_lenyomat");--> statement-breakpoint
CREATE INDEX "munkamenet_fiok" ON "munkamenet" USING btree ("fiok_id");--> statement-breakpoint
CREATE INDEX "tagsag_fiok" ON "tagsag" USING btree ("fiok_id");--> statement-breakpoint
CREATE POLICY "szervezet_tagkent" ON "szervezet" AS PERMISSIVE FOR SELECT TO "km_app" USING (exists (select 1 from tagsag t where t.szervezet_id = szervezet.id and t.fiok_id = nullif(current_setting('app.fiok_id', true), '')::uuid));--> statement-breakpoint
CREATE POLICY "tagsag_sajat_szervezet" ON "tagsag" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
CREATE POLICY "tagsag_sajat_fiok" ON "tagsag" AS PERMISSIVE FOR SELECT TO "km_app" USING (fiok_id = nullif(current_setting('app.fiok_id', true), '')::uuid);