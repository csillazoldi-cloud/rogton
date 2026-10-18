// R-16 K1 (TERV 1.2, 1.7 R1/R3, 2-K1 Self-test): az arculat sémaváltása olvasáskor történik — a tárolt adatot nem írjuk át.
// 1) valós alakú (09-2x) profil: a tervezet és a két pillanatkép `logo_fajl_id`-je → `logok.vilagos`, a tükör megmarad;
// 2) az ÚJ alakú adat a RÉGI sémával is beolvasható (visszaállítás esetére) — a régi séma itt szó szerinti másolat;
// 3) „kesobb” profil tervezet nélkül is beolvasható; 4) a profile-core tükrözi a logót módosításkor, és a jóváhagyás rögzíti a `logok`-at;
// 5) az R2 őr (arculatOsszefesul) tiszta esetei; 6) a 12f feliratai a 0135-ben mind a három nyelven megvannak.
// Adatbázis és kiszolgáló nélkül fut.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { OnboardingPiszkozat, SzervezetProfil } from "@rogton/contracts";
import { arculatJovahagy, arculatModosit, arculatOsszefesul, arculatTervezetElvet, arculatValasztJovahagy } from "@rogton/profile-core";

const mappa = new URL("./r16/", import.meta.url).pathname;
const olvas = (n: string): unknown => JSON.parse(readFileSync(join(mappa, n), "utf8"));
const L1 = "3f1c2a9e-7b4d-4c1e-9a55-0d2b6c8e1f01";
const L2 = "8a7e5d4c-3b2a-4190-8f6e-5d4c3b2a1908";

// ---- a 2026-09-30-i (R-16 előtti) séma szó szerinti másolata (packages/contracts/src/index.ts, 963695e) ----
const RegiHex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const RegiTervezet = z.object({
  elsodleges: RegiHex, masodlagos: RegiHex, hatter: RegiHex,
  betu_cim: z.string().max(80).default(""), betu_szoveg: z.string().max(80).default(""), betu_iranymutatas: z.string().max(200).default(""),
  kepvilag: z.string().trim().max(500).default(""), kovetendo: z.string().trim().max(300).default(""), kerulendo: z.string().trim().max(300).default(""),
  lekerekites: z.number().int().min(0).max(24).default(8), nyelv: z.string().max(5).default("hu"), eredet: z.enum(["forras", "ai"]).default("ai"),
  modositva: z.boolean().default(false), logo_fajl_id: z.uuid().nullable().default(null),
});
const RegiLepes = z.object({
  allapot: z.enum(["nincs", "tervezet", "kesobb", "jovahagyott"]).default("nincs"),
  tervezet: RegiTervezet.nullable().default(null),
  verzio: z.number().int().min(1).default(1),
  jovahagyott_verzio: z.number().int().min(1).nullable().default(null),
  verziok: z.record(z.string(), RegiTervezet.extend({ jovahagyva: z.iso.datetime(), verzio: z.number().int().min(1) })).default({}),
});

describe("olvasáskori sémaváltás (TERV 1.2)", () => {
  it("09-2x profil: a tervezet és a két pillanatkép logója logok.vilagos lesz, a logo_fajl_id tükör marad", () => {
    const p = SzervezetProfil.parse(olvas("profil-09-2x.json"));
    expect(p.arculat.tervezet?.logok).toEqual({ vilagos: L2, sotet: null, egyszinu: null, negyzetes: null });
    expect(p.arculat.tervezet?.logo_fajl_id).toBe(L2);
    expect(p.arculat.verziok["1"]?.logok.vilagos).toBe(L1);
    expect(p.arculat.verziok["1"]?.logo_fajl_id).toBe(L1);
    expect(p.arculat.verziok["2"]?.logok.vilagos).toBe(L1);
    expect(p.arculat.verziok["2"]?.hatter).toBe("#f6f4ef"); // a pillanatkép saját értékei érintetlenek
    // az új mezők alapértéket kapnak
    expect(p.arculat.tervezet?.szin_forras).toBe("");
    expect(p.arculat.tervezet?.nevlogo_stilus).toBeNull();
    expect(p.arculat.tervezet?.szin_jeloltek).toEqual([]);
    // a régi betű-szövegek változatlanok (a betűkulcsra fordítás olvasáskor, K5)
    expect(p.arculat.tervezet?.betu_cim).toBe("'Archivo',sans-serif");
  });

  it("az új alakú adat a RÉGI sémával is beolvasható (git revert után sem vész el semmi), és ugyanazt a logót látja", () => {
    const p = SzervezetProfil.parse(olvas("profil-09-2x.json"));
    const ujJson = JSON.parse(JSON.stringify(p.arculat)) as unknown;
    const regi = RegiLepes.safeParse(ujJson);
    expect(regi.success).toBe(true);
    if (!regi.success) return;
    expect(regi.data.tervezet?.logo_fajl_id).toBe(L2);
    expect(regi.data.verziok["2"]?.logo_fajl_id).toBe(L1);
  });

  it("„kesobb” profil tervezet nélkül, és az onboarding-piszkozat is beolvasható", () => {
    const p = SzervezetProfil.parse(olvas("profil-kesobb.json"));
    expect(p.nev).toBe("Știință și Țară SRL");
    expect(p.arculat.tervezet).toBeNull();
    const d = OnboardingPiszkozat.parse(olvas("piszkozat-09-2x.json"));
    expect(d.arculat.tervezet?.logok.vilagos).toBe(L1);
  });

  it("az új `logok` nyer, ha van; a hiányzó `logok` üres térképet kap", () => {
    const p = SzervezetProfil.parse(olvas("profil-09-2x.json"));
    const t = { ...JSON.parse(JSON.stringify(p.arculat.tervezet)), logok: { sotet: L1 } };
    const ujra = SzervezetProfil.parse({ ...p, arculat: { ...p.arculat, tervezet: t } });
    expect(ujra.arculat.tervezet?.logok).toEqual({ vilagos: L2, sotet: L1, egyszinu: null, negyzetes: null });
  });
});

