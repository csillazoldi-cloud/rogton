// A képgyártó: recept + arculat + tartalom → kép (PNG), mérés, illesztés, szabályellenőrzés.
// A képgyártó gépén fut (a terméktulajdonos döntése, V-6), a NAS-on futó munkatér HTTP-n kéri tőle a képet.
// Egy böngésző, egy lap, EGYSZERRE EGY kép — a kérések sorban várnak. Minden kép ugyanazzal a
// kirajzolóval készül, ezért az előnézet és a letöltés képpontra azonos.
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright-core";
import {
  Marka,
  Recept,
  Tartalom,
  illeszt,
  mezoOsszegzes,
  ellenoriz,
  szabalyCsalad,
  MERO_SZKRIPT,
  meresOsszeallit,
  ELLENORZOK,
  NEM_DONTHETO,
  type Szabaly,
  HELYZETEK,
  MERETEK,
  HelyzetArculat,
  HelyzetTartalom,
  MINTA,
  HELYZET_MERO,
  helyzetIllesztes,
  type Helyzet,
  type Meret,
  type HelyzetMeres,
  valtozatok,
  type Valtozat,
  NevlogoKeres,
} from "@rogton/vizual-core";
import { nevlogoValtozatok, pngLap, type NevlogoKimenet } from "./nevlogo.ts";
import { svgPngKeres, svgPngLap } from "./svg-png.ts";
import { mintaFotoAdat, mintaFotoval, mintaKategoria } from "./minta-foto.ts";

const itt = dirname(fileURLToPath(import.meta.url));
const GYOKER = process.env["KEPGYAR_GYOKER"] ?? join(itt, "../../..");
const RECEPTEK = join(GYOKER, "packages/vizual-receptek/receptek");
const REF = join(GYOKER, "tools/vizual/referencia");
const PORT = Number(process.env["PORT"] ?? 8601);
const CHROME = process.env["CHROMIUM"]; // üresen: a Playwright saját Chromiuma

// Az 1. körben minden munkatér a próba-arculatot kapja (a saját arculat a 3. kör).
const marka = Marka.parse(JSON.parse(readFileSync(join(REF, "marka-transportlocal.json"), "utf8")));
const receptek = new Map<string, Recept>();
for (const f of readdirSync(RECEPTEK).filter((x) => x.endsWith(".json"))) {
  const r = Recept.parse(JSON.parse(readFileSync(join(RECEPTEK, f), "utf8")));
  receptek.set(r.recept.azonosito, r);
}
const szabalyok = (JSON.parse(readFileSync(join(GYOKER, "packages/vizual-receptek/szabalyok.json"), "utf8")) as { szabalyok: Szabaly[] }).szabalyok;
// A lap about:blank-ből töltődik (setContent) — onnan a file:// betű NEM tölthető (mérve 2026-09-24: „error”,
// a böngésző tartalék betűjével rajzolt). Ezért a betűfájl adat-URL-ként megy a lapra; egyszer olvassuk be.
const betuTar = new Map<string, string>();
const adatUrl = (ut: string) => {
  let v = betuTar.get(ut);
  if (!v) betuTar.set(ut, (v = "data:font/woff2;base64," + readFileSync(ut).toString("base64")));
  return v;
};
const betuCim = (f: string) => adatUrl(join(REF, "betuk", f));
const munkaterBetu = (f: string) => adatUrl(join(REF, "betuk-munkater", f));

let bongeszo: Browser | null = null;
let lap: Page | null = null;
async function lapKell(): Promise<Page> {
  if (!bongeszo || !bongeszo.isConnected()) {
    bongeszo = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
    lap = null;
  }
  if (!lap || lap.isClosed()) lap = await bongeszo.newPage({ viewport: { width: 1080, height: 1350 } });
  return lap;
}

// egyszerre egy munka
let sor: Promise<unknown> = Promise.resolve();
function sorban<T>(f: () => Promise<T>): Promise<T> {
  const k = sor.then(f, f);
  sor = k.catch(() => undefined);
  return k;
}

