// c5 1. kör — élő próbák (valódi adatbázis: DATABASE_URL, kiszolgáló: PROBA_CIM; nélkülük kimarad, mint a többi végpont-próba).
//  · 05 Hír részletei: /hirfigyelo/hir/[id] — saját hír 200 (cím + „Miért jó nektek?” szöveg), MÁS szervezet híre 404 (A-11),
//    nem létező 404, belépés nélkül a belépésre visz; a régi /hirfigyelo?talalat=… cím a régi felugróra visz (változatlan).
//  · 11c: POST /api/poszt forras.tipus "terv" — a munka a saját szervezeté; ugyanabból a tételből ugyanaz a munka (A-8);
//    más szervezet nem látja (404), és ugyanabból az azonosítóból SAJÁT munkát kap.
//  · 11a: a halvány példa a szervezet szakmája szerint (kep_pelda.adat.kategoria, c15) — más szakma, más szöveg.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DATABASE_URL, PROBA_CIM, keres, lezar, sql, takaritas, veletlenEmail } from "./segedek";

const VAN_ADATBAZIS = DATABASE_URL !== "";
const JELSZO = "Tibor-Terko-2026!";

async function ujFiok(szervezetNev: string): Promise<{ sutik: string; szervezetId: string; email: string }> {
  const email = veletlenEmail();
  expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Kovács Tibor", email, jelszo: JELSZO } })).statusz).toBe(201);
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo: JELSZO } });
  const sutik = b.sutik.map((s) => s.split(";")[0]).join("; ");
  const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: szervezetNev }, sutik });
  expect(sz.statusz).toBe(201);
  const leiras = "Térkövezés, udvarok és járdák kivitelezése Marosvásárhelyen és Nyárádszeredán — kulcsrakészen, garanciával.";
  expect((await keres("/api/onboarding/piszkozat", {
    modszer: "PUT", sutik,
    torzs: {
      bemutatkozas: { nev: szervezetNev, osszefoglalo: leiras, forras_tipus: "leiras", leiras },
      kommunikacio: { celkozonseg: "családi házak tulajdonosai", celkozonseg_forras: "sajat", cel: "", cel_forras: "sajat", cel_kesobb: true, nyelvek: ["hu", "ro"], nyelvek_forras: "sajat" },
    },
  })).statusz).toBe(200);
  expect((await keres("/api/onboarding/jovahagyas", { modszer: "POST", torzs: {}, sutik })).statusz).toBe(200);
  return { sutik, szervezetId: sz.torzs.id, email };
}

/** Egy kiértékelt hír a szervezetnek (a gyűjtés és az AI nélkül — ugyanazok a táblák, amiket a hírfigyelő ír). Visszaadja a találat id-ját. */
async function hirtBeszur(szervezetId: string, cim: string, cegednek: string): Promise<string> {
  const [f] = await sql<{ id: string }>(`INSERT INTO hf_forras (szervezet_id, cim, tipus, eredet, allapot, ellenorzott, utolso_sikeres) VALUES ($1, 'e-nepujsag.ro', 'rss', 'kezi', 'hasznalhato', true, now()) RETURNING id`, [szervezetId]);
  const [fu] = await sql<{ id: string }>(`INSERT INTO hf_futas (szervezet_id, szabaly_verzio, kezdet, veg, allapot, uj_talalatok) VALUES ($1, 1, now() - interval '1 hour', now(), 'kesz', 1) RETURNING id`, [szervezetId]);
  const url = `https://e-nepujsag.ro/gazdasag/${crypto.randomUUID()}`;
  const kv = crypto.randomUUID(), ta = crypto.randomUUID(), es = crypto.randomUUID();
  await sql(`INSERT INTO hf_kivonat (id, szervezet_id, forras_id, cim, url, kanonikus_url, megjelenes, begyujtes, szoveg, csonkolt, ujjlenyomat, nyelv, lejar)
    VALUES ($1, $2, $3, $4, $5, $5, now() - interval '2 hours', now(), 'A megyei statisztika szerint idén 18%-kal több építési engedélyt adtak ki.', false, $6, 'hu', now() + interval '30 days')`,
    [kv, szervezetId, f!.id, cim, url, crypto.randomUUID()]);
  const ert = { fontossag: "fontos", temacimke: "szakmai", miert: "Új házakhoz udvar kell.", indoklas: "", osszefoglalo: "Idén 18%-kal több családi ház épül Maros megyében.",
    szabaly_verzio: 1, ertekelve: new Date().toISOString(), csonkolt_alapjan: false, cim_forditott: cim, cegednek, vevoidnek: "", szuro_verzio: 12, hely_ok: true, elo: null };
  await sql(`INSERT INTO hf_talalat (id, szervezet_id, esemeny_id, kivonat_id, ertekeles, ertekeles_allapot, futas_id) VALUES ($1, $2, $3, $4, $5::jsonb, 'kesz', $6)`,
    [ta, szervezetId, es, kv, JSON.stringify(ert), fu!.id]);
  await sql(`INSERT INTO hf_esemeny (id, szervezet_id, fo_talalat_id, talalat_ids) VALUES ($1, $2, $3, $4::jsonb)`, [es, szervezetId, ta, JSON.stringify([ta])]);
  return ta;
}

