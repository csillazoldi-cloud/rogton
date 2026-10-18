-- V1: a Posztszöveg munka táblája. Egy munka = egy gondolat; a szövegek (felület × nyelv) és az
-- összhangvizsgálat eredménye jsonb-ban. Sorszintű védelem: a `km_app` csak a saját szervezetének
-- sorait látja (mint a szervezet_iranytu).
CREATE TABLE "poszt_munka" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"cim" text NOT NULL,
	"forras" jsonb NOT NULL,
	"szovegek" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"osszhang" jsonb,
	"piros_veglegesites" boolean DEFAULT false NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL,
	"letrehozta" uuid
);--> statement-breakpoint
ALTER TABLE "poszt_munka" ADD CONSTRAINT "poszt_munka_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poszt_munka" ADD CONSTRAINT "poszt_munka_letrehozta_fiok_id_fk" FOREIGN KEY ("letrehozta") REFERENCES "public"."fiok"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "poszt_munka_szervezet_frissitve_idx" ON "poszt_munka" USING btree ("szervezet_id","frissitve");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "poszt_munka" TO "km_app";--> statement-breakpoint
ALTER TABLE "poszt_munka" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "poszt_munka_sajat_szervezet" ON "poszt_munka" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