async function keszit(receptId: string, nyersTartalom: unknown) {
  const recept = receptek.get(receptId);
  if (!recept) return { hiba: "ISMERETLEN_SABLON" as const };
  const t = Tartalom.safeParse({ recept: receptId, formatum: { szelesseg: 1080, magassag: 1350 }, ...(nyersTartalom as object) });
  if (!t.success) return { hiba: "ERVENYTELEN_TARTALOM" as const, reszlet: t.error.issues.map((i) => i.path.join(".") + ": " + i.message) };
  return sorban(async () => {
    const p = await lapKell();
    await p.setViewportSize({ width: 1080, height: 1350 });
    const mero = {
      async mer(html: string) {
        await p.setContent(html, { waitUntil: "load" });
        await p.evaluate(() => document.fonts.ready);
        return meresOsszeallit((await p.evaluate(MERO_SZKRIPT)) as Parameters<typeof meresOsszeallit>[0], marka.betuk);
      },
    };
    const e = await illeszt(marka, recept, t.data, mero, { betuCim });
    const png = await p.screenshot({ clip: { x: 0, y: 0, width: 1080, height: 1350 }, type: "png" });
    const ell = ellenoriz(
      szabalyok,
      {
        meres: e.meres,
        formatum: "feed45",
        parameter: (n) => marka.szabaly_parameterek[n],
        kitoltott: Object.keys(t.data.mezok),
        receptCsalad: szabalyCsalad(String((recept.recept as Record<string, unknown>)["csalad"] ?? "")),
      },
      ELLENORZOK,
      NEM_DONTHETO,
    );
    // Az arculatból eredő jelzés (a sablon saját mintatartalmán is ott van) nem a munkatárs hibája, és nem is tud
    // rajta javítani: látszik, de a letöltést nem tiltja. A tartalomból eredő tiltás tilt.
    const alap = arculatiJelzesek.get(receptId);
    const jelzesek = ell.talalatok.map((j) => ({ ...j, arculati: alap?.has(`${j.szabaly}|${j.mezo ?? ""}`) ?? false }));
    return {
      kep: png.toString("base64"),
      mezok: mezoOsszegzes(marka, recept, e),
      lepesek: e.lepesAdat,
      problemak: e.problemak,
      kepalairas: e.osszeallitas.kepalairas,
      hibak: e.osszeallitas.hibak,
      jelzesek,
      tiltott: e.problemak.length > 0 || jelzesek.some((j) => j.szigorusag === "tiltas" && !j.arculati),
      arculat: { nev: marka.nev, verzio: marka.verzio },
    };
  });
}

/** A sablonok a szerkesztő űrlapjához: mezők, címkék, súgó, kötelezőség, rövid változat, példa. */
function sablonok() {
  const alap = (id: string): unknown => {
    try {
      return (JSON.parse(readFileSync(join(REF, `tartalom-${id}.json`), "utf8")) as { mezok: unknown }).mezok;
    } catch {
      return {};
    }
  };
  return [...receptek.values()].map((r) => ({
    /** a sablon mintatartalma — az 1. körben a rajz nélküli mezők (járat, időtartomány, táblázat, sávok, azonosító sor) ebből jönnek */
    alap: alap(r.recept.azonosito),
    /** a képen az első és a második nyelv (a munkatér arculatából) */
    nyelvek: marka.lokal.nyelvek,
    azonosito: r.recept.azonosito,
    nev: r.recept.nev,
    leiras: (r.recept as Record<string, unknown>)["leiras"] ?? "",
    mezok: r.mezok.map((m) => ({
      azonosito: m.azonosito,
      cimke: m.cimke,
      blokk: m.blokk,
      tipus: m.tipus,
      kotelezo: m.kotelezo,
      nyelvpar: m.nyelvpar,
      rovid_megadhato: m.illesztes?.rovid_valtozat_megadhato === true,
      sugo: (m as Record<string, unknown>)["sugo"] ?? "",
      pelda: (m as Record<string, unknown>)["pelda"] ?? null,
      sorok: (m as Record<string, unknown>)["sorok"] ?? null,
      ertekkeszlet: (m as Record<string, unknown>)["ertekkeszlet"] ?? null,
    })),
  }));
}

