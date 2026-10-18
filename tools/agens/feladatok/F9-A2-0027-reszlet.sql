CREATE TABLE "hf_futas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"szabaly_verzio" integer NOT NULL,
	"kezdet" timestamp with time zone NOT NULL,
	"veg" timestamp with time zone,
	"allapot" text NOT NULL,
	"uj_talalatok" integer DEFAULT 0 NOT NULL,
	"hibas_forrasok" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"proba" boolean DEFAULT false NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_futas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_futas" ADD CONSTRAINT "hf_futas_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_futas_szervezet_idx" ON "hf_futas" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_futas_sajat" ON "hf_futas" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
