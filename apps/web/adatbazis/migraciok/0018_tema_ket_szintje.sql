-- Kézzel írt migráció (drizzle-kit --custom), E-13: a téma két szintje (D-09).
-- 1. A közös alap (tema) állapota: aktiv → allapot (tervezet / alkalmazott / korabbi); az aktív sor lesz az alkalmazott.
-- 2. Szervezeti felülírás (szervezet_tema), sorszintű védelemmel — csak az eltérő tokenek.
-- 3. A rendszergazda-jelölés a fiókon.
-- 4. A közös alap írása a rendszergazda műveleteihez: km_app kap INSERT/UPDATE jogot a tema táblára (a jogot az alkalmazás ellenőrzi: fiok.rendszergazda).
CREATE TYPE "tema_allapot" AS ENUM ('tervezet', 'alkalmazott', 'korabbi');--> statement-breakpoint
ALTER TABLE "tema" ADD COLUMN "allapot" "tema_allapot" DEFAULT 'tervezet' NOT NULL;--> statement-breakpoint
ALTER TABLE "tema" ADD COLUMN "alkalmazva" timestamp with time zone;--> statement-breakpoint
UPDATE "tema" SET "allapot" = CASE WHEN "aktiv" THEN 'alkalmazott'::"tema_allapot" ELSE 'korabbi'::"tema_allapot" END, "alkalmazva" = CASE WHEN "aktiv" THEN "letrehozva" ELSE NULL END;--> statement-breakpoint
DROP INDEX IF EXISTS "tema_egy_aktiv";--> statement-breakpoint
ALTER TABLE "tema" DROP COLUMN "aktiv";--> statement-breakpoint
CREATE UNIQUE INDEX "tema_egy_alkalmazott" ON "tema" USING btree ("allapot") WHERE allapot = 'alkalmazott';--> statement-breakpoint
CREATE UNIQUE INDEX "tema_egy_tervezet" ON "tema" USING btree ("allapot") WHERE allapot = 'tervezet';--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON "tema" TO km_app;--> statement-breakpoint
CREATE TABLE "szervezet_tema" (
	"szervezet_id" uuid NOT NULL,
	"verzio" integer NOT NULL,
	"felulirasok" jsonb NOT NULL,
	"allapot" "tema_allapot" DEFAULT 'tervezet' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"alkalmazva" timestamp with time zone,
	CONSTRAINT "szervezet_tema_szervezet_id_verzio_pk" PRIMARY KEY("szervezet_id","verzio")
);--> statement-breakpoint
ALTER TABLE "szervezet_tema" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "szervezet_tema" ADD CONSTRAINT "szervezet_tema_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "szervezet_tema_egy_alkalmazott" ON "szervezet_tema" USING btree ("szervezet_id") WHERE allapot = 'alkalmazott';--> statement-breakpoint
CREATE UNIQUE INDEX "szervezet_tema_egy_tervezet" ON "szervezet_tema" USING btree ("szervezet_id") WHERE allapot = 'tervezet';--> statement-breakpoint
CREATE POLICY "szervezet_tema_sajat" ON "szervezet_tema" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "szervezet_tema" TO km_app;--> statement-breakpoint
ALTER TABLE "fiok" ADD COLUMN "rendszergazda" boolean DEFAULT false NOT NULL;
