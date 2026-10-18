-- F-3 javítás (2026-09-12, a teljes próbasor fogta meg): a meghívó két fiók-hivatkozása nem engedte törölni a fiókot
-- (a próbák takarítása `DELETE FROM fiok …` — "violates foreign key constraint meghivo_letrehozta_fkey").
-- A termékben fiók törlése nincs (R-3), de a próbák és a rendszergazdai takarítás igen: a kiadó fiókjával a meghívói mennek
-- (CASCADE), az elfogadó fiókja nélkül a meghívó megmarad, csak a hivatkozás ürül (SET NULL) — a tagság ettől független.
ALTER TABLE "meghivo" DROP CONSTRAINT IF EXISTS "meghivo_letrehozta_fkey";
ALTER TABLE "meghivo" ADD CONSTRAINT "meghivo_letrehozta_fkey" FOREIGN KEY ("letrehozta") REFERENCES "fiok"("id") ON DELETE CASCADE;
ALTER TABLE "meghivo" DROP CONSTRAINT IF EXISTS "meghivo_elfogadta_fkey";
ALTER TABLE "meghivo" ADD CONSTRAINT "meghivo_elfogadta_fkey" FOREIGN KEY ("elfogadta") REFERENCES "fiok"("id") ON DELETE SET NULL;
