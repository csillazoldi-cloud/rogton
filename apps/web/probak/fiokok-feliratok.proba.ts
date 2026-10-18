import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { lezar, sql } from "./segedek";

// E-50: a GÉPEZET, ami őrzi, hogy a Fiókok lapon ne jelenjen meg felirat helyett kulcs.
// A felület `t("...")` hívásaiból kiszedjük a kulcsokat, és megnézzük, hogy MIND A HÁROM nyelven
// megvan-e az adatbázisban. Egy elgépelt kulcs eddig csak a képernyőn látszott volna — most elbukik.

const GYOKER = join(import.meta.dirname, "..");
const FAJLOK = [
  "app/fiokok/Fiokok.tsx",
  "app/_kozos/GazdaNav.tsx",
];
const NYELVEK = ["hu", "ro", "en"] as const;

/** A `t("kulcs")` és `t("kulcs", {…})` hívások kulcsai. A sablonos (`t(\`…\`)`) hívásokat külön kezeljük. */
function kulcsok(forras: string): string[] {
  const ki = new Set<string>();
  for (const t of forras.matchAll(/\bt\(\s*"([a-z][A-Za-z0-9_.]*)"/g)) ki.add(t[1]!);
  return [...ki];
}

// A szerep-feliratok neve összerakva áll elő (`fiokok.role${…}`) — ezeket tételesen soroljuk fel,
// mert a kereső mintázat nem látja őket.
const OSSZERAKOTT = ["fiokok.roleOwner", "fiokok.roleEditor", "fiokok.roleViewer"];

afterAll(async () => {
  await lezar();
});

describe("Fiokok lap feliratai (E-50)", () => {
  it("minden hasznalt kulcs megvan mind a harom nyelven", async () => {
    const hasznalt = new Set<string>(OSSZERAKOTT);
    for (const f of FAJLOK) for (const k of kulcsok(readFileSync(join(GYOKER, f), "utf8"))) hasznalt.add(k);
    // csak a lap saját kulcsait ellenőrizzük itt; a `kozos.*` és `hiba.*` kulcsokat más próbák őrzik
    const sajat = [...hasznalt].filter((k) => k.startsWith("fiokok.") || k.startsWith("gazdanav."));
    expect(sajat.length).toBeGreaterThan(50);

    const sorok = await sql<{ kulcs: string; nyelv: string }>(
      "SELECT kulcs, nyelv FROM felirat WHERE kulcs LIKE 'fiokok.%' OR kulcs LIKE 'gazdanav.%'",
    );
    const megvan = new Set(sorok.map((s) => `${s.kulcs}|${s.nyelv}`));
    const hianyzo: string[] = [];
    for (const k of sajat) for (const ny of NYELVEK) if (!megvan.has(`${k}|${ny}`)) hianyzo.push(`${k} (${ny})`);
    expect(hianyzo).toEqual([]);
  });

  it("a felfuggesztes es az onkizaras hibauzenetenek is van szovege", async () => {
    const sorok = await sql<{ kulcs: string; nyelv: string }>(
      "SELECT kulcs, nyelv FROM felirat WHERE kulcs IN ('hiba.FIOK_FELFUGGESZTVE','hiba.ONKIZARAS','hiba.NINCS_ILYEN_FIOK')",
    );
    expect(sorok.length).toBe(9);
  });
});
