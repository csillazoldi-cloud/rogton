// c5 2. kör — élő próbák (valódi adatbázis: DATABASE_URL, kiszolgáló: PROBA_CIM; nélkülük kimarad, mint a többi végpont-próba).
//  · c7 „Tegnap javítva” a Kezdőlapon (visszajelzes `sajatJavitott`, gepezet-5 6): CSAK a belépett ember SAJÁT, nem névtelen, az AKTUÁLIS
//    szervezetben az elmúlt 24 órában „kész”-re tett jelzései jutnak a lapra. Más szervezet jelzése, ugyanannak az embernek a MÁSIK
//    szervezetben tett jelzése, névtelen, régi és nem kész jelzés nem (A-11). A nem belső `lap` nem lesz link.
//  · 13: a /tagok?meghivo=1 a meghívó-ablakot nyitva adja a tulajdonosnak; paraméter nélkül zárva.
//  · 09/12/13/14: az R-15 lapok a fő gombjukkal jönnek (data-r15="fo-gomb"), a T3 tiltott szavak nélkül.
import { beforeAll, describe, expect, it } from "vitest";
import { DATABASE_URL, PROBA_CIM, keres, sql, veletlenEmail } from "./segedek";

const VAN_ADATBAZIS = DATABASE_URL !== "";
const JELSZO = "Tibor-Terko-2026!";

async function ujFiok(szervezetNev: string): Promise<{ sutik: string; szervezetId: string; fiokId: string }> {
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
  const [f] = await sql<{ fiok_id: string }>("SELECT fiok_id FROM tagsag WHERE szervezet_id = $1", [sz.torzs.id]);
  return { sutik, szervezetId: sz.torzs.id, fiokId: f!.fiok_id };
}

async function lap(ut: string, sutik: string): Promise<{ statusz: number; szoveg: string }> {
  const v = await fetch(`${PROBA_CIM}${ut}`, { redirect: "manual", headers: { cookie: `${sutik}; km_nyelv=hu` } });
  return { statusz: v.status, szoveg: await v.text() };
}

async function jelzes(o: { szervezetId: string | null; fiokId: string | null; szoveg: string; lap?: string; allapot?: string; mikor?: string; nevtelen?: boolean }): Promise<void> {
  await sql(
    `INSERT INTO visszajelzes (szervezet_id, fiok_id, fiok_nev, nevtelen, lap, lap_cim, szoveg, nyelv, ablak, allapot, kesz_ido)
     VALUES ($1, $2, 'Próba Katalin', $3, $4, 'Képek', $5, 'hu', '{"w":390,"h":844}'::jsonb, $6, ${o.mikor ?? "now() - interval '1 hour'"})`,
    [o.szervezetId, o.fiokId, o.nevtelen ?? false, o.lap ?? "/kepek", o.szoveg, o.allapot ?? "kesz"],
  );
}

