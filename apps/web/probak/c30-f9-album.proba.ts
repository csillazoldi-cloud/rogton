// c30 F9 — a fotóalbum tárolója (FESZTIVAL-ES-NYELVI-MOD-TERV §1.5, §6, §10 F9; D7: 30 nap, mentés nélkül). Valódi kiszolgálóval
// (PROBA_CIM), adatbázissal (DATABASE_URL) és a kiszolgálóval KÖZÖS album mappával (ALBUM_MAPPA; ha nincs megadva, mindkét oldalon a
// FAJL_MAPPA `_album` almappája — apps/web/fajl/tar.ts `albumMappa`, így a robot régi kapuja alatt is ugyanazt a mappát látjuk):
//  · 2048 px-es JPEG + a 512 px-es párja → 201, a bájtok az ALBUM_MAPPA alatt, NEM a FAJL_MAPPA alatt (a mentés azt viszi);
//  · 2,6 MB → 413 · PNG → 415 · 4000 px → 413 · a `kicsi` 600 px → 413 · néző → 403 · más munkatér fájlja → 404 (A-11);
//  · kvóta (500 MB) → 413 ALBUM_MEGTELT · 60 fotó / 10 perc → 429 TUL_SOK_FELTOLTES (a `kicsi` pár ezen felül is jöhet) · 40 / album → 409;
//  · a ZIP: a kért sorrend, „01-…” nevek, ép CRC, a bájtok egyeznek; más munkatér id-je → 404;
//  · a 30 napos költöztetés: 29 napnál semmi, 31 napnál a fájlok a _torolni/ alá, a sor `kiveve`-t kap, a letöltés 404, a kvóta felszabadul.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crc32 } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { albumHasznalat, albumKoltoztet } from "../album";
import { albumMappa as albumMappaKi } from "../fajl/tar";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const MB = 1024 * 1024;
const NAP = 24 * 60 * 60 * 1000;
const jelszo = "ProbaJelszo123!";
const ip = () => `198.51.100.${Math.floor(Math.random() * 254) + 1}`;
// c30 F10 (Csilla 10-17, döntés 2): az album kulcsa a munkatér egy POSZTJÁNAK id-je — a feltöltő végpont a posztot is ellenőrzi (más / nem
// létező poszt → 404). Ezért a próba munkaterenként egy posztot nyit, és a fotók annak az albumába mennek (az F9-ben szabad szöveg volt).
const posztok = new Map<string, string>();
async function posztUj(szervezetId: string): Promise<string> {
  const r = await sql<{ id: string }>(
    `INSERT INTO poszt_munka (szervezet_id, cim, forras) VALUES ($1, 'Fotóalbum – Zilele Târgumureșene', $2::jsonb) RETURNING id`,
    [szervezetId, JSON.stringify({ tipus: "sajat", azonosito: "", cim: "Fotóalbum", url: "", szoveg: "Fotóalbum" })],
  );
  return r[0]!.id;
}

/** Szintetikus JPEG valódi fejléccel (SOI, 4 kB EXIF, SOF0, SOS, kitöltés, EOI) — a kiszolgáló nem dekódol, csak a fejlécet olvassa. */
function jpeg(szel: number, mag: number, meret = 300_000): Uint8Array {
  const fej = Uint8Array.from([
    0xff, 0xd8, 0xff, 0xe1, 0x0f, 0xa2, ...new Array(4000).fill(0x45),
    0xff, 0xc0, 0x00, 0x11, 0x08, mag >> 8, mag & 0xff, szel >> 8, szel & 0xff, 0x03, ...new Array(9).fill(1),
    0xff, 0xda, 0x00, 0x0c, ...new Array(10).fill(0),
  ]);
  const b = new Uint8Array(meret);
  b.set(fej, 0);
  for (let i = fej.length; i < meret - 2; i++) b[i] = (i * 31 + szel) % 251 || 1;
  b[meret - 2] = 0xff; b[meret - 1] = 0xd9;
  return b;
}

type Valasz = { statusz: number; torzs: { hiba?: string; mezok?: Record<string, string>; fajl?: { id: string; meret: number; tipus: string; cel: string; elemzes?: Record<string, unknown> } | { id: string; cel: string }[] } };