/** A mintakép a recept példatartalmával — munkaterenként ugyanaz az 1. körben, ezért egyszer készül. */
const mintak = new Map<string, Buffer>();
/** receptenként a mintatartalmon kapott jelzések („szabály|mező”) — ezek az arculatból erednek */
const arculatiJelzesek = new Map<string, Set<string>>();
async function mintakep(receptId: string): Promise<Buffer | null> {
  const k = mintak.get(receptId);
  if (k) return k;
  const utvonal = join(REF, `tartalom-${receptId}.json`);
  let t: unknown;
  try {
    t = JSON.parse(readFileSync(utvonal, "utf8"));
  } catch {
    return null;
  }
  const r = await keszit(receptId, { mezok: (t as { mezok: unknown }).mezok, rovid: {} });
  if (!("kep" in r)) return null;
  arculatiJelzesek.set(receptId, new Set(r.jelzesek.map((j) => `${j.szabaly}|${j.mezo ?? ""}`)));
  const b = Buffer.from(r.kep, "base64");
  mintak.set(receptId, b);
  return b;
}

// ——— VZ-2: a hét helyzet képe (helyzet + méret + tartalom + a munkatér arculata) ———
/** VZ-3: a kis mintaképek lapja — ugyanaz a kirajzoló, kicsinyítve (1080 px → ~130 px) */
let kisLap: Page | null = null;
async function kisLapKell(): Promise<Page> {
  await lapKell();
  if (!kisLap || kisLap.isClosed()) {
    const ktx = await bongeszo!.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 0.12 });
    kisLap = await ktx.newPage();
  }
  return kisLap;
}

/** A kért változat, ha az adott képen megmarad; különben a Világos (VZ-3 ATADO). */
function valtozatValaszt(h: Helyzet, a: HelyzetArculat, kert: unknown): Valtozat {
  const lista = valtozatok(h, a);
  return lista.includes(kert as Valtozat) ? (kert as Valtozat) : "vilagos";
}

async function helyzetKep(nyers: { helyzet?: unknown; meret?: unknown; tartalom?: unknown; arculat?: unknown; nyelv?: unknown; valtozat?: unknown }, kepTipus: "png" | "jpeg" = "png") {
  const h = String(nyers.helyzet ?? "") as Helyzet;
  const m = String(nyers.meret ?? "poszt") as Meret;
  if (!HELYZETEK.includes(h) || !(m in MERETEK)) return { hiba: "ISMERETLEN_SABLON" as const };
  const nyelv = ["hu", "ro", "en"].includes(String(nyers.nyelv)) ? String(nyers.nyelv) : "hu";
  const a = HelyzetArculat.safeParse(nyers.arculat ?? {});
  const t = HelyzetTartalom.safeParse(nyers.tartalom ?? MINTA[nyelv]![h]);
  if (!a.success || !t.success)
    return { hiba: "ERVENYTELEN_TARTALOM" as const, reszlet: [...(a.error?.issues ?? []), ...(t.error?.issues ?? [])].map((i) => i.path.join(".") + ": " + i.message) };
  return sorban(async () => {
    const p = await lapKell();
    const { w, h: H } = MERETEK[m];
    await p.setViewportSize({ width: w, height: H });
    const mer = async (html: string) => {
      await p.setContent(html, { waitUntil: "load" });
      await p.evaluate(() => document.fonts.ready);
      return (await p.evaluate(HELYZET_MERO)) as HelyzetMeres;
    };
    const valtozat = valtozatValaszt(h, a.data, nyers.valtozat);
    const e = await helyzetIllesztes(h, m, t.data, a.data, { betuCim: munkaterBetu, nyelv, valtozat }, mer);
    // c15: a fotós minta JPEG-ben (a PNG egy fotóval ~1,3 MB volt, c14); minden más PNG, mint eddig
    const png = await p.screenshot({ clip: { x: 0, y: 0, width: w, height: H }, ...(kepTipus === "jpeg" ? { type: "jpeg" as const, quality: 85 } : { type: "png" as const }) });
    return { kep: png.toString("base64"), meret: m, valtozat, valtozatok: valtozatok(h, a.data), fok: e.fok, kisebbBetu: e.kisebbBetu, nemFer: e.nemFer, mezok: e.meres.mezok };
  });
}