async function lap(ut: string, sutik?: string): Promise<{ statusz: number; hely: string | null; szoveg: string }> {
  const v = await fetch(`${PROBA_CIM}${ut}`, { redirect: "manual", headers: { cookie: [sutik, "km_nyelv=hu"].filter(Boolean).join("; ") } });
  return { statusz: v.status, hely: v.headers.get("location"), szoveg: await v.text() };
}

describe.skipIf(!VAN_ADATBAZIS)("c5 1. kör — élő próbák", () => {
  let a: { sutik: string; szervezetId: string };
  let b: { sutik: string; szervezetId: string };
  let hirA: string;

  beforeAll(async () => {
    a = await ujFiok("Kovács Térkő Kft.");
    b = await ujFiok("Șantierul Mureș SRL");
    hirA = await hirtBeszur(a.szervezetId, "Rekordszámú családi ház épül Maros megyében", "Ahol új ház épül, ott udvar és kocsibeálló is kell.");
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("05: a saját hír lapja 200 — a cím, a „Miért jó nektek?” szöveg és a lap kérdése látszik", async () => {
    const v = await lap(`/hirfigyelo/hir/${hirA}`, a.sutik);
    expect(v.statusz).toBe(200);
    expect(v.szoveg).toContain("Rekordszámú családi ház épül Maros megyében");
    expect(v.szoveg).toContain("Ahol új ház épül, ott udvar és kocsibeálló is kell.");
    expect(v.szoveg).toContain("Ebből jó poszt lehet");
  });

  it("05: más szervezet híre 404 (A-11); nem létező 404; hibás azonosító 404; belépés nélkül → /belepes", async () => {
    expect((await lap(`/hirfigyelo/hir/${hirA}`, b.sutik)).statusz).toBe(404);
    expect((await lap(`/hirfigyelo/hir/${crypto.randomUUID()}`, a.sutik)).statusz).toBe(404);
    expect((await lap(`/hirfigyelo/hir/nem-azonosito`, a.sutik)).statusz).toBe(404);
    const n = await lap(`/hirfigyelo/hir/${hirA}`);
    expect([303, 307, 308]).toContain(n.statusz);
    expect(n.hely ?? "").toContain("/belepes");
  });

  it("05: a régi ?talalat= cím változatlanul a régi áttekintésre visz", async () => {
    const v = await lap(`/hirfigyelo?talalat=${hirA}`, a.sutik);
    expect([303, 307, 308]).toContain(v.statusz);
    expect(v.hely ?? "").toContain(`/hirfigyelo/osszes?talalat=${hirA}`);
  });

  it("05: a fő gomb hívása (04-gyel közös) a saját hírből posztmunkát ad; más szervezet találatára 404", async () => {
    const v = await keres<{ munka_id?: string }>(`/api/r15/hirek/${hirA}/poszt`, { modszer: "POST", torzs: {}, sutik: a.sutik });
    expect(v.statusz).toBe(200);
    const [m] = await sql<{ szervezet_id: string }>(`SELECT szervezet_id FROM poszt_munka WHERE id = $1`, [v.torzs.munka_id]);
    expect(m!.szervezet_id).toBe(a.szervezetId);
    expect((await keres(`/api/r15/hirek/${hirA}/poszt`, { modszer: "POST", torzs: {}, sutik: b.sutik })).statusz).toBe(404);
  });

  it("11c: POST /api/poszt tipus \"terv\" → a saját szervezet munkája; ugyanaz a tétel → ugyanaz a munka (A-8); B nem látja", async () => {
    const tetel = crypto.randomUUID();
    const torzs = { forras: { tipus: "terv", azonosito: tetel, cim: "Díszburkolat udvarra", url: "", szoveg: "Díszburkolat udvarra" }, cim: "Díszburkolat udvarra", felulet: "fb", nyelv: "hu" };
    const e1 = await keres<{ munka: { id: string; forras: { tipus: string } } }>("/api/poszt", { modszer: "POST", torzs, sutik: a.sutik });
    expect(e1.statusz).toBe(200);
    expect(e1.torzs.munka.forras.tipus).toBe("terv");
    const [sor] = await sql<{ szervezet_id: string }>(`SELECT szervezet_id FROM poszt_munka WHERE id = $1`, [e1.torzs.munka.id]);
    expect(sor!.szervezet_id).toBe(a.szervezetId);
    const e2 = await keres<{ munka: { id: string } }>("/api/poszt", { modszer: "POST", torzs, sutik: a.sutik });
    expect(e2.torzs.munka.id).toBe(e1.torzs.munka.id);
    expect((await keres(`/api/poszt/${e1.torzs.munka.id}`, { sutik: b.sutik })).statusz).toBe(404);
    // B ugyanazzal a tétel-azonosítóval SAJÁT munkát kap — A munkája nem nyílik meg neki
    const eb = await keres<{ munka: { id: string } }>("/api/poszt", { modszer: "POST", torzs, sutik: b.sutik });
    expect(eb.statusz).toBe(200);
    expect(eb.torzs.munka.id).not.toBe(e1.torzs.munka.id);
  });

  it("11a: üres iránytűnél a halvány példa a szakma szerint (c15 kategória a tárolt példákban)", async () => {
    const ures = await lap("/iranytu", a.sutik);
    expect(ures.statusz).toBe(200);
    expect(ures.szoveg).toContain("Így néz majd ki — példa");
    expect(ures.szoveg).toContain("Kampány: őszi ajánlat, november végéig"); // nincs tárolt példa → semleges
    await sql(`INSERT INTO kep_pelda (szervezet_id, nyelv, ujj, adat, frissitve) VALUES ($1, 'hu', 'proba', $2::jsonb, now())
      ON CONFLICT (szervezet_id) DO UPDATE SET adat = EXCLUDED.adat`, [a.szervezetId, JSON.stringify({ kategoria: "epites" })]);
    const epites = await lap("/iranytu", a.sutik);
    expect(epites.szoveg).toContain("Kampány: őszi felmérés, tavaszi munkák lefoglalása");
    expect(epites.szoveg).toContain("Cél: 20 új udvar tavaszra");
    await sql(`UPDATE kep_pelda SET adat = $2::jsonb WHERE szervezet_id = $1`, [a.szervezetId, JSON.stringify({ kategoria: "vendeglatas" })]);
    expect((await lap("/iranytu", a.sutik)).szoveg).toContain("Kampány: őszi menü, foglalás hétvégére");
    // B (nincs tárolt példája) továbbra is a semlegeset látja — A kategóriája nem szivárog át
    expect((await lap("/iranytu", b.sutik)).szoveg).toContain("Kampány: őszi ajánlat, november végéig");
  });
});
