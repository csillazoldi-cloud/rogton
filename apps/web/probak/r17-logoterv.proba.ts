// R-17 B · fizetős logótervezés, élőben (PROBA_CIM + DATABASE_URL):
//  - a rendszergazda beállítása (ár, címzett): GET/PUT /api/admin/logoterv — hibás értéknél 400, nem rendszergazdának 403;
//  - a kérdőív: POST /api/logoterv — szerkesztő 201, néző 403, idegen minta-azonosító 400, ár nélkül 409 NINCS_AJANLAT;
//  - a sor: a beküldéskori ár, a válaszok ékezettel, levelezés nélkül „nincs_beallitva” (nincs hiba); sorszintű védelem: másik munkatér nem látja;
//  - a rendszergazda listája és az állapot (PUT /api/admin/logoterv/{id}); a Névlogó lap gombja az árral, ár nélkül nincs gomb;
//  - a levél: a kuld() egy hamis SMTP-kiszolgálóval (env-vel átadva) → „elkuldve”, a tárgy a munkatér nevével.
import net from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";
import { kuld } from "../logoterv";

const jelszo = "ProbaJelszo123!";
type Fiok = { sutik: string; fiokId: string; szervezetId: string };
async function fiok(nev: string, munkater: string | null): Promise<Fiok> {
  const email = veletlenEmail();
  const r = await keres<{ id: string }>("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } });
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  const sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
  let szervezetId = "";
  if (munkater) szervezetId = (await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: munkater }, sutik })).torzs.id;
  return { sutik, fiokId: r.torzs.id, szervezetId };
}
const KERDOIV = { nev: "Kovács Burkolat", mivel: "Térkövezés, udvarok, járdák — Marosvásárhely", hangulat: "megbízható, erős, helyi", szinek: "zöld és homok; piros nem", hol: ["facebook", "honlap", "auto"] };