describe.skipIf(!VAN_ADATBAZIS)("c5 2. kör — élő próbák", () => {
  let a: { sutik: string; szervezetId: string; fiokId: string };
  let b: { sutik: string; szervezetId: string; fiokId: string };
  const jel = crypto.randomUUID().slice(0, 8);

  beforeAll(async () => {
    a = await ujFiok("Kovács Térkő Kft.");
    b = await ujFiok("Szabó Kert Kft.");
    await jelzes({ szervezetId: a.szervezetId, fiokId: a.fiokId, szoveg: `SAJAT-1-${jel} A „Letöltés” gomb kétszer tölti le a képet` });
    await jelzes({ szervezetId: a.szervezetId, fiokId: a.fiokId, szoveg: `SAJAT-2-${jel} Túlcsordul a „Mutasd be a szervezetet”`, lap: "/onboarding" });
    await jelzes({ szervezetId: a.szervezetId, fiokId: a.fiokId, szoveg: `KULSO-${jel} kívülre mutató lap`, lap: "//pelda.hu/x" });
    await jelzes({ szervezetId: b.szervezetId, fiokId: b.fiokId, szoveg: `MASIK-SZERVEZET-${jel} Szabó Kert jelzése` });
    await jelzes({ szervezetId: b.szervezetId, fiokId: a.fiokId, szoveg: `SAJAT-MAS-SZERVEZETBEN-${jel}` });
    await jelzes({ szervezetId: a.szervezetId, fiokId: null, nevtelen: true, szoveg: `NEVTELEN-${jel}` });
    await jelzes({ szervezetId: a.szervezetId, fiokId: a.fiokId, szoveg: `REGI-${jel}`, mikor: "now() - interval '3 days'" });
    await jelzes({ szervezetId: a.szervezetId, fiokId: a.fiokId, szoveg: `NEM-KESZ-${jel}`, allapot: "uj", mikor: "null" });
  }, 60_000);

  it("c7: a Kezdőlap csak a saját, aktuális szervezetbeli, 24 órán belül kész jelzéseket kapja (A-11)", async () => {
    const k = await lap("/kezdolap", a.sutik);
    expect(k.statusz).toBe(200);
    for (const s of [`SAJAT-1-${jel}`, `SAJAT-2-${jel}`, `KULSO-${jel}`]) expect(k.szoveg, s).toContain(s);
    for (const s of [`MASIK-SZERVEZET-${jel}`, `SAJAT-MAS-SZERVEZETBEN-${jel}`, `NEVTELEN-${jel}`, `REGI-${jel}`, `NEM-KESZ-${jel}`]) expect(k.szoveg, s).not.toContain(s);
    // a sáv eleme kiszolgálói rendereléssel jön: a súgója / akadálymentes neve a mondat a darabszámmal
    expect(k.szoveg).toContain('aria-label="Tegnap 3 jelzésedet kijavítottuk."');
    // a nem belső útvonal nem megy ki (a lenyíló csak a belsőből csinál linket)
    expect(k.szoveg).not.toContain("//pelda.hu/x");
  });

  it("c7: a másik szervezet tulajdonosa a saját jelzését látja, a miénket nem; jelzés nélkül nincs elem", async () => {
    const k = await lap("/kezdolap", b.sutik);
    expect(k.szoveg).toContain(`MASIK-SZERVEZET-${jel}`);
    expect(k.szoveg).toContain('aria-label="Tegnap 1 jelzésedet kijavítottuk."');
    expect(k.szoveg).not.toContain(`SAJAT-1-${jel}`);
    expect(k.szoveg).not.toContain(`SAJAT-MAS-SZERVEZETBEN-${jel}`); // a fiók a-é, a szervezet b — b tulajdonosának nem a sajátja
    const c = await ujFiok("Tóth Építő Kft.");
    const u = await lap("/kezdolap", c.sutik);
    // (a felirat-szótár a lap adatában mindig ott van — a sáv ELEME nincs a lapon)
    expect(u.szoveg).not.toContain('class="r15jv-gomb"');
  }, 60_000);

  it("13: /tagok?meghivo=1 nyitott meghívó-ablakkal jön, paraméter nélkül zárva", async () => {
    expect((await lap("/tagok?meghivo=1", a.sutik)).szoveg).toContain("km-tg-parbeszed");
    expect((await lap("/tagok", a.sutik)).szoveg).not.toContain("km-tg-parbeszed\"");
  });

  it("09/12/13/14: az R-15 lapok fő gombbal, tiltott szó nélkül", async () => {
    const TILTOTT = [/ai-javaslat/i, /ai-keret/i, /\bmodul/i, /tulajdonos nézet/i, /még nem működik/i];
    for (const [ut, fo] of [["/kepek", "Képet készítek a munkámról"], ["/fiok", "Logó és színek"], ["/gephaz", "Meghívok valakit"], ["/beallitasok", "Vissza a Kezdőlapra"]] as const) {
      const l = await lap(ut, a.sutik);
      expect(l.statusz, ut).toBe(200);
      expect(l.szoveg, ut).toContain('data-r15="fo-gomb"');
      expect(l.szoveg, ut).toContain(fo);
      const lathato = l.szoveg.replace(/<script[\s\S]*?<\/script>/g, "");
      for (const r of TILTOTT) expect(r.test(lathato), `${ut}: ${r}`).toBe(false);
    }
  }, 60_000);
});
