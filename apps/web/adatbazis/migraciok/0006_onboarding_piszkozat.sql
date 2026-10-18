CREATE TABLE "onboarding_piszkozat" (
	"szervezet_id" uuid PRIMARY KEY NOT NULL,
	"adatok" jsonb NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding_piszkozat" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "onboarding_piszkozat" ADD CONSTRAINT "onboarding_piszkozat_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "piszkozat_sajat_szervezet" ON "onboarding_piszkozat" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);