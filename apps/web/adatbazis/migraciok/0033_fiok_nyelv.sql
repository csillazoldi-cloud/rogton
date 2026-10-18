-- E-29c: a fiók nyelve. A nyelvváltó eddig csak sütibe írt, ezért a HÁTTÉRBEN futó figyelés nem tudhatta,
-- ki milyen nyelven használja a felületet — és az AI mindig magyarul válaszolt.
-- NULL = a fiók még nem váltott nyelvet (a süti/böngésző dönt, az AI magyarul ír).
ALTER TABLE "fiok" ADD COLUMN IF NOT EXISTS "nyelv" text;