async function foto(sutik: string, nev: string, b: Uint8Array, o: { album?: string; par?: string; keszult?: string } = {}): Promise<Valasz & { id: string }> {
  const v = await fetch(`${PROBA_CIM}/api/album/foto`, {
    method: "POST",
    body: b.slice().buffer as ArrayBuffer,
    headers: {
      cookie: `${sutik}; km_nyelv=hu`, "x-fajl-nev": encodeURIComponent(nev), "x-album": o.album ?? posztok.get(sutik) ?? "", "content-type": "application/octet-stream",
      "x-forwarded-for": ip(), ...(o.par ? { "x-album-par": o.par } : {}), ...(o.keszult ? { "x-keszult": o.keszult } : {}),
    },
  });
  const torzs = (await v.json().catch(() => ({}))) as Valasz["torzs"];
  const f = torzs.fajl as { id?: string } | undefined;
  return { statusz: v.status, torzs, id: f?.id ?? "" };
}

/** Egy ZIP kicsomagolása — saját, független olvasóval (a vég → a központi jegyzék → a helyi fejlécek), a CRC a node:zlib-é. */
function zipOlvas(z: Buffer): { nev: string; bajtok: Buffer; crcJo: boolean; modszer: number }[] {
  const veg = z.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(veg).toBeGreaterThan(0);
  const db = z.readUInt16LE(veg + 10);
  let p = z.readUInt32LE(veg + 16);
  const ki: { nev: string; bajtok: Buffer; crcJo: boolean; modszer: number }[] = [];
  for (let i = 0; i < db; i++) {
    expect(z.readUInt32LE(p)).toBe(0x02014b50);
    const modszer = z.readUInt16LE(p + 10), crc = z.readUInt32LE(p + 16), meret = z.readUInt32LE(p + 24);
    const nevH = z.readUInt16LE(p + 28), extraH = z.readUInt16LE(p + 30), megjH = z.readUInt16LE(p + 32), helyi = z.readUInt32LE(p + 42);
    const nev = z.subarray(p + 46, p + 46 + nevH).toString("utf8");
    expect(z.readUInt32LE(helyi)).toBe(0x04034b50);
    const adat = helyi + 30 + z.readUInt16LE(helyi + 26) + z.readUInt16LE(helyi + 28);
    const bajtok = z.subarray(adat, adat + meret);
    ki.push({ nev, bajtok, crcJo: crc32(bajtok) === crc, modszer });
    p += 46 + nevH + extraH + megjH;
  }
  return ki;
}

