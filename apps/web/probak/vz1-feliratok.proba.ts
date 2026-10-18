// VZ-1 · a 0151 (feliratok) és a 0152 (a szám és a jelzések táblái) alakja. Fájlolvasás, adatbázis nélkül.
//  - a rajz 45 vz1r.* kulcsa BETŰRE a design/VZ1-szerkeszto/feliratok.json-ból, hu/ro/en; a többi új kulcs is mindhárom nyelven;
//  - minden vz1r.* kulcs, amit a kód használ, megvan a 0151-ben; a régi szerkesztő képernyője (Szerkeszto.tsx, Sablonok.tsx) már nincs;
//  - a 0152 csak új táblát és függvényt hoz (adatvesztés nincs), sorszintű védelemmel, ismételhetően.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const MIG = gy("apps/web/adatbazis/migraciok/");
const m151 = readFileSync(MIG + "0151_vz1r_feliratok.sql", "utf8");
const m152 = readFileSync(MIG + "0152_vz1_kozlemeny.sql", "utf8");
// 0153 (Csilla 2026-10-06 18:15): „Közlemények” → „Szöveges képek” — négy kulcs új szövege. A rajz feliratfájlja ehhez igazodott, ezért a
// „betűre” mérés a két migráció EREDŐ szövegét nézi (a 0151 sorát a 0153 felülírja), nem a 0151-et magában.
const m153 = readFileSync(MIG + "0153_vz1r_szoveges_kepek.sql", "utf8");
const korabbi = readdirSync(MIG).filter((f) => f.endsWith(".sql") && f < "0151").map((f) => readFileSync(MIG + f, "utf8")).join("\n");
const fajl = JSON.parse(readFileSync(gy("design/VZ1-szerkeszto/feliratok.json"), "utf8")) as Record<"hu" | "ro" | "en", Record<string, string>>;
const sql = (s: string) => s.replace(/'/g, "''");
const sorokBol = (m: string) => [...m.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)].map((x) => ({ kulcs: x[1]!, nyelv: x[2]!, szoveg: x[3]!.replace(/''/g, "'") }));
const eredo = new Map([...sorokBol(m151), ...sorokBol(m153)].map((x) => [`${x.kulcs}|${x.nyelv}`, x.szoveg]));
const sorok = [...m151.matchAll(/\('([a-z0-9_.]+)', '(hu|ro|en)', '((?:[^']|'')*)'\)/g)].map((m) => ({ kulcs: m[1]!, nyelv: m[2]!, szoveg: m[3]!.replace(/''/g, "'") }));
function fajlok(mappa: string, ki: string[] = []): string[] {
  for (const n of readdirSync(mappa)) {
    const p = join(mappa, n);
    if (n === "node_modules" || n === ".next" || n === "probak") continue;
    if (statSync(p).isDirectory()) fajlok(p, ki);
    else if (/\.tsx?$/.test(n)) ki.push(p);
  }
  return ki;
}
const KOD = fajlok(gy("apps/web")).map((f) => readFileSync(f, "utf8")).join("\n");

describe("0151 — VZ-1 feliratok", () => {
  it("a rajz minden kulcsa betűre a feliratfájlból, hu/ro/en (45)", () => {
    const hiany: string[] = [];
    for (const ny of ["hu", "ro", "en"] as const) for (const [k, v] of Object.entries(fajl[ny])) if (eredo.get(`${k}|${ny}`) !== v) hiany.push(`${k} (${ny})`);
    expect(hiany).toEqual([]);
    expect(Object.keys(fajl.hu).length).toBe(45);
  });
  it("a 0153 csak meglévő vz1r.* kulcsot ír át, mindhárom nyelven, ismételhetően", () => {
    const k153 = [...new Set(sorokBol(m153).map((x) => x.kulcs))];
    expect(k153.sort()).toEqual(["vz1r.admin_jelzesek_kov", "vz1r.admin_lista_alcim", "vz1r.kozlemenyek", "vz1r.sorszam"]);
    for (const k of k153) expect(sorokBol(m153).filter((x) => x.kulcs === k).map((x) => x.nyelv).sort(), k).toEqual(["en", "hu", "ro"]);
    expect(m153).toMatch(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE/);
  });
  it("minden új kulcs mindhárom nyelven, egyik sem létezett korábban, ismételhető", () => {
    const kulcsok = [...new Set(sorok.map((s) => s.kulcs))];
    for (const k of kulcsok) expect(sorok.filter((s) => s.kulcs === k).map((s) => s.nyelv).sort(), k).toEqual(["en", "hu", "ro"]);
    for (const k of kulcsok) expect(korabbi.includes(`('${k}',`), k).toBe(false);
    expect(m151).toMatch(/ON CONFLICT \("kulcs", "nyelv"\) DO UPDATE/);
  });
  it("minden vz1r.* kulcs, amit a kód használ, megvan; a három állapotszó a kerdesek 2. szerint", () => {
    const meglevo = new Set(sorok.map((s) => s.kulcs));
    const hasznalt = new Set([...KOD.matchAll(/["'`](vz1r\.[a-z0-9_.]+)["'`]/g)].map((m) => m[1]!));
    expect([...hasznalt].filter((k) => !meglevo.has(k))).toEqual([]);
    const hu = (k: string) => eredo.get(`${k}|hu`)!;
    expect([hu("vz1r.lezarva"), hu("vz1r.lassan"), hu("vz1r.ujra_jarhato")]).toEqual(["Lezárva", "Lassabban halad", "Újra járható"]);
    // a név Csilla 10-06 18:15-ös döntése szerint (0153); korábban „Közlemények” volt
    expect(hu("vz1r.kozlemenyek")).toBe("Szöveges képek");
    expect(eredo.get("vz1r.kozlemenyek|ro")).toBe("Imagini cu text");
    expect(eredo.get("vz1r.kozlemenyek|en")).toBe("Text images");
    expect([...eredo.entries()].filter(([k, v]) => k.endsWith("|hu") && /közlemény/i.test(v))).toEqual([]);
  });
  it("a régi 09-23-as szerkesztő képernyője már nincs (a gépezete marad: keszit, fordit, mintakep)", () => {
    expect(existsSync(gy("apps/web/app/kepek/Szerkeszto.tsx"))).toBe(false);
    expect(existsSync(gy("apps/web/app/kepek/Sablonok.tsx"))).toBe(false);
    for (const v of ["keszit", "fordit", "mintakep/[sablon]", "sablonok"]) expect(existsSync(gy(`apps/web/app/api/vizual/${v}/route.ts`)), v).toBe(true);
  });
});

describe("0152 — a szám és a jelzések: csak új táblák és függvény", () => {
  it("két tábla sorszintű védelemmel, egy SECURITY DEFINER függvény; nincs törlés", () => {
    expect(m152).toContain('CREATE TABLE IF NOT EXISTS "kozlemeny_sorszam"');
    expect(m152).toContain('CREATE TABLE IF NOT EXISTS "kep_jelzes"');
    for (const t of ["kozlemeny_sorszam", "kep_jelzes"]) {
      expect(m152).toContain(`ALTER TABLE "${t}" ENABLE ROW LEVEL SECURITY;`);
      expect(m152).toMatch(new RegExp(`CREATE POLICY "${t}_sajat_szervezet"[^;]*app\\.szervezet_id[^;]*WITH CHECK`));
    }
    expect(m152.match(/LANGUAGE sql SECURITY DEFINER/g)?.length).toBe(1);
    expect(m152).not.toMatch(/\b(DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE)\b/);
  });
});