/** VZ-3: a megmaradó színváltozatok kis mintaképe (ugyanaz a kép, a munkatárs szövegével, kicsiben). */
async function helyzetValtozatok(nyers: { helyzet?: unknown; meret?: unknown; tartalom?: unknown; arculat?: unknown; nyelv?: unknown }) {
  const h = String(nyers.helyzet ?? "") as Helyzet;
  const m = String(nyers.meret ?? "poszt") as Meret;
  if (!HELYZETEK.includes(h) || !(m in MERETEK)) return { hiba: "ISMERETLEN_SABLON" as const };
  const nyelv = ["hu", "ro", "en"].includes(String(nyers.nyelv)) ? String(nyers.nyelv) : "hu";
  const a = HelyzetArculat.safeParse(nyers.arculat ?? {});
  const t = HelyzetTartalom.safeParse(nyers.tartalom ?? MINTA[nyelv]![h]);
  if (!a.success || !t.success) return { hiba: "ERVENYTELEN_TARTALOM" as const };
  const lista = valtozatok(h, a.data);
  if (lista.length < 2) return { valtozatok: [] as { id: Valtozat; kep: string }[] };
  return sorban(async () => {
    const p = await kisLapKell();
    const { w, h: H } = MERETEK[m];
    await p.setViewportSize({ width: w, height: H });
    const mer = async (html: string) => {
      await p.setContent(html, { waitUntil: "load" });
      await p.evaluate(() => document.fonts.ready);
      return (await p.evaluate(HELYZET_MERO)) as HelyzetMeres;
    };
    const ki: { id: Valtozat; kep: string }[] = [];
    for (const v of lista) {
      await helyzetIllesztes(h, m, t.data, a.data, { betuCim: munkaterBetu, nyelv, valtozat: v }, mer);
      const png = await p.screenshot({ clip: { x: 0, y: 0, width: w, height: H }, type: "png" });
      ki.push({ id: v, kep: png.toString("base64") });
    }
    return { valtozatok: ki };
  });
}

/** A kártyák mintaképe munkaterenként (arculat + nyelv) — kis tár, a legrégebbi esik ki. */
type MintaKep = { kep: Buffer; tipus: "image/png" | "image/jpeg" };
const helyzetMintak = new Map<string, MintaKep>();
async function helyzetMinta(b: { helyzet?: unknown; arculat?: unknown; nyelv?: unknown; meret?: unknown; tartalom?: unknown; valtozat?: unknown; minta_kategoria?: unknown }): Promise<MintaKep | { hiba: string }> {
  // c15: a szakma (minta_kategoria) is a kulcs része — ugyanaz a szöveg más szakmával más fotót kap
  const kategoria = mintaKategoria(b.minta_kategoria);
  const kulcs = createHash("sha1").update(JSON.stringify([b.helyzet, b.meret ?? "poszt", b.arculat, b.nyelv, b.tartalom ?? null, b.valtozat ?? "vilagos", kategoria])).digest("hex");
  const k = helyzetMintak.get(kulcs);
  if (k) return k;
  // a tartalom: a munkatér példaszövege (a gép írta a cég szakmájából); hiányában az általános minta
  // c14 (2026-10-08): a „Kész munka” mintáján a fotóhelyen valódi példafotó (minta-foto.ts) — a kitöltő képe (/helyzet) változatlan
  const nyelv = ["hu", "ro", "en"].includes(String(b.nyelv)) ? String(b.nyelv) : "hu";
  // c15 (2026-10-08): a fotó a munkatér szakmájához illik (minta-foto.ts); ismeretlen szakma → a semleges fotó
  const nyers = b.tartalom ?? undefined;
  // R-15 c5 2. kör (a megrendelő 10-10 18:08): az „Újdonság” mintája is fotót kap — az alap a helyzet SAJÁT általános mintája
  const alapMinta = b.helyzet === "uj" ? MINTA[nyelv]?.["uj"] : MINTA[nyelv]?.["kesz"];
  const tartalom = mintaFotoval(b.helyzet, nyers, alapMinta, mintaFotoAdat(kategoria));
  const fotos = tartalom !== nyers;
  const r = await helyzetKep({ helyzet: b.helyzet, meret: b.meret ?? "poszt", arculat: b.arculat, nyelv: b.nyelv, tartalom, valtozat: b.valtozat }, fotos ? "jpeg" : "png");
  if (!("kep" in r)) return { hiba: r.hiba };
  const buf: MintaKep = { kep: Buffer.from(r.kep, "base64"), tipus: fotos ? "image/jpeg" : "image/png" };
  helyzetMintak.set(kulcs, buf);
  if (helyzetMintak.size > 300) helyzetMintak.delete(helyzetMintak.keys().next().value!);
  return buf;
}

