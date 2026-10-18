// c30 F10 — a fotóalbum poszt (terv §6; rajz D8a–c) a kiszolgálón. Valódi kiszolgálóval (PROBA_CIM) és adatbázissal:
//  · 10 fotó (a pár: `nagy` + `kicsi`) egy poszt albumába, összekevert sorrendben → a lista a készítés ideje szerint jön, a párral;
//  · a válogatás: POST → 202 „fut” → a háttérben kész; a teszt-gép nem válaszol, ezért a TARTALÉK fut (a készítés ideje szerint,
//    egyenletesen, `gep: "sorrend"`); 15 fotóból 10, az első és az utolsó benne; a poszt fajtája „album”, a felirat megíródott;
//  · a gép útja (a válasz beadva): a sorszámok a fotókra mutatnak, a leírással, `gep: "ai"`; a 40-es határ, a „low” felbontás;
//  · a sorrend (D8c Előrébb / Hátrébb) és a „Kiveszem” (Csilla 10-17: a fotó a _torolni/ alá költözik, helyet szabadít fel);
//  · néző nem indít válogatást (403); más munkatér posztja 404;
//  · D7 + F10: a posztban használt fotó a 30 napos költöztetésnél a poszt használata szerint marad.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PosztAlbum, PosztMunka } from "@km/contracts";
import { albumHasznalat, albumHasznalatPosztokbol, albumKoltoztet } from "../album";
import { valogat } from "../album/poszt";
import type { AlbumFoto } from "../album/szabaly";
import { albumMappa } from "../fajl/tar";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const NAP = 24 * 60 * 60 * 1000;
const jelszo = "ProbaJelszo123!";

function jpeg(szel: number, mag: number, meret: number, mag0 = 0): Uint8Array {
  const fej = Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, mag >> 8, mag & 0xff, szel >> 8, szel & 0xff, 0x03, ...new Array(9).fill(1), 0xff, 0xda, 0x00, 0x0c, ...new Array(10).fill(0)]);
  const b = new Uint8Array(meret);
  b.set(fej, 0);
  for (let i = fej.length; i < meret - 2; i++) b[i] = (i * 7 + mag0) % 251 || 1;
  b[meret - 2] = 0xff; b[meret - 1] = 0xd9;
  return b;
}

async function feltolt(sutik: string, posztId: string, nev: string, keszult: string, i: number): Promise<string> {
  const fej = (extra: Record<string, string>) => ({ cookie: sutik, "content-type": "application/octet-stream", "x-fajl-nev": encodeURIComponent(nev), "x-album": posztId, "x-keszult": keszult, "x-forwarded-for": `198.51.100.${(i % 250) + 1}`, ...extra });
  const n = await fetch(`${PROBA_CIM}/api/album/foto`, { method: "POST", body: jpeg(2048, 1365, 200_000, i).slice().buffer as ArrayBuffer, headers: fej({}) });
  expect(n.status).toBe(201);
  const id = ((await n.json()) as { fajl: { id: string } }).fajl.id;
  const k = await fetch(`${PROBA_CIM}/api/album/foto`, { method: "POST", body: jpeg(512, 341, 30_000, i).slice().buffer as ArrayBuffer, headers: fej({ "x-album-par": id }) });
  expect(k.status).toBe(201);
  return id;
}

type Allapot = { album: PosztAlbum | null; fotok: AlbumFoto[]; munka: PosztMunka };
const allapot = async (s: string, id: string) => keres<Allapot>(`/api/poszt/${id}/album`, { sutik: s });
async function kesz(s: string, id: string): Promise<Allapot> {
  for (let i = 0; i < 60; i++) {
    const a = await allapot(s, id);
    if (a.torzs.album?.allapot !== "fut") return a.torzs;
    await new Promise((ok) => setTimeout(ok, 500));
  }
  throw new Error("a válogatás nem lett kész");
}