describe("profile-core: tükör és jóváhagyás (TERV 1.2)", () => {
  const p = SzervezetProfil.parse(olvas("profil-09-2x.json"));
  it("a régi doboz logo_fajl_id-módosítása a logok.vilagos-t is viszi (különben az olvasás a régit hozná vissza)", () => {
    const a = arculatModosit(p.arculat, { logo_fajl_id: L1 });
    expect(a.tervezet?.logok.vilagos).toBe(L1);
    expect(SzervezetProfil.parse({ ...p, arculat: a }).arculat.tervezet?.logo_fajl_id).toBe(L1);
    const b = arculatModosit(p.arculat, { logok: { vilagos: null, sotet: L2, egyszinu: null, negyzetes: null } });
    expect(b.tervezet?.logo_fajl_id).toBeNull();
  });

  it("a jóváhagyás a megadott (feloldott) logókat rögzíti a pillanatképben; logok nélkül a régi viselkedés", () => {
    const logok = { vilagos: L1, sotet: L2, egyszinu: null, negyzetes: null };
    const a = arculatJovahagy(p.arculat, new Date("2026-09-30T09:00:00.000Z"), logok);
    expect(a.verziok["3"]?.logok).toEqual(logok);
    expect(a.verziok["3"]?.logo_fajl_id).toBe(L1);
    expect(a.verziok["1"]).toEqual(p.arculat.verziok["1"]); // a korábbi pillanatkép érintetlen
    const b = arculatJovahagy(p.arculat, new Date("2026-09-30T09:00:00.000Z"));
    expect(b.verziok["3"]?.logo_fajl_id).toBe(L2);
  });

  it("arculatValasztJovahagy: jóváhagyottból új verzió, és azonnal jóváhagyva (kerdesek 4)", () => {
    const jov = arculatJovahagy(p.arculat, new Date("2026-09-30T09:00:00.000Z"));
    const a = arculatValasztJovahagy(jov, { elsodleges: "#1f3a5f" }, new Date("2026-09-30T10:00:00.000Z"));
    expect(a.allapot).toBe("jovahagyott");
    expect(a.verzio).toBe(4);
    expect(a.jovahagyott_verzio).toBe(4);
    expect(a.verziok["4"]?.elsodleges).toBe("#1f3a5f");
    expect(Object.keys(a.verziok).sort()).toEqual(["1", "2", "3", "4"]);
  });
});

