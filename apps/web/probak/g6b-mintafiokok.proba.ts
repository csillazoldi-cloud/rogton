// G6b: the seed sample accounts (anna/andras@teszt-a.example, bela@teszt-b.example) were found ACTIVE in the live
// production DB. Migration 0184 retires them with the app's own suspension convention (fiok.felfuggesztve, E-50), never
// a hard delete; their two sample organisations get AI switched off (szervezet has no retire flag).
// DB part: runs against the test DB (fresh, all migrations incl. 0184 applied). Live part: the running app's login.
// File part: the first-admin rule and the guards, read from the sources.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { keres, lezar, sql, DATABASE_URL } from "./segedek";

const VAN_ADATBAZIS = DATABASE_URL !== "";
const GYOKER = join(__dirname, "..", "..", "..");
const olvas = (ut: string) => readFileSync(join(GYOKER, ut), "utf8");
const MINTA_FIOKOK = ["andras@teszt-a.example", "anna@teszt-a.example", "bela@teszt-b.example"];

afterAll(async () => {
  if (VAN_ADATBAZIS) await lezar();
});

describe.skipIf(!VAN_ADATBAZIS)("G6b — 0184 a minta-fiókokat kivonja (adatbázis)", () => {
  it("1. a három minta-fiók megvan (nincs törlés), felfüggesztett, és nem rendszergazda", async () => {
    const sorok = await sql<{ email: string; felf: boolean; rg: boolean }>(
      "SELECT email, felfuggesztve IS NOT NULL AS felf, rendszergazda AS rg FROM fiok WHERE email = ANY($1) ORDER BY email",
      [MINTA_FIOKOK],
    );
    expect(sorok.map((s) => s.email)).toEqual(MINTA_FIOKOK);
    for (const s of sorok) {
      expect(s.felf, `${s.email} felfüggesztve`).toBe(true);
      expect(s.rg, `${s.email} rendszergazda`).toBe(false);
    }
  });

  it("2. a két minta-szervezet megvan, de az AI ki van kapcsolva", async () => {
    const sorok = await sql<{ ai: boolean }>(
      "SELECT ai_engedelyezve AS ai FROM szervezet WHERE id IN ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222')",
    );
    expect(sorok).toHaveLength(2);
    expect(sorok.every((s) => s.ai === false)).toBe(true);
  });

  it("3. a 0184 lefutott: a migrációs naplóban (_migracio) pontosan egyszer szerepel", async () => {
    const sorok = await sql<{ n: string }>("SELECT count(*)::text AS n FROM \"_migracio\" WHERE nev LIKE '0184\\_%'");
    expect(sorok[0]?.n).toBe("1");
  });

  it("4. minta-fiókkal nem lehet belépni (élő alkalmazás)", async () => {
    const v = await keres<{ hiba?: string }>("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email: "bela@teszt-b.example", jelszo: "BarmiJelszo123!" },
      fejlecek: { "x-forwarded-for": "203.0.113.250-g6b" },
    });
    expect(v.statusz).toBe(401);
  });
});

describe("G6b — fájlszintű őrök", () => {
  const mig = olvas("apps/web/adatbazis/migraciok/0184_g6b_mintafiokok_kivonva.sql");
  const kod = mig.replace(/--.*$/gm, "");

  it("5. a 0184 nem töröl: nincs DELETE / TRUNCATE / DROP, csak UPDATE", () => {
    expect(kod).not.toMatch(/\b(DELETE|TRUNCATE|DROP)\b/i);
    expect(kod).toMatch(/UPDATE "fiok"/);
    expect(kod).toMatch(/"felfuggesztve"/);
  });

  it("6. az első rendszergazda szabálya a felfüggesztett rendszergazdát nem számolja", () => {
    const h = olvas("apps/web/hitelesites/index.ts");
    expect(h).toMatch(/eq\(sema\.fiok\.rendszergazda, true\), isNull\(sema\.fiok\.felfuggesztve\)/);
    // and there is no "oldest account becomes admin" path: the flag is only ever set for RENDSZERGAZDA_EMAIL
    expect(h).not.toMatch(/orderBy\([^)]*letrehozva/);
  });

  it("7. az őrök jelzik az aktív .example fiókot: a tiltott-szó őr --db és a kirak.sh", () => {
    expect(olvas("tools/tiltott/ellenoriz.mjs")).toMatch(/email ~\* '\[\.\]example\$' AND felfuggesztve IS NULL/);
    expect(olvas("uzem/kirak.sh")).toMatch(/email ~\* '\[\.\]example\\\$' AND felfuggesztve IS NULL/);
  });
});