describe("c30 F9 — a fotóalbum tárolója", () => {
  const A: { sutik: string; id: string } = { sutik: "", id: "" };
  const B: { sutik: string; id: string } = { sutik: "", id: "" };
  let nezoSutik = "";
  let nagyId = "";
  let kicsiId = "";
  const zipIdk: string[] = [];
  const albumMappa = albumMappaKi();
  const fajlMappa = process.env.FAJL_MAPPA ?? "";

  async function uj(nev: string): Promise<{ sutik: string; id: string }> {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: `${nev} Egyesület` }, sutik: s });
    expect(sz.statusz).toBe(201);
    const poszt = await posztUj(sz.torzs.id);
    posztok.set(s, poszt);
    posztok.set(sz.torzs.id, poszt);
    return { sutik: s, id: sz.torzs.id };
  }

  /** Albumsorok közvetlenül (a kvóta és a sebesség próbájához — 500 MB-ot nem töltünk fel). */
  async function sorok(szervezetId: string, n: number, o: { meret?: number; album?: string; perccel?: number }): Promise<string[]> {
    const r = await sql<{ id: string }>(
      `INSERT INTO arculat_fajl (szervezet_id, nev, tipus, meret, cel, feltoltve, eredet, elemzes)
       SELECT $1, 'Fotó ' || g || ' – Târgu Mureș.jpg', 'jpg', $2, 'album', now() - make_interval(mins => $3), 'feltoltes',
              jsonb_build_object('album', $4::text, 'kicsi', false)
       FROM generate_series(1, $5) g RETURNING id`,
      [szervezetId, o.meret ?? 500_000, o.perccel ?? 0, o.album ?? posztok.get(szervezetId), n],
    );
    return r.map((x) => x.id);
  }

  beforeAll(async () => {
    expect(process.env.ALBUM_MAPPA || fajlMappa, "a próba a kiszolgálóval közös ALBUM_MAPPA-t vagy FAJL_MAPPA-t kér").not.toBe("");
    Object.assign(A, await uj("Zilele Târgumureșene Fesztivál"));
    Object.assign(B, await uj("Szőcs Ștefan"));
    const nEmail = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Néző Nándor", email: nEmail, jelszo } })).statusz).toBe(201);
    const nId = (await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [nEmail]))[0]!.id;
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo')", [A.id, nId]);
    const nb = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: nEmail, jelszo } });
    nezoSutik = `km_munkamenet=${sutiKinyer(nb.sutik, "km_munkamenet")}`;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("a 2048 px-es fotó és a 512 px-es párja bejön; a bájtok az ALBUM_MAPPA alatt vannak, a FAJL_MAPPA alatt nem", async () => {
    const n = await foto(A.sutik, "Wellhello és Smiley – Zilele Târgumureșene 2025, ziua 2-05395.jpg", jpeg(2048, 1365, 1.2 * MB | 0), { keszult: "2025-06-27T19:41:00+03:00" });
    expect(n.statusz).toBe(201);
    const f = n.torzs.fajl as { cel: string; tipus: string; elemzes: Record<string, unknown> };
    expect(f).toMatchObject({ cel: "album", tipus: "jpg" });
    expect(f.elemzes).toEqual({ album: posztok.get(A.id), kicsi: false, keszult: "2025-06-27T16:41:00.000Z" });
    nagyId = n.id;
    const k = await foto(A.sutik, "Wellhello és Smiley – kicsi.jpg", jpeg(512, 341, 40_000), { par: nagyId });
    expect(k.statusz).toBe(201);
    expect((k.torzs.fajl as { elemzes: unknown }).elemzes).toEqual({ album: posztok.get(A.id), kicsi: true, par: nagyId });
    kicsiId = k.id;
    expect(existsSync(join(albumMappa, A.id, `${nagyId}.jpg`))).toBe(true);
    expect(existsSync(join(albumMappa, A.id, `${kicsiId}.jpg`))).toBe(true);
    if (fajlMappa) expect(existsSync(join(fajlMappa, A.id, `${nagyId}.jpg`))).toBe(false);
    // a saját munkatér letöltheti (hitelesítve), és a cél nélküli „Fájlok” lista nem mutatja
    const l = await fetch(`${PROBA_CIM}/api/arculat/fajl/${nagyId}`, { headers: { cookie: A.sutik } });
    expect(l.status).toBe(200);
    expect((await l.arrayBuffer()).byteLength).toBe(1.2 * MB | 0);
    const lista = await keres<{ fajl: { id: string }[] }>("/api/arculat/fajl", { sutik: A.sutik });
    expect(lista.torzs.fajl.map((x) => x.id)).not.toContain(nagyId);
  });

  it("elutasítva: 2,6 MB (413), PNG (415), 4000 px (413), a `kicsi` 600 px (413), rossz album-kulcs (400), album a régi végponton (400)", async () => {
    expect((await foto(A.sutik, "nagy.jpg", jpeg(2048, 1365, Math.round(2.6 * MB)))).torzs.hiba).toBe("TUL_NAGY");
    const png = new Uint8Array(5000); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const p = await foto(A.sutik, "kép.png", png);
    expect([p.statusz, p.torzs.hiba]).toEqual([415, "TIPUS_NEM_ENGEDETT"]);
    const e = await foto(A.sutik, "eredeti, kicsinyítés nélkül.jpg", jpeg(4000, 3000, 2 * MB));
    expect([e.statusz, e.torzs.hiba]).toEqual([413, "TUL_NAGY"]);
    const k = await foto(A.sutik, "kicsi.jpg", jpeg(600, 400, 50_000), { par: nagyId });
    expect([k.statusz, k.torzs.hiba]).toEqual([413, "TUL_NAGY"]);
    expect((await foto(A.sutik, "a.jpg", jpeg(800, 600), { album: "../../etc" })).statusz).toBe(400);
    // c30 F10: az album kulcsa a munkatér saját posztja — nem létező (vagy más munkatér) posztja → 404
    expect((await foto(A.sutik, "a.jpg", jpeg(800, 600), { album: "00000000-0000-4000-8000-000000000000" })).statusz).toBe(404);
    expect((await foto(A.sutik, "a.jpg", jpeg(800, 600), { album: posztok.get(B.id)! })).statusz).toBe(404);
    const regi = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST", body: jpeg(800, 600).slice().buffer as ArrayBuffer,
      headers: { cookie: A.sutik, "x-fajl-nev": "a.jpg", "x-fajl-cel": "album", "content-type": "application/octet-stream", "x-forwarded-for": ip() },
    });
    expect(regi.status).toBe(400);
  });

  it("néző nem tölthet fel (403); más munkatér nem látja a fotót (404), és a párjára sem hivatkozhat (404)", async () => {
    expect((await foto(nezoSutik, "néző.jpg", jpeg(800, 600))).statusz).toBe(403);
    expect((await fetch(`${PROBA_CIM}/api/arculat/fajl/${nagyId}`, { headers: { cookie: B.sutik } })).status).toBe(404);
    expect((await fetch(`${PROBA_CIM}/api/album/zip?fotok=${nagyId}`, { headers: { cookie: B.sutik } })).status).toBe(404);
    expect((await foto(B.sutik, "kicsi.jpg", jpeg(512, 341, 30_000), { par: nagyId })).statusz).toBe(404);
    expect((await fetch(`${PROBA_CIM}/api/album/zip?fotok=${nagyId}`)).status).toBe(401);
  });

  it("a kvóta: 500 MB fölött 413 ALBUM_MEGTELT", async () => {
    const C = await uj("Kvóta Kata");
    await sorok(C.id, 1, { meret: 500 * MB - MB, perccel: 120 });
    const v = await foto(C.sutik, "még egy.jpg", jpeg(2048, 1365, 1.2 * MB | 0));
    expect([v.statusz, v.torzs.hiba]).toEqual([413, "ALBUM_MEGTELT"]);
    expect((await foto(C.sutik, "kicsi elfér.jpg", jpeg(512, 341, 200_000))).statusz).toBe(201);
  });

  it("a sebesség: 60 fotó / 10 perc fölött 429 (a várakozás percben); a `kicsi` pár ilyenkor is jöhet", async () => {
    const D = await uj("Gyors Gábor");
    const idk = await sorok(D.id, 60, { perccel: 2 });
    const v = await foto(D.sutik, "61.jpg", jpeg(2048, 1365));
    expect([v.statusz, v.torzs.hiba]).toEqual([429, "TUL_SOK_FELTOLTES"]);
    expect(Number(v.torzs.mezok?.ujra_perc)).toBeGreaterThanOrEqual(1);
    expect(Number(v.torzs.mezok?.ujra_perc)).toBeLessThanOrEqual(10);
    expect((await foto(D.sutik, "kicsi.jpg", jpeg(512, 341, 30_000), { par: idk[0]! })).statusz).toBe(201);
  });

  it("40 fotó / album: a 41. 409 ALBUM_TELE, másik albumba még megy", async () => {
    const E = await uj("Teli Tímea");
    const [nap1, nap2] = [await posztUj(E.id), await posztUj(E.id)];
    await sorok(E.id, 40, { perccel: 60, album: nap1 });
    const v = await foto(E.sutik, "41.jpg", jpeg(2048, 1365), { album: nap1 });
    expect([v.statusz, v.torzs.hiba]).toEqual([409, "ALBUM_TELE"]);
    expect((await foto(E.sutik, "másik nap.jpg", jpeg(2048, 1365), { album: nap2 })).statusz).toBe(201);
  });

  it("a ZIP: a kért sorrend, „01-…” nevek ékezettel, store módszer, ép CRC, a bájtok egyeznek; a néző is letöltheti", async () => {
    const nevek = ["Színpad – nagytotál.jpg", "Közönség, Piața Trandafirilor.jpg", "Bontás után.jpg"];
    const bajtok: Uint8Array[] = [];
    for (const [i, nev] of nevek.entries()) {
      const b = jpeg(2048, 1365, 200_000 + i * 1000);
      const v = await foto(A.sutik, nev, b);
      expect(v.statusz).toBe(201);
      zipIdk.push(v.id); bajtok.push(b);
    }
    const sorrend = [2, 0, 1];
    const z = await fetch(`${PROBA_CIM}/api/album/zip?fotok=${sorrend.map((i) => zipIdk[i]).join(",")}`, { headers: { cookie: nezoSutik } });
    expect(z.status).toBe(200);
    expect(z.headers.get("content-type")).toBe("application/zip");
    const buf = Buffer.from(await z.arrayBuffer());
    expect(z.headers.get("content-length")).toBe(String(buf.length));
    const t = zipOlvas(buf);
    expect(t.map((x) => x.nev)).toEqual(["01-Bontás után.jpg", "02-Színpad – nagytotál.jpg", "03-Közönség, Piața Trandafirilor.jpg"]);
    expect(t.every((x) => x.crcJo && x.modszer === 0)).toBe(true);
    sorrend.forEach((i, j) => expect(t[j]!.bajtok.equals(Buffer.from(bajtok[i]!))).toBe(true));
    expect((await fetch(`${PROBA_CIM}/api/album/zip?fotok=nem-uuid`, { headers: { cookie: A.sutik } })).status).toBe(400);
  });

  it("D7, 30 nap: 29 napnál marad; 31 napnál a fájlok (a párral együtt) a _torolni/ alá, a sor `kiveve`, a letöltés 404, a kvóta felszabadul", async () => {
    // A költöztetést a próba folyamata futtatja (nincs rá végpont). A fájlokat is a próba írja a saját munkaterébe: a kapu docker-módjában
    // a kiszolgáló (a doboz `node` felhasználója) írta mappát a próba felhasználója nem biztos, hogy átnevezheti — a munkatérenkénti hiba
    // a többit nem állítja meg (`hibas`), ezért a mérés a SAJÁT munkatéren történik.
    const G = await uj("Költöző Kornélia");
    const [nagy] = await sorok(G.id, 1, { meret: 300_000 });
    const [kicsi] = (await sql<{ id: string }>(
      `INSERT INTO arculat_fajl (szervezet_id, nev, tipus, meret, cel, eredet, elemzes)
       VALUES ($1, 'Piața Trandafirilor – kicsi.jpg', 'jpg', 40000, 'album', 'feltoltes', jsonb_build_object('album', $2::text, 'kicsi', true, 'par', $3::text))
       RETURNING id`, [G.id, posztok.get(G.id), nagy])).map((x) => x.id);
    mkdirSync(join(albumMappa, G.id), { recursive: true });
    writeFileSync(join(albumMappa, G.id, `${nagy}.jpg`), jpeg(2048, 1365, 300_000));
    writeFileSync(join(albumMappa, G.id, `${kicsi}.jpg`), jpeg(512, 341, 40_000));
    expect((await fetch(`${PROBA_CIM}/api/arculat/fajl/${nagy}`, { headers: { cookie: G.sutik } })).status).toBe(200);
    expect((await albumHasznalat(G.id, posztok.get(G.id)!, new Date())).bajt).toBe(340_000);

    await albumKoltoztet(new Date(Date.now() + 29 * NAP));
    expect(existsSync(join(albumMappa, G.id, `${nagy}.jpg`))).toBe(true);

    await albumKoltoztet(new Date(Date.now() + 31 * NAP));
    for (const id of [nagy!, kicsi!]) {
      expect(existsSync(join(albumMappa, G.id, `${id}.jpg`))).toBe(false);
      expect(existsSync(join(albumMappa, "_torolni", G.id, `${id}.jpg`))).toBe(true);
    }
    const s = await sql<{ n: number }>("SELECT count(*)::int AS n FROM arculat_fajl WHERE szervezet_id = $1 AND cel = 'album' AND elemzes->>'kiveve' IS NOT NULL", [G.id]);
    expect(s[0]!.n).toBe(2);
    expect((await fetch(`${PROBA_CIM}/api/arculat/fajl/${nagy}`, { headers: { cookie: G.sutik } })).status).toBe(404);
    expect((await fetch(`${PROBA_CIM}/api/album/zip?fotok=${nagy}`, { headers: { cookie: G.sutik } })).status).toBe(404);
    expect((await albumHasznalat(G.id, posztok.get(G.id)!, new Date())).bajt).toBe(0);
    // ismételhető: a második kör már semmit nem mozgat ennél a munkatérnél, és a _torolni/ mappát nem nézi munkatérnek
    await albumKoltoztet(new Date(Date.now() + 31 * NAP));
    expect(readdirSync(join(albumMappa, "_torolni", G.id)).sort()).toEqual([`${nagy}.jpg`, `${kicsi}.jpg`].sort());
  });
});
