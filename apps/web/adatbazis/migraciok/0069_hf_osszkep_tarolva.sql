-- F9-A2: az összkép tárolva futásonként; a Hírek lap betöltő mondatai
CREATE TABLE "hf_osszkep" (
	"szervezet_id" uuid PRIMARY KEY,
	"futas_id" uuid,
	"osszkep" jsonb,
	"hiba_ideje" timestamp with time zone,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_osszkep" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_osszkep" ADD CONSTRAINT "hf_osszkep_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "hf_osszkep_sajat" ON "hf_osszkep" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_osszkep" TO "km_app";--> statement-breakpoint
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.betoltes', 'hu', 'Betöltjük a korábban összegyűjtött híreidet.'),
  ('hf.betoltes', 'ro', 'Încărcăm știrile adunate mai devreme.'),
  ('hf.betoltes', 'en', 'Loading the news we collected earlier.'),
  ('hf.betoltes_lassu', 'hu', 'A hírek betöltése a szokásosnál tovább tart.'),
  ('hf.betoltes_lassu', 'ro', 'Încărcarea știrilor durează mai mult decât de obicei.'),
  ('hf.betoltes_lassu', 'en', 'Loading the news is taking longer than usual.'),
  ('hf.ujraprobalom', 'hu', 'Újrapróbálom'),
  ('hf.ujraprobalom', 'ro', 'Încerc din nou'),
  ('hf.ujraprobalom', 'en', 'Try again')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
