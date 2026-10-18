// Csilla 2026-10-10: az arculati/szervezeti fájl korlátja 10 MB → 100 MB; a betűé és a posztképé 10 MB marad. A törzs darabonként
// lemezre megy (apps/web/fajl/beolvas.ts), nem a memóriába. Valódi kiszolgálóval (PROBA_CIM) és adatbázissal (DATABASE_URL):
//  · 3 MB és 99 MB PDF → 201, a letöltés ugyanannyi bájt (folyamként), a bájtok egyeznek;
//  · 101 MB → 413 TUL_NAGY (a barátságos hibakód) — content-length-tel ÉS anélkül (darabolt küldés: a futó számláló állítja meg);
//  · SVG → 415 SVG_NEM_ENGEDETT; betű 11 MB → 413; posztkép 11 MB → 413 (a 10 MB marad);
//  · néző nem tölthet fel (403); más munkatér a fájlt nem látja (404) — a munkatér-elválasztás változatlan (A-11);
//  · a feltöltés után nem marad ideiglenes fájl (ha a próba látja a FAJL_MAPPA-t).
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PROBA_CIM, keres, lezar, sql, sutiKinyer, takaritas, veletlenEmail } from "./segedek";

const MB = 1024 * 1024;
const jelszo = "ProbaJelszo123!";
const ip = () => `198.51.100.${Math.floor(Math.random() * 254) + 1}`;

function pdf(meret: number): Uint8Array {
  const b = new Uint8Array(meret);
  b.set(new TextEncoder().encode("%PDF-1.4\n% Kövesi Térkő – árjegyzék ő ű ș ț\n"));
  for (let i = 64; i < meret; i += 4096) b[i] = i % 251; // nem csupa nulla
  return b;
}

async function feltolt(sutik: string, nev: string, cel: string, test: Uint8Array | ReadableStream<Uint8Array>, ut = "/api/arculat/fajl") {
  const v = await fetch(`${PROBA_CIM}${ut}`, {
    method: "POST",
    body: test instanceof Uint8Array ? (test.slice().buffer as ArrayBuffer) : test,
    headers: { cookie: `${sutik}; km_nyelv=hu`, "x-fajl-nev": encodeURIComponent(nev), "x-fajl-cel": cel, "content-type": "application/octet-stream", "x-forwarded-for": ip() },
    ...(test instanceof Uint8Array ? {} : { duplex: "half" }),
  } as RequestInit);
  const szoveg = await v.text();
  let torzs: { hiba?: string; fajl?: { id: string; meret: number; tipus: string } } = {};
  try { torzs = JSON.parse(szoveg); } catch { /* a 413 törzs nélkül is jöhet egy proxytól — itt nincs proxy */ }
  return { statusz: v.status, torzs };
}

/** Darabolt (content-length nélküli) törzs: `osszes` bájt 1 MB-os darabokban, PDF-fejjel. */
function folyam(osszes: number): ReadableStream<Uint8Array> {
  let kuldott = 0;
  return new ReadableStream<Uint8Array>({
    pull(c) {
      if (kuldott >= osszes) { c.close(); return; }
      const n = Math.min(MB, osszes - kuldott);
      c.enqueue(kuldott === 0 ? pdf(n) : new Uint8Array(n));
      kuldott += n;
    },
  });
}

function ideiglenesek(): string[] | null {
  const m = process.env.FAJL_MAPPA;
  if (!m) return null;
  const d = join(m, "_feltoltes");
  return existsSync(d) ? readdirSync(d) : [];
}

