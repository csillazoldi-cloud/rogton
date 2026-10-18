CREATE TABLE "felirat" (
	"kulcs" text NOT NULL,
	"nyelv" text NOT NULL,
	"szoveg" text NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "felirat_kulcs_nyelv_pk" PRIMARY KEY("kulcs","nyelv")
);
--> statement-breakpoint
CREATE TABLE "tema" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nev" text NOT NULL,
	"verzio" integer NOT NULL,
	"definicio" jsonb NOT NULL,
	"aktiv" boolean DEFAULT false NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tema_nev_verzio" ON "tema" USING btree ("nev","verzio");--> statement-breakpoint
CREATE UNIQUE INDEX "tema_egy_aktiv" ON "tema" USING btree ("aktiv") WHERE aktiv;