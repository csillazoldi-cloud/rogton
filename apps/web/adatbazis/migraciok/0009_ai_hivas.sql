CREATE TABLE "ai_hivas" (
	"szervezet_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feladat" text NOT NULL,
	"szolgaltato" text NOT NULL,
	"modell" text NOT NULL,
	"tokenek_be" integer NOT NULL,
	"tokenek_ki" integer NOT NULL,
	"becsult_usd" numeric(10, 6) NOT NULL,
	"ido_ms" integer NOT NULL,
	"allapot" text NOT NULL,
	"hiba_kod" text,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_hivas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "ai_koltseg_honap" (
	"honap" text PRIMARY KEY NOT NULL,
	"becsult_usd" numeric(12, 6) DEFAULT '0' NOT NULL,
	"hivasok" integer DEFAULT 0 NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_hivas" ADD CONSTRAINT "ai_hivas_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_hivas_szervezet_ido" ON "ai_hivas" USING btree ("szervezet_id","letrehozva");--> statement-breakpoint
CREATE POLICY "ai_hivas_sajat_szervezet" ON "ai_hivas" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);