// ——— R-16 K6 (TERV §2-K6, gepezet 13): a névlogó négy változata (SVG + PNG) ———
/** Az SVG → PNG a közös lapon, átlátszó háttérrel (omitBackground) — egyszerre egy munka, mint minden kép. */
async function svgPng(svg: string, w: number, h: number): Promise<Buffer> {
  const p = await lapKell();
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(pngLap(svg, w, h), { waitUntil: "load" });
  await p.evaluate(() => document.images[0]?.decode());
  return p.screenshot({ clip: { x: 0, y: 0, width: w, height: h }, type: "png", omitBackground: true });
}
/** Kis tár a kérés ujjlenyomatával: a 12g ugyanazt a három stílust többször kéri (a sáv, a képek, a mentés) — a legrégebbi esik ki. */
const nevlogoTar = new Map<string, Record<string, NevlogoKimenet>>();
async function nevlogo(nyers: unknown): Promise<{ valtozatok: Record<string, NevlogoKimenet> } | { hiba: "ERVENYTELEN_TARTALOM"; reszlet: string[] }> {
  const k = NevlogoKeres.safeParse(nyers);
  if (!k.success) return { hiba: "ERVENYTELEN_TARTALOM", reszlet: k.error.issues.map((i) => i.path.join(".") + ": " + i.message) };
  const kulcs = createHash("sha1").update(JSON.stringify(k.data)).digest("hex");
  const van = nevlogoTar.get(kulcs);
  if (van) return { valtozatok: van };
  const v = await sorban(() => nevlogoValtozatok(k.data, join(REF, "betuk-munkater"), svgPng));
  nevlogoTar.set(kulcs, v);
  if (nevlogoTar.size > 60) nevlogoTar.delete(nevlogoTar.keys().next().value!);
  return { valtozatok: v };
}

// ——— R-16 K7 (TERV §2-K7, §4 22., gepezet 10): a honlap SVG logója → PNG ———
/** Külön, HÁLÓZAT NÉLKÜLI környezet (offline): az idegen SVG semmit nem tölthet le, és a többi kép lapjától is elválik. */
let svgLapPeldany: Page | null = null;
async function svgLapKell(): Promise<Page> {
  await lapKell();
  if (!svgLapPeldany || svgLapPeldany.isClosed()) {
    const ktx = await bongeszo!.newContext({ viewport: { width: SVG_ALAP_NEZET, height: SVG_ALAP_NEZET }, offline: true });
    svgLapPeldany = await ktx.newPage();
  }
  return svgLapPeldany;
}
const SVG_ALAP_NEZET = 1200;
async function svgPngKeszit(nyers: unknown): Promise<Buffer | { hiba: "ERVENYTELEN_TARTALOM"; reszlet: string }> {
  const k = svgPngKeres(nyers);
  if ("hiba" in k) return k;
  return sorban(async () => {
    const p = await svgLapKell();
    await p.setViewportSize({ width: k.szelesseg, height: k.magassag });
    await p.setContent(svgPngLap(k.svg, k.szelesseg, k.magassag), { waitUntil: "load" });
    const rendben = await p.evaluate(async () => { const i = document.images[0]; if (!i) return false; try { await i.decode(); return i.naturalWidth > 0 || i.complete; } catch { return false; } });
    if (!rendben) return { hiba: "ERVENYTELEN_TARTALOM" as const, reszlet: "az SVG nem rajzolható" };
    return p.screenshot({ clip: { x: 0, y: 0, width: k.szelesseg, height: k.magassag }, type: "png", omitBackground: true });
  });
}

