// R-15 · 06 Mit figyeljünk (gepezet-3 3.9, kerdesek-3 3 — Csilla 10-01: jóváhagyva): a reggeli hírek KIKAPCSOLÁSA.
// DELETE /api/r15/napi-figyeles — a PUT (Bekapcsolom) párja: az aktív hírbeállítás új verziója `idozites.mod = "kezi"`-vel.
// Valódi adatbázis (DATABASE_URL) és kiszolgáló (PROBA_CIM) kell, mint a többi végpont-próbához; nélkülük kimarad.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DATABASE_URL, keres, lezar, sql, takaritas, veletlenEmail } from "./segedek";

const VAN_ADATBAZIS = DATABASE_URL !== "";
type Aktiv = { aktiv: { verzio: number; beallitas: { idozites: { mod: string } } } | null };

async function ujFiok(szervezetNev: string): Promise<{ sutik: string; szervezetId: string }> {
  const email = veletlenEmail();
  const jelszo = "Tibor-Terko-2026!";
  expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Kovács Tibor", email, jelszo } })).statusz).toBe(201);
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  expect(b.statusz).toBe(200);
  const sutik = b.sutik.join("; ");
  const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: szervezetNev }, sutik });
  expect(sz.statusz).toBe(201);
  const leiras = "Térkövezés, udvarok és járdák kivitelezése Marosvásárhelyen és Nyárádszeredán — kulcsrakészen, garanciával.";
  const p = await keres("/api/onboarding/piszkozat", {
    modszer: "PUT", sutik,
    torzs: {
      bemutatkozas: { nev: szervezetNev, osszefoglalo: leiras, forras_tipus: "leiras", leiras },
      kommunikacio: { celkozonseg: "családi házak tulajdonosai", celkozonseg_forras: "sajat", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat" },
    },
  });
  expect(p.statusz).toBe(200);
  expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik })).statusz).toBe(200);
  return { sutik, szervezetId: sz.torzs.id };
}

const beallitas = async (sutik: string) => (await keres<{ hirfigyelo: Aktiv }>("/api/hirfigyelo/beallitas", { sutik })).torzs.hirfigyelo;

describe.skipIf(!VAN_ADATBAZIS)("a reggeli hírek ki- és bekapcsolása (R-15 06, kerdesek-3 3)", () => {
  let sutik: string;
  let szervezetId: string;
  let ures: string;

  beforeAll(async () => {
    ({ sutik, szervezetId } = await ujFiok("Kő és Kert Kft."));
    ({ sutik: ures } = await ujFiok("Șantierul Mureș SRL"));
    expect((await keres("/api/hirfigyelo/forrasok", { modszer: "POST", torzs: { cim: "vasarhely.ma" }, sutik })).statusz).toBe(200);
    const b = await keres("/api/hirfigyelo/beallitas", {
      modszer: "PUT", sutik,
      torzs: {
        celok: ["sajat_marka"], temak: [{ nev: "térkövezés", nevvaltozatok: [], megkulonboztetes: "" }, { nev: "építőanyag-árak", nevvaltozatok: [], megkulonboztetes: "" }],
        foldrajzi_fokusz: "Marosvásárhely és környéke", nyelvek: ["hu", "ro"], kizarasok: [], idozites: { mod: "kezi", ora: 7, perc: 0, idozona: "Europe/Bucharest" }, szabad_szoveg: "",
      },
    });
    expect(b.statusz).toBe(200);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("bekapcsolás (PUT) → napi; kikapcsolás (DELETE) → kezi, ÚJ verzióval; a témák változatlanok", async () => {
    expect((await keres("/api/r15/napi-figyeles", { modszer: "PUT", sutik })).statusz).toBe(200);
    const be = await beallitas(sutik);
    expect(be.aktiv?.beallitas.idozites.mod).toBe("napi");
    const ki = await keres<{ ok?: boolean }>("/api/r15/napi-figyeles", { modszer: "DELETE", sutik });
    expect(ki.statusz).toBe(200);
    expect(ki.torzs.ok).toBe(true);
    const utana = await beallitas(sutik);
    expect(utana.aktiv?.beallitas.idozites.mod).toBe("kezi");
    expect(utana.aktiv!.verzio).toBe(be.aktiv!.verzio + 1);
  });

  it("már kikapcsolt állapotban a DELETE 200, és nem ír új verziót", async () => {
    const elotte = await beallitas(sutik);
    expect((await keres("/api/r15/napi-figyeles", { modszer: "DELETE", sutik })).statusz).toBe(200);
    expect((await beallitas(sutik)).aktiv!.verzio).toBe(elotte.aktiv!.verzio);
  });

  it("aktív hírbeállítás nélkül 409 NINCS_AKTIV_BEALLITAS; belépés nélkül 401", async () => {
    const v = await keres<{ hiba?: string }>("/api/r15/napi-figyeles", { modszer: "DELETE", sutik: ures });
    expect(v.statusz).toBe(409);
    expect(v.torzs.hiba).toBe("NINCS_AKTIV_BEALLITAS");
    expect((await keres("/api/r15/napi-figyeles", { modszer: "DELETE" })).statusz).toBe(401);
  });

  it("a régi verziók megmaradnak (a kikapcsolás nem töröl)", async () => {
    // 1. a kézi mentés, 2. a bekapcsolás, 3. a kikapcsolás — mind megvan
    const sorok = await sql<{ db: string }>("SELECT count(*)::text AS db FROM hf_beallitas_verzio WHERE szervezet_id = $1", [szervezetId]);
    expect(Number(sorok[0]!.db)).toBe(3);
  });
});