describe("R2 őr — arculatOsszefesul (TERV 1.7)", () => {
  const p = SzervezetProfil.parse(olvas("profil-09-2x.json"));
  const szerver = arculatJovahagy(p.arculat, new Date("2026-09-30T09:00:00.000Z")); // v3 jóváhagyva
  it("régebbi jóváhagyott verzióból jövő írás → ELAVULT_ADAT", () => {
    expect(arculatOsszefesul(szerver, p.arculat)).toEqual({ ok: false, hiba: "ELAVULT_ADAT" });
  });
  it("kisebb verziószám jóváhagyott tárolt verzió mellett → ELAVULT_ADAT", () => {
    expect(arculatOsszefesul(szerver, { ...szerver, verzio: 2 })).toEqual({ ok: false, hiba: "ELAVULT_ADAT" });
  });
  it("a tervezet elvetése (a tárolt verziónak nincs pillanatképe) nem elavult írás", () => {
    const nyitott = arculatModosit(szerver, { kepvilag: "Új képvilág" }); // v4 tervezet
    const elvetve = arculatTervezetElvet(nyitott);
    const e = arculatOsszefesul(nyitott, elvetve);
    expect(e.ok).toBe(true);
  });
  it("a pillanatképet a beküldött adat nem veheti el és nem írhatja át — a kiszolgálóé nyer", () => {
    const hamis = { ...szerver, verziok: { "1": { ...szerver.verziok["1"]!, hatter: "#000000" } } };
    const e = arculatOsszefesul(szerver, hamis);
    expect(e.ok).toBe(true);
    if (!e.ok) return;
    expect(Object.keys(e.arculat.verziok).sort()).toEqual(["1", "2", "3"]);
    expect(e.arculat.verziok["1"]?.hatter).toBe(szerver.verziok["1"]?.hatter);
  });
});

describe("a 12f feliratai (0135) — minden használt r16.arculat.* kulcs három nyelven (TERV 2-K8)", () => {
  it("a K1 kódjában használt kulcsok mind megvannak hu/ro/en-ben, és a 0135 pontosan 14 kulcsot hoz", () => {
    const gyoker = new URL("../", import.meta.url).pathname;
    const sql = readFileSync(join(gyoker, "adatbazis/migraciok/0135_r16_logo_helyek.sql"), "utf8");
    const sorok = [...sql.matchAll(/\('(r16\.arculat\.[a-z_.]+)', '(hu|ro|en)', '/g)].map((m) => `${m[1]}|${m[2]}`);
    const kulcsok = new Set(sorok.map((s) => s.split("|")[0]!));
    expect(kulcsok.size).toBe(14);
    expect(sorok.length).toBe(42);
    const kod: string[] = [];
    const bejar = (d: string) => {
      for (const n of readdirSync(d, { withFileTypes: true })) {
        const u = join(d, n.name);
        if (n.isDirectory()) bejar(u);
        else if (/\.tsx?$/.test(n.name)) kod.push(readFileSync(u, "utf8"));
      }
    };
    bejar(join(gyoker, "app/fiok/arculat"));
    const hasznalt = new Set<string>();
    for (const k of kod) {
      for (const m of k.matchAll(/t\("(r16\.arculat\.[a-z_.]+)"/g)) hasznalt.add(m[1]!);
      // sablonos kulcs: t(`r16.arculat.logok.${hely}`) — a négy hely
      if (k.includes("t(`r16.arculat.logok.${hely}`)")) for (const h of ["vilagos", "sotet", "egyszinu", "negyzetes"]) hasznalt.add(`r16.arculat.logok.${h}`);
    }
    expect(hasznalt.size).toBeGreaterThan(10);
    // R-16 K3 (2026-09-30): a mappában már a 12a–12c lapja is él, amely a 0136 kulcsait használja (TERV §2-K8: minden csomag a saját
    // migrációjában hozza a kulcsait). Ezért a kulcsot a 0135 ÉS a későbbi r16-os feliratmigrációk (0136–0139) sorai között keressük;
    // a 0135 pontosan 14 kulcsa (fent) változatlanul ellenőrzött. A K3 kulcsait a r16-arculat-feliratok.proba.ts is méri.
    // Utókérés 2 (2026-10-01, Csilla: a rajzok és a kódkör jóváhagyva): a 12a telefonos nyitó és a 12f0 kulcsai a közös 0142-ben
    // jönnek (design/R15/feliratok-3.json — egy migráció az egész körre), ezért a 0142 is a keresett fájlok között van.
    for (const f of readdirSync(join(gyoker, "adatbazis/migraciok")).filter((n) => /^013[6-9]_r16_.*\.sql$/.test(n) || n === "0142_r15_utokeres2_feliratok.sql")) {
      const tobb = readFileSync(join(gyoker, "adatbazis/migraciok", f), "utf8");
      for (const m of tobb.matchAll(/\('(r16\.arculat\.[a-z_.]+)', '(hu|ro|en)', '/g)) sorok.push(`${m[1]}|${m[2]}`);
    }
    const hianyzik = [...hasznalt].flatMap((k) => ["hu", "ro", "en"].filter((n) => !sorok.includes(`${k}|${n}`)).map((n) => `${k} (${n})`));
    expect(hianyzik).toEqual([]);
  });
});
