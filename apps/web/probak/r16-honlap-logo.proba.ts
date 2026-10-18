// R-16 K7 (TERV §2-K7 Self-test, 1.7 R7; gepezet 10): a honlapon talált logó a munkatér fájlja lesz — csak ha még nincs logója.
//  1. Tiszta rész, hamis letöltővel / rasztert készítővel / tárral (hálózat és adatbázis nélkül):
//     nincs logó → mentve (vilagos · honlap · feltöltő = a fiók); van logó → érintetlen, letöltés sincs; letöltési hiba → csendes eredmény,
//     nem dob; SVG → a rasztert készítő PNG-je kerül el; a raszter hibája csendes; a nem-kép bájt (text/html álcázva), a PDF, a 2 MB-os
//     fájl → nem ment; a letöltés alatt feltöltött logó → nem ment (R7 újra); a honlap címe, a színjelöltek és a szín-forrás a tervezetben.
//  2. Valódi adatbázissal (DATABASE_URL) és kiszolgálóval (PROBA_CIM), a VALÓDI fájltárral: az új munkatérbe a sor `eredet='honlap'`,
//     `logo_valtozat='vilagos'`; a második hívás semmit nem ír; egy feltöltött logós munkatérhez nem nyúl (a sor és a bájtok változatlanok).
//  3. „Az első beállítás megy tovább”: a csendes burok bármilyen hibánál (letöltő, tár) feloldódik, nem dob.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { ArculatTervezet } from "@rogton/contracts";
import type { FajlMeta } from "@rogton/fajl-core";
import { honlapLogoMent, logoFajlNev, type HonlapLogoEszkozok } from "../onboarding/honlap-logo";
import { honlapLogoCsendben, honlapTervezetbe, type SajatHonlap } from "../onboarding/arculat";
import { fajlTar } from "../fajl/tar";
import { DATABASE_URL, PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 0x1f, 0x15, 0xc4, 0x89, 0, 0, 0, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0, 1, 0, 0, 5, 0, 1, 0x0d, 0x0a, 0x2d, 0xb4, 0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
const SVG = new TextEncoder().encode('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 10"><rect width="40" height="10" fill="#a4471f"/></svg>');
const SZ = "11111111-1111-4111-8111-111111111111";
const FIOK = "22222222-2222-4222-8222-222222222222";

/** Memóriás tár: `lista` a logókat adja, `ment` rögzít. `mentElott`: a letöltés és a mentés közé tehető feltöltés (R7-verseny). */
function memoriaTar(kezdo: FajlMeta[] = []) {
  const sorok = [...kezdo];
  const mentve: { meta: FajlMeta; bajtok: Uint8Array }[] = [];
  let listaHivas = 0;
  let listaUtan: (() => void) | null = null;
  const tar: HonlapLogoEszkozok["tar"] = {
    async lista(sz, cel) { listaHivas++; const ki = sorok.filter((s) => s.szervezet_id === sz && (!cel || s.cel === cel)); if (listaHivas === 1) listaUtan?.(); return ki; },
    async ment(meta, bajtok) { sorok.push(meta); mentve.push({ meta, bajtok }); },
  };
  return { tar, mentve, sorok, versenyt: (f: () => void) => { listaUtan = f; } };
}
const letolto = (bajtok: Uint8Array, vegsoCim = "https://cipopekseg.hu/kepek/Cip%C3%B3-logo.png") => {
  const hivasok: string[] = [];
  return { hivasok, letolt: async (c: string) => { hivasok.push(c); return { vegsoCim, bajtok }; } };
};
const nincsRaszter = async (): Promise<Uint8Array> => { throw new Error("nem kellett volna raszterezni"); };
const regiLogo = (id: string): FajlMeta => ({ id, szervezet_id: SZ, nev: "sajat.png", tipus: "png", meret: 10, cel: "logo", feltoltotte: FIOK, feltoltve: "2026-09-29T10:00:00.000Z", logo_valtozat: "vilagos", eredet: "feltoltes" });

describe("honlapLogoMent — tiszta (hamis eszközökkel)", () => {
  it("nincs logó-fájl → mentve: vilagos, honlap, a fiók tette, PNG a bájtok fejéből, név a címből", async () => {
    const m = memoriaTar();
    const l = letolto(PNG);
    expect(await honlapLogoMent(SZ, FIOK, "https://cipopekseg.hu/logo", { letolt: l.letolt, raszter: nincsRaszter, tar: m.tar })).toBe("mentve");
    expect(l.hivasok).toEqual(["https://cipopekseg.hu/logo"]);
    expect(m.mentve).toHaveLength(1);
    const { meta, bajtok } = m.mentve[0]!;
    expect(meta).toMatchObject({ szervezet_id: SZ, cel: "logo", tipus: "png", meret: PNG.byteLength, logo_valtozat: "vilagos", eredet: "honlap", feltoltotte: FIOK, nev: "Cipó-logo.png", elemzes: null });
    expect(meta.id).toMatch(/^[0-9a-f-]{36}$/);
    expect([...bajtok]).toEqual([...PNG]);
  });

  it("van logó-fájl (bármelyik helyen, bármilyen eredettel) → érintetlen, a letöltő sem fut (R7)", async () => {
    for (const van of [regiLogo("a"), { ...regiLogo("b"), logo_valtozat: "sotet" as const, eredet: "gep" as const }, { ...regiLogo("c"), tipus: "pdf" as const }]) {
      const m = memoriaTar([van]);
      const l = letolto(PNG);
      expect(await honlapLogoMent(SZ, FIOK, "https://cipopekseg.hu/logo.png", { letolt: l.letolt, raszter: nincsRaszter, tar: m.tar })).toBe("van_logo");
      expect(l.hivasok).toEqual([]);
      expect(m.mentve).toEqual([]);
    }
  });

  it("nincs logó-cím → semmi", async () => {
    const m = memoriaTar();
    expect(await honlapLogoMent(SZ, FIOK, null, { letolt: letolto(PNG).letolt, raszter: nincsRaszter, tar: m.tar })).toBe("nincs_cim");
    expect(await honlapLogoMent(SZ, FIOK, "", { letolt: letolto(PNG).letolt, raszter: nincsRaszter, tar: m.tar })).toBe("nincs_cim");
    expect(m.mentve).toEqual([]);
  });

  it("letöltési hiba → csendes eredmény, nem dob, nem ment", async () => {
    const m = memoriaTar();
    const hibas = async () => { throw Object.assign(new Error("FORRAS_TILTOTT_CIM"), { kod: "FORRAS_TILTOTT_CIM" }); };
    await expect(honlapLogoMent(SZ, FIOK, "http://10.0.0.5/logo.png", { letolt: hibas, raszter: nincsRaszter, tar: m.tar })).resolves.toBe("letoltes_hiba");
    expect(m.mentve).toEqual([]);
  });

  it("SVG → a képgyártó PNG-je kerül el (az SVG nem); a raszter hibája csendes", async () => {
    const m = memoriaTar();
    const kapott: string[] = [];
    const raszter = async (b: Uint8Array) => { kapott.push(new TextDecoder().decode(b)); return PNG; };
    expect(await honlapLogoMent(SZ, FIOK, "https://cipopekseg.hu/logo.svg", { letolt: letolto(SVG, "https://cipopekseg.hu/logo.svg").letolt, raszter, tar: m.tar })).toBe("mentve");
    expect(kapott).toHaveLength(1);
    expect(kapott[0]).toContain("<svg");
    expect(m.mentve[0]!.meta).toMatchObject({ tipus: "png", nev: "logo.png", eredet: "honlap", logo_valtozat: "vilagos" });
    expect([...m.mentve[0]!.bajtok]).toEqual([...PNG]);
    const m2 = memoriaTar();
    const rosszRaszter = async (): Promise<Uint8Array> => { throw new Error("svg-png: 400"); };
    await expect(honlapLogoMent(SZ, FIOK, "https://cipopekseg.hu/logo.svg", { letolt: letolto(SVG).letolt, raszter: rosszRaszter, tar: m2.tar })).resolves.toBe("raszter_hiba");
    // a raszterező nem-PNG-t ad vissza (pl. megint SVG-t) → nem ment
    const m3 = memoriaTar();
    await expect(honlapLogoMent(SZ, FIOK, "https://cipopekseg.hu/logo.svg", { letolt: letolto(SVG).letolt, raszter: async () => SVG, tar: m3.tar })).resolves.toBe("rossz_tipus");
    expect([...m2.mentve, ...m3.mentve]).toEqual([]);
  });

  it("nem-kép bájtok (a fejléc képnek mondta), PDF, GIF, 2 MB → nem ment", async () => {
    const eset = async (b: Uint8Array) => { const m = memoriaTar(); const e = await honlapLogoMent(SZ, FIOK, "https://cipopekseg.hu/x", { letolt: letolto(b).letolt, raszter: nincsRaszter, tar: m.tar }); expect(m.mentve).toEqual([]); return e; };
    expect(await eset(new TextEncoder().encode("<!doctype html><html><body>nem logó</body></html>"))).toBe("rossz_tipus");
    expect(await eset(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]))).toBe("rossz_tipus"); // PDF: feltölthető, képre nem kerül
    expect(await eset(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe("rossz_tipus");
    const nagy = new Uint8Array(2_000_000); nagy.set(PNG);
    expect(await eset(nagy)).toBe("tul_nagy");
  });

  it("a letöltés alatt feltöltött logó → nem ment (R7 a mentés előtt újra)", async () => {
    const m = memoriaTar();
    m.versenyt(() => m.sorok.push(regiLogo("kozben")));
    expect(await honlapLogoMent(SZ, FIOK, "https://cipopekseg.hu/logo.png", { letolt: letolto(PNG).letolt, raszter: nincsRaszter, tar: m.tar })).toBe("van_logo");
    expect(m.mentve).toEqual([]);
  });

  it("a tár hibája is csendes", async () => {
    const tar: HonlapLogoEszkozok["tar"] = { lista: async () => { throw new Error("adatbázis nem érhető el"); }, ment: async () => undefined };
    await expect(honlapLogoMent(SZ, FIOK, "https://cipopekseg.hu/logo.png", { letolt: letolto(PNG).letolt, raszter: nincsRaszter, tar })).resolves.toBe("mentes_hiba");
  });

  it("logoFajlNev: az utolsó útszakasz ékezettel, a kiterjesztés a valódi típusé; üres / hibás cím → logo", () => {
    expect(logoFajlNev("https://x.hu/a/%C3%96rd%C3%B6gh%20log%C3%B3.svg?v=2", "png")).toBe("Ördögh logó.png");
    expect(logoFajlNev("https://x.hu/", "jpg")).toBe("logo.jpg");
    expect(logoFajlNev("nem cím", "webp")).toBe("logo.webp");
  });
});

describe("honlapTervezetbe — a honlap a tervezetben (tiszta)", () => {
  const alap = ArculatTervezet.parse({ elsodleges: "#2f5d4e", masodlagos: "#d9a441", hatter: "#f5f1e8", nyelv: "hu", eredet: "ai" });
  const sajat = (fo: string | null): SajatHonlap => ({
    honlap: "https://cipopekseg.hu",
    szinek: { fo: fo as never, masodik: fo ? "#e3a857" : null, hatter: fo ? "#fbf3e8" : null, logo: "https://cipopekseg.hu/logo.png", jeloltek: [{ szin: "#a4471f", suly: 9 }, { szin: "#E3A857" as never, suly: 5 }, { szin: "#a4471f", suly: 1 }, { szin: "#fbf3e8", suly: 1 }] },
  });
  it("a színek a honlapról: forras_cim, szin_forras = honlap, a jelöltek (kisbetűs, ismétlés nélkül), eredet forras", () => {
    const t = honlapTervezetbe(alap, sajat("#a4471f"));
    expect(t).toMatchObject({ elsodleges: "#a4471f", masodlagos: "#e3a857", hatter: "#fbf3e8", eredet: "forras", szin_forras: "honlap", forras_cim: "https://cipopekseg.hu", szin_jeloltek: ["#a4471f", "#e3a857", "#fbf3e8"] });
    expect(ArculatTervezet.safeParse(t).success).toBe(true);
  });
  it("a lap olvasható, de színt nem adott: a cím és a jelöltek igen, a színek és a szín-forrás maradnak", () => {
    const t = honlapTervezetbe(alap, sajat(null));
    expect(t).toMatchObject({ elsodleges: "#2f5d4e", eredet: "ai", szin_forras: "", forras_cim: "https://cipopekseg.hu" });
  });
  it("nincs honlap: a tervezet változatlan", () => {
    expect(honlapTervezetbe(alap, null)).toEqual(alap);
  });
});

describe("honlapLogoCsendben — az első beállítás megy tovább", () => {
  it("bármilyen hibánál (elutasított ígéret, belső cím, fiók nélkül) feloldódik, nem dob", async () => {
    await expect(honlapLogoCsendben(SZ, FIOK, Promise.reject(new Error("kutatás hiba")))).resolves.toBeUndefined();
    await expect(honlapLogoCsendben(SZ, undefined, Promise.resolve({ honlap: "https://x.hu", szinek: { fo: null, masodik: null, hatter: null, logo: "https://x.hu/l.png", jeloltek: [] } }))).resolves.toBeUndefined();
    // valódi letöltő: a belső cím elutasítva; a tár (adatbázis nélkül is) — semmi nem dob
    await expect(honlapLogoCsendben(SZ, FIOK, Promise.resolve({ honlap: "http://127.0.0.1", szinek: { fo: null, masodik: null, hatter: null, logo: "http://127.0.0.1:9/logo.png", jeloltek: [] } }))).resolves.toBeUndefined();
  });
});

describe.skipIf(!DATABASE_URL)("honlapLogoMent — valódi fájltárral (R-16 K7)", () => {
  const jelszo = "ProbaJelszo123!";
  let ujSz: string, ujFiok: string, regiSz: string, regiFiok: string;
  type Sor = { id: string; nev: string; tipus: string; eredet: string; logo_valtozat: string | null; feltoltotte: string | null; meret: number };
  const sorok = (sz: string) => sql<Sor>("SELECT id, nev, tipus, eredet, logo_valtozat, feltoltotte::text, meret FROM arculat_fajl WHERE szervezet_id = $1 AND cel = 'logo' ORDER BY feltoltve, id", [sz]);
  async function munkater(nev: string): Promise<{ sz: string; fiok: string; sutik: string }> {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Próba Péter", email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const sutik = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev }, sutik });
    expect(sz.statusz).toBe(201);
    return { sz: sz.torzs.id, fiok: (await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [email]))[0]!.id, sutik };
  }
  beforeAll(async () => {
    const a = await munkater("Cipó Pékség");
    ujSz = a.sz; ujFiok = a.fiok;
    const b = await munkater("Ördögh Ősz Árpád Kft.");
    regiSz = b.sz; regiFiok = b.fiok;
    const v = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST", body: PNG.slice().buffer as ArrayBuffer,
      headers: { cookie: `${b.sutik}; km_nyelv=hu`, "x-fajl-nev": encodeURIComponent("saját logó.png"), "x-fajl-cel": "logo", "content-type": "application/octet-stream", "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 254) + 1}` },
    });
    expect(v.status).toBe(201);
  });
  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("új munkatér: egy sor, honlap · vilagos · a fiók; a bájtok a lemezen", async () => {
    expect(await sorok(ujSz)).toEqual([]);
    expect(await honlapLogoMent(ujSz, ujFiok, "https://cipopekseg.hu/logo.png", { letolt: letolto(PNG).letolt, raszter: nincsRaszter, tar: fajlTar })).toBe("mentve");
    const s = await sorok(ujSz);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ tipus: "png", eredet: "honlap", logo_valtozat: "vilagos", feltoltotte: ujFiok, meret: PNG.byteLength, nev: "Cipó-logo.png" });
    expect([...(await fajlTar.olvas(ujSz, s[0]!.id))!]).toEqual([...PNG]);
    // második hívás (pl. a régi 2. lépés végpontja újra): semmi új
    expect(await honlapLogoMent(ujSz, ujFiok, "https://cipopekseg.hu/logo.png", { letolt: letolto(PNG).letolt, raszter: nincsRaszter, tar: fajlTar })).toBe("van_logo");
    expect(await sorok(ujSz)).toHaveLength(1);
  });

  it("feltöltött logós munkatér: a sor és a bájtok változatlanok, új sor nincs", async () => {
    const elotte = await sorok(regiSz);
    expect(elotte).toHaveLength(1);
    expect(elotte[0]!.eredet).toBe("feltoltes");
    const bajtElotte = await fajlTar.olvas(regiSz, elotte[0]!.id);
    const l = letolto(PNG);
    expect(await honlapLogoMent(regiSz, regiFiok, "https://orodgh.ro/logo.png", { letolt: l.letolt, raszter: nincsRaszter, tar: fajlTar })).toBe("van_logo");
    expect(l.hivasok).toEqual([]);
    expect(await sorok(regiSz)).toEqual(elotte);
    expect([...(await fajlTar.olvas(regiSz, elotte[0]!.id))!]).toEqual([...bajtElotte!]);
  });

  it("letöltési hiba a valódi tárral: nincs sor, nincs árva fájl a mappában", async () => {
    const c = await munkater("Știință și Țară SRL");
    expect(await honlapLogoMent(c.sz, c.fiok, "https://stiinta.ro/logo.png", { letolt: async () => { throw new Error("FORRAS_NEM_ELERHETO"); }, raszter: nincsRaszter, tar: fajlTar })).toBe("letoltes_hiba");
    expect(await sorok(c.sz)).toEqual([]);
    const mappa = await readdir(join(process.env.FAJL_MAPPA ?? "./adatok/fajlok", c.sz)).catch(() => [] as string[]);
    expect(mappa).toEqual([]);
  });
});