describe("100 MB-os arculati fájl, lemezre írva (Csilla 2026-10-10)", () => {
  let sutik: string;
  let masikSutik: string;
  let nezoSutik: string;

  async function uj(nev: string): Promise<{ sutik: string; szervezetId: string }> {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev, email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    const s = `km_munkamenet=${sutiKinyer(b.sutik, "km_munkamenet")}`;
    const sz = await keres<{ id: string }>("/api/szervezet", { modszer: "POST", torzs: { nev: `${nev} Kft.` }, sutik: s });
    expect(sz.statusz).toBe(201);
    return { sutik: s, szervezetId: sz.torzs.id };
  }

  beforeAll(async () => {
    const a = await uj("Kövesi Tibor");
    sutik = a.sutik;
    masikSutik = (await uj("Szőcs Ștefan")).sutik;
    const nEmail = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Néző Nándor", email: nEmail, jelszo } })).statusz).toBe(201);
    const nId = (await sql<{ id: string }>("SELECT id FROM fiok WHERE email = $1", [nEmail]))[0]!.id;
    await sql("INSERT INTO tagsag (szervezet_id, fiok_id, szerep) VALUES ($1, $2, 'nezo')", [a.szervezetId, nId]);
    const nb = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email: nEmail, jelszo } });
    nezoSutik = `km_munkamenet=${sutiKinyer(nb.sutik, "km_munkamenet")}`;
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("3 MB PDF → 201, a letöltés ugyanaz a bájtsor", async () => {
    const b = pdf(3 * MB);
    const v = await feltolt(sutik, "Kövesi Térkő – árjegyzék 2026.pdf", "dokumentum", b);
    expect(v.statusz).toBe(201);
    expect(v.torzs.fajl).toMatchObject({ tipus: "pdf", meret: 3 * MB });
    const l = await fetch(`${PROBA_CIM}/api/arculat/fajl/${v.torzs.fajl!.id}`, { headers: { cookie: sutik } });
    expect(l.status).toBe(200);
    expect(l.headers.get("content-length")).toBe(String(3 * MB));
    expect(Buffer.from(await l.arrayBuffer()).equals(Buffer.from(b))).toBe(true);
  });

  // G4 (Rögtön, 2026-10-18): az arculati fájl korlátja 95 MB (a Cloudflare peremének ~100 MB-os korlátja alatt) — a határpróbák 94 MB / 96 MB-ra kerültek, ugyanazzal a jelentéssel.
  it("94 MB PDF → 201 (kézikönyv), a letöltött méret egyezik, ideiglenes fájl nem marad", async () => {
    const v = await feltolt(sutik, "Arculati kézikönyv, végleges ő ű.pdf", "kezikonyv", pdf(94 * MB));
    expect(v.statusz).toBe(201);
    expect(v.torzs.fajl).toMatchObject({ tipus: "pdf", meret: 94 * MB });
    const l = await fetch(`${PROBA_CIM}/api/arculat/fajl/${v.torzs.fajl!.id}`, { headers: { cookie: sutik } });
    expect(l.status).toBe(200);
    expect((await l.arrayBuffer()).byteLength).toBe(94 * MB);
    const m = ideiglenesek();
    if (m) expect(m).toEqual([]);
  }, 120_000);

  it("101 MB → 413 TUL_NAGY (content-length-tel)", async () => {
    const v = await feltolt(sutik, "túl nagy.pdf", "dokumentum", pdf(101 * MB));
    expect(v.statusz).toBe(413);
    expect(v.torzs.hiba).toBe("TUL_NAGY");
  }, 120_000);

  it("101 MB darabolva (content-length nélkül) → 413 TUL_NAGY, a futó számláló állítja meg; nem marad ideiglenes fájl", async () => {
    const v = await feltolt(sutik, "túl nagy, darabolt.pdf", "dokumentum", folyam(101 * MB));
    expect(v.statusz).toBe(413);
    expect(v.torzs.hiba).toBe("TUL_NAGY");
    const m = ideiglenesek();
    if (m) expect(m).toEqual([]);
  }, 120_000);

  it("SVG → 415 SVG_NEM_ENGEDETT (a tartalom szerinti típus-ellenőrzés marad)", async () => {
    const v = await feltolt(sutik, "logo.svg", "logo", new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'));
    expect(v.statusz).toBe(415);
    expect(v.torzs.hiba).toBe("SVG_NEM_ENGEDETT");
  });

  it("a betű és a posztkép korlátja 10 MB marad: 11 MB → 413", async () => {
    expect((await feltolt(sutik, "nagy.ttf", "betu", pdf(11 * MB))).statusz).toBe(413);
    const kep = new Uint8Array(11 * MB);
    kep.set([0xff, 0xd8, 0xff, 0xe0]);
    const v = await fetch(`${PROBA_CIM}/api/r15/kep`, {
      method: "POST", body: kep.slice().buffer as ArrayBuffer,
      headers: { cookie: `${sutik}; km_nyelv=hu`, "x-fajl-nev": "nagy.jpg", "content-type": "application/octet-stream", "x-forwarded-for": ip() },
    });
    expect(v.status).toBe(413);
    expect(((await v.json()) as { hiba: string }).hiba).toBe("TUL_NAGY");
  });

  it("néző nem tölthet fel (403); más munkatér nem látja a fájlt (404) — A-11 változatlan", async () => {
    expect((await feltolt(nezoSutik, "n.pdf", "dokumentum", pdf(1000))).statusz).toBe(403);
    const v = await feltolt(sutik, "csak az enyém.pdf", "dokumentum", pdf(2000));
    expect(v.statusz).toBe(201);
    const l = await fetch(`${PROBA_CIM}/api/arculat/fajl/${v.torzs.fajl!.id}`, { headers: { cookie: masikSutik } });
    expect(l.status).toBe(404);
    const lista = await keres<{ fajl: { id: string }[] }>("/api/arculat/fajl", { sutik: masikSutik });
    expect(lista.torzs.fajl.some((f) => f.id === v.torzs.fajl!.id)).toBe(false);
  });
});
