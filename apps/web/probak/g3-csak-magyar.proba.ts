// G3 (Rögtön, 2026-10-18): a felület CSAK magyar. A tartalomnyelvek (TARTALOMNYELVEK) és a feliratok három nyelvű tárolása
// változatlan — ez a próba csak a FELÜLET nyelvét őrzi:
//   1. minden feliratkulcsnak van magyar szövege (az adatbázis alapja és a feliratok/*.json alapfájlok);
//   2. a /api/nyelv csak a magyart fogadja el (ro / en → 400);
//   3. román böngésző (Accept-Language + régi km_nyelv=ro süti) is magyar lapot kap;
//   4. nyelvválasztó sehol nincs a DOM-ban (kijelentkezve és belépve, a fő lapokon).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ALAP_NYELV, FELULETI_NYELVEK, VAN_NYELVVALASZTAS, feluletiNyelv } from "@rogton/design-system";
import { nyelvDontes } from "../nyelv";
import { DATABASE_URL, keres, lezar, sql, takaritas, veletlenEmail } from "./segedek";

const VAN_ADATBAZIS = DATABASE_URL !== "";

describe("G3 felületi nyelv — szabály (adatbázis nélkül)", () => {
  it("egyetlen felületi nyelv: a magyar; ez az alap is", () => {
    expect(FELULETI_NYELVEK).toEqual(["hu"]);
    expect(ALAP_NYELV).toBe("hu");
    expect(VAN_NYELVVALASZTAS).toBe(false);
  });
  it("bármilyen kért nyelvből magyar felület lesz", () => {
    for (const k of ["ro", "en", "de", "", null, undefined, "hu"]) expect(feluletiNyelv(k)).toBe("hu");
    expect(nyelvDontes("ro", "ro-RO,ro;q=0.9,en;q=0.8")).toEqual({ nyelv: "hu", eldontve: true });
    expect(nyelvDontes(undefined, "en-US")).toEqual({ nyelv: "hu", eldontve: true });
    expect(nyelvDontes(undefined, null)).toEqual({ nyelv: "hu", eldontve: true });
  });
  it("a feliratok alapfájljaiban minden ro/en kulcsnak van magyar párja", () => {
    const olvas = (ny: string) => JSON.parse(readFileSync(new URL(`../feliratok/${ny}.json`, import.meta.url), "utf8")) as Record<string, unknown>;
    const lapos = (o: Record<string, unknown>, elo = ""): string[] =>
      Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? lapos(v as Record<string, unknown>, `${elo}${k}.`) : [`${elo}${k}`]));
    const hu = new Set(lapos(olvas("hu")));
    for (const ny of ["ro", "en"]) expect(lapos(olvas(ny)).filter((k) => !hu.has(k)), `${ny}.json kulcsai magyar nélkül`).toEqual([]);
  });
});

describe.skipIf(!VAN_ADATBAZIS)("G3 felületi nyelv — élő (adatbázis + futó alkalmazás)", () => {
  let sutik = "";
  const email = veletlenEmail();
  const ROMAN = { "accept-language": "ro-RO,ro;q=0.9,en;q=0.5" };

  beforeAll(async () => {
    const jelszo = "Árvíztűrő-Tükörfúrógép-2026";
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Szőke-Gyöngyösi Örs Ödön", email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    expect(b.statusz).toBe(200);
    sutik = b.sutik.map((s) => s.split(";")[0]).join("; ");
    expect((await keres("/api/szervezet", { modszer: "POST", sutik, torzs: { nev: "Hűvösvölgyi Ökoépítő és Térkövező Bt." } })).statusz).toBe(201);
  });
  afterAll(async () => { await takaritas(); await lezar(); });

  it("minden feliratkulcsnak van nem üres magyar szövege az adatbázisban", async () => {
    const hianyzo = await sql<{ kulcs: string }>(
      "SELECT kulcs FROM felirat GROUP BY kulcs HAVING NOT bool_or(nyelv = 'hu' AND szoveg <> '') ORDER BY kulcs LIMIT 20",
    );
    expect(hianyzo.map((s) => s.kulcs)).toEqual([]);
  });

  it("/api/nyelv: hu → 204, ro / en / ismeretlen → 400", async () => {
    expect((await keres("/api/nyelv", { modszer: "POST", torzs: { nyelv: "hu" } })).statusz).toBe(204);
    for (const nyelv of ["ro", "en", "de"]) {
      const v = await keres<{ hiba: string }>("/api/nyelv", { modszer: "POST", torzs: { nyelv } });
      expect(v.statusz, nyelv).toBe(400);
      expect(v.torzs.hiba).toBe("ERVENYTELEN_ADAT");
    }
  });

  it("román böngésző és régi ro süti: a belépőlap magyar", async () => {
    const v = await keres<string>("/belepes", { sutik: "km_nyelv=ro", fejlecek: ROMAN });
    expect(v.statusz).toBe(200);
    expect(v.torzs).toMatch(/<html[^>]* lang="hu"/);
    expect(v.torzs).toContain("Belépés");
    expect(v.torzs).not.toMatch(/Autentificare|Conectare|Log in/);
  });

  it("belépve, ro fióknyelvvel és ro sütivel is magyar a kezdőlap", async () => {
    await sql("UPDATE fiok SET nyelv = 'ro' WHERE email = $1", [email]);
    const v = await keres<string>("/kezdolap", { sutik: `${sutik}; km_nyelv=ro`, fejlecek: ROMAN });
    expect(v.statusz).toBe(200);
    expect(v.torzs).toMatch(/<html[^>]* lang="hu"/);
  });

  const VALASZTO = [/class="[^"]*\bkm-nyelv\b/, /km-ny-nyelvsav/, /id="sf-nyelv"/, /\bkm-sav-nyelv\b/, /r18-menu-nyelv/, /r15e-nyelv-halk/, /km-ny-nyelv\b/];
  it("nincs nyelvválasztó a DOM-ban — kijelentkezve", async () => {
    for (const lap of ["/belepes", "/regisztracio", "/jelszo-elfelejtve"]) {
      const v = await keres<string>(lap, { fejlecek: ROMAN });
      for (const m of VALASZTO) expect(v.torzs, `${lap}: ${m}`).not.toMatch(m);
    }
  });
  it("nincs nyelvválasztó a DOM-ban — belépve", async () => {
    for (const lap of ["/kezdolap", "/sajat-fiok", "/onboarding", "/beallitasok", "/poszt", "/kepek"]) {
      const v = await keres<string>(lap, { sutik, fejlecek: ROMAN });
      expect([200, 307, 308], lap).toContain(v.statusz);
      for (const m of VALASZTO) expect(v.torzs, `${lap}: ${m}`).not.toMatch(m);
    }
  });
});