describe("c30 F10 — a fotóalbum poszt", () => {
  let s = "", sz = "", poszt = "", masik = "", nezo = "";
  const idk: string[] = []; // a készítés ideje szerinti sorrendben

  async function uj(nev: string): Promise<{ s: string; sz: string }> {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const su = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const r = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: `${nev} Egyesület` }, sutik: su });
    return { s: su, sz: r.torzs.id };
  }
  const posztUj = async (szervezetId: string) => (await sql<{ id: string }>(
    `INSERT INTO poszt_munka (szervezet_id, cim, forras) VALUES ($1, 'Ilyen volt az első este', $2::jsonb) RETURNING id`,
    [szervezetId, JSON.stringify({ tipus: "sajat", azonosito: "", cim: "Ilyen volt az első este", url: "", szoveg: "Ilyen volt a Marosvásárhelyi Napok első estéje a Várban" })],
  ))[0]!.id;

  beforeAll(async () => {
    ({ s, sz } = await uj("Zilele Târgumureșene"));
    poszt = await posztUj(sz);
    const m = await uj("Szőcs Ștefan");
    masik = m.s;
    const nEmail = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Néző Nándor", email: nEmail, jelszo } })).statusz).toBe(201);
    const nId = (await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [nEmail]))[0]!.id;
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo')", [sz, nId]);
    nezo = `km_munkamenet=${sutiKinyer((await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: nEmail, jelszo } })).sutik, "km_munkamenet")}`;
    // 10 fotó, összekevert sorrendben feltöltve (a készítés ideje 21:00 + i perc)
    const sorrend = [3, 0, 7, 1, 9, 2, 8, 4, 6, 5];
    const tmp = new Map<number, string>();
    for (const [k, i] of sorrend.entries()) tmp.set(i, await feltolt(s, poszt, `Wellhello és Smiley – ziua 2-0${5395 + i}.jpg`, new Date(Date.UTC(2025, 5, 27, 18, i)).toISOString(), k));
    for (let i = 0; i < 10; i++) idk.push(tmp.get(i)!);
  }, 60_000);

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("a lista: 10 fotó a készítés ideje szerint, mindegyik a `kicsi` párjával; válogatás még nincs", async () => {
    const a = await allapot(s, poszt);
    expect(a.statusz).toBe(200);
    expect(a.torzs.fotok.map((f) => f.id)).toEqual(idk);
    expect(a.torzs.fotok.every((f) => !!f.kicsi_id)).toBe(true);
    expect(a.torzs.album).toBeNull();
    const l = await keres<{ fotok: AlbumFoto[] }>(`/api/album/foto?album=${poszt}`, { sutik: s });
    expect(l.torzs.fotok).toHaveLength(10);
  });

  it("néző nem indít válogatást (403); más munkatér a posztot nem látja (404)", async () => {
    expect((await keres(`/api/poszt/${poszt}/album`, { modszer: "POST", sutik: nezo, torzs: { felulet: "fb", nyelv: "hu" } })).statusz).toBe(403);
    expect((await allapot(masik, poszt)).statusz).toBe(404);
    expect((await keres(`/api/poszt/${poszt}/album`, { modszer: "POST", sutik: masik, torzs: { felulet: "fb", nyelv: "hu" } })).statusz).toBe(404);
  });

  it("a válogatás: 202 „fut”, a háttérben kész; a teszt-gép nem válaszol → tartalék (10 fotó, idő szerint); fajta „album”, a felirat kész", async () => {
    const r = await keres<{ album: PosztAlbum }>(`/api/poszt/${poszt}/album`, { modszer: "POST", sutik: s, torzs: { felulet: "fb", nyelv: "hu" } });
    expect(r.statusz).toBe(202);
    expect(r.torzs.album.allapot).toBe("fut");
    const a = await kesz(s, poszt);
    expect(a.album).toMatchObject({ allapot: "kesz", gep: "sorrend" });
    expect(a.album!.fotok.map((f) => f.fajl_id)).toEqual(idk);
    expect(a.munka.forras.poszt_tipus).toBe("album");
    expect(a.munka.szovegek.find((c) => c.felulet === "fb" && c.nyelv === "hu")?.szoveg.trim().length).toBeGreaterThan(0);
  }, 40_000);

  it("15 fotóból a tartalék 10-et választ, az első és az utolsó benne", async () => {
    const p2 = await posztUj(sz);
    const ids: string[] = [];
    for (let i = 0; i < 15; i++) ids.push(await feltolt(s, p2, `${i}.jpg`, new Date(Date.UTC(2025, 5, 28, 18, i)).toISOString(), 100 + i));
    await keres(`/api/poszt/${p2}/album`, { modszer: "POST", sutik: s, torzs: { felulet: "fb", nyelv: "hu" } });
    const v = (await kesz(s, p2)).album!.fotok.map((f) => f.fajl_id);
    expect(v).toHaveLength(10);
    expect(v[0]).toBe(ids[0]); expect(v[9]).toBe(ids[14]);
    expect(v.every((id, k) => k === 0 || ids.indexOf(id) > ids.indexOf(v[k - 1]!))).toBe(true);
  }, 60_000);

  it("a gép útja: a sorszámok a fotókra mutatnak, a leírással; 40 kép, „low” felbontás, „album_valogatas”", async () => {
    const { fotok } = (await allapot(s, poszt)).torzs;
    let kert: { mellekletek: unknown[]; max?: number; reszlet?: string; feladat: string } | null = null;
    const v = await valogat({ szervezetId: sz, id: poszt, felulet: "fb", nyelv: "hu", uiNyelv: "hu" }, fotok, async (_sz, be) => {
      kert = be;
      return '{"valasztott":[{"i":10,"leiras":"a Vár messziről"},{"i":2,"leiras":"tömeg a színpad előtt"},{"i":99}]}';
    });
    expect(v).toEqual({ gep: "ai", fotok: [{ fajl_id: idk[9], leiras: "a Vár messziről" }, { fajl_id: idk[1], leiras: "tömeg a színpad előtt" }] });
    expect(kert).toMatchObject({ feladat: "album_valogatas", max: 40, reszlet: "low" });
    expect(kert!.mellekletek).toHaveLength(10);
    const tartalek = await valogat({ szervezetId: sz, id: poszt, felulet: "fb", nyelv: "hu", uiNyelv: "hu" }, fotok, async () => null);
    expect(tartalek.gep).toBe("sorrend");
  });

  it("sorrend (D8c): Hátrébb az elsőnél → az első kettő helyet cserél; idegen fotóval 400", async () => {
    const uj = [idk[1]!, idk[0]!, ...idk.slice(2)];
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${poszt}/album`, { modszer: "PUT", sutik: s, torzs: { muvelet: "sorrend", fotok: uj } });
    expect(r.statusz).toBe(200);
    expect(r.torzs.munka.forras.album!.fotok.map((f) => f.fajl_id)).toEqual(uj);
    expect((await keres(`/api/poszt/${poszt}/album`, { modszer: "PUT", sutik: s, torzs: { muvelet: "sorrend", fotok: [...uj.slice(1), "00000000-0000-4000-8000-000000000000"] } })).statusz).toBe(400);
    expect((await keres(`/api/poszt/${poszt}/album`, { modszer: "PUT", sutik: nezo, torzs: { muvelet: "sorrend", fotok: uj } })).statusz).toBe(403);
  });

  it("Kiveszem: kikerül a posztból és a tárból a _torolni/ alá (a párjával), a kvóta felszabadul, a lista nem mutatja", async () => {
    const elotte = (await albumHasznalat(sz, poszt, new Date())).bajt;
    const ki = idk[4]!;
    const kicsi = (await allapot(s, poszt)).torzs.fotok.find((f) => f.id === ki)!.kicsi_id!;
    const r = await keres<{ munka: PosztMunka }>(`/api/poszt/${poszt}/album`, { modszer: "PUT", sutik: s, torzs: { muvelet: "kivesz", fajl_id: ki } });
    expect(r.statusz).toBe(200);
    expect(r.torzs.munka.forras.album!.fotok.map((f) => f.fajl_id)).not.toContain(ki);
    expect(r.torzs.munka.forras.album!.fotok).toHaveLength(9);
    for (const id of [ki, kicsi]) {
      expect(existsSync(join(albumMappa(), sz, `${id}.jpg`))).toBe(false);
      expect(existsSync(join(albumMappa(), "_torolni", sz, `${id}.jpg`))).toBe(true);
    }
    expect((await albumHasznalat(sz, poszt, new Date())).bajt).toBe(elotte - 230_000);
    expect((await allapot(s, poszt)).torzs.fotok.map((f) => f.id)).not.toContain(ki);
    expect((await keres(`/api/poszt/${poszt}/album`, { modszer: "PUT", sutik: s, torzs: { muvelet: "kivesz", fajl_id: ki } })).statusz).toBe(404);
  });

  it("D7 + F10: a posztban használt fotó a használat szerint marad; a nem használt a feltöltés után 30 nappal megy", async () => {
    // a feltöltés ideje 40 nappal korábbra: a használat nélküli szabály szerint mind menne
    await sql("UPDATE arculat_fajl SET feltoltve = now() - interval '40 days' WHERE szervezet_id = $1 AND elemzes->>'album' = $2", [sz, poszt]);
    const jel = await albumHasznalatPosztokbol(sz);
    const elso = (await allapot(s, poszt)).torzs.album!.fotok[0]!.fajl_id;
    expect(jel.get(elso)?.hasznalva).toBeTruthy();
    expect(jel.get(elso)?.kitettem).toBeNull();
    await albumKoltoztet(new Date(Date.now() + 1 * NAP), albumHasznalatPosztokbol);
    expect(existsSync(join(albumMappa(), sz, `${elso}.jpg`))).toBe(true); // a poszt ma változott: marad
    await albumKoltoztet(new Date(Date.now() + 1 * NAP));
    expect(existsSync(join(albumMappa(), sz, `${elso}.jpg`))).toBe(false); // használat nélkül: 40 nap → megy
  });
});
