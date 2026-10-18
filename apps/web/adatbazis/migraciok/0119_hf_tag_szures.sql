-- R-13 (2026-09-22, Vilmos): a hírszűrés fiókonként állítható — fokozat (nagyon szigorú · közepes · laza) és előszűrés (be/ki).
-- Egy sor = egy tag beállítása egy munkatérben; ha nincs sor, az alap: nagyon szigorú + előszűrés be (a mai viselkedés).
CREATE TABLE IF NOT EXISTS "hf_tag_szures" (
	"szervezet_id" uuid NOT NULL,
	"fiok_id" uuid NOT NULL,
	"fokozat" text DEFAULT 'nagyon_szigoru' NOT NULL,
	"eloszures" boolean DEFAULT true NOT NULL,
	"modositva" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hf_tag_szures_pk" PRIMARY KEY ("szervezet_id", "fiok_id"),
	CONSTRAINT "hf_tag_szures_fokozat" CHECK ("fokozat" IN ('nagyon_szigoru', 'kozepes', 'laza'))
);--> statement-breakpoint
ALTER TABLE "hf_tag_szures" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_tag_szures" ADD CONSTRAINT "hf_tag_szures_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hf_tag_szures" ADD CONSTRAINT "hf_tag_szures_fiok_id_fiok_id_fk" FOREIGN KEY ("fiok_id") REFERENCES "public"."fiok"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "hf_tag_szures_sajat" ON "hf_tag_szures" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_tag_szures" TO "km_app";--> statement-breakpoint
-- Az összkép szűrő-kulcsonként (az azonos beállítású tagok ugyanazt látják); a meglévő sor a mai alapé.
ALTER TABLE "hf_osszkep" ADD COLUMN IF NOT EXISTS "szuro_kulcs" text DEFAULT 'nagyon_szigoru|be' NOT NULL;--> statement-breakpoint
ALTER TABLE "hf_osszkep" DROP CONSTRAINT IF EXISTS "hf_osszkep_pkey";--> statement-breakpoint
ALTER TABLE "hf_osszkep" ADD CONSTRAINT "hf_osszkep_pkey" PRIMARY KEY ("szervezet_id", "szuro_kulcs");
