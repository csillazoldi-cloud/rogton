-- F-2 (R-1 v3): a kezdőképernyő és a Gépház tárolása — a szerződés 5. pontja SZÓ SZERINT.
-- A feliratok külön migrációban (0051_kezdolap_feliratok.sql, a feliratok.json-ból generálva).

-- A munkatér pénzneme (D5): euró · dollár · forint · lej.
ALTER TABLE "szervezet" ADD COLUMN IF NOT EXISTS "penznem" text NOT NULL DEFAULT 'EUR';
ALTER TABLE "szervezet" DROP CONSTRAINT IF EXISTS "szervezet_penznem_ervenyes";
ALTER TABLE "szervezet" ADD CONSTRAINT "szervezet_penznem_ervenyes" CHECK ("penznem" IN ('EUR','USD','HUF','RON'));

-- A fiók aktuális munkatere: tárolt választás (a bejárat az aktualisSzervezet()).
ALTER TABLE "fiok" ADD COLUMN IF NOT EXISTS "aktualis_szervezet_id" uuid REFERENCES "szervezet"("id") ON DELETE SET NULL;

-- Árfolyam: egy USD ennyi egység. TÁROLT, nem élő; a rendszergazda állítja.
CREATE TABLE IF NOT EXISTS "arfolyam" (
  "penznem" text PRIMARY KEY CHECK ("penznem" IN ('EUR','USD','HUF','RON')),
  "egy_usd" numeric(12,6) NOT NULL CHECK ("egy_usd" > 0),
  "frissitve" timestamptz NOT NULL DEFAULT now()
);

-- Kezdőértékek (a szerződés 5. pontja): EUR 0,92 · USD 1 · HUF 360 · RON 4,60.
INSERT INTO "arfolyam" ("penznem", "egy_usd") VALUES
  ('EUR', 0.92),
  ('USD', 1),
  ('HUF', 360),
  ('RON', 4.60)
ON CONFLICT ("penznem") DO NOTHING;

-- Az árfolyam KÖZÖS adat (nem szervezeti): nincs sorszintű védelem, a km_app olvassa és állítja.
GRANT SELECT, UPDATE ON "arfolyam" TO "km_app";
