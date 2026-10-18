// 2026-10-06 tesztelői kör — a 0147 (feliratcserék) és a 0148 (névtelen visszajelzés felirata) alakja. Fájlolvasás, adatbázis nélkül.
// A 0147 csak MEGLÉVŐ kulcsok szövegét cseréli (új kulcs nincs), mindet hu/ro/en-ben — kivéve a betű-kérdést, ahol a ro/en már eddig is
// „font/typeface”-t mondott, ezért csak a hu változik (#7). A tartalom Kati / Kamilla szava szerint (triage + DONTESEK-1006).
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const MIG = new URL("../adatbazis/migraciok/", import.meta.url).pathname;
const nevek = readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort();
const korabbi = nevek.filter((f) => f < "0147").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const m147 = readFileSync(MIG + "0147_visszajelzes_1006_feliratok.sql", "utf8");
const m148 = readFileSync(MIG + "0148_visszajelzes_nevtelen.sql", "utf8");
const sorok = (s: string) => [...s.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)].map((m) => ({ kulcs: m[1]!, nyelv: m[2]!, szoveg: m[3]! }));

describe("0147 — a 10-06 feliratcserék", () => {
  const s = sorok(m147);
  it("22 sor, 8 kulcs; mind MEGLÉVŐ kulcs (egy korábbi migrációban már ott volt)", () => {
    expect(s.length).toBe(22);
    const kulcsok = [...new Set(s.map((x) => x.kulcs))].sort();
    expect(kulcsok).toEqual(["onboarding.eb_oldalak", "r16.arculat.betu.kerdes", "r16.arculat.betu.licenc", "r16.arculat.betu.sajat_tipus", "r16.arculat.fajlok",
      "r16.arculat.logok.melyik_hova", "r16.arculat.logok.melyik_hova_szoveg", "r16.arculat.logok.negyzetes"]);
    for (const k of kulcsok) expect(korabbi, k).toContain(`('${k}', 'hu',`);
  });
  it("a hu szövegek a kért alakban", () => {
    const hu = Object.fromEntries(s.filter((x) => x.nyelv === "hu").map((x) => [x.kulcs, x.szoveg]));
    expect(hu["r16.arculat.fajlok"]).toBe("Minták, kézikönyv"); // #4/H4
    expect(hu["r16.arculat.betu.kerdes"]).toBe("Milyen betűtípus illik hozzátok?"); // #7
    expect(hu["r16.arculat.betu.licenc"]).toBe("Csak olyan betűt tölts fel, amit szabad használnod."); // #8
    expect(hu["r16.arculat.betu.sajat_tipus"]).toContain("egyszerre több is"); // #9
    expect(hu["r16.arculat.logok.melyik_hova"]).toBe("Melyik logó hova kerül?"); // #12
    expect(hu["r16.arculat.logok.negyzetes"]).toBe("Profilképnek"); // #16
    expect(hu["r16.arculat.logok.melyik_hova_szoveg"]).toContain("Profilképnek:");
    expect(hu["r16.arculat.logok.melyik_hova_szoveg"]).not.toContain("Négyzetes");
    expect(hu["onboarding.eb_oldalak"]).toBe("Mely híroldalakat figyeljük"); // #24
  });
  it("minden kulcs hu/ro/en (a betű-kérdés kivétel: csak hu)", () => {
    for (const k of new Set(s.map((x) => x.kulcs))) {
      const ny = s.filter((x) => x.kulcs === k).map((x) => x.nyelv).sort();
      expect(ny, k).toEqual(k === "r16.arculat.betu.kerdes" ? ["hu"] : ["en", "hu", "ro"]);
    }
    expect(korabbi).toContain("('r16.arculat.betu.kerdes', 'ro', 'Ce font vi se potrivește?')");
    expect(korabbi).toContain("('r16.arculat.betu.kerdes', 'en', 'Which font suits you?')");
  });
  it("ismételhető (ON CONFLICT … DO UPDATE)", () => {
    expect(m147).toMatch(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE SET "szoveg" = EXCLUDED\."szoveg"/);
  });
});

describe("0148 — névtelen visszajelzés", () => {
  it("csak lazít és bővít (adat nem vész el): két DROP NOT NULL, egy új oszlop alapértékkel, 1 felirat × 3 nyelv", () => {
    expect(m148).toContain('ALTER TABLE "visszajelzes" ALTER COLUMN "szervezet_id" DROP NOT NULL;');
    expect(m148).toContain('ALTER TABLE "visszajelzes" ALTER COLUMN "fiok_id" DROP NOT NULL;');
    expect(m148).toContain('ADD COLUMN IF NOT EXISTS "nevtelen" boolean DEFAULT false NOT NULL;');
    expect(m148).not.toMatch(/\b(DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE|UPDATE "visszajelzes")\b/);
    expect(sorok(m148).map((x) => `${x.kulcs}/${x.nyelv}`)).toEqual(["vj.nevtelen/hu", "vj.nevtelen/ro", "vj.nevtelen/en"]);
    expect(korabbi).not.toContain("'vj.nevtelen'");
  });
});