describe("logótervezés (élő)", () => {
  let tibor: Fiok, bence: Fiok, masik: Fiok, gazda: Fiok;
  let eredeti: { kulcs: string; ertek: unknown }[] = [];

  beforeAll(async () => {
    eredeti = await sql("SELECT kulcs, ertek FROM rendszer_beallitas WHERE kulcs LIKE 'logoterv_%'");
    tibor = await fiok("Kovács Tibor", "Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely");
    bence = await fiok("Kovács Bence", null);
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo')", [tibor.szervezetId, bence.fiokId]);
    masik = await fiok("Fenyő Ágnes", "Fenyő Asztalosműhely, Szászrégen");
    gazda = await fiok("Rendszergazda Réka", "Aitmetica próba");
    await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [gazda.fiokId]);
  });
  afterAll(async () => {
    for (const e of eredeti) await sql("UPDATE rendszer_beallitas SET ertek = $2::jsonb WHERE kulcs = $1", [e.kulcs, JSON.stringify(e.ertek)]);
    await takaritas();
    await lezar();
  });

  it("rendszergazda: GET/PUT; hibás ár / címzett 400 a mező nevével; tulajdonosnak 403", async () => {
    const g = await keres<{ beallitas: { ar: number | null; cimzett: string }; levelezes: boolean }>("/api/admin/logoterv", { sutik: gazda.sutik });
    expect(g.statusz).toBe(200);
    expect(typeof g.torzs.levelezes).toBe("boolean");
    expect((await keres("/api/admin/logoterv", { sutik: tibor.sutik })).statusz).toBe(403);
    expect((await keres("/api/admin/logoterv", { modszer: "PUT", sutik: tibor.sutik, torzs: { ar: 10 } })).statusz).toBe(403);
    const rossz = await keres<{ mezok?: { mezo: string } }>("/api/admin/logoterv", { modszer: "PUT", sutik: gazda.sutik, torzs: { ar: "-3" } });
    expect(rossz.statusz).toBe(400);
    expect(rossz.torzs.mezok?.mezo).toBe("ar");
    expect((await keres<{ mezok?: { mezo: string } }>("/api/admin/logoterv", { modszer: "PUT", sutik: gazda.sutik, torzs: { cimzett: "nem cím" } })).torzs.mezok?.mezo).toBe("cimzett");
    const jo = await keres<{ beallitas: { ar: number | null; cimzett: string } }>("/api/admin/logoterv", { modszer: "PUT", sutik: gazda.sutik, torzs: { ar: "79", cimzett: "" } });
    expect(jo.torzs.beallitas).toEqual({ ar: 79, cimzett: "" });
  });

  it("a Névlogó lap gombja az árral; a kérdőív lap szerkesztőnek nyílik", async () => {
    const lap = await keres<string>("/fiok/arculat/nevlogo", { sutik: tibor.sutik });
    // jóváhagyott profil nélkül a névlogó lap az onboardingra visz — akkor a gombot a kérdőív lapja méri
    if (lap.statusz === 200 && typeof lap.torzs === "string" && lap.torzs.includes("r16n-lap")) expect(lap.torzs).toMatch(/Tervezzünk neked logót — 79\s€/);
    const kerdoiv = await keres<string>("/fiok/arculat/logoterv", { sutik: tibor.sutik });
    expect(kerdoiv.statusz).toBe(200);
    expect(String(kerdoiv.torzs)).toContain("Mesélj a logódról");
    expect(String(kerdoiv.torzs)).toMatch(/Ára: 79\s€\. Előbb felhívunk, és megbeszéljük\./);
  });

  it("beküldés: szerkesztő 201, a sor a beküldéskori árral, levelezés nélkül „nincs_beallitva”; néző 403; üres név 400", async () => {
    const r = await keres<{ logoterv: { id: string; ertesites: string } }>("/api/logoterv", { modszer: "POST", sutik: tibor.sutik, torzs: KERDOIV });
    expect(r.statusz).toBe(201);
    expect(r.torzs.logoterv.ertesites).toBe("nincs_beallitva");
    const [sor] = await sql<{ ar_eur: string; valaszok: Record<string, unknown>; allapot: string; fiok_nev: string; szervezet_id: string }>(
      "SELECT ar_eur, valaszok, allapot, fiok_nev, szervezet_id FROM logoterv_keres WHERE id = $1", [r.torzs.logoterv.id]);
    expect(sor).toMatchObject({ ar_eur: "79.00", allapot: "uj", fiok_nev: "Kovács Tibor", szervezet_id: tibor.szervezetId });
    expect(sor!.valaszok).toMatchObject(KERDOIV);
    expect((await keres("/api/logoterv", { modszer: "POST", sutik: bence.sutik, torzs: KERDOIV })).statusz).toBe(403);
    expect((await keres("/api/logoterv", { modszer: "POST", sutik: tibor.sutik, torzs: { ...KERDOIV, nev: "  " } })).statusz).toBe(400);
  });

  it("minta: idegen fájl-azonosító 400 (a minta csak a munkatér saját feltöltése lehet)", async () => {
    const r = await keres("/api/logoterv", { modszer: "POST", sutik: tibor.sutik, torzs: { ...KERDOIV, minta_idk: [crypto.randomUUID()] } });
    expect(r.statusz).toBe(400);
  });

  // A km_tulaj (a próba kapcsolata) megkerüli a sorszintű védelmet — ezért a km_app nevében mérünk, ha a próba megkapja a címét
  // (PROBA_APP_DATABASE_URL); nélküle csak azt nézzük, hogy a védelem be van kapcsolva és a szabály ott van.
  it("sorszintű védelem: a munkatér sorát a másik munkatér nevében nem látni (A-11)", async () => {
    const rls = await sql<{ relrowsecurity: boolean }>("SELECT relrowsecurity FROM pg_class WHERE relname = 'logoterv_keres'");
    expect(rls[0]!.relrowsecurity).toBe(true);
    expect((await sql<{ db: number }>("SELECT count(*)::int AS db FROM pg_policies WHERE tablename = 'logoterv_keres' AND policyname = 'logoterv_keres_sajat_szervezet'"))[0]!.db).toBe(1);
    const url = process.env["PROBA_APP_DATABASE_URL"];
    if (!url) return;
    const { Client } = await import("pg");
    const c = new Client({ connectionString: url });
    await c.connect();
    const db = async (sz: string) => {
      await c.query("BEGIN");
      await c.query("SELECT set_config('app.szervezet_id', $1, true)", [sz]);
      const r = await c.query("SELECT count(*)::int AS db FROM logoterv_keres WHERE szervezet_id = $1", [tibor.szervezetId]);
      await c.query("ROLLBACK");
      return (r.rows[0] as { db: number }).db;
    };
    expect(await db(masik.szervezetId)).toBe(0);
    expect(await db(tibor.szervezetId)).toBeGreaterThan(0);
    await c.end();
  });

  it("a rendszergazda listája és az állapot; nem létező 404, tulajdonosnak 403", async () => {
    const g = await keres<{ keresek: { id: string; szervezet_nev: string; allapot: string; valaszok: { nev: string } }[] }>("/api/admin/logoterv", { sutik: gazda.sutik });
    const sajat = g.torzs.keresek.filter((k) => k.szervezet_nev === "Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely");
    expect(sajat.length).toBe(1);
    const id = sajat[0]!.id;
    expect((await keres(`/api/admin/logoterv/${id}`, { modszer: "PUT", sutik: gazda.sutik, torzs: { allapot: "folyamatban" } })).statusz).toBe(200);
    expect((await sql<{ allapot: string }>("SELECT allapot FROM logoterv_keres WHERE id = $1", [id]))[0]!.allapot).toBe("folyamatban");
    expect((await keres(`/api/admin/logoterv/${id}`, { modszer: "PUT", sutik: gazda.sutik, torzs: { allapot: "torolve" } })).statusz).toBe(400);
    expect((await keres(`/api/admin/logoterv/${crypto.randomUUID()}`, { modszer: "PUT", sutik: gazda.sutik, torzs: { allapot: "kesz" } })).statusz).toBe(404);
    expect((await keres(`/api/admin/logoterv/${id}`, { modszer: "PUT", sutik: tibor.sutik, torzs: { allapot: "kesz" } })).statusz).toBe(403);
    const lap = await keres<string>("/gephaz/logoterv", { sutik: gazda.sutik });
    expect(String(lap.torzs)).toContain("Logókérések");
  });

  it("ár nélkül nincs ajánlat: a beküldés 409, a kérdőív lap a névlogóra visz", async () => {
    const le = await keres<{ beallitas: { ar: number | null } }>("/api/admin/logoterv", { modszer: "PUT", sutik: gazda.sutik, torzs: { ar: "" } });
    expect(le.statusz).toBe(200);
    expect(le.torzs.beallitas.ar).toBeNull();
    const r = await keres<{ hiba: string }>("/api/logoterv", { modszer: "POST", sutik: tibor.sutik, torzs: KERDOIV });
    expect(r.statusz).toBe(409);
    expect(r.torzs.hiba).toBe("NINCS_AJANLAT");
    const lap = await fetch(`${process.env["PROBA_CIM"] ?? "http://127.0.0.1:3000"}/fiok/arculat/logoterv`, { headers: { cookie: tibor.sutik }, redirect: "manual" });
    expect([303, 307, 308]).toContain(lap.status);
    expect(lap.headers.get("location")).toContain("/fiok/arculat/nevlogo");
    await keres("/api/admin/logoterv", { modszer: "PUT", sutik: gazda.sutik, torzs: { ar: "79" } });
  });

  it("levél: beállított SMTP-vel és címzettel a kérés után „elkuldve”, a tárgy a munkatér nevével (hamis kiszolgáló)", async () => {
    let adat = "";
    const srv = net.createServer((s) => {
      s.setEncoding("utf8");
      let p = "", benn = false;
      s.write("220 hamis\r\n");
      s.on("data", (d: string) => {
        p += d;
        for (;;) {
          if (benn) { const v = p.indexOf("\r\n.\r\n"); if (v < 0) return; adat = p.slice(0, v); p = p.slice(v + 5); benn = false; s.write("250 OK\r\n"); continue; }
          const i = p.indexOf("\r\n"); if (i < 0) return;
          const sor = p.slice(0, i); p = p.slice(i + 2);
          if (sor.startsWith("EHLO")) s.write("250 hamis\r\n");
          else if (sor === "DATA") { benn = true; s.write("354 ok\r\n"); }
          else if (sor === "QUIT") { s.write("221 bye\r\n"); s.end(); }
          else s.write("250 OK\r\n");
        }
      });
    });
    await new Promise<void>((ok) => srv.listen(0, "127.0.0.1", () => ok()));
    const port = (srv.address() as net.AddressInfo).port;
    await sql("UPDATE rendszer_beallitas SET ertek = '\"csilla@proba.example\"'::jsonb WHERE kulcs = 'logoterv_cimzett'");
    const e = await kuld({ szervezetId: tibor.szervezetId, szervezetNev: "Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely", fiokId: tibor.fiokId, fiokNev: "Kovács Tibor" }, KERDOIV,
      { varj: true, env: { SMTP_HOST: "127.0.0.1", SMTP_PORT: String(port), SMTP_FROM: "noreply@proba.example", SMTP_BIZTONSAG: "nincs" } });
    await new Promise<void>((ok) => srv.close(() => ok()));
    expect(e).toMatchObject({ ok: true, ertesites: "elkuldve" });
    if (e.ok) expect((await sql<{ ertesites: string }>("SELECT ertesites FROM logoterv_keres WHERE id = $1", [e.id]))[0]!.ertesites).toBe("elkuldve");
    const targy = adat.match(/^Subject: =\?UTF-8\?B\?([^?]+)\?=$/m)?.[1];
    expect(Buffer.from(targy!, "base64").toString("utf8")).toBe("Új logótervezési kérés — Kovács Burkolat és Térkőgyártó Kft., Marosvásárhely");
  });
});
