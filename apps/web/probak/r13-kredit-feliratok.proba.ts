// R-13 kredit-képernyők — a 0145 feliratai (design/R13/feliratok.json, gepezet.md). A 0145 a fájl 76 kulcsa × 3 nyelv, betűre; egyik
// sem létezett korábbi migrációban. És a lapok tiszta döntései (app/_kozos/r13-szabaly.ts). Fájlolvasás, adatbázis nélkül.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { elfogyottTag, fokozatMondat, kreditElfogyott } from "../app/_kozos/r13-szabaly";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const MIG = gy("apps/web/adatbazis/migraciok/");
const fajlNevek = readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort();
const korabbi = fajlNevek.filter((f) => f < "0145").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const m0145 = readFileSync(MIG + "0145_r13_kredit_feliratok.sql", "utf8");
const fajl = JSON.parse(readFileSync(gy("design/R13/feliratok.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");
// T3 + kerdesek 1: a „szűr*” szó soha nem látható szöveg; a tiltott gép-szavak egyik nyelven sem
const TILTOTT = [/szűr/i, /filtr/i, /\bfilter/i, /futás/i, /\bmodul/i, /verzió/i, /ai-keret/i, /\btoken/i, /ai-javaslat/i, /\bmodule/i, /\bversion/i];

describe("R-13 kredit-képernyők feliratai (0145)", () => {
  it("a 0145 pontosan a feliratok.json 76 kulcsa × 3 nyelv, a fájl szövegével betűre", () => {
    const sorok = [...m0145.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)];
    expect(Object.keys(fajl.hu).length).toBe(76);
    expect(sorok.length).toBe(228);
    const hiany: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) if (!m0145.includes(`('${k}', '${ny}', '${sql(v)}')`)) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
    expect(new Set(sorok.map((s) => s[1])).size).toBe(76);
  });
  it("a három nyelv ugyanazokat a kulcsokat és helyőrzőket adja, üres szöveg nincs", () => {
    const h = (s: string) => [...s.matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]).sort().join(",");
    for (const ny of ["ro", "en"] as const) expect(Object.keys(fajl[ny]).sort()).toEqual(Object.keys(fajl.hu).sort());
    for (const k of Object.keys(fajl.hu)) {
      expect(fajl.hu[k]!.trim().length, k).toBeGreaterThan(0);
      expect(h(fajl.ro[k]!), k).toBe(h(fajl.hu[k]!));
      expect(h(fajl.en[k]!), k).toBe(h(fajl.hu[k]!));
    }
  });
  it("mind a 76 kulcs új: egyik sem szerepelt korábbi migrációban", () => {
    for (const k of Object.keys(fajl.hu)) expect(korabbi.includes(`('${k}', `), k).toBe(false);
  });
  it("T3: egyik szöveg sem tartalmaz tiltott szót (a „szűr*” sem), egyik nyelven sem", () => {
    const bajok: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) for (const t of TILTOTT) if (t.test(v)) bajok.push(`${k} (${ny}): ${v}`);
    expect(bajok).toEqual([]);
  });
  it("ismételhető: egy INSERT, ON CONFLICT … DO UPDATE", () => {
    expect(m0145.match(/INSERT INTO "felirat"/g)?.length).toBe(1);
    expect(m0145.match(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE SET "szoveg" = EXCLUDED\."szoveg"/g)?.length).toBe(1);
  });
});

describe("R-13 kredit-képernyők 2. kör — a 0146 felirata (Csilla 10-06)", () => {
  const m0146 = readFileSync(MIG + "0146_r13_tobb_kredit_link.sql", "utf8");
  it("a 0146 egy új kulcs × 3 nyelv, Csilla szövegével betűre, ismételhetően", () => {
    expect(m0146).toContain("('r13.kredit.tobbet_szeretnel', 'hu', 'Szeretnél több kreditet?')");
    expect(m0146).toContain("('r13.kredit.tobbet_szeretnel', 'ro', 'Vrei mai multe credite?')");
    expect(m0146).toContain("('r13.kredit.tobbet_szeretnel', 'en', 'Want more credits?')");
    expect([...m0146.matchAll(/\('r13\./g)].length).toBe(3);
    expect(m0146).toMatch(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE SET "szoveg" = EXCLUDED\."szoveg"/);
    const elotte = fajlNevek.filter((f) => f < "0146").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
    expect(elotte.includes("'r13.kredit.tobbet_szeretnel'")).toBe(false);
  });
});

describe("R-13 kredit-képernyők — a lapok döntései (r13-szabaly)", () => {
  // a felület t() függvénye a feliratfájl magyar szövegével
  const t = (k: string, e: Record<string, string | number> = {}) => (fajl.hu[k] ?? k).replace(/\{([a-z]+)\}/g, (_, n: string) => String(e[n] ?? `{${n}}`));
  it("13a: a fokozat mondata a hellyel és a témákkal — ékezetes, vesszős, hosszú adattal", () => {
    const sz = { hely: "Marosvásárhely", temak: ["térkövezés", "udvarok, járdák", "díszburkolat és kerítés"] };
    expect(fokozatMondat(t, { fokozat: "nagyon_szigoru", ...sz })).toBe("Csak Marosvásárhely környéki hír: térkövezés, udvarok, járdák, díszburkolat és kerítés — vagy rólatok.");
    expect(fokozatMondat(t, { fokozat: "kozepes", ...sz })).toBe("Bárhonnan jöhet hír, ha a témája: térkövezés, udvarok, járdák, díszburkolat és kerítés.");
    expect(fokozatMondat(t, { fokozat: "laza", ...sz })).toBe("Az is jöhet, ami csak érinti: térkövezés, udvarok, járdák, díszburkolat és kerítés.");
  });
  it("13a: beállítás nélkül (nincs téma, vagy szigorúnál nincs hely) a fokozat általános mondata áll, nem csonka mondat", () => {
    expect(fokozatMondat(t, { fokozat: "nagyon_szigoru", hely: "", temak: ["térkövezés"] })).toBe("Helyi hír a témádról, vagy rólatok.");
    expect(fokozatMondat(t, { fokozat: "kozepes", hely: "Târgu Mureș", temak: [] })).toBe("Bárhonnan, ha a témádról szól.");
    expect(fokozatMondat(t, { fokozat: "laza", hely: "", temak: ["pavaj"] })).toBe("Az is jöhet, ami csak érinti: pavaj.");
  });
  it("13b3: az első tag, akinek nem maradt kreditje; ha senkinek, null", () => {
    const tagok = [{ nev: "Kovács Tibor", maradt: 312 }, { nev: "Szabó Anna", maradt: 0 }, { nev: "Kovács Bence", maradt: 0 }];
    expect(elfogyottTag(tagok)?.nev).toBe("Szabó Anna");
    expect(elfogyottTag([{ nev: "Kovács Bence", maradt: 458.5 }])).toBeNull();
  });
  it("13d: elfogyott, ha a tagnak nem maradt, VAGY a munkatérnek fogyott el (mint a kiszolgáló indithato-ja)", () => {
    expect(kreditElfogyott({ maradt: 0, munkater_elfogyott: false })).toBe(true);
    expect(kreditElfogyott({ maradt: 12.5, munkater_elfogyott: true })).toBe(true);
    expect(kreditElfogyott({ maradt: 0.001, munkater_elfogyott: false })).toBe(false);
  });
});
