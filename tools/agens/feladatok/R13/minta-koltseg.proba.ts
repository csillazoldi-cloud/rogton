import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, sql, takaritas, lezar, sutiKinyer } from "./segedek";

// E-39: AI-költség és keret szervezetenként. Amit bizonyítunk:
//  – a saját nézetet minden belépett tag látja, idegen nem;
//  – a rendszergazda-nézet és a keretállítás CSAK rendszergazdának megy;
//  – a keret nem díszlet: nullára állítva a következő AI-hívás tényleg megáll.

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

describe("AI-költség szervezetenként (E-39)", () => {
  let tag: Fiok;
  let gazda: Fiok;

  beforeAll(async () => {
    tag = await fiokot_letrehoz();
    gazda = await fiokot_letrehoz();
    // a rendszergazda-jelölés az adatbázisban él (E-13) — a próbához közvetlenül adjuk meg
    await sql("UPDATE fiok SET rendszergazda = true WHERE id = $1", [gazda.fiokId]);
  });

  afterAll(async () => {
    await sql("UPDATE szervezet SET ai_keret_usd = NULL WHERE id = $1", [tag.szervezetId]);
    await takaritas();
    await lezar();
  });

  it("1. a saját nézet belépés nélkül 401", async () => {
    const v = await keres("/api/koltseg");
    expect(v.statusz).toBe(401);
  });

  it("2. a saját nézet belépve 200, és a saját szervezet adatait adja", async () => {
    const v = await keres<{ koltseg: { honap: string; usd: number; keret_usd: number; hivasok: number; feladatok: unknown[] } }>("/api/koltseg", { sutik: tag.sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.koltseg.honap).toMatch(/^\d{4}-\d{2}$/);
    expect(v.torzs.koltseg.keret_usd).toBeGreaterThan(0);
    expect(Array.isArray(v.torzs.koltseg.feladatok)).toBe(true);
  });

  it("3. a rendszergazda-nézet közönséges tagnak 403", async () => {
    const v = await keres("/api/koltseg/osszes", { sutik: tag.sutik });
    expect(v.statusz).toBe(403);
  });

  it("4. a rendszergazda-nézet rendszergazdának 200, és több szervezetet lát", async () => {
    const v = await keres<{ koltseg: { sorok: { szervezet_id: string }[]; osszes: { szervezetek: number } } }>("/api/koltseg/osszes", { sutik: gazda.sutik });
    expect(v.statusz).toBe(200);
    const idk = v.torzs.koltseg.sorok.map((s) => s.szervezet_id);
    expect(idk).toContain(tag.szervezetId);
    expect(idk).toContain(gazda.szervezetId);
    expect(v.torzs.koltseg.osszes.szervezetek).toBeGreaterThan(1);
  });

  it("5. keretállítás közönséges tagnak 403 — és tényleg nem is írt", async () => {
    const v = await keres("/api/koltseg/keret", {
      modszer: "PUT", sutik: tag.sutik,
      torzs: { keretek: [{ szervezet_id: tag.szervezetId, keret_usd: 999 }] },
    });
    expect(v.statusz).toBe(403);
    const sor = await sql<{ ai_keret_usd: string | null }>("SELECT ai_keret_usd FROM szervezet WHERE id = $1", [tag.szervezetId]);
    expect(sor[0]?.ai_keret_usd).toBeNull();
  });

  it("6. rossz törzs 400", async () => {
    const v = await keres("/api/koltseg/keret", { modszer: "PUT", sutik: gazda.sutik, torzs: { keretek: [{ szervezet_id: "nem-uuid", keret_usd: 1 }] } });
    expect(v.statusz).toBe(400);
  });

  it("7. a rendszergazda beállítja a keretet, és a szervezet SAJÁT nézete is ezt mutatja", async () => {
    const v = await keres("/api/koltseg/keret", {
      modszer: "PUT", sutik: gazda.sutik,
      torzs: { keretek: [{ szervezet_id: tag.szervezetId, keret_usd: 0 }] },
    });
    expect(v.statusz).toBe(200);
    const sajat = await keres<{ koltseg: { keret_usd: number } }>("/api/koltseg", { sutik: tag.sutik });
    expect(sajat.torzs.koltseg.keret_usd).toBe(0);
  });

  it("8. A KERET NEM DÍSZLET: nulla kerettel az AI-hívás megáll (429)", async () => {
    // a nulla keret a 7. próbában került be; az onboarding AI-hívása ezért nem indulhat el
    const v = await keres("/api/onboarding/osszefoglalo", {
      modszer: "POST", sutik: tag.sutik,
      torzs: { forras_tipus: "leiras", leiras: "Egy próbaszervezet, ami könyveket ad ki." },
    });
    expect(v.statusz).toBe(429);
    expect((v.torzs as { hiba?: string }).hiba).toBe("AI_KERET_KIMERULT");
  });

  it("9. a keret visszaállítása után ugyanaz a hívás átmegy", async () => {
    const vissza = await keres("/api/koltseg/keret", {
      modszer: "PUT", sutik: gazda.sutik,
      torzs: { keretek: [{ szervezet_id: tag.szervezetId, keret_usd: null }] },
    });
    expect(vissza.statusz).toBe(200);
    const v = await keres("/api/onboarding/osszefoglalo", {
      modszer: "POST", sutik: tag.sutik,
      torzs: { forras_tipus: "leiras", leiras: "Egy próbaszervezet, ami könyveket ad ki." },
    });
    expect(v.statusz).toBe(200);
  });

  it("10. a hívás bekerül a saját nézetbe (hívásszám nő)", async () => {
    const v = await keres<{ koltseg: { hivasok: number; feladatok: { feladat: string }[] } }>("/api/koltseg", { sutik: tag.sutik });
    expect(v.torzs.koltseg.hivasok).toBeGreaterThan(0);
    expect(v.torzs.koltseg.feladatok.map((f) => f.feladat)).toContain("osszefoglalo");
  });
});
