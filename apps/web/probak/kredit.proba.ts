// R-13 (2026-09-22): élő próbák a kredit- és a saját-szűrés végpontokhoz — Qwen írta (R13-Q1), Claude javította
// (a második fiók munkatér-váltása, a válaszok típusa, a kredit visszaállítása NULL-ra).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar, sutiKinyer } from "./segedek";

const jelszo = "ProbaJelszo123!";

type Fiok = { sutik: string; fiokId: string; szervezetId: string; email: string };

async function fiokot_letrehoz(): Promise<Fiok> {
  const email = veletlenEmail();
  const r = await keres<{ id: string }>("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Proba", email, jelszo } });
  expect(r.statusz).toBe(201);
  const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
  expect(b.statusz).toBe(200);
  const suti = sutiKinyer(b.sutik, "km_munkamenet");
  const sutik = `km_munkamenet=${suti}`;
  const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: `Proba szervezet ${email.slice(6, 14)}` }, sutik });
  expect(sz.statusz).toBe(201);
  return { sutik, fiokId: r.torzs.id, szervezetId: sz.torzs.id, email };
}

describe("Kredit és szűrés végpontok (R13-Q1)", () => {
  let tulajdonos: Fiok;
  let masodik: Fiok;
  let gazda: Fiok;

  beforeAll(async () => {
    tulajdonos = await fiokot_letrehoz();
    masodik = await fiokot_letrehoz();
    gazda = await fiokot_letrehoz();
    
    // Rendszergazda-jelölés SQL-lel
    await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [gazda.fiokId]);
    
    // A második fiók beillesztése a tulajdonos munkatérbe SQL-lel
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'szerkeszto')", [tulajdonos.szervezetId, masodik.fiokId]);
    // a második fiók a tulajdonos munkaterében dolgozzon (különben a saját, újonnan létrehozott munkaterét látja)
    const valt = await keres("/api/szervezet/valt", { modszer: "POST", sutik: masodik.sutik, torzs: { szervezet_id: tulajdonos.szervezetId } });
    expect(valt.statusz).toBe(200);
  });

  afterAll(async () => {
    // Kredit visszaállítása alapértelmezettre (1000)
    await sql("UPDATE szervezet SET kredit_havi = NULL WHERE id = $1", [tulajdonos.szervezetId]);
    // Rendszergazda-jelölés törlése
    await sql("UPDATE fiok SET rendszergazda = false WHERE id = $1", [gazda.fiokId]);
    
    await takaritas();
    await lezar();
  });

  it("1. Belépés nélkül 401", async () => {
    const v1 = await keres("/api/kredit/sajat");
    expect(v1.statusz).toBe(401);
    
    const v2 = await keres("/api/hirfigyelo/sajat-szures");
    expect(v2.statusz).toBe(401);
  });

  it("2. Saját szűrés alapértelmezett és módosítás", async () => {
    // Alapértelmezett ellenőrzés
    const alap = await keres<{ szures: { fokozat: string; eloszures: boolean } }>("/api/hirfigyelo/sajat-szures", { sutik: tulajdonos.sutik });
    expect(alap.statusz).toBe(200);
    expect(alap.torzs.szures.fokozat).toBe("nagyon_szigoru");
    expect(alap.torzs.szures.eloszures).toBe(true);

    // Módosítás
    const put = await keres<{ szures: { fokozat: string; eloszures: boolean } }>("/api/hirfigyelo/sajat-szures", {
      modszer: "PUT",
      sutik: tulajdonos.sutik,
      torzs: { fokozat: "kozepes", eloszures: false }
    });
    expect(put.statusz).toBe(200);
    expect(put.torzs.szures.fokozat).toBe("kozepes");
    expect(put.torzs.szures.eloszures).toBe(false);

    // GET visszaigazolás
    const get = await keres<{ szures: { fokozat: string; eloszures: boolean } }>("/api/hirfigyelo/sajat-szures", { sutik: tulajdonos.sutik });
    expect(get.torzs.szures.fokozat).toBe("kozepes");
    expect(get.torzs.szures.eloszures).toBe(false);

    // Rossz törzs 400
    const hiba = await keres("/api/hirfigyelo/sajat-szures", {
      modszer: "PUT",
      sutik: tulajdonos.sutik,
      torzs: { fokozat: "nagyon" }
    });
    expect(hiba.statusz).toBe(400);
  });

  it("3. Saját kredit alapértelmezett", async () => {
    const v = await keres<{ kredit: { honap: string; havi: number; felhasznalt: number; maradt: number } }>("/api/kredit/sajat", { sutik: tulajdonos.sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.kredit.honap).toMatch(/^\d{4}-\d{2}$/);
    expect(v.torzs.kredit.havi).toBe(1000);
    expect(v.torzs.kredit.felhasznalt).toBe(0);
    expect(v.torzs.kredit.maradt).toBe(1000);
  });

  it("4. Munkatér kredit módosítás jogosultságok", async () => {
    // Közönséges tagnak 403
    const tiltott = await keres("/api/kredit/munkater/" + tulajdonos.szervezetId, {
      modszer: "PUT",
      sutik: tulajdonos.sutik,
      torzs: { havi: 300 }
    });
    expect(tiltott.statusz).toBe(403);

    // Rendszergazdának 200
    const ok = await keres("/api/kredit/munkater/" + tulajdonos.szervezetId, {
      modszer: "PUT",
      sutik: gazda.sutik,
      torzs: { havi: 300 }
    });
    expect(ok.statusz).toBe(200);

    // Ellenőrzés, hogy a tag látja a 300-at
    const sajat = await keres<{ kredit: { havi: number } }>("/api/kredit/sajat", { sutik: tulajdonos.sutik });
    expect(sajat.torzs.kredit.havi).toBe(300);

    // Visszaállítás nullára
    const vissza = await keres("/api/kredit/munkater/" + tulajdonos.szervezetId, {
      modszer: "PUT",
      sutik: gazda.sutik,
      torzs: { havi: null }
    });
    expect(vissza.statusz).toBe(200);

    // Ellenőrzés, hogy 1000-re állt vissza
    const sajat2 = await keres<{ kredit: { havi: number } }>("/api/kredit/sajat", { sutik: tulajdonos.sutik });
    expect(sajat2.torzs.kredit.havi).toBe(1000);
  });

  it("5. Tagok kredit kiosztása", async () => {
    // GET tagok - alapértelmezett 500/500
    const tagok = await keres<{ kredit: { tagok: { fiok_id: string; havi: number }[] } }>("/api/kredit/tagok", { sutik: tulajdonos.sutik });
    expect(tagok.statusz).toBe(200);
    expect(tagok.torzs.kredit.tagok.length).toBe(2);
    
    const tulajdonosTag = tagok.torzs.kredit.tagok.find(t => t.fiok_id === tulajdonos.fiokId);
    const masodikTag = tagok.torzs.kredit.tagok.find(t => t.fiok_id === masodik.fiokId);
    
    expect(tulajdonosTag?.havi).toBe(500);
    expect(masodikTag?.havi).toBe(500);

    // PUT masodik fiók 200-ra
    const put = await keres("/api/kredit/tagok/" + masodik.fiokId, {
      modszer: "PUT",
      sutik: tulajdonos.sutik,
      torzs: { havi: 200 }
    });
    expect(put.statusz).toBe(200);

    // Ellenőrzés 800/200
    const tagok2 = await keres<{ kredit: { tagok: { fiok_id: string; havi: number }[] } }>("/api/kredit/tagok", { sutik: tulajdonos.sutik });
    const tulajdonosTag2 = tagok2.torzs.kredit.tagok.find(t => t.fiok_id === tulajdonos.fiokId);
    const masodikTag2 = tagok2.torzs.kredit.tagok.find(t => t.fiok_id === masodik.fiokId);
    
    expect(tulajdonosTag2?.havi).toBe(800);
    expect(masodikTag2?.havi).toBe(200);

    // Visszaállítás nullára
    const vissza = await keres("/api/kredit/tagok/" + masodik.fiokId, {
      modszer: "PUT",
      sutik: tulajdonos.sutik,
      torzs: { havi: null }
    });
    expect(vissza.statusz).toBe(200);

    // Ellenőrzés 500/500
    const tagok3 = await keres<{ kredit: { tagok: { fiok_id: string; havi: number }[] } }>("/api/kredit/tagok", { sutik: tulajdonos.sutik });
    const tulajdonosTag3 = tagok3.torzs.kredit.tagok.find(t => t.fiok_id === tulajdonos.fiokId);
    const masodikTag3 = tagok3.torzs.kredit.tagok.find(t => t.fiok_id === masodik.fiokId);
    
    expect(tulajdonosTag3?.havi).toBe(500);
    expect(masodikTag3?.havi).toBe(500);
  });

  it("6. Tagok nézet szerkesztőnek 403", async () => {
    const v = await keres("/api/kredit/tagok", { sutik: masodik.sutik });
    expect(v.statusz).toBe(403);
  });

  it("7. Nem létező fiókra 404", async () => {
    const v = await keres("/api/kredit/tagok/00000000-0000-4000-8000-000000000000", {
      modszer: "PUT",
      sutik: tulajdonos.sutik,
      torzs: { havi: 10 }
    });
    expect(v.statusz).toBe(404);
  });

  it("8. Felhasznált kredit a kredit_mozgas táblából", async () => {
    // Kapjuk meg a honapot
    const sajat = await keres<{ kredit: { honap: string } }>("/api/kredit/sajat", { sutik: masodik.sutik });
    const honap = sajat.torzs.kredit.honap;

    // SQL-lel szúrj be egy mozgást a második fióknak
    await sql("INSERT INTO kredit_mozgas (szervezet_id, fiok_id, honap, ezred, feladat) VALUES ($1, $2, $3, 1500, 'poszt_szoveg')", [
      tulajdonos.szervezetId,
      masodik.fiokId,
      honap
    ]);

    // Ellenőrzés a második fiók saját kreditjén
    const v = await keres<{ kredit: { felhasznalt: number; bontas: { poszt: number } } }>("/api/kredit/sajat", { sutik: masodik.sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.kredit.felhasznalt).toBe(1.5);
    expect(v.torzs.kredit.bontas.poszt).toBe(1.5);
  });
});