function json(res: ServerResponse, kod: number, adat: unknown) {
  res.writeHead(kod, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(adat));
}
async function torzs(req: IncomingMessage): Promise<unknown> {
  const reszek: Buffer[] = [];
  let hossz = 0;
  for await (const d of req) {
    hossz += (d as Buffer).length;
    // R-16 K2 (TERV §2-K2, §4 19.): 64 MB — két fotó, négy logó (≤ 2 MB) és két saját betű (≤ 10 MB, K5), mind base64-ben.
    // Csak átengedés: a kép a kért arculatból készül, a képgyártó semmit nem tárol belőle.
    if (hossz > 64 * 1024 * 1024) throw new Error("TUL_NAGY");
    reszek.push(d as Buffer);
  }
  return JSON.parse(Buffer.concat(reszek).toString("utf8") || "{}");
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://kepgyar");
  try {
    if (req.method === "GET" && url.pathname === "/eletjel") return json(res, 200, { ok: true, receptek: [...receptek.keys()], helyzetek: HELYZETEK });
    if (req.method === "GET" && url.pathname === "/sablonok") return json(res, 200, { sablonok: sablonok() });
    const mk = url.pathname.match(/^\/mintakep\/([a-z_]+)$/);
    if (req.method === "GET" && mk) {
      const b = await mintakep(mk[1]!);
      if (!b) return json(res, 404, { hiba: "NINCS_MINTAKEP" });
      res.writeHead(200, { "content-type": "image/png", "cache-control": "max-age=3600" });
      return res.end(b);
    }
    if (req.method === "POST" && url.pathname === "/helyzet") {
      const r = await helyzetKep((await torzs(req)) as Record<string, unknown>);
      return json(res, "hiba" in r ? 400 : 200, r);
    }
    if (req.method === "POST" && url.pathname === "/helyzet-valtozatok") {
      const r = await helyzetValtozatok((await torzs(req)) as Record<string, unknown>);
      return json(res, "hiba" in r ? 400 : 200, r);
    }
    if (req.method === "POST" && url.pathname === "/helyzet-minta") {
      const r = await helyzetMinta((await torzs(req)) as Record<string, unknown>);
      if ("hiba" in r) return json(res, 400, r);
      res.writeHead(200, { "content-type": r.tipus, "cache-control": "no-store" });
      return res.end(r.kep);
    }
    if (req.method === "POST" && url.pathname === "/nevlogo") {
      const r = await nevlogo(await torzs(req));
      return json(res, "hiba" in r ? 400 : 200, r);
    }
    if (req.method === "POST" && url.pathname === "/svg-png") {
      const r = await svgPngKeszit(await torzs(req));
      if (!Buffer.isBuffer(r)) return json(res, 400, r);
      res.writeHead(200, { "content-type": "image/png", "cache-control": "no-store" });
      return res.end(r);
    }
    if (req.method === "POST" && url.pathname === "/keszit") {
      const b = (await torzs(req)) as { sablon?: string; tartalom?: unknown };
      const r = await keszit(String(b.sablon ?? ""), b.tartalom ?? {});
      return json(res, "hiba" in r ? 400 : 200, r);
    }
    json(res, 404, { hiba: "NINCS_ILYEN" });
  } catch (e) {
    json(res, 500, { hiba: "KEPGYAR_HIBA", reszlet: e instanceof Error ? e.message : String(e) });
  }
}).listen(PORT, async () => {
  console.log(`képgyártó: ${PORT}, receptek: ${[...receptek.keys()].join(", ")}`);
  // induláskor elkészülnek a mintaképek — ezekből tudjuk, mely jelzések jönnek az arculatból
  for (const r of receptek.keys()) await mintakep(r).catch((e) => console.error("mintakép", r, e));
  console.log("mintaképek készen");
});